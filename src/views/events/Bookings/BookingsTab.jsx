import dayjs from 'dayjs';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input, Button, Spin, DatePicker, Space, Pagination, Typography, Row, Col } from 'antd';
import { SearchOutlined, CloseOutlined, ReloadOutlined, LoadingOutlined } from '@ant-design/icons';
import BookingCard from './BookingCard';
import { ROW_GUTTER } from 'constants/ThemeConstant';


// Constants
const DEBOUNCE_DELAY = 300;
const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text } = Typography;

const BookingsTab = ({
  userBookings = [],
  loading = false,
  isFetching = false,
  onRefresh,
  showAction = true,
  isBoxOffice = false,
  serverSide = false,
  total = 0,
  page,
  perPage,
  onParamsChange,
  // Infinite scroll props
  infiniteScroll = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  onSearchChange,
  onDateRangeChange: onDateRangeChangeProp,
}) => {
  // UI & data state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Pagination state (only used for client-side mode)
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [pageSize, setPageSize] = useState(perPage || DEFAULT_PAGE_SIZE);

  const debounceTimeoutRef = useRef(null);
  const isFirstRun = useRef(true);

  // In server-side mode, use props directly (like DataTable pattern)
  // This avoids state sync issues that cause page to reset
  const effectivePage = serverSide ? (page || 1) : currentPage;
  const effectivePageSize = serverSide ? (perPage || DEFAULT_PAGE_SIZE) : pageSize;

  // Normalize bookings
  const normalizedBookings = useMemo(() => {
    return Array.isArray(userBookings) ? userBookings : [];
  }, [userBookings]);

  // Helper: convert various date strings to a Date or null
  const toDate = useCallback((raw) => {
    if (!raw) return null;
    if (raw instanceof Date) {
      return Number.isNaN(raw.getTime()) ? null : raw;
    }
    let s = String(raw).trim();

    // "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(/\s+/, 'T');
    }

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }, []);

  // Returns an array of Date objects found for a booking item (top-level and children)
  const getAllBookingDates = useCallback(
    (item) => {
      const dates = [];

      // top-level candidate fields
      const topCandidates = [
        item?.dates,
        item?.booking_date,
        item?.created_at,
        item?.date,
        item?.event_date,
      ];
      for (const c of topCandidates) {
        const d = toDate(c);
        if (d) dates.push(d);
      }

      // child bookings[] entries (MasterBooking style)
      if (Array.isArray(item?.bookings) && item.bookings.length > 0) {
        for (const b of item.bookings) {
          const childCandidates = [b?.dates, b?.created_at, b?.booking_date, b?.date];
          for (const c of childCandidates) {
            const d = toDate(c);
            if (d) dates.push(d);
          }
        }
      }

      return dates;
    },
    [toDate]
  );

  // Returns searchable strings for an item: checks top-level and child bookings[]
  const getSearchableText = useCallback((item) => {
    const pushAndLower = (v) => String(v ?? '').toLowerCase();

    // top-level values
    const eventNameTop = item?.ticket?.event?.name ?? item?.ticket?.event?.title ?? '';
    const userNameTop = item?.name ?? item?.user?.name ?? '';
    const userNumberTop = item?.number ?? item?.user?.number ?? item?.user?.phone ?? '';
    const ticketNameTop = item?.ticket?.name ?? '';
    const turfNameTop = item?.turfName ?? item?.turf?.name ?? '';
    // const cityTop = item?.city ?? item?.location?.city ?? '';
    const cityTop = typeof item?.city === 'string' ? item.city : item?.location?.city ?? '';
    const paymentMethodTop = item?.payment_method ?? item?.payment?.method ?? '';

    // aggregate child bookings values (if present)
    let eventNameChildren = '';
    let userNameChildren = '';
    let userNumberChildren = '';
    let ticketNameChildren = '';
    let turfNameChildren = '';
    let cityChildren = '';
    let paymentMethodChildren = '';

    if (Array.isArray(item?.bookings)) {
      for (const b of item.bookings) {
        eventNameChildren += ' ' + (b?.ticket?.event?.name ?? b?.ticket?.event?.title ?? '');
        userNameChildren += ' ' + (b?.name ?? b?.user?.name ?? '');
        userNumberChildren += ' ' + (b?.number ?? b?.user?.number ?? b?.user?.phone ?? '');
        ticketNameChildren += ' ' + (b?.ticket?.name ?? '');
        turfNameChildren += ' ' + (b?.turfName ?? b?.turf?.name ?? '');
        cityChildren += ' ' + (typeof b?.city === 'string' ? b.city : b?.location?.city ?? '');
        paymentMethodChildren += ' ' + (b?.payment_method ?? b?.payment?.method ?? '');
      }
    }

    return {
      eventName: pushAndLower(eventNameTop + ' ' + eventNameChildren),
      userName: pushAndLower(userNameTop + ' ' + userNameChildren),
      userNumber: String(userNumberTop) + ' ' + String(userNumberChildren),
      ticketName: pushAndLower(ticketNameTop + ' ' + ticketNameChildren),
      turfName: pushAndLower(turfNameTop + ' ' + turfNameChildren),
      city: pushAndLower(cityTop + ' ' + cityChildren),
      paymentMethod: pushAndLower(paymentMethodTop + ' ' + paymentMethodChildren),
    };
  }, []);

  // Filtering function (handles top-level and child bookings)
  const filterBookings = useCallback(
    (term, dates) => {
      if (serverSide) return normalizedBookings; // Skip client-side filtering if serverSide

      if (!Array.isArray(normalizedBookings) || normalizedBookings.length === 0) return [];

      // If no filters, return all bookings
      if (!term?.trim() && (!Array.isArray(dates) || dates.length !== 2)) {
        return normalizedBookings;
      }

      let filtered = normalizedBookings;

      // Search term filter
      if (term?.trim()) {
        const searchValue = term.toLowerCase();
        filtered = filtered.filter((item) => {
          const s = getSearchableText(item);
          return (
            s.eventName.includes(searchValue) ||
            s.userName.includes(searchValue) ||
            String(s.userNumber).includes(searchValue) ||
            s.ticketName.includes(searchValue) ||
            s.turfName.includes(searchValue) ||
            s.city.includes(searchValue) ||
            s.paymentMethod.includes(searchValue)
          );
        });
      }

      // Date range filter - keep item if ANY of its candidate dates falls in range
      if (Array.isArray(dates) && dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter((item) => {
          const candDates = getAllBookingDates(item);
          if (!candDates || candDates.length === 0) return false;
          return candDates.some((bd) => bd >= startDate && bd <= endDate);
        });
      }

      return filtered;
    },
    [normalizedBookings, getSearchableText, getAllBookingDates, serverSide]
  );

  // Infinite scroll: IntersectionObserver sentinel
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!infiniteScroll || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !loading) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [infiniteScroll, fetchNextPage, hasNextPage, isFetchingNextPage, loading]);

  // Debounce search term
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Prevent immediate trigger on mount if term is empty
    if (isFirstRun.current && !searchTerm) {
      isFirstRun.current = false;
      return;
    }
    isFirstRun.current = false;

    setIsFiltering(true);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsFiltering(false);

      if (infiniteScroll && onSearchChange) {
        // Infinite scroll mode: notify parent to reset query
        onSearchChange(searchTerm);
      } else if (serverSide && onParamsChange) {
        // Pagination server-side mode
        onParamsChange({
          page: 1,
          per_page: effectivePageSize,
          search: searchTerm,
          start_date: dateRange[0] || null,
          end_date: dateRange[1] || null
        });
      }

    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handle date range changes for server side
  useEffect(() => {
    if (serverSide && onParamsChange && !isFiltering) { // !isFiltering check to avoid double fire with search effect if used together usually handled separately
      // However, date range state updates are immediate, so we can trigger here
      // But need to ensure we don't trigger on initial mount if empty
      // We can rely on user interaction calling handleDateRangeChange which sets state
      // This effect might be redundant if we handle it in handleDateRangeChange or a combined effect
    }
  }, [dateRange]);


  // Memoized filtered bookings - only re-filter when debounced search or date changes
  const filteredBookings = useMemo(() => filterBookings(debouncedSearchTerm, dateRange), [
    filterBookings,
    debouncedSearchTerm,
    dateRange,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  // Create a stable key for a booking
  const makeBookingKey = useCallback((booking, idx) => {
    const idPart =
      booking?.id ??
      booking?.reference ??
      booking?.booking_reference ??
      booking?.bookingId ??
      booking?.order_id ??
      '';
    let timePart = '';
    const rawTime = booking?.created_at ?? booking?.booking_date ?? booking?.date ?? booking?.event_date;
    const t = toDate(rawTime);
    if (t) timePart = String(t.getTime());

    return `${idPart || 'no-id'}-${timePart || 'no-time'}-${idx}`;
  }, [toDate]);

  // Deduplicate filteredBookings
  const uniqueFilteredBookings = useMemo(() => {
    if (serverSide) return normalizedBookings;

    const seen = new Set();
    const out = [];
    for (let i = 0; i < filteredBookings.length; i++) {
      const b = filteredBookings[i];
      const dedupeKey =
        (b?.id ?? b?.reference ?? b?.booking_reference ?? b?.bookingId ?? b?.order_id) || JSON.stringify(b);
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        out.push(b);
      }
    }
    return out;
  }, [filteredBookings, serverSide, normalizedBookings]);

  // Paginate the filtered bookings
  const paginatedBookings = useMemo(() => {
    if (serverSide) return uniqueFilteredBookings; // Server already returns paginated data

    const startIndex = (effectivePage - 1) * effectivePageSize;
    const endIndex = startIndex + effectivePageSize;
    return uniqueFilteredBookings.slice(startIndex, endIndex);
  }, [uniqueFilteredBookings, effectivePage, effectivePageSize, serverSide]);

  // Reset to page 1 when filters change (Client Side only)
  useEffect(() => {
    if (!serverSide) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, dateRange, serverSide]);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((dates, dateStrings) => {
    let newDateRange = [];
    if (dates && dates.length === 2 && dateStrings && dateStrings.length === 2) {
      newDateRange = dateStrings;
    }
    setDateRange(newDateRange);

    if (infiniteScroll && onDateRangeChangeProp) {
      // Infinite scroll mode: notify parent to reset query
      onDateRangeChangeProp({
        startDate: newDateRange[0] || null,
        endDate: newDateRange[1] || null
      });
    } else if (serverSide && onParamsChange) {
      onParamsChange({
        page: 1,
        per_page: effectivePageSize,
        search: searchTerm,
        start_date: newDateRange[0] || null,
        end_date: newDateRange[1] || null
      });
    } else {
      setCurrentPage(1);
    }
  }, [infiniteScroll, onDateRangeChangeProp, serverSide, onParamsChange, effectivePageSize, searchTerm]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange([]);

    if (infiniteScroll) {
      onSearchChange?.('');
      onDateRangeChangeProp?.({ startDate: null, endDate: null });
    } else if (serverSide && onParamsChange) {
      onParamsChange({
        page: 1,
        per_page: effectivePageSize,
        search: '',
        start_date: null,
        end_date: null
      });
    } else {
      setCurrentPage(1);
    }
  }, [infiniteScroll, onSearchChange, onDateRangeChangeProp, serverSide, onParamsChange, effectivePageSize]);

  const handlePageChange = useCallback((newPage, newPageSize) => {
    if (serverSide && onParamsChange) {
      // Server-side: only notify parent, parent owns the state (like DataTable)
      onParamsChange({
        page: newPage,
        per_page: newPageSize || effectivePageSize,
        search: searchTerm,
        start_date: dateRange[0] || null,
        end_date: dateRange[1] || null
      });
    } else {
      // Client-side: manage internal state
      setCurrentPage(newPage);
      if (newPageSize && newPageSize !== pageSize) {
        setPageSize(newPageSize);
      }
    }
  }, [effectivePageSize, pageSize, serverSide, onParamsChange, searchTerm, dateRange]);

  // Memoize states
  const isLoading = loading || isFiltering;
  const hasActiveFilters = searchTerm || dateRange.length > 0;

  // Display stats
  const displayTotal = serverSide ? total : uniqueFilteredBookings.length;

  // For infinite scroll, display all bookings (already accumulated by useInfiniteQuery)
  // For pagination modes, use paginatedBookings
  const displayBookings = infiniteScroll ? normalizedBookings : paginatedBookings;

  // Booking cards render
  const bookingCards = useMemo(() => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center py-4">
          <Spin size="large" tip="Loading bookings..." />
        </div>
      );
    }

    if (displayBookings.length === 0) {
      if (serverSide && isFetching) {
        return (
          <div className="d-flex justify-content-center align-items-center py-4">
            <Spin size="large" tip="Loading bookings..." />
          </div>
        );
      }
      return (
        <div className="text-center py-5">
          <Text type="secondary">
            {hasActiveFilters ? 'No bookings match your filters.' : 'No bookings found.'}
          </Text>
        </div>
      );
    }

    return (
      <Row gutter={ROW_GUTTER}>
        {displayBookings.map((booking, idx) => (
          <Col
            key={makeBookingKey(booking, idx)}
            xs={24}   // Mobile → 1 column (24/24)
            sm={24}   // Small devices → 1 column
            md={12}   // Tablet → 2 columns (24/2 = 12 each)
            lg={12}    // Large → 3 columns (24/3 = 8 each)
            xl={8}    // Extra large → 3 columns
          >
            <BookingCard
              booking={booking}
              showAction={showAction}
              isBoxOffice={isBoxOffice}
            />
          </Col>
        ))}
      </Row>
    );
  }, [displayBookings, isLoading, isFetching, serverSide, hasActiveFilters, makeBookingKey, showAction, isBoxOffice]);

  return (
    <>
      <div className="mb-3">
        {/* Filters */}
        <Row gutter={ROW_GUTTER} className='justify-content-start'>
          <Col xs={24} md={6}>
            <Search
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearchChange}
              allowClear
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} md={6}>
            <RangePicker
              value={
                dateRange.length === 2 && dateRange[0] && dateRange[1]
                  ? [dayjs(dateRange[0], 'YYYY-MM-DD'), dayjs(dateRange[1], 'YYYY-MM-DD')]
                  : null
              }
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
              style={{ width: '100%' }}
            />
          </Col>
          {hasActiveFilters && (
            <Col xs={24} sm={12} md={6} lg={4}>
              <Button
                icon={<CloseOutlined />}
                onClick={handleClearFilters}
                block
              >
                Clear Filters
              </Button>
            </Col>
          )}
          <Col xs={24} md={1}>
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            />
          </Col>
        </Row>
      </div>

      {bookingCards}

      {/* Infinite scroll: sentinel + load more */}
      {infiniteScroll && (
        <>
          {/* Sentinel element observed by IntersectionObserver */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {isFetchingNextPage && (
            <div className="d-flex justify-content-center align-items-center py-3">
              <Spin indicator={<LoadingOutlined spin />} />
              <Text type="secondary" className="ml-2" style={{ marginLeft: 8 }}>Loading more bookings...</Text>
            </div>
          )}

          {!hasNextPage && normalizedBookings.length > 0 && !loading && (
            <div className="text-center py-3">
              <Text type="secondary">All bookings loaded ({total})</Text>
            </div>
          )}
        </>
      )}

      {/* Pagination (only for non-infinite scroll modes) */}
      {!infiniteScroll && (displayTotal > 0) && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            current={effectivePage}
            pageSize={effectivePageSize}
            total={displayTotal}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            disabled={isLoading}
            responsive
            simple={window.innerWidth < 576}
          />
        </div>
      )}
    </>
  );
};

export default BookingsTab;
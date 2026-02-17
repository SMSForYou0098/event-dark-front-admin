import dayjs from 'dayjs';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input, Button, Spin, DatePicker, Space, Pagination, Typography, Row, Col } from 'antd';
import { SearchOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import BookingCard from './BookingCard';
import { ROW_GUTTER } from 'constants/ThemeConstant';


// Constants
const DEBOUNCE_DELAY = 300;
const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text } = Typography;

const BookingsTab = ({ userBookings = [], loading = false, onRefresh, showAction = true, isBoxOffice = false }) => {
  // UI & data state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const debounceTimeoutRef = useRef(null);

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
    const cityTop = item?.city ?? item?.location?.city ?? '';
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
        cityChildren += ' ' + (b?.city ?? b?.location?.city ?? '');
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
    [normalizedBookings, getSearchableText, getAllBookingDates]
  );

  // Debounce search term
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsFiltering(true);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsFiltering(false);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

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
  }, [filteredBookings]);

  // Paginate the filtered bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return uniqueFilteredBookings.slice(startIndex, endIndex);
  }, [uniqueFilteredBookings, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, dateRange]);

  // Handlers
  const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), []);

  const handleDateRangeChange = useCallback((dates, dateStrings) => {
    // Only set date range if we have valid dates
    if (dates && dates.length === 2 && dateStrings && dateStrings.length === 2) {
      setDateRange(dateStrings);
    } else {
      setDateRange([]);
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange([]);
  }, []);

  const handlePageChange = useCallback((page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  }, [pageSize]);

  // Memoize states
  const isLoading = loading || isFiltering;
  const hasActiveFilters = searchTerm || dateRange.length > 0;

  // Booking cards render
  const bookingCards = useMemo(() => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center py-4">
          <Spin size="large" tip="Loading bookings..." />
        </div>
      );
    }

    if (paginatedBookings.length === 0) {
      return (
        <div className="text-center py-5">
          <Text type="secondary">
            {hasActiveFilters ? 'No bookings match your filters.' : 'No bookings found.'}
          </Text>
        </div>
      );
    }

    return (
      <Space direction="vertical" size="middle" className="w-100">
        {paginatedBookings.map((booking, idx) => (
          <BookingCard key={makeBookingKey(booking, idx)} booking={booking} showAction={showAction} isBoxOffice={isBoxOffice} />
        ))}
      </Space>
    );
  }, [paginatedBookings, isLoading, hasActiveFilters, makeBookingKey]);

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

      {/* Pagination */}
      {uniqueFilteredBookings.length > 0 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={uniqueFilteredBookings.length}
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
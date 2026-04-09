import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Typography, Card, message, Table, Spin } from 'antd';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import StatSection from 'views/events/Dashboard/components/StatSection';
import { useOrganizerEvents } from 'views/events/Settings/hooks/useBanners';
import DataTable from 'views/events/common/DataTable';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';
import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';
import TicketScanReport from './TicketScanReport';
import ScannerReportCardToolbar from './ScannerReportCardToolbar';
// import OrgUserDetailedReport from './OrgUserDetailedReport';

const { Text } = Typography;

const DEFAULT_PER_PAGE = 5;
const clampPerPage = (n) => Math.min(100, Math.max(1, Number(n) || DEFAULT_PER_PAGE));

/** Cached per scanner + event; avoids refetch when re-expanding (see staleTime in useQueries). */
const scannerDailyQueryKey = (userIdStr, selectedEventId) => [
  'scannerDailyScans',
  String(userIdStr),
  selectedEventId ?? null,
];

/** GET scanner/{scannerId}/last-7-days-scans — optional event_id; backend returns last 7 days. */
const buildScannerLast7DaysScansUrl = (scannerId, { eventId } = {}) => {
  const params = new URLSearchParams();
  if (eventId != null && eventId !== '') params.set('event_id', String(eventId));
  const path = `scanner/${encodeURIComponent(String(scannerId))}/last-7-days-scans`;
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
};

/** API may return list fields as an array or as an object; Table requires an array. */
const asScanTableRows = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
};

const normalizeScannerDailyBody = (body) => {
  const raw =
    body?.data ??
    body?.daily_scans ??
    body?.last_7_days ??
    body?.statistics?.daily_scans ??
    body?.statistics?.last_7_days;
  const list = asScanTableRows(raw);
  return list
    .map((row, i) => {
      const date = row.date ?? row.day ?? row.scan_date ?? row.label;
      const scans = Number(row.scans ?? row.count ?? row.scan_count ?? row.total ?? 0);
      return {
        key: String(date ?? i),
        date: date ?? '—',
        scans,
      };
    })
    .filter((r) => r.date != null && String(r.date).length > 0);
};

const SCANNER_DAILY_INNER_COLUMNS = [
  { title: 'Date', dataIndex: 'date', key: 'date', width: 140 },
  {
    title: 'Scans',
    dataIndex: 'scans',
    key: 'scans',
    align: 'right',
    width: 100,
    render: (n) => Number(n ?? 0).toLocaleString(),
  },
];

const pickPagination = ({ laravel, metaObj, flat, fallback }) => {
  // statistics.checkpoints / statistics.scanners: { data, pagination: { current_page, per_page, total, last_page } }
  if (
    laravel &&
    typeof laravel === 'object' &&
    Array.isArray(laravel.data) &&
    laravel.pagination &&
    laravel.pagination.total != null
  ) {
    const p = laravel.pagination;
    const perPage = Number(p.per_page) || fallback.perPage;
    const total = Number(p.total) || 0;
    return {
      current_page: Number(p.current_page) || fallback.page,
      per_page: perPage,
      total,
      last_page:
        Number(p.last_page) ||
        Math.max(1, Math.ceil(total / perPage) || 1),
    };
  }
  if (
    laravel &&
    typeof laravel === 'object' &&
    Array.isArray(laravel.data) &&
    laravel.total != null
  ) {
    const perPage = Number(laravel.per_page) || fallback.perPage;
    const total = Number(laravel.total) || 0;
    return {
      current_page: Number(laravel.current_page) || fallback.page,
      per_page: perPage,
      total,
      last_page:
        Number(laravel.last_page) ||
        Math.max(1, Math.ceil(total / perPage) || 1),
    };
  }
  if (metaObj && typeof metaObj === 'object' && metaObj.total != null) {
    const perPage = Number(metaObj.per_page) || fallback.perPage;
    const total = Number(metaObj.total) || 0;
    return {
      current_page: Number(metaObj.current_page) || fallback.page,
      per_page: perPage,
      total,
      last_page:
        Number(metaObj.last_page) ||
        Math.max(1, Math.ceil(total / perPage) || 1),
    };
  }
  if (flat?.total != null && flat.total !== '') {
    const perPage = Number(flat.per_page) || fallback.perPage;
    const total = Number(flat.total) || 0;
    return {
      current_page: Number(flat.current_page) || fallback.page,
      per_page: perPage,
      total,
      last_page:
        Number(flat.last_page) ||
        Math.max(1, Math.ceil(total / perPage) || 1),
    };
  }
  return {
    current_page: fallback.page,
    per_page: fallback.perPage,
    total: fallback.rowCount,
    last_page: 1,
  };
};

/**
 * Normalizes scan-statistics API body. Supports:
 * - statistics.checkpoints / statistics.scanners: { data, pagination }
 * - Root-level checkpoints / scanners (same shapes)
 * - Legacy: scans_by_checkpoint array, flat pagination fields, etc.
 */
const normalizeScanStatisticsResponse = (body, req) => {
  const stats = body?.statistics ?? body?.data?.statistics ?? {};

  const checkpointBlock =
    stats.checkpoints ?? body?.checkpoints;
  const scannerBlock = stats.scanners ?? body?.scanners;

  const checkpointRows = asScanTableRows(
    checkpointBlock?.data ??
    (Array.isArray(checkpointBlock) ? checkpointBlock : null) ??
    stats.scans_by_checkpoint
  );
  const scannerRows = asScanTableRows(
    scannerBlock?.data ?? (Array.isArray(scannerBlock) ? scannerBlock : null)
  );

  const checkpointPagination = pickPagination({
    laravel: checkpointBlock,
    metaObj: body?.checkpoint_pagination ?? stats.checkpoint_pagination,
    flat: {
      total: stats.checkpoint_total,
      current_page: stats.checkpoint_current_page,
      per_page: stats.checkpoint_per_page,
      last_page: stats.checkpoint_last_page,
    },
    fallback: {
      page: req.checkpointPage,
      perPage: req.checkpointPerPage,
      rowCount: checkpointRows.length,
    },
  });

  const scannerPagination = pickPagination({
    laravel: scannerBlock,
    metaObj: body?.scanner_pagination ?? stats.scanner_pagination,
    flat: {
      total: stats.scanner_total,
      current_page: stats.scanner_current_page,
      per_page: stats.scanner_per_page,
      last_page: stats.scanner_last_page,
    },
    fallback: {
      page: req.scannerPage,
      perPage: req.scannerPerPage,
      rowCount: scannerRows.length,
    },
  });

  return {
    statistics: stats,
    checkpointRows,
    scannerRows,
    checkpointPagination,
    scannerPagination,
  };
};

const ScannerReport = () => {
  const { isMobile, UserData, UserPermissions } = useMyContext();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const [checkpointPage, setCheckpointPage] = useState(1);
  const [checkpointPerPage, setCheckpointPerPage] = useState(DEFAULT_PER_PAGE);
  const [scannerPage, setScannerPage] = useState(1);
  const [scannerPerPage, setScannerPerPage] = useState(DEFAULT_PER_PAGE);
  const [checkpointSearch, setCheckpointSearch] = useState('');
  const [scannerSearch, setScannerSearch] = useState('');
  const [expandedScannerKeys, setExpandedScannerKeys] = useState([]);

  const rangeSignature = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return '';
    return `${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}`;
  }, [dateRange]);

  useEffect(() => {
    setCheckpointPage(1);
    setScannerPage(1);
    setCheckpointSearch('');
    setScannerSearch('');
    setExpandedScannerKeys([]);
  }, [selectedEventId, rangeSignature]);

  useEffect(() => {
    setExpandedScannerKeys([]);
  }, [scannerPage, scannerPerPage, scannerSearch]);

  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
    UserData?.id,
    UserData?.role
  );

  const scanQueryKey = useMemo(
    () =>
      [
        'scanStatistics',
        selectedEventId,
        rangeSignature,
        checkpointPage,
        checkpointPerPage,
        checkpointSearch,
        scannerPage,
        scannerPerPage,
        scannerSearch,
      ],
    [
      selectedEventId,
      rangeSignature,
      checkpointPage,
      checkpointPerPage,
      checkpointSearch,
      scannerPage,
      scannerPerPage,
      scannerSearch,
    ]
  );

  const { data: scanData, isPending, isFetching } = useQuery({
    queryKey: scanQueryKey,
    /** Keep rows visible when only page/search/size changes; clear when event or date range changes. */
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery?.queryKey) return previousData;
      const prev = previousQuery.queryKey;
      const sameFilters = prev[1] === selectedEventId && prev[2] === rangeSignature;
      return sameFilters ? previousData : undefined;
    },
    queryFn: async () => {
      const params = new URLSearchParams();

      if (selectedEventId) {
        params.append('event_id', String(selectedEventId));
      }
      if (dateRange?.[0] && dateRange?.[1]) {
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
      }

      // Short keys (backend also accepts long: checkpoint_page, checkpoint_per_page, …)
      params.append('c_page', String(checkpointPage));
      params.append('c_per_page', String(clampPerPage(checkpointPerPage)));
      params.append('s_page', String(scannerPage));
      params.append('s_per_page', String(clampPerPage(scannerPerPage)));

      const cpQ = String(checkpointSearch ?? '').trim();
      if (cpQ) params.append('c_search', cpQ);
      const scQ = String(scannerSearch ?? '').trim();
      if (scQ) params.append('s_search', scQ);

      const url = `scan-statistics?${params.toString()}`;
      const body = await api.get(url);
      return normalizeScanStatisticsResponse(body, {
        checkpointPage,
        checkpointPerPage: clampPerPage(checkpointPerPage),
        scannerPage,
        scannerPerPage: clampPerPage(scannerPerPage),
      });
    },
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
    onError: (err) => message.error(Utils.getErrorMessage(err)),
  });

  /** Full overlay only on first load; pagination/search keep previous rows (placeholderData). */
  const tablesBlockingLoad = !scanData && (isPending || isFetching);

  const stats = scanData?.statistics || {};
  const checkpointRows = scanData?.checkpointRows ?? [];
  const scannerRows = scanData?.scannerRows ?? [];
  const checkpointPagination = scanData?.checkpointPagination ?? {
    current_page: checkpointPage,
    per_page: clampPerPage(checkpointPerPage),
    total: 0,
    last_page: 1,
  };
  const scannerPagination = scanData?.scannerPagination ?? {
    current_page: scannerPage,
    per_page: clampPerPage(scannerPerPage),
    total: 0,
    last_page: 1,
  };

  const onCheckpointPagination = useCallback((page, pageSize) => {
    const nextSize = clampPerPage(pageSize);
    if (nextSize !== checkpointPerPage) {
      setCheckpointPerPage(nextSize);
      setCheckpointPage(1);
    } else {
      setCheckpointPage(page);
    }
  }, [checkpointPerPage]);

  const onScannerPagination = useCallback((page, pageSize) => {
    const nextSize = clampPerPage(pageSize);
    if (nextSize !== scannerPerPage) {
      setScannerPerPage(nextSize);
      setScannerPage(1);
    } else {
      setScannerPage(page);
    }
  }, [scannerPerPage]);

  const onCheckpointSearch = useCallback((value) => {
    setCheckpointSearch(value ?? '');
    setCheckpointPage(1);
  }, []);

  const onScannerSearch = useCallback((value) => {
    setScannerSearch(value ?? '');
    setScannerPage(1);
  }, []);

  const fetchScannerDailyScansRequest = useCallback(
    async (scannerUserId) => {
      const url = buildScannerLast7DaysScansUrl(scannerUserId, {
        eventId: selectedEventId,
      });
      const body = await api.get(url);
      return normalizeScannerDailyBody(body);
    },
    [selectedEventId]
  );

  const scannerDailyQueries = useQueries({
    queries: expandedScannerKeys.map((userIdStr) => ({
      queryKey: scannerDailyQueryKey(userIdStr, selectedEventId),
      queryFn: () => fetchScannerDailyScansRequest(Number(userIdStr)),
      enabled: Boolean(userIdStr) && !Number.isNaN(Number(userIdStr)),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (err) => message.error(Utils.getErrorMessage(err)),
    })),
  });

  const scannerDailyQueryByUserId = useMemo(() => {
    const m = {};
    expandedScannerKeys.forEach((id, i) => {
      m[id] = scannerDailyQueries[i];
    });
    return m;
  }, [expandedScannerKeys, scannerDailyQueries]);

  const scannerTableProps = useMemo(
    () => ({
      rowKey: (r) => String(r.user_id ?? r.user_email ?? ''),
      size: 'small',
      scroll: { x: 'max-content' },
      expandable: {
        expandedRowKeys: expandedScannerKeys,
        onExpandedRowsChange: (keys) => setExpandedScannerKeys(keys.map(String)),
        expandedRowRender: (record) => {
          const id = String(record.user_id);
          const q = scannerDailyQueryByUserId[id];
          if (!q || (q.isPending && !q.data)) {
            return (
              <div className="py-3 px-2">
                <Spin size="small" />
              </div>
            );
          }
          if (q.isError) {
            return (
              <div className="py-2 px-2">
                <Text type="danger">Could not load daily scans.</Text>
              </div>
            );
          }
          const rows = q.data ?? [];
          if (!rows.length) {
            return (
              <div className="py-2 px-2">
                <Text type="secondary">No daily scan data for the last 7 days.</Text>
              </div>
            );
          }
          return (
            <div>
              <Table
                size="small"
                pagination={false}
                columns={SCANNER_DAILY_INNER_COLUMNS}
                dataSource={rows}
              />
            </div>
          );
        },
      },
    }),
    [expandedScannerKeys, scannerDailyQueryByUserId]
  );

  const statsData = [
    { title: 'Total Scans', value: Number(stats.total_scans || 0), hideCurrency: true },
    { title: 'Today', value: Number(stats.today_scans || 0), hideCurrency: true },
    { title: 'Yesterday', value: Number(stats.yesterday_scans || 0), hideCurrency: true },
  ];

  const bookingTypeStats = stats.scans_by_booking_type
    ? Object.entries(stats.scans_by_booking_type).map(([type, count]) => ({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: Number(count),
      hideCurrency: true,
    }))
    : [];

  const checkpointColumns = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        align: 'center',
        width: 50,
        render: (_, __, index) =>
          (checkpointPage - 1) * clampPerPage(checkpointPerPage) + index + 1,
      },
      {
        title: 'Checkpoint',
        dataIndex: 'checkpoint_label',
        key: 'checkpoint_label',
        align: 'left',
        render: (label) => (
          <div>
            <Text strong>{label}</Text>
          </div>
        ),
      },
      {
        title: 'Scans',
        dataIndex: 'count',
        key: 'count',
        align: 'center',
        width: 80,
        render: (count) => <Text strong>{count}</Text>,
      },
    ],
    [checkpointPage, checkpointPerPage]
  );

  const scannerColumns = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        align: 'center',
        width: 50,
        render: (_, __, index) =>
          (scannerPage - 1) * clampPerPage(scannerPerPage) + index + 1,
      },
      {
        title: 'Name',
        dataIndex: 'user_name',
        key: 'user_name',
        align: 'left',
        ellipsis: true,
        render: (name) => <Text strong>{name ?? '—'}</Text>,
      },
      {
        title: 'Email',
        dataIndex: 'user_email',
        key: 'user_email',
        align: 'left',
        ellipsis: true,
        render: (email) => (email ? <Text type="secondary">{email}</Text> : '—'),
      },
      {
        title: 'Total scans',
        dataIndex: 'total_scans',
        key: 'total_scans',
        align: 'right',
        width: 110,
        render: (n) => <Text strong>{Number(n ?? 0).toLocaleString()}</Text>,
      },
      {
        title: 'Today',
        dataIndex: 'today_scans',
        key: 'today_scans',
        align: 'right',
        width: 90,
        render: (n) => <Text strong>{Number(n ?? 0).toLocaleString()}</Text>,
      },
    ],
    [scannerPage, scannerPerPage]
  );

  return (
    <PermissionChecker permission={PERMISSIONS.VIEW_SCAN_REPORTS}>
      <div>
        <Card
          title="Scan Report"
          extra={
            <ScannerReportCardToolbar
              events={events}
              eventsLoading={eventsLoading}
              selectedEventId={selectedEventId}
              onSelectedEventIdChange={setSelectedEventId}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              checkpointSearch={checkpointSearch}
              scannerSearch={scannerSearch}
              exportEnabled={
                UserData?.role === 'Admin' ||
                UserPermissions?.includes(PERMISSIONS.EXPORT_SCAN_REPORTS) ||
                UserPermissions?.includes(PERMISSIONS.VIEW_SCAN_REPORTS)
              }
            />
          }
          size="small"
          className='mb-0'
        />
        <Row gutter={[16, 16]}>
          <StatSection
            stats={[...statsData, ...bookingTypeStats]}
            colConfig={{ xs: 12, sm: 8, md: 6, lg: 4 }}
            isMobile={isMobile}
          />
        </Row>

        <Row gutter={[16, 16]}>
          
          {selectedEventId != null && selectedEventId !== '' ? (
            <>
          <Col xs={24} md={12}>
            <DataTable
              title="Scans by Scanner"
              data={scannerRows}
              columns={scannerColumns}
              loading={tablesBlockingLoad}
              emptyText="No scanner data"
              showSearch
              enableSearch={false}
              serverSide
              searchValue={scannerSearch}
              searchPlaceholder="Search name or email..."
              onSearch={onScannerSearch}
              pagination={scannerPagination}
              onPaginationChange={onScannerPagination}
              defaultPageSize={DEFAULT_PER_PAGE}
              pageSizeOptions={['5', '10', '15', '20', '50', '100']}
              tableProps={scannerTableProps}
            />
          </Col>
            <Col xs={24} md={12}>
              <TicketScanReport eventId={selectedEventId} />
            </Col>
            </>
        ) : null}
        <Col xs={24} md={24}>
            <DataTable
              title="Scans by Checkpoint"
              data={checkpointRows}
              columns={checkpointColumns}
              loading={tablesBlockingLoad}
              emptyText="No checkpoint data"
              showSearch
              enableSearch={false}
              serverSide
              searchValue={checkpointSearch}
              searchPlaceholder="Search label or code..."
              onSearch={onCheckpointSearch}
              pagination={checkpointPagination}
              onPaginationChange={onCheckpointPagination}
              defaultPageSize={DEFAULT_PER_PAGE}
              pageSizeOptions={['5', '10', '15', '20', '50', '100']}
              tableProps={{
                rowKey: (record) =>
                  record.checkpoint_id ?? record.checkpoint_label ?? String(record.count),
                size: 'small',
                scroll: { x: false },
              }}
            />
          </Col>
        </Row>
      </div>

      {/* <OrgUserDetailedReport type="scanner" /> */}
    </PermissionChecker>
  );
};

export default ScannerReport;

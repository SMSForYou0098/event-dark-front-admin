import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Typography, Tooltip, Select, Space, Table, Spin } from "antd";
import apiClient from "auth/FetchInterceptor";
import { ExpandDataTable } from "views/events/common/ExpandDataTable";
import { useMyContext } from "Context/MyContextProvider";
import { PERMISSIONS } from "constants/PermissionConstant";
import PermissionChecker from "layouts/PermissionChecker";
import { useOrganizerEvents } from "views/events/Settings/hooks/useBanners";

const { Text } = Typography;


// Component to fetch and display detailed scan history
const ExpandedScanDetails = ({ bookingId, eventId, columns }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['booking-scan-history', bookingId, eventId],
    queryFn: async () => {
      const res = await apiClient.get(`booking-scan-history/${bookingId}?event_id=${eventId}`);
      // Assuming response structure: { data: [...] } or just [...]
      return res.data || res;
    },
    staleTime: 5000,
  });

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spin /></div>;
  }

  const dataSource = Array.isArray(data) ? data : (data?.scan_history || []);

  return (
    <div style={{ padding: '10px 20px', background: 'transparent' }}>
      {/* <Typography.Title level={5} style={{ marginBottom: 10 }}>Detailed Scan Logs</Typography.Title> */}
      {dataSource.length > 0 ? (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="id"
          size="small"
        />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No scan logs available</div>
      )}
    </div>
  );
};

const TruncatedText = ({ text, maxLength = 20 }) => {
  if (!text) return "-";

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` : text;

  return shouldTruncate ? (
    <Tooltip title={text}>
      <Text>{displayText}</Text>
    </Tooltip>
  ) : (
    <Text>{text}</Text>
  );
};

const ScanHistory = () => {
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { userRole, UserPermissions, UserData } = useMyContext();

  // Fetch events for dropdown
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
    UserData?.id,
    UserData?.role
  );

  // Fetch scan history using TanStack Query with pagination
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scanHistory", dateRange, currentPage, pageSize, selectedEventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", pageSize);

      if (dateRange?.startDate && dateRange?.endDate) {
        params.append("date", `${dateRange.startDate},${dateRange.endDate}`);
      }

      if (selectedEventId) {
        params.append("event_id", selectedEventId);
      }

      const res = await apiClient.get(`scan-histories?${params.toString()}`);
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });



  // Extract data and pagination from response
  const scanHistory = response?.data || [];
  const pagination = response?.pagination ? {
    current_page: Number(response.pagination.current_page),
    per_page: Number(response.pagination.per_page),
    total: response.pagination.total,
    last_page: response.pagination.last_page,
  } : null;

  // Handle pagination change
  const handlePaginationChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange({
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setDateRange(null);
    }
  };

  // Format date time helper
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return (
      <div>
        <Text>{date.toLocaleDateString()}</Text>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {date.toLocaleTimeString()}
          </Text>
        </div>
      </div>
    );
  };

  // Transform data to add scan_history as "bookings" for ExpandDataTable compatibility
  const transformedData = useMemo(() => {
    return scanHistory.map(item => ({
      ...item,
      id: item.booking_id,
      set_id: `scan-${item.booking_id}`,
      is_set: item.scan_history && item.scan_history.length > 0,
      bookings: (item.scan_history || []).map(scan => ({
        ...scan,
        id: scan.scan_id,
      })),
    }));
  }, [scanHistory]);

  // Inner columns for expanded scan history details
  const innerColumns = [
    {
      title: "#",
      dataIndex: "scan_id",
      key: "scan_id",
      align: "center",
      width: 50,
      fixed: 'left',
      render: (_, __, index) => index + 1,
    },
    {
      title: "Checkpoint",
      dataIndex: ["checkpoint", "label"],
      key: "checkpoint",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Text strong>{record.checkpoint?.label || "-"}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "scan_result",
      key: "scan_result",
      align: "center",
      width: 90,
      render: (result) => (
        <Tag color={result === 'success' ? 'success' : 'error'}>
          {result ? result.charAt(0).toUpperCase() + result.slice(1) : '-'}
        </Tag>
      ),
    },
    {
      title: "Scanned At",
      dataIndex: "scanned_at",
      key: "scanned_at",
      align: "center",
      width: 140,
      render: (scannedAt) => formatDateTime(scannedAt),
    },
    {
      title: "Scanned By",
      dataIndex: ["scanned_by", "name"],
      key: "scanned_by",
      align: "center",
      width: 100,
      render: (_, record) => record.scanned_by?.name || "-",
    },
    {
      title: "Device",
      dataIndex: "device_info",
      key: "device_info",
      align: "center",
      width: 100,
      render: (deviceInfo) => {
        if (!deviceInfo) return "-";
        const browserMatch = deviceInfo.match(/(Chrome|Firefox|Safari|Edge|Opera)[\/\s](\d+)/i);
        const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : 'Unknown';
        return (
          <Tooltip title={deviceInfo}>
            <Text>{browser}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: "IP",
      dataIndex: "ip_address",
      key: "ip_address",
      align: "center",
      width: 110,
      render: (ip) => ip || "-",
    },
  ];

  // Define columns based on new API structure
  const columns = [
    {
      title: "#",
      dataIndex: "booking_id",
      key: "booking_id",
      align: "center",
      width: 50,
      fixed: 'left',
      render: (_, __, index) => {
        const page = pagination?.current_page || 1;
        const size = pagination?.per_page || 10;
        return (page - 1) * size + index + 1;
      },
    },
    {
      title: "Attendee",
      dataIndex: ["booking_details", "name"],
      key: "attendee",
      align: "left",
      width: 150,
      searchable: true,
      render: (_, record) => (
        <div>
          <Text strong>{record.booking_details?.name || "-"}</Text>
          {record.booking_details?.number && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.booking_details.number}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Ticket",
      dataIndex: ["booking_details", "ticket", "name"],
      key: "ticket",
      align: "center",
      width: 130,
      render: (_, record) => (
        <Tag color="cyan">
          {record.booking_details?.ticket?.name || "-"}
        </Tag>
      ),
    },
    {
      title: "Event",
      dataIndex: ["event", "name"],
      key: "event",
      align: "center",
      width: 180,
      searchable: true,
      render: (_, record) => (
        <div>
          <TruncatedText text={record.event?.name} maxLength={25} />
          {record.event?.event_key && (
            <div>
              <Tag color="purple" style={{ fontSize: 10 }}>
                {record.event.event_key}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "booking_type",
      key: "booking_type",
      align: "center",
      width: 80,
      render: (type) => (
        <Tag color={type === 'pos' ? 'blue' : type === 'online' ? 'green' : 'default'}>
          {type ? type.charAt(0).toUpperCase() + type.slice(1) : '-'}
        </Tag>
      ),
    },
    // {
    //   title: "Scans",
    //   dataIndex: "total_scans",
    //   key: "total_scans",
    //   align: "center",
    //   width: 120,
    //   render: (_, record) => (
    //     <div>
    //       <Text strong>{record.total_scans || 0}</Text>
    //       <div style={{ fontSize: 11 }}>
    //         <Text type="success">{record.successful_scans || 0} ✓</Text>
    //         {record.failed_scans > 0 && (
    //           <Text type="danger" style={{ marginLeft: 8 }}>{record.failed_scans} ✗</Text>
    //         )}
    //       </div>
    //     </div>
    //   ),
    // },
    {
      title: "First Scan",
      dataIndex: "first_scan_at",
      key: "first_scan_at",
      align: "center",
      width: 150,
      sorter: (a, b) => new Date(a.first_scan_at) - new Date(b.first_scan_at),
      render: (firstScanAt) => formatDateTime(firstScanAt),
    },
    {
      title: "Last Scan",
      dataIndex: "last_scan_at",
      key: "last_scan_at",
      align: "center",
      width: 150,
      sorter: (a, b) => new Date(a.last_scan_at) - new Date(b.last_scan_at),
      defaultSortOrder: 'descend',
      render: (lastScanAt) => formatDateTime(lastScanAt),
    },
  ];

  // Event filter dropdown component
  const eventFilterDropdown = (
    <Space wrap>
      <Typography.Text strong style={{ color: 'inherit' }}>Event:</Typography.Text>
      <Select
        placeholder="All Events"
        allowClear
        showSearch
        loading={eventsLoading}
        value={selectedEventId}
        onChange={(value) => {
          setSelectedEventId(value);
          setCurrentPage(1); // Reset to first page when event changes
        }}
        style={{ minWidth: 200 }}
        optionFilterProp="label"
        options={events}
      />
    </Space>
  );

  return (
    <PermissionChecker permission={PERMISSIONS.VIEW_SCAN_HISTORY}>
      <ExpandDataTable
        title="Scan History"
        data={transformedData}
        columns={columns}
        innerColumns={innerColumns}
        loading={isLoading}
        error={error}
        showDateRange
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        showRefresh
        onRefresh={refetch}
        enableExport
        exportRoute="/export/scan-logs"
        ExportPermission={userRole === "Admin" || UserPermissions?.includes("Export Scan History")}
        emptyText="No scan history found"
        enableSearch
        showSearch
        // Server-side pagination props
        serverSide
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        // Custom stats component for scan statistics
        // statsComponent={ScanStatistics}
        showReportSwitch={false}
        tableProps={{
          bordered: false,
          expandable: {
            expandedRowRender: (record) => (
              <ExpandedScanDetails
                bookingId={record.booking_id}
                eventId={record.event?.id}
                columns={innerColumns}
              />
            ),
            rowExpandable: (record) => record.total_scans > 0,
            expandedRowKeys: expandedRowKeys,
            onExpand: (expanded, record) => {
              const key = record.booking_id; // Using booking_id as key
              setExpandedRowKeys(prev => expanded ? [...prev, key] : prev.filter(k => k !== key));
            }
          }
        }}
        extraHeaderContent={eventFilterDropdown}
      />
    </PermissionChecker>
  );
};

export default ScanHistory;
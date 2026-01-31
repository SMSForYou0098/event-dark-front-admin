import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Typography, Tooltip } from "antd";
import apiClient from "auth/FetchInterceptor";
import { ExpandDataTable } from "views/events/common/ExpandDataTable";
import { useMyContext } from "Context/MyContextProvider";

const { Text } = Typography;

// Helper component to truncate text with tooltip
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
  const { userRole, UserPermissions } = useMyContext();

  // Fetch scan history using TanStack Query with pagination
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scanHistory", dateRange, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", pageSize);

      if (dateRange?.startDate && dateRange?.endDate) {
        params.append("date", `${dateRange.startDate},${dateRange.endDate}`);
      }

      const res = await apiClient.get(`scan-histories?${params.toString()}`);
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract data and pagination from response
  const scanHistory = response?.data || [];
  const pagination = response ? {
    current_page: response.current_page,
    per_page: response.per_page,
    total: response.total,
    last_page: response.last_page,
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
      render: (_, __, index) => index + 1,
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

  return (
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
      exportRoute="export-scan-history"
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
      }}
    />
  );
};

export default ScanHistory;
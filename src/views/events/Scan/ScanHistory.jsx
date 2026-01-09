import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Typography } from "antd";
import apiClient from "auth/FetchInterceptor";
import DataTable from "views/events/common/DataTable";
import { useMyContext } from "Context/MyContextProvider";

const { Text } = Typography;

const ScanHistory = () => {
  const [dateRange, setDateRange] = useState(null);
  const { userRole, UserPermissions } = useMyContext();
  // Fetch scan history using TanStack Query
  const {
    data: scanHistory = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scanHistory", dateRange],
    queryFn: async () => {
      const dateParam = dateRange
        ? `${dateRange.startDate},${dateRange.endDate}`
        : "";
      const response = await apiClient.get(
        `scan-histories${dateParam ? `?date=${dateParam}` : ""}`
      );
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  // Format booking source
  const formatBookingSource = (source) => {
    if (!source) return "-";
    return source
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format scan times
  const renderScanTimes = (scanTimesJson) => {
    try {
      const times = JSON.parse(scanTimesJson);
      const timeCounts = {};

      // Count occurrences of each time
      times.forEach((time) => {
        timeCounts[time] = (timeCounts[time] || 0) + 1;
      });

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {Object.entries(timeCounts).map(([time, count]) => (
            <div key={time}>
              <Text>{time}</Text>
              {count > 1 && (
                <Tag color="blue" style={{ marginLeft: 4 }}>
                  {count}x
                </Tag>
              )}
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <Text type="secondary">Invalid data</Text>;
    }
  };

  // Define columns
  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      align: "center",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Token",
      dataIndex: "token",
      key: "token",
      align: "center",
      width: 150,
      searchable: true,
      ellipsis: {
        showTitle: true,
      },
      render: (token) => (
        <Text ellipsis={{ tooltip: token }} style={{ maxWidth: 150 }}>
          {token}
        </Text>
      ),
    },
    {
      title: "Attendee",
      dataIndex: ["user", "name"],
      key: "attendee",
      align: "center",
      searchable: true,
      render: (_, record) => record.user?.name || "-",
    },
    {
      title: "Scanner",
      dataIndex: ["scanner", "name"],
      key: "scanner",
      align: "center",
      searchable: true,
      render: (_, record) => record.scanner?.name || "-",
    },
    {
      title: "Booking Source",
      dataIndex: "booking_source",
      key: "booking_source",
      align: "center",
      searchable: true,
      render: (source) => (
        <Tag color="geekblue">{formatBookingSource(source)}</Tag>
      ),
    },
    {
      title: "Scan Time(s)",
      dataIndex: "scan_time",
      key: "scan_time",
      align: "center",
      width: 200,
      render: renderScanTimes,
    },
    {
      title: "Scan Count",
      dataIndex: "count",
      key: "count",
      align: "center",
      width: 120,
      sorter: (a, b) => a.count - b.count,
      render: (count) => (
        <Tag color={count > 1 ? "red" : "green"} style={{ fontSize: 14 }}>
          {count}
        </Tag>
      ),
    },
  ];

  return (
    <DataTable
      title="Scan History"
      data={scanHistory}
      columns={columns}
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
      tableProps={{
        bordered: false,
      }}
    />
  );
};

export default ScanHistory;
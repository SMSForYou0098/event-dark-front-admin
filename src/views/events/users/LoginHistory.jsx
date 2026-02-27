import React, { useState } from "react";
import { Select, Space, message } from "antd";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useMyContext } from "Context/MyContextProvider";
import DataTable from "../common/DataTable";
import api from "auth/FetchInterceptor";
import Utils from "utils";

const { Option } = Select;

const LoginHistory = () => {
  const { formatDateTime, UserData } =
    useMyContext();
  const [dateRange, setDateRange] = useState(null);
  const [logType, setLogType] = useState("self"); // 'self' or 'all'

  // API function to fetch login history
  const fetchLoginHistory = async () => {
    const queryParams = dateRange
      ? `?date=${dateRange.startDate},${dateRange.endDate}`
      : "";

    const response = await api.get(`login-history${queryParams}`);

    if (!response) throw new Error("Failed to fetch login history");

    // Return all data, we'll filter it based on logType in the component
    return response;
  };

  // TanStack Query hook
  const {
    data: loginData = {},
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["loginHistory", dateRange],
    queryFn: fetchLoginHistory,
    // enabled: !!authToken,
    staleTime: 0, // always stale → always background re-fetch
    refetchOnMount: "always", // force re-fetch on mount
    refetchOnWindowFocus: true, // re-fetch when tab is focused
    refetchOnReconnect: true, // re-fetch on network reconnect
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error("Error fetching login history:", error);
      message.error(Utils.getErrorMessage(error));
    },
  });

  // Filter data based on log type (no API call needed when changing logType)
  const loginHistory =
    UserData?.role === "Admin" && logType === "self"
      ? loginData.admin_history || []
      : loginData.data || [];

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange({
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setDateRange(null);
    }
  };

  // Handle log type change
  const handleLogTypeChange = (value) => {
    setLogType(value);
    // No API call needed since we already have all the data
  };

  // Define columns for the table
  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "User Name",
      dataIndex: ["user", "name"],
      key: "userName",
      align: "center",
      searchable: true,
      render: (_, record) => record.user?.name || "N/A",
      sorter: (a, b) => {
        const nameA = a.user?.name || "";
        const nameB = b.user?.name || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "User Number",
      dataIndex: ["user", "number"],
      key: "userNumber",
      align: "center",
      searchable: true,
      render: (_, record) => record.user?.number || "N/A",
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      align: "center",
      searchable: true,
      sorter: (a, b) => {
        const ipA = a.ip_address || "";
        const ipB = b.ip_address || "";
        return ipA.localeCompare(ipB);
      },
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      align: "center",
      searchable: true,
      render: (location) => location || "Unknown",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      align: "center",
      searchable: true,
      render: (city) => city || "Unknown",
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      align: "center",
      searchable: true,
      render: (state) => state || "Unknown",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      align: "center",
      searchable: true,
      render: (country) => country || "Unknown",
    },
    {
      title: "Login Time",
      dataIndex: "login_time",
      key: "login_time",
      align: "center",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.login_time) - new Date(b.login_time),
    },
  ];

  // Extra header content for log type selector (Admin only)
  const extraHeaderContent =
    UserData?.role === "Admin" ? (
      <Select
        value={logType}
        onChange={handleLogTypeChange}
        style={{ width: 200 }}
      >
        <Option value="self">My Login History</Option>
        <Option value="all">All Users Login History</Option>
      </Select>
    ) : null;

  return (
    <DataTable
      title="Login History"
      data={loginHistory}
      columns={columns}
      showDateRange={true}
      showRefresh={true}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
      loading={isLoading || isFetching}
      error={isError ? error : null}
      enableSearch={true}
      showSearch={true}
      enableExport={true}
      exportRoute="login-history-export"
      ExportPermission={true}
      onRefresh={refetch}
      emptyText="No login history found"
      extraHeaderContent={extraHeaderContent}
    />
  );
};

export default LoginHistory;

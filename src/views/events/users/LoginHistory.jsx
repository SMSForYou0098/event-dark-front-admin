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

  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // API function to fetch login history
  const fetchLoginHistory = async () => {
    const params = new URLSearchParams();

    // Pagination params
    params.set("page", currentPage.toString());
    params.set("per_page", pageSize.toString());

    // Search param
    if (searchText) {
      params.set("search", searchText);
    }

    // Sorting params
    if (sortField && sortOrder) {
      params.set("sort_by", sortField);
      params.set("sort_order", sortOrder === "ascend" ? "asc" : "desc");
    }

    // Date range params
    if (dateRange) {
      params.set("date", `${dateRange.startDate},${dateRange.endDate}`);
    }

    // History scope param (admin for self, others for all history)
    params.set("history_scope", logType === "self" ? "admin" : "others");

    const response = await api.get(`login-history?${params.toString()}`);

    if (!response) throw new Error("Failed to fetch login history");

    return response;
  };

  // TanStack Query hook
  const {
    data: loginData = { data: [], pagination: null },
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["loginHistory", dateRange, logType, currentPage, pageSize, searchText, sortField, sortOrder],
    queryFn: fetchLoginHistory,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Final data for the table
  const loginHistory = loginData.data || [];
  const pagination = loginData.pagination;

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  // Handle pagination change
  const handlePaginationChange = (page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    }
  };

  // Handle search change
  const handleSearchChange = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (field, order) => {
    setSortField(field || null);
    setSortOrder(order || null);
  };

  // Define columns for the table
  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
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
      // Server-side pagination props
      serverSide={true}
      pagination={pagination}
      onPaginationChange={handlePaginationChange}
      onSearch={handleSearchChange}
      onSortChange={handleSortChange}
      searchValue={searchText}
    />
  );
};

export default LoginHistory;

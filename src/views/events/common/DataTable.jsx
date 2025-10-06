// components/common/DataTable.js
import React, { useState, useRef, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  DatePicker,
  Spin,
  Grid,
  Card,
  Tooltip,
  Row,
  Col,
  Alert,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import api from "auth/FetchInterceptor";
import Flex from "components/shared-components/Flex";
import { ROW_GUTTER } from "constants/ThemeConstant";

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const DataTable = ({
  title,
  data = [],
  columns,
  showDateRange = true,
  showRefresh = true,
  showTotal = true,
  showAddButton = false,
  addButtonProps = {},
  dateRange,
  onDateRangeChange,
  loading = false,
  error = null,
  tableProps = {},
  extraHeaderContent,
  emptyText = "No data",
  enableSearch = true,
  showSearch = true,
  enableExport = false,
  exportRoute,
  ExportPermission = false,
  authToken,
  onRefresh,
}) => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  const [filteredData, setFilteredData] = useState(data);
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Update the search handler
  const handleGlobalSearch = (value) => {
    setSearchText(value);

    if (!value) {
      setFilteredData(data);
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = data.filter((record) => {
      // Search across all columns
      return columns.some((column) => {
        const dataIndex = column.dataIndex;
        if (!dataIndex) return false;

        // Handle nested dataIndex (e.g., ['user', 'name'])
        let cellValue;
        if (Array.isArray(dataIndex)) {
          cellValue = dataIndex.reduce((obj, key) => obj?.[key], record);
        } else {
          cellValue = record[dataIndex];
        }

        // Convert to string and search
        if (cellValue === null || cellValue === undefined) return false;
        return String(cellValue).toLowerCase().includes(searchLower);
      });
    });

    setFilteredData(filtered);
  };


  const searchInput = useRef(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isSmallMobile = !screens.sm;

  const handleDateRangeChange = (dates) => {
    onDateRangeChange?.(dates);
  };
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Add this useEffect to handle the countdown timer
  useEffect(() => {
    let timer;
    if (lastRefreshTime) {
      timer = setInterval(() => {
        const remainingSeconds = Math.ceil(
          60 - (Date.now() - lastRefreshTime) / 1000
        );
        if (remainingSeconds <= 0) {
          setCountdown(null);
          setLastRefreshTime(null);
        } else {
          setCountdown(remainingSeconds);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lastRefreshTime]);

  // Add this function to handle refresh with cooldown
  const handleRefreshWithCooldown = () => {
    if (!lastRefreshTime || Date.now() - lastRefreshTime >= 60000) {
      setLastRefreshTime(Date.now());
      onRefresh();
    }
  };

  const handleExport = async () => {
    if (!exportRoute) {
      console.error("Export route missing");
      return;
    }

    setExportLoading(true);
    try {
      const response = await api.post(
        exportRoute,
        { date: dateRange },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      const fileName =
        contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ||
        `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]
        }.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      if (recordValue === null || recordValue === undefined) return false;
      const str =
        typeof recordValue === "object"
          ? JSON.stringify(recordValue)
          : String(recordValue);
      return str.toLowerCase().includes(String(value).toLowerCase());
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? String(text) : ""}
        />
      ) : (
        text
      ),
  });

  const enhancedColumns = enableSearch
    ? columns.map((column) => {
      if (column.searchable) {
        return {
          ...column,
          ...getColumnSearchProps(column.dataIndex),
        };
      }
      return column;
    })
    : columns;

  // Desktop header controls
  const renderDesktopHeaderControls = () => (
  <Space wrap size="middle">
    {showSearch && (
      <Input
        placeholder="Search across..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => handleGlobalSearch(e.target.value)}
        allowClear
        style={{ width: isTablet ? 200 : 250 }}
      />
    )}
    {showDateRange && (
      <RangePicker
        value={
          dateRange
            ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)]
            : null
        }
        onChange={handleDateRangeChange}
        format="YYYY-MM-DD"
        placeholder={["Start Date", "End Date"]}
        style={{ width: isTablet ? 240 : 280 }}
        size={isTablet ? "small" : "middle"}
      />
    )}
    {showRefresh && (
      <Tooltip
        title={countdown ? `Wait ${countdown}s to refresh` : "Refresh Data"}
      >
        <Button
          type="primary"
          onClick={handleRefreshWithCooldown}
          disabled={loading || countdown !== null}
          size={isTablet ? "small" : "middle"}
        >
          {loading ? <Spin size="small" /> : countdown || <ReloadOutlined />}
        </Button>
      </Tooltip>
    )}
    {enableExport && ExportPermission && exportRoute && (
      <Tooltip title="Export Data">
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleExport}
          loading={exportLoading}
          disabled={exportLoading}
          size={isTablet ? "small" : "middle"}
        />
      </Tooltip>
    )}
    {extraHeaderContent}
  </Space>
);

  // Error display
  const renderError = () =>
    error ? (
      <Alert
        type="error"
        showIcon
        message={<div>Error: {error?.message ?? "Failed to fetch data"}</div>}
        action={
          <Button
            type="primary"
            icon={countdown ? undefined : <ReloadOutlined />}
            onClick={handleRefreshWithCooldown}
            size={isMobile ? "small" : "middle"}
            disabled={loading || countdown !== null}
            danger
          >
            {loading ? (
              <Spin size="small" />
            ) : countdown ? (
              `Wait ${countdown}s`
            ) : (
              "Retry"
            )}
          </Button>
        }
        style={{ marginBottom: 16 }}
      />
    ) : null;

  const customLoadingIndicator = (
    <div className="py-4">
      <Spin />
    </div>
  );
  return (
    <Card
      bordered={false}
      title={
        <Flex flexDirection="column" gap={filteredData.length > 0 ? 16 : 0} flexWrap="nowrap">
          <Flex justifyContent="space-between" alignItems="center" width="100%">
            <span className="font-weight-bold">{title}</span>
            <div className="action">
              <span className="d-block d-sm-none">
                <Button
                  icon={<FilterOutlined />}
                  type="text"
                  onClick={() => setFilterDrawerVisible(!filterDrawerVisible)}
                />
              </span>
              {(!loading) && (
                <span className="d-none d-sm-block">
                  {renderDesktopHeaderControls()}
                </span>
              )}
            </div>
          </Flex>
          <span className="d-block d-sm-none">
            {filterDrawerVisible && renderDesktopHeaderControls()}
          </span>
        </Flex>
      }
      style={{
        boxShadow: isMobile ? "none" : undefined,
        borderRadius: isMobile ? 0 : 8,
      }}
    >
      <div className="table-responsive">
        {renderError()}

        {/* Table Section */}
        <div>
          <Table
            columns={enhancedColumns}
            dataSource={filteredData}
            loading={loading && { indicator: customLoadingIndicator }}
            pagination={{
              pageSize: isMobile ? 5 : 10,
              // showSizeChanger: !isMobile,
              // showQuickJumper: !isMobile,
              showTotal: (total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]}/${total}`
                  : `Showing ${range[0]}-${range[1]} of ${total} items`,
              size: isMobile ? "small" : "default",
              simple: isSmallMobile,
              responsive: true,
              position: isMobile ? ["bottomCenter"] : ["bottomRight"],
            }}
            locale={{ emptyText }}
            scroll={{
              x: isMobile ? "max-content" : 1200,
              y: isMobile ? undefined : undefined,
            }}
            size={isSmallMobile ? "small" : isMobile ? "middle" : "middle"}
            sticky={!isMobile}
            {...tableProps}
          />
        </div>
      </div>
    </Card>
  );
};

export default DataTable;

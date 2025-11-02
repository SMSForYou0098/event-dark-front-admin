import { Table, Input, Button, Space, Spin, Grid, Card, Tooltip, Alert, DatePicker } from "antd";
import { SearchOutlined, ReloadOutlined, CloudUploadOutlined, FilterOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import { useState, useCallback, useEffect, useRef } from "react";
import api from "auth/FetchInterceptor";
import Flex from "components/shared-components/Flex";

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export const ExpandDataTable = ({
  title = "",
  columns,
  innerColumns,
  data = [],
  loading = false,
  error = null,
  enableSearch = true,
  showSearch = true,
  showDateRange = false,
  dateRange,
  onDateRangeChange,
  showRefresh = false,
  onRefresh,
  enableExport = false,
  exportRoute,
  ExportPermission = false,
  extraHeaderContent,
  emptyText = "No data",
  tableProps = {},
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [filteredData, setFilteredData] = useState(data);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  const searchInput = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isSmallMobile = !screens.sm;

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Expandable row render
  const expandedRowRender = useCallback(
    (record) => {
      if (!record.bookings || record.is_set === false) return null;
      return (
        <Table
          columns={innerColumns}
          dataSource={record.bookings}
          pagination={false}
          rowKey="id"
          size="small"
          bordered
        />
      );
    },
    [innerColumns]
  );

  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys((prevKeys) =>
      expanded ? [...prevKeys, record.id] : prevKeys.filter((key) => key !== record.id)
    );
  }, []);

  // Global search handler
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

  // Search helpers
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
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
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
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      if (recordValue === null || recordValue === undefined) return false;
      const str = typeof recordValue === "object" ? JSON.stringify(recordValue) : String(recordValue);
      return str.toLowerCase().includes(String(value).toLowerCase());
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) setTimeout(() => searchInput.current?.select(), 100);
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
    ? columns.map((col) => (col.searchable ? { ...col, ...getColumnSearchProps(col.dataIndex) } : col))
    : columns;

  // Date range handler
  const handleDateRangeChange = (dates) => {
    onDateRangeChange?.(dates);
  };

  // Refresh cooldown
  useEffect(() => {
    let timer;
    if (lastRefreshTime) {
      timer = setInterval(() => {
        const remaining = Math.ceil(60 - (Date.now() - lastRefreshTime) / 1000);
        if (remaining <= 0) {
          setCountdown(null);
          setLastRefreshTime(null);
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lastRefreshTime]);

  const handleRefreshWithCooldown = () => {
    if (!lastRefreshTime || Date.now() - lastRefreshTime >= 60000) {
      setLastRefreshTime(Date.now());
      onRefresh?.();
    }
  };

  // Export function
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
        `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

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
        <Tooltip title={countdown ? `Wait ${countdown}s to refresh` : "Refresh Data"}>
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
              {!loading && (
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
    >
      <div className="table-responsive">
        {renderError()}

        {/* Table Section */}
        <div>
          <Table
            columns={enhancedColumns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading && { indicator: customLoadingIndicator }}
            size={isSmallMobile ? "small" : isMobile ? "middle" : "middle"}
            scroll={{
              x: isMobile ? "max-content" : 1200,
              y: isMobile ? undefined : undefined,
            }}
            sticky={!isMobile}
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.is_set === true,
              expandedRowKeys,
              onExpand: handleExpand,
            }}
            pagination={{
              pageSize: isMobile ? 5 : 10,
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
            {...tableProps}
          />
        </div>
      </div>
    </Card>
  );
};
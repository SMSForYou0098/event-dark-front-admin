// components/common/DataTable.js
import React, { useState, useRef } from 'react';
import { Table, Input, Button, Space, DatePicker, Spin, Grid, Dropdown, Card, Drawer } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined, ExportOutlined, MenuOutlined, FilterOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import dayjs from 'dayjs';
import api from 'auth/FetchInterceptor';

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
  emptyText = 'No data',
  enableSearch = true,
  enableExport = false,
  exportRoute,
  ExportPermission = false,
  authToken,
  onRefresh,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const searchInput = useRef(null);
  
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isSmallMobile = !screens.sm;

  const handleDateRangeChange = (dates) => {
    onDateRangeChange?.(dates);
  };

  const clearDateFilter = () => {
    onDateRangeChange?.(null);
  };

  const handleExport = async () => {
    if (!exportRoute) {
      console.error('Export route missing');
      return;
    }

    setExportLoading(true);
    try {
      const response = await api.post(
        exportRoute,
        { date: `${dateRange.startDate},${dateRange.endDate}` },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      const fileName =
        contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ||
        `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

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
    setSearchText('');
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
          style={{ width: 188, marginBottom: 8, display: 'block' }}
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
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      if (recordValue === null || recordValue === undefined) return false;
      const str = typeof recordValue === 'object' ? JSON.stringify(recordValue) : String(recordValue);
      return str.toLowerCase().includes(String(value).toLowerCase());
    },
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? String(text) : ''}
        />
      ) : (text),
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

  // Mobile Filter Drawer Content
  const renderMobileFilters = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {showDateRange && (
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Date Range</div>
          <RangePicker
            value={dateRange ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
            style={{ width: '100%' }}
            size="middle"
          />
          {dateRange && (
            <Button 
              onClick={clearDateFilter} 
              size="small" 
              style={{ marginTop: 8 }}
              block
            >
              Clear Date Filter
            </Button>
          )}
        </div>
      )}

      {showTotal && (
        <div style={{ 
          padding: '12px 16px',
          background: '#f5f5f5',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500
        }}>
          Total Records: {data.length}
        </div>
      )}

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {enableExport && ExportPermission && exportRoute && (
          <Button 
            type="default" 
            icon={<ExportOutlined />}
            onClick={() => {
              handleExport();
              setFilterDrawerVisible(false);
            }}
            loading={exportLoading}
            disabled={exportLoading}
            block
            size="large"
          >
            Export Data
          </Button>
        )}

        {showRefresh && (
          <Button
            type="primary"
            onClick={() => {
              onRefresh();
              setFilterDrawerVisible(false);
            }}
            disabled={loading}
            icon={loading ? <Spin size="small" /> : <ReloadOutlined />}
            block
            size="large"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        )}

        <Button
          onClick={() => setFilterDrawerVisible(false)}
          block
          size="large"
        >
          Close
        </Button>
      </Space>
    </Space>
  );

  // Desktop header controls
  const renderDesktopHeaderControls = () => (
    <Space wrap>
      {showDateRange && (
        <Space.Compact>
          <RangePicker
            value={dateRange ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
            style={{ width: isTablet ? 240 : 280 }}
            size={isTablet ? 'small' : 'middle'}
          />
          {dateRange && (
            <Button 
              onClick={clearDateFilter} 
              size={isTablet ? 'small' : 'middle'}
            >
              Clear
            </Button>
          )}
        </Space.Compact>
      )}

      {extraHeaderContent}

      {enableExport && ExportPermission && exportRoute && (
        <Button 
          type="default" 
          icon={<ExportOutlined />}
          onClick={handleExport}
          loading={exportLoading}
          disabled={exportLoading}
          size={isTablet ? 'small' : 'middle'}
        >
          {isTablet ? 'Export' : 'Export Data'}
        </Button>
      )}

      {showRefresh && (
        <Button
          type="primary"
          onClick={onRefresh}
          disabled={loading}
          icon={loading ? <Spin size="small" /> : <ReloadOutlined />}
          size={isTablet ? 'small' : 'middle'}
        >
          {loading ? 'Refreshing' : 'Refresh'}
        </Button>
      )}

      {showTotal && (
        <span style={{ 
          fontSize: isTablet ? 13 : 14,
          whiteSpace: 'nowrap',
          color: '#666'
        }}>
          Total: <strong>{data.length}</strong>
        </span>
      )}
    </Space>
  );

  // Mobile header controls
  const renderMobileHeaderControls = () => (
    <Space size="small">
      {showTotal && (
        <span style={{ 
          fontSize: isSmallMobile ? 11 : 12, 
          whiteSpace: 'nowrap',
          color: '#666'
        }}>
          Total: <strong>{data.length}</strong>
        </span>
      )}
      
      <Button 
        icon={<FilterOutlined />} 
        onClick={() => setFilterDrawerVisible(true)}
        size={isSmallMobile ? 'small' : 'middle'}
        type="default"
      >
        {isSmallMobile ? '' : 'Filters'}
      </Button>
    </Space>
  );

  // Add button
  const renderAddButton = () => {
    if (!showAddButton) return null;

    return (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addButtonProps.onClick}
        size={isMobile ? (isSmallMobile ? 'small' : 'middle') : 'middle'}
        {...addButtonProps.buttonProps}
      >
        {isSmallMobile ? '' : (addButtonProps.text || 'Add New')}
      </Button>
    );
  };

  // Error display
  const renderError = () =>
    error ? (
      <div style={{ 
        marginBottom: 16, 
        padding: isMobile ? 12 : 16, 
        borderRadius: 8, 
        background: '#fff1f0', 
        border: '1px solid #ffccc7',
        color: '#cf1322',
        fontSize: isMobile ? 13 : 14
      }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          Error: {error?.message ?? 'Failed to fetch data'}
        </div>
        <Button 
          type="primary" 
          onClick={onRefresh} 
          size={isMobile ? 'small' : 'middle'}
          danger
        >
          Retry
        </Button>
      </div>
    ) : null;

  return (
    <>
      <style>
        {`
          /* Responsive table improvements */
          .table-responsive {
            width: 100%;
          }

          /* Mobile table adjustments */
          @media (max-width: 768px) {
            .ant-table {
              font-size: 12px;
            }
            
            .ant-table-thead > tr > th {
              padding: 8px 4px;
              font-size: 12px;
            }
            
            .ant-table-tbody > tr > td {
              padding: 8px 4px;
              font-size: 12px;
            }
            
            .ant-table-pagination {
              margin: 12px 0 !important;
            }
          }

          /* Small mobile adjustments */
          @media (max-width: 576px) {
            .ant-table {
              font-size: 11px;
            }
            
            .ant-table-thead > tr > th {
              padding: 6px 3px;
              font-size: 11px;
            }
            
            .ant-table-tbody > tr > td {
              padding: 6px 3px;
              font-size: 11px;
            }
          }

          /* Card responsive padding */
          @media (max-width: 768px) {
            .ant-card-body {
              padding: 12px !important;
            }
          }

          @media (max-width: 576px) {
            .ant-card-body {
              padding: 8px !important;
            }
          }

          /* Smooth scrolling */
          .table-responsive {
            -webkit-overflow-scrolling: touch;
          }
        `}
      </style>
      
      <Card 
        bordered={!isMobile}
        style={{ 
          boxShadow: isMobile ? 'none' : undefined,
          borderRadius: isMobile ? 0 : 8
        }}
      >
        <div className="table-responsive">
          {/* Header Section */}
          <div style={{ 
            marginBottom: isMobile ? 12 : 16, 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 8 : 16
          }}>
            {/* Title Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 8 : 12,
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isSmallMobile ? 16 : (isMobile ? 18 : 22),
                lineHeight: 1.3,
                fontWeight: 600
              }}>
                {title}
              </h2>
              {loading && (
                <span style={{ 
                  fontSize: isSmallMobile ? 10 : 11, 
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Spin size="small" /> Loading...
                </span>
              )}
            </div>

            {/* Controls Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: isMobile ? 'space-between' : 'flex-end',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              {isMobile ? renderMobileHeaderControls() : renderDesktopHeaderControls()}
              {renderAddButton()}
            </div>
          </div>

          {renderError()}

          {/* Table Section */}
          <div style={{ 
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            margin: isMobile ? '-12px -12px 0' : 0,
            padding: isMobile ? '0 12px' : 0
          }}>
            <Table
              columns={enhancedColumns}
              dataSource={data}
              loading={loading}
              pagination={{
                pageSize: isMobile ? 5 : 10,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                showTotal: (total, range) => 
                  isMobile 
                    ? `${range[0]}-${range[1]}/${total}`
                    : `Showing ${range[0]}-${range[1]} of ${total} items`,
                size: isMobile ? 'small' : 'default',
                simple: isSmallMobile,
                responsive: true,
                position: isMobile ? ['bottomCenter'] : ['bottomRight']
              }}
              locale={{ emptyText }}
              scroll={{ 
                x: isMobile ? 'max-content' : 1200,
                y: isMobile ? undefined : undefined 
              }}
              size={isSmallMobile ? 'small' : (isMobile ? 'middle' : 'middle')}
              sticky={!isMobile}
              {...tableProps}
            />
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          title="Filters & Actions"
          placement="bottom"
          height="auto"
          onClose={() => setFilterDrawerVisible(false)}
          open={filterDrawerVisible}
          styles={{
            body: { paddingTop: 16 }
          }}
        >
          {renderMobileFilters()}
        </Drawer>
      </Card>
    </>
  );
};

export default DataTable;
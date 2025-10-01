// components/common/DataTable.js
import React, { useState, useRef } from 'react';
import { Table, Input, Button, Space, DatePicker, Spin, Grid, Dropdown, Card } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined, ExportOutlined, MenuOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import dayjs from 'dayjs';
import axios from 'axios';
import api from 'auth/FetchInterceptor';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const DataTable = ({
  // Basic props
  title,
  data = [],
  columns,
  
  // Display controls
  showDateRange = true,
  showRefresh = true,
  showTotal = true,
  showAddButton = false,
  addButtonProps = {},
  
  // Data and state
  dateRange,
  onDateRangeChange,
  loading = false,
  error = null,
  
  // Customization
  tableProps = {},
  extraHeaderContent,
  emptyText = 'No data',
  
  // Advanced features
  enableSearch = true,
  enableExport = false,
  exportRoute,
  ExportPermission = false,
  authToken,
  
  // Callbacks
  onRefresh,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const searchInput = useRef(null);
  
  // Responsive breakpoints
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint and below
  const isSmallMobile = !screens.sm; // sm breakpoint and below

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    onDateRangeChange?.(dates);
  };

  const clearDateFilter = () => {
    onDateRangeChange?.(null);
  };

  // Export functionality
  const handleExport = async () => {
    if (!exportRoute) {
      console.error('Export route missing');
      return;
    }

    setExportLoading(true);
    try {
      const response = await api.post(
        exportRoute,
        {
          date: dateRange,
        },
        {
          responseType: "blob",
        }
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

  // Search functionality
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
      ) : (
        text
      ),
  });

  // Enhanced columns with search
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

  // Mobile dropdown menu items
  const getMobileMenuItems = () => {
    const items = [];
    
    if (showDateRange) {
      items.push({
        key: 'dateRange',
        label: (
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Date Range</div>
            <Space.Compact direction="vertical" style={{ width: '100%' }}>
              <RangePicker
                value={dateRange ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                placeholder={['Start Date', 'End Date']}
                style={{ width: '100%' }}
                size="small"
              />
              {dateRange && (
                <Button onClick={clearDateFilter} size="small" style={{ marginTop: 8 }}>
                  Clear Date
                </Button>
              )}
            </Space.Compact>
          </div>
        ),
      });
    }

    if (enableExport && ExportPermission && exportRoute) {
      items.push({
        key: 'export',
        label: (
          <Button 
            type="default" 
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={exportLoading}
            disabled={exportLoading}
            size="small"
            style={{ width: '100%', textAlign: 'left' }}
          >
            Export Data
          </Button>
        ),
      });
    }

    if (showRefresh) {
      items.push({
        key: 'refresh',
        label: (
          <Button
            type="primary"
            onClick={onRefresh}
            disabled={loading}
            icon={loading ? <Spin size="small" /> : <ReloadOutlined />}
            size="small"
            style={{ width: '100%', textAlign: 'left' }}
          >
            {loading ? 'Refreshing' : 'Refresh'}
          </Button>
        ),
      });
    }

    return items;
  };

  // Desktop header controls
  const renderDesktopHeaderControls = () => (
    <Space>
      {showDateRange && (
        <Space.Compact>
          <RangePicker
            value={dateRange ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
            style={{ width: isSmallMobile ? 200 : 250 }}
            size={isSmallMobile ? 'small' : 'middle'}
          />
          {dateRange && (
            <Button onClick={clearDateFilter} size={isSmallMobile ? 'small' : 'middle'} style={{ marginLeft: 8 }}>
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
          size={isSmallMobile ? 'small' : 'middle'}
        >
          {isSmallMobile ? '' : 'Export'}
        </Button>
      )}

      {showRefresh && (
        <Button
          type="primary"
          onClick={onRefresh}
          disabled={loading}
          icon={loading ? <Spin size="small" /> : <ReloadOutlined />}
          size={isSmallMobile ? 'small' : 'middle'}
        >
          {isSmallMobile ? '' : (loading ? 'Refreshing' : 'Refresh')}
        </Button>
      )}

      {showTotal && (
        <span style={{ 
          fontSize: isSmallMobile ? '12px' : '14px',
          whiteSpace: 'nowrap'
        }}>
          Total: {data.length}
        </span>
      )}
    </Space>
  );

  // Mobile header controls
  const renderMobileHeaderControls = () => (
    <Space>
      {showTotal && (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          Total: {data.length}
        </span>
      )}
      
      <Dropdown
        menu={{ items: getMobileMenuItems() }}
        trigger={['click']}
        placement="bottomRight"
        overlayStyle={{ minWidth: 250 }}
      >
        <Button 
          icon={<MenuOutlined />} 
          size="small"
          type="default"
        >
          Actions
        </Button>
      </Dropdown>
    </Space>
  );

  // Add button - responsive
  const renderAddButton = () => {
    if (!showAddButton) return null;

    return (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addButtonProps.onClick}
        size={isSmallMobile ? 'small' : 'middle'}
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
        marginBottom: 12, 
        padding: 12, 
        borderRadius: 4, 
        background: '#fff1f0', 
        color: '#cf1322',
        fontSize: isMobile ? '12px' : '14px'
      }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Error:</strong> {error?.message ?? 'Failed to fetch data'}
        </div>
        <Button type="primary" onClick={onRefresh} size={isMobile ? 'small' : 'middle'}>
          Retry
        </Button>
      </div>
    ) : null;

  return (
    <Card >
				<div className="table-responsive">
      {/* Header Section */}
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 0
      }}>
        {/* Title Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16,
          justifyContent: isMobile ? 'space-between' : 'flex-start',
          marginBottom: isMobile ? 8 : 0
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '18px' : '24px',
            lineHeight: 1.2
          }}>
            {title}
          </h2>
          {loading && (
            <span style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              color: '#999',
              whiteSpace: 'nowrap'
            }}>
              <Spin size="small" /> Loading...
            </span>
          )}
        </div>

        {/* Controls Section */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'row',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          alignItems: 'center',
          gap: isMobile ? 8 : 16,
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
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}>
        <Table
          columns={enhancedColumns}
          dataSource={data}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isMobile, // Hide size changer on mobile
            showQuickJumper: !isMobile, // Hide quick jumper on mobile
            showTotal: (total, range) => 
              isMobile 
                ? `${range[0]}-${range[1]} of ${total}`
                : `${range[0]}-${range[1]} of ${total} items`,
            size: isMobile ? 'small' : 'default',
            simple: isMobile, // Simple pagination on mobile
          }}
          locale={{ emptyText }}
          scroll={{ x: 1500 }}
          size={isMobile ? 'small' : 'middle'}
          {...tableProps}
        />
      </div>
    </div>
    </Card>
  );
};

export default DataTable;
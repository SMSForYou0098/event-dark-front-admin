import React, { useMemo } from "react";
import { Table, Spin, DatePicker, Typography, Card } from "antd";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const LiveUserListing = ({ data, loading, dateRange, setDateRange }) => {
  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "id",
        key: "index",
        align: "center",
        render: (_text, _record, index) => index + 1,
      },
      {
        title: "Browser",
        dataIndex: "browser",
        key: "browser",
        align: "center",
        sorter: (a, b) => a.browser.localeCompare(b.browser),
      },
      {
        title: "State",
        dataIndex: "state",
        key: "state",
        align: "center",
        sorter: (a, b) => a.state.localeCompare(b.state),
      },
      {
        title: "City",
        dataIndex: "city",
        key: "city",
        align: "center",
        sorter: (a, b) => a.city.localeCompare(b.city),
      },
      {
        title: "IP Address",
        dataIndex: "ip_address",
        key: "ip_address",
        align: "center",
        sorter: (a, b) => a.ip_address.localeCompare(b.ip_address),
      },
      {
        title: "Latitude",
        dataIndex: "latitude",
        key: "latitude",
        align: "center",
        sorter: (a, b) => a.latitude - b.latitude,
      },
      {
        title: "Longitude",
        dataIndex: "longitude",
        key: "longitude",
        align: "center",
        sorter: (a, b) => a.longitude - b.longitude,
      },
      {
        title: "Platform",
        dataIndex: "platform",
        key: "platform",
        align: "center",
        sorter: (a, b) => a.platform.localeCompare(b.platform),
      },
      {
        title: "Device",
        dataIndex: "device",
        key: "device",
        align: "center",
        sorter: (a, b) => a.device.localeCompare(b.device),
      },
      {
        title: "Date",
        dataIndex: "created_at",
        key: "date",
        align: "center",
        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        render: (created_at) => {
          const date = new Date(created_at);
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          return `${dd}-${mm}-${yyyy}`;
        },
      },
    ],
    []
  );

  return (
    <Card bordered={false} title="Live User Tracking" extra={
         <RangePicker
          value={dateRange}
          onChange={setDateRange}
          allowClear
          format="DD-MM-YYYY"
        />
    }>
      <Spin spinning={loading}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Spin>
    </Card>
  );
};

export default LiveUserListing;

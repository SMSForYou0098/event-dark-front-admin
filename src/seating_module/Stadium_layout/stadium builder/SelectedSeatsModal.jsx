import React from "react";
import { Drawer, Button, Table, Tooltip, Badge, Space, Typography, Empty } from "antd";
import { DeleteOutlined, CloseOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const SelectedSeatsDrawer = ({
  show,
  onHide,
  selectedSeats,
  setSelectedSeats,
  isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false,
}) => {
  const handleDelete = (seatId) => {
    setSelectedSeats((prev) => prev.filter((seat) => seat.id !== seatId));
  };

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + parseFloat(seat.price || 0),
    0
  );

  const columns = [
    {
      title: '#',
      key: 'index',
      align: 'center',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Seat',
      dataIndex: 'number',
      key: 'number',
      align: 'center',
      width: 80,
    },
    {
      title: 'Stand',
      key: 'stand',
      align: 'center',
      width: 100,
      render: (record) => record.stand?.name || '-',
    },
    {
      title: 'Tier',
      key: 'tier',
      align: 'center',
      width: 100,
      render: (record) => record.tier?.name || '-',
    },
    {
      title: 'Section',
      key: 'section',
      align: 'center',
      width: 100,
      render: (record) => record.section?.name || '-',
    },
    {
      title: 'Row',
      dataIndex: 'rowLabel',
      key: 'rowLabel',
      align: 'center',
      width: 80,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'center',
      width: 100,
      render: (price) => (
        <Badge
          count={`₹${price ?? 0}`}
          style={{
            backgroundColor: '#e0f3fc',
            color: '#2878af',
            fontSize: '0.97em',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 80,
      render: (record) => (
        <Tooltip title="Remove seat">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size={isMobile ? "small" : "middle"}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontSize: isMobile ? 16 : 18 }}>🎫 Selected Seats</span>
        </Space>
      }
      placement="right"
      open={show}
      onClose={onHide}
      width={isMobile ? "100%" : 800}
      closeIcon={<CloseOutlined />}
      styles={{
        header: {
          borderBottom: '2px solid #f0f0f0',
          padding: isMobile ? '16px' : '20px 24px',
        },
        body: {
          padding: isMobile ? 8 : 16,
          background: '#f9fafb',
        },
      }}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            padding: '8px 0',
          }}
        >
          <Badge
            count={`₹${totalPrice.toFixed(2)}`}
            style={{
              backgroundColor: '#e0f3fc',
              color: '#2878af',
              fontSize: isMobile ? 16 : 18,
              fontWeight: 600,
              padding: isMobile ? '4px 12px' : '8px 16px',
              height: 'auto',
            }}
          />
          <Button onClick={onHide} size={isMobile ? "middle" : "large"}>
            Close
          </Button>
        </div>
      }
    >
      {selectedSeats.length === 0 ? (
        <Empty
          description="No seats selected"
          style={{
            marginTop: 60,
          }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={selectedSeats}
          rowKey="id"
          pagination={false}
          bordered
          size={isMobile ? "small" : "middle"}
          scroll={{ x: 650 }}
          rowClassName={(_, index) =>
            index % 2 ? 'ant-table-row-striped' : ''
          }
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        />
      )}

      <style jsx global>{`
        .ant-table-row-striped {
          background-color: #f6f9fc;
        }
        .ant-table-row-striped:hover > td {
          background-color: #e6f0ff !important;
        }
      `}</style>
    </Drawer>
  );
};

export default SelectedSeatsDrawer;

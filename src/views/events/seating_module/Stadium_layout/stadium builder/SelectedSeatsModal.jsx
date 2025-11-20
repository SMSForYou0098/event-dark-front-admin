import React from "react";
import { Drawer, Button, Table, Tooltip, Badge, Space, Typography, Empty, Tag, Card } from "antd";
import { DeleteOutlined, CloseOutlined, CheckCircleOutlined, HomeOutlined, AppstoreOutlined, LayoutOutlined } from "@ant-design/icons";

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
      render: (_, __, index) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: 'Seat',
      dataIndex: 'number',
      key: 'number',
      align: 'center',
      width: 80,
      render: (number) => (
        <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontWeight: 600 }}>
          {number}
        </Tag>
      ),
    },
    {
      title: 'Stand',
      key: 'stand',
      align: 'center',
      width: 120,
      render: (record) => (
        <Tag icon={<HomeOutlined />} color="geekblue">
          {record.stand?.name || '-'}
        </Tag>
      ),
    },
    {
      title: 'Tier',
      key: 'tier',
      align: 'center',
      width: 100,
      render: (record) => (
        <Tag icon={<AppstoreOutlined />} color="cyan">
          {record.tier?.name || '-'}
        </Tag>
      ),
    },
    {
      title: 'Section',
      key: 'section',
      align: 'center',
      width: 120,
      render: (record) => (
        <Tag icon={<LayoutOutlined />} color="orange">
          {record.section?.name || '-'}
        </Tag>
      ),
    },
    {
      title: 'Row',
      dataIndex: 'rowLabel',
      key: 'rowLabel',
      align: 'center',
      width: 100,
      render: (rowLabel) => (
        <Tag color="purple">
          {rowLabel}
        </Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'center',
      width: 120,
      render: (price) => (
        <Tag 
          color="gold"
          style={{
            fontSize: 14,
            fontWeight: 700,
            padding: '4px 12px',
          }}
        >
          ₹{price?.toLocaleString() ?? 0}
        </Tag>
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
            style={{
              color: '#ff4d4f',
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space>
            <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
            <Text strong style={{ fontSize: isMobile ? 16 : 18, color: 'var(--text-white)' }}>
              Selected Seats
            </Text>
          </Space>
          <Tag color="blue" style={{ fontSize: 13 }}>
            {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
          </Tag>
        </Space>
      }
      placement="right"
      open={show}
      onClose={onHide}
      width={isMobile ? "100%" : 900}
      closeIcon={<CloseOutlined />}
      styles={{
        header: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: 'none',
          padding: isMobile ? '16px' : '20px 24px',
        },
        body: {
          padding: isMobile ? 12 : 24,
          background: 'var(--body-bg)',
        },
      }}
      footer={
        <Card
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            borderRadius: 12,
          }}
          bodyStyle={{
            padding: isMobile ? 12 : 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <Space direction="vertical" size={4}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                Total Amount
              </Text>
              <Text 
                strong 
                style={{ 
                  color: '#fff', 
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                ₹{totalPrice.toLocaleString('en-IN')}
              </Text>
            </Space>
            <Button 
              onClick={onHide} 
              size="large"
              style={{
                background: '#fff',
                border: 'none',
                color: '#f5576c',
                fontWeight: 600,
                height: isMobile ? 40 : 48,
                padding: '0 32px',
                borderRadius: 8,
              }}
            >
              Close
            </Button>
          </div>
        </Card>
      }
    >
      {selectedSeats.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical" size={8}>
              <Text type="secondary">No seats selected yet</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Click on available seats to add them to your selection
              </Text>
            </Space>
          }
          style={{
            marginTop: 60,
          }}
        />
      ) : (
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid var(--border-secondary)',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={selectedSeats}
            rowKey="id"
            pagination={false}
            size={isMobile ? "small" : "middle"}
            scroll={{ x: 800 }}
            rowClassName={(_, index) =>
              index % 2 ? 'ant-table-row-striped' : ''
            }
            style={{
              borderRadius: 12,
              overflow: 'hidden',
            }}
          />
        </Card>
      )}

      <style jsx global>{`
        .ant-table-row-striped {
          background-color: #f6f9fc;
        }
        .ant-table-row-striped:hover > td {
          background-color: #e6f0ff !important;
        }
        .ant-table-row:hover > td {
          background-color: #f0f7ff !important;
        }
      `}</style>
    </Drawer>
  );
};

export default SelectedSeatsDrawer;

// TicketsStep.jsx
import React from 'react';
import { Form, Input, Button, Table, Space, Row, Col, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const TicketsStep = ({ tickets, onAddTicket, onDeleteTicket }) => {
  const columns = [
    { title: 'Ticket Name', dataIndex: 'name', key: 'name', width: '30%' },
    { title: 'Price (₹)', dataIndex: 'price', key: 'price', width: '25%' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: '25%' },
    {
      title: 'Action',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDeleteTicket(record.key)}
        >
          Delete
        </Button>
      ),
    },
  ];

  const toChecked = (v) => v === 1 || v === '1';
  const toNumber = (checked) => (checked ? 1 : 0);

  const switchFields = [
    { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans' },
    { name: 'ticket_system', label: 'Booking By Ticket' },
    { name: 'bookingBySeat', label: 'Booking By Seat' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddTicket}
          style={{ marginBottom: 16 }}
        >
          Add Ticket
        </Button>

        {/* Equal width columns */}
        <Row gutter={[16, 16]}>
          {/* Left: Table */}
          <Col xs={24} md={12}>
            <Table
              columns={columns}
              dataSource={tickets}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              rowKey="key"
            />
          </Col>

          {/* Right: Switches */}
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              {switchFields.map((f) => (
                <Col xs={24} sm={8} key={f.name}>
                  <Form.Item
                    name={f.name}
                    label={f.label}
                    tooltip={f.tooltip}
                    valuePropName="checked"
                    getValueProps={(v) => ({ checked: toChecked(v) })}
                    getValueFromEvent={toNumber}
                    initialValue={0}
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>

      <Form.Item
        name="ticket_terms"
        label="Ticket Terms & Conditions"
        rules={[{ required: true, message: 'Please enter ticket terms' }]}
      >
        <TextArea
          rows={6}
          placeholder="Enter ticket terms and conditions..."
          showCount
          maxLength={1000}
        />
      </Form.Item>
    </Space>
  );
};

export default TicketsStep;

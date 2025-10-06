// TicketsStep.jsx
import React from 'react';
import { Form, Input, Button, Table, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const TicketsStep = ({ tickets, onAddTicket, onDeleteTicket }) => {
    const columns = [
        {
            title: 'Ticket Name',
            dataIndex: 'name',
            key: 'name',
            width: '30%'
        },
        {
            title: 'Price (₹)',
            dataIndex: 'price',
            key: 'price',
            width: '25%'
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '25%'
        },
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
            )
        },
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
                <Table
                    columns={columns}
                    dataSource={tickets}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                />
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
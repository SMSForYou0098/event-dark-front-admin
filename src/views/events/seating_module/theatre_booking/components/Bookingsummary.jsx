import React from 'react';
import { Card, Button, Empty, Divider, Space, Tag, List, Typography } from 'antd';
import {
    DeleteOutlined,
    ShoppingCartOutlined,
    ClearOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const BookingSummary = ({
    selectedSeats,
    totalAmount,
    ticketCategoryCounts,
    onRemoveSeat,
    onClearSelection,
    onProceedToCheckout
}) => {
    if (selectedSeats.length === 0) {
        return (
            <Card title="Your Selection" className="booking-summary-card">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            No seats selected<br />
                            <small className="text-muted">Click on available seats to select</small>
                        </span>
                    }
                />
            </Card>
        );
    }

    return (
        <Card
            title={
                <div className="d-flex justify-content-between align-items-center">
                    <span>Your Selection</span>
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<ClearOutlined />}
                        onClick={onClearSelection}
                    >
                        Clear All
                    </Button>
                </div>
            }
            className="booking-summary-card"
        >
            {/* Ticket Category Summary */}
            <div className="mb-3">
                <Text strong className="d-block mb-2">Ticket Summary:</Text>
                {Object.entries(ticketCategoryCounts).map(([name, data]) => (
                    <div key={name} className="d-flex justify-content-between align-items-center mb-2">
                        <Space>
                            <Tag color="blue">{name}</Tag>
                            <Text>× {data.count}</Text>
                        </Space>
                        <Text strong>₹{(data.price * data.count).toFixed(2)}</Text>
                    </div>
                ))}
            </div>

            <Divider className="my-3" />

            {/* Selected Seats List */}
            <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Text strong className="d-block mb-2">Selected Seats ({selectedSeats.length}):</Text>
                <List
                    size="small"
                    dataSource={selectedSeats}
                    renderItem={(seat) => (
                        <List.Item
                            className="px-2 py-1"
                            style={{
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div className="d-flex justify-content-between align-items-center w-100">
                                <div className="flex-grow-1">
                                    <Text strong className="d-block" style={{ fontSize: '13px' }}>
                                        {seat.sectionName} - Row {seat.rowTitle}
                                    </Text>
                                    <Space size={4}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            Seat {seat.number}
                                        </Text>
                                        {seat.ticket && (
                                            <>
                                                <Text type="secondary">•</Text>
                                                <Tag
                                                    color="blue"
                                                    style={{ fontSize: '11px', margin: 0, padding: '0 4px' }}
                                                >
                                                    {seat.ticket.name}
                                                </Tag>
                                            </>
                                        )}
                                    </Space>
                                    {seat.ticket && (
                                        <Text strong className="d-block" style={{ fontSize: '13px', color: '#52c41a' }}>
                                            ₹{parseFloat(seat.ticket.price).toFixed(2)}
                                        </Text>
                                    )}
                                </div>
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => onRemoveSeat(seat.id, seat.sectionId, seat.rowId)}
                                />
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            <Divider className="my-3" />

            {/* Total Section */}
            <div className="bg-light p-3 rounded mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Text>Subtotal:</Text>
                    <Text>₹{totalAmount.toFixed(2)}</Text>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Text>Booking Fee:</Text>
                    <Text>₹0.00</Text>
                </div>
                <Divider className="my-2" />
                <div className="d-flex justify-content-between align-items-center">
                    <Title level={5} className="mb-0">Total:</Title>
                    <Title level={4} className="mb-0" style={{ color: '#52c41a' }}>
                        ₹{totalAmount.toFixed(2)}
                    </Title>
                </div>
            </div>

            {/* Checkout Button */}
            <Button
                type="primary"
                size="large"
                block
                icon={<ShoppingCartOutlined />}
                onClick={onProceedToCheckout}
            >
                Proceed to Checkout
            </Button>

            {/* Info Text */}
            <div className="mt-3 text-center">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Selected seats will be held for 10 minutes
                </Text>
            </div>
        </Card>
    );
};

export default BookingSummary;
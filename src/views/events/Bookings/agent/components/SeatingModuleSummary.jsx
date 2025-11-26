import React, { useState } from 'react';
import { Space, Typography, Divider, Tag, Card, Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { Ticket } from 'lucide-react';
import Flex from 'components/shared-components/Flex';

const { Text, Title } = Typography;

const SeatingModuleSummary = ({ selectedTickets }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Return empty state if no tickets
    if (!selectedTickets || selectedTickets.length === 0) {
        return null
    }

    const totalQty = selectedTickets.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const totalPrice = selectedTickets.reduce((sum, t) => sum + (t.totalFinalAmount || 0), 0);

    return (
        <div className="position-relative">


            {/* Main Summary Card */}
            <Card bordered={false}>

                {/* Accordion Detail Panel - Opens Upward */}
                <div
                    className='glassmorphism-card'
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: showDetails ? '400px' : '0',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        boxShadow: 'none',
                    }}
                >
                    <div className="p-3" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        <Space direction="vertical" className="w-100" size="middle">
                            {selectedTickets.map((ticket) => (
                                <div key={ticket.id}>
                                    <Space direction="vertical" className="w-100" size="small">
                                        {/* Ticket Header */}
                                        <Space className="w-100 justify-content-between">
                                            <Flex alignItems="center" gap={10}>
                                                <Ticket className='text-warning' />
                                                <Text className="m-0">
                                                    {ticket.ticket?.name || ticket.category}
                                                </Text>
                                            </Flex>
                                            <Tag>
                                                {ticket.quantity} × ₹{ticket.price}
                                            </Tag>
                                        </Space>

                                        <Divider style={{ margin: '8px 0' }} />

                                        {/* Seats List */}

                                        <Flex justifyContent="space-between" alignItems="center">
                                            <Space>
                                                {ticket.seats?.map(seat => (
                                                    <Tag key={seat.seat_id} color="blue">
                                                        {seat.seat_name}
                                                    </Tag>
                                                ))}
                                            </Space>
                                            <Space className="w-100 justify-content-end mt-2">
                                                <Text type="secondary">Subtotal:</Text>
                                                <Text strong style={{ color: '#52c41a' }}>₹{ticket.totalFinalAmount}</Text>
                                            </Space>
                                        </Flex>

                                        {/* Ticket Total */}

                                    </Space>
                                </div>
                            ))}
                        </Space>
                    </div>
                </div>


                <Space direction="vertical" className="w-100" size="middle">
                    {/* Summary Row */}
                    <Space className="w-100 justify-content-between">
                        <Space>
                            <div className="text-center">
                                <Text>
                                    Tickets
                                </Text>
                                <Title level={3} className='m-0'>{totalQty}</Title>
                            </div>
                            <Divider type="vertical" style={{ height: '40px', borderColor: 'rgba(255,255,255,0.3)' }} />
                            <div className="text-center">
                                <Text>
                                    Total Amount
                                </Text>
                                <Title level={3} className='m-0'>₹{totalPrice}</Title>
                            </div>
                        </Space>
                        <Button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-center"
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        >
                            <Space>
                                <Text style={{ color: '#fff' }}>
                                    {showDetails ? 'Hide Details' : 'Show Details'}
                                </Text>
                                {showDetails ? <DownOutlined /> : <UpOutlined />}
                            </Space>
                        </Button>
                    </Space>
                </Space>
            </Card>
        </div>
    );
};

export default SeatingModuleSummary;
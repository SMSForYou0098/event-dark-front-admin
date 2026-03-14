import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Tag, Typography } from 'antd';
import { ExpandDataTable } from 'views/events/common/ExpandDataTable';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';

const { Title, Text } = Typography;

const AgentDetailedReport = () => {
    // Mock data based on user provided JSON, now as an array
    const reportDataArray = [
        {
            "event_id": "EVT001",
            "event_name": "Cricket Match 2026",
            "agent": {
                "agent_id": "AG001",
                "agent_name": "Raj Patel"
            },
            "summary": {
                "total_tickets": 700,
                "ticket_types": [
                    { "name": "gold", "quantity": 250 },
                    { "name": "silver", "quantity": 450 }
                ]
            },
            "last_7_days": [
                {
                    "id": "1",
                    "is_set": true,
                    "date": "2026-03-08",
                    "total": 80,
                    "bookings": [
                        { "id": "1-1", "name": "gold", "quantity": 30 },
                        { "id": "1-2", "name": "silver", "quantity": 50 }
                    ]
                },
                {
                    "id": "2",
                    "is_set": true,
                    "date": "2026-03-09",
                    "total": 95,
                    "bookings": [
                        { "id": "2-1", "name": "gold", "quantity": 35 },
                        { "id": "2-2", "name": "silver", "quantity": 60 }
                    ]
                },
                {
                    "id": "3",
                    "is_set": true,
                    "date": "2026-03-10",
                    "total": 120,
                    "bookings": [
                        { "id": "3-1", "name": "gold", "quantity": 45 },
                        { "id": "3-2", "name": "silver", "quantity": 75 }
                    ]
                },
                {
                    "id": "4",
                    "is_set": true,
                    "date": "2026-03-11",
                    "total": 110,
                    "bookings": [
                        { "id": "4-1", "name": "gold", "quantity": 40 },
                        { "id": "4-2", "name": "silver", "quantity": 70 }
                    ]
                },
                {
                    "id": "5",
                    "is_set": true,
                    "date": "2026-03-12",
                    "total": 140,
                    "bookings": [
                        { "id": "5-1", "name": "gold", "quantity": 55 },
                        { "id": "5-2", "name": "silver", "quantity": 85 }
                    ]
                },
                {
                    "id": "6",
                    "is_set": true,
                    "date": "2026-03-13",
                    "total": 90,
                    "bookings": [
                        { "id": "6-1", "name": "gold", "quantity": 25 },
                        { "id": "6-2", "name": "silver", "quantity": 65 }
                    ]
                },
                {
                    "id": "7",
                    "is_set": true,
                    "date": "2026-03-14",
                    "total": 65,
                    "bookings": [
                        { "id": "7-1", "name": "gold", "quantity": 20 },
                        { "id": "7-2", "name": "silver", "quantity": 45 }
                    ]
                }
            ]
        }
    ];

    const columns = useMemo(() => [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => (
                <span>
                    <CalendarOutlined className="mr-2 text-primary" />
                    {date}
                </span>
            )
        },
        {
            title: 'Total Tickets',
            dataIndex: 'total',
            key: 'total',
            render: (total) => <Tag color="blue">{total} Tickets</Tag>
        }
    ], []);

    const innerColumns = useMemo(() => [
        {
            title: 'Ticket Type',
            dataIndex: 'name',
            key: 'name',
            render: (name) => <span style={{ textTransform: 'capitalize' }}>{name}</span>
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (qty) => <strong>{qty}</strong>
        }
    ], []);

    return (
        <div className="container-fluid">
            {reportDataArray.map((reportData, index) => (
                <div key={`${reportData.event_id}-${reportData.agent.agent_id}-${index}`} style={{ marginBottom: '40px' }}>
                    <Flex justifyContent="space-between" alignItems="center" className="mb-4">
                        <div>
                            <Title level={4} className="mb-0">{reportData.event_name}</Title>
                            <Text type="secondary">Event ID: {reportData.event_id}</Text>
                        </div>
                        <Card size="small" className="mb-0">
                            <Flex alignItems="center" gap={10}>
                                <UserOutlined style={{ fontSize: '20px', color: 'var(--primary-color)' }} />
                                <div>
                                    <div className="font-weight-bold">{reportData.agent.agent_name}</div>
                                    <div className="font-size-sm text-muted">Agent ID: {reportData.agent.agent_id}</div>
                                </div>
                            </Flex>
                        </Card>
                    </Flex>

                    <Row gutter={16} className="mb-4">
                        <Col xs={24} sm={8}>
                            <Card style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)' }}>
                                <Statistic
                                    title={<span style={{ color: '#8c8c8c' }}>Total Tickets Booked</span>}
                                    value={reportData.summary.total_tickets}
                                    // prefix={<TicketOutlined />}
                                    valueStyle={{ color: '#fff' }}
                                />
                            </Card>
                        </Col>
                        {reportData.summary.ticket_types.map((type, tIndex) => (
                            <Col xs={24} sm={8} key={tIndex}>
                                <Card style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)' }}>
                                    <Statistic
                                        title={<span style={{ color: '#8c8c8c' }}>{type.name.toUpperCase()} Tickets</span>}
                                        value={type.quantity}
                                        // prefix={<TicketOutlined style={{ color: type.name === 'gold' ? '#FFD700' : '#C0C0C0' }} />}
                                        valueStyle={{ color: '#fff' }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <ExpandDataTable
                        title="Daily Booking Breakdown (Last 7 Days)"
                        columns={columns}
                        innerColumns={innerColumns}
                        data={reportData.last_7_days}
                        loading={false}
                        showSearch={false}
                        tableProps={{
                            pagination: false,
                            size: 'middle'
                        }}
                    />

                    {/* Add a divider if it's not the last report */}
                    {index < reportDataArray.length - 1 && (
                        <div style={{ height: '2px', backgroundColor: 'var(--border-color)', margin: '40px 0', opacity: 0.5 }} />
                    )}
                </div>
            ))}
        </div>
    );
};

export default AgentDetailedReport;

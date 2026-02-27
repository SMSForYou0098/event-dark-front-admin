import React, { useState, useMemo } from 'react';
import { Card, Col, Row, Alert, DatePicker, Tag, Typography, Space, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import apiClient from 'auth/FetchInterceptor';
import Loader from 'utils/Loader';
import dayjs from 'dayjs';
import { CalendarOutlined, DollarOutlined, ShoppingCartOutlined, CreditCardOutlined } from '@ant-design/icons';
import DataTable from 'views/events/common/DataTable';
import Utils from 'utils';
import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';

const { Title, Text } = Typography;

// Gateway color configuration - Dark theme colors
const gatewayColors = {
    cashfree: { primary: '#4f46e5', gradient: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' },
    easebuzz: { primary: '#059669', gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' },
    razorpay: { primary: '#2563eb', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)' },
};

const GatewayReport = () => {
    const { UserData } = useMyContext();
    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    // Fetch organizer events report using TanStack Query
    const {
        data: reportData,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['organizer-events-report', UserData?.id, selectedMonth.format('YYYY-MM')],
        queryFn: async () => {
            const response = await apiClient.get(`payment-gateway-report?month=${selectedMonth.format('YYYY-MM')}`);
            return response;
        },
        enabled: Boolean(UserData?.id),
        staleTime: 5 * 60 * 1000,
    });

    // Handle month change
    const handleMonthChange = (date) => {
        if (date) {
            setSelectedMonth(date);
        }
    };

    // Calculate gateway totals
    const gatewayTotals = useMemo(() => {
        if (!reportData?.data?.report) return {};

        const totals = {};
        const gateways = reportData?.data?.unique_gateways || [];

        gateways.forEach(gateway => {
            totals[gateway] = { amount: 0, bookings: 0 };
        });

        reportData.data.report.forEach(item => {
            gateways.forEach(gateway => {
                if (item[gateway]) {
                    totals[gateway].amount += item[gateway].amount || 0;
                    totals[gateway].bookings += item[gateway].bookings || 0;
                }
            });
        });

        return totals;
    }, [reportData]);

    // Table columns
    const columns = useMemo(() => {
        const baseColumns = [
            {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                fixed: 'left',
                width: 120,
                render: (date) => (
                    <Space>
                        <CalendarOutlined style={{ color: '#6b7280' }} />
                        <Text strong>{date}</Text>
                    </Space>
                ),
            },
        ];

        const gateways = reportData?.data?.unique_gateways || [];
        gateways.forEach(gateway => {
            const color = gatewayColors[gateway]?.primary || '#6b7280';
            baseColumns.push({
                title: (
                    <span style={{ textTransform: 'capitalize', color }}>
                        {gateway}
                    </span>
                ),
                children: [
                    {
                        title: 'Amount',
                        dataIndex: [gateway, 'amount'],
                        key: `${gateway}_amount`,
                        width: 100,
                        align: 'center',
                        render: (amount) => (
                            amount !== undefined ? (
                                <Tag color={color} style={{ minWidth: 60, textAlign: 'center' }}>
                                    ₹{amount}
                                </Tag>
                            ) : '-'
                        ),
                    },
                    {
                        title: 'Bookings',
                        dataIndex: [gateway, 'bookings'],
                        key: `${gateway}_bookings`,
                        width: 100,
                        align: 'center',
                        render: (bookings) => (
                            bookings !== undefined ? (
                                <Text strong>{bookings}</Text>
                            ) : '-'
                        ),
                    },
                ],
            });
        });

        return baseColumns;
    }, [reportData]);

    // Table data
    const tableData = useMemo(() => {
        return (reportData?.data?.report || []).map((item, index) => ({
            key: index,
            ...item,
        }));
    }, [reportData]);

    if (isLoading) {
        return <Loader />;
    }

    if (isError) {
        return (
            <Row>
                <Col span={24}>
                    <Alert
                        message="Error Loading Report"
                        description={Utils.getErrorMessage(error)}
                        type="error"
                        showIcon
                    />
                </Col>
            </Row>
        );
    }

    const gateways = reportData?.data?.unique_gateways || [];
    const hasData = reportData?.data?.report?.length > 0;

    return (
        <PermissionChecker permission={PERMISSIONS.VIEW_GATEWAY}>
            <Row gutter={[16, 16]}>
                {/* Header with Date Picker */}
                <Col span={24}>
                    <Card bordered={false}>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Space direction="vertical" size={0}>
                                    <Title level={4} style={{ margin: 0 }}>Payment Gateway Report</Title>
                                    {reportData?.data?.month && (
                                        <Text type="secondary">
                                            {reportData.data.start_date} to {reportData.data.end_date}
                                        </Text>
                                    )}
                                </Space>
                            </Col>
                            <Col>
                                <Space>
                                    <Text strong>Select Month:</Text>
                                    <DatePicker
                                        picker="month"
                                        value={selectedMonth}
                                        onChange={handleMonthChange}
                                        format="MMMM YYYY"
                                        allowClear={false}
                                        style={{ width: 180 }}
                                        disabledDate={(current) => current && current > dayjs().endOf('month')}
                                    />
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Gateway Summary Cards */}
                {gateways.map((gateway) => {
                    const color = gatewayColors[gateway] || { primary: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' };
                    const totals = gatewayTotals[gateway] || { amount: 0, bookings: 0 };

                    return (
                        <Col xs={24} sm={12} lg={8} key={gateway}>
                            <Card
                                bordered={false}
                                style={{
                                    background: color.gradient,
                                    borderRadius: 12,
                                }}
                                styles={{ body: { padding: '20px 24px' } }}
                            >
                                <Row gutter={16} align="middle">
                                    <Col flex="auto">
                                        <Space direction="vertical" size={4}>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                                                {gateway}
                                            </Text>
                                            <Title level={3} style={{ color: '#fff', margin: 0 }}>
                                                ₹{totals.amount.toLocaleString()}
                                            </Title>
                                            <Space size={16}>
                                                <Space size={4}>
                                                    <ShoppingCartOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />
                                                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                                                        {totals.bookings} bookings
                                                    </Text>
                                                </Space>
                                            </Space>
                                        </Space>
                                    </Col>
                                    <Col>
                                        <div style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <CreditCardOutlined style={{ fontSize: 28, color: '#fff' }} />
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    );
                })}

                {/* Report Table */}
                <Col span={24}>
                    {hasData ? (
                        <DataTable
                            title="Daily Breakdown"
                            data={tableData}
                            columns={columns}
                            showSearch={false}
                            defaultPageSize={10}
                            emptyText={`No transactions found for ${selectedMonth.format('MMMM YYYY')}`}
                        />
                    ) : (
                        <Card>
                            <Empty
                                description={
                                    <Text type="secondary">
                                        No transactions found for {selectedMonth.format('MMMM YYYY')}
                                    </Text>
                                }
                            />
                        </Card>
                    )}
                </Col>
            </Row>
        </PermissionChecker>
    );
};

export default GatewayReport;

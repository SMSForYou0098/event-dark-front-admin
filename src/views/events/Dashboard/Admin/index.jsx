import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Table, Typography, Tag, Skeleton, Alert, Divider, Select } from 'antd';
import { UserOutlined, TeamOutlined, ShoppingOutlined, DollarOutlined, ShopOutlined, IdcardOutlined, TrophyOutlined, ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LineChartOutlined, WalletOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';
import { useEffect } from 'react';
import ChartWidget from 'components/ChartWidget';
import { COLORS } from 'constants/ChartConstant';

const { Title, Text } = Typography;

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

const DashboardContent = ({ UserData }) => {
    // Fetch functions
    const fetchBookingData = async () => {
        try {
            const response = await api.get(`bookingCount/${UserData?.id}`);
            return response;
        } catch (error) {
            throw new Error('Failed to fetch booking data');
        }
    };

    const fetchSalesData = async () => {
        try {
            const response = await api.get(`calculateSale/${UserData?.id}`);
            return response;
        } catch (error) {
            throw new Error('Failed to fetch sales data');
        }
    };

    const { data: bookingData, isLoading: bookingLoading, error: bookingError } = useQuery({
        queryKey: ['bookingData', UserData?.id],
        queryFn: fetchBookingData,
        enabled: !!UserData?.id, // Only run query if UserData.id exists
    });

    const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
        queryKey: ['salesData', UserData?.id],
        queryFn: fetchSalesData,
        enabled: !!UserData?.id, // Only run query if UserData.id exists
    });

    useEffect(() => {
        if (bookingData) {
            console.log(bookingData)
        }
        if (salesData) {
            console.log(salesData)
        }
    }, [salesData, bookingData])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Check if UserData is missing
    if (!UserData?.id) {
        return (
            <div className="p-4">
                <Alert
                    message="Missing User Data"
                    description="User information is required to load the dashboard."
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    const isLoading = bookingLoading || salesLoading;
    const error = bookingError || salesError;

    if (error) {
        return (
            <div className="p-4">
                <Alert
                    message="Error"
                    description={error.message}
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-4">
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    // Additional safety check - ensure data exists before rendering
    if (!bookingData || !salesData) {
        return (
            <div className="p-4">
                <Alert
                    message="No Data Available"
                    description="Unable to load dashboard data. Please try again later."
                    type="info"
                    showIcon
                />
            </div>
        );
    }

    const bookingStats = [
        {
            title: 'Online Bookings',
            value: bookingData.onlineBookings || 0,
            icon: <ShoppingOutlined />,
            // color: '#1890ff',
            // suffix: 'bookings'
        },
        {
            title: 'Online Tickets',
            value: bookingData.onlineBookingsTicket || 0,
            icon: <LineChartOutlined />,
            // color: '#52c41a',
            // suffix: 'tickets'
        },
        {
            title: 'Offline Bookings',
            value: bookingData.offlineBookings || 0,
            icon: <ShopOutlined />,
            // color: '#722ed1',
            // suffix: 'bookings'
        },
        {
            title: 'Offline Tickets',
            value: bookingData.offlineBookingsTicket || 0,
            icon: <LineChartOutlined />,
            // color: '#fa8c16',
            // suffix: 'tickets'
        }
    ];

    const userStats = [
        {
            title: 'Total Users',
            value: bookingData.userCount || 0,
            icon: <UserOutlined />,
            // color: '#1890ff'
        },
        {
            title: 'Agents',
            value: bookingData.agentCount || 0,
            icon: <IdcardOutlined />,
            // color: '#52c41a'
        },
        {
            title: 'Sponsors',
            value: bookingData.sponsorCount || 0,
            icon: <TrophyOutlined />,
            // color: '#faad14'
        },
        {
            title: 'POS',
            value: bookingData.posCount || 0,
            icon: <ShopOutlined />,
            // color: '#722ed1'
        },
        {
            title: 'Organizers',
            value: bookingData.organizerCount || 0,
            icon: <TeamOutlined />,
            // color: '#eb2f96'
        },
        {
            title: 'Scanners',
            value: bookingData.scannerCount || 0,
            icon: <ScanOutlined />,
            // color: '#13c2c2'
        }
    ];

    const revenueStats = [
        {
            title: 'POS Amount',
            value: salesData.posAmount || 0,
            color: '#1890ff'
        },
        {
            title: 'Online Amount',
            value: salesData.onlineAmount || 0,
            color: '#52c41a'
        },
        {
            title: 'Offline Amount',
            value: salesData.offlineAmount || 0,
            color: '#722ed1'
        },
        {
            title: 'Agent Booking',
            value: salesData.agentBooking || 0,
            color: '#fa8c16'
        },
        {
            title: 'Sponsor Booking',
            value: salesData.sponsorBooking || 0,
            color: '#eb2f96'
        }
    ];

    const gatewayData = salesData.activeGateways
        ? Object.entries(salesData.activeGateways).map(([key, value]) => ({
            gateway: key.charAt(0).toUpperCase() + key.slice(1),
            status: value,
            amount: salesData[`${key}TotalAmount`] || 0
        }))
        : [];

    const gatewayColumns = [
        {
            title: 'Payment Gateway',
            dataIndex: 'gateway',
            key: 'gateway',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag
                    icon={status ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={status ? 'success' : 'error'}
                >
                    {status ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => formatCurrency(amount)
        }
    ];

    const discountData = [
        { type: 'Online Discount', amount: salesData.onlineDiscount || 0 },
        { type: 'Offline Discount', amount: salesData.offlineDiscount || 0 }
    ];

    const cncData = [
        { type: 'Agent CNC', amount: salesData.agentCNC || 0 },
        { type: 'Online CNC', amount: salesData.onlineCNC || 0 },
        { type: 'Offline CNC', amount: salesData.offlineCNC || 0 },
        { type: 'POS CNC', amount: salesData.posCNC || 0 }
    ];

    const getLast7DaysWeekdays = () => {
        const categories = ["S", "M", "T", "W", "T", "F", "S"];
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - i);
            const dayIndex = pastDate.getDay();
            result.push(categories[dayIndex]);
        }

        return result;
    };

    const bookingStatsData = {
        series: [
            {
                name: salesData?.salesDataNew[0]?.name,
                data: salesData?.salesDataNew[0]?.data
            },
            {
                name: salesData?.salesDataNew[1]?.name,
                data: salesData?.salesDataNew[1]?.data
            }
        ],
        categories: getLast7DaysWeekdays()
    }
    const concvStatsData = {
        series: [
            {
                name: salesData?.convenienceFee[0]?.name,
                data: salesData?.convenienceFee[0]?.data
            },
            {
                name: salesData?.convenienceFee[1]?.name,
                data: salesData?.convenienceFee[1]?.data
            }
        ],
        categories: getLast7DaysWeekdays()
    }

    return (
        <div className="container-fluid p-4 bg-light min-vh-100">
            {/* Booking Statistics */}
            <Title level={4} className="mt-0 mb-3">
                Booking Statistics
            </Title>
            <Row gutter={[16, 16]} className="mb-4">
                {bookingStats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card bordered={false} className="border-start border-4">
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.icon}
                                suffix={stat.suffix}
                                valueStyle={{ color: stat.color, fontSize: '24px' }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Divider />

            {/* User Management Statistics */}
            <Title level={4} className="mb-3">
                User Management
            </Title>
            <Row gutter={[16, 16]} className="mb-4">
                {userStats.map((stat, index) => (
                    <Col xs={12} sm={8} lg={4} key={index}>
                        <Card bordered={false} hoverable>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.icon}
                                valueStyle={{ color: stat.color }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Divider />

            {/* Revenue Statistics */}
            <Title level={4} className="mb-3">
                Revenue Overview
            </Title>
            <Row gutter={[16, 16]} className="mb-4">
                {revenueStats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={8} xl={Math.floor(24 / revenueStats.length)} key={index}>
                        <Card bordered={false} className="border-top border-3">
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={<WalletOutlined />}
                                valueStyle={{ color: stat.color, fontWeight: 'bold' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Divider />

            {/* Payment Gateways & Discounts */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} lg={12}>
                    <Card title="Payment Gateways" bordered={false} className="h-100">
                        <Table
                            dataSource={gatewayData}
                            columns={gatewayColumns}
                            pagination={false}
                            size="small"
                            rowKey="gateway"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Discounts & CNC" bordered={false} className="h-100">
                        <div className="mb-4">
                            <Text strong className="fs-6">Discounts</Text>
                            <div className="mt-2">
                                {discountData.map((item, index) => (
                                    <div key={index} className="d-flex justify-content-between mb-2">
                                        <Text>{item.type}</Text>
                                        <Text strong>{formatCurrency(item.amount)}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Divider className="my-3" />
                        <div>
                            <Text strong className="fs-6">Convenience Charges</Text>
                            <div className="mt-2">
                                {cncData.map((item, index) => (
                                    <div key={index} className="d-flex justify-content-between mb-2">
                                        <Text>{item.type}</Text>
                                        <Text strong>{formatCurrency(item.amount)}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Divider />

            {/* Sales Data Summary */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <ChartWidget
                        title="Weekly Bookings"
                        series={bookingStatsData?.series}
                        xAxis={bookingStatsData.categories}
                        height={'400px'}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <ChartWidget
                        title="Weekly Convenience Fee"
                        series={concvStatsData?.series}
                        xAxis={concvStatsData.categories}
                        height={'400px'}
                    />
                </Col>
            </Row>
        </div>
    );
};

const AdminDashboard = (props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <DashboardContent {...props} />
        </QueryClientProvider>
    );
};

export default AdminDashboard;
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Table, Typography, Tag, Skeleton, Alert, Divider, Switch, Carousel, Space } from 'antd';
import { UserOutlined, TeamOutlined, ShoppingOutlined, ShopOutlined, IdcardOutlined, TrophyOutlined, ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LineChartOutlined, SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';
import ChartWidget from 'components/ChartWidget';
import DataCard from './DataCard';
import { useMyContext } from 'Context/MyContextProvider';
import DashSkeleton from './DashSkeleton';

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
    const { isMobile } = useMyContext()
    const [showToday, setShowToday] = useState(true);
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
    console.log(bookingData);
    const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
        queryKey: ['salesData', UserData?.id],
        queryFn: fetchSalesData,
        enabled: !!UserData?.id, // Only run query if UserData.id exists
    });

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
        return <DashSkeleton />
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

    const eventStats = [
        {
            title: 'Ongoing',
            value: 123 || 0,
            icon: <SyncOutlined />,
            color: '#1890ff',
        },
        {
            title: 'Upcoming',
            value: 452 || 0,
            icon: <ClockCircleOutlined />,
            color: '#52c41a',
        },
        {
            title: 'Successful',
            value: 899 || 0,
            icon: <CheckCircleOutlined />,
            color: '#fa8c16',
        }
    ];

    const bookingStats = [
        {
            title: 'Online Bookings',
            value: bookingData.onlineBookings || 0,
            icon: <ShoppingOutlined />,
            color: '#1890ff',
            // suffix: 'bookings'
        },
        {
            title: 'Online Tickets',
            value: bookingData.onlineBookingsTicket || 0,
            icon: <LineChartOutlined />,
            color: '#52c41a',
            // suffix: 'tickets'
        },
        {
            title: 'Offline Bookings',
            value: bookingData.offlineBookings || 0,
            icon: <ShopOutlined />,
            color: '#722ed1',
            // suffix: 'bookings'
        },
        {
            title: 'Offline Tickets',
            value: bookingData.offlineBookingsTicket || 0,
            icon: <LineChartOutlined />,
            color: '#fa8c16',
            // suffix: 'tickets'
        }
    ];

    const userStats = [
        {
            title: 'Total Users',
            value: bookingData.userCount || 0,
            icon: <UserOutlined />,
            color: '#1890ff'
        },
        {
            title: 'Agents',
            value: bookingData.agentCount || 0,
            icon: <IdcardOutlined />,
            color: '#52c41a'
        },
        {
            title: 'Sponsors',
            value: bookingData.sponsorCount || 0,
            icon: <TrophyOutlined />,
            color: '#faad14'
        },
        {
            title: 'POS',
            value: bookingData.posCount || 0,
            icon: <ShopOutlined />,
            color: '#722ed1'
        },
        {
            title: 'Organizers',
            value: bookingData.organizerCount || 0,
            icon: <TeamOutlined />,
            color: '#eb2f96'
        },
        {
            title: 'Scanners',
            value: bookingData.scannerCount || 0,
            icon: <ScanOutlined />,
            color: '#13c2c2'
        }
    ];

    const revenueStats = [
        {
            title: 'Online Amount',
            value: salesData.onlineAmount || 0,
            color: '#52c41a'
        },
        {
            title: 'POS Amount',
            value: salesData.posAmount || 0,
            color: '#1890ff'
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
        },
        {
            title: 'Total Offline Amount',
            value: salesData.offlineAmount || 0,
            color: '#722ed1'
        },
    ];

    const gatewayData = salesData.pgData
        ? Object.entries(salesData.pgData).map(([key, value]) => ({
            key, // optional key
            gateway: key.charAt(0).toUpperCase() + key.slice(1),
            active: value.active,
            today_total: value.today_total,
            all_total: value.all_total,
        }))
        : [];

    const gatewayColumns = [
        {
            title: 'Payment Gateway',
            dataIndex: 'gateway',
            key: 'gateway',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            render: (active) => (
                <Tag
                    icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={active ? 'success' : 'error'}
                >
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Today Collection',
            dataIndex: 'today_total',
            key: 'today_total',
            render: (amount) => formatCurrency(amount),
        },
        {
            title: 'Overall Collection',
            dataIndex: 'all_total',
            key: 'all_total',
            render: (amount) => formatCurrency(amount),
        },
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

    // graph data format 
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

    const StatSection = ({ title, stats, colConfig, extraHeader, containerCol = { xs: 24, md: 24 } }) => {
        const renderCard = (stat, index) => <DataCard data={stat} value={stat.value} key={`card-${index}`} />;

        const renderContent = () => {
            if (isMobile) {
                return (
                    <Col span={24}>
                        <Carousel dots swipeToSlide draggable>
                            {stats.map((stat, index) => (
                                <div key={`carousel-${index}`} style={{ padding: '0 8px' }}>
                                    {renderCard(stat, index)}
                                </div>
                            ))}
                        </Carousel>
                    </Col>
                );
            }

            return stats.map((stat, index) => (
                <Col {...colConfig} key={`col-${index}`}>
                    {renderCard(stat, index)}
                </Col>
            ));
        };

        return (
            <Col {...containerCol}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Title level={4} className={extraHeader ? 'd-flex justify-content-between mb-3' : 'mt-0 mb-3'}>
                            {title}
                            {extraHeader}
                        </Title>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[16, 16]}>
                            {renderContent()}
                        </Row>
                    </Col>
                </Row>
            </Col>
        );
    };

    return (
        <div className="container-fluid p-4 bg-light min-vh-100">
            {/* Booking Statistics */}
            <Row gutter={[24, 24]}>

                {/* Revenue Section */}
                <StatSection
                    title="Revenue Overview"
                    stats={revenueStats}
                    colConfig={{ xs: 24, sm: 12, md: 8, lg: 6, xl: 4, style: { flex: '1 1 20%', maxWidth: isMobile ? '100%' : '20%' } }}
                    extraHeader={
                        <Switch
                            checked={showToday}
                            onChange={(checked) => setShowToday(checked)}
                            checkedChildren="Today"
                            unCheckedChildren="Overall"
                        />
                    }
                />

                {/* Booking Statistics Section */}
                <StatSection
                    title="Booking Statistics"
                    stats={bookingStats}
                    colConfig={{ xs: 24, sm: 12, lg: 6 }}
                    containerCol={{ xs: 24, md: 12 }}
                />

                {/* Event Info Section */}
                <StatSection
                    title="Events Info"
                    stats={eventStats}
                    colConfig={{ xs: 24, sm: 12, lg: 8 }}
                    containerCol={{ xs: 24, md: 12 }}
                />

                {/* User Management Section */}
                <StatSection
                    title="User Management"
                    stats={userStats}
                    colConfig={{ xs: 24, sm: 12, lg: 4 }}
                />

            </Row>

            <Divider />
            {/* Payment Gateways & Discounts */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <ChartWidget
                        title="Weekly Bookings"
                        series={bookingStatsData?.series}
                        xAxis={bookingStatsData.categories}
                        height={'300px'}
                        type='area'
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <Card bordered={false}>
                        <Table
                            dataSource={gatewayData}
                            columns={gatewayColumns}
                            pagination={false}
                            size="small"
                            rowKey="gateway"
                        />
                    </Card>
                </Col>

            </Row>

            <Divider />

            {/* Sales Data Summary */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <ChartWidget
                        type='area'
                        title="Weekly Convenience Fee"
                        series={concvStatsData?.series}
                        xAxis={concvStatsData.categories}
                        height={'300px'}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Discounts & Convenience Fee" bordered={false}>
                        <div>
                            <Text strong className="fs-6">Discounts</Text>
                            <div className="mt-2">
                                {discountData.map((item, index) => (
                                    <div key={index} className="d-flex justify-content-between">
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
                                    <div key={index} className="d-flex justify-content-between">
                                        <Text>{item.type}</Text>
                                        <Text strong>{formatCurrency(item.amount)}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
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
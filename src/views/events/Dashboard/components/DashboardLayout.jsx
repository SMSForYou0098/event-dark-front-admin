import React, { useState } from 'react';
import { Row, Col, Divider, Switch, Alert } from 'antd';
import { useMyContext } from 'Context/MyContextProvider';
import ChartWidget from 'components/ChartWidget';
import StatSection from './StatSection';
import PaymentGatewayTable from './PaymentGatewayTable';
import DiscountCard from './DiscountCard';
import { getBookingStats, getCncData, getDiscountData, getEventStats, getGatewayColumns, getGatewayData, getRevenueStats, getUserStats } from './dashboardConfig';
import DashSkeleton from '../Admin/DashSkeleton';
import { useDashboardData } from './useDashboardData';
import OrganizerSummary from './OrganizerSummary';
import { organizerSummary, organizerTickets } from './dummyData';
import EventTicketsSummary from './EventTicketsSummary';
import GatewayWiseSales from './GatewayWiseSales';

const DashboardLayout = ({ userId, showUserManagement = true, userRole }) => {
    const { isMobile } = useMyContext();
    const [showToday, setShowToday] = useState(true);
    
    const { bookingData, salesData, isLoading, error } = useDashboardData(userId);
 
    // TEMPORARY: Hardcoded gateway-wise sales data (API not yet developed)
    // TODO: Uncomment when API endpoint 'gateway-wise-sales' is ready
    const gatewayWiseSalesData = {
        gatewayWise: [
            {
                label: "PhonePe",
                today: { count: 0, amount: 0 },
                yesterday: { count: 0, amount: 0 },
                total: { count: 0, amount: 0 }
            },
            {
                label: "Easebuzz",
                today: { count: 17, amount: 18094 },
                yesterday: { count: 33, amount: 42089 },
                total: { count: 50, amount: 60183 }
            },
            {
                label: "Razorpay",
                today: { count: 20, amount: 12984 },
                yesterday: { count: 19, amount: 16691 },
                total: { count: 39, amount: 29675 }
            },
            {
                label: "Cashfree",
                today: { count: 4, amount: 5000 },
                yesterday: { count: 13, amount: 10493 },
                total: { count: 17, amount: 15493 }
            }
        ],
        channelTotals: [
            {
                label: "POS",
                today: { count: 0, amount: 0 },
                yesterday: { count: 41, amount: 11039 },
                total: { count: 41, amount: 11039 }
            },
            {
                label: "Agent",
                today: { count: 0, amount: 0 },
                yesterday: { count: 232, amount: 5617 },
                total: { count: 232, amount: 5617 }
            },
            {
                label: "Sponsor",
                today: { count: 86, amount: 223514 },
                yesterday: { count: 1, amount: 2599 },
                total: { count: 87, amount: 226113 }
            },
            {
                label: "Online",
                today: { count: 58, amount: 36078 },
                yesterday: { count: 144, amount: 69273 },
                total: { count: 202, amount: 105351 }
            },
            {
                label: "Offline",
                today: { count: 0, amount: 0 },
                yesterday: { count: 273, amount: 16656 },
                total: { count: 273, amount: 16656 }
            }
        ]
    };

    /* TODO: Replace hardcoded data with API call when backend is ready
    const fetchGatewayWiseSales = async () => {
        try {
            const response = await apiClient.get(`gateway-wise-sales/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch gateway-wise sales:', error);
            return null;
        }
    };
    */
 
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

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

    if (!userId) {
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
        return <DashSkeleton />;
    }

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
    // console.log(salesData, 'salesData')
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
    };

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
    };

    return (
        <div className="container-fluid p-4 bg-light min-vh-100">
            <Row gutter={[24, 24]}>
                {/* Revenue Section */}
                <StatSection
                    title="Revenue Overview"
                    stats={getRevenueStats(salesData)}
                    colConfig={{ 
                        xs: 24, 
                        sm: 12, 
                        md: 8, 
                        lg: 6, 
                        xl: 4, 
                        style: { flex: '1 1 20%', maxWidth: isMobile ? '100%' : '20%' } 
                    }}
                    extraHeader={
                        <Switch
                            checked={showToday}
                            onChange={(checked) => setShowToday(checked)}
                            checkedChildren="Today"
                            unCheckedChildren="Overall"
                        />
                    }
                    isMobile={isMobile}
                />

                {/* Booking Statistics Section */}
                <StatSection
                    title="Booking Statistics"
                    stats={getBookingStats(bookingData)}
                    colConfig={{ xs: 24, sm: 12, lg: 6 }}
                    containerCol={{ xs: 24, md: 12 }}
                    isMobile={isMobile}
                />

                {/* Event Info Section */}
                <StatSection
                    title="Events Info"
                    stats={getEventStats(bookingData)}
                    colConfig={{ xs: 24, sm: 12, lg: 8 }}
                    containerCol={{ xs: 24, md: 12 }}
                    isMobile={isMobile}
                />

                {/* User Management Section - Conditional */}
                {showUserManagement && (
                    <StatSection
                        title="User Management"
                        stats={getUserStats(bookingData)}
                        colConfig={{ xs: 24, sm: 12, lg: 4 }}
                        isMobile={isMobile}
                    />
                )}

                {/* Gateway Wise Sales Section */}
                <Col xs={24}>
                    <GatewayWiseSales 
                        gatewayData={gatewayWiseSalesData.gatewayWise}
                        channelData={gatewayWiseSalesData.channelTotals}
                        formatCurrency={formatCurrency}
                        showToday={showToday}
                    />
                </Col>
            </Row>

            <Divider />

            {/* Payment Gateways & Charts */}
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
                {userRole==='Admin' && 
                <Col xs={24} lg={12}>
                    <PaymentGatewayTable
                        data={getGatewayData(salesData.pgData)}
                        columns={getGatewayColumns(formatCurrency)}
                    />
                </Col>
                }
            </Row>

            <Divider />

            {/* Convenience Fee & Discounts */}
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
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <DiscountCard
                                title="Discounts"
                                data={getDiscountData(salesData)}
                                formatCurrency={formatCurrency}
                            />
                        </Col>
                        <Col xs={24} lg={12}>
                            <DiscountCard
                                title="Convenience Fee"
                                data={getCncData(salesData)}
                                formatCurrency={formatCurrency}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
            <OrganizerSummary organizerSummary={organizerSummary} />
            <EventTicketsSummary organizerTickets={organizerTickets} isLoading={isLoading} />
        </div>
    );
};

export default DashboardLayout;
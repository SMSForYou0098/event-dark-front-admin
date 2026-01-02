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
import EventTicketsSummary from './EventTicketsSummary';
import GatewayWiseSales from './GatewayWiseSales';

const DashboardLayout = ({ userId, showUserManagement = true, userRole }) => {
    const { isMobile } = useMyContext();
    const [showToday, setShowToday] = useState(true);

    const { bookingData, salesData, isLoading, error, gatewayWiseSalesData, gatewayLoading, organizerSummary, organizerTickets, userStats } = useDashboardData(userId);

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
                    // extraHeader={
                    //     <Switch
                    //         checked={showToday}
                    //         onChange={(checked) => setShowToday(checked)}
                    //         checkedChildren="Today"
                    //         unCheckedChildren="Overall"
                    //     />
                    // }
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
                    stats={getEventStats(bookingData?.eventinfo)}
                    colConfig={{ xs: 24, sm: 12, lg: 8 }}
                    containerCol={{ xs: 24, md: 12 }}
                    isMobile={isMobile}
                />

                {/* User Management Section - Conditional */}
                {showUserManagement && (
                    <StatSection
                        title="User Management"
                        stats={getUserStats(userStats?.data)}
                        colConfig={{ xs: 24, sm: 12, lg: 4 }}
                        isMobile={isMobile}
                    />
                )}

                {/* Gateway Wise Sales Section */}
                <Col xs={24}>
                    <GatewayWiseSales
                        gatewayData={gatewayWiseSalesData?.gatewayWise ?? []}
                        channelData={gatewayWiseSalesData?.channelTotals ?? []}
                        formatCurrency={formatCurrency}
                        showToday={showToday}
                        loading={gatewayLoading}
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
                {userRole === 'Admin' &&
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
            <OrganizerSummary organizerSummary={organizerSummary?.data} />
            <EventTicketsSummary organizerTickets={organizerTickets?.data} isLoading={isLoading} />
        </div>
    );
};

export default DashboardLayout;
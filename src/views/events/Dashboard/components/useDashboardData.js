import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

export const useDashboardData = (userId) => {
    // Fetch all dashboard data in parallel for better performance
    const fetchAllDashboardData = async () => {
        const [bookingData, salesData, gatewayWiseSalesData, organizerSummary, organizerTickets, userStats] = await Promise.all([
            api.get(`bookingCount/${userId}`),
            api.get(`calculateSale/${userId}`),
            api.get(`gateway-wise-sales/${userId}`).catch(() => null), // Graceful fallback if gateway API fails
            api.get(`organizer/summary/${userId}`).catch(() => null),
            api.get(`getDashboardOrgTicket`).catch(() => null), // Graceful fallback if gateway API fails
            api.get(`user-stats`).catch(() => null) // Graceful fallback if gateway API fails
        ]);

        return {
            bookingData,
            salesData,
            gatewayWiseSalesData,
            organizerSummary,
            organizerTickets,
            userStats
        };
    };

    const { data, error, isLoading } = useQuery({
        queryKey: ['dashboardData', userId],
        queryFn: fetchAllDashboardData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        keepPreviousData: true,
        enabled: !!userId // Only fetch when userId is available
    });

    return {
        bookingData: data?.bookingData,
        salesData: data?.salesData,
        gatewayWiseSalesData: data?.gatewayWiseSalesData,
        gatewayLoading: isLoading,
        organizerSummary: data?.organizerSummary,
        organizerTickets: data?.organizerTickets,
        userStats: data?.userStats,
        isLoading,
        error
    };
};
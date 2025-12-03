import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

export const useDashboardData = (userId) => {
    const fetchBookingData = async () => {
        const response = await api.get(`bookingCount/${userId}`);
        return response;
    };

    const fetchSalesData = async () => {
        const response = await api.get(`calculateSale/${userId}`);
        return response;
    };

    // TODO: Uncomment when API endpoint is ready
    // const fetchGatewayWiseSales = async () => {
    //     const response = await api.get(`gateway-wise-sales/${userId}`);
    //     return response;
    // };

    const { data: bookingData, error: bookingError, isLoading: isBookingLoading } = useQuery({
        queryKey: ['bookingData', userId],
        queryFn: () => fetchBookingData(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        keepPreviousData: true
    });

    const { data: salesData, error: salesError, isLoading: salesLoading } = useQuery({
        queryKey: ['salesData', userId],
        queryFn: () => fetchSalesData(userId),
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
        keepPreviousData: true
    });

    // TODO: Uncomment when API endpoint is ready
    // const { data: gatewayWiseSalesData, error: gatewayError, isLoading: gatewayLoading } = useQuery({
    //     queryKey: ['gatewayWiseSales', userId],
    //     queryFn: () => fetchGatewayWiseSales(userId),
    //     staleTime: 5 * 60 * 1000,
    //     cacheTime: 30 * 60 * 1000,
    //     keepPreviousData: true
    // });

    return {
            bookingData: bookingData,
            salesData: salesData,
            // gatewayWiseSalesData: gatewayWiseSalesData, // Uncomment when API is ready
            isLoading: isBookingLoading || salesLoading,
            error: bookingError || salesError,
    };
};
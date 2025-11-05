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

    const bookingQuery = useQuery({
        queryKey: ['bookingData', userId],
        queryFn: fetchBookingData,
        enabled: !!userId,
    });

    const salesQuery = useQuery({
        queryKey: ['salesData', userId],
        queryFn: fetchSalesData,
        enabled: !!userId,
    });

    return {
        bookingData: bookingQuery.data,
        salesData: salesQuery.data,
        isLoading: bookingQuery.isLoading || salesQuery.isLoading,
        error: bookingQuery.error || salesQuery.error,
    };
};
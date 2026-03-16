import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

// ========================= API FUNCTIONS =========================

// Get all onboarding requests
const getOnboardingRequests = async () => {
    const response = await api.get('onboarding-requests');
    // Handle paginated response structure
    if (response.status && response.data) {
        return {
            data: response.data,
            pagination: response.pagination
        };
    }
    return { data: response.data || response, pagination: null };
};

// Update onboarding status
const updateOnboardingStatus = async ({ id, payload }) => {
    const response = await api.post(`onboarding-requests/${id}/update-status`, payload);
    return response;
};

// ========================= CUSTOM HOOKS =========================

// Hook to fetch all onboarding requests
export const useGetOnboardingRequests = (options = {}) => {
    return useQuery({
        queryKey: ['onboarding-requests'],
        queryFn: getOnboardingRequests,
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
            console.error('Error fetching onboarding requests:', error);
        },
        ...options,
    });
};

// Hook to update onboarding status
export const useUpdateOnboardingStatus = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateOnboardingStatus,
        onSuccess: (data) => {
            message.success(data?.message || 'Status updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['onboarding-requests'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error updating status:', error);
            message.error(Utils.getErrorMessage(error));
            options.onError?.(error);
        },
    });
};

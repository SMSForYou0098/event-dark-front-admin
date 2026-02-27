import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

// ========================= API FUNCTIONS =========================

// Get all organizer onboarding requests
const getAllOrganizerOnboarding = async () => {
    const response = await api.get('onboarding/org');
    return response.data || response;
};

// Approve organizer onboarding
const approveOrganizerOnboarding = async ({ id, payload }) => {
    const response = await api.post(`onboarding/org/action`, {
        ...payload,
        id
    });
    return response;
};

// Reject organizer onboarding
const rejectOrganizerOnboarding = async (id) => {
    const response = await api.post(`onboarding/org/reject/${id}`);
    return response;
};

// ========================= CUSTOM HOOKS =========================

// Hook to fetch all organizer onboarding requests
export const useGetAllOrganizerOnboarding = (options = {}) => {
    return useQuery({
        queryKey: ['organizer-onboarding'],
        queryFn: getAllOrganizerOnboarding,
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
            console.error('Error fetching onboarding requests:', error);
        },
        ...options,
    });
};

// Hook to approve organizer onboarding
export const useApproveOrganizerOnboarding = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: approveOrganizerOnboarding,
        onSuccess: (data) => {
            message.success(data?.message || 'Organizer approved successfully!');
            queryClient.invalidateQueries({ queryKey: ['organizer-onboarding'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error approving organizer:', error);
            message.error(Utils.getErrorMessage(error));
            options.onError?.(error);
        },
    });
};

// Hook to reject organizer onboarding
export const useRejectOrganizerOnboarding = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: rejectOrganizerOnboarding,
        onSuccess: (data) => {
            message.success(data?.message || 'Organizer rejected successfully!');
            queryClient.invalidateQueries({ queryKey: ['organizer-onboarding'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error rejecting organizer:', error);
            message.error(Utils.getErrorMessage(error));
            options.onError?.(error);
        },
    });
};

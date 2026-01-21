import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';

const API_PREFIX = 'refund-policies';

// ========================= API FUNCTIONS =========================

// Get all refund policies
const getRefundPolicies = async () => {
    const response = await api.get(API_PREFIX);
    // Ensure we always return an array
    if (Array.isArray(response?.data)) {
        return response.data;
    }
    if (Array.isArray(response)) {
        return response;
    }
    return [];
};

// Create refund policy
const createRefundPolicy = async (data) => {
    const response = await api.post(API_PREFIX, data);
    return response;
};

// Update refund policy
const updateRefundPolicy = async ({ id, data }) => {
    const response = await api.put(`${API_PREFIX}/${id}`, data);
    return response;
};

// Delete refund policy
const deleteRefundPolicy = async (id) => {
    const response = await api.delete(`${API_PREFIX}/${id}`);
    return response;
};

// Get events for dropdown
const getEvents = async (id) => {
    const response = await api.get(`events/list/${id}`);
    const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.events)
            ? response.events
            : [];
    return list.map((event) => ({
        value: event.id,
        label: event.name,
    }));
};

// ========================= CUSTOM HOOKS =========================

// Hook to fetch all refund policies
export const useGetRefundPolicies = (options = {}) => {
    return useQuery({
        queryKey: ['refund-policies'],
        queryFn: getRefundPolicies,
        onError: (error) => {
            message.error('Failed to load refund policies');
            console.error('Error fetching refund policies:', error);
        },
        ...options,
    });
};

// Hook to fetch events for dropdown
export const useGetEvents = (id, options = {}) => {
    return useQuery({
        queryKey: ['events-dropdown', id],
        queryFn: () => getEvents(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        onError: (error) => {
            message.error('Failed to load events');
            console.error('Error fetching events:', error);
        },
        ...options,
    });
};

// Hook to create refund policy
export const useCreateRefundPolicy = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createRefundPolicy,
        onSuccess: (data) => {
            message.success(data?.message || 'Refund policy created successfully!');
            queryClient.invalidateQueries({ queryKey: ['refund-policies'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error creating refund policy:', error);
            message.error(
                error.response?.data?.message || 'Failed to create refund policy.'
            );
            options.onError?.(error);
        },
    });
};

// Hook to update refund policy
export const useUpdateRefundPolicy = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateRefundPolicy,
        onSuccess: (data) => {
            message.success(data?.message || 'Refund policy updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['refund-policies'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error updating refund policy:', error);
            message.error(
                error.response?.data?.message || 'Failed to update refund policy.'
            );
            options.onError?.(error);
        },
    });
};

// Hook to delete refund policy
export const useDeleteRefundPolicy = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteRefundPolicy,
        onSuccess: (data) => {
            message.success(data?.message || 'Refund policy deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['refund-policies'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error deleting refund policy:', error);
            message.error(
                error.response?.data?.message || 'Failed to delete refund policy.'
            );
            options.onError?.(error);
        },
    });
};

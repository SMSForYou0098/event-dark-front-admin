import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

// ========================= API FUNCTIONS =========================

// Get all organizer agreements
const getAllOrganizerAgreements = async () => {
    const response = await api.get('agreement');
    if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to fetch agreement'));
    }
    return response.data || response;
};

// Create organizer agreement
const createOrganizerAgreement = async (payload) => {
    const response = await api.post('agreement', payload);
    if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to create agreement'));
    }
    return response;
};

// Update organizer agreement
const updateOrganizerAgreement = async ({ id, payload }) => {
    const response = await api.post(`agreement/${id}`, payload);
    if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to update agreement'));
    }
    return response;
};

// Delete organizer agreement
const deleteOrganizerAgreement = async (id) => {
    const response = await api.delete(`agreement/${id}`); // Fixed: added /
    if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to delete agreement'));
    }
    return response;
};

// ========================= CUSTOM HOOKS =========================

// Hook to fetch all organizer agreements
export const useGetAllOrganizerAgreements = (options = {}) => {
    return useQuery({
        queryKey: ['organizer-agreements'],
        queryFn: getAllOrganizerAgreements,
        onError: (error) => {
            message.error(Utils.getErrorMessage(error, 'Failed to load organizer agreements'));
            console.error('Error fetching organizer agreements:', error);
        },
        ...options,
    });
};

// Hook to create organizer agreement
export const useCreateOrganizerAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createOrganizerAgreement,
        onSuccess: (data) => {
            message.success('Organizer Agreement created successfully!');
            queryClient.invalidateQueries({ queryKey: ['organizer-agreements'] });
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error creating agreement:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to create agreement'));
            options.onError?.(error);
        },
    });
};

// Hook to update organizer agreement
export const useUpdateOrganizerAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateOrganizerAgreement,
        onSuccess: (data, variables) => {
            message.success('Organizer Agreement updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['organizer-agreements'] });
            options.onSuccess?.(data, variables);
        },
        onError: (error) => {
            console.error('Error updating agreement:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to update agreement'));
            options.onError?.(error);
        },
    });
};

// Set default organizer agreement
const setDefaultAgreement = async (id) => {
    const response = await api.post(`agreement/set-default/${id}`);
    if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to set default agreement'));
    }
    return response;
};

// ... existing delete hook ...

// Hook to delete organizer agreement
export const useDeleteOrganizerAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteOrganizerAgreement,
        onSuccess: (data, variables) => {
            message.success('Agreement deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['organizer-agreements'] });
            options.onSuccess?.(data, variables);
        },
        onError: (error) => {
            console.error('Error deleting agreement:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to delete agreement'));
            options.onError?.(error);
        },
    });
};

// Hook to set default organizer agreement
export const useSetDefaultAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setDefaultAgreement,
        onSuccess: (data, variables) => {
            message.success(data?.message || 'Default agreement set successfully!');
            queryClient.invalidateQueries({ queryKey: ['organizer-agreements'] });
            options.onSuccess?.(data, variables);
        },
        onError: (error) => {
            console.error('Error setting default agreement:', error);
            message.error(Utils.getErrorMessage(error, 'Failed to set default agreement'));
            options.onError?.(error);
        },
    });
};

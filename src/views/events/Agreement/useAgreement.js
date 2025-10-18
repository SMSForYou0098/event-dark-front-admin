import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';

// API function to create user agreement
const createUserAgreement = async (formData) => {
    const response = await api.post('user-agreement', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};

// API function to update user agreement
const updateUserAgreement = async ({ id, formData }) => {
    const response = await api.put(`user-agreement/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};

// API function to get user agreement by ID
const getUserAgreement = async (id) => {
    const response = await api.get(`user-agreement/${id}`);
    return response.data;
};

// API function to get all user agreements
const getAllUserAgreements = async (params) => {
    const response = await api.get('user-agreement', { params });
    return response.data;
};

// API function to delete user agreement
const deleteUserAgreement = async (id) => {
    const response = await api.delete(`user-agreement/${id}`);
    return response;
};

// Custom hook to fetch single user agreement
export const useGetUserAgreement = (id, options = {}) => {
    return useQuery({
        queryKey: ['user-agreement', id],
        queryFn: () => getUserAgreement(id),
        enabled: Boolean(id),
        onError: (error) => {
            message.error('Failed to load agreement data');
            console.error('Error fetching agreement:', error);
        },
        ...options,
    });
};

// Custom hook to fetch all user agreements
export const useGetAllUserAgreements = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['user-agreements', params],
        queryFn: () => getAllUserAgreements(params),
        onError: (error) => {
            message.error('Failed to load agreements');
            console.error('Error fetching agreements:', error);
        },
        ...options,
    });
};

// Custom hook to create user agreement
export const useCreateUserAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUserAgreement,
        onSuccess: (data) => {
            message.success('Partner Agreement created successfully!');
            console.log('Agreement Created:', data);
            
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['user-agreements'] });
            
            options.onSuccess?.(data);
        },
        onError: (error) => {
            console.error('Error creating agreement:', error);
            message.error(error.response?.data?.message || 'Failed to create agreement. Please try again.');
            
            options.onError?.(error);
        },
    });
};

// Custom hook to update user agreement
export const useUpdateUserAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUserAgreement,
        onSuccess: (data, variables) => {
            message.success('Partner Agreement updated successfully!');
            console.log('Agreement Updated:', data);
            
            // Invalidate specific agreement and list queries
            queryClient.invalidateQueries({ queryKey: ['user-agreement', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['user-agreements'] });
            
            options.onSuccess?.(data, variables);
        },
        onError: (error) => {
            console.error('Error updating agreement:', error);
            message.error(error.response?.data?.message || 'Failed to update agreement. Please try again.');
            
            options.onError?.(error);
        },
    });
};

// Custom hook to delete user agreement
export const useDeleteUserAgreement = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUserAgreement,
        onSuccess: (data, variables) => {
            message.success('Agreement deleted successfully!');
            
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['user-agreements'] });
            queryClient.removeQueries({ queryKey: ['user-agreement', variables] });
            
            options.onSuccess?.(data, variables);
        },
        onError: (error) => {
            console.error('Error deleting agreement:', error);
            message.error(error.response?.data?.message || 'Failed to delete agreement. Please try again.');
            
            options.onError?.(error);
        },
    });
};
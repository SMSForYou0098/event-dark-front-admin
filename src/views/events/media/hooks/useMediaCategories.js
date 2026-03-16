import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { message } from 'antd';

const QUERY_KEY = 'media-categories';

// Fetch root categories and media (combined response)
export const useMediaCategories = () => {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async () => {
            const res = await api.get('media-categories');
            // API returns { categories: [...], media: [...], parent: null }
            return {
                categories: Array.isArray(res?.data?.categories) ? res.data.categories : [],
                media: Array.isArray(res?.data?.media) ? res.data.media : [],
                parent: res?.data?.parent || null,
            };
        },
        staleTime: 2 * 60 * 1000,
    });
};

// Fetch category tree structure
export const useMediaCategoryTree = () => {
    return useQuery({
        queryKey: [QUERY_KEY, 'tree'],
        queryFn: async () => {
            const res = await api.get('media-categories/tree');
            return res?.data || [];
        },
        staleTime: 2 * 60 * 1000,
    });
};

// Fetch single category
export const useMediaCategory = (id) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const res = await api.get(`media-categories/${id}`);
            return res?.data || null;
        },
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
};

// Fetch child categories and media of a parent category (combined response)
export const useChildCategories = (parentId) => {
    return useQuery({
        queryKey: [QUERY_KEY, 'children', parentId],
        queryFn: async () => {
            const res = await api.get(`media-categories/${parentId}/children`);
            // API returns { categories: [...], media: [...], parent: {...} }
            return {
                categories: Array.isArray(res?.data?.categories) ? res.data.categories : [],
                media: Array.isArray(res?.data?.media) ? res.data.media : [],
                parent: res?.data?.parent || null,
            };
        },
        enabled: !!parentId,
        staleTime: 2 * 60 * 1000,
    });
};

// Create category mutation
export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('media-categories', data);
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Folder created successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to create folder');
            }
        },
        onError: (error) => {
            console.error('Create category error:', error);
            message.error('Failed to create folder');
        },
    });
};

// Update category mutation
export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`media-categories/${id}`, data);
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Folder updated successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to update folder');
            }
        },
        onError: (error) => {
            console.error('Update category error:', error);
            message.error('Failed to update folder');
        },
    });
};

// Delete category mutation
export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`media-categories/${id}`);
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Folder deleted successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to delete folder');
            }
        },
        onError: (error) => {
            console.error('Delete category error:', error);
            message.error('Failed to delete folder');
        },
    });
};

// Move category to another parent (or root if parent_id is null)
export const useMoveCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ categoryId, parentId }) => {
            const res = await api.post(`media-categories/${categoryId}/move`, {
                parent_id: parentId, // null for root level
            });
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Folder moved successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to move folder');
            }
        },
        onError: (error) => {
            console.error('Move category error:', error);
            message.error('Failed to move folder');
        },
    });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { message } from 'antd';

const QUERY_KEY = 'media';

// Fetch media files with optional category filter
export const useMedia = (categoryId = null) => {
    return useQuery({
        queryKey: [QUERY_KEY, categoryId],
        queryFn: async () => {
            const params = categoryId ? `?category_id=${categoryId}` : '';
            const res = await api.get(`media${params}`);
            // Handle Laravel paginated response: data.data contains the array
            if (res?.data?.data && Array.isArray(res.data.data)) {
                return res.data.data;
            }
            // Fallback for direct array response
            return Array.isArray(res?.data) ? res.data : [];
        },
        staleTime: 1 * 60 * 1000,
    });
};

// Fetch single media item
export const useMediaItem = (id) => {
    return useQuery({
        queryKey: [QUERY_KEY, 'item', id],
        queryFn: async () => {
            const res = await api.get(`media/${id}`);
            return res?.data || null;
        },
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
};

// Fetch storage stats
export const useStorageStats = () => {
    return useQuery({
        queryKey: [QUERY_KEY, 'recalculate-storage'],
        queryFn: async () => {
            const res = await api.get('media/storage/recalculate');
            return res?.data || { used: 0, total: 0 };
        },
        staleTime: 5 * 60 * 1000,
    });
};

// Upload single media file
export const useUploadMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ file, categoryId }) => {
            const formData = new FormData();
            formData.append('file', file);
            if (categoryId) {
                formData.append('category_id', categoryId);
            }
            const res = await api.post('media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('File uploaded successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to upload file');
            }
        },
        onError: (error) => {
            console.error('Upload error:', error);
            message.error('Failed to upload file');
        },
    });
};

// Bulk upload media files
export const useBulkUploadMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ files, categoryId }) => {
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append(`files[${index}]`, file);
            });
            if (categoryId) {
                formData.append('category_id', categoryId);
            }
            const res = await api.post('media/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Files uploaded successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to upload files');
            }
        },
        onError: (error) => {
            console.error('Bulk upload error:', error);
            message.error('Failed to upload files');
        },
    });
};

// Update media item
export const useUpdateMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`media/${id}`, data);
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('File updated successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to update file');
            }
        },
        onError: (error) => {
            console.error('Update error:', error);
            message.error('Failed to update file');
        },
    });
};

// Delete single media file
export const useDeleteMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`media/${id}`);
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('File deleted successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            } else {
                message.error(res?.message || 'Failed to delete file');
            }
        },
        onError: (error) => {
            console.error('Delete error:', error);
            message.error('Failed to delete file');
        },
    });
};

// Bulk delete media files
export const useBulkDeleteMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids) => {
            const res = await api.post('media/bulk-delete', { media_ids: ids });
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Files deleted successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
                queryClient.invalidateQueries({ queryKey: ['media-categories'] });
            } else {
                message.error(res?.message || 'Failed to delete files');
            }
        },
        onError: (error) => {
            console.error('Bulk delete error:', error);
            message.error('Failed to delete files');
        },
    });
};

// Move media files to another category (or root if category_id is null)
export const useMoveMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ mediaIds, categoryId }) => {
            const res = await api.post('media/bulk-update-category', {
                media_ids: mediaIds,
                category_id: categoryId, // null for root level
            });
            return res;
        },
        onSuccess: (res) => {
            if (res?.status) {
                message.success('Files moved successfully');
                queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
                queryClient.invalidateQueries({ queryKey: ['media-categories'] });
            } else {
                message.error(res?.message || 'Failed to move files');
            }
        },
        onError: (error) => {
            console.error('Move media error:', error);
            message.error('Failed to move files');
        },
    });
};

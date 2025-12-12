import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';

const CONTENT_MASTER_KEY = 'contentMaster';

// ========================= GET ALL =========================
export const useGetAllContentMaster = (id, role) => {
  return useQuery({
    queryKey: [CONTENT_MASTER_KEY, id, role], // 👈 add id & role here
    
    enabled: !!id,  // optional: fetch only when id exists
    
    queryFn: async () => {
      const url = role === 'Admin'
        ? '/content-master'
        : `/content-master/user/${id}`;

      const response = await api.get(url);
      return response.data?.data || response.data || [];
    },
  });
};


// ========================= CREATE =========================
export const useCreateContentMaster = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/content-master', payload);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Content created successfully');
      queryClient.invalidateQueries({ queryKey: [CONTENT_MASTER_KEY] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to create content');
      options.onError?.(error);
    },
  });
};

// ========================= UPDATE =========================
export const useUpdateContentMaster = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.post(`/content-master/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Content updated successfully');
      queryClient.invalidateQueries({ queryKey: [CONTENT_MASTER_KEY] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to update content');
      options.onError?.(error);
    },
  });
};

// ========================= DELETE =========================
export const useDeleteContentMaster = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/content-master/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Content deleted successfully');
      queryClient.invalidateQueries({ queryKey: [CONTENT_MASTER_KEY] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to delete content');
      options.onError?.(error);
    },
  });
};

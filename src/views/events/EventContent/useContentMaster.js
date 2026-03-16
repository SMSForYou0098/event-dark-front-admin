import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

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
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to fetch content'));
      }
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
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to create content'));
      }
      return response.data || response;
    },
    onSuccess: (data) => {
      message.success('Content created successfully');
      queryClient.invalidateQueries({ queryKey: [CONTENT_MASTER_KEY] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error, 'Failed to create content'));
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
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to update content'));
      }
      return response.data || response;
    },
    onSuccess: (data) => {
      message.success('Content updated successfully');
      queryClient.invalidateQueries({ queryKey: [CONTENT_MASTER_KEY] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error, 'Failed to update content'));
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
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to delete content'));
      }
      return response.data || response;
    },
    onSuccess: (data) => {
      message.success('Content deleted successfully');
      queryClient.invalidateQueries({ queryKey: [CONTENT_MASTER_KEY] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error, 'Failed to delete content'));
      options.onError?.(error);
    },
  });
};

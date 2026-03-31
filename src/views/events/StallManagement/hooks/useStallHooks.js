import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';
import { message } from 'antd';

/**
 * Fetch stall applications with server-side pagination, searching, and sorting
 */
export const useStallApplications = (params = {}) => {
  const { page = 1, pageSize = 10, search = '', sortField = '', sortOrder = '' } = params;

  return useQuery({
    queryKey: ['stall-applications', page, pageSize, search, sortField, sortOrder],
    queryFn: async () => {
      const res = await api.get('stall/applications', {
        params: {
          page,
          per_page: pageSize,
          search,
          sort_field: sortField,
          sort_order: sortOrder === 'ascend' ? 'asc' : sortOrder === 'descend' ? 'desc' : '',
        }
      });
      return res;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });
};

/**
 * Approve a stall application
 */
export const useApproveApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.put(`stall/application/${id}/approve`);
      if (res?.status === false) {
        throw new Error(Utils.getErrorMessage(res, 'Failed to approve application'));
      }
      return res;
    },
    onSuccess: (res) => {
      message.success(res?.message || 'Application approved successfully');
      queryClient.invalidateQueries(['stall-applications']);
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error, 'Failed to approve application'));
    },
  });
};

/**
 * Reject a stall application
 */
export const useRejectApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api.put(`stall/application/${id}/reject`, { rejection_reason: reason });
      if (res?.status === false) {
        throw new Error(Utils.getErrorMessage(res, 'Failed to reject application'));
      }
      return res;
    },
    onSuccess: (res) => {
      message.success(res?.message || 'Application rejected successfully');
      queryClient.invalidateQueries(['stall-applications']);
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error, 'Failed to reject application'));
    },
  });
};

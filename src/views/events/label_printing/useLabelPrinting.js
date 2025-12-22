// hooks/useLabelPrinting.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

/**
 * Query Keys
 */
export const LABEL_PRINT_KEYS = {
  all: ['label-prints'],
  batch: (batchId) => ['label-prints', 'batch', batchId],
  single: (id) => ['label-prints', id],
};

/**
 * Fetch all label prints
 * GET: label-prints
 */
export const useLabelPrints = (options = {}) =>
  useQuery({
    queryKey: LABEL_PRINT_KEYS.all,
    queryFn: async () => {
      const res = await api.get('label-prints');
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch label prints');
        err.server = res;
        throw err;
      }
      // API returns { status: true, data: [...], pagination: {...} }
      // Return the data array from res.data.data
      return res.data?.data || res.data || [];
    },
    staleTime: 2 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Fetch label prints by batch ID
 * GET: label-prints/batch/{batchId}
 */
export const useLabelPrintsByBatch = (batchId, options = {}) =>
  useQuery({
    queryKey: LABEL_PRINT_KEYS.batch(batchId),
    enabled: !!batchId,
    queryFn: async () => {
      const res = await api.get(`label-prints/batch/${batchId}`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch batch labels');
        err.server = res;
        throw err;
      }
      // API returns { data: { labels: [...] } }
      return res.data?.labels || res.data || res.labelPrints || [];
    },
    staleTime: 2 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Fetch single label print
 * GET: label-prints/{id}
 */
export const useLabelPrint = (id, options = {}) =>
  useQuery({
    queryKey: LABEL_PRINT_KEYS.single(id),
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`label-prints/${id}`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch label');
        err.server = res;
        throw err;
      }
      return res.data || res.labelPrint || null;
    },
    staleTime: 2 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Bulk store label prints (upload Excel data)
 * POST: label-prints/bulk
 * payload: { user_id, labels: Array }
 */
export const useBulkStoreLabelPrints = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Expect full payload: { user_id, labels: [...] }
    mutationFn: async (payload) => {
      const res = await api.post('label-prints/bulk', payload);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to store labels');
        err.server = res;
        throw err;
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.all });
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
};

/**
 * Update single label print
 * PUT: label-prints/{id}
 */
export const useUpdateLabelPrint = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`label-prints/${id}`, data);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update label');
        err.server = res;
        throw err;
      }
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.single(variables.id) });
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
};

/**
 * Mark batch as printed
 * PATCH: label-prints/batch/{batchId}/print
 */
export const useMarkBatchPrinted = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId) => {
      const res = await api.patch(`label-prints/batch/${batchId}/print`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to mark batch as printed');
        err.server = res;
        throw err;
      }
      return res;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.batch(batchId) });
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
};

/**
 * Bulk update label status
 * PATCH: label-prints/bulk-status
 * payload: { user_id, ids: [1,2,3] }
 */
export const useBulkUpdateLabelStatus = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, ids }) => {
      const payload = { user_id, ids, status: true };
      const res = await api.patch('label-prints/bulk-status', payload);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update label status');
        err.server = res;
        throw err;
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.all });
      // Invalidate all batch queries to refresh label lists
      queryClient.invalidateQueries({ queryKey: ['label-prints', 'batch'] });
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
};

/**
 * Delete single label print
 * DELETE: label-prints/{id}
 */
export const useDeleteLabelPrint = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`label-prints/${id}`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete label');
        err.server = res;
        throw err;
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.all });
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
};

/**
 * Delete batch
 * DELETE: label-prints/batch/{batchId}
 */
export const useDeleteBatch = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId) => {
      const res = await api.delete(`label-prints/batch/${batchId}`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete batch');
        err.server = res;
        throw err;
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABEL_PRINT_KEYS.all });
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

// previewing aggreement

export const useAgreementPreview = (id, options = {}) => {
  return useQuery({
    queryKey: ['agreement-preview', id],
    queryFn: async () => {
      const response = await api.get(`/agreement/preview/${id}`);
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to fetch agreement'));
      }
      return response;
    },
    enabled: false,
    retry: false,
    ...options
  });
};

export const useVerifyUser = (options = {}) => {
  return useMutation({
    mutationFn: async ({ user_agreement_id, password }) => {
      const response = await api.post(`/agreement/verify-user`, {
        user_agreement_id,
        password
      });
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Verification failed'));
      }
      return response;
    },
    onError: (error) => {
      options.onError?.(error);
    },
    ...options
  });
};

// Update user signature
export const useUpdateUserSignature = (options = {}) => {
  return useMutation({
    mutationFn: async ({ userId, formData }) => {
      const response = await api.post(`/update-user/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to update signature'));
      }
      return response;
    },
    onError: (error) => {
      options.onError?.(error);
    },
    ...options
  });
};

// Confirm agreement (approve/reject)
export const useConfirmAgreement = (options = {}) => {
  return useMutation({
    mutationFn: async ({ agreement_id, user_id, action }) => {
      const response = await api.post(`/agreement/confirm`, {
        agreement_id,
        user_id,
        action
      });
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to confirm agreement'));
      }
      return response;
    },
    onError: (error) => {
      options.onError?.(error);
    },
    ...options
  });
};


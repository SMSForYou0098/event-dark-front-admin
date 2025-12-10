import {  useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

// previewing aggreement

export const useAgreementPreview = (id, options = {}) => {
  return useQuery({
    queryKey: ['agreement-preview', id],
    queryFn: async () => {
      const response = await api.get(`/agreement/preview/${id}`);
      return response;
    },
    enabled: false, // Don't auto-fetch, will be triggered manually
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
      return response;
    },
    ...options
  });
};


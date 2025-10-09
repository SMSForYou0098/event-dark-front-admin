import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

// ============================================
// SMS CONFIGURATION HOOKS
// ============================================

/**
 * GET /sms-api/{userId}
 * Fetch SMS configuration and templates
 */
export const useSMSConfig = (userId, options = {}) =>
  useQuery({
    queryKey: ['sms-config', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const res = await api.get(`sms-api/${userId}`);
      
      if (!res?.status) {
        throw new Error(res?.message || 'Failed to fetch SMS configuration');
      }
      
      return {
        config: res?.config || {},
        custom: res?.custom || {},
        templates: res?.templates || [],
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /store-api or /store-custom-api/{userId}
 * Store SMS configuration (default or custom)
 */
export const useStoreSMSConfig = (options = {}) =>
  useMutation({
    mutationFn: async ({ userId, isCustom, payload }) => {
      const url = isCustom ? `store-custom-api/${userId}` : 'store-api';
      const res = await api.post(url, payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to save SMS configuration');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /sms-template/{userId}
 * Create new SMS template
 */
export const useCreateSMSTemplate = (options = {}) =>
  useMutation({
    mutationFn: async ({ userId, payload }) => {
      if (!userId) throw new Error('User ID is required');
      
      const res = await api.post(`sms-template/${userId}`, payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create SMS template');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /sms-template-update/{id}
 * Update existing SMS template
 */
export const useUpdateSMSTemplate = (options = {}) =>
  useMutation({
    mutationFn: async ({ id, payload }) => {
      if (!id) throw new Error('Template ID is required');
      
      const res = await api.post(`sms-template-update/${id}`, payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update SMS template');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * DELETE /sms-template-delete/{id}
 * Delete SMS template
 */
export const useDeleteSMSTemplate = (options = {}) =>
  useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('Template ID is required');
      
      const res = await api.delete(`sms-template-delete/${id}`);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete SMS template');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

// ============================================
// EMAIL CONFIGURATION HOOKS
// ============================================

/**
 * GET /email-config
 * Fetch email configuration
 */
export const useEmailConfig = (options = {}) =>
  useQuery({
    queryKey: ['email-config'],
    queryFn: async () => {
      const res = await api.get('email-config');
      
      if (!res?.status) {
        throw new Error(res?.message || 'Failed to fetch email configuration');
      }
      
      return res?.data || {};
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /email-config
 * Store email configuration
 */
export const useStoreEmailConfig = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('email-config', payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to save email configuration');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * GET /email-templates/{userId}
 * Fetch email templates
 */
export const useEmailTemplates = (userId, options = {}) =>
  useQuery({
    queryKey: ['email-templates', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const res = await api.get(`email-templates/${userId}`);
      
      return res?.templates || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /store-templates
 * Create new email template
 */
export const useCreateEmailTemplate = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('store-templates', payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create email template');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /update-templates
 * Update existing email template
 */
export const useUpdateEmailTemplate = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('update-templates', payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update email template');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * DELETE /delete-template/{id}
 * Delete email template
 */
export const useDeleteEmailTemplate = (options = {}) =>
  useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('Template ID is required');
      
      const res = await api.delete(`delete-template/${id}`);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete email template');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

// ============================================
// SYSTEM VARIABLES HOOKS
// ============================================

/**
 * GET /system-variables
 * Fetch all system variables
 */
export const useSystemVariables = (options = {}) =>
  useQuery({
    queryKey: ['system-variables'],
    queryFn: async () => {
      const res = await api.get('system-variables');
      
      if (!res?.status) {
        throw new Error(res?.message || 'Failed to fetch system variables');
      }
      
      return Array.isArray(res?.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /system-variables-store
 * Create new system variable
 */
export const useCreateSystemVariable = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('system-variables-store', payload);
      
      if (res?.status === false) {
        const err = new Error(res?.message || 'Failed to create system variable');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /system-variables-update/{id}
 * Update existing system variable
 */
export const useUpdateSystemVariable = (options = {}) =>
  useMutation({
    mutationFn: async ({ id, payload }) => {
      if (!id) throw new Error('Variable ID is required');
      
      const res = await api.post(`system-variables-update/${id}`, payload);
      
      if (res?.status === false) {
        const err = new Error(res?.message || 'Failed to update system variable');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * DELETE /system-variables-destroy/{id}
 * Delete system variable
 */
export const useDeleteSystemVariable = (options = {}) =>
  useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('Variable ID is required');
      
      const res = await api.delete(`system-variables-destroy/${id}`);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete system variable');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

// ============================================
// WHATSAPP CONFIGURATION HOOKS
// ============================================

/**
 * GET /whatsapp-config/{userId}
 * Fetch WhatsApp configuration
 */
export const useWhatsAppConfig = (userId, options = {}) =>
  useQuery({
    queryKey: ['whatsapp-config', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const res = await api.get(`whatsapp-config-show/${userId}`);
      
      if (!res?.status) {
        throw new Error(res?.message || 'Failed to fetch WhatsApp configuration');
      }
      
      return res?.data || {};
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /whatsapp-config-store
 * Store WhatsApp configuration
 */
export const useStoreWhatsAppConfig = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('whatsapp-config-store', payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to save WhatsApp configuration');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * GET /whatsapp-api-show/{userId}
 * Fetch WhatsApp APIs/Templates
 */
export const useWhatsAppApis = (userId, options = {}) =>
  useQuery({
    queryKey: ['whatsapp-apis', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const res = await api.get(`whatsapp-api-show/${userId}`);
      
      if (!res?.status) {
        throw new Error(res?.message || 'Failed to fetch WhatsApp APIs');
      }
      
      return res?.data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * POST /whatsapp-api-store
 * Create new WhatsApp API/Template
 */
export const useStoreWhatsAppApi = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('whatsapp-api-store', payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create WhatsApp API');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /whatsapp-api-update/{id}
 * Update existing WhatsApp API/Template
 */
export const useUpdateWhatsAppApi = (options = {}) =>
  useMutation({
    mutationFn: async ({ id, payload }) => {
      if (!id) throw new Error('API ID is required');
      
      const res = await api.post(`whatsapp-api-update/${id}`, payload);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update WhatsApp API');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * DELETE /whatsapp-api-destroy/{id}
 * Delete WhatsApp API/Template
 */
export const useDeleteWhatsAppApi = (options = {}) =>
  useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('API ID is required');
      
      const res = await api.delete(`whatsapp-api-destroy/${id}`);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete WhatsApp API');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });
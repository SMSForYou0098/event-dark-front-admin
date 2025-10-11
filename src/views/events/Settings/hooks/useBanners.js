import { useMutation, useQuery } from "@tanstack/react-query";
import api from "auth/FetchInterceptor";

// ============================================
// ORGANIZER EVENTS HOOK
// ============================================

export const useOrganizerEvents = (organizerId, options = {}) =>
  useQuery({
    queryKey: ['org-events', organizerId],
    queryFn: async () => {
      if (!organizerId) throw new Error('Organizer ID is required');
      
      const res = await api.get(`org-event/${organizerId}`);
      
      // Handle different response structures
      const list = Array.isArray(res?.data) 
        ? res.data 
        : Array.isArray(res?.events) 
          ? res.events 
          : [];
      
      // Map to standardized format with tickets
      return list.map(event => ({
        value: event.id,
        label: event.name,
        event_key:event.event_key || '',
        tickets: event.tickets || []
      }));
    },
    enabled: !!organizerId,
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

// ============================================
// BANNER HOOKS
// ============================================

/**
 * GET /banner-show/{id}
 * Fetch single banner details
 */
export const useBanner = (id, options = {}) =>
  useQuery({
    queryKey: ['banner', id],
    queryFn: async () => {
      if (!id) throw new Error('Banner ID is required');
      
      const res = await api.get(`banner-show/${id}`);
      
      if (!res?.status) {
        throw new Error(res?.message || 'Failed to fetch banner');
      }
      
      return res?.data || {};
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * GET /banners (assuming this endpoint exists for listing)
 * Fetch all banners
 */
export const useBanners = (options = {}) =>
  useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await api.get('all-banners');
      const payload = res;

      if (!payload?.status) {
        throw new Error(payload?.message || 'Failed to fetch banners');
      }

      return payload?.data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });


/**
 * POST /banner-store
 * Create new banner
 */
export const useCreateBanner = (options = {}) =>
  useMutation({
    mutationFn: async (formData) => {
      // FormData should be passed directly
      const res = await api.post('banner-store', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create banner');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /banner-update/{id}
 * Update existing banner
 */
export const useUpdateBanner = (options = {}) =>
  useMutation({
    mutationFn: async ({ id, formData }) => {
      if (!id) throw new Error('Banner ID is required');
      
      // FormData should be passed directly
      const res = await api.post(`banner-update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update banner');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * DELETE /banner-destroy/{id}
 * Delete banner
 */
export const useDeleteBanner = (options = {}) =>
  useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('Banner ID is required');
      
      const res = await api.delete(`banner-destroy/${id}`);
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to delete banner');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });

/**
 * POST /rearrange-banner/{type}
 * Rearrange banner order
 * @param {string} type - 'main' or 'category'
 */
export const useRearrangeBanner = (options = {}) =>
  useMutation({
    mutationFn: async ({ type, banners }) => {
      if (!type) throw new Error('Banner type is required');
      if (!Array.isArray(banners)) throw new Error('Banners array is required');
      
      const res = await api.post(`rearrange-banner/${type}`, { banners });
      
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to rearrange banners');
        err.server = res;
        throw err;
      }
      
      return res;
    },
    ...options,
  });


export const useEventsByCategories = (categoryTitle, options = {}) => {
  const enabledFromCaller = options.enabled ?? true;

  return useQuery({
    queryKey: ['category-events', categoryTitle],
    enabled: Boolean(categoryTitle) && Boolean(enabledFromCaller),
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    queryFn: async () => {
      // Better error message
      if (!categoryTitle) throw new Error('Category title is required');

      const res = await api.get(`category-events/${encodeURIComponent(categoryTitle)}`);

      // If you're using Axios, res.status is a number (200, 404, etc.)
      // Adjust checks to match your API client
      if (res?.status !== 200 && res?.status !== true) {
        throw new Error(res?.message || 'Failed to fetch category events');
      }

      // For Axios, events are typically at res.data
      // Return an array; the component maps over it
      return res?.events ?? [];
    },
    ...options, // allow caller to override other options (but not enabled/queryKey/queryFn)
  });
};
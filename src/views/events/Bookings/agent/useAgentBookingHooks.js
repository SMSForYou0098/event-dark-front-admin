// hooks/useAgentBookingHooks.js
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

/**
 * Helper: Convert base64/dataURL to File object
 */
const dataURLtoFile = (dataurl, filename) => {
  if (!dataurl || typeof dataurl !== 'string') return null;
  
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    if (!mime) return null;
    
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Error converting dataURL to File:', error);
    return null;
  }
};

/**
 * Helper: build FormData for attendees payload (handles files and data URIs)
 * Accepts: { attendees: Array, userMeta: object, fieldGroupName: string }
 */
export const buildAttendeesFormData = ({ attendees = [], userMeta = {}, fieldGroupName = 'attendees' } = {}) => {
  const fd = new FormData();

  attendees.forEach((attendee, index) => {
    Object.keys(attendee).forEach((fieldKey) => {
      const fieldValue = attendee[fieldKey];

      // Skip internal/meta fields
      if (['id', 'created_at', 'updated_at', 'deleted_at', 'status', 'booking_id', 
           'user_id', 'agent_id', 'token', 'ticketId'].includes(fieldKey)) {
        return;
      }

      // ✅ Handle base64/data URLs - Convert to File
      if (typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
        const fileExtension = fieldValue.match(/data:image\/(.*?);/)?.[1] || 'jpg';
        const fileName = `${fieldKey}_${index}_${Date.now()}.${fileExtension}`;
        const file = dataURLtoFile(fieldValue, fileName);
        
        if (file) {
          fd.append(`${fieldGroupName}[${index}][${fieldKey}]`, file);
        } else {
          console.warn(`Failed to convert ${fieldKey} for attendee ${index}`);
        }
      } 
      // ✅ Handle File objects directly
      else if (fieldValue instanceof File) {
        fd.append(`${fieldGroupName}[${index}][${fieldKey}]`, fieldValue);
      } 
      // ✅ Handle Blob objects
      else if (fieldValue instanceof Blob) {
        const fileName = `${fieldKey}_${index}_${Date.now()}.jpg`;
        fd.append(`${fieldGroupName}[${index}][${fieldKey}]`, fieldValue, fileName);
      }
      // ✅ Handle already uploaded URLs (http/https)
      else if (typeof fieldValue === 'string' && (fieldValue.startsWith('http://') || fieldValue.startsWith('https://'))) {
        // For existing URLs, just send the URL string
        fd.append(`${fieldGroupName}[${index}][${fieldKey}]`, fieldValue);
      }
      // ✅ Handle regular values (strings, numbers, etc.)
      else if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        fd.append(`${fieldGroupName}[${index}][${fieldKey}]`, String(fieldValue));
      }
    });
  });

  // Append user meta
  Object.entries(userMeta || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      fd.append(k, String(v));
    }
  });

  return fd;
};

/* ============================
   Queries
   ============================ */

/**
 * Fetch attendees for a user/category
 * usage: const { data, refetch } = useUserAttendees({ userId, categoryId, isCorporate, isAgent, enabled })
 */
export const useUserAttendees = ({ userId, categoryId, isCorporate = false, isAgent = true, enabled = true } = {}) =>
  useQuery({
    queryKey: ['user-attendees', userId, categoryId, isCorporate, isAgent],
    enabled: enabled && !!categoryId && !!userId,
    queryFn: async () => {
      const endpoint = isCorporate
        ? `corporate-attendee/${userId}/${categoryId}`
        : `user-attendee/${userId}/${categoryId}?isAgent=${isAgent}`;

      const res = await api.get(endpoint);
      if (res?.status && Array.isArray(res.attendees)) {
        return res.attendees;
      }
      // gracefully return empty array if nothing
      return [];
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
  });

/**
 * Fetch category data used by your component
 * usage: const { data } = useCategoryData(categoryId, { enabled: !!categoryId })
 * Note: your component calls fetchCategoryData which should align to this hook's return (categoryData, customFieldsData, etc.)
 */
export const useCategoryData = (categoryId, options = {}) =>
  useQuery({
    queryKey: ['category-data', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const res = await api.get(`category-detail/${categoryId}`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch category data');
        err.server = res;
        throw err;
      }
      // return raw server object so calling code can access categoryData, customFieldsData etc.
      return res;
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/* ============================
   Mutations
   ============================ */

/**
 * Check email + number existing
 * POST: chek-email
 * payload: { email, number }
 */
export const useCheckEmail = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('chek-email', payload);
      // keep raw response for upstream logic
      return res;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Create user
 * POST: create-user
 * formData expected (FormData)
 */
export const useCreateUser = (options = {}) =>
  useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('create-user', formData);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create user');
        err.server = res;
        throw err;
      }
      return res;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Update user
 * POST: update-user/{userId}
 * params: { userId, formData }
 */
export const useUpdateUser = (options = {}) =>
  useMutation({
    mutationFn: async ({ userId, formData }) => {
      if (!userId) throw new Error('userId is required');
      const res = await api.post(`update-user/${userId}`, formData);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to update user');
        err.server = res;
        throw err;
      }
      return res;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Store attendees
 * POST: attndy-store OR corporate-user-store (based on isCorporate flag)
 * Returns: Array of saved attendees with IDs
 */
export const useStoreAttendees = (options = {}) =>
  useMutation({
    mutationFn: async ({ formData, isCorporate = false }) => {
      const endpoint = isCorporate ? 'corporate-user-store' : 'attndy-store';
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const res = await api.post(endpoint, formData, config);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to store attendees');
        err.server = res;
        throw err;
      }
      // ✅ Return full response with saved attendee data
      return res;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Corporate booking
 * POST: corporate-pos/true
 * payload: plain object
 */
export const useCorporateBooking = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('corporate-pos/true', payload);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create corporate booking');
        err.server = res;
        throw err;
      }
      return res;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/**
 * Agent booking (generic)
 * POST: variable url (e.g. agent-book-ticket/{eventID} or amusement-agent-book-ticket/{eventID})
 * mutate payload: { url, formData }
 */
export const useAgentBooking = (options = {}) => {
  return useMutation({
    mutationFn: async ({ url, payload }) => {
      const response = await api.post(
        `${url}`,
        payload, // ✅ Send as JSON
      );
      return response;
    },
    ...options
  });
};

/**
 * Master booking
 * POST: variable url
 * mutate payload: { url, payload }
 */
export const useMasterBooking = (options = {}) =>
  useMutation({
    mutationFn: async ({ url, payload }) => {
      if (!url) throw new Error('URL is required for master booking');
      const res = await api.post(url, payload);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to create master booking');
        err.server = res;
        throw err;
      }
      return res;
    },
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });

/* ============================
   Convenience / helper hooks
   ============================ */

/**
 * Fetch booking history for agent/user (if you need)
 * GET: booking-history or agent-bookings endpoints (adjust name/path as per backend)
 */
export const useBookingHistory = (userId, options = {}) =>
  useQuery({
    queryKey: ['booking-history', userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`booking-history/${userId}`);
      if (!res?.status) {
        const err = new Error(res?.message || 'Failed to fetch booking history');
        err.server = res;
        throw err;
      }
      return res.bookings || [];
    },
    staleTime: 2 * 60 * 1000,
    retry: (count, err) => {
      const status = err?.response?.status;
      return status >= 500 && count < 2;
    },
    ...options,
  });



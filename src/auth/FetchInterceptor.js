// apiService.js
import axios from 'axios';
import { notification } from 'antd';
import store from '../store'; // default export store
// if your store exports named 'store', change accordingly
import { signOutSuccess, logout } from 'store/slices/authSlice'; // adjust path
import { AUTH_TOKEN } from 'constants/AuthConstant';
import { API_BASE_URL } from 'configs/AppConfig';

const DEFAULT_TIMEOUT = 60000;
// NOTE: you included 400 earlier — keep if you intentionally treat 400 as auth-related
const unauthorizedCodes = [400, 401, 403];

const getToken = () => {
  // Prefer Redux state token (keeps single source if auth is in store)
  try {
    const stateToken = store?.getState?.().auth?.token;
    if (stateToken) return stateToken;
  } catch (e) { /* ignore */ }

  // Fallback to localStorage for persisted flows
  try {
    const local = localStorage.getItem(AUTH_TOKEN);
    if (local) return local;
  } catch (e) { /* ignore */ }

  return null;
};

// Public API instance (no auth)
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_PATH || API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: DEFAULT_TIMEOUT,
});

// Authenticated API instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_PATH || API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: DEFAULT_TIMEOUT,
});

// Request interceptor: attach Authorization header (Bearer)
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * - For binary responses (responseType === 'blob' or 'arraybuffer') return the full response
 *   so callers can access headers (e.g. content-disposition).
 * - For normal JSON responses return response.data if available (convenience).
 */
api.interceptors.response.use(
  (response) => {
    try {
      const responseType = response?.config?.responseType;
      const hasContentDisposition =
        response?.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition']);

      // If the request explicitly expected a binary payload, return the full response
      if (responseType === 'blob' || responseType === 'arraybuffer' || hasContentDisposition) {
        return response;
      }

      // Default convenient behavior: return response.data if present, otherwise the full response
      return response.data !== undefined ? response.data : response;
    } catch (e) {
      // Defensive fallback
      return response.data !== undefined ? response.data : response;
    }
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    // Defensive: if no response (network error / CORS / timeout)
    if (!error?.response) {
      notification.error({
        message: 'Network Error',
        description: 'Unable to reach server. Please check your connection.',
      });
      return Promise.reject(error);
    }

    // Unauthorized / authentication failures
    if (unauthorizedCodes.includes(status)) {
      // Clear persisted token (choose one approach)
      try {
        localStorage.removeItem(AUTH_TOKEN);
      } catch (e) {}

      // Dispatch a redux action to update auth state
      if (store?.dispatch) {
        if (typeof logout === 'function') {
          store.dispatch(logout());
        } else if (typeof signOutSuccess === 'function') {
          store.dispatch(signOutSuccess());
        }
      }

      notification.error({
        message: 'Authentication failed',
        description: 'Please login again.',
      });

      return Promise.reject(error);
    }

    // Rate limit
    if (status === 429) {
      notification.error({
        message: 'Too many requests',
        description: 'You are sending requests too quickly. Please wait a moment.',
      });
      return Promise.reject(error);
    }

    // Specific status messaging (404/500/508 etc)
    if (status === 404) {
      notification.error({ message: 'Not Found', description: `Resource not found: ${url}` });
    } else if (status === 500) {
      notification.error({ message: 'Server Error', description: 'Something went wrong on server.' });
    } else if (status === 408 || status === 508) {
      notification.error({ message: 'Request Timeout', description: 'Request timed out.' });
    } else {
      // Generic fallback: prefer server-supplied message if present
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        'An error occurred';
      notification.error({
        message: 'Error',
        description: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg),
      });
    }

    return Promise.reject(error);
  }
);

export default api;

// apiService.js
import axios from 'axios';
import store from '../store'; // default export store
// if your store exports named 'store', change accordingly
import { signOutSuccess, logout } from 'store/slices/authSlice'; // adjust path
import { AUTH_TOKEN } from 'constants/AuthConstant';
import { API_BASE_URL } from 'configs/AppConfig';
import { message } from 'antd';

const DEFAULT_TIMEOUT = 60000;
// NOTE: you included 400 earlier — keep if you intentionally treat 400 as auth-related
const unauthorizedCodes = [403];

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
  baseURL: process.env.REACT_APP_API_ENDPOINT_URL || API_BASE_URL || '',
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
      message.error('Network Error: Unable to reach server. Please check your connection.');
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
          // store.dispatch(logout());
        } else if (typeof signOutSuccess === 'function') {
          // store.dispatch(signOutSuccess());
        }
      }
      message.error('Your session has expired or you are not authorized. Please log in again.');

      return Promise.reject(error);
    }

    // Rate limit
    if (status === 429) {
      message.error('Too many requests: You are sending requests too quickly. Please wait a moment.');
      return Promise.reject(error);
    }

    // Specific status messaging (404/500/508 etc)
    if (status === 404) {
      message.error(`Resource not found: ${url}`);
    } else if (status === 500) {
      message.error('Server Error: Something went wrong on server.');
    } else if (status === 408 || status === 508) {
      message.error('Request Timeout: Request timed out.');
    } else {
      // Generic fallback: prefer server-supplied message if present
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        'An error occurred';
      message.error(`Error ${status}: ${serverMsg}`);
    }

    return Promise.reject(error);
  }
);
// import logo from '../../../../assets/images/logo.png';
const source = axios.CancelToken.source();
export const cancelToken = source.token

export default api;

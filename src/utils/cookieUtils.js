/**
 * Set a cookie with optional configuration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 * @param {number} options.days - Expiration in days (default: 7)
 * @param {string} options.path - Cookie path (default: '/')
 * @param {boolean} options.secure - Secure flag (default: true in production)
 * @param {string} options.sameSite - SameSite attribute (default: 'strict')
 */
export const setCookie = (name, value, options = {}) => {
  if (typeof window === 'undefined') return; // Server-side safety
  
  const {
    days = 7,
    path = '/',
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict'
  } = options;
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  // Set expiration
  if (days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  
  // Add other attributes
  cookieString += `; path=${path}`;
  
  if (secure) {
    cookieString += '; secure';
  }
  
  cookieString += `; samesite=${sameSite}`;
  
  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  if (typeof window === 'undefined') return null; // Server-side safety
  
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }
  return null;
};

/**
 * Remove a cookie by name
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path (default: '/')
 */
export const removeCookie = (name, path = '/') => {
  if (typeof window === 'undefined') return; // Server-side safety
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} True if cookie exists
 */
export const cookieExists = (name) => {
  return getCookie(name) !== null;
};

/**
 * Get all cookies as an object
 * @returns {Object} Object with cookie names as keys and values as values
 */
export const getAllCookies = () => {
  if (typeof window === 'undefined') return {}; // Server-side safety
  
  const cookies = {};
  const cookieString = document.cookie;
  
  if (cookieString) {
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  
  return cookies;
};

/**
 * Clear all cookies (client-side only, won't work for httpOnly cookies)
 */
export const clearAllCookies = () => {
  if (typeof window === 'undefined') return; // Server-side safety
  
  const cookies = getAllCookies();
  Object.keys(cookies).forEach(cookieName => {
    removeCookie(cookieName);
  });
};

// Auth-specific cookie utilities
/**
 * Set authentication token cookie
 * @param {string} token - Auth token
 * @param {number} days - Expiration in days (default: 7)
 */
export const setAuthToken = (token, days = 7) => {
  setCookie('authToken', token, { days });
};

/**
 * Get authentication token from cookie
 * @returns {string|null} Auth token or null
 */
export const getAuthToken = () => {
  return getCookie('authToken');
};

/**
 * Remove authentication token cookie
 */
export const removeAuthToken = () => {
  removeCookie('authToken');
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return token !== null && token.length > 0;
};

export const setUserData = (userData, days = 7) => {
  setCookie('userData', JSON.stringify(userData), { days });
};

export const getUserData = () => {
  const userData = getCookie('userData');
  try {
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data from cookie:', error);
    return null;
  }
};
export const removeUserData = () => {
  removeCookie('userData');
};

/**
 * Complete logout - removes all auth-related cookies
 */
export const logoutUser = () => {
  removeAuthToken();
  removeUserData();
  // Add any other auth-related cookies you want to remove
};



export default {
  setCookie,
  getCookie,
  removeCookie,
  cookieExists,
  getAllCookies,
  clearAllCookies,
  // Auth utilities
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
  setUserData,
  getUserData,
  removeUserData,
  logoutUser,

};
import { api } from 'auth/FetchInterceptor';

/**
 * Look up a user by phone number
 * @param {string} phoneNumber - Phone number to search
 * @returns {Promise<{status: boolean, user?: object, message?: string}>}
 */
export const getUserByPhone = async (phoneNumber) => {
  try {
    const response = await api.get(`user-from-number/${phoneNumber}`);
    // api already returns response.data from interceptor
    return response;
  } catch (error) {
    return {
      status: false,
      message: error?.response?.data?.message || 'User not found',
    };
  }
};

/**
 * Create or verify a user for transfer
 * @param {object} userData - { name, number, event_id, email? }
 * @returns {Promise<{status: boolean, user?: object, data?: object, message?: string}>}
 */
export const createTransferUser = async (userData) => {
  try {
    const response = await api.post('bookings/verify-user', userData);
    return response;
  } catch (error) {
    return {
      status: false,
      message: error?.response?.data?.message || 'Failed to create or verify user',
    };
  }
};

/**
 * Transfer booking to another user
 * @param {object} payload - { is_master, booking_id, transfer_from, transfer_to, hash_key, quantity, event_id }
 * @returns {Promise<{status: boolean, message?: string}>}
 */
export const transferBooking = async (payload) => {
  try {
    const response = await api.post('bookings/transfer', payload);
    return response;
  } catch (error) {
    return {
      status: false,
      message: error?.response?.data?.message || 'Failed to transfer booking',
    };
  }
};

/**
 * Verify OTP for ticket transfer
 * @param {object} payload - { number, otp, event_id }
 * @returns {Promise<{status: boolean, data?: object, message?: string}>}
 */
export const verifyTransferOtp = async (payload) => {
  try {
    const response = await api.post('bookings/verify-transfer-otp', payload);
    return response;
  } catch (error) {
    return {
      status: false,
      message: error?.response?.data?.message || 'Failed to verify OTP',
    };
  }
};


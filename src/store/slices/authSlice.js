/**
 * MERGED AUTH SLICE
 * ------------------------------------------------------------
 * ✅ Current Theme (Custom API) is preserved as the main flow
 * ✅ Default Theme (Firebase) is included side-by-side
 * ✅ Nothing removed; conflicts resolved via namespacing + comments
 * ------------------------------------------------------------
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/* =========================
 * DEFAULT THEME (Firebase) – Imports & Constants
 * ========================= */

/* =========================
 * CURRENT THEME (Custom API) – Imports & Constants
 * ========================= */
import axios from 'axios';
import { API_BASE_URL } from 'configs/AppConfig';
import { AUTH_TOKEN } from 'constants/AuthConstant';
import FirebaseService from 'services/FirebaseService';

/* =========================
 * INITIAL STATE (Superset of both themes)
 * ========================= */
export const initialState = {
  // Common
  loading: false,
  message: '',
  showMessage: false,
  redirect: '',

  // Default Theme (Firebase)
  // token: localStorage.getItem(AUTH_TOKEN) || null,
  token: localStorage.getItem(AUTH_TOKEN) || null,

  // Current Theme (Custom API)
  twoFactor: false,
  user: [],
  session_id: null,     // session_key in fulfilled mapped here
  auth_session: null,   // user.id in fulfilled mapped here
  isImpersonating: false,

  // OTP Rate Limiting
  otpCooldownEnd: null, // Timestamp when cooldown expires
  otpCooldownNumber: null, // Phone number that the cooldown applies to
};

/* ============================================================
 * THUNKS
 * ============================================================
 */

/* =========================
 * CURRENT THEME (Custom API)
 * -------------------------
 * NOTE: This remains the PRIMARY sign-in thunk (`signIn`)
 * Matches your current slice:
 *   POST `${api}login` with { password, number, passwordRequired, session_id, auth_session, otp }
 * ========================= */
export const signIn = createAsyncThunk(
  'login',
  async (data, { rejectWithValue }) => {
    try {
      const {
        password,
        number,
        passwordRequired,
        session_id,
        auth_session,
        otp,
      } = data;

      const response = await axios.post(`${API_BASE_URL}login`, {
        password,
        number,
        passwordRequired,
        session_id,
        auth_session,
        otp,
      });

      return response.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.emailError
          ? err.response.data.emailError
          : err?.response?.data?.message
            ? err.response.data.message
            : err?.response?.data?.error
              ? err.response.data.error
              : err?.response?.data?.passwordError
                ? err.response.data.passwordError
                : err?.response?.data?.ipAuthError
                  ? err.response.data.ipAuthError
                  : 'Server Error'
      );
    }
  }
);

/* =========================
 * DEFAULT THEME (Firebase)
 * -------------------------
 * Kept intact, but the conflicting "signIn" is renamed to
 * `signInFirebase` so BOTH flows can coexist.
 * ========================= */
export const signInFirebase = createAsyncThunk(
  'auth/signIn', // keep original type for compatibility
  async (data, { rejectWithValue }) => {
    const { email, password } = data;
    try {
      const response = await FirebaseService.signInEmailRequest(email, password);
      if (response.user) {
        const token = response.user.refreshToken;
        localStorage.setItem(AUTH_TOKEN, token);
        return token;
      } else {
        return rejectWithValue(response.message?.replace('Firebase: ', ''));
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Error');
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (data, { rejectWithValue }) => {
    const { email, password } = data;
    try {
      const response = await FirebaseService.signUpEmailRequest(email, password);
      if (response.user) {
        const token = response.user.refreshToken;
        localStorage.setItem(AUTH_TOKEN, token);
        return token;
      } else {
        return rejectWithValue(response.message?.replace('Firebase: ', ''));
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Error');
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const response = await FirebaseService.signOutRequest();
  localStorage.removeItem(AUTH_TOKEN);
  return response.data;
});

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await FirebaseService.signInGoogleRequest();
      if (response.user) {
        const token = response.user.refreshToken;
        localStorage.setItem(AUTH_TOKEN, token);
        return token;
      } else {
        return rejectWithValue(response.message?.replace('Firebase: ', ''));
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Error');
    }
  }
);

export const signInWithFacebook = createAsyncThunk(
  'auth/signInWithFacebook',
  async (_, { rejectWithValue }) => {
    try {
      const response = await FirebaseService.signInFacebookRequest();
      if (response.user) {
        const token = response.user.refreshToken;
        localStorage.setItem(AUTH_TOKEN, token);
        return token;
      } else {
        return rejectWithValue(response.message?.replace('Firebase: ', ''));
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Error');
    }
  }
);

/* ============================================================
 * SLICE
 * ============================================================
 */

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /* =========================
     * COMMON / SHARED REDUCERS
     * ========================= */
    showAuthMessage: (state, action) => {
      state.message = action.payload;
      state.showMessage = true;
      state.loading = false;
    },
    hideAuthMessage: (state) => {
      state.message = '';
      state.showMessage = false;
    },
    showLoading: (state) => {
      state.loading = true;
    },
    signInSuccess: (state, action) => {
      // Kept for compatibility – you can use it to set token manually
      state.loading = false;
      state.token = action.payload;
    },

    /* =========================
     * DEFAULT THEME (Firebase)
     * ========================= */
    authenticated: (state, action) => {
      // Default theme behavior: set token + redirect
      state.loading = false;
      state.redirect = '/';
      state.token = action.payload.token;
      state.session_id = action.payload.session_id;
      state.user = action.payload.user;
      state.auth_session = action.payload.auth_session;
      state.isImpersonating = action.payload.isImpersonating || false;
    },
    signOutSuccess: (state) => {
      // Default theme behavior
      state.loading = false;
      state.token = null;
      state.redirect = '/';
      state.isImpersonating = false;
    },

    /* =========================
     * CURRENT THEME (Custom API)
     * ========================= */
    logout: (state) => {
      // Your current theme's deep-clean logout
      state.loading = false;
      state.token = null;
      state.user = [];
      state.redirect = '/';
      state.twoFactor = false;
      state.session_id = null;
      state.auth_session = null;
      state.isImpersonating = false;

      // ✅ Clear localStorage & sessionStorage & cookies
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
    },
    updateUser: (state, action) => {
      // Merge shallow fields; preserve permissions from existing user
      const updatedUser = action.payload;
      state.user = {
        ...state.user,
        ...updatedUser,
        permissions: state.user?.permissions,
      };
    },
    validateTwoFector: (state) => {
      state.twoFactor = false;
    },

    /* =========================
     * OTP RATE LIMITING
     * ========================= */
    setOtpCooldown: (state, action) => {
      // action.payload should be { timestamp, phoneNumber }
      state.otpCooldownEnd = action.payload.timestamp;
      state.otpCooldownNumber = action.payload.phoneNumber;
    },
    clearOtpCooldown: (state) => {
      state.otpCooldownEnd = null;
      state.otpCooldownNumber = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* =========================
       * CURRENT THEME (Custom API) — signIn
       * ========================= */
      .addCase(signIn.pending, (state) => {
        state.loading = true;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        // If backend requires 2FA, flag it
        if (action?.payload?.user?.two_fector_auth === 'true') {
          state.twoFactor = true;
        }
        state.loading = false;
        state.token = action.payload?.token || null;
        state.user = action.payload?.user || [];

        // ✅ Map session details consistently
        state.session_id = action.payload?.session_key ?? null;
        state.auth_session = action.payload?.user?.id ?? null;

        // Optional: you can set redirect here if your app needs it
        // state.redirect = '/';
      })
      .addCase(signIn.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })

      /* =========================
       * DEFAULT THEME (Firebase) — signInFirebase
       * ========================= */
      .addCase(signInFirebase.pending, (state) => {
        state.loading = true;
      })
      .addCase(signInFirebase.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = '/';
        state.token = action.payload; // Firebase refreshToken
      })
      .addCase(signInFirebase.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })

      /* =========================
       * DEFAULT THEME (Firebase) — signUp
       * ========================= */
      .addCase(signUp.pending, (state) => {
        state.loading = true;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = '/';
        state.token = action.payload;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })

      /* =========================
       * DEFAULT THEME (Firebase) — signOut
       * ========================= */
      .addCase(signOut.fulfilled, (state) => {
        // Keep default theme behavior,
        // but we also ensure deeper cleanup to align with your current theme
        state.loading = false;
        state.token = null;
        state.redirect = '/';
        state.isImpersonating = false;

        // Optional: mirror current theme deep clean on signOut
        try {
          localStorage.removeItem(AUTH_TOKEN);
          // If you want full purge like current theme:
          // localStorage.clear();
          // sessionStorage.clear();
        } catch (_) { }
      })
      .addCase(signOut.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.redirect = '/';
        state.isImpersonating = false;
      })

      /* =========================
       * DEFAULT THEME (Firebase) — Social sign-ins
       * ========================= */
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = '/';
        state.token = action.payload;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })
      .addCase(signInWithFacebook.pending, (state) => {
        state.loading = true;
      })
      .addCase(signInWithFacebook.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = '/';
        state.token = action.payload;
      })
      .addCase(signInWithFacebook.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      });
  },
});

/* ============================================================
 * EXPORTS
 * ============================================================
 */

// Actions
export const {
  // Common
  showAuthMessage,
  hideAuthMessage,
  showLoading,
  signInSuccess,

  // Default Theme (Firebase)
  authenticated,
  signOutSuccess,

  // Current Theme (Custom API)
  logout,
  updateUser,
  validateTwoFector,

  // OTP Rate Limiting
  setOtpCooldown,
  clearOtpCooldown,
} = authSlice.actions;

// Default export
export default authSlice.reducer;
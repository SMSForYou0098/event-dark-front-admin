import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    refundHashKey: null, // Hash key from OTP verification for refund authorization
    refundPassword: null, // Password for refund authorization
};

export const refundSlice = createSlice({
    name: 'refund',
    initialState,
    reducers: {
        setRefundHashKey: (state, action) => {
            // Payload can be either a string (legacy) or an object { hash_key, password }
            if (typeof action.payload === 'object' && action.payload !== null) {
                state.refundHashKey = action.payload.hash_key;
                state.refundPassword = action.payload.password;
            } else {
                state.refundHashKey = action.payload;
            }
        },
        clearRefundHashKey: (state) => {
            state.refundHashKey = null;
            state.refundPassword = null;
        },
    },
});

// Export actions
export const { setRefundHashKey, clearRefundHashKey } = refundSlice.actions;

// Export reducer
export default refundSlice.reducer;

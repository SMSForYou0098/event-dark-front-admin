import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // Connection preferences (persisted)
    connectionMode: 'ble', // 'usb' or 'ble' - default to bluetooth for mobile compatibility
    lastConnectedDevice: null, // Store device name for reconnection
    
    // Connection state (runtime - not persisted but synced with context)
    isConnected: false,
    status: 'Not Connected',
    deviceName: '',
};

const printerSlice = createSlice({
    name: 'printer',
    initialState,
    reducers: {
        setConnectionMode: (state, action) => {
            state.connectionMode = action.payload;
        },
        setConnected: (state, action) => {
            state.isConnected = action.payload.isConnected;
            state.status = action.payload.status;
            state.deviceName = action.payload.deviceName || '';
            if (action.payload.deviceName) {
                state.lastConnectedDevice = action.payload.deviceName;
            }
        },
        setDisconnected: (state) => {
            state.isConnected = false;
            state.status = 'Not Connected';
            state.deviceName = '';
        },
        setStatus: (state, action) => {
            state.status = action.payload;
        },
        resetPrinterState: (state) => {
            state.isConnected = false;
            state.status = 'Not Connected';
            state.deviceName = '';
        },
    },
});

export const {
    setConnectionMode,
    setConnected,
    setDisconnected,
    setStatus,
    resetPrinterState,
} = printerSlice.actions;

// Selectors
export const selectPrinterState = (state) => state.printer;
export const selectConnectionMode = (state) => state.printer?.connectionMode || 'ble';
export const selectIsConnected = (state) => state.printer?.isConnected || false;
export const selectPrinterStatus = (state) => state.printer?.status || 'Not Connected';
export const selectDeviceName = (state) => state.printer?.deviceName || '';
export const selectLastConnectedDevice = (state) => state.printer?.lastConnectedDevice || null;

export default printerSlice.reducer;

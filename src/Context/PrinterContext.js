import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setConnectionMode as setConnectionModeAction,
    setConnected,
    setDisconnected,
    setStatus,
    selectConnectionMode,
    selectIsConnected,
    selectPrinterStatus,
    selectDeviceName,
} from '../store/slices/printerSlice';

const PrinterContext = createContext();

export const PrinterProvider = ({ children }) => {
    const dispatch = useDispatch();
    
    // Get state from Redux
    const connectionMode = useSelector(selectConnectionMode);
    const isConnected = useSelector(selectIsConnected);
    const status = useSelector(selectPrinterStatus);
    const deviceName = useSelector(selectDeviceName);

    // USB state
    const usbPortRef = useRef(null);

    // Bluetooth state
    const bleDeviceRef = useRef(null);
    const bleCharacteristicRef = useRef(null);

    // Set connection mode via Redux
    const setConnectionMode = useCallback((mode) => {
        dispatch(setConnectionModeAction(mode));
    }, [dispatch]);

    // Helper to update status
    const updateStatus = useCallback((newStatus) => {
        dispatch(setStatus(newStatus));
    }, [dispatch]);

    // === USB CONNECTION ===
    const connectUSB = useCallback(async () => {
        try {
            if (!('serial' in navigator)) {
                throw new Error('Web Serial API not supported. Please use Chrome/Edge browser.');
            }

            updateStatus('Requesting USB Device...');
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600, flowControl: 'none' });

            usbPortRef.current = port;
            dispatch(setConnected({
                isConnected: true,
                status: 'USB Connected',
                deviceName: 'USB Printer'
            }));
            dispatch(setConnectionModeAction('usb'));

            return true;
        } catch (err) {
            console.error('USB connection error:', err);
            updateStatus('USB Connection Failed');
            if (err.name !== 'NotFoundError') {
                throw err;
            }
            return false;
        }
    }, [dispatch, updateStatus]);

    // === BLUETOOTH CONNECTION ===
    const connectBluetooth = useCallback(async () => {
        try {
            if (!navigator.bluetooth) {
                throw new Error('Web Bluetooth not supported. Please use Chrome/Edge browser.');
            }

            updateStatus('Scanning for Bluetooth Devices...');

            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', // Printer Service
                    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Custom
                    '00001101-0000-1000-8000-00805f9b34fb', // Serial Port
                ]
            });

            updateStatus(`Connecting to ${device.name || 'Device'}...`);

            // Handle disconnect event
            device.addEventListener('gattserverdisconnected', () => {
                console.log('Bluetooth device disconnected');
                dispatch(setDisconnected());
            });

            const server = await device.gatt.connect();
            updateStatus('Discovering Services...');

            const services = await server.getPrimaryServices();
            let foundChar = null;

            for (const service of services) {
                try {
                    const characteristics = await service.getCharacteristics();
                    for (const char of characteristics) {
                        if (char.properties.write || char.properties.writeWithoutResponse) {
                            foundChar = char;
                            break;
                        }
                    }
                    if (foundChar) break;
                } catch (err) {
                    console.warn('Could not access characteristics:', err);
                }
            }

            if (!foundChar) {
                throw new Error('No writable characteristic found');
            }

            bleDeviceRef.current = device;
            bleCharacteristicRef.current = foundChar;
            
            dispatch(setConnected({
                isConnected: true,
                status: `Connected: ${device.name || 'Bluetooth Printer'}`,
                deviceName: device.name || 'Bluetooth Printer'
            }));
            dispatch(setConnectionModeAction('ble'));

            return true;
        } catch (err) {
            console.error('Bluetooth connection error:', err);
            updateStatus('Bluetooth Connection Failed');
            if (err.name !== 'NotFoundError') {
                throw err;
            }
            return false;
        }
    }, [dispatch, updateStatus]);

    // === CLEANUP BLE ===
    const cleanupBle = useCallback(() => {
        if (bleDeviceRef.current) {
            try {
                if (bleDeviceRef.current.gatt?.connected) {
                    bleDeviceRef.current.gatt.disconnect();
                }
            } catch (err) {
                console.warn('BLE disconnect error:', err);
            }
            bleDeviceRef.current = null;
            bleCharacteristicRef.current = null;
        }
    }, []);

    // === CLEANUP USB ===
    const cleanupUsb = useCallback(async () => {
        if (usbPortRef.current) {
            try {
                await usbPortRef.current.close();
            } catch (err) {
                console.warn('USB close error:', err);
            }
            usbPortRef.current = null;
        }
    }, []);

    // === DISCONNECT ===
    const disconnect = useCallback(async () => {
        if (connectionMode === 'usb') {
            await cleanupUsb();
        } else {
            cleanupBle();
        }
        dispatch(setDisconnected());
    }, [connectionMode, cleanupUsb, cleanupBle, dispatch]);

    // === SEND DATA TO PRINTER ===
    const sendData = useCallback(async (data) => {
        if (!isConnected) {
            throw new Error('Printer not connected');
        }

        // Convert string to Uint8Array if needed
        let encodedData;
        if (typeof data === 'string') {
            const encoder = new TextEncoder();
            encodedData = encoder.encode(data);
        } else if (data instanceof Uint8Array) {
            encodedData = data;
        } else {
            throw new Error('Invalid data type. Expected string or Uint8Array');
        }

        if (connectionMode === 'usb') {
            if (!usbPortRef.current?.writable) {
                throw new Error('USB port not writable');
            }
            const writer = usbPortRef.current.writable.getWriter();
            await writer.write(encodedData);
            await writer.releaseLock();
        } else {
            if (!bleCharacteristicRef.current) {
                throw new Error('Bluetooth characteristic not available');
            }
            // Bluetooth Send (with chunking for reliability)
            const CHUNK_SIZE = 100;
            for (let i = 0; i < encodedData.byteLength; i += CHUNK_SIZE) {
                const chunk = encodedData.slice(i, i + CHUNK_SIZE);
                await bleCharacteristicRef.current.writeValue(chunk);
                await new Promise(r => setTimeout(r, 20));
            }
        }

        return true;
    }, [isConnected, connectionMode]);

    // === SEND RAW BYTES (for QR codes, images, etc.) ===
    const sendRawBytes = useCallback(async (bytes) => {
        if (!isConnected) {
            throw new Error('Printer not connected');
        }

        const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

        if (connectionMode === 'usb') {
            if (!usbPortRef.current?.writable) {
                throw new Error('USB port not writable');
            }
            const writer = usbPortRef.current.writable.getWriter();
            await writer.write(data);
            await writer.releaseLock();
        } else {
            if (!bleCharacteristicRef.current) {
                throw new Error('Bluetooth characteristic not available');
            }
            const CHUNK_SIZE = 100;
            for (let i = 0; i < data.byteLength; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                await bleCharacteristicRef.current.writeValue(chunk);
                await new Promise(r => setTimeout(r, 20));
            }
        }

        return true;
    }, [isConnected, connectionMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupUsb();
            cleanupBle();
        };
    }, [cleanupUsb, cleanupBle]);

    const contextValue = {
        // State
        connectionMode,
        setConnectionMode,
        isConnected,
        status,
        deviceName,

        // Actions
        connectUSB,
        connectBluetooth,
        disconnect,
        sendData,
        sendRawBytes,
    };

    return (
        <PrinterContext.Provider value={contextValue}>
            {children}
        </PrinterContext.Provider>
    );
};

export const usePrinter = () => {
    const context = useContext(PrinterContext);
    if (!context) {
        throw new Error('usePrinter must be used within a PrinterProvider');
    }
    return context;
};

export default PrinterContext;

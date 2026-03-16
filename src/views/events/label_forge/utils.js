// Helper utilities for Label Forge

import { MOCK_DATA } from './constants';

/**
 * Load saved state from localStorage
 */
export const loadSavedState = () => {
    try {
        const saved = localStorage.getItem('LABEL_FORGE_STATE_V1');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load saved state:", e);
    }
    return null;
};

/**
 * Save state to localStorage
 */
export const saveState = (state) => {
    try {
        localStorage.setItem('LABEL_FORGE_STATE_V1', JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save state:", e);
    }
};

/**
 * Replace variables in text with their values
 */
export const resolveVariable = (text, variableMap) => {
    if (!text) return '';
    let result = text;
    const map = variableMap || MOCK_DATA;
    Object.keys(map).forEach(key => {
        result = result.replaceAll(key, map[key]);
    });
    return result;
};

/**
 * Convert number to hex string with padding
 */
export const toHex = (num, padding = 2) => num.toString(16).padStart(padding, '0').toUpperCase();

/**
 * Convert string to hex representation
 */
export const strToHex = (str) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += toHex(str.charCodeAt(i)) + ' ';
    }
    return hex.trim();
};

/**
 * Convert integer to low-high hex bytes
 */
export const intToLowHighHex = (num) => {
    const low = num & 0xFF;
    const high = (num >> 8) & 0xFF;
    return `${toHex(low)} ${toHex(high)}`;
};

/**
 * Estimate QR code modules based on content length
 */
export const estimateQRModules = (content) => {
    const len = content ? content.length : 0;
    let version = 1;
    if (len <= 25) version = 1;
    else if (len <= 47) version = 2;
    else if (len <= 77) version = 3;
    else if (len <= 114) version = 4;
    else if (len <= 154) version = 5;
    else if (len <= 195) version = 6;
    else if (len <= 224) version = 7;
    else if (len <= 279) version = 8;
    else if (len <= 335) version = 9;
    else version = 10;

    // Modules = 21 + (V-1)*4
    return 21 + (version - 1) * 4;
};

/**
 * Generate a unique ID
 */
export const generateId = () => {
    return Date.now().toString() + Math.random().toString().slice(2, 5);
};

/**
 * Snap value to grid
 */
export const snapToGrid = (value, gridSize) => {
    return Math.round(value / gridSize) * gridSize;
};

/**
 * Download blob as file
 */
export const downloadFile = (content, filename, type = 'application/json') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

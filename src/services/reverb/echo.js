// ============================================
// FILE: src/services/reverb/echo.js
// Reusable Laravel Echo (Reverb) Configuration
// Uses environment variables from .env file
// ============================================

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally
window.Pusher = Pusher;

// Get configuration from environment variables
const reverbConfig = {
    broadcaster: 'reverb',
    key: process.env.REACT_APP_REVERB_APP_KEY || '',
    wsHost: process.env.REACT_APP_REVERB_HOST || 'localhost',
    wsPort: parseInt(process.env.REACT_APP_REVERB_PORT || '8080', 10),
    wssPort: parseInt(process.env.REACT_APP_REVERB_WSS_PORT || process.env.REACT_APP_REVERB_PORT || '8080', 10),
    forceTLS: process.env.REACT_APP_REVERB_FORCE_TLS === 'true',
    enabledTransports: (process.env.REACT_APP_REVERB_TRANSPORTS || 'ws,wss').split(','),
    disableStats: process.env.REACT_APP_REVERB_DISABLE_STATS !== 'false',
};

// Initialize Laravel Echo with Reverb
const echo = new Echo(reverbConfig);

// Log connection status
echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Reverb WebSocket Connected');
});

echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('❌ Reverb WebSocket Disconnected');
});

echo.connector.pusher.connection.bind('error', (error) => {
    console.error('❌ Reverb Connection Error:', error);
});

export default echo;

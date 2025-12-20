// // src/echo.js
// import Echo from 'laravel-echo';
// import Pusher from 'pusher-js';

// window.Pusher = Pusher;

// const echo = new Echo({
//   broadcaster: 'reverb',
//   key: process.env.REACT_APP_REVERB_APP_KEY,

//   wsHost: process.env.REACT_APP_REVERB_HOST,
//   wsPort: process.env.REACT_APP_REVERB_PORT,
//   wssPort: process.env.REACT_APP_REVERB_PORT,

//   forceTLS: false,
//   enabledTransports: ['ws'],
// });

// export default echo;

// ============================================
// FILE: src/services/echo.js
// Copy this entire file to your React app
// ============================================
 
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
 
// Make Pusher available globally
window.Pusher = Pusher;
 
// Initialize Laravel Echo with Reverb
const echo = new Echo({
    broadcaster: 'reverb',
    key: 'reverb-key',                    // Must match REVERB_APP_KEY in Laravel
    wsHost: '192.168.0.147',              // Your Laravel server IP
    wsPort: 8080,                         // Reverb WebSocket port
    wssPort: 8080,
    forceTLS: false,                      // Set to true for production with HTTPS
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
});
 
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
 
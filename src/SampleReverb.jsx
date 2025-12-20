// ============================================
// SIMPLE EXAMPLE - Minimal React Integration
// Copy this into any React component
// ============================================
 
import React, { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
 
function SimpleReverbExample() {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
 
    useEffect(() => {
        // Setup Pusher
        window.Pusher = Pusher;
 
        // Initialize Echo
        const echo = new Echo({
            broadcaster: 'reverb',
            key: 'avc2m9ivvladmbnnlxgq',
            wsHost: '192.168.0.147',
            wsPort: 8080,
            wssPort: 8080,
            forceTLS: false,
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
        });
 
        console.log('echo', echo);
        // Connection status
        echo.connector.pusher.connection.bind('connected', () => {
            console.log('✅ Connected!');
            setIsConnected(true);
        });
 
        echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('❌ Disconnected!');
            setIsConnected(false);
        });
 
        // Listen to broadcasts
        echo.channel('content-master')
            .listen('.content.updated', (event) => {
                console.log('📡 Received:', event);
                setMessages(prev => [...prev, event]);

                // Handle different actions
                if (event.action === 'created') {
                    // add item to list
                }

                if (event.action === 'updated') {
                    // update item
                }

                if (event.action === 'deleted') {
                    // remove item
                }
            });

        // Cleanup
        return () => {
            echo.leaveChannel('content-master');
        };
    }, []);
 
    return (
        null
    );
}
 
export default SimpleReverbExample;
 
/*
* USAGE:
*
* 1. Install dependencies:
*    npm install laravel-echo pusher-js
*
* 2. Import and use:
*    import SimpleReverbExample from './SimpleReverbExample';
*    <SimpleReverbExample />
*
* 3. Make sure Laravel Reverb server is running:
*    php artisan reverb:start
*
* 4. Test by creating content from Laravel test page:
*    http://192.168.0.147:8000/reverb-test
*/
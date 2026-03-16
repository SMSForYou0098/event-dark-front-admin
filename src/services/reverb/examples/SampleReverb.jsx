// ============================================
// SIMPLE EXAMPLE - Minimal React Integration
// Uses reusable Echo instance from src/services/reverb/echo.js
// Configuration is loaded from .env file
// ============================================
 
import { useEffect, useState } from 'react';
import echo from '../echo';
 
function SampleReverbExample({ eventId=1 }) {
    // eslint-disable-next-line no-unused-vars
    const [messages, setMessages] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [isConnected, setIsConnected] = useState(false);
 
    useEffect(() => {
        // Connection status listeners
        const handleConnected = () => {
            console.log('✅ Connected!');
            setIsConnected(true);
        };
 
        const handleDisconnected = () => {
            console.log('❌ Disconnected!');
            setIsConnected(false);
        };
 
        // Bind connection status
        echo.connector.pusher.connection.bind('connected', handleConnected);
        echo.connector.pusher.connection.bind('disconnected', handleDisconnected);

        const channelName = `event-seats.${eventId}`;
        const channel = echo.channel(channelName);
     
        channel.listen(".seat.status.updated", (data) => {
            console.log("Seat update received:", data);

            /**
             * data = {
             *   eventId: 12,
             *   seatIds: [101, 102],
             *   status: "booked"
             * }
             */

            // onSeatUpdate(data);
        });
     
        return () => {
            channel.stopListening(".seat.status.updated");
            echo.leaveChannel(channelName);
            echo.connector.pusher.connection.unbind('connected', handleConnected);
            echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
        };
    }, [eventId]);
 
    // Example: You can use messages and isConnected in your UI
    // return (
    //     <div>
    //         <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    //         <p>Messages received: {messages.length}</p>
    //     </div>
    // );

    return null;
}
 
export default SampleReverbExample;
 
/*
* USAGE:
*
* 1. Install dependencies:
*    npm install laravel-echo pusher-js
*
* 2. Configure environment variables in .env file:
*    Copy .env.example to .env and update the values
*
* 3. Import and use:
*    import { SampleReverbExample } from 'services/reverb';
*    
*    // Without event ID (only listens to content-master channel)
*    <SampleReverbExample />
*    
*    // With event ID (listens to both content-master and event-seats.{eventId} channels)
*    <SampleReverbExample eventId={123} />
*
* 4. Event Seats Channel:
*    - Channel name: `event-seats.{eventId}` (e.g., `event-seats.123`)
*    - Events listened:
*      - `.seat.updated` - When a seat is updated
*      - `.seat.locked` - When a seat is locked
*      - `.seat.unlocked` - When a seat is unlocked
*      - `.seat.booked` - When a seat is booked
*
* 5. Make sure Laravel Reverb server is running:
*    php artisan reverb:start
*
* 6. Test by creating content from Laravel test page:
*    http://YOUR_SERVER_IP:8000/reverb-test
*
* NOTE: The Echo instance is shared across the app via src/services/reverb/echo.js
*       All configuration is loaded from .env file
*       You can also use the hooks: useReverb, useMultipleChannels from 'services/reverb'
*/

// ============================================
// FILE: src/services/reverb/useReverb.js
// Custom React Hook for Reverb
// Uses the shared Echo instance from src/services/reverb/echo.js
// ============================================
 
import echo from './echo';
import { useEffect, useState } from 'react';
 
/**
 * Custom hook to listen to Laravel Reverb broadcasts
 *
 * @param {string} channelName - The channel to listen to (e.g., 'content-master')
 * @param {string} eventName - The event name with leading dot (e.g., '.content.updated')
 * @param {function} callback - Function to call when event is received
 * @returns {object} - { isConnected, error }
 */
export const useReverb = (channelName, eventName, callback) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
 
    useEffect(() => {
        // Connection status listeners
        const handleConnected = () => {
            console.log(`✅ Connected to Reverb`);
            setIsConnected(true);
            setError(null);
        };
 
        const handleDisconnected = () => {
            console.log(`❌ Disconnected from Reverb`);
            setIsConnected(false);
        };
 
        const handleError = (err) => {
            console.error(`❌ Reverb Error:`, err);
            setError(err);
        };
 
        echo.connector.pusher.connection.bind('connected', handleConnected);
        echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
        echo.connector.pusher.connection.bind('error', handleError);
 
        // Listen to the channel and event
        console.log(`📡 Listening to channel: ${channelName}, event: ${eventName}`);
        const channel = echo.channel(channelName);
        channel.listen(eventName, (event) => {
            console.log(`📨 Received event on ${channelName}:`, event);
            callback(event);
        });
 
        // Cleanup on unmount
        return () => {
            console.log(`🔌 Leaving channel: ${channelName}`);
            channel.stopListening(eventName);
            echo.leaveChannel(channelName);
            echo.connector.pusher.connection.unbind('connected', handleConnected);
            echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            echo.connector.pusher.connection.unbind('error', handleError);
        };
    }, [channelName, eventName, callback]);
 
    return { isConnected, error };
};
 
/**
 * Hook to listen to multiple channels
 *
 * @param {Array} channels - Array of { channelName, eventName, callback }
 * @returns {object} - { isConnected, error }
 */
export const useMultipleChannels = (channels) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
 
    useEffect(() => {
        const handleConnected = () => {
            setIsConnected(true);
            setError(null);
        };
 
        const handleDisconnected = () => {
            setIsConnected(false);
        };
 
        const handleError = (err) => {
            setError(err);
        };
 
        echo.connector.pusher.connection.bind('connected', handleConnected);
        echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
        echo.connector.pusher.connection.bind('error', handleError);
 
        // Subscribe to all channels
        const subscriptions = channels.map(({ channelName, eventName, callback }) => {
            const channel = echo.channel(channelName);
            channel.listen(eventName, callback);
            return { channel, channelName, eventName };
        });
 
        // Cleanup
        return () => {
            subscriptions.forEach(({ channel, channelName, eventName }) => {
                channel.stopListening(eventName);
                echo.leaveChannel(channelName);
            });
            echo.connector.pusher.connection.unbind('connected', handleConnected);
            echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            echo.connector.pusher.connection.unbind('error', handleError);
        };
    }, [channels]);

    return { isConnected, error };
};

/**
 * Hook specifically for listening to event-seats channel
 * 
 * @param {number|string} eventId - The event ID to listen to
 * @param {object} callbacks - Object with callback functions for different seat events
 * @param {function} callbacks.onSeatUpdated - Callback for '.seat.updated' event
 * @param {function} callbacks.onSeatLocked - Callback for '.seat.locked' event
 * @param {function} callbacks.onSeatUnlocked - Callback for '.seat.unlocked' event
 * @param {function} callbacks.onSeatBooked - Callback for '.seat.booked' event
 * @returns {object} - { isConnected, error, channelName }
 */
export const useEventSeats = (eventId, callbacks = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!eventId) {
            return;
        }

        const channelName = `event-seats.${eventId}`;

        const handleConnected = () => {
            console.log(`✅ Connected to Reverb - Event Seats: ${channelName}`);
            setIsConnected(true);
            setError(null);
        };

        const handleDisconnected = () => {
            console.log(`❌ Disconnected from Reverb - Event Seats: ${channelName}`);
            setIsConnected(false);
        };

        const handleError = (err) => {
            console.error(`❌ Reverb Error - Event Seats: ${channelName}`, err);
            setError(err);
        };

        echo.connector.pusher.connection.bind('connected', handleConnected);
        echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
        echo.connector.pusher.connection.bind('error', handleError);

        // Subscribe to event-seats channel
        const channel = echo.channel(channelName);

        // Listen to seat.updated event
        if (callbacks.onSeatUpdated) {
            channel.listen('.seat.updated', (event) => {
                console.log(`🎫 Seat updated for event ${eventId}:`, event);
                callbacks.onSeatUpdated(event);
            });
        }

        // Listen to seat.locked event
        if (callbacks.onSeatLocked) {
            channel.listen('.seat.locked', (event) => {
                console.log(`🔒 Seat locked for event ${eventId}:`, event);
                callbacks.onSeatLocked(event);
            });
        }

        // Listen to seat.unlocked event
        if (callbacks.onSeatUnlocked) {
            channel.listen('.seat.unlocked', (event) => {
                console.log(`🔓 Seat unlocked for event ${eventId}:`, event);
                callbacks.onSeatUnlocked(event);
            });
        }

        // Listen to seat.booked event
        if (callbacks.onSeatBooked) {
            channel.listen('.seat.booked', (event) => {
                console.log(`✅ Seat booked for event ${eventId}:`, event);
                callbacks.onSeatBooked(event);
            });
        }

        // Cleanup
        return () => {
            if (callbacks.onSeatUpdated) {
                channel.stopListening('.seat.updated');
            }
            if (callbacks.onSeatLocked) {
                channel.stopListening('.seat.locked');
            }
            if (callbacks.onSeatUnlocked) {
                channel.stopListening('.seat.unlocked');
            }
            if (callbacks.onSeatBooked) {
                channel.stopListening('.seat.booked');
            }
            echo.leaveChannel(channelName);
            echo.connector.pusher.connection.unbind('connected', handleConnected);
            echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            echo.connector.pusher.connection.unbind('error', handleError);
        };
    }, [eventId, callbacks.onSeatUpdated, callbacks.onSeatLocked, callbacks.onSeatUnlocked, callbacks.onSeatBooked]);

    return { 
        isConnected, 
        error, 
        channelName: eventId ? `event-seats.${eventId}` : null 
    };
};

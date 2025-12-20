// ============================================
// FILE: src/hooks/useReverb.js
// Custom React Hook for Reverb
// ============================================
 
import echo from 'echo';
import { useEffect, useState, useCallback } from 'react';
 
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
 
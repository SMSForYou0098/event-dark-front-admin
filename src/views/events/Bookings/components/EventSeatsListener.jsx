// ============================================
// EventSeatsListener Component
// Listens to event-seats WebSocket channel and updates seat status in real-time
// ============================================

import { useEffect, useRef } from 'react';
import echo from 'services/reverb';

/**
 * Component that listens to event-seats channel and updates seat status in UI
 * 
 * @param {object} props
 * @param {number|string} props.eventId - The event ID to listen to
 * @param {object} props.bookingLayoutRef - Ref to BookingLayout component
 * @param {boolean} props.enabled - Whether to enable the listener (default: true)
 */
const EventSeatsListener = ({ eventId, bookingLayoutRef, enabled = true, id }) => {
    const channelRef = useRef(null);

    useEffect(() => {
        // Don't listen if disabled or no eventId
        if (!enabled || !eventId || !bookingLayoutRef?.current) {
            return;
        }

        const channelName = `event-seats.${eventId}`;
        console.log(`🎫 Listening to event-seats channel: ${channelName}`);

        // Get the channel
        const channel = echo.channel(channelName);

        // Listen to seat status updates
        channel.listen('.seat.status.updated', (data) => {
            // console.log('📡 Seat update received:', data);
            // console.log('🔍 Triggering user ID:', data.triggeringUserId, 'My ID:', id);
            if (Number(data.triggeringUserId )=== Number(id)) {
                // console.log("Ignoring update triggered by me");
                return false; 
            }
            /**
             * Expected data format:
             * {
             *   eventId: 1,
             *   seatIds: ["seat_1495", "seat_1473"],
             *   status: "booked" | "locked" | "unlocked" | "available"
             * }
             */

            if (!data || !data.seatIds || !Array.isArray(data.seatIds) || !data.status) {
                // console.warn('Invalid seat update data:', data);
                return;
            }

            // Use seat IDs as-is from socket (format: "seat_1494")
            const seatIds = data.seatIds.map(seatId => String(seatId).trim());

            // console.log('🔍 Seat IDs from socket:', seatIds, 'Status:', data.status);

            // Simple approach: Just call markSeatIdsAsBooked for booked seats (like before)
            // For other statuses, use updateSeatStatus
            // Backend filters: only sends to other users, not the current user booking
            if (bookingLayoutRef.current) {
                if (data.status === 'booked' || data.status === 'reserved') {
                    // Simple: Just mark as booked (same as before without socket)
                    bookingLayoutRef.current.markSeatIdsAsBooked(seatIds);
                } else {
                    // Update status (locked, available, unlocked, etc.)
                    bookingLayoutRef.current.updateSeatStatus(seatIds, data.status === 'locked' ? 'locked' : 'available');
                }
                // console.log(`✅ Updated ${seatIds.length} seat(s) to status: ${data.status}`);
            } else {
                console.warn('bookingLayoutRef not available');
            }
        });

        channelRef.current = channel;

        // Cleanup
        return () => {
            if (channelRef.current) {
                console.log(`🔌 Leaving event-seats channel: ${channelName}`);
                channelRef.current.stopListening('.seat.status.updated');
                echo.leaveChannel(channelName);
                channelRef.current = null;
            }
        };
    }, [eventId, enabled, bookingLayoutRef]);

    // This component doesn't render anything
    return null;
};

export default EventSeatsListener;


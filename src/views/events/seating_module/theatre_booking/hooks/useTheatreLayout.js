import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { message } from 'antd';

/**
 * Custom hook to fetch theatre layout data with seat and ticket information
 * @param {string} layoutId - The layout ID
 * @param {string} eventId - The event ID
 * @param {object} options - Additional query options
 * @returns {object} Query result with processed layout data
 */
export const useTheatreLayout = (layoutId, eventId, options = {}) => {
    return useQuery({
        queryKey: ['theatre-layout', layoutId, eventId],
        queryFn: async () => {

            if (!layoutId) throw new Error('Layout ID is required');

            const response = await api.get(`layout/theatre/${layoutId}?eventId=${eventId}`);
            const data = response?.data || response;

            // Process stage data
            const stage = data.stage ? {
                ...data.stage,
                x: parseFloat(data.stage.x) || 0,
                y: parseFloat(data.stage.y) || 0,
                width: parseFloat(data.stage.width) || 800,
                height: parseFloat(data.stage.height) || 50
            } : null;

            // Process sections and seats with ticket information
            const sections = data.sections && Array.isArray(data.sections)
                ? data.sections.map(section => ({
                    ...section,
                    x: parseFloat(section.x) || 0,
                    y: parseFloat(section.y) || 0,
                    width: parseFloat(section.width) || 600,
                    height: parseFloat(section.height) || 250,
                    rows: section.rows?.map(row => ({
                        ...row,
                        numberOfSeats: parseInt(row.numberOfSeats) || 0,
                        curve: parseFloat(row.curve) || 0,
                        spacing: parseFloat(row.spacing) || 40,
                        seats: row.seats?.map(seat => ({
                            ...seat,
                            number: parseInt(seat.number) || 0,
                            x: parseFloat(seat.x) || 0,
                            y: parseFloat(seat.y) || 0,
                            radius: parseFloat(seat.radius) || 12,
                            // Seat status can be: 'available', 'selected', 'booked', 'disabled'
                            status: seat.status || 'available',
                            // Ticket information from relation
                            ticket: seat.ticket || null
                        })) || []
                    })) || []
                }))
                : [];

            // Calculate default zoom based on number of sections
            const sectionCount = sections.length;
            let initialZoom = 1;

            if (sectionCount === 0 || sectionCount === 1) {
                initialZoom = 1; // Full zoom for 0 or 1 section
            } else if (sectionCount === 2) {
                initialZoom = 0.9; // Slight zoom out for 2 sections
            } else if (sectionCount <= 4) {
                initialZoom = 0.75; // More zoom out for 3-4 sections
            } else if (sectionCount <= 6) {
                initialZoom = 0.6; // Further zoom out for 5-6 sections
            } else {
                initialZoom = 0.5; // Maximum zoom out for 7+ sections
            }

            return {
                layoutData: data,
                stage,
                sections,
                initialZoom
            };
        },
        enabled: !!layoutId,
        staleTime: 30 * 1000, // Cache for 30 seconds (reduced from 5 minutes for fresher seat data)
        refetchOnMount: true, // Always refetch on mount to get latest seat status
        retry: (count, err) => {
            const status = err?.response?.status;
            return status >= 500 && count < 2;
        },
        onSuccess: () => {
            // message.success('Layout loaded successfully');
        },
        onError: (error) => {
            console.error('Error fetching layout:', error);
            message.error('Failed to load seating layout');
        },
        ...options,
    });
};

export default useTheatreLayout;

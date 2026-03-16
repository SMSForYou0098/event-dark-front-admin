import React, { useEffect, useRef, useCallback } from 'react';

/**
 * FallbackTicketBackground Component
 * Generates a stylish ticket background canvas when no event image is provided
 * 
 * @param {Object} props
 * @param {string} props.eventName - Name of the event
 * @param {string} props.ticketName - Name/type of the ticket
 * @param {string} props.date - Event date
 * @param {string} props.address - Event venue address
 * @param {number} props.width - Canvas width (default: 300)
 * @param {number} props.height - Canvas height (default: 400)
 * @param {function} props.onGenerated - Callback with the generated canvas data URL
 */
const FallbackTicketBackground = ({
    eventName = "Event Name",
    ticketName = "General Admission",
    date = "December 24, 2025",
    address = "123 Event Street, City, State 12345",
    width = 300,
    height = 600,
    onGenerated,
}) => {
    const canvasRef = useRef(null);

    const drawBackground = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = width;
        const h = height;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // White fallback background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // NOTE: We don't draw a QR code background here
        // Fabric.js in Ticket_canvas.js adds the white background with proper 1px padding
        // This fallback only provides the background image

        // Draw ticket name (above QR area) - matches Ticket_canvas.js centerText at top=50
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ticketName, w / 2, 50);

        // Draw event details section
        const detailsStartY = 210;
        const lineHeight = 28;
        const padding = 20;

        // Event Name
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';

        // Word wrap for long event names
        const maxWidth = w - padding * 2;
        const words = eventName.split(' ');
        let line = '';
        let y = detailsStartY;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line.trim(), w / 2, y);
                line = words[n] + ' ';
                y += 24;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), w / 2, y);

        // Date label and value
        y += lineHeight + 10;
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('DATE', w / 2, y);

        y += 18;
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(date, w / 2, y);

        // Address label and value
        y += lineHeight;
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('VENUE', w / 2, y);

        y += 18;
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial, sans-serif';

        // Word wrap for address
        const addressWords = address.split(' ');
        line = '';

        for (let n = 0; n < addressWords.length; n++) {
            const testLine = line + addressWords[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth - 20 && n > 0) {
                ctx.fillText(line.trim(), w / 2, y);
                line = addressWords[n] + ' ';
                y += 18;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), w / 2, y);

        // Call onGenerated callback with the canvas data URL
        if (onGenerated) {
            const dataUrl = canvas.toDataURL('image/png');
            onGenerated(dataUrl);
        }
    }, [eventName, ticketName, date, address, width, height, onGenerated]);

    useEffect(() => {
        drawBackground();
    }, [drawBackground]);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <canvas ref={canvasRef} width={width} height={height} />
        </div>
    );
};

export default FallbackTicketBackground;

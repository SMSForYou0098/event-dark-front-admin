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
    const logoRef = useRef(null);

    const drawBackground = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = width;
        const h = height;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Add decorative pattern (subtle dots)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < w; i += 20) {
            for (let j = 0; j < h; j += 20) {
                ctx.beginPath();
                ctx.arc(i, j, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Add top accent bar
        const accentGradient = ctx.createLinearGradient(0, 0, w, 0);
        accentGradient.addColorStop(0, '#e94560');
        accentGradient.addColorStop(1, '#ff6b6b');
        ctx.fillStyle = accentGradient;
        ctx.fillRect(0, 0, w, 8);

        // Add bottom accent bar
        ctx.fillStyle = accentGradient;
        ctx.fillRect(0, h - 8, w, 8);

        // NOTE: We don't draw a white QR code background here
        // Fabric.js in Ticket_canvas.js adds the white background with proper 1px padding
        // This fallback only provides the background image

        // Draw ticket name (above QR area) - matches Ticket_canvas.js centerText at top=50
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ticketName, w / 2, 50);

        // Draw event details section
        const detailsStartY = 210;
        const lineHeight = 28;
        const padding = 20;

        // Event Name
        ctx.fillStyle = '#e94560';
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('DATE', w / 2, y);

        y += 18;
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(date, w / 2, y);

        // Address label and value
        y += lineHeight;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('VENUE', w / 2, y);

        y += 18;
        ctx.fillStyle = '#ffffff';
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

        // Draw logo at bottom center
        const logo = logoRef.current;
        if (logo && logo.complete && logo.naturalWidth > 0) {
            const logoMaxWidth = 80;
            const logoMaxHeight = 40;
            const logoAspect = logo.naturalWidth / logo.naturalHeight;

            let logoWidth = logoMaxWidth;
            let logoHeight = logoWidth / logoAspect;

            if (logoHeight > logoMaxHeight) {
                logoHeight = logoMaxHeight;
                logoWidth = logoHeight * logoAspect;
            }

            const logoX = (w - logoWidth) / 2;
            const logoY = h - logoHeight - 25;

            // Add slight white glow behind logo
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            ctx.shadowBlur = 10;
            ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        // Call onGenerated callback with the canvas data URL
        if (onGenerated) {
            const dataUrl = canvas.toDataURL('image/png');
            onGenerated(dataUrl);
        }
    }, [eventName, ticketName, date, address, width, height, onGenerated]);

    useEffect(() => {
        const logo = logoRef.current;

        if (logo) {
            if (logo.complete && logo.naturalWidth > 0) {
                drawBackground();
            } else {
                logo.onload = () => {
                    drawBackground();
                };
                logo.onerror = () => {
                    // Draw without logo if it fails to load
                    drawBackground();
                };
            }
        } else {
            drawBackground();
        }
    }, [drawBackground]);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <canvas ref={canvasRef} width={width} height={height} />
            <img
                ref={logoRef}
                src="/img/logo.webp"
                alt="Logo"
                crossOrigin="anonymous"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default FallbackTicketBackground;

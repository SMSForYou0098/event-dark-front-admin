import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric-pure-browser';
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';

/**
 * TicketCanvasView - A reusable canvas component for rendering tickets
 *
 * Canvas size: 300px width × 600px height
 *
 * Props:
 *  showDetails       - boolean: whether to render ticket detail text
 *  ticketNumber      - number: ticket index (1-based)
 *  ticketLabel       - string: label shown on canvas, e.g. "(I)" or "(G)"
 *  ticketData        - object: booking / order data
 *  preloadedImage    - string | null: pre-fetched blob URL for the background
 *  onReady           - () => void: called when canvas is fully rendered
 *  onError           - (msg) => void: called when rendering fails
 *
 * Imperative handle (via ref):
 *  download()        - triggers JPEG download
 *  print()           - opens print window
 *  isReady()         - returns current canvas-ready state
 *  getDataURL(opts)  - returns dataURL from canvas
 */
const TicketCanvasView = forwardRef((props, ref) => {
  const {
    showDetails: showDetailsProp,
    ticketNumber,
    ticketLabel,
    preloadedImage,
    onReady,
    onError,
    ticketData,
  } = props;

  // Default to true so event name, date, time, venue etc. render when not explicitly disabled
  const showDetails = showDetailsProp !== false;

  const { convertTo12HourFormat, formatDateRange, api } = useMyContext();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // ─── Data extraction ──────────────────────────────────────────────────────
  const ticket = ticketData?.ticket || ticketData?.bookings?.[0]?.ticket || {};
  const event =
    ticketData?.event ||
    ticketData?.bookings?.[0]?.event ||
    ticketData?.ticket?.event ||
    ticketData?.bookings?.[0]?.ticket?.event ||
    {};
  const venue = event?.venue || {};

  const userObj =
    ticketData?.user ||
    ticketData?.attendee ||
    ticketData?.bookings?.[0]?.user ||
    ticketData?.bookings?.[0]?.attendee;
  const firstBooking = ticketData?.bookings?.[0] || {};

  const user = userObj
    ? userObj
    : {
        name: firstBooking?.name || ticketData?.name,
        number: firstBooking?.number || ticketData?.number,
        email: firstBooking?.email || ticketData?.email,
      };

  const ticketName = ticket?.name || 'Ticket Name';
  const userName = user?.name || user?.Name || 'User Name';

  const seatNames =
    ticketData?.bookings?.length > 1
      ? ticketData.bookings
          .map((b) => b.seat_name || b.event_seat_status?.seat_name)
          .filter(Boolean)
          .join(', ')
      : null;
  const number =
    seatNames ||
    ticketData?.seat_name ||
    ticketData?.event_seat_status?.seat_name ||
    'N/A';

  const address = venue?.address || event?.address || 'Address Not Specified';
  const ticketBG = ticket?.background_image || '';
  // Format date range: comma-separated "2026-02-03,2026-02-05" → "3 Feb 2026 to 5 Feb 2026"
  const dateRangeSource = ticketData?.booking_date || event?.date_range;
  const date = (() => {
    if (!dateRangeSource) return 'Date Not Available';
    const parts = String(dateRangeSource).split(',').map((s) => s.trim()).filter(Boolean);
    const formatOne = (isoStr) => {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return isoStr;
      const day = d.getDate();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };
    if (parts.length === 0) return formatDateRange?.(dateRangeSource) || 'Date Not Available';
    if (parts.length === 1) return formatOne(parts[0]) || formatDateRange?.(dateRangeSource) || 'Date Not Available';
    return `${formatOne(parts[0])} to ${formatOne(parts[1])}`;
  })();
  const time =
    convertTo12HourFormat?.(event?.start_time) || 'Time Not Set';
  const OrderId = ticketData?.order_id || ticketData?.token || 'N/A';
  const title = event?.name || 'Event Name';
  const eventType = event?.event_type || '';
  const bookingType =
    ticketData?.booking_type || firstBooking?.booking_type || 'Online';

  // ─── State ────────────────────────────────────────────────────────────────
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const textColor = '#000';
  const CANVAS_WIDTH = 300;
  const CANVAS_HEIGHT = 600;

  // ─── Imperative handle ────────────────────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      download: () => downloadCanvas(),
      print: () => printCanvas(),
      isReady: () => isCanvasReady,
      getDataURL: (options = {}) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL({
          format: 'jpeg',
          quality: 0.9,
          multiplier: 2,
          ...options,
        });
      },
    }),
    [isCanvasReady] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── TanStack Query: fetch background image ───────────────────────────────
  const hasPreloadedImage = !!preloadedImage;

  const { data: fetchedImageUrl, isError: isImageError } = useQuery({
    queryKey: ['ticket-bg-image', ticketBG, api],
    queryFn: () =>
      axios
        .post(`${api}get-image/retrive`, { path: ticketBG }, { responseType: 'blob' })
        .then((r) => URL.createObjectURL(r.data)),
    enabled: !!ticketBG && !hasPreloadedImage,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const imageUrl = hasPreloadedImage ? preloadedImage : fetchedImageUrl;

  useEffect(() => {
    if (isImageError) {
      onError?.('Failed to load ticket background');
    }
  }, [isImageError, onError]);

  // ─── Generate QR code ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!OrderId) return;
    QRCode.toDataURL(OrderId, { width: 150, margin: 1, errorCorrectionLevel: 'H' })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error('QR Generation Error', err);
        onError?.('Failed to generate QR code');
      });
  }, [OrderId, onError]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const loadFabricImage = useCallback(
    (url, options = {}) =>
      new Promise((resolve, reject) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            if (img && img.getElement()) {
              resolve(img);
            } else {
              reject(new Error('Failed to load image'));
            }
          },
          { crossOrigin: 'anonymous', ...options }
        );
      }),
    []
  );

  const centerText = useCallback(
    (text, fontSize, fontFamily, canvas, top, options = {}) => {
      const textObj = new fabric.Text(text || '', {
        fontSize,
        fontFamily,
        top,
        fill: textColor,
        selectable: false,
        evented: false,
        originX: 'center',
        left: canvas.width / 2,
        ...options,
      });
      canvas.add(textObj);
      return textObj;
    },
    [textColor]
  );

  // ─── Draw canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !qrDataUrl) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const canvas = new fabric.StaticCanvas(canvasRef.current, {
      enableRetinaScaling: true,
    });
    fabricCanvasRef.current = canvas;

    const draw = async () => {
      try {
        canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

        if (imageUrl) {
          const img = await loadFabricImage(imageUrl);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: CANVAS_WIDTH / img.width,
            scaleY: CANVAS_HEIGHT / img.height,
          });
        } else {
          canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        }

        if (showDetails) {
          centerText(title, 16, 'Arial', canvas, 50, { fontWeight: 'bold' });
          if (eventType) {
            centerText(
              eventType.charAt(0).toUpperCase() + eventType.slice(1),
              11,
              'Arial',
              canvas,
              70,
              { fill: '#666' }
            );
          }
          centerText(ticketName, 18, 'Arial', canvas, 185, { fontWeight: 'bold' });
        }

        // QR code
        const qrImg = await loadFabricImage(qrDataUrl);
        const qrCodeSize = 85;
        const padding = 4;
        const qrPositionX = CANVAS_WIDTH / 2 - qrCodeSize / 2;
        const qrPositionY = 220;

        const qrBackground = new fabric.Rect({
          left: qrPositionX - padding,
          top: qrPositionY - padding,
          width: qrCodeSize + padding * 2,
          height: qrCodeSize + padding * 2,
          fill: 'white',
          selectable: false,
          evented: false,
          rx: 4,
          ry: 4,
        });

        qrImg.set({
          left: qrPositionX,
          top: qrPositionY,
          selectable: false,
          evented: false,
          scaleX: qrCodeSize / qrImg.width,
          scaleY: qrCodeSize / qrImg.height,
        });

        canvas.add(qrBackground);
        canvas.add(qrImg);

        if (showDetails) {
          let currentY = 310;

          if (ticketLabel) {
            centerText(
              ticketLabel + (ticketNumber ? ' ' + ticketNumber : ''),
              12,
              'Arial',
              canvas,
              currentY,
              { fontWeight: 'bold', fill: '#666' }
            );
            currentY += 30;
          } else {
            currentY += 10;
          }

          centerText(` ${bookingType}`, 10, 'Arial', canvas, currentY);
          currentY += 30;

          if (number !== 'N/A') {
            centerText(`Seat/Number: ${number}`, 15, 'Arial', canvas, currentY);
            currentY += 30;
          }

          // Time column
          canvas.add(
            new fabric.Text('Time', {
              left: 40,
              top: currentY,
              fontSize: 14,
              fontFamily: 'Arial',
              fill: textColor,
              selectable: false,
              evented: false,
              fontWeight: 'normal',
            })
          );
          const timeValue = new fabric.Text(time, {
            left: 40,
            top: currentY + 20,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: textColor,
            selectable: false,
            evented: false,
            fontWeight: 'bold',
          });
          canvas.add(timeValue);

          // Date column
          const dateStartX = 180;
          canvas.add(
            new fabric.Text('Date', {
              left: dateStartX,
              top: currentY,
              fontSize: 14,
              fontFamily: 'Arial',
              fill: textColor,
              selectable: false,
              evented: false,
              fontWeight: 'normal',
            })
          );
          const dateValue = new fabric.Textbox(date, {
            left: dateStartX,
            top: currentY + 20,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: textColor,
            selectable: false,
            evented: false,
            fontWeight: 'bold',
            width: CANVAS_WIDTH - dateStartX - 15,
            lineHeight: 1.4,
          });
          canvas.add(dateValue);

          const maxHeight =
            Math.max(
              20 + (timeValue.height || 20),
              20 + (dateValue.height || 20)
            );
          currentY += maxHeight + 10;

          // Location label
          canvas.add(
            new fabric.Text('Location', {
              left: 15,
              top: currentY,
              fontSize: 18,
              fontFamily: 'Arial',
              fill: textColor,
              fontWeight: 'bold',
              selectable: false,
              evented: false,
            })
          );
          currentY += 30;

          canvas.add(
            new fabric.Textbox(address, {
              left: 15,
              top: currentY,
              fontSize: 14,
              fontFamily: 'Arial',
              fontWeight: 'bold',
              fill: textColor,
              selectable: false,
              evented: false,
              width: CANVAS_WIDTH - 30,
              lineHeight: 1.5,
              textAlign: 'center',
            })
          );
        }

        canvas.renderAll();
        setIsCanvasReady(true);
        onReady?.();
      } catch (error) {
        console.error('Error drawing canvas:', error);
        onError?.('Failed to render ticket');
      }
    };

    draw();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [
    imageUrl,
    qrDataUrl,
    showDetails,
    ticketName,
    userName,
    number,
    address,
    date,
    time,
    title,
    ticketNumber,
    ticketLabel,
    bookingType,
    OrderId,
    centerText,
    loadFabricImage,
    textColor,
    onReady,
    onError,
    eventType,
  ]);

  // ─── Download ─────────────────────────────────────────────────────────────
  const downloadCanvas = () => {
    try {
      const canvas = fabricCanvasRef.current;
      if (!canvas) throw new Error('Canvas not ready');
      const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 2 });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `ticket_${userName}_${ticketName}_${ticketNumber}.jpg`;
      link.click();
      return true;
    } catch (error) {
      console.error('Download error:', error);
      onError?.('Failed to download ticket');
      return false;
    }
  };

  // ─── Print ────────────────────────────────────────────────────────────────
  const printCanvas = () => {
    try {
      const canvas = fabricCanvasRef.current;
      if (!canvas) throw new Error('Canvas not ready');
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1.5 });
      const printWindow = window.open('', '', 'width=800,height=600');
      const printImage = new Image();
      printImage.src = dataURL;
      printImage.onload = () => {
        printWindow.document.write(
          '<html><head><title>Print Ticket</title></head><body style="text-align:center;">'
        );
        printWindow.document.body.appendChild(printImage);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
      return true;
    } catch (error) {
      console.error('Print error:', error);
      onError?.('Failed to print ticket');
      return false;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ticket-canvas-view">
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '300px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

TicketCanvasView.displayName = 'TicketCanvasView';

export default TicketCanvasView;

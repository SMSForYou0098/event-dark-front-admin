import { generateQRCodeImage, imageToRasterBytes } from './qrCodeUtils';

// Try to render the Indian rupee symbol when the printer supports the India code page (ESC t 0x42).
// Some printers map ₹ to 0xA8, others to 0xB9. Defaulting to 0xB9 (common on Epson India code page).
// If you still see a wrong glyph, try changing RUPEE_BYTE to 0xA8. Final fallback: set rupeeSymbolFallback to 'Rs '.
const RUPEE_BYTE = 0xB9; 
const rupeeSymbol = String.fromCharCode(RUPEE_BYTE);
const rupeeSymbolFallback = rupeeSymbol; // set to 'Rs ' if the printer still cannot render ₹
const formatCurrency = (value) => `${rupeeSymbolFallback}${value.toFixed(2)}`;

/**
 * Generate ESC/POS with NATIVE QR Code (GS ( k commands)
 * Works with modern Epson, Star, and compatible printers
 */
export const generateESCPOSNativeQR = async (event, bookingData, totalTax, discount, grandTotal, formatDateTime) => {
    const bytes = [];
    const addString = (str) => {
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
    };
    const addBytes = (...byteValues) => {
        bytes.push(...byteValues);
    };

    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A;
    const RUPEE_CODE_PAGE = 0x42; // Epson India code page – enables ₹ on most thermal printers

    // Initialize printer
    addBytes(ESC, 0x40);
    // Switch code page to one that contains the rupee symbol (kept for safety even though we now render Rs text)
    addBytes(ESC, 0x74, RUPEE_CODE_PAGE);

    // Event Name - Center aligned, bold
    addBytes(ESC, 0x61, 0x01); // Center align
    addBytes(ESC, 0x21, 0x10); // Double height
    addString(event?.name || 'Event Ticket');
    addBytes(LF, LF);
    addBytes(ESC, 0x21, 0x00); // Normal size

    // Native QR Code using GS ( k commands
    const token = bookingData?.[0]?.token;
    if (token) {
        const qrData = token;
        const qrBytes = [];
        for (let i = 0; i < qrData.length; i++) {
            qrBytes.push(qrData.charCodeAt(i));
        }

        // Select QR Code model (Function 165)
        const pL1 = 4;
        const pH1 = 0;
        addBytes(GS, 0x28, 0x6B, pL1, pH1, 0x31, 0x41, 0x32, 0x00); // Model 2

        // Set QR Code module size (Function 167) - size 8
        const pL2 = 3;
        const pH2 = 0;
        addBytes(GS, 0x28, 0x6B, pL2, pH2, 0x31, 0x43, 0x08);

        // Set error correction level (Function 169) - Level M (15%)
        const pL3 = 3;
        const pH3 = 0;
        addBytes(GS, 0x28, 0x6B, pL3, pH3, 0x31, 0x45, 0x31);

        // Store QR Code data (Function 180)
        const dataLength = qrBytes.length + 3;
        const pL4 = dataLength & 0xFF;
        const pH4 = (dataLength >> 8) & 0xFF;
        addBytes(GS, 0x28, 0x6B, pL4, pH4, 0x31, 0x50, 0x30);
        bytes.push(...qrBytes);

        // Print QR Code (Function 181)
        const pL5 = 3;
        const pH5 = 0;
        addBytes(GS, 0x28, 0x6B, pL5, pH5, 0x31, 0x51, 0x30);
        addBytes(LF, LF);
    }

    // Date/Time - Center aligned, bold
    addBytes(ESC, 0x61, 0x01);
    addBytes(ESC, 0x45, 0x01);
    const dateTime = formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at || '';
    addString(dateTime);
    addBytes(LF);
    addBytes(ESC, 0x45, 0x00);
    addBytes(LF);

    // Left align for table
    addBytes(ESC, 0x61, 0x00);

    // Tickets Table
    const separator = '--------------------------------';
    addString(separator);
    addBytes(LF);
    addString('Qty  Ticket Name          Price');
    addBytes(LF);
    addString(separator);
    addBytes(LF);

    bookingData?.forEach((booking) => {
        const qty = String(booking.quantity || 0).padEnd(5);
        const name = (booking?.ticket?.name || 'N/A').substring(0, 16).padEnd(18);
        const amount = Number(booking.amount) || 0;
        const quantity = Number(booking.quantity) || 0;
        const price = formatCurrency(amount * quantity);
        addString(qty + name + price);
        addBytes(LF);
    });

    addString(separator);
    addBytes(LF, LF);

    // Summary Section - Right aligned
    addBytes(ESC, 0x61, 0x02);
    const safeTax = isNaN(parseFloat(totalTax)) ? 0 : parseFloat(totalTax);
    const safeDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
    const safeGrandTotal = isNaN(parseFloat(grandTotal)) ? 0 : parseFloat(grandTotal);

    addString(`TOTAL TAX     ${formatCurrency(safeTax)}`);
addBytes(LF);
addString(`DISCOUNT      ${formatCurrency(safeDiscount)}`);
addBytes(LF);

// TOTAL in normal size
addBytes(ESC, 0x21, 0x00);
addString(`TOTAL  ${formatCurrency(safeGrandTotal)}`);
addBytes(LF);

// Footer - Center aligned
addBytes(ESC, 0x61, 0x01);
addBytes(LF, LF); // EXTRA SPACE
addString('Thank You for Payment');
addBytes(LF, LF); // EXTRA SPACE

// URL big size
addBytes(ESC, 0x21, 0x77); 
addString('www.getyourticket.in');
addBytes(LF);

// Reset back to normal
addBytes(ESC, 0x21, 0x00);

addBytes(LF, LF, LF);
addBytes(GS, 0x56, 0x00); // Cut paper
addBytes(LF, LF); // EXTRA SPACE


    return new Uint8Array(bytes);
};

/**
 * Generate ESC/POS with BITMAP QR Code (for old printers without native QR support)
 */
export const generateESCPOSBitmapQR = async (event, bookingData, totalTax, discount, grandTotal, formatDateTime) => {
    const bytes = [];
    const addString = (str) => {
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
    };
    const addBytes = (...byteValues) => {
        bytes.push(...byteValues);
    };

    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A;
    const RUPEE_CODE_PAGE = 0x42; // Epson India code page – enables ₹ on most thermal printers

    addBytes(ESC, 0x40);
    // Switch code page to one that contains the rupee symbol
    addBytes(ESC, 0x74, RUPEE_CODE_PAGE);

    // Event Name
    addBytes(ESC, 0x61, 0x01);
    addBytes(ESC, 0x21, 0x10);
    addString(event?.name || 'Event Ticket');
    addBytes(LF, LF);
    addBytes(ESC, 0x21, 0x00);

    // QR Code - BITMAP (for old printers)
    const token = bookingData?.[0]?.token;
    if (token) {
        const qrImage = await generateQRCodeImage(token);
        if (qrImage) {
            addBytes(LF);
            const rasterBytes = imageToRasterBytes(qrImage.data, qrImage.width, qrImage.height);
            bytes.push(...rasterBytes);
            addBytes(LF, LF);
        }
    }

    // Date/Time
    addBytes(ESC, 0x61, 0x01);
    addBytes(ESC, 0x45, 0x01);
    const dateTime = formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at || '';
    addString(dateTime);
    addBytes(LF);
    addBytes(ESC, 0x45, 0x00);
    addBytes(LF);

    // Left align for table
    addBytes(ESC, 0x61, 0x00);

    // Tickets Table
    const separator = '--------------------------------';
    addString(separator);
    addBytes(LF);
    addString('Qty  Ticket Name          Price');
    addBytes(LF);
    addString(separator);
    addBytes(LF);

    bookingData?.forEach((booking) => {
        const qty = String(booking.quantity || 0).padEnd(5);
        const name = (booking?.ticket?.name || 'N/A').substring(0, 16).padEnd(18);
        const amount = Number(booking.amount) || 0;
        const quantity = Number(booking.quantity) || 0;
        const price = formatCurrency(amount * quantity);
        addString(qty + name + price);
        addBytes(LF);
    });

    addString(separator);
    addBytes(LF, LF);

    // Summary
    addBytes(ESC, 0x61, 0x02);
    const safeTax = isNaN(parseFloat(totalTax)) ? 0 : parseFloat(totalTax);
    const safeDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
    const safeGrandTotal = isNaN(parseFloat(grandTotal)) ? 0 : parseFloat(grandTotal);

    addString(`TOTAL TAX     ${formatCurrency(safeTax)}`);
addBytes(LF);
    addString(`DISCOUNT      ${formatCurrency(safeDiscount)}`);
addBytes(LF);

// TOTAL in normal size
addBytes(ESC, 0x21, 0x00);
addString(`TOTAL  ${formatCurrency(safeGrandTotal)}`);
addBytes(LF);

// Footer - Center aligned
addBytes(ESC, 0x61, 0x01);
addBytes(LF, LF); // EXTRA SPACE
addString('Thank You for Payment');
addBytes(LF, LF); // EXTRA SPACE

// URL big size
addBytes(ESC, 0x21, 0x77); 
addString('www.getyourticket.in');
addBytes(LF);

// Reset back to normal
addBytes(ESC, 0x21, 0x00);

addBytes(LF, LF, LF);
addBytes(LF, LF); // EXTRA SPACE
addBytes(GS, 0x56, 0x00); // Cut paper
addBytes(LF, LF); // EXTRA SPACE

    return new Uint8Array(bytes);
};

/**
 * Generate TSPL commands for label printers
 */
export const generateTSPL = async (event, bookingData, totalTax, discount, grandTotal, formatDateTime) => {
    const lines = [];
    const token = bookingData?.[0]?.token || '';

    // TSPL requires setting paper size first
    lines.push('SIZE 80 mm, 120 mm');
    lines.push('GAP 3 mm, 0 mm');
    lines.push('DIRECTION 1');
    lines.push('REFERENCE 0, 0');
    lines.push('OFFSET 0 mm');
    lines.push('SET PEEL OFF');
    lines.push('SET CUTTER OFF');
    lines.push('SET PARTIAL_CUTTER OFF');
    lines.push('SET TEAR ON');
    lines.push('CLS');

    // Event Name - centered
    lines.push(`TEXT 200, 50, "3", 0, 1, 1, "${event?.name || 'Event Ticket'}"`);

    // QR Code - TSPL native QR command
    if (token) {
        lines.push(`QRCODE 150, 100, M, 6, A, 0, "${token}"`);
    }

    // Date/Time
    const dateTime = formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at || '';
    lines.push(`TEXT 100, 350, "2", 0, 1, 1, "${dateTime}"`);

    // Ticket details
    let yPos = 420;
    lines.push(`TEXT 20, ${yPos}, "2", 0, 1, 1, "--------------------------------"`);
    yPos += 30;

    bookingData?.forEach((booking) => {
        const qty = booking.quantity || 0;
        const name = booking?.ticket?.name || 'N/A';
        const amount = Number(booking.amount) || 0;
        const quantity = Number(booking.quantity) || 0;
        const price = formatCurrency(amount * quantity);
        
        lines.push(`TEXT 20, ${yPos}, "2", 0, 1, 1, "${qty} x ${name}"`);
        yPos += 30;
        lines.push(`TEXT 400, ${yPos - 30}, "2", 0, 1, 1, "${price}"`);
    });

    lines.push(`TEXT 20, ${yPos}, "2", 0, 1, 1, "--------------------------------"`);
    yPos += 40;

    // Summary
    const safeTax = isNaN(parseFloat(totalTax)) ? 0 : parseFloat(totalTax);
    const safeDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
    const safeGrandTotal = isNaN(parseFloat(grandTotal)) ? 0 : parseFloat(grandTotal);

    lines.push(`TEXT 20, ${yPos}, "2", 0, 1, 1, "TOTAL TAX: ${formatCurrency(safeTax)}"`);
    yPos += 30;
    lines.push(`TEXT 20, ${yPos}, "2", 0, 1, 1, "DISCOUNT: ${formatCurrency(safeDiscount)}"`);
    yPos += 30;
    lines.push(`TEXT 20, ${yPos}, "3", 0, 1, 1, "TOTAL: ${formatCurrency(safeGrandTotal)}"`);
    yPos += 50;

    // Footer
    lines.push(`TEXT 150, ${yPos}, "2", 0, 1, 1, "Thank You for Payment"`);
    yPos += 30;
    lines.push(`TEXT 120, ${yPos}, "2", 0, 1, 1, "www.getyourticket.in"`);

    lines.push('PRINT 1, 1');
    lines.push('');

    const tsplString = lines.join('\r\n');
    return new TextEncoder().encode(tsplString);
};


import { generateQRCodeImage, imageToRasterBytes } from './qrCodeUtils';

// Try to render the Indian rupee symbol when the printer supports the India code page (ESC t 0x42).
// Some printers map ₹ to 0xA8, others to 0xB9. Defaulting to 0xB9 (common on Epson India code page).
// If you still see a wrong glyph, try changing RUPEE_BYTE to 0xA8. Final fallback: set rupeeSymbolFallback to 'Rs '.
const RUPEE_BYTE = 0xB9;
const rupeeSymbol = String.fromCharCode(RUPEE_BYTE);
const rupeeSymbolFallback = 'Rs '; // set to 'Rs ' if the printer still cannot render ₹
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

export const generateTSPLFromExcel = async (
    row,
    selectedFields = [],
    labelSize = "2x2",
    fontSizeMultiplier = 1.0,  // Global font size multiplier
    fieldFontSizes = {},       // Individual font sizes per field
    lineGapMultiplier = 1.0    // Vertical spacing multiplier
) => {
    const lines = [];

    // Label size configurations (in mm)
    const SIZE_CONFIG = {
        "2x2": {
            width: "50.8 mm",
            height: "50.8 mm",
            gap: "2 mm",
            nameFont: "7",      // Larger font for names
            nameScaleX: 2,      // Bold effect (horizontal scale)
            nameScaleY: 2,      // Bold effect (vertical scale)
            otherFont: "3",     // Smaller font for other fields
            otherScaleX: 1,
            otherScaleY: 1,
            lineGap: 50,
            nameExtraGap: 0,    // Extra gap after name line
            startX: 30,
            startY: 40,
        },
        "2x1": {
            width: "50.8 mm",
            height: "25.4 mm",
            gap: "2 mm",
            nameFont: "5",
            nameScaleX: 2,
            nameScaleY: 2,
            otherFont: "2",
            otherScaleX: 1,
            otherScaleY: 1,
            lineGap: 40,
            nameExtraGap: 0,
            startX: 25,
            startY: 30,
        },
        "3x2": {
            width: "76.2 mm",
            height: "50.8 mm",
            gap: "3 mm",
            nameFont: "8",      // Even bigger for 3x2
            nameScaleX: 3,
            nameScaleY: 3,
            otherFont: "4",
            otherScaleX: 1,
            otherScaleY: 1,
            lineGap: 70,        // Slightly more default spacing for 3x2
            // Small extra gap after the big name line so
            // visual white-space between name and phone looks
            // similar to other gaps
            nameExtraGap: 10,
            startX: 40,
            startY: 45,
        },
    };

    const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

    // Apply line gap multiplier for vertical spacing
    const effectiveLineGap = Math.max(10, Math.round(cfg.lineGap * lineGapMultiplier));
    const nameLineGap = Math.max(
        10,
        Math.round(effectiveLineGap + (cfg.nameExtraGap || 0))
    );

    // Apply font size multiplier
    const adjustedNameScaleX = Math.max(1, Math.round(cfg.nameScaleX * fontSizeMultiplier));
    const adjustedNameScaleY = Math.max(1, Math.round(cfg.nameScaleY * fontSizeMultiplier));
    const adjustedOtherScaleX = Math.max(1, Math.round(cfg.otherScaleX * fontSizeMultiplier));
    const adjustedOtherScaleY = Math.max(1, Math.round(cfg.otherScaleY * fontSizeMultiplier));

    // Printer setup
    lines.push(`SIZE ${cfg.width}, ${cfg.height}`);
    lines.push(`GAP ${cfg.gap}, 0 mm`);
    lines.push("DIRECTION 1");
    lines.push("CLS");

    let y = cfg.startY;
    let namesCombined = false;

    // Check if both firstName and surname are selected
    const hasFirstName = selectedFields.includes('firstName');
    const hasSurname = selectedFields.includes('surname');

    selectedFields.forEach((field) => {
        const value = row[field];
        if (!value) return;

        // ❌ Always skip surname (it will be merged with firstName)
        if (field === 'surname') return;

        // ✅ Combine firstName + surname into ONE line
        if (field === 'firstName') {
            const fullName = `${row.firstName || ''} ${row.surname || ''}`.trim();

            lines.push(
                `TEXT ${cfg.startX},${y},"${cfg.nameFont}",0,${adjustedNameScaleX},${adjustedNameScaleY},"${fullName}"`
            );

            // Use a slightly larger gap after the (taller) name line
            y += nameLineGap;
            return;
        }

        // ---- Other fields remain unchanged ----
        const fieldMultiplier = fieldFontSizes[field] || 1.0;
        const combinedMultiplier = fontSizeMultiplier * fieldMultiplier;

        const scaleX = Math.max(1, Math.round(cfg.otherScaleX * combinedMultiplier));
        const scaleY = Math.max(1, Math.round(cfg.otherScaleY * combinedMultiplier));

        lines.push(
            `TEXT ${cfg.startX},${y},"${cfg.otherFont}",0,${scaleX},${scaleY},"${value}"`
        );

        y += effectiveLineGap;
    });

    lines.push("PRINT 1,1");

    return new TextEncoder().encode(lines.join("\r\n"));
};

/**
 * Generate ZPL from Excel data for label printing
 * Works with Zebra label printers (ZD, ZT, ZM series)
 */
export const generateZPLFromExcel = async (
    row,
    selectedFields = [],
    labelSize = "2x2",
    fontSizeMultiplier = 1.0,  // Global font size multiplier
    fieldFontSizes = {},       // Individual font sizes per field
    lineGapMultiplier = 1.0    // Vertical spacing multiplier
) => {
    const lines = [];

    // Label size configurations (in dots, 203 DPI)
    const SIZE_CONFIG = {
        "2x2": {
            width: 406,    // 2 inches = 406 dots
            height: 406,
            nameFontSize: 50,    // Larger for names
            otherFontSize: 25,   // Smaller for other fields
            lineGap: 60,
            nameExtraGap: 0,
            startX: 20,
            startY: 30,
        },
        "2x1": {
            width: 406,
            height: 203,   // 1 inch = 203 dots
            nameFontSize: 35,
            otherFontSize: 20,
            lineGap: 45,
            nameExtraGap: 0,
            startX: 20,
            startY: 25,
        },
        "3x2": {
            width: 609,    // 3 inches = 609 dots
            height: 406,
            nameFontSize: 60,
            otherFontSize: 30,
            lineGap: 70,
            // Extra gap after name so the visual
            // spacing to the phone line matches
            // the rest of the lines
            nameExtraGap: 10,
            startX: 30,
            startY: 40,
        },
    };

    const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

    // Apply font size & line spacing multipliers
    const adjustedNameFontSize = Math.max(10, Math.round(cfg.nameFontSize * fontSizeMultiplier));
    const adjustedOtherFontSize = Math.max(10, Math.round(cfg.otherFontSize * fontSizeMultiplier));
    const effectiveLineGap = Math.max(10, Math.round(cfg.lineGap * lineGapMultiplier));
    const nameLineGap = Math.max(
        10,
        Math.round(effectiveLineGap + (cfg.nameExtraGap || 0))
    );

    // Start format
    lines.push('^XA');           // Start format
    lines.push('^PON');          // Print orientation Normal (fixes 90-degree rotation)
    lines.push('^LH0,0');        // Label home position

    let y = cfg.startY;
    let namesCombined = false;

    // Check if both firstName and surname are selected
    const hasFirstName = selectedFields.includes('firstName');
    const hasSurname = selectedFields.includes('surname');

    selectedFields.forEach((field, index) => {
        const value = row[field];
        if (!value) return;

        // Skip surname if we're combining it with firstName
        if (field === 'surname' && hasFirstName && !namesCombined) {
            return;
        }

        // If this is firstName and surname exists, combine them
        if (field === 'firstName' && hasSurname) {
            const fullName = `${row.firstName || ''} ${row.surname || ''}`.trim();
            // ^FO = Field Origin, ^A0B = Font 0 Bold, ^FD = Field Data, ^FS = Field Separator
            lines.push(`^FO${cfg.startX},${y}^A0B,${adjustedNameFontSize},${adjustedNameFontSize}^FD${fullName}^FS`);
            namesCombined = true;
            // Slightly larger gap after the taller name line
            y += nameLineGap;
            return;
        }

        // For other fields or if names aren't being combined
        const isNameField = field === 'firstName' || field === 'surname';

        // Get field-specific font size or use default
        const fieldMultiplier = fieldFontSizes[field] || (isNameField ? 1.5 : 1.0);
        const combinedMultiplier = fontSizeMultiplier * fieldMultiplier;

        const baseFontSize = isNameField ? cfg.nameFontSize : cfg.otherFontSize;
        const fontSize = Math.max(10, Math.round(baseFontSize * combinedMultiplier));
        const fontStyle = isNameField ? 'B' : 'N'; // B = Bold, N = Normal

        lines.push(`^FO${cfg.startX},${y}^A0${fontStyle},${fontSize},${fontSize}^FD${value}^FS`);
        y += effectiveLineGap;
    });

    lines.push('^XZ');  // End format

    return new TextEncoder().encode(lines.join('\n'));
};

/**
 * Generate CPCL from Excel data for label printing
 * Works with Citizen, Intermec label printers
 */
export const generateCPCLFromExcel = async (
    row,
    selectedFields = [],
    labelSize = "2x2",
    fontSizeMultiplier = 1.0,  // Global font size multiplier
    fieldFontSizes = {},       // Individual font sizes per field
    lineGapMultiplier = 1.0    // Vertical spacing multiplier
) => {
    const lines = [];

    // Label size configurations (in dots, 203 DPI)
    const SIZE_CONFIG = {
        "2x2": {
            width: 406,
            height: 406,
            nameFont: "7",       // Larger font for names
            otherFont: "3",      // Smaller font for other fields
            lineGap: 45,
            nameExtraGap: 0,
            startX: 30,
            startY: 40,
        },
        "2x1": {
            width: 406,
            height: 203,
            nameFont: "5",
            otherFont: "2",
            lineGap: 35,
            nameExtraGap: 0,
            startX: 25,
            startY: 30,
        },
        "3x2": {
            width: 609,
            height: 406,
            nameFont: "8",
            otherFont: "4",
            lineGap: 50,
            // Slightly larger white-space after name
            // so the visual gap to phone matches others
            nameExtraGap: 10,
            startX: 40,
            startY: 45,
        },
    };

    const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

    // Apply font size & line spacing multipliers
    const nameMag = Math.max(1, Math.round(2 * fontSizeMultiplier));
    const otherMag = Math.max(1, Math.round(1 * fontSizeMultiplier));
    const effectiveLineGap = Math.max(10, Math.round(cfg.lineGap * lineGapMultiplier));
    const nameLineGap = Math.max(
        10,
        Math.round(effectiveLineGap + (cfg.nameExtraGap || 0))
    );

    // Start format
    lines.push(`! 0 200 200 ${cfg.height} 1`);
    lines.push(`PAGE-WIDTH ${cfg.width}`);
    lines.push('LEFT');
    lines.push('');

    let y = cfg.startY;
    let namesCombined = false;

    // Check if both firstName and surname are selected
    const hasFirstName = selectedFields.includes('firstName');
    const hasSurname = selectedFields.includes('surname');

    selectedFields.forEach((field) => {
        const value = row[field];
        if (!value) return;

        // Skip surname if we're combining it with firstName
        if (field === 'surname' && hasFirstName && !namesCombined) {
            return;
        }

        // If this is firstName and surname exists, combine them
        if (field === 'firstName' && hasSurname) {
            const fullName = `${row.firstName || ''} ${row.surname || ''}`.trim();
            lines.push(`SETBOLD ${nameMag}`); // Bold for names
            lines.push(`TEXT ${cfg.nameFont} 0 ${cfg.startX} ${y} ${fullName}`);
            lines.push('SETBOLD 0'); // Reset bold
            namesCombined = true;
            // Slightly larger gap after the taller name line
            y += nameLineGap;
            return;
        }

        // For other fields or if names aren't being combined
        const isNameField = field === 'firstName' || field === 'surname';

        // Get field-specific font size or use default
        const fieldMultiplier = fieldFontSizes[field] || (isNameField ? 1.5 : 1.0);
        const combinedMultiplier = fontSizeMultiplier * fieldMultiplier;

        const fontNum = isNameField ? cfg.nameFont : cfg.otherFont;
        const baseMag = isNameField ? 2 : 1;
        const mag = Math.max(1, Math.round(baseMag * combinedMultiplier));

        // TEXT font size x y text
        // For bold effect, we can use SETBOLD command before text
        if (isNameField) {
            lines.push(`SETBOLD ${mag}`); // Bold for names
        }
        lines.push(`TEXT ${fontNum} 0 ${cfg.startX} ${y} ${value}`);
        if (isNameField) {
            lines.push('SETBOLD 0'); // Reset bold
        }

        y += effectiveLineGap;
    });

    lines.push('PRINT');
    lines.push('');

    return new TextEncoder().encode(lines.join('\r\n'));
};

/**
 * Generate ZPL (Zebra Programming Language) commands for Zebra label printers
 * Works with Zebra ZD, ZT, ZM series printers
 */
export const generateZPL = async (event, bookingData, totalTax, discount, grandTotal, formatDateTime) => {
    const lines = [];
    const token = bookingData?.[0]?.token || '';

    // ZPL format start
    lines.push('^XA'); // Start format

    // Set label home position
    lines.push('^LH0,0');

    // Event Name - centered, large font
    lines.push('^FO200,30^A0N,40,40^FD' + (event?.name || 'Event Ticket') + '^FS');

    // QR Code - ZPL native QR command
    if (token) {
        // ^BQN,2,6 = QR Code, Normal orientation, Model 2, Magnification 6
        lines.push('^FO150,80^BQN,2,6^FDMA,' + token + '^FS');
    }

    // Date/Time
    const dateTime = formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at || '';
    lines.push('^FO100,320^A0N,25,25^FD' + dateTime + '^FS');

    // Separator line
    let yPos = 360;
    lines.push('^FO20,' + yPos + '^GB550,2,2^FS'); // Graphic box (line)
    yPos += 20;

    // Ticket details header
    lines.push('^FO20,' + yPos + '^A0N,20,20^FDQty  Ticket Name          Price^FS');
    yPos += 30;
    lines.push('^FO20,' + yPos + '^GB550,2,2^FS');
    yPos += 20;

    // Ticket items
    bookingData?.forEach((booking) => {
        const qty = booking.quantity || 0;
        const name = (booking?.ticket?.name || 'N/A').substring(0, 20);
        const amount = Number(booking.amount) || 0;
        const quantity = Number(booking.quantity) || 0;
        const price = formatCurrency(amount * quantity);

        lines.push('^FO20,' + yPos + '^A0N,20,20^FD' + qty + '  ' + name + '^FS');
        lines.push('^FO400,' + yPos + '^A0N,20,20^FD' + price + '^FS');
        yPos += 30;
    });

    // Separator
    lines.push('^FO20,' + yPos + '^GB550,2,2^FS');
    yPos += 30;

    // Summary
    const safeTax = isNaN(parseFloat(totalTax)) ? 0 : parseFloat(totalTax);
    const safeDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
    const safeGrandTotal = isNaN(parseFloat(grandTotal)) ? 0 : parseFloat(grandTotal);

    lines.push('^FO20,' + yPos + '^A0N,20,20^FDTOTAL TAX:     ' + formatCurrency(safeTax) + '^FS');
    yPos += 30;
    lines.push('^FO20,' + yPos + '^A0N,20,20^FDDISCOUNT:      ' + formatCurrency(safeDiscount) + '^FS');
    yPos += 30;
    lines.push('^FO20,' + yPos + '^A0N,30,30^FDTOTAL:  ' + formatCurrency(safeGrandTotal) + '^FS');
    yPos += 50;

    // Footer
    lines.push('^FO150,' + yPos + '^A0N,20,20^FDThank You for Payment^FS');
    yPos += 30;
    lines.push('^FO120,' + yPos + '^A0N,25,25^FDwww.getyourticket.in^FS');

    // End format and print
    lines.push('^XZ');

    const zplString = lines.join('\n');
    return new TextEncoder().encode(zplString);
};

/**
 * Generate ZPL from Excel data for label printing
 */
// export const generateZPLFromExcel = async (
//     row,
//     selectedFields = [],
//     labelSize = "2x2"
// ) => {
//     const lines = [];

//     // Label size configurations (in dots, 203 DPI)
//     const SIZE_CONFIG = {
//         "2x2": {
//             width: 406,    // 2 inches = 406 dots
//             height: 406,
//             font: "0",     // Font A
//             fontSize: 30,
//             lineGap: 40,
//             startX: 30,
//             startY: 40,
//         },
//         "2x1": {
//             width: 406,
//             height: 203,   // 1 inch = 203 dots
//             font: "0",
//             fontSize: 25,
//             lineGap: 35,
//             startX: 25,
//             startY: 30,
//         },
//         "3x2": {
//             width: 609,    // 3 inches = 609 dots
//             height: 406,
//             font: "0",
//             fontSize: 40,
//             lineGap: 50,
//             startX: 40,
//             startY: 45,
//         },
//     };

//     const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

//     // Start format
//     lines.push('^XA');
//     lines.push('^LH0,0');

//     let y = cfg.startY;

//     selectedFields.forEach((field) => {
//         const value = row[field];
//         if (!value) return;

//         lines.push(`^FO${cfg.startX},${y}^A${cfg.font}N,${cfg.fontSize},${cfg.fontSize}^FD${value}^FS`);
//         y += cfg.lineGap;
//     });

//     lines.push('^XZ');

//     return new TextEncoder().encode(lines.join('\n'));
// };

/**
 * Generate CPCL (Comtec Printer Control Language) commands
 * Works with Citizen, Intermec, and other CPCL-compatible printers
 */
export const generateCPCL = async (event, bookingData, totalTax, discount, grandTotal, formatDateTime) => {
    const lines = [];
    const token = bookingData?.[0]?.token || '';

    // CPCL format start - label height in dots (assume 203 DPI, 4" height = 812 dots)
    lines.push('! 0 200 200 812 1');
    lines.push('PAGE-WIDTH 576'); // 576 dots = ~72mm at 203 DPI
    lines.push('');

    // Event Name - centered, large font
    lines.push('SETMAG 2 2');
    lines.push('CENTER');
    lines.push('TEXT 7 0 288 30 ' + (event?.name || 'Event Ticket'));
    lines.push('SETMAG 1 1');
    lines.push('');

    // QR Code - CPCL barcode command
    if (token) {
        // BARCODE-QR x y M U E size "data"
        // M = model (M for model 2), U = unit size, E = error correction (M = 15%)
        lines.push('BARCODE-QR 150 80 M 2 M 6');
        lines.push('MA,' + token);
        lines.push('ENDQR');
        lines.push('');
    }

    // Date/Time
    const dateTime = formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at || '';
    lines.push('CENTER');
    lines.push('TEXT 4 0 288 320 ' + dateTime);
    lines.push('LEFT');
    lines.push('');

    // Separator line
    let yPos = 360;
    lines.push('LINE 20 ' + yPos + ' 556 ' + yPos + ' 2');
    yPos += 20;

    // Ticket details header
    lines.push('TEXT 4 0 20 ' + yPos + ' Qty  Ticket Name          Price');
    yPos += 30;
    lines.push('LINE 20 ' + yPos + ' 556 ' + yPos + ' 2');
    yPos += 20;

    // Ticket items
    bookingData?.forEach((booking) => {
        const qty = booking.quantity || 0;
        const name = (booking?.ticket?.name || 'N/A').substring(0, 20);
        const amount = Number(booking.amount) || 0;
        const quantity = Number(booking.quantity) || 0;
        const price = formatCurrency(amount * quantity);

        lines.push('TEXT 4 0 20 ' + yPos + ' ' + qty + '  ' + name);
        lines.push('TEXT 4 0 400 ' + yPos + ' ' + price);
        yPos += 30;
    });

    // Separator
    lines.push('LINE 20 ' + yPos + ' 556 ' + yPos + ' 2');
    yPos += 30;

    // Summary
    const safeTax = isNaN(parseFloat(totalTax)) ? 0 : parseFloat(totalTax);
    const safeDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
    const safeGrandTotal = isNaN(parseFloat(grandTotal)) ? 0 : parseFloat(grandTotal);

    lines.push('TEXT 4 0 20 ' + yPos + ' TOTAL TAX:     ' + formatCurrency(safeTax));
    yPos += 30;
    lines.push('TEXT 4 0 20 ' + yPos + ' DISCOUNT:      ' + formatCurrency(safeDiscount));
    yPos += 30;
    lines.push('SETMAG 1 2');
    lines.push('TEXT 7 0 20 ' + yPos + ' TOTAL:  ' + formatCurrency(safeGrandTotal));
    lines.push('SETMAG 1 1');
    yPos += 50;

    // Footer
    lines.push('CENTER');
    lines.push('TEXT 4 0 288 ' + yPos + ' Thank You for Payment');
    yPos += 30;
    lines.push('SETMAG 1 2');
    lines.push('TEXT 7 0 288 ' + yPos + ' www.getyourticket.in');
    lines.push('SETMAG 1 1');

    // Print command
    lines.push('PRINT');
    lines.push('');

    const cpclString = lines.join('\r\n');
    return new TextEncoder().encode(cpclString);
};

/**
 * Generate CPCL from Excel data for label printing
 */
// export const generateCPCLFromExcel = async (
//     row,
//     selectedFields = [],
//     labelSize = "2x2"
// ) => {
//     const lines = [];

//     // Label size configurations (in dots, 203 DPI)
//     const SIZE_CONFIG = {
//         "2x2": {
//             width: 406,
//             height: 406,
//             font: "4",
//             fontSize: 0,   // CPCL font size (0 = default)
//             lineGap: 40,
//             startX: 30,
//             startY: 40,
//         },
//         "2x1": {
//             width: 406,
//             height: 203,
//             font: "4",
//             fontSize: 0,
//             lineGap: 35,
//             startX: 25,
//             startY: 30,
//         },
//         "3x2": {
//             width: 609,
//             height: 406,
//             font: "7",
//             fontSize: 0,
//             lineGap: 50,
//             startX: 40,
//             startY: 45,
//         },
//     };

//     const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

//     // Start format
//     lines.push(`! 0 200 200 ${cfg.height} 1`);
//     lines.push(`PAGE-WIDTH ${cfg.width}`);
//     lines.push('LEFT');
//     lines.push('');

//     let y = cfg.startY;

//     selectedFields.forEach((field) => {
//         const value = row[field];
//         if (!value) return;

//         lines.push(`TEXT ${cfg.font} ${cfg.fontSize} ${cfg.startX} ${y} ${value}`);
//         y += cfg.lineGap;
//     });

//     lines.push('PRINT');
//     lines.push('');

//     return new TextEncoder().encode(lines.join('\r\n'));
// };


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
    fontSizeMultiplier = 1.0,
    fieldFontSizes = {},       // Per-field sizes: direct pt values (e.g. {name: 24, email: 14})
    lineGapMultiplier = 1.0,
    marginMultiplier = 1.0
) => {
    const lines = [];

    // ── Constants (203 DPI) ────────────────────────────────────────────
    const DPI = 203;
    const mmToDots = (mm) => Math.round(mm * (DPI / 25.4));

    // ── TSPL Bitmap Fonts (universally supported, guaranteed sizing) ──
    // Font 1: 8×12,  Font 2: 12×20,  Font 3: 16×24,
    // Font 4: 24×32, Font 5: 32×48
    // x-mult/y-mult = integer multiplier 1–10 (actual size = base × mul)
    const FONTS = [
        { id: "1", w: 8,  h: 12 },
        { id: "2", w: 12, h: 20 },
        { id: "3", w: 16, h: 24 },
        { id: "4", w: 24, h: 32 },
        { id: "5", w: 32, h: 48 },
    ];

    // Pick best font + multiplier combo for a target height in dots
    const pickFont = (targetHeightDots) => {
        let best = { font: FONTS[2], mul: 1 };
        let bestDiff = Infinity;
        for (const font of FONTS) {
            for (let mul = 1; mul <= 10; mul++) {
                const h = font.h * mul;
                const diff = Math.abs(h - targetHeightDots);
                if (diff < bestDiff || (diff === bestDiff && font.h > best.font.h)) {
                    bestDiff = diff;
                    best = { font, mul };
                }
            }
        }
        return best;
    };

    // ── Label size configs ─────────────────────────────────────────────
    // nameFont/baseFont = { id, mul } — static defaults for each label size
    // These produce guaranteed correct sizes with bitmap fonts
    const SIZE_CONFIG = {
        "2x1": {
            widthMm: 50.8,  heightMm: 25.4,
            gapMm: 2,     marginMm: 2,   lineGapDots: 4,
            nameFont: { id: "2", mul: 1 },  // 12×20 = small name
            baseFont: { id: "1", mul: 1 },  // 8×12  = tiny
        },
        "2x2": {
            widthMm: 50.8,  heightMm: 50.8,
            gapMm: 2,     marginMm: 3,   lineGapDots: 6,
            nameFont: { id: "3", mul: 1 },  // 16×24
            baseFont: { id: "2", mul: 1 },  // 12×20
        },
        "3x2": {
            widthMm: 76.2,  heightMm: 50.8,
            gapMm: 3,     marginMm: 3,   lineGapDots: 8,
            nameFont: { id: "4", mul: 1 },  // 24×32
            baseFont: { id: "3", mul: 1 },  // 16×24
        },
        "4x3": {
            widthMm: 101.6, heightMm: 76.2,
            gapMm: 3,     marginMm: 4,   lineGapDots: 10,
            nameFont: { id: "5", mul: 1 },  // 32×48
            baseFont: { id: "4", mul: 1 },  // 24×32
        },
        "4x6": {
            widthMm: 101.6, heightMm: 152.4,
            gapMm: 3,     marginMm: 4,   lineGapDots: 12,
            nameFont: { id: "5", mul: 2 },  // 64×96
            baseFont: { id: "4", mul: 1 },  // 24×32
        },
        "5x4": {
            widthMm: 100,   heightMm: 80,
            gapMm: 3,     marginMm: 4,   lineGapDots: 12,
            nameFont: { id: "5", mul: 2 },  // 64×96
            baseFont: { id: "4", mul: 1 },  // 24×32
        },
        "6x4": {
            widthMm: 100,   heightMm: 80,
            gapMm: 3,     marginMm: 4,   lineGapDots: 14,
            nameFont: { id: "5", mul: 2 },  // 64×96
            baseFont: { id: "5", mul: 1 },  // 32×48
        },
    };

    const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

    // ── Margins ────────────────────────────────────────────────────────
    const marginX = mmToDots(cfg.marginMm * marginMultiplier);
    const marginY = mmToDots(cfg.marginMm * marginMultiplier);

    // ── Line gap (fixed dots, scaled by user's line spacing control) ──
    const effectiveLineGap = Math.max(2, Math.round(cfg.lineGapDots * lineGapMultiplier));

    // ── Printable area ────────────────────────────────────────────────
    const printableWidthDots = mmToDots(cfg.widthMm) - 2 * marginX;
    const maxY = mmToDots(cfg.heightMm) - marginY;

    // ── Resolve font for a field ──────────────────────────────────────
    // Priority: 1) User's explicit pt size → pickFont  2) Static default
    const getFontForField = (field) => {
        const isNameField = ['firstName', 'name', 'surname'].includes(field);

        // Check if user set an explicit pt size for this field
        if (fieldFontSizes[field] && fieldFontSizes[field] > 0) {
            // Convert pt → target height in dots, then apply global multiplier
            const targetDots = Math.round((fieldFontSizes[field] * (DPI / 72)) * fontSizeMultiplier);
            return pickFont(targetDots);
        }

        // Use static default, scaled by global multiplier
        const defaultCfg = isNameField ? cfg.nameFont : cfg.baseFont;
        const defaultFont = FONTS.find(f => f.id === defaultCfg.id) || FONTS[2];
        const baseHeightDots = defaultFont.h * defaultCfg.mul;

        if (fontSizeMultiplier === 1.0) {
            return { font: defaultFont, mul: defaultCfg.mul };
        }
        // Re-pick with scaled target
        return pickFont(Math.round(baseHeightDots * fontSizeMultiplier));
    };

    // ── Word wrapping (based on character width of chosen font) ───────
    const wrapText = (text, charWidthDots) => {
        const maxChars = Math.max(1, Math.floor(printableWidthDots / charWidthDots));
        if (text.length <= maxChars) return [text];

        const words = text.split(' ');
        const wrappedLines = [];
        let currentLine = '';
        for (const word of words) {
            if (!currentLine) {
                currentLine = word;
            } else if ((currentLine + ' ' + word).length <= maxChars) {
                currentLine += ' ' + word;
            } else {
                wrappedLines.push(currentLine);
                currentLine = word;
            }
            while (currentLine.length > maxChars) {
                wrappedLines.push(currentLine.substring(0, maxChars));
                currentLine = currentLine.substring(maxChars);
            }
        }
        if (currentLine) wrappedLines.push(currentLine);
        return wrappedLines;
    };

    // ── Build TSPL commands ───────────────────────────────────────────
    lines.push(`SIZE ${cfg.widthMm} mm,${cfg.heightMm} mm`);
    lines.push(`GAP ${cfg.gapMm} mm,0 mm`);
    lines.push("SPEED 4");
    lines.push("DENSITY 8");
    lines.push("DIRECTION 0");
    lines.push("SET TEAR ON");
    lines.push("CLS");

    let y = marginY;

    selectedFields.forEach((field) => {
        const rawValue = row[field];
        if (rawValue === null || rawValue === undefined || rawValue === '') return;
        if (y >= maxY) return;

        const { font, mul } = getFontForField(field);
        const charW = font.w * mul;  // actual character width in dots
        const charH = font.h * mul;  // actual character height in dots

        const text = String(rawValue).replace(/"/g, '\\["]');
        const wrappedLines = wrapText(text, charW);

        for (const line of wrappedLines) {
            if (y + charH > maxY) break;

            // TEXT x, y, "font", rotation, x-mul, y-mul, "content"
            lines.push(
                `TEXT ${marginX},${y},"${font.id}",0,${mul},${mul},"${line}"`
            );
            // Y advance = exact rendered height + fixed line gap
            y += charH + effectiveLineGap;
        }
    });

    lines.push("PRINT 1");
    lines.push("");

    const tsplOutput = lines.join("\r\n");
    console.log("[TSPL] labelSize:", labelSize,
        "| fontSizeMultiplier:", fontSizeMultiplier,
        "| lineGapMultiplier:", lineGapMultiplier,
        "| marginMultiplier:", marginMultiplier);
    console.log("[TSPL] Field fonts:", selectedFields.map(f => {
        const { font, mul } = getFontForField(f);
        return `${f}=Font${font.id}×${mul}(${font.w*mul}×${font.h*mul}dots)`;
    }).join(', '));
    console.log("[TSPL] fieldFontSizes:", JSON.stringify(fieldFontSizes));
    console.log("[TSPL] Commands:\n" + tsplOutput);

    return new TextEncoder().encode(tsplOutput);
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
            nameExtraGap: 10,
            startX: 30,
            startY: 40,
        },
        "4x3": {
            width: 812,    // 4 inches = 812 dots
            height: 609,
            nameFontSize: 70,
            otherFontSize: 35,
            lineGap: 80,
            nameExtraGap: 10,
            startX: 30,
            startY: 40,
        },
        "4x6": {
            width: 812,
            height: 1218,  // 6 inches = 1218 dots
            nameFontSize: 80,
            otherFontSize: 40,
            lineGap: 100,
            nameExtraGap: 15,
            startX: 30,
            startY: 50,
        },
        "5x4": {
            width: 1015,   // 5 inches = 1015 dots
            height: 812,
            nameFontSize: 75,
            otherFontSize: 38,
            lineGap: 85,
            nameExtraGap: 12,
            startX: 35,
            startY: 45,
        },
        "6x4": {
            width: 1218,   // 6 inches = 1218 dots
            height: 812,
            nameFontSize: 80,
            otherFontSize: 40,
            lineGap: 90,
            nameExtraGap: 15,
            startX: 40,
            startY: 50,
        },
    };

    const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

    // Apply font size & line spacing multipliers
    const effectiveLineGap = Math.max(10, Math.round(cfg.lineGap * lineGapMultiplier));

    // Start format
    lines.push('^XA');           // Start format
    lines.push('^PON');          // Print orientation Normal (fixes 90-degree rotation)
    lines.push('^LH0,0');        // Label home position

    let y = cfg.startY;

    selectedFields.forEach((field) => {
        const value = row[field];
        if (!value) return;

        // Determine if this is a name field for font styling
        const isNameField = field === 'firstName' || field === 'surname' || field === 'name';

        // Get field-specific font size
        // fieldFontSizes stores direct point sizes (e.g. {name: 20, email: 14})
        const baseFontSize = isNameField ? cfg.nameFontSize : cfg.otherFontSize;
        let fontSize;
        if (fieldFontSizes[field] && fieldFontSizes[field] > 0) {
            // Convert pt to dots: pt * (203/72) ≈ pt * 2.82, then scale by global multiplier
            fontSize = Math.max(10, Math.round(fieldFontSizes[field] * (203 / 72) * fontSizeMultiplier));
        } else {
            fontSize = Math.max(10, Math.round(baseFontSize * fontSizeMultiplier));
        }
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
            nameExtraGap: 10,
            startX: 40,
            startY: 45,
        },
        "4x3": {
            width: 812,
            height: 609,
            nameFont: "8",
            otherFont: "5",
            lineGap: 60,
            nameExtraGap: 10,
            startX: 40,
            startY: 50,
        },
        "4x6": {
            width: 812,
            height: 1218,
            nameFont: "8",
            otherFont: "5",
            lineGap: 80,
            nameExtraGap: 15,
            startX: 40,
            startY: 50,
        },
        "5x4": {
            width: 1015,
            height: 812,
            nameFont: "8",
            otherFont: "5",
            lineGap: 65,
            nameExtraGap: 12,
            startX: 45,
            startY: 50,
        },
        "6x4": {
            width: 1218,
            height: 812,
            nameFont: "8",
            otherFont: "5",
            lineGap: 70,
            nameExtraGap: 15,
            startX: 50,
            startY: 50,
        },
    };

    const cfg = SIZE_CONFIG[labelSize] || SIZE_CONFIG["2x2"];

    // Apply font size & line spacing multipliers
    // For combined firstName+surname, use fieldFontSizes if set (direct pt / 8 → mag)
    const nameFieldPt = fieldFontSizes['firstName'] || fieldFontSizes['surname'] || 0;
    const nameMag = nameFieldPt > 0
        ? Math.max(1, Math.round((nameFieldPt / 8) * fontSizeMultiplier))
        : Math.max(1, Math.round(2 * fontSizeMultiplier));
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

        // Get field-specific font size
        // fieldFontSizes stores direct point sizes (e.g. {name: 20, email: 14})
        const fontNum = isNameField ? cfg.nameFont : cfg.otherFont;
        const baseMag = isNameField ? 2 : 1;
        let mag;
        if (fieldFontSizes[field] && fieldFontSizes[field] > 0) {
            // Map pt size to CPCL magnification: pt/8 gives a reasonable mag value
            mag = Math.max(1, Math.round((fieldFontSizes[field] / 8) * fontSizeMultiplier));
        } else {
            mag = Math.max(1, Math.round(baseMag * fontSizeMultiplier));
        }

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


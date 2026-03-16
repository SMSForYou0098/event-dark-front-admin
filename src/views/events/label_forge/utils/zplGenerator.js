/**
 * ZPL Generator Utilities
 * 
 * Native ZPL command generation for Zebra thermal printers.
 * No bitmap conversion needed - direct text/barcode/QR commands.
 * 
 * Reference: https://developer.zebra.com/products/printers/zpl
 * 
 * ZPL DPI: Most Zebra printers use 203 DPI (8 dots/mm)
 * Label coordinates are in dots from top-left corner.
 */

// Standard DPIs
export const DPI = {
    DPI_203: 203,  // 8 dots/mm - most common
    DPI_300: 300,  // 11.8 dots/mm
    DPI_600: 600,  // 23.6 dots/mm
};

// Convert mm to dots at 203 DPI
export const mmToDots = (mm, dpi = 203) => Math.round(mm * dpi / 25.4);

// Convert inches to dots
export const inchesToDots = (inches, dpi = 203) => Math.round(inches * dpi);

// Label size presets (in dots at 203 DPI)
export const LABEL_SIZES = {
    '2x1': { width: 406, height: 203, widthMM: 50.8, heightMM: 25.4 },
    '2x2': { width: 406, height: 406, widthMM: 50.8, heightMM: 50.8 },
    '3x2': { width: 609, height: 406, widthMM: 76.2, heightMM: 50.8 },
    '4x2': { width: 812, height: 406, widthMM: 101.6, heightMM: 50.8 },
    '4x3': { width: 812, height: 609, widthMM: 101.6, heightMM: 76.2 },
    '4x6': { width: 812, height: 1218, widthMM: 101.6, heightMM: 152.4 },
};

// Font codes for Zebra - ^A command
// Format: ^Afo,h,w where f=font, o=orientation, h=height, w=width
export const FONTS = {
    A: '0',  // Bitmap font - scalable
    B: 'B',  // Bitmap font - different style
    C: 'C',  // OCR-A
    D: 'D',  // OCR-B
    E: 'E',  // CG Triumvirate proportional
    F: 'F',  // CG Triumvirate condensed
    G: 'G',  // Helvetica-like proportional
    H: 'H',  // MICR
    P: 'P',  // CG Triumvirate (standard)
    Q: 'Q',  // Gothic
    R: 'R',  // Script
    S: 'S',  // Symbol
    T: 'T',  // Antique
    U: 'U',  // Letter Gothic
    V: 'V',  // Big serif
};

// Orientation options
export const ORIENTATION = {
    NORMAL: 'N',      // 0 degrees - normal
    ROTATED_90: 'R',  // 90 degrees - rotated
    INVERTED: 'I',    // 180 degrees - inverted
    BOTTOM_UP: 'B',   // 270 degrees - bottom up
};

// Barcode types
export const BARCODE_TYPES = {
    CODE_128: 'C',     // ^BC
    CODE_39: '3',      // ^B3
    CODE_93: '9',      // ^B9
    UPC_A: 'U',        // ^BU
    UPC_E: 'E',        // ^BE
    EAN_13: 'E',       // ^Be
    EAN_8: '8',        // ^B8
    QR_CODE: 'Q',      // ^BQ
    DATA_MATRIX: 'X',  // ^BX
};

/**
 * ZPL Label Builder Class
 * Fluent API for building ZPL commands
 */
export class ZPLBuilder {
    constructor(options = {}) {
        const { 
            labelSize = '3x2', 
            dpi = 203,
            copies = 1,
            darkness = 15,  // 0-30
            printSpeed = 4, // 2-14 inches/second
        } = options;
        
        this.commands = [];
        this.dpi = dpi;
        this.copies = copies;
        this.darkness = darkness;
        this.printSpeed = printSpeed;
        
        // Set label dimensions
        if (typeof labelSize === 'string' && LABEL_SIZES[labelSize]) {
            this.labelWidth = LABEL_SIZES[labelSize].width;
            this.labelHeight = LABEL_SIZES[labelSize].height;
        } else if (typeof labelSize === 'object') {
            this.labelWidth = labelSize.width || 609;
            this.labelHeight = labelSize.height || 406;
        } else {
            this.labelWidth = 609;  // Default 3"
            this.labelHeight = 406; // Default 2"
        }
    }

    // ==================== SETUP COMMANDS ====================

    /**
     * Start ZPL format - must be first command
     */
    start() {
        this.commands.push('^XA');
        return this;
    }

    /**
     * End ZPL format - must be last command
     */
    end() {
        this.commands.push('^XZ');
        return this;
    }

    /**
     * Set print width
     */
    setPrintWidth(dots = null) {
        const width = dots || this.labelWidth;
        this.commands.push(`^PW${width}`);
        return this;
    }

    /**
     * Set label length
     */
    setLabelLength(dots = null) {
        const height = dots || this.labelHeight;
        this.commands.push(`^LL${height}`);
        return this;
    }

    /**
     * Set print mode
     * T = Tear-off (default)
     * P = Peel-off
     * R = Rewind
     * C = Cutter
     */
    setPrintMode(mode = 'T') {
        this.commands.push(`^MM${mode}`);
        return this;
    }

    /**
     * Set print orientation
     * N = Normal
     * I = Inverted (180°)
     */
    setPrintOrientation(orientation = 'N') {
        this.commands.push(`^PO${orientation}`);
        return this;
    }

    /**
     * Set label home position (offset)
     */
    setLabelHome(x = 0, y = 0) {
        this.commands.push(`^LH${x},${y}`);
        return this;
    }

    /**
     * Set media darkness (print intensity)
     * @param {number} value - 0 to 30 (higher = darker)
     */
    setDarkness(value = 15) {
        this.commands.push(`~SD${value}`);
        return this;
    }

    /**
     * Set print speed
     * @param {number} print - Print speed (2-14 in/sec)
     * @param {number} slew - Slew speed (optional)
     */
    setSpeed(print = 4, slew = null) {
        if (slew !== null) {
            this.commands.push(`^PR${print},${slew}`);
        } else {
            this.commands.push(`^PR${print}`);
        }
        return this;
    }

    /**
     * Add comment (for debugging - not printed)
     */
    comment(text) {
        this.commands.push(`^FX ${text}`);
        return this;
    }

    // ==================== TEXT COMMANDS ====================

    /**
     * Add text field
     * @param {number} x - X position in dots
     * @param {number} y - Y position in dots
     * @param {string} text - Text content
     * @param {object} options - Text options
     */
    text(x, y, text, options = {}) {
        const {
            font = '0',            // Font (0=default scalable, A-Z for bitmap)
            orientation = 'N',     // N=normal, R=90°, I=180°, B=270°
            height = 30,           // Character height in dots
            width = 30,            // Character width in dots
            bold = false,          // Simulate bold (duplicate print)
            reverse = false,       // White on black
        } = options;

        // Field origin
        this.commands.push(`^FO${x},${y}`);
        
        // Scalable font with size
        this.commands.push(`^A${font}${orientation},${height},${width}`);
        
        // Reverse field (white on black)
        if (reverse) {
            this.commands.push('^FR');
        }
        
        // Field data
        this.commands.push(`^FD${this._escapeText(text)}^FS`);
        
        // Simulate bold by printing slightly offset (optional)
        if (bold) {
            this.commands.push(`^FO${x + 1},${y}`);
            this.commands.push(`^A${font}${orientation},${height},${width}`);
            if (reverse) this.commands.push('^FR');
            this.commands.push(`^FD${this._escapeText(text)}^FS`);
        }
        
        return this;
    }

    /**
     * Add centered text
     * @param {number} y - Y position in dots
     * @param {string} text - Text content
     * @param {object} options - Text options
     */
    textCentered(y, text, options = {}) {
        const {
            font = '0',
            orientation = 'N',
            height = 30,
            width = 30,
            labelWidth = this.labelWidth,
        } = options;

        // Estimate text width (approximate based on character count and width)
        const estimatedWidth = text.length * width * 0.6;
        const x = Math.max(0, Math.round((labelWidth - estimatedWidth) / 2));

        return this.text(x, y, text, { font, orientation, height, width, ...options });
    }

    /**
     * Add text block (multi-line with word wrap)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Block width in dots
     * @param {number} lines - Max number of lines
     * @param {string} text - Text content
     * @param {object} options - Options
     */
    textBlock(x, y, width, lines, text, options = {}) {
        const {
            font = '0',
            fontHeight = 25,
            fontWidth = 25,
            lineSpacing = 0,
            justification = 'L', // L=left, C=center, R=right, J=justified
        } = options;

        this.commands.push(`^FO${x},${y}`);
        this.commands.push(`^A${font}N,${fontHeight},${fontWidth}`);
        this.commands.push(`^FB${width},${lines},${lineSpacing},${justification}`);
        this.commands.push(`^FD${this._escapeText(text)}^FS`);
        return this;
    }

    // ==================== BARCODE COMMANDS ====================

    /**
     * Add Code 128 barcode
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} data - Barcode data
     * @param {object} options - Options
     */
    barcode128(x, y, data, options = {}) {
        const {
            height = 50,           // Barcode height in dots
            orientation = 'N',     // Orientation
            printInterpretation = true,  // Print human-readable text
            interpretationAbove = false, // Text above barcode
            checkDigit = false,    // UCC check digit
            moduleWidth = 2,       // Module (bar) width 1-10
        } = options;

        // Set module width
        this.commands.push(`^BY${moduleWidth},3,${height}`);
        
        // Field origin
        this.commands.push(`^FO${x},${y}`);
        
        // Code 128 barcode
        const printText = printInterpretation ? 'Y' : 'N';
        const textAbove = interpretationAbove ? 'Y' : 'N';
        const ucc = checkDigit ? 'Y' : 'N';
        
        this.commands.push(`^BC${orientation},${height},${printText},${textAbove},${ucc}`);
        this.commands.push(`^FD${data}^FS`);
        
        return this;
    }

    /**
     * Add QR Code
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} data - QR code data
     * @param {object} options - Options
     */
    qrCode(x, y, data, options = {}) {
        const {
            orientation = 'N',     // Orientation
            model = 2,             // 1 = Model 1, 2 = Model 2 (recommended)
            magnification = 4,     // 1-10, cell size
            // Note: errorCorrection and maskValue can be added to ^BQ command if needed
            // errorCorrection: H=High, Q=25%, M=15%, L=Low
            // maskValue: 0-7, auto=7
        } = options;

        this.commands.push(`^FO${x},${y}`);
        
        // ^BQ command: QR Barcode
        // ^BQo,m,c,e,v
        // o = orientation
        // m = model (1 or 2)
        // c = magnification (1-10)
        // e = error correction (H,Q,M,L)
        // v = mask value (0-7, 7=auto)
        this.commands.push(`^BQ${orientation},${model},${magnification}`);
        
        // Data field (MA, = Automatic mode)
        this.commands.push(`^FDMA,${data}^FS`);
        
        return this;
    }

    /**
     * Add Data Matrix code
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} data - Data matrix content
     * @param {object} options - Options
     */
    dataMatrix(x, y, data, options = {}) {
        const {
            orientation = 'N',
            height = 0,            // 0 = auto
            quality = 200,         // 0, 50, 80, 100, 140, 200
        } = options;

        this.commands.push(`^FO${x},${y}`);
        this.commands.push(`^BX${orientation},${height},${quality}`);
        this.commands.push(`^FD${data}^FS`);
        return this;
    }

    // ==================== GRAPHIC COMMANDS ====================

    /**
     * Draw a box/rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Box width
     * @param {number} height - Box height
     * @param {number} thickness - Border thickness
     * @param {string} color - 'B' for black, 'W' for white
     * @param {number} rounding - Corner rounding (0-8)
     */
    box(x, y, width, height, thickness = 2, color = 'B', rounding = 0) {
        this.commands.push(`^FO${x},${y}`);
        this.commands.push(`^GB${width},${height},${thickness},${color},${rounding}^FS`);
        return this;
    }

    /**
     * Draw a horizontal line
     */
    horizontalLine(x, y, length, thickness = 2) {
        return this.box(x, y, length, thickness, thickness);
    }

    /**
     * Draw a vertical line
     */
    verticalLine(x, y, length, thickness = 2) {
        return this.box(x, y, thickness, length, thickness);
    }

    /**
     * Draw a filled rectangle
     */
    filledBox(x, y, width, height) {
        this.commands.push(`^FO${x},${y}`);
        this.commands.push(`^GB${width},${height},${Math.min(width, height)},B,0^FS`);
        return this;
    }

    /**
     * Draw a circle
     * @param {number} x - X position (top-left of bounding box)
     * @param {number} y - Y position
     * @param {number} diameter - Circle diameter
     * @param {number} thickness - Border thickness
     */
    circle(x, y, diameter, thickness = 2) {
        this.commands.push(`^FO${x},${y}`);
        this.commands.push(`^GC${diameter},${thickness},B^FS`);
        return this;
    }

    /**
     * Draw a diagonal line
     */
    diagonalLine(x, y, width, height, thickness = 2, rightToLeft = false) {
        const direction = rightToLeft ? 'L' : 'R';
        this.commands.push(`^FO${x},${y}`);
        this.commands.push(`^GD${width},${height},${thickness},B,${direction}^FS`);
        return this;
    }

    /**
     * Reverse field (invert colors in area)
     */
    reverseField(x, y, width, height) {
        this.commands.push(`^FO${x},${y}^FR`);
        this.commands.push(`^GB${width},${height},${Math.min(width, height)},B^FS`);
        return this;
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Escape special characters in text
     */
    _escapeText(text) {
        if (!text) return '';
        return String(text)
            .replace(/\\/g, '\\\\')
            .replace(/\^/g, '\\^')
            .replace(/~/g, '\\~');
    }

    /**
     * Set number of copies to print
     */
    setCopies(count = 1) {
        this.commands.push(`^PQ${count}`);
        return this;
    }

    /**
     * Build the complete ZPL string
     */
    build() {
        return this.commands.join('\n');
    }

    /**
     * Build and return as bytes for printing
     */
    toBytes() {
        return new TextEncoder().encode(this.build());
    }

    /**
     * Reset/clear all commands
     */
    clear() {
        this.commands = [];
        return this;
    }
}

// ==================== PRESET LABEL TEMPLATES ====================

/**
 * Generate a badge label (3"x2") for event attendance
 * @param {object} data - Badge data
 * @param {object} options - Options
 */
export const generateBadgeLabel = (data, options = {}) => {
    const {
        labelSize = '3x2',
        showQR = true,
        showCompany = true,
        showDesignation = true,
        showStallNumber = false,
    } = options;

    const {
        name = '',
        surname = '',
        company_name = '',
        designation = '',
        stall_number = '',
        qrcode = '',
    } = data;

    const size = LABEL_SIZES[labelSize] || LABEL_SIZES['3x2'];
    const builder = new ZPLBuilder({ labelSize });
    
    const fullName = `${name} ${surname}`.trim() || 'Guest';
    
    builder
        .start()
        .comment('Event Badge Label')
        .setPrintWidth()
        .setLabelLength()
        .setPrintMode('T')
        .setLabelHome(0, 0);

    // Top border line
    builder.horizontalLine(20, 15, size.width - 40, 3);

    // Name (large, bold, centered)
    let yPos = 40;
    const nameHeight = 45;
    const nameWidth = 45;
    const nameTextWidth = fullName.length * nameWidth * 0.6;
    const nameX = Math.max(20, Math.round((size.width - nameTextWidth) / 2));
    
    builder.text(nameX, yPos, fullName, {
        height: nameHeight,
        width: nameWidth,
        bold: true,
    });
    yPos += nameHeight + 15;

    // Company name (medium, centered)
    if (showCompany && company_name) {
        const compHeight = 28;
        const compWidth = 28;
        const compTextWidth = company_name.length * compWidth * 0.6;
        const compX = Math.max(20, Math.round((size.width - compTextWidth) / 2));
        
        builder.text(compX, yPos, company_name, {
            height: compHeight,
            width: compWidth,
        });
        yPos += compHeight + 10;
    }

    // Designation (smaller, centered)
    if (showDesignation && designation) {
        const desHeight = 22;
        const desWidth = 22;
        const desTextWidth = designation.length * desWidth * 0.6;
        const desX = Math.max(20, Math.round((size.width - desTextWidth) / 2));
        
        builder.text(desX, yPos, designation, {
            height: desHeight,
            width: desWidth,
        });
        yPos += desHeight + 15;
    }

    // Separator line
    builder.horizontalLine(30, yPos, size.width - 60, 2);
    yPos += 15;

    // QR Code (centered in remaining space)
    if (showQR && qrcode) {
        const qrMag = 4;  // Magnification
        const qrSize = qrMag * 25;  // Approximate QR size
        const qrX = Math.round((size.width - qrSize) / 2);
        
        builder.qrCode(qrX, yPos, qrcode, {
            magnification: qrMag,
            errorCorrection: 'M',
        });
        yPos += qrSize + 20;
    }

    // Stall number (if applicable)
    if (showStallNumber && stall_number) {
        const stallHeight = 24;
        const stallWidth = 24;
        const stallText = `Stall: ${stall_number}`;
        const stallTextWidth = stallText.length * stallWidth * 0.6;
        const stallX = Math.max(20, Math.round((size.width - stallTextWidth) / 2));
        
        builder.text(stallX, size.height - 50, stallText, {
            height: stallHeight,
            width: stallWidth,
        });
    }

    // Bottom border line
    builder.horizontalLine(20, size.height - 20, size.width - 40, 3);

    builder.end();
    
    return builder.build();
};

/**
 * Generate a simple name badge
 */
export const generateSimpleNameBadge = (name, options = {}) => {
    const { labelSize = '3x2' } = options;
    const size = LABEL_SIZES[labelSize] || LABEL_SIZES['3x2'];
    const builder = new ZPLBuilder({ labelSize });
    
    builder
        .start()
        .comment('Simple Name Badge')
        .setPrintWidth()
        .setLabelLength();

    // Border
    builder.box(10, 10, size.width - 20, size.height - 20, 3, 'B', 2);

    // "HELLO MY NAME IS" header
    const headerY = 40;
    builder.textCentered(headerY, 'HELLO', { height: 24, width: 24 });
    builder.textCentered(headerY + 30, 'MY NAME IS', { height: 20, width: 20 });

    // Name (large)
    const nameY = Math.round(size.height / 2) - 20;
    const nameHeight = 60;
    const nameWidth = 60;
    const nameTextWidth = name.length * nameWidth * 0.6;
    const nameX = Math.max(20, Math.round((size.width - nameTextWidth) / 2));
    
    builder.text(nameX, nameY, name, {
        height: nameHeight,
        width: nameWidth,
        bold: true,
    });

    builder.end();
    
    return builder.build();
};

/**
 * Generate a shipping label
 */
export const generateShippingLabel = (data, options = {}) => {
    const {
        fromName = '',
        fromAddress = '',
        fromCity = '',
        toName = '',
        toAddress = '',
        toCity = '',
        trackingNumber = '',
    } = data;

    const builder = new ZPLBuilder({ labelSize: '4x6' });
    const size = LABEL_SIZES['4x6'];

    builder
        .start()
        .comment('Shipping Label')
        .setPrintWidth()
        .setLabelLength();

    // From section
    let y = 30;
    builder.text(30, y, 'FROM:', { height: 20, width: 20 });
    y += 30;
    builder.text(30, y, fromName, { height: 24, width: 24 });
    y += 35;
    builder.text(30, y, fromAddress, { height: 20, width: 20 });
    y += 30;
    builder.text(30, y, fromCity, { height: 20, width: 20 });

    // Separator
    y += 50;
    builder.horizontalLine(20, y, size.width - 40, 3);
    y += 20;

    // To section (larger)
    builder.text(30, y, 'TO:', { height: 25, width: 25 });
    y += 40;
    builder.text(30, y, toName, { height: 40, width: 40, bold: true });
    y += 55;
    builder.text(30, y, toAddress, { height: 30, width: 30 });
    y += 45;
    builder.text(30, y, toCity, { height: 30, width: 30 });

    // Barcode section
    if (trackingNumber) {
        y += 80;
        builder.barcode128(Math.round((size.width - 300) / 2), y, trackingNumber, {
            height: 80,
            moduleWidth: 2,
        });
    }

    builder.end();
    
    return builder.build();
};

// Export default builder
export default ZPLBuilder;

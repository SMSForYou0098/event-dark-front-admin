/**
 * Advanced Label Command Generators
 * 
 * Converts Canva-style visual layout to printer commands:
 * - TSPL (TSC/Godex printers)
 * - ZPL (Zebra printers)
 * - CPCL (Citizen/Intermec printers)
 * 
 * Coordinate System Notes:
 * - UI Preview: scale 4 (1mm = 4 pixels), positions in % with CSS center transform
 * - Printer: 203 DPI (1mm = 8 dots), positions are top-left corner
 * 
 * Conversion: UI pixel size * 2 = printer dots
 * 
 * Supports:
 * - Custom positions (x, y) for each field
 * - Individual font sizes per field
 * - Font weights (bold)
 * - Font families
 * - QR code with custom size
 */

// Constants
const UI_SCALE = 4;        // UI preview: 1mm = 4 pixels
const PRINTER_DPI = 8;      // Printer: 1mm = 8 dots (203 DPI)
const PIXEL_TO_DOT = PRINTER_DPI / UI_SCALE; // = 2

// Font family mappings for TSPL
const TSPL_FONTS = {
    'Arial, sans-serif': '0',
    'Courier New, monospace': '1',
    'Times New Roman, serif': '2',
    'Impact, sans-serif': '3',
    'Verdana, sans-serif': '4',
    // Default mapping
    'default': '0',
};

// Font family mappings for ZPL
const ZPL_FONTS = {
    'Arial, sans-serif': '0',      // Scalable font 0 (most compatible)
    'Courier New, monospace': '0', // Use 0 for all (most printers)
    'Times New Roman, serif': '0', 
    'Impact, sans-serif': '0',     
    'Verdana, sans-serif': '0',
    'default': '0',
};

/**
 * Convert percentage position to dots based on label size
 * @param {number} percent - Position as percentage (0-100)
 * @param {number} totalDots - Total dots in that dimension
 * @returns {number} Position in dots
 */
const percentToDots = (percent, totalDots) => {
    return Math.round((percent / 100) * totalDots);
};

/**
 * Convert UI pixel size to printer dots
 * UI uses scale 4 (4 pixels per mm), printer uses 8 dots per mm
 * @param {number} pixels - Size in UI pixels
 * @returns {number} Size in printer dots
 */
const pixelsToDots = (pixels) => {
    return Math.round(pixels * PIXEL_TO_DOT);
};

/**
 * Estimate text width in dots based on text length and font height
 * Used to center text horizontally
 * @param {string} text - The text content
 * @param {number} fontHeight - Font height in dots
 * @returns {number} Estimated width in dots
 */
const estimateTextWidth = (text, fontHeight) => {
    // Average character width is about 0.6 * font height for most fonts
    const charWidth = fontHeight * 0.55;
    return Math.round(text.length * charWidth);
};

/**
 * Convert pixel font size to TSPL scale factor
 * TSPL uses scale factors 1-8 for built-in fonts
 * Font sizes: 1=16pt, 2=24pt, 3=32pt, etc.
 * @param {number} pixelSize - Font size in UI pixels
 * @returns {number} Scale factor (1-8)
 */
const pixelToTSPLScale = (pixelSize) => {
    // UI pixels to dots: * 2
    // TSPL scale 1 = ~24 dots height, scale 2 = ~48 dots, etc.
    const dots = pixelsToDots(pixelSize);
    const scale = Math.round(dots / 20);
    return Math.max(1, Math.min(8, scale));
};

/**
 * Convert pixel font size to ZPL font height in dots
 * @param {number} pixelSize - Font size in UI pixels
 * @returns {number} Font height in dots
 */
const pixelToZPLSize = (pixelSize) => {
    // Direct conversion: UI pixels * 2 = dots
    const dots = pixelsToDots(pixelSize);
    return Math.max(16, dots);
};

/**
 * Convert font weight to bold flag
 * @param {number} weight - Font weight (100-900)
 * @returns {boolean} Whether to apply bold effect
 */
const isBold = (weight) => weight >= 600;

/**
 * Convert pixel QR size to TSPL cell size
 * TSPL QRCODE: cell size 1-10
 * @param {number} pixelSize - QR size in UI pixels
 * @returns {number} Cell size (1-10)
 */
const pixelToTSPLQRSize = (pixelSize) => {
    // Approximate: 60px = 6 cells
    const size = Math.round(pixelSize / 10);
    return Math.max(1, Math.min(10, size));
};

/**
 * Convert pixel QR size to ZPL magnification
 * ZPL BQ command: magnification 1-10
 * @param {number} pixelSize - QR size in pixels
 * @returns {number} Magnification (1-10)
 */
const pixelToZPLQRMagnification = (pixelSize) => {
    const mag = Math.round(pixelSize / 12);
    return Math.max(1, Math.min(10, mag));
};

/**
 * Generate TSPL Code with custom positions and styling
 * 
 * TSPL TEXT Command: TEXT x,y,"font",rotation,x-mul,y-mul,"content"
 * TSPL QRCODE Command: QRCODE x,y,ECC,cell,mode,rotation,M2,S7,"data"
 * 
 * @param {Object} options - Generation options
 * @param {Object} options.data - Label data (name, surname, company_name, etc.)
 * @param {Array} options.selectedFields - Selected field keys
 * @param {Object} options.labelDimensions - { width, height } in mm
 * @param {Object} options.fieldPositions - { fieldKey: { x, y } } in percentages
 * @param {Object} options.fieldSizes - { fieldKey: size } in pixels
 * @param {Object} options.fieldWeights - { fieldKey: weight } (100-900)
 * @param {Object} options.fieldItalic - { fieldKey: boolean }
 * @param {number} options.qrSize - QR code size in pixels
 * @param {string} options.fontFamily - CSS font family string
 * @returns {Uint8Array} TSPL commands as bytes
 */
export const generateAdvancedTSPL = ({
    data,
    selectedFields = [],
    labelDimensions = { width: 50.8, height: 50.8 },
    fieldPositions = {},
    fieldSizes = {},
    fieldWeights = {},
    fieldItalic = {},
    qrSize = 60,
    fontFamily = 'Arial, sans-serif',
}) => {
    const lines = [];
    
    // Convert mm to dots (203 DPI: 1mm = 8 dots)
    const DPI_FACTOR = 8;
    const labelWidthDots = Math.round(labelDimensions.width * DPI_FACTOR);
    const labelHeightDots = Math.round(labelDimensions.height * DPI_FACTOR);
    
    // Get TSPL font code
    const tsplFont = TSPL_FONTS[fontFamily] || TSPL_FONTS['default'];
    
    // Header commands
    lines.push(`SIZE ${labelDimensions.width} mm,${labelDimensions.height} mm`);
    lines.push('GAP 2 mm,0 mm');
    lines.push('DIRECTION 1');
    lines.push('CLS');
    
    // Process each selected field
    selectedFields.forEach(fieldKey => {
        // Skip qrcode (handled separately) and surname (combined with name)
        if (fieldKey === 'qrcode') return;
        if (fieldKey === 'surname') return; // Surname is combined with name in UI
        
        // Get field value based on key
        let value = '';
        if (fieldKey === 'name') {
            // Combine name and surname
            value = [data.name, data.surname].filter(Boolean).join(' ');
        } else {
            value = data[fieldKey] || '';
        }
        
        // Skip if no value
        if (!value || value.trim() === '') {
            return;
        }
        
        // Get position from fieldPositions (UI uses center point)
        // Default positions based on typical layout
        const defaultPositions = {
            name: { x: 50, y: 15 },
            company_name: { x: 50, y: 35 },
            designation: { x: 50, y: 50 },
            number: { x: 50, y: 62 },
            stall_number: { x: 50, y: 75 },
        };
        const pos = fieldPositions[fieldKey] || defaultPositions[fieldKey] || { x: 50, y: 50 };
        
        // Get font size in UI pixels and convert to TSPL scale
        const pixelSize = fieldSizes[fieldKey] || 14;
        const baseScale = pixelToTSPLScale(pixelSize);
        
        // Apply bold by increasing horizontal scale
        const weight = fieldWeights[fieldKey] || 400;
        const boldMultiplier = isBold(weight) ? 1.3 : 1;
        const scaleX = Math.max(1, Math.min(8, Math.round(baseScale * boldMultiplier)));
        const scaleY = Math.max(1, Math.min(8, baseScale));
        
        // TSPL font base height is ~24 dots per scale unit
        const fontHeight = 24 * scaleY;
        const fontWidth = 12 * scaleX; // Average character width
        
        // Calculate center position in dots
        const centerX = percentToDots(pos.x, labelWidthDots);
        const centerY = percentToDots(pos.y, labelHeightDots);
        
        // Estimate text dimensions for centering
        const textWidth = value.length * fontWidth;
        const textHeight = fontHeight;
        
        // Adjust position: UI shows center, TSPL needs top-left
        // Subtract half width and half height to get top-left corner
        const x = Math.max(0, Math.round(centerX - textWidth / 2));
        const y = Math.max(0, Math.round(centerY - textHeight / 2));
        
        // TEXT x,y,"font",rotation,x-mul,y-mul,"content"
        lines.push(`TEXT ${x},${y},"${tsplFont}",0,${scaleX},${scaleY},"${value}"`);
    });
    
    // Handle QR code if selected
    if (selectedFields.includes('qrcode')) {
        const qrData = data.qrcode || data.token || '';
        if (qrData) {
            const defaultQRPos = { x: 50, y: 85 };
            const pos = fieldPositions['qrcode'] || defaultQRPos;
            const cellSize = pixelToTSPLQRSize(qrSize);
            
            // Calculate center position
            const centerX = percentToDots(pos.x, labelWidthDots);
            const centerY = percentToDots(pos.y, labelHeightDots);
            
            // QR code dimensions: cellSize * modules (approx 25 for typical QR)
            const qrDots = cellSize * 25;
            const x = Math.max(0, Math.round(centerX - qrDots / 2));
            const y = Math.max(0, Math.round(centerY - qrDots / 2));
            
            // QRCODE x,y,ECC,cell,mode,rotation,M2,S7,"data"
            lines.push(`QRCODE ${x},${y},L,${cellSize},A,0,M2,S7,"${qrData}"`);
        }
    }
    
    // Print command
    lines.push('PRINT 1,1');
    
    // Convert to bytes
    const tsplString = lines.join('\r\n');
    return new TextEncoder().encode(tsplString);
};

/**
 * Generate ZPL Code with custom positions and styling
 * 
 * ZPL Format:
 * ^XA - Start format
 * ^FO x,y - Field Origin
 * ^A font,height,width - Scalable font selection
 * ^FB width,lines,line-spacing,justification - Field Block for centering
 * ^FD data ^FS - Field data
 * ^BQ N,2,mag - QR code (N=normal, 2=model2, mag=magnification)
 * ^XZ - End format
 * 
 * @param {Object} options - Same as generateAdvancedTSPL
 * @returns {Uint8Array} ZPL commands as bytes
 */
export const generateAdvancedZPL = ({
    data,
    selectedFields = [],
    labelDimensions = { width: 50.8, height: 50.8 },
    fieldPositions = {},
    fieldSizes = {},
    fieldWeights = {},
    fieldItalic = {},
    qrSize = 60,
    fontFamily = 'Arial, sans-serif',
}) => {
    const lines = [];
    
    // Convert mm to dots (203 DPI: 1mm = 8 dots)
    const labelWidthDots = Math.round(labelDimensions.width * PRINTER_DPI);
    const labelHeightDots = Math.round(labelDimensions.height * PRINTER_DPI);
    
    // Get ZPL font (0 is most compatible scalable font)
    const zplFont = ZPL_FONTS[fontFamily] || ZPL_FONTS['default'];
    
    // Start format
    lines.push('^XA');
    lines.push(`^PW${labelWidthDots}`);  // Print width
    lines.push('^MMT');                   // Print mode (tear-off)
    lines.push('^PON');                   // Print orientation normal
    lines.push('^LH0,0');                 // Label home
    
    // Process each selected field
    selectedFields.forEach(fieldKey => {
        // Skip qrcode (handled separately) and surname (combined with name)
        if (fieldKey === 'qrcode') return;
        if (fieldKey === 'surname') return;
        
        // Get field value
        let value = '';
        if (fieldKey === 'name') {
            value = [data.name, data.surname].filter(Boolean).join(' ');
        } else {
            value = data[fieldKey] || '';
        }
        
        if (!value || value.trim() === '') return;
        
        // Get position with defaults
        const defaultPositions = {
            name: { x: 50, y: 15 },
            company_name: { x: 50, y: 35 },
            designation: { x: 50, y: 50 },
            number: { x: 50, y: 62 },
            stall_number: { x: 50, y: 75 },
        };
        const pos = fieldPositions[fieldKey] || defaultPositions[fieldKey] || { x: 50, y: 50 };
        
        // Get font size and convert to ZPL height
        const pixelSize = fieldSizes[fieldKey] || 14;
        const fontHeight = pixelToZPLSize(pixelSize);
        
        // Apply bold: ZPL uses font width adjustment for bold effect
        const weight = fieldWeights[fieldKey] || 400;
        const fontWidth = isBold(weight) ? Math.round(fontHeight * 1.1) : fontHeight;
        
        // Calculate center position
        const centerX = percentToDots(pos.x, labelWidthDots);
        const centerY = percentToDots(pos.y, labelHeightDots);
        
        // Estimate text width for centering (avg char width ~0.5 * height)
        const charWidth = fontHeight * 0.5;
        const textWidth = value.length * charWidth;
        
        // Adjust position for centering (ZPL uses top-left origin)
        const x = Math.max(0, Math.round(centerX - textWidth / 2));
        const y = Math.max(0, Math.round(centerY - fontHeight / 2));
        
        // Font style (ZPL ^A0 uses N for normal, no bold/italic on font 0)
        // For boldness, we already adjusted font width
        
        // ^FO x,y ^A0N,height,width ^FD data ^FS
        lines.push(`^FO${x},${y}^A${zplFont}N,${fontHeight},${fontWidth}^FD${value}^FS`);
    });
    
    // Handle QR code if selected
    if (selectedFields.includes('qrcode')) {
        const qrData = data.qrcode || data.token || '';
        if (qrData) {
            const defaultQRPos = { x: 50, y: 85 };
            const pos = fieldPositions['qrcode'] || defaultQRPos;
            const mag = pixelToZPLQRMagnification(qrSize);
            
            // Calculate center position
            const centerX = percentToDots(pos.x, labelWidthDots);
            const centerY = percentToDots(pos.y, labelHeightDots);
            
            // QR code size in dots (mag * ~21 modules)
            const qrDots = mag * 21;
            const x = Math.max(0, Math.round(centerX - qrDots / 2));
            const y = Math.max(0, Math.round(centerY - qrDots / 2));
            
            // ^FO x,y ^BQ N,2,magnification ^FD LA,data ^FS
            lines.push(`^FO${x},${y}^BQN,2,${mag}^FDLA,${qrData}^FS`);
        }
    }
    
    // End format
    lines.push('^XZ');
    
    // Convert to bytes
    const zplString = lines.join('\n');
    return new TextEncoder().encode(zplString);
};

/**
 * Generate CPCL Code with custom positions and styling
 * 
 * CPCL Format:
 * ! offset 200 200 height qty
 * TEXT font size x y data
 * BARCODE QR x y M 2 U size data
 * PRINT
 * 
 * @param {Object} options - Same as generateAdvancedTSPL
 * @returns {Uint8Array} CPCL commands as bytes
 */
export const generateAdvancedCPCL = ({
    data,
    selectedFields = [],
    labelDimensions = { width: 50.8, height: 50.8 },
    fieldPositions = {},
    fieldSizes = {},
    fieldWeights = {},
    fieldItalic = {},
    qrSize = 60,
    fontFamily = 'Arial, sans-serif',
}) => {
    const lines = [];
    
    // Convert mm to dots (203 DPI: 1mm = 8 dots)
    const labelWidthDots = Math.round(labelDimensions.width * PRINTER_DPI);
    const labelHeightDots = Math.round(labelDimensions.height * PRINTER_DPI);
    
    // CPCL header: ! offset xres yres height qty
    lines.push(`! 0 200 200 ${labelHeightDots} 1`);
    
    // Process each selected field
    selectedFields.forEach(fieldKey => {
        // Skip qrcode (handled separately) and surname (combined with name)
        if (fieldKey === 'qrcode') return;
        if (fieldKey === 'surname') return;
        
        // Get field value
        let value = '';
        if (fieldKey === 'name') {
            value = [data.name, data.surname].filter(Boolean).join(' ');
        } else {
            value = data[fieldKey] || '';
        }
        
        if (!value || value.trim() === '') return;
        
        // Get position with defaults
        const defaultPositions = {
            name: { x: 50, y: 15 },
            company_name: { x: 50, y: 35 },
            designation: { x: 50, y: 50 },
            number: { x: 50, y: 62 },
            stall_number: { x: 50, y: 75 },
        };
        const pos = fieldPositions[fieldKey] || defaultPositions[fieldKey] || { x: 50, y: 50 };
        
        // Get font size - CPCL uses font 0-7 with size multiplier
        const pixelSize = fieldSizes[fieldKey] || 14;
        const cpclFont = Math.min(7, Math.max(0, Math.round(pixelSize / 8)));
        const size = Math.max(1, Math.round(pixelsToDots(pixelSize) / 8));
        
        // Font height in dots
        const fontHeight = 16 * size;
        const charWidth = fontHeight * 0.5;
        
        // Calculate center position
        const centerX = percentToDots(pos.x, labelWidthDots);
        const centerY = percentToDots(pos.y, labelHeightDots);
        
        // Estimate text dimensions for centering
        const textWidth = value.length * charWidth;
        
        // Adjust position for centering
        const x = Math.max(0, Math.round(centerX - textWidth / 2));
        const y = Math.max(0, Math.round(centerY - fontHeight / 2));
        
        // Bold in CPCL: use SETBOLD
        const weight = fieldWeights[fieldKey] || 400;
        if (isBold(weight)) {
            lines.push('SETBOLD 1');
        } else {
            lines.push('SETBOLD 0');
        }
        
        // TEXT font size x y data
        lines.push(`TEXT ${cpclFont} ${size} ${x} ${y} ${value}`);
    });
    
    // Handle QR code if selected
    if (selectedFields.includes('qrcode')) {
        const qrData = data.qrcode || data.token || '';
        if (qrData) {
            const defaultQRPos = { x: 50, y: 85 };
            const pos = fieldPositions['qrcode'] || defaultQRPos;
            const unitWidth = Math.max(1, Math.round(qrSize / 20));
            
            // Calculate center position
            const centerX = percentToDots(pos.x, labelWidthDots);
            const centerY = percentToDots(pos.y, labelHeightDots);
            
            // QR size in dots
            const qrDots = unitWidth * 25;
            const x = Math.max(0, Math.round(centerX - qrDots / 2));
            const y = Math.max(0, Math.round(centerY - qrDots / 2));
            
            // BARCODE QR x y M 2 U unitWidth data
            lines.push(`BARCODE QR ${x} ${y} M 2 U ${unitWidth}`);
            lines.push(`${qrData}`);
            lines.push('ENDQR');
        }
    }
    
    // Print command
    lines.push('PRINT');
    
    // Convert to bytes
    const cpclString = lines.join('\r\n');
    console.log('[CPCL Generator] Generated commands:\n', cpclString);
    return new TextEncoder().encode(cpclString);
};

/**
 * Master function to generate printer commands based on type
 * 
 * @param {string} printerType - 'tspl', 'zpl', or 'cpcl'
 * @param {Object} options - Generation options (same as individual functions)
 * @returns {Uint8Array} Printer commands as bytes
 */
export const generateLabelCommands = (printerType, options) => {
    switch (printerType.toLowerCase()) {
        case 'zpl':
            return generateAdvancedZPL(options);
        case 'cpcl':
            return generateAdvancedCPCL(options);
        case 'tspl':
        default:
            return generateAdvancedTSPL(options);
    }
};

/**
 * Generate human-readable preview of the commands
 * Useful for debugging
 * 
 * @param {string} printerType - 'tspl', 'zpl', or 'cpcl'
 * @param {Object} options - Generation options
 * @returns {string} Human-readable command preview
 */
export const generateCommandPreview = (printerType, options) => {
    const bytes = generateLabelCommands(printerType, options);
    return new TextDecoder().decode(bytes);
};

// Export font constants for use in UI
export const FONT_FAMILIES = [
    { value: 'Arial, sans-serif', label: 'Arial (Sans)', tspl: '0', zpl: 'A' },
    { value: 'Courier New, monospace', label: 'Courier (Mono)', tspl: '1', zpl: 'D' },
    { value: 'Times New Roman, serif', label: 'Times (Serif)', tspl: '2', zpl: 'A' },
    { value: 'Impact, sans-serif', label: 'Impact', tspl: '3', zpl: 'B' },
    { value: 'Verdana, sans-serif', label: 'Verdana', tspl: '4', zpl: 'A' },
];

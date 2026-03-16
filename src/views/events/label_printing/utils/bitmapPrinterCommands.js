/**
 * Bitmap Printer Commands
 * 
 * Converts HTML canvas/DOM elements to thermal printer bitmap format.
 * Supports TSPL, ZPL, and CPCL printer languages.
 * 
 * This enables WYSIWYG printing - what you see in the preview is exactly what prints.
 */

import html2canvas from 'html2canvas';

// Printer DPI constant (203 DPI is standard for thermal printers)
const PRINTER_DPI = 203;
const MM_TO_INCH = 25.4;

/**
 * Capture a DOM element as an HTML5 Canvas
 * @param {HTMLElement} element - The DOM element to capture
 * @param {Object} options - Capture options
 * @returns {Promise<HTMLCanvasElement>} The captured canvas
 */
export const captureElementAsCanvas = async (element, options = {}) => {
    const {
        scale = 2, // Higher scale for better print quality
        backgroundColor = '#ffffff',
        width = null,
        height = null,
        ignoreClass = 'no-print', // Class to ignore during capture
    } = options;

    const canvas = await html2canvas(element, {
        backgroundColor,
        scale,
        width: width || element.offsetWidth,
        height: height || element.offsetHeight,
        useCORS: true, // Allow cross-origin images (like QR codes)
        allowTaint: true,
        logging: false,
        ignoreElements: (el) => {
            // Ignore elements with the no-print class
            return el.classList && el.classList.contains(ignoreClass);
        },
    });

    return canvas;
};

/**
 * Create a clean label canvas from provided data (no UI controls)
 * This renders the label fields directly to canvas for clean printing
 * 
 * @param {Object} config - Label configuration
 * @returns {Promise<HTMLCanvasElement>} Clean canvas for printing
 */
export const createCleanLabelCanvas = async (config) => {
    const {
        labelDimensions,
        selectedFields,
        labelData,
        fieldPositions,
        fieldSizes,
        fieldWeights,
        fieldItalic,
        qrSize,
        fontFamily,
        fontSizeMultiplier = 1,
        scale = 2,
    } = config;

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.visibility = 'visible'; // Must be visible for html2canvas
    document.body.appendChild(container);

    // Calculate dimensions
    const displayScale = 4; // Match preview scale
    const width = labelDimensions.width * displayScale;
    const height = labelDimensions.height * displayScale;

    // Create the label element
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background-color: #ffffff;
        position: relative;
        font-family: ${fontFamily || 'Arial, sans-serif'};
        overflow: hidden;
    `;

    // Helper to create a positioned field
    const createField = (fieldKey, content, styles = {}) => {
        const pos = fieldPositions[fieldKey] || { x: 50, y: 50 };
        const field = document.createElement('div');
        field.style.cssText = `
            position: absolute;
            left: ${pos.x}%;
            top: ${pos.y}%;
            transform: translate(-50%, -50%);
            text-align: center;
            white-space: nowrap;
            ${Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join(';')}
        `;
        field.textContent = content;
        return field;
    };

    // Render each selected field
    if (selectedFields.includes('name') || selectedFields.includes('surname')) {
        const name = [labelData.name, labelData.surname].filter(Boolean).join(' ');
        if (name) {
            const field = createField('name', name, {
                'font-size': `${(fieldSizes.name || 18) * fontSizeMultiplier}px`,
                'font-weight': fieldWeights.name || 400,
                'font-style': fieldItalic.name ? 'italic' : 'normal',
                'color': '#000000',
            });
            labelEl.appendChild(field);
        }
    }

    if (selectedFields.includes('company_name') && labelData.company_name) {
        const field = createField('company_name', labelData.company_name, {
            'font-size': `${(fieldSizes.company_name || 14) * fontSizeMultiplier}px`,
            'font-weight': fieldWeights.company_name || 400,
            'font-style': fieldItalic.company_name ? 'italic' : 'normal',
            'color': '#333333',
        });
        labelEl.appendChild(field);
    }

    if (selectedFields.includes('designation') && labelData.designation) {
        const field = createField('designation', labelData.designation, {
            'font-size': `${(fieldSizes.designation || 12) * fontSizeMultiplier}px`,
            'font-weight': fieldWeights.designation || 400,
            'font-style': fieldItalic.designation ? 'italic' : 'normal',
            'color': '#666666',
        });
        labelEl.appendChild(field);
    }

    if (selectedFields.includes('number') && labelData.number) {
        const field = createField('number', `📞 ${labelData.number}`, {
            'font-size': `${(fieldSizes.number || 11) * fontSizeMultiplier}px`,
            'font-weight': fieldWeights.number || 400,
            'font-style': fieldItalic.number ? 'italic' : 'normal',
            'color': '#666666',
        });
        labelEl.appendChild(field);
    }

    if (selectedFields.includes('stall_number') && labelData.stall_number) {
        const pos = fieldPositions.stall_number || { x: 50, y: 75 };
        const field = document.createElement('div');
        field.style.cssText = `
            position: absolute;
            left: ${pos.x}%;
            top: ${pos.y}%;
            transform: translate(-50%, -50%);
            text-align: center;
            white-space: nowrap;
            font-size: ${(fieldSizes.stall_number || 12) * fontSizeMultiplier}px;
            font-weight: ${fieldWeights.stall_number || 400};
            font-style: ${fieldItalic.stall_number ? 'italic' : 'normal'};
            color: #000000;
            background-color: #f0f0f0;
            padding: 4px 8px;
            border-radius: 4px;
        `;
        field.textContent = `Stall: ${labelData.stall_number}`;
        labelEl.appendChild(field);
    }

    if (selectedFields.includes('qrcode') && labelData.qrcode) {
        const pos = fieldPositions.qrcode || { x: 50, y: 88 };
        const qrContainer = document.createElement('div');
        qrContainer.style.cssText = `
            position: absolute;
            left: ${pos.x}%;
            top: ${pos.y}%;
            transform: translate(-50%, -50%);
        `;

        const qrImg = document.createElement('img');
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 2}x${qrSize * 2}&margin=0&data=${encodeURIComponent(labelData.qrcode)}`;
        qrImg.style.width = `${qrSize}px`;
        qrImg.style.height = `${qrSize}px`;
        qrImg.style.display = 'block';

        // Wait for QR image to load
        await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
            // Timeout after 5 seconds
            setTimeout(resolve, 5000);
        });

        qrContainer.appendChild(qrImg);
        labelEl.appendChild(qrContainer);
    }

    container.appendChild(labelEl);

    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture to canvas
    const canvas = await html2canvas(labelEl, {
        backgroundColor: '#ffffff',
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
    });

    // Cleanup
    document.body.removeChild(container);

    return canvas;
};

/**
 * Convert canvas to monochrome (1-bit) bitmap data
 * Thermal printers only support black/white, so we threshold the image
 * 
 * @param {HTMLCanvasElement} canvas - The canvas to convert
 * @param {number} threshold - Brightness threshold (0-255), pixels darker than this become black
 * @returns {Object} { width, height, data } where data is Uint8Array of packed bits
 */
export const canvasToMonochrome = (canvas, threshold = 128) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const width = canvas.width;
    const height = canvas.height;

    // Each byte contains 8 pixels (1 bit per pixel)
    // Width must be padded to byte boundary
    const bytesPerRow = Math.ceil(width / 8);
    const bitmapData = new Uint8Array(bytesPerRow * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4;

            // Get RGB values
            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];

            // Calculate grayscale using luminance formula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Determine if pixel is black (1) or white (0)
            // Note: In thermal printing, 1 = black (print), 0 = white (no print)
            const isBlack = gray < threshold ? 1 : 0;

            // Pack into bytes (MSB first)
            const byteIndex = y * bytesPerRow + Math.floor(x / 8);
            const bitPosition = 7 - (x % 8); // MSB first

            if (isBlack) {
                bitmapData[byteIndex] |= (1 << bitPosition);
            }
        }
    }

    return {
        width,
        height,
        bytesPerRow,
        data: bitmapData,
    };
};

/**
 * Generate TSPL BITMAP command
 * 
 * TSPL Command: BITMAP x,y,width_bytes,height,mode,bitmap_data
 * Mode 0 = OR, Mode 1 = XOR, Mode 2 = Overwrite
 * 
 * @param {Object} bitmapInfo - Output from canvasToMonochrome
 * @param {number} x - X position in dots
 * @param {number} y - Y position in dots
 * @returns {Uint8Array} TSPL commands as bytes
 */
export const generateTSPLBitmap = (bitmapInfo, x = 0, y = 0) => {
    const { width, height, bytesPerRow, data } = bitmapInfo;

    // Calculate label size in mm (assuming the canvas represents the full label)
    // At 203 DPI: dots / (203 / 25.4) = mm
    const widthMm = Math.round((width / PRINTER_DPI) * MM_TO_INCH);
    const heightMm = Math.round((height / PRINTER_DPI) * MM_TO_INCH);

    // Build command string
    const commands = [];
    commands.push(`SIZE ${widthMm} mm,${heightMm} mm`);
    commands.push('GAP 2 mm,0 mm');
    commands.push('DIRECTION 1');
    commands.push('CLS');
    commands.push(`BITMAP ${x},${y},${bytesPerRow},${height},0,`);

    // Convert command header to bytes
    const headerString = commands.join('\r\n');
    const headerBytes = new TextEncoder().encode(headerString);

    // Append bitmap data directly (binary)
    const footerBytes = new TextEncoder().encode('\r\nPRINT 1,1\r\n');

    // Combine all parts
    const totalLength = headerBytes.length + data.length + footerBytes.length;
    const result = new Uint8Array(totalLength);
    result.set(headerBytes, 0);
    result.set(data, headerBytes.length);
    result.set(footerBytes, headerBytes.length + data.length);

    return result;
};

/**
 * Generate ZPL ^GFA (Graphic Field ASCII) command
 * 
 * ZPL uses ASCII hex encoding for bitmap data
 * Command: ^GFA,total_bytes,total_bytes,bytes_per_row,data
 * 
 * @param {Object} bitmapInfo - Output from canvasToMonochrome
 * @param {number} x - X position in dots
 * @param {number} y - Y position in dots
 * @param {Object} labelDimensions - { width, height } in mm
 * @returns {Uint8Array} ZPL commands as bytes
 */
export const generateZPLBitmap = (bitmapInfo, x = 0, y = 0, labelDimensions = { width: 50, height: 50 }) => {
    const { height, bytesPerRow, data } = bitmapInfo;

    const totalBytes = data.length;

    // Convert bitmap data to hex string
    const hexData = Array.from(data)
        .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
        .join('');

    // Calculate label width in dots
    const labelWidthDots = Math.round((labelDimensions.width / MM_TO_INCH) * PRINTER_DPI);

    // Build ZPL commands
    const commands = [];
    commands.push('^XA');
    commands.push(`^PW${labelWidthDots}`);
    commands.push('^MMT');
    commands.push('^PON');
    commands.push('^LH0,0');
    commands.push(`^FO${x},${y}`);
    commands.push(`^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}`);
    commands.push('^FS');
    commands.push('^XZ');

    const zplString = commands.join('\n');
    return new TextEncoder().encode(zplString);
};

/**
 * Generate CPCL EG (Expanded Graphics) command
 * 
 * CPCL uses: EG width_bytes height x y data
 * 
 * @param {Object} bitmapInfo - Output from canvasToMonochrome
 * @param {number} x - X position in dots
 * @param {number} y - Y position in dots
 * @param {Object} labelDimensions - { width, height } in mm
 * @returns {Uint8Array} CPCL commands as bytes
 */
export const generateCPCLBitmap = (bitmapInfo, x = 0, y = 0, labelDimensions = { width: 50, height: 50 }) => {
    const { height, bytesPerRow, data } = bitmapInfo;

    // Calculate label height in dots
    const labelHeightDots = Math.round((labelDimensions.height / MM_TO_INCH) * PRINTER_DPI);

    // Convert bitmap data to hex string
    const hexData = Array.from(data)
        .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
        .join('');

    // Build CPCL commands
    const commands = [];
    commands.push(`! 0 200 200 ${labelHeightDots} 1`);
    commands.push(`EG ${bytesPerRow} ${height} ${x} ${y} ${hexData}`);
    commands.push('PRINT');

    const cpclString = commands.join('\r\n');
    return new TextEncoder().encode(cpclString);
};

/**
 * Master function: Capture element and generate printer commands
 * 
 * @param {HTMLElement} element - The DOM element to print
 * @param {string} printerType - 'tspl', 'zpl', or 'cpcl'
 * @param {Object} options - Additional options
 * @returns {Promise<Uint8Array>} Printer commands as bytes
 */
export const generateBitmapPrintCommands = async (element, printerType, options = {}) => {
    const {
        x = 0,
        y = 0,
        scale = 2,
        threshold = 128,
        labelDimensions = { width: 50, height: 50 },
    } = options;

    // Step 1: Capture the element as canvas
    const canvas = await captureElementAsCanvas(element, { scale });

    // Step 2: Convert to monochrome bitmap
    const bitmapInfo = canvasToMonochrome(canvas, threshold);

    // Step 3: Generate printer-specific commands
    switch (printerType.toLowerCase()) {
        case 'zpl':
            return generateZPLBitmap(bitmapInfo, x, y, labelDimensions);
        case 'cpcl':
            return generateCPCLBitmap(bitmapInfo, x, y, labelDimensions);
        case 'tspl':
        default:
            return generateTSPLBitmap(bitmapInfo, x, y);
    }
};

/**
 * Generate CLEAN bitmap print commands - renders only the label fields, no UI controls
 * This is the preferred method for WYSIWYG printing
 * 
 * @param {Object} config - Label configuration with all field data and positions
 * @param {string} printerType - 'tspl', 'zpl', or 'cpcl'
 * @param {Object} options - Additional options (threshold, x, y)
 * @returns {Promise<Uint8Array>} Printer commands as bytes
 */
export const generateCleanBitmapPrintCommands = async (config, printerType, options = {}) => {
    const {
        x = 0,
        y = 0,
        threshold = 128,
    } = options;

    const labelDimensions = config.labelDimensions || { width: 50, height: 50 };

    // Step 1: Create a clean canvas with only the label fields (no UI controls)
    const canvas = await createCleanLabelCanvas(config);

    // Step 2: Convert to monochrome bitmap
    const bitmapInfo = canvasToMonochrome(canvas, threshold);

    // Step 3: Generate printer-specific commands
    switch (printerType.toLowerCase()) {
        case 'zpl':
            return generateZPLBitmap(bitmapInfo, x, y, labelDimensions);
        case 'cpcl':
            return generateCPCLBitmap(bitmapInfo, x, y, labelDimensions);
        case 'tspl':
        default:
            return generateTSPLBitmap(bitmapInfo, x, y);
    }
};

/**
 * Debug: Get canvas as data URL for preview
 * @param {HTMLElement} element - The DOM element to capture
 * @returns {Promise<string>} Base64 data URL of the captured image
 */
export const captureElementAsDataURL = async (element, options = {}) => {
    const canvas = await captureElementAsCanvas(element, options);
    return canvas.toDataURL('image/png');
};

/**
 * Debug: Get monochrome preview as data URL
 * @param {HTMLElement} element - The DOM element to capture
 * @param {number} threshold - Brightness threshold
 * @returns {Promise<string>} Base64 data URL of the monochrome image
 */
export const captureMonochromeAsDataURL = async (element, threshold = 128, options = {}) => {
    const canvas = await captureElementAsCanvas(element, options);
    const bitmapInfo = canvasToMonochrome(canvas, threshold);

    // Create a new canvas to visualize the monochrome result
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = bitmapInfo.width;
    previewCanvas.height = bitmapInfo.height;
    const ctx = previewCanvas.getContext('2d');

    // Draw the monochrome bitmap
    const imageData = ctx.createImageData(bitmapInfo.width, bitmapInfo.height);
    for (let y = 0; y < bitmapInfo.height; y++) {
        for (let x = 0; x < bitmapInfo.width; x++) {
            const byteIndex = y * bitmapInfo.bytesPerRow + Math.floor(x / 8);
            const bitPosition = 7 - (x % 8);
            const isBlack = (bitmapInfo.data[byteIndex] >> bitPosition) & 1;

            const pixelIndex = (y * bitmapInfo.width + x) * 4;
            const color = isBlack ? 0 : 255;
            imageData.data[pixelIndex] = color;     // R
            imageData.data[pixelIndex + 1] = color; // G
            imageData.data[pixelIndex + 2] = color; // B
            imageData.data[pixelIndex + 3] = 255;   // A
        }
    }
    ctx.putImageData(imageData, 0, 0);

    return previewCanvas.toDataURL('image/png');
};

/**
 * Debug: Get clean label as data URL for preview
 * @param {Object} config - Label configuration
 * @returns {Promise<string>} Base64 data URL of the clean label image
 */
export const captureCleanLabelAsDataURL = async (config) => {
    const canvas = await createCleanLabelCanvas(config);
    return canvas.toDataURL('image/png');
};

export default {
    captureElementAsCanvas,
    createCleanLabelCanvas,
    canvasToMonochrome,
    generateTSPLBitmap,
    generateZPLBitmap,
    generateCPCLBitmap,
    generateBitmapPrintCommands,
    generateCleanBitmapPrintCommands,
    captureElementAsDataURL,
    captureMonochromeAsDataURL,
    captureCleanLabelAsDataURL,
};


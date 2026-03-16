/**
 * Bitmap Printer Utility
 * Converts HTML canvas to thermal printer bitmap commands
 * Supports TSPL and ZPL formats
 */

import html2canvas from 'html2canvas';

// Printer DPI for dot conversion
const PRINTER_DPI = 203; // dots per inch (standard thermal printer)

/**
 * Convert an HTML element to bitmap data
 * @param {HTMLElement} element - The element to capture
 * @param {Object} options - Options for capture
 * @returns {Promise<ImageData>} - The captured image data
 */
export const captureElementToBitmap = async (element, options = {}) => {
    const { scale = 2, backgroundColor = '#ffffff' } = options;
    
    const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        logging: false,
    });
    
    const ctx = canvas.getContext('2d');
    return {
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        width: canvas.width,
        height: canvas.height,
        canvas
    };
};

/**
 * Convert image data to monochrome (1-bit per pixel)
 * Uses Floyd-Steinberg dithering for better quality
 * @param {ImageData} imageData - The image data to convert
 * @param {number} threshold - Brightness threshold (0-255)
 * @returns {Uint8Array} - Monochrome bitmap (1 bit per pixel, packed into bytes)
 */
export const convertToMonochrome = (imageData, threshold = 128) => {
    const { data, width, height } = imageData;
    
    // Create grayscale buffer for dithering
    const grayscale = new Float32Array(width * height);
    
    // Convert to grayscale
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        // Weighted grayscale conversion
        grayscale[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    }
    
    // Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const oldPixel = grayscale[idx];
            const newPixel = oldPixel < threshold ? 0 : 255;
            const error = oldPixel - newPixel;
            
            grayscale[idx] = newPixel;
            
            // Distribute error to neighbors
            if (x + 1 < width) {
                grayscale[idx + 1] += error * 7 / 16;
            }
            if (y + 1 < height) {
                if (x > 0) {
                    grayscale[(y + 1) * width + (x - 1)] += error * 3 / 16;
                }
                grayscale[(y + 1) * width + x] += error * 5 / 16;
                if (x + 1 < width) {
                    grayscale[(y + 1) * width + (x + 1)] += error * 1 / 16;
                }
            }
        }
    }
    
    // Pack into bytes (8 pixels per byte)
    // For thermal printers: 1 = black, 0 = white
    const bytesPerRow = Math.ceil(width / 8);
    const bitmap = new Uint8Array(bytesPerRow * height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const byteIdx = y * bytesPerRow + Math.floor(x / 8);
            const bitPos = 7 - (x % 8);
            
            // Black pixel = 1, white pixel = 0
            if (grayscale[idx] < 128) {
                bitmap[byteIdx] |= (1 << bitPos);
            }
        }
    }
    
    return { bitmap, bytesPerRow, width, height };
};

/**
 * Generate TSPL BITMAP command
 * Command: BITMAP x,y,width,height,mode,data
 * @param {Uint8Array} bitmap - Monochrome bitmap data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerRow - Bytes per row
 * @param {Object} position - Position {x, y} in dots
 * @returns {Uint8Array} - Complete TSPL command bytes
 */
export const generateTSPLBitmap = (bitmap, width, height, bytesPerRow, position = { x: 0, y: 0 }) => {
    // BITMAP command: BITMAP x,y,width,height,mode,bitmap_data
    // Mode 0: Overwrite (OR mode = 1, XOR mode = 2)
    const command = `BITMAP ${position.x},${position.y},${bytesPerRow},${height},0,`;
    const commandBytes = new TextEncoder().encode(command);
    
    // Combine command + bitmap data + newline
    const result = new Uint8Array(commandBytes.length + bitmap.length + 1);
    result.set(commandBytes, 0);
    result.set(bitmap, commandBytes.length);
    result[result.length - 1] = 0x0A; // Newline
    
    return result;
};

/**
 * Generate ZPL ^GF (Graphic Field) command
 * Command: ^GF a,b,c,d,data
 * a = compression type (A = ASCII hex)
 * b = binary byte count
 * c = graphic field count
 * d = bytes per row
 * @param {Uint8Array} bitmap - Monochrome bitmap data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerRow - Bytes per row
 * @param {Object} position - Position {x, y} in dots
 * @returns {string} - Complete ZPL command string
 */
export const generateZPLBitmap = (bitmap, width, height, bytesPerRow, position = { x: 0, y: 0 }) => {
    // Convert bitmap to hex string
    let hexData = '';
    for (let i = 0; i < bitmap.length; i++) {
        hexData += bitmap[i].toString(16).padStart(2, '0').toUpperCase();
    }
    
    const totalBytes = bitmap.length;
    
    // ^FO for position, ^GF for graphic field
    return `^FO${position.x},${position.y}^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}^FS`;
};

/**
 * Generate complete print commands with bitmap
 * @param {string} lang - Printer language (TSPL, ZPL)
 * @param {Uint8Array} bitmap - Monochrome bitmap data
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} bytesPerRow - Bytes per row
 * @param {Object} labelSize - Label size in mm {width, height}
 * @param {number} copies - Number of copies
 * @returns {Uint8Array} - Complete printer commands as bytes
 */
export const generateBitmapPrintCommands = (lang, bitmap, width, height, bytesPerRow, labelSize, copies = 1) => {
    const encoder = new TextEncoder();
    
    if (lang === 'TSPL') {
        const commands = [];
        
        // Initialize label
        commands.push(`SIZE ${labelSize.width} mm, ${labelSize.height} mm`);
        commands.push('GAP 2 mm, 0 mm');
        commands.push('DIRECTION 1,0');
        commands.push('CLS');
        
        // Join header commands
        const header = commands.join('\r\n') + '\r\n';
        const headerBytes = encoder.encode(header);
        
        // Generate bitmap command
        const bitmapCommand = generateTSPLBitmap(bitmap, width, height, bytesPerRow);
        
        // Print command
        const printCmd = encoder.encode(`PRINT ${copies},1\r\n`);
        
        // Combine all
        const result = new Uint8Array(headerBytes.length + bitmapCommand.length + printCmd.length);
        result.set(headerBytes, 0);
        result.set(bitmapCommand, headerBytes.length);
        result.set(printCmd, headerBytes.length + bitmapCommand.length);
        
        return result;
        
    } else if (lang === 'ZPL') {
        // ZPL commands
        const labelWidthDots = Math.round(labelSize.width * PRINTER_DPI / 25.4);
        const labelHeightDots = Math.round(labelSize.height * PRINTER_DPI / 25.4);
        
        const commands = [
            '^XA',
            `^PW${labelWidthDots}`,
            `^LL${labelHeightDots}`,
            generateZPLBitmap(bitmap, width, height, bytesPerRow),
            `^PQ${copies}`,
            '^XZ'
        ];
        
        return encoder.encode(commands.join('\n'));
        
    } else {
        // Fallback: return empty for unsupported languages
        console.warn(`Bitmap printing not supported for ${lang}`);
        return encoder.encode('');
    }
};

/**
 * Main function: Capture element and generate printer commands
 * @param {HTMLElement} element - Element to capture
 * @param {string} lang - Printer language
 * @param {Object} labelSize - Label size in mm
 * @param {number} copies - Number of copies
 * @returns {Promise<Uint8Array>} - Printer commands as bytes
 */
export const captureAndGeneratePrintCommands = async (element, lang, labelSize, copies = 1) => {
    if (!element) {
        throw new Error('No element provided for capture');
    }
    
    // Calculate target dimensions based on label size and printer DPI
    // 1 inch = 25.4mm, so dots = mm * DPI / 25.4
    const targetWidthDots = Math.round(labelSize.width * PRINTER_DPI / 25.4);
    const targetHeightDots = Math.round(labelSize.height * PRINTER_DPI / 25.4);
    
    // Capture element
    const { width, height, canvas } = await captureElementToBitmap(element, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff'
    });
    
    // Resize to target dimensions
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = targetWidthDots;
    resizedCanvas.height = targetHeightDots;
    const resizedCtx = resizedCanvas.getContext('2d');
    
    // Fill with white background
    resizedCtx.fillStyle = '#ffffff';
    resizedCtx.fillRect(0, 0, targetWidthDots, targetHeightDots);
    
    // Draw scaled image
    resizedCtx.drawImage(canvas, 0, 0, width, height, 0, 0, targetWidthDots, targetHeightDots);
    
    // Get resized image data
    const resizedImageData = resizedCtx.getImageData(0, 0, targetWidthDots, targetHeightDots);
    
    // Convert to monochrome
    const { bitmap, bytesPerRow } = convertToMonochrome(resizedImageData);
    
    // Generate print commands
    return generateBitmapPrintCommands(
        lang, 
        bitmap, 
        targetWidthDots, 
        targetHeightDots, 
        bytesPerRow, 
        labelSize, 
        copies
    );
};

const bitmapPrinterAPI = {
    captureElementToBitmap,
    convertToMonochrome,
    generateTSPLBitmap,
    generateZPLBitmap,
    generateBitmapPrintCommands,
    captureAndGeneratePrintCommands
};

export default bitmapPrinterAPI;

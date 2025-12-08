import QRCode from 'qrcode';

/**
 * Generate QR Code as DATA URL for browser print
 */
export const generateQRCodeDataURL = async (text) => {
    try {
        const dataURL = await QRCode.toDataURL(text, {
            width: 250,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return dataURL;
    } catch (error) {
        console.error('QR DataURL generation error:', error);
        return '';
    }
};

/**
 * Generate QR Code as bitmap for thermal printer (fallback for old printers)
 */
export const generateQRCodeImage = async (text) => {
    try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, text, {
            width: 200,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        return {
            data: imageData.data,
            width: canvas.width,
            height: canvas.height
        };
    } catch (error) {
        console.error('QR generation error:', error);
        return null;
    }
};

/**
 * Convert image to ESC/POS raster format (GS v 0)
 */
export const imageToRasterBytes = (imageData, width, height) => {
    const bytes = [];
    const GS = 0x1D;
    
    const bytesPerLine = Math.ceil(width / 8);
    const paperWidthBytes = 48;
    const paddingBytes = Math.max(0, Math.floor((paperWidthBytes - bytesPerLine) / 2));
    
    bytes.push(GS, 0x76, 0x30, 0x00);
    bytes.push(paperWidthBytes & 0xFF, (paperWidthBytes >> 8) & 0xFF);
    bytes.push(height & 0xFF, (height >> 8) & 0xFF);
    
    const threshold = 128;
    for (let y = 0; y < height; y++) {
        for (let p = 0; p < paddingBytes; p++) {
            bytes.push(0x00);
        }
        
        for (let x = 0; x < bytesPerLine; x++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const pixelX = x * 8 + bit;
                if (pixelX < width) {
                    const idx = (y * width + pixelX) * 4;
                    const r = imageData[idx];
                    const g = imageData[idx + 1];
                    const b = imageData[idx + 2];
                    const gray = r * 0.299 + g * 0.587 + b * 0.114;
                    
                    if (gray < threshold) {
                        byte |= (0x80 >> bit);
                    }
                }
            }
            bytes.push(byte);
        }
        
        const rightPadding = paperWidthBytes - bytesPerLine - paddingBytes;
        for (let p = 0; p < rightPadding; p++) {
            bytes.push(0x00);
        }
    }
    
    return bytes;
};


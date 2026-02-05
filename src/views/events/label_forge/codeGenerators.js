// Printer Code Generators for Label Forge

import { resolveVariable, toHex, strToHex, intToLowHighHex, estimateQRModules } from './utils';
import { DPI_203 } from './constants';

/**
 * Generate TSPL code for TSC/Godex printers
 */
export const generateTSPLCode = (labelSize, elements, variableMap) => {
    let cmds = [];
    cmds.push(`SIZE ${labelSize.width} mm,${labelSize.height} mm`);
    cmds.push(`GAP 2 mm,0 mm`);
    cmds.push(`DIRECTION 1`);
    cmds.push(`CLS`);

    elements.forEach(el => {
        const x = Math.round(el.x * DPI_203);
        const y = Math.round(el.y * DPI_203);
        const content = resolveVariable(el.content, variableMap);

        if (el.type === 'text') {
            const fontMap = { 'Arial, sans-serif': '0', 'Courier New, monospace': '1', 'Times New Roman, serif': '2' };
            const tsplFont = fontMap[el.fontFamily] || '0';
            cmds.push(`TEXT ${x},${y},"${tsplFont}",0,1,1,"${content}"`);
        } else if (el.type === 'barcode') {
            const heightDots = Math.round(el.height * DPI_203);
            cmds.push(`BARCODE ${x},${y},"128",${heightDots},1,0,2,2,"${content}"`);
        } else if (el.type === 'qrcode') {
            if (el.showBorder) {
                const boxX2 = Math.round((el.x + el.width) * DPI_203);
                const boxY2 = Math.round((el.y + el.height) * DPI_203);
                cmds.push(`BOX ${x},${y},${boxX2},${boxY2},2`);
            }

            const availableWidthDots = (el.width - (el.padding || 0) * 2) * DPI_203;
            const modules = estimateQRModules(content);
            const cellWidth = Math.max(1, Math.floor(availableWidthDots / modules));
            const pixelWidth = modules * cellWidth;

            const paddingDots = Math.round((el.padding || 0) * DPI_203);
            const offsetX = Math.floor((availableWidthDots - pixelWidth) / 2);
            const innerX = x + paddingDots + offsetX;
            const innerY = y + paddingDots + offsetX;

            cmds.push(`QRCODE ${innerX},${innerY},L,${cellWidth},A,0,M2,S7,"${content}"`);
        } else if (el.type === 'box') {
            const xEnd = Math.round((el.x + el.width) * DPI_203);
            const yEnd = Math.round((el.y + el.height) * DPI_203);
            const thickness = Math.round(el.strokeWidth * DPI_203);
            cmds.push(`BOX ${x},${y},${xEnd},${yEnd},${thickness}`);
        }
    });

    cmds.push(`PRINT 1,1`);
    cmds.push(`EOP`);
    return cmds.join('\n');
};

/**
 * Generate ZPL code for Zebra printers
 */
export const generateZPLCode = (labelSize, elements, variableMap) => {
    const labelWidthDots = Math.round(labelSize.width * DPI_203);
    let cmds = [];
    cmds.push(`^XA`);
    cmds.push(`^PW${labelWidthDots}`);
    cmds.push(`^MMT`);

    elements.forEach(el => {
        const x = Math.round(el.x * DPI_203);
        const y = Math.round(el.y * DPI_203);
        const content = resolveVariable(el.content, variableMap);

        if (el.type === 'text') {
            cmds.push(`^FO${x},${y}^A0,24,24^FD${content}^FS`);
        } else if (el.type === 'barcode') {
            const heightDots = Math.round(el.height * DPI_203);
            cmds.push(`^FO${x},${y}^BY2,3,${heightDots}^BCN,${heightDots},N,N,N^FD${content}^FS`);
        } else if (el.type === 'qrcode') {
            if (el.showBorder) {
                const w = Math.round(el.width * DPI_203);
                const h = Math.round(el.height * DPI_203);
                cmds.push(`^FO${x},${y}^GB${w},${h},2^FS`);
            }

            const availableWidthDots = (el.width - (el.padding || 0) * 2) * DPI_203;
            const modules = estimateQRModules(content);
            const cellWidth = Math.min(10, Math.max(1, Math.floor(availableWidthDots / modules)));
            const pixelWidth = modules * cellWidth;

            const paddingDots = Math.round((el.padding || 0) * DPI_203);
            const offsetX = Math.floor((availableWidthDots - pixelWidth) / 2);
            const innerX = x + paddingDots + offsetX;
            const innerY = y + paddingDots + offsetX;

            cmds.push(`^FO${innerX},${innerY}^BQN,2,${cellWidth}^FDLA,${content}^FS`);
        } else if (el.type === 'box') {
            const w = Math.round(el.width * DPI_203);
            const h = Math.round(el.height * DPI_203);
            const t = Math.round(el.strokeWidth * DPI_203);
            cmds.push(`^FO${x},${y}^GB${w},${h},${t}^FS`);
        }
    });

    cmds.push(`^XZ`);
    return cmds.join('\n');
};

/**
 * Generate ESC/POS code for receipt printers
 */
export const generateESCPOSTCode = (labelSize, elements, variableMap, showComments) => {
    const DPI = 8;
    const commands = [];
    const add = (hex, comment) => commands.push({ hex, comment });

    add("1B 40", "Initialize Printer");
    add("1B 4C", "Select page mode");

    const areaW = Math.round(labelSize.width * DPI);
    const areaH = Math.round(labelSize.height * DPI);
    add(`1D 57 00 00 00 00 ${intToLowHighHex(areaW)} ${intToLowHighHex(areaH)}`, `Set Print Area`);

    elements.forEach(el => {
        const x = Math.round(el.x * DPI);
        const y = Math.round(el.y * DPI);
        const content = resolveVariable(el.content, variableMap);

        add(`1D 24 ${intToLowHighHex(y)}`, `Y=${y}`);
        add(`1B 24 ${intToLowHighHex(x)}`, `X=${x}`);

        if (el.type === 'text') {
            add("1B 4D 00", "Font A");
            if (el.fontWeight === 'bold') add("1B 45 01", "Bold On");
            else add("1B 45 00", "Bold Off");
            add(`${strToHex(content)} 0A`, `Text: "${content}"`);
        } else if (el.type === 'qrcode') {
            add(`1D 28 6B 04 00 31 41 32 00`, "QR: Set Model 2");
            const usableW = (el.width - (el.padding || 0) * 2) * DPI;
            const modules = estimateQRModules(content);
            const modSize = Math.max(1, Math.min(16, Math.floor(usableW / modules)));
            add(`1D 28 6B 03 00 31 43 ${toHex(modSize)}`, `QR: Size ${modSize}`);
            add(`1D 28 6B 03 00 31 45 30`, "QR: ECC Level L");
            const len = content.length + 3;
            add(`1D 28 6B ${intToLowHighHex(len)} 31 50 30 ${strToHex(content)}`, "QR: Store Data");
            add(`1D 28 6B 03 00 31 51 30`, "QR: Print Symbol");
        } else if (el.type === 'barcode') {
            const h = Math.round(el.height * DPI);
            add(`1D 68 ${toHex(h)}`, "Barcode Height");
            add(`1D 77 02`, "Barcode Width");
            const len = content.length;
            add(`1D 6B 49 ${toHex(len)} ${strToHex(content)}`, "Barcode 128");
        }
    });

    add("0C", "Print Page");
    add("1D 56 42 00", "Cut");

    if (showComments) {
        return commands.map(c => `${c.hex.padEnd(30)} // ${c.comment}`).join('\n');
    } else {
        return commands.map(c => c.hex).join(' ');
    }
};

/**
 * Generate code based on printer language
 */
export const generatePrinterCode = (printerLang, labelSize, elements, variableMap, showComments = false) => {
    switch (printerLang) {
        case 'TSPL':
            return generateTSPLCode(labelSize, elements, variableMap);
        case 'ZPL':
            return generateZPLCode(labelSize, elements, variableMap);
        case 'ESC':
            return generateESCPOSTCode(labelSize, elements, variableMap, showComments);
        default:
            return 'Error: Unsupported printer language.';
    }
};

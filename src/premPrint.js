import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
    Printer,
    Type,
    QrCode,
    Barcode,
    Trash2,
    Settings,
    Download,
    Code,
    X,
    Grid,
    Minus,
    Plus,
    Maximize,
    Search,
    Eye,
    PenTool,
    Magnet,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    Square,
    MousePointer2,
    Undo2,
    Redo2,
    FileJson,
    Upload,
    Save,
    LayoutTemplate,
    ScanLine,
    BoxSelect,
    AlertCircle,
    PlusCircle,
    Layers,
    ArrowUp,
    ArrowDown,
    ChevronsUp,
    ChevronsDown,
    MessageSquare,
    Copy,
    ClipboardPaste,
    MoreVertical,
    AlignHorizontalDistributeCenter,
    AlignVerticalDistributeCenter,
    RotateCcw
} from 'lucide-react';

// --- Constants & Helpers ---

const DPI_203 = 8;
const SCREEN_SCALE = 4;
const SNAP_GRID_SIZE = 1;
const STORAGE_KEY = 'LABEL_FORGE_STATE_V1';

const FONTS = [
    { name: 'Arial (Sans)', value: 'Arial, sans-serif', tspl: '0' },
    { name: 'Courier (Mono)', value: 'Courier New, monospace', tspl: '1' },
    { name: 'Times (Serif)', value: 'Times New Roman, serif', tspl: '2' },
    { name: 'Impact', value: 'Impact, sans-serif', tspl: '3' },
    { name: 'Verdana', value: 'Verdana, sans-serif', tspl: '4' },
];

const PRESETS = [
    { name: '48mm x 30mm (Standard)', width: 48, height: 30 },
    { name: '50mm x 50mm (Square)', width: 50, height: 50 },
    { name: '100mm x 150mm (Shipping)', width: 100, height: 150 },
    { name: '40mm x 20mm (Small)', width: 40, height: 20 },
];

const GRID_SIZES = [0.5, 1, 2, 5, 10];

const INITIAL_ELEMENTS = [
    { id: '1', type: 'text', x: 2, y: 2, content: 'TICKET #', fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
    { id: '2', type: 'text', x: 2, y: 12, content: '{ticket_id}', fontSize: 14, fontWeight: 'normal', fontFamily: 'Courier New, monospace' },
    { id: '3', type: 'qrcode', x: 28, y: 2, width: 18, height: 18, content: '{ticket_id}', showBorder: true, padding: 1 },
    { id: '4', type: 'barcode', x: 2, y: 22, width: 44, height: 6, content: '12345678' },
];

const DEMO_TEMPLATE = {
    labelSize: { name: '100mm x 150mm (Shipping)', width: 100, height: 150 },
    elements: [
        { id: 'd1', type: 'box', x: 2, y: 2, width: 96, height: 146, strokeWidth: 0.5 },
        { id: 'd2', type: 'text', x: 5, y: 5, content: 'SHIPPING LABEL', fontSize: 16, fontWeight: 'bold', fontFamily: 'Impact, sans-serif' },
        { id: 'd3', type: 'text', x: 70, y: 6, content: '{date}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd4', type: 'box', x: 2, y: 15, width: 96, height: 0.5, strokeWidth: 0.5 },
        { id: 'd5', type: 'text', x: 5, y: 18, content: 'FROM: Store #{store_id}', fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd6', type: 'text', x: 5, y: 23, content: 'TO CUSTOMER: {customer_id}', fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd7', type: 'text', x: 5, y: 28, content: '{name}', fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd8', type: 'box', x: 2, y: 35, width: 96, height: 0.5, strokeWidth: 0.5 },
        { id: 'd9', type: 'text', x: 5, y: 38, content: 'PRODUCT DETAILS', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd10', type: 'text', x: 5, y: 43, content: 'SKU: {sku}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Courier New, monospace' },
        { id: 'd11', type: 'text', x: 50, y: 43, content: 'Cat: {category}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd12', type: 'text', x: 5, y: 48, content: '{description}', fontSize: 12, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd13', type: 'text', x: 5, y: 55, content: 'PRICE:', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd14', type: 'text', x: 5, y: 59, content: '{currency} {price}', fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd15', type: 'text', x: 50, y: 55, content: 'WEIGHT:', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd16', type: 'text', x: 50, y: 59, content: '{weight}', fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd17', type: 'barcode', x: 5, y: 70, width: 90, height: 20, content: '{order_no}' },
        { id: 'd18', type: 'text', x: 35, y: 92, content: 'Order: {order_no}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd19', type: 'qrcode', x: 65, y: 105, width: 25, height: 25, content: '{ticket_id}', showBorder: true, padding: 1 },
        { id: 'd20', type: 'text', x: 67, y: 132, content: 'SCAN ME', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd21', type: 'text', x: 5, y: 105, content: 'Expiry: {expiry}', fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd22', type: 'text', x: 5, y: 110, content: 'Lot: {lot_no}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd23', type: 'text', x: 5, y: 140, content: 'Ticket ID: {ticket_id}', fontSize: 8, fontWeight: 'normal', fontFamily: 'Courier New, monospace' },
    ]
};

const MOCK_DATA = {
    '{name}': 'Fresh Atlantic Salmon',
    '{ticket_id}': 'TK-8849201',
    '{price}': '24.99',
    '{date}': '2023-12-01',
    '{sku}': 'SKU-554432',
    '{description}': 'Premium Filet Skin-on',
    '{category}': 'Seafood',
    '{weight}': '0.45 kg',
    '{currency}': '$',
    '{store_id}': 'ST-001',
    '{customer_id}': 'CUST-887',
    '{order_no}': 'ORD-2023-001',
    '{expiry}': '2023-12-05',
    '{lot_no}': 'L-7761'
};

// Helper to load state
const loadSavedState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load saved state:", e);
    }
    return null;
};

// ... (Rest of helpers same as before)
const resolveVariable = (text, variableMap) => {
    if (!text) return '';
    let result = text;
    const map = variableMap || MOCK_DATA;
    Object.keys(map).forEach(key => {
        result = result.replaceAll(key, map[key]);
    });
    return result;
};

const toHex = (num, padding = 2) => num.toString(16).padStart(padding, '0').toUpperCase();
const strToHex = (str) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += toHex(str.charCodeAt(i)) + ' ';
    }
    return hex.trim();
};
const intToLowHighHex = (num) => {
    const low = num & 0xFF;
    const high = (num >> 8) & 0xFF;
    return `${toHex(low)} ${toHex(high)}`;
};

// --- QR Code Helper ---
const estimateQRModules = (content) => {
    // Rough estimate of modules (dots width) based on version required for length (ECC L)
    const len = content ? content.length : 0;
    let version = 1;
    if (len <= 25) version = 1;
    else if (len <= 47) version = 2;
    else if (len <= 77) version = 3;
    else if (len <= 114) version = 4;
    else if (len <= 154) version = 5;
    else if (len <= 195) version = 6;
    else if (len <= 224) version = 7;
    else if (len <= 279) version = 8;
    else if (len <= 335) version = 9;
    else version = 10;

    // Modules = 21 + (V-1)*4
    return 21 + (version - 1) * 4;
};

// ... (ResizeHandle, DraggableElement, PreviewElement same as before)
const ResizeHandle = ({ cursor, onMouseDown, position }) => {
    const style = {
        width: '8px',
        height: '8px',
        backgroundColor: 'white',
        border: '1px solid #3b82f6',
        position: 'absolute',
        cursor: cursor,
        zIndex: 60,
        ...position
    };
    return <div onMouseDown={onMouseDown} style={style} />;
};

const DraggableElement = React.memo(({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onInteractionEnd,
    onMeasure,
    onContextMenu,
    zoomLevel,
    snapEnabled,
    gridSize,
    variableMap
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const elementRef = useRef(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
    const hasMoved = useRef(false);
    const resizeDir = useRef(null);

    useLayoutEffect(() => {
        if (elementRef.current && onMeasure) {
            const { offsetWidth, offsetHeight } = elementRef.current;
            onMeasure(element.id, {
                width: offsetWidth / SCREEN_SCALE,
                height: offsetHeight / SCREEN_SCALE
            });
        }
    }, [element.content, element.fontSize, element.fontFamily, element.width, element.height, element.padding, element.showBorder, onMeasure, variableMap]);

    const handleMouseDown = (e) => {
        e.stopPropagation();
        if (e.button !== 0) return;

        // Improved group selection logic:
        // If selected and no modifier keys, we might be starting a group drag.
        // Don't deselect others immediately.
        const isGroupSelection = isSelected && !e.ctrlKey && !e.metaKey && !e.shiftKey;

        if (!isGroupSelection) {
            onSelect(element.id, e.ctrlKey || e.metaKey);
        }

        setIsDragging(true);
        hasMoved.current = false;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elX: element.x,
            elY: element.y
        };
    };

    const handleContext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, element.id);
    };

    const handleResizeStart = (e, direction) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeDir.current = direction;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elX: element.x,
            elY: element.y,
            elW: element.width,
            elH: element.height
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing) return;
            e.preventDefault();

            const deltaX = (e.clientX - dragStart.current.mouseX) / (SCREEN_SCALE * zoomLevel);
            const deltaY = (e.clientY - dragStart.current.mouseY) / (SCREEN_SCALE * zoomLevel);

            // Track if moved significantly (prevent micro-movements from blocking selection)
            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                hasMoved.current = true;
            }

            if (isDragging) {
                let nextX = Math.max(0, dragStart.current.elX + deltaX);
                let nextY = Math.max(0, dragStart.current.elY + deltaY);

                if (snapEnabled && !e.shiftKey) {
                    nextX = Math.round(nextX / gridSize) * gridSize;
                    nextY = Math.round(nextY / gridSize) * gridSize;
                }
                onUpdate(element.id, { x: nextX, y: nextY }, true);
            } else if (isResizing) {
                const updates = {};
                const { elW, elH } = dragStart.current;
                const dir = resizeDir.current;

                if (dir.includes('e')) updates.width = Math.max(1, elW + deltaX);
                if (dir.includes('s')) updates.height = Math.max(1, elH + deltaY);

                if (snapEnabled && !e.shiftKey) {
                    if (updates.width) updates.width = Math.round(updates.width / gridSize) * gridSize;
                    if (updates.height) updates.height = Math.round(updates.height / gridSize) * gridSize;
                }

                onUpdate(element.id, updates, false);
            }
        };

        const handleMouseUp = (e) => {
            if (isDragging || isResizing) {
                setIsDragging(false);
                setIsResizing(false);
                onInteractionEnd();

                // Finalize group selection if it was just a click (no drag)
                // If we clicked a selected item without dragging, we should now select ONLY that item
                if (isSelected && !hasMoved.current && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isResizing) {
                    onSelect(element.id, false);
                }
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, element.id, onUpdate, zoomLevel, snapEnabled, gridSize, onInteractionEnd, isSelected, onSelect]);

    const style = {
        left: `${element.x * SCREEN_SCALE}px`,
        top: `${element.y * SCREEN_SCALE}px`,
        zIndex: isSelected ? 50 : 10,
    };

    const resolvedContent = resolveVariable(element.content, variableMap);

    const renderContent = () => {
        switch (element.type) {
            case 'text':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            fontSize: `${element.fontSize}px`,
                            fontWeight: element.fontWeight,
                            fontFamily: element.fontFamily,
                            whiteSpace: 'nowrap'
                        }}
                        className="text-gray-900 leading-none select-none pointer-events-none"
                    >
                        {element.content}
                    </div>
                );
            case 'qrcode':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            width: `${element.width * SCREEN_SCALE}px`,
                            height: `${element.height * SCREEN_SCALE}px`,
                            padding: `${(element.padding || 0) * SCREEN_SCALE}px`,
                            borderWidth: element.showBorder ? '1px' : '0px',
                            borderStyle: 'solid',
                            borderColor: '#111827'
                        }}
                        className="bg-white flex items-center justify-center overflow-hidden pointer-events-none"
                    >
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(resolvedContent)}`}
                            alt="QR"
                            className="w-full h-full object-contain"
                            draggable={false}
                        />
                    </div>
                );
            case 'barcode':
                return (
                    <div
                        ref={elementRef}
                        style={{ width: `${element.width * SCREEN_SCALE}px`, height: `${element.height * SCREEN_SCALE}px` }}
                        className="bg-white flex flex-col justify-center items-center overflow-hidden border border-transparent pointer-events-none px-1"
                    >
                        <div className="flex w-full h-full items-stretch justify-between">
                            {[...Array(25)].map((_, i) => (
                                <div key={i} style={{ width: Math.random() > 0.5 ? '4px' : '2px', backgroundColor: 'black' }} />
                            ))}
                        </div>
                        <div className="text-[10px] font-mono leading-none mt-0.5">
                            {element.content}
                        </div>
                    </div>
                );
            case 'box':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            width: `${element.width * SCREEN_SCALE}px`,
                            height: `${element.height * SCREEN_SCALE}px`,
                            borderWidth: `${Math.max(1, element.strokeWidth * SCREEN_SCALE)}px`
                        }}
                        className="border-black pointer-events-none"
                    />
                );
            default: return null;
        }
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={handleContext}
            style={style}
            className={`absolute cursor-grab active:cursor-grabbing group select-none`}
        >
            {renderContent()}
            <div className={`absolute -inset-1 border-2 rounded transition-colors pointer-events-none ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-transparent group-hover:border-gray-300'}`} />
            {isSelected && (
                <>
                    <div
                        style={{ transform: `scale(${1 / zoomLevel})`, transformOrigin: 'bottom left' }}
                        className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-50 font-mono pointer-events-none"
                    >
                        x:{element.x.toFixed(1)} y:{element.y.toFixed(1)}
                    </div>
                    {(element.type === 'box' || element.type === 'barcode' || element.type === 'qrcode') && (
                        <>
                            <ResizeHandle cursor="se-resize" position={{ bottom: '-5px', right: '-5px' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
                            <ResizeHandle cursor="e-resize" position={{ top: '50%', right: '-5px', transform: 'translateY(-50%)' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
                            <ResizeHandle cursor="s-resize" position={{ bottom: '-5px', left: '50%', transform: 'translateX(-50%)' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
                        </>
                    )}
                </>
            )}
        </div>
    );
});

const PreviewElement = ({ element, variableMap }) => {
    const resolvedContent = resolveVariable(element.content, variableMap);

    const style = {
        left: `${element.x * SCREEN_SCALE}px`,
        top: `${element.y * SCREEN_SCALE}px`,
        position: 'absolute',
        zIndex: 10,
        color: '#222',
    };

    switch (element.type) {
        case 'text':
            return (
                <div
                    style={{
                        ...style,
                        fontSize: `${element.fontSize}px`,
                        fontWeight: element.fontWeight,
                        fontFamily: element.fontFamily,
                        textShadow: '0 0 0.5px rgba(0,0,0,0.4)'
                    }}
                    className="whitespace-nowrap leading-none opacity-90"
                >
                    {resolvedContent}
                </div>
            );
        case 'qrcode':
            return (
                <div
                    style={{
                        ...style,
                        width: `${element.width * SCREEN_SCALE}px`,
                        height: `${element.height * SCREEN_SCALE}px`,
                        padding: `${(element.padding || 0) * SCREEN_SCALE}px`,
                        borderWidth: element.showBorder ? '1px' : '0px',
                        borderStyle: 'solid',
                        borderColor: '#222'
                    }}
                    className="bg-transparent flex items-center justify-center overflow-hidden mix-blend-multiply"
                >
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(resolvedContent)}`}
                        alt="QR"
                        className="w-full h-full object-contain opacity-90 grayscale contrast-125"
                    />
                </div>
            );
        case 'barcode':
            return (
                <div
                    style={{ ...style, width: `${element.width * SCREEN_SCALE}px`, height: `${element.height * SCREEN_SCALE}px` }}
                    className="bg-transparent flex flex-col justify-center items-center overflow-hidden mix-blend-multiply opacity-90"
                >
                    <div className="flex w-full h-full items-stretch justify-between px-1">
                        {[...Array(25)].map((_, i) => (
                            <div key={i} style={{ width: Math.random() > 0.5 ? '4px' : '2px', backgroundColor: '#222' }} />
                        ))}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 text-[#222] leading-none">{resolvedContent}</div>
                </div>
            );
        case 'box':
            return (
                <div
                    style={{
                        ...style,
                        width: `${element.width * SCREEN_SCALE}px`,
                        height: `${element.height * SCREEN_SCALE}px`,
                        borderWidth: `${Math.max(1, element.strokeWidth * SCREEN_SCALE)}px`
                    }}
                    className="border-[#222] opacity-90 mix-blend-multiply"
                />
            );
        default: return null;
    }
};

// --- Code Generation Logic ---
const generateTSPLCode = (labelSize, elements, variableMap) => {
    const DPI_203 = 8;
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

            // Center the QR code inside the bounding box
            const paddingDots = Math.round((el.padding || 0) * DPI_203);
            const offsetX = Math.floor((availableWidthDots - pixelWidth) / 2);
            const innerX = x + paddingDots + offsetX;
            const innerY = y + paddingDots + offsetX; // Square QR, use same offset

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

const generateZPLCode = (labelSize, elements, variableMap) => {
    const DPI_203 = 8;
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
            const zplFont = el.fontFamily.includes('Courier') ? '^A0' : '^A0';
            cmds.push(`^FO${x},${y}${zplFont},24,24^FD${content}^FS`);
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

            // Center the QR code inside the bounding box
            const paddingDots = Math.round((el.padding || 0) * DPI_203);
            const offsetX = Math.floor((availableWidthDots - pixelWidth) / 2);
            const innerX = x + paddingDots + offsetX;
            const innerY = y + paddingDots + offsetX;

            // Changed ^FDQA to ^FDLA (Low Error Correction) to match sizing estimate and TSPL
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

const generateESCPOSTCode = (labelSize, elements, variableMap, showComments) => {
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

// --- Main Application ---

export default function App() {
    const [labelSize, setLabelSize] = useState(() => {
        const saved = loadSavedState();
        return saved?.labelSize || PRESETS[0];
    });

    // -- History / Undo / Redo --
    const [elements, setElements] = useState(() => {
        const saved = loadSavedState();
        return saved?.elements || INITIAL_ELEMENTS;
    });
    const [history, setHistory] = useState([elements]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [selectedIds, setSelectedIds] = useState([]);
    const [printerLang, setPrinterLang] = useState('TSPL');
    const [showGrid, setShowGrid] = useState(true);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState('editor');
    const [gridSize, setGridSize] = useState(SNAP_GRID_SIZE);
    const [activeSidebarTab, setActiveSidebarTab] = useState('create');
    const [customVariables, setCustomVariables] = useState(() => {
        const saved = loadSavedState();
        return saved?.customVariables || {};
    });
    const [isVarModalOpen, setIsVarModalOpen] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const [newVarValue, setNewVarValue] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [marquee, setMarquee] = useState(null); // { startX, startY, currentX, currentY }
    const panStart = useRef({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const elementDimensions = useRef({});
    const containerRef = useRef(null);
    const mainRef = useRef(null);
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const primarySelection = selectedElements.length > 0 ? selectedElements[selectedElements.length - 1] : null;
    const allVariables = { ...MOCK_DATA, ...customVariables };

    // Persistence Effect
    useEffect(() => {
        const state = {
            labelSize,
            elements,
            customVariables,
            printerLang,
            gridSize
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [labelSize, elements, customVariables, printerLang, gridSize]);

    const commitToHistory = useCallback((newElements) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setElements(history[newIndex]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setElements(history[newIndex]);
        }
    }, [history, historyIndex]);

    // Handle Reset Canvas
    const handleReset = () => {
        setConfirmationState({
            isOpen: true,
            title: 'Reset Canvas',
            message: 'Are you sure you want to clear the entire canvas? This cannot be undone.',
            onConfirm: () => {
                setElements([]);
                commitToHistory([]);
                setSelectedIds([]);
                setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };

    const handleLoadDemo = () => {
        setConfirmationState({
            isOpen: true,
            title: 'Load Demo Template',
            message: 'This will replace your current design with the demo template. Are you sure you want to continue?',
            onConfirm: () => {
                setLabelSize(DEMO_TEMPLATE.labelSize);
                setElements(DEMO_TEMPLATE.elements);
                commitToHistory(DEMO_TEMPLATE.elements);
                setSelectedIds([]);
                setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };

    const handleExportTemplate = () => {
        const data = { labelSize, elements, version: '1.0', timestamp: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `label-template-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportTemplate = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.labelSize && data.elements) {
                    setLabelSize(data.labelSize);
                    setElements(data.elements);
                    commitToHistory(data.elements);
                    setSelectedIds([]);
                } else { console.warn('Invalid template file format.'); }
            } catch (err) { console.error('Error parsing JSON file.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAddCustomVar = () => {
        if (newVarName && newVarValue) {
            const formattedName = `{${newVarName.replace(/[{}]/g, '')}}`;
            setCustomVariables(prev => ({ ...prev, [formattedName]: newVarValue }));
            setNewVarName('');
            setNewVarValue('');
            setIsVarModalOpen(false);
        }
    };

    const handleMeasure = useCallback((id, dims) => {
        elementDimensions.current[id] = dims;
    }, []);

    const handleSelect = useCallback((id, isMulti) => {
        setSelectedIds(prev => {
            if (isMulti) {
                return prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id];
            }
            return [id];
        });
    }, []);

    const handleMoveLayer = (id, direction) => {
        const index = elements.findIndex(el => el.id === id);
        if (index === -1) return;
        let newElements = [...elements];
        const item = newElements.splice(index, 1)[0];
        if (direction === 'front') newElements.push(item);
        else if (direction === 'back') newElements.unshift(item);
        else if (direction === 'up' && index < elements.length - 1) newElements.splice(index + 1, 0, item);
        else if (direction === 'down' && index > 0) newElements.splice(index - 1, 0, item);
        else return;
        setElements(newElements);
        commitToHistory(newElements);
    };

    const onElementContextMenu = useCallback((e, id) => {
        if (!selectedIds.includes(id)) { handleSelect(id, false); }
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'element', id });
    }, [selectedIds, handleSelect]);

    const onCanvasContextMenu = useCallback((e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' });
    }, []);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleDuplicate = () => {
        const newElements = selectedElements.map(el => ({
            ...el,
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            x: el.x + 5,
            y: el.y + 5
        }));
        const nextElements = [...elements, ...newElements];
        setElements(nextElements);
        commitToHistory(nextElements);
        setSelectedIds(newElements.map(el => el.id));
    };

    const addElement = (type, initialProps = {}) => {
        const newId = Date.now().toString();
        let newEl = { id: newId, type, x: 5, y: 5, ...initialProps };
        if (type === 'text') {
            newEl = { content: 'New Text', fontSize: 12, fontWeight: 'normal', fontFamily: 'Arial, sans-serif', ...newEl };
        } else if (type === 'qrcode') {
            newEl = { width: 15, height: 15, content: '123456', showBorder: true, padding: 1, ...newEl };
        } else if (type === 'barcode') {
            newEl = { width: 30, height: 8, content: '123456', ...newEl };
        } else if (type === 'box') {
            newEl = { width: 20, height: 20, strokeWidth: 0.5, ...newEl };
        }
        const newElements = [...elements, newEl];
        setElements(newElements);
        commitToHistory(newElements);
        setSelectedIds([newId]);
        if (activeTab === 'preview') setActiveTab('editor');
    };

    const updateElement = useCallback((id, updates, isDrag) => {
        setElements(prev => {
            return prev.map(el => {
                if (el.id === id) return { ...el, ...updates };
                if (isDrag && selectedIds.includes(id) && selectedIds.includes(el.id)) {
                    const originEl = prev.find(e => e.id === id);
                    const dx = updates.x - originEl.x;
                    const dy = updates.y - originEl.y;
                    return { ...el, x: el.x + dx, y: el.y + dy };
                }
                return el;
            });
        });
    }, [selectedIds]);

    const handleInteractionEnd = useCallback(() => {
        commitToHistory(elements);
    }, [elements, commitToHistory]);

    const deleteElement = useCallback(() => {
        if (selectedIds.length > 0) {
            const newElements = elements.filter(el => !selectedIds.includes(el.id));
            setElements(newElements);
            commitToHistory(newElements);
            setSelectedIds([]);
        }
    }, [selectedIds, elements, commitToHistory]);

    const handleAlign = (alignment) => {
        if (selectedIds.length === 0) return;
        let newElements = [...elements];
        const group = elements.filter(el => selectedIds.includes(el.id));
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        group.forEach(el => {
            const dim = elementDimensions.current[el.id] || { width: el.width || 0, height: el.height || 0 };
            const w = dim.width;
            const h = dim.height;
            if (el.x < minX) minX = el.x;
            if (el.x + w > maxX) maxX = el.x + w;
            if (el.y < minY) minY = el.y;
            if (el.y + h > maxY) maxY = el.y + h;
        });
        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;

        if (selectedIds.length === 1) {
            const el = group[0];
            const dim = elementDimensions.current[el.id] || { width: el.width || 0, height: el.height || 0 };
            let updates = {};
            switch (alignment) {
                case 'left': updates.x = 0; break;
                case 'center': updates.x = (labelSize.width - dim.width) / 2; break;
                case 'right': updates.x = labelSize.width - dim.width; break;
                case 'top': updates.y = 0; break;
                case 'middle': updates.y = (labelSize.height - dim.height) / 2; break;
                case 'bottom': updates.y = labelSize.height - dim.height; break;
            }
            newElements = elements.map(e => e.id === el.id ? { ...e, ...updates } : e);
        } else {
            // For multiple items, we align relative to the selection bounds
            if (['distribute-h', 'distribute-v'].includes(alignment)) {
                const sortedGroup = [...group].sort((a, b) => alignment === 'distribute-h' ? a.x - b.x : a.y - b.y);
                if (sortedGroup.length > 2) {
                    const first = sortedGroup[0];
                    const last = sortedGroup[sortedGroup.length - 1];
                    const span = alignment === 'distribute-h' ? (last.x - first.x) : (last.y - first.y);
                    const step = span / (sortedGroup.length - 1);

                    newElements = elements.map(el => {
                        if (!selectedIds.includes(el.id)) return el;
                        const idx = sortedGroup.findIndex(x => x.id === el.id);
                        if (idx === 0 || idx === sortedGroup.length - 1) return el; // Keep ends pinned

                        if (alignment === 'distribute-h') return { ...el, x: first.x + (step * idx) };
                        else return { ...el, y: first.y + (step * idx) };
                    });
                }
            } else {
                newElements = elements.map(el => {
                    if (!selectedIds.includes(el.id)) return el;
                    const dim = elementDimensions.current[el.id] || { width: el.width || 0, height: el.height || 0 };
                    const w = dim.width;
                    const h = dim.height;
                    let newX = el.x;
                    let newY = el.y;
                    switch (alignment) {
                        case 'left': newX = minX; break;
                        case 'center': newX = centerX - (w / 2); break;
                        case 'right': newX = maxX - w; break;
                        case 'top': newY = minY; break;
                        case 'middle': newY = centerY - (h / 2); break;
                        case 'bottom': newY = maxY - h; break;
                    }
                    return { ...el, x: newX, y: newY };
                });
            }
        }
        setElements(newElements);
        commitToHistory(newElements);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
            if (selectedIds.length > 0 && activeTab === 'editor') {
                if (e.key === 'Delete' || e.key === 'Backspace') deleteElement();
                if (e.key.startsWith('Arrow')) {
                    e.preventDefault();
                    const step = e.shiftKey ? 5 : 0.5;
                    setElements(prev => {
                        const newEls = prev.map(el => {
                            if (selectedIds.includes(el.id)) {
                                let nx = el.x, ny = el.y;
                                if (e.key === 'ArrowUp') ny -= step; if (e.key === 'ArrowDown') ny += step;
                                if (e.key === 'ArrowLeft') nx -= step; if (e.key === 'ArrowRight') nx += step;
                                return { ...el, x: nx, y: ny };
                            }
                            return el;
                        });
                        return newEls;
                    });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, elements, deleteElement, undo, redo, activeTab]);

    useEffect(() => {
        const container = mainRef.current;
        if (!container) return;
        const handleWheelNative = (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); e.stopPropagation();
                setViewTransform(prev => ({ ...prev, scale: Math.min(Math.max(0.1, prev.scale - e.deltaY * 0.001), 5) }));
            } else if (e.shiftKey) {
                e.preventDefault(); setViewTransform(prev => ({ ...prev, x: prev.x - e.deltaY }));
            } else {
                e.preventDefault(); setViewTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };
        container.addEventListener('wheel', handleWheelNative, { passive: false });
        return () => container.removeEventListener('wheel', handleWheelNative);
    }, []);

    // --- Marquee & Pan Helpers ---
    const getCanvasCoordinates = (e) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / viewTransform.scale,
            y: (e.clientY - rect.top) / viewTransform.scale
        };
    };

    const handleCanvasMouseDown = (e) => {
        // Middle Click or Space -> Pan
        if (e.button === 1 || (e.button === 0 && e.code === 'Space')) {
            if (e.target === e.currentTarget || e.target.closest('.will-change-transform')) setSelectedIds([]);
            setIsPanning(true);
            panStart.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // Left Click on canvas (empty space) -> Marquee
        if (e.button === 0) {
            // Clear selection unless shift/ctrl held
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                setSelectedIds([]);
            }
            const { x, y } = getCanvasCoordinates(e);
            setMarquee({ startX: x, startY: y, currentX: x, currentY: y });
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (isPanning) {
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            panStart.current = { x: e.clientX, y: e.clientY };
            setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        } else if (marquee) {
            const { x, y } = getCanvasCoordinates(e);
            setMarquee(prev => ({ ...prev, currentX: x, currentY: y }));
        }
    };

    const handleCanvasMouseUp = (e) => {
        if (isPanning) setIsPanning(false);

        if (marquee) {
            // Calculate final selection
            const x1 = Math.min(marquee.startX, marquee.currentX);
            const x2 = Math.max(marquee.startX, marquee.currentX);
            const y1 = Math.min(marquee.startY, marquee.currentY);
            const y2 = Math.max(marquee.startY, marquee.currentY);

            const newSelected = [];

            elements.forEach(el => {
                const elX = el.x * SCREEN_SCALE;
                const elY = el.y * SCREEN_SCALE;
                const dims = elementDimensions.current[el.id] || { width: (el.width || 0) * SCREEN_SCALE, height: (el.height || 0) * SCREEN_SCALE };
                const elW = dims.width * SCREEN_SCALE; // stored dims are in MM
                const elH = dims.height * SCREEN_SCALE;

                // Simple intersection check
                // (Box vs Box)
                if (x1 < elX + elW && x2 > elX && y1 < elY + elH && y2 > elY) {
                    newSelected.push(el.id);
                }
            });

            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                setSelectedIds(prev => [...new Set([...prev, ...newSelected])]);
            } else {
                // If we didn't clear on mouse down (logic above clears), we set here.
                // Note: The mouse down handler already cleared if no keys were held.
                setSelectedIds(prev => [...new Set([...prev, ...newSelected])]);
            }
            setMarquee(null);
        }
    };

    const centerView = () => setViewTransform({ x: 0, y: 0, scale: 1 });

    const handleGenerateCode = useCallback(() => {
        let code = '';
        switch (printerLang) {
            case 'TSPL': code = generateTSPLCode(labelSize, elements, allVariables); break;
            case 'ZPL': code = generateZPLCode(labelSize, elements, allVariables); break;
            case 'ESC': code = generateESCPOSTCode(labelSize, elements, allVariables, showComments); break;
            default: code = 'Error: Unsupported printer language.';
        }
        setGeneratedCode(code);
        setShowCodeModal(true);
    }, [printerLang, labelSize, elements, allVariables, showComments]);

    // Re-generate code when showComments toggles if modal is open
    useEffect(() => {
        if (showCodeModal) {
            handleGenerateCode();
        }
    }, [showComments, handleGenerateCode, showCodeModal]);

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportTemplate}
                className="hidden"
                accept=".json"
            />

            {/* --- HEADER --- */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white"><Printer size={24} /></div>
                        <div><h1 className="text-xl font-bold text-gray-800 tracking-tight">LabelForge</h1><p className="text-xs text-gray-500 font-medium">Thermal Printer Design Suite</p></div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('editor')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><PenTool size={16} /> Editor</button>
                        <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Eye size={16} /> Preview</button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* File Operations */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-2">
                        <button onClick={handleReset} className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-red-600 transition-all" title="Reset Canvas"><RotateCcw size={18} /></button>
                        <div className="w-px h-5 bg-gray-300 mx-1"></div>
                        <button onClick={handleLoadDemo} className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-blue-600 transition-all" title="Load Demo Template"><LayoutTemplate size={18} /></button>
                        <button onClick={handleExportTemplate} className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-green-600 transition-all" title="Export Template"><Save size={18} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded text-gray-600 hover:bg-white hover:text-orange-600 transition-all" title="Import Template"><Upload size={18} /></button>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 rounded text-gray-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)"><Undo2 size={18} /></button>
                        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded text-gray-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (Ctrl+Y)"><Redo2 size={18} /></button>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <span className="px-3 text-sm font-semibold text-gray-600">Language:</span>
                        <select value={printerLang} onChange={(e) => setPrinterLang(e.target.value)} className="bg-white border-none text-sm font-medium rounded-md py-1.5 pl-2 pr-8 focus:ring-0 cursor-pointer shadow-sm">
                            <option value="TSPL">TSPL (TSC, Godex)</option>
                            <option value="ZPL">ZPL (Zebra)</option>
                            <option value="ESC">ESC/POS (Receipt)</option>
                        </select>
                    </div>
                    <button onClick={handleGenerateCode} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md"><Code size={18} /> Generate Code</button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* --- LEFT SIDEBAR --- */}
                <aside className="w-72 bg-white border-r border-gray-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0">
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider ${activeSidebarTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveSidebarTab('create')}
                        >
                            Create
                        </button>
                        <button
                            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider ${activeSidebarTab === 'layers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveSidebarTab('layers')}
                        >
                            Layers
                        </button>
                    </div>

                    {/* TAB: CREATE */}
                    {activeSidebarTab === 'create' && (
                        <>
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Label Configuration</h3>
                                <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none mb-3" onChange={(e) => { const preset = PRESETS.find(p => p.name === e.target.value); if (preset) setLabelSize(preset); }} value={labelSize.name} disabled={activeTab === 'preview'}>
                                    {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[10px] text-gray-400 font-bold uppercase">Width (mm)</label><input type="number" value={labelSize.width} onChange={(e) => setLabelSize({ ...labelSize, width: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-sm" disabled={activeTab === 'preview'} /></div>
                                    <div><label className="text-[10px] text-gray-400 font-bold uppercase">Height (mm)</label><input type="number" value={labelSize.height} onChange={(e) => setLabelSize({ ...labelSize, height: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-sm" disabled={activeTab === 'preview'} /></div>
                                </div>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto">
                                {activeTab === 'editor' ? (
                                    <>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Toolbox</h3>
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <button onClick={() => addElement('text')} className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-100 transition-all group active:scale-95"><Type size={24} className="mb-2" /> <span className="text-xs font-semibold">Text</span></button>
                                            <button onClick={() => addElement('barcode')} className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-100 transition-all group active:scale-95"><Barcode size={24} className="mb-2" /> <span className="text-xs font-semibold">Barcode</span></button>
                                            <button onClick={() => addElement('qrcode')} className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-100 transition-all group active:scale-95"><QrCode size={24} className="mb-2" /> <span className="text-xs font-semibold">QR Code</span></button>
                                            <button onClick={() => addElement('box')} className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-100 transition-all group active:scale-95"><Square size={24} className="mb-2" /> <span className="text-xs font-semibold">Box</span></button>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-xs font-bold text-amber-800">Variables</h4>
                                                <button onClick={() => setIsVarModalOpen(true)} className="text-amber-700 hover:text-amber-900"><PlusCircle size={14} /></button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.keys(allVariables).map(tag => (
                                                    <span key={tag} onClick={() => addElement('text', { content: tag })} className="bg-white px-2 py-1 rounded text-[10px] font-mono border border-amber-200 cursor-pointer hover:bg-amber-100 text-amber-900 shadow-sm active:translate-y-0.5 transition-all">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Preview Data</h3>
                                        <div className="space-y-2 overflow-y-auto max-h-[400px]">
                                            {Object.entries(allVariables).map(([key, value]) => (
                                                <div key={key} className="flex flex-col border-b border-gray-100 pb-2"><span className="text-[10px] font-bold text-gray-400">{key}</span><span className="text-sm font-mono text-gray-800 truncate" title={value}>{value}</span></div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* TAB: LAYERS */}
                    {activeSidebarTab === 'layers' && (
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="space-y-1">
                                {[...elements].reverse().map((el, i) => {
                                    return (
                                        <div
                                            key={el.id}
                                            onClick={(e) => handleSelect(el.id, e.ctrlKey || e.metaKey)}
                                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border ${selectedIds.includes(el.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <div className="text-gray-500">
                                                {el.type === 'text' && <Type size={16} />}
                                                {el.type === 'barcode' && <Barcode size={16} />}
                                                {el.type === 'qrcode' && <QrCode size={16} />}
                                                {el.type === 'box' && <Square size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-700 truncate">{el.content || el.type}</div>
                                                <div className="text-[10px] text-gray-400">ID: {el.id}</div>
                                            </div>
                                            {selectedIds.includes(el.id) && (
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); handleMoveLayer(el.id, 'front'); }} className="p-1 hover:bg-blue-200 rounded text-blue-600" title="Bring to Front"><ChevronsUp size={12} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleMoveLayer(el.id, 'up'); }} className="p-1 hover:bg-blue-200 rounded text-blue-600" title="Move Up"><ArrowUp size={12} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleMoveLayer(el.id, 'down'); }} className="p-1 hover:bg-blue-200 rounded text-blue-600" title="Move Down"><ArrowDown size={12} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleMoveLayer(el.id, 'back'); }} className="p-1 hover:bg-blue-200 rounded text-blue-600" title="Send to Back"><ChevronsDown size={12} /></button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {elements.length === 0 && <div className="text-center text-gray-400 py-8 text-xs">No layers found</div>}
                            </div>
                        </div>
                    )}
                </aside>

                {/* --- MAIN CANVAS AREA --- */}
                <main
                    ref={mainRef}
                    className={`flex-1 bg-gray-200 relative overflow-hidden flex flex-col items-center justify-center cursor-default ${isPanning ? 'cursor-grabbing' : ''}`}
                    onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
                    onContextMenu={onCanvasContextMenu}
                >
                    {activeTab === 'editor' && (
                        <div className="absolute top-4 z-50 bg-white/90 backdrop-blur border border-gray-200 shadow-sm rounded-lg flex items-center p-1.5 gap-2" onMouseDown={e => e.stopPropagation()}>
                            <div className="flex gap-1 pr-2 border-r border-gray-200 items-center">
                                <button onClick={() => setSnapEnabled(!snapEnabled)} className={`p-1.5 rounded-md ${snapEnabled ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Snap to Grid"><Magnet size={18} /></button>
                                <select
                                    value={gridSize}
                                    onChange={(e) => setGridSize(Number(e.target.value))}
                                    className="text-xs bg-transparent border-none font-medium text-gray-600 focus:ring-0 cursor-pointer"
                                    title="Grid Size (mm)"
                                >
                                    {GRID_SIZES.map(s => <option key={s} value={s}>{s}mm</option>)}
                                </select>
                                <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-md ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Toggle Grid"><Grid size={18} /></button>
                            </div>
                            <div className={`flex gap-1 px-2 border-r border-gray-200 ${selectedIds.length === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                <button onClick={() => handleAlign('left')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Align Left"><AlignStartVertical size={18} /></button>
                                <button onClick={() => handleAlign('center')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Align Center"><AlignCenterVertical size={18} /></button>
                                <button onClick={() => handleAlign('right')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Align Right"><AlignEndVertical size={18} /></button>
                                <button onClick={() => handleAlign('top')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Align Top"><AlignStartHorizontal size={18} /></button>
                                <button onClick={() => handleAlign('middle')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Align Middle"><AlignCenterHorizontal size={18} /></button>
                                <button onClick={() => handleAlign('bottom')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Align Bottom"><AlignEndHorizontal size={18} /></button>
                                {/* Add Distribute Buttons */}
                                <button onClick={() => handleAlign('distribute-v')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Distribute Vertically"><AlignVerticalDistributeCenter size={18} /></button>
                                <button onClick={() => handleAlign('distribute-h')} className="p-1.5 hover:bg-gray-100 rounded-md" title="Distribute Horizontally "><AlignHorizontalDistributeCenter size={18} /></button>
                            </div>
                            <div className="flex items-center gap-1 pl-1">
                                <button onClick={() => setViewTransform(prev => ({ ...prev, scale: Math.max(0.2, prev.scale - 0.2) }))} className="p-1.5 hover:bg-gray-100 rounded-md"><Minus size={16} /></button>
                                <div className="w-12 text-center text-xs font-mono font-medium select-none" onClick={centerView}>{Math.round(viewTransform.scale * 100)}%</div>
                                <button onClick={() => setViewTransform(prev => ({ ...prev, scale: Math.min(5, prev.scale + 0.2) }))} className="p-1.5 hover:bg-gray-100 rounded-md"><Plus size={16} /></button>
                                <button onClick={centerView} className="p-1.5 hover:bg-gray-100 rounded-md" title="Reset"><Maximize size={16} /></button>
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${viewTransform.x}px ${viewTransform.y}px` }} />

                    <div style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }} className="will-change-transform">
                        {activeTab === 'editor' ? (
                            <div ref={containerRef} className="bg-white shadow-2xl relative transition-shadow duration-300" style={{ width: `${labelSize.width * SCREEN_SCALE}px`, height: `${labelSize.height * SCREEN_SCALE}px`, backgroundImage: showGrid ? 'radial-gradient(#e5e7eb 1px, transparent 1px)' : 'none', backgroundSize: `${gridSize * SCREEN_SCALE}px ${gridSize * SCREEN_SCALE}px` }}>
                                {elements.map(el => (
                                    <DraggableElement
                                        key={el.id}
                                        element={el}
                                        isSelected={selectedIds.includes(el.id)}
                                        onSelect={handleSelect}
                                        onUpdate={updateElement}
                                        onInteractionEnd={handleInteractionEnd}
                                        onMeasure={handleMeasure}
                                        onContextMenu={onElementContextMenu} // Added
                                        onDelete={deleteElement}
                                        zoomLevel={viewTransform.scale}
                                        snapEnabled={snapEnabled}
                                        gridSize={gridSize}
                                        variableMap={allVariables}
                                    />
                                ))}
                                {marquee && (
                                    <div style={{
                                        position: 'absolute',
                                        border: '1px solid #3b82f6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        left: Math.min(marquee.startX, marquee.currentX),
                                        top: Math.min(marquee.startY, marquee.currentY),
                                        width: Math.abs(marquee.currentX - marquee.startX),
                                        height: Math.abs(marquee.currentY - marquee.startY),
                                        zIndex: 100,
                                        pointerEvents: 'none'
                                    }} />
                                )}
                                <div className="absolute -top-8 left-0 w-full flex justify-between text-[10px] text-gray-500 font-mono pointer-events-none select-none"><span>0</span><span>{labelSize.width}mm</span></div>
                                <div className="absolute top-0 -left-8 h-full flex flex-col justify-between text-[10px] text-gray-500 font-mono pointer-events-none select-none"><span>0</span><span>{labelSize.height}mm</span></div>
                            </div>
                        ) : (
                            <div className="relative flex flex-col items-center">
                                <div className="absolute bg-[#f0f4f8] shadow-md border border-[#cbd5e1]" style={{ top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', borderRadius: '4px', zIndex: 0 }} />
                                <div className="relative overflow-hidden z-10" style={{ width: `${labelSize.width * SCREEN_SCALE}px`, height: `${labelSize.height * SCREEN_SCALE}px`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fffdf9', filter: 'contrast(1.05) brightness(0.98)', borderRadius: '2px' }}>
                                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-20 mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, backgroundSize: '150px 150px' }} />
                                    {elements.map(el => (
                                        <PreviewElement key={el.id} element={el} variableMap={allVariables} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Context Menu */}
                    {contextMenu && (
                        <div
                            className="fixed bg-white border border-gray-200 shadow-lg rounded-md py-1 z-[100] min-w-[160px]"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                        >
                            {contextMenu.type === 'element' ? (
                                <>
                                    <button onClick={() => { handleDuplicate(); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <Copy size={14} /> Duplicate
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button onClick={() => { handleMoveLayer(contextMenu.id, 'front'); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <ChevronsUp size={14} /> Bring to Front
                                    </button>
                                    <button onClick={() => { handleMoveLayer(contextMenu.id, 'back'); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <ChevronsDown size={14} /> Send to Back
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button onClick={() => { deleteElement(); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { addElement('text'); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <Type size={14} /> Add Text
                                    </button>
                                    <button onClick={() => { addElement('barcode'); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <Barcode size={14} /> Add Barcode
                                    </button>
                                    <button onClick={() => { addElement('qrcode'); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <QrCode size={14} /> Add QR Code
                                    </button>
                                    <button onClick={() => { addElement('box'); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <Square size={14} /> Add Box
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button onClick={() => { centerView(); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <Maximize size={14} /> Reset View
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </main>

                {/* --- RIGHT PROPERTIES PANEL --- */}
                {primarySelection && activeTab === 'editor' ? (
                    <aside className="w-64 bg-white border-l border-gray-200 p-5 flex flex-col shadow-lg z-10 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-800">Properties {selectedIds.length > 1 && `(${selectedIds.length})`}</h3>
                            <button onClick={deleteElement} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md" title="Delete"><Trash2 size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Content / Variable</label>
                                <input type="text" value={primarySelection.content || ''} onChange={(e) => { updateElement(primarySelection.id, { content: e.target.value }); handleInteractionEnd(); }} disabled={primarySelection.type === 'box'} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-medium text-gray-500 mb-1">X (mm)</label><input type="number" value={Math.round(primarySelection.x * 10) / 10} onChange={(e) => updateElement(primarySelection.id, { x: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Y (mm)</label><input type="number" value={Math.round(primarySelection.y * 10) / 10} onChange={(e) => updateElement(primarySelection.id, { y: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" /></div>
                            </div>

                            {primarySelection.type === 'text' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Font Family</label>
                                        <select value={primarySelection.fontFamily || 'Arial, sans-serif'} onChange={(e) => { updateElement(primarySelection.id, { fontFamily: e.target.value }); handleInteractionEnd(); }} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">
                                            {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1"><label className="text-xs font-medium text-gray-500">Font Size</label><span className="text-xs text-gray-400">{primarySelection.fontSize}px</span></div>
                                        <div className="flex gap-2 items-center">
                                            <input type="range" min="8" max="72" value={primarySelection.fontSize} onChange={(e) => updateElement(primarySelection.id, { fontSize: Number(e.target.value) })} onMouseUp={handleInteractionEnd} className="flex-1 accent-blue-600" />
                                            <input type="number" value={primarySelection.fontSize} onChange={(e) => { updateElement(primarySelection.id, { fontSize: Number(e.target.value) }); handleInteractionEnd(); }} className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-xs text-center" />
                                        </div>
                                        <div className="mt-3">
                                            <button onClick={() => { updateElement(primarySelection.id, { fontWeight: primarySelection.fontWeight === 'bold' ? 'normal' : 'bold' }); handleInteractionEnd(); }} className={`w-full py-1.5 text-xs border rounded ${primarySelection.fontWeight === 'bold' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}>Bold</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(primarySelection.type === 'barcode' || primarySelection.type === 'qrcode' || primarySelection.type === 'box') && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Width</label><input type="number" value={Math.round(primarySelection.width)} onChange={(e) => updateElement(primarySelection.id, { width: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Height</label><input type="number" value={Math.round(primarySelection.height)} onChange={(e) => updateElement(primarySelection.id, { height: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" /></div>
                                </div>
                            )}

                            {primarySelection.type === 'qrcode' && (
                                <>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" id="qrBorder" checked={primarySelection.showBorder || false} onChange={(e) => updateElement(primarySelection.id, { showBorder: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <label htmlFor="qrBorder" className="text-xs font-medium text-gray-600 select-none">Show Border</label>
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Clearance (Padding)</label>
                                        <input type="number" min="0" max="10" step="0.5" value={primarySelection.padding || 0} onChange={(e) => updateElement(primarySelection.id, { padding: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" />
                                    </div>
                                </>
                            )}

                            {primarySelection.type === 'box' && (
                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Thickness (mm)</label><input type="number" step="0.1" value={primarySelection.strokeWidth} onChange={(e) => updateElement(primarySelection.id, { strokeWidth: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" /></div>
                            )}
                        </div>
                    </aside>
                ) : (
                    <aside className="w-64 bg-gray-50 border-l border-gray-200 p-8 flex flex-col items-center justify-center text-center text-gray-400 shrink-0">
                        <MousePointer2 size={48} className="mb-4 text-gray-300" />
                        <p className="text-sm font-medium">Select elements to edit</p>
                        <p className="text-xs mt-2 text-gray-400">Hold Ctrl/Cmd to select multiple</p>
                    </aside>
                )}
            </div>

            {showCodeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Code size={18} /> Generated {printerLang} Code
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showComments"
                                        checked={showComments}
                                        onChange={(e) => setShowComments(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="showComments" className="text-xs font-medium text-gray-600 select-none">Show Comments</label>
                                </div>
                                <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                            </div>
                        </div>
                        <div className="p-0 flex-1 overflow-auto bg-[#1e1e1e]"><pre className="text-green-400 font-mono text-sm p-6 whitespace-pre-wrap break-all">{generatedCode}</pre></div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3"><button onClick={() => setShowCodeModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Close</button><button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2" onClick={() => { const el = document.createElement('textarea'); el.value = generatedCode; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }}><Download size={16} /> Copy to Clipboard</button></div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmationState.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-full flex-shrink-0">
                                    <AlertCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirmationState.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{confirmationState.message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setConfirmationState({ ...confirmationState, isOpen: false })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 border border-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmationState.onConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Variable Modal */}
            {isVarModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Add Custom Variable</h3>
                            <button onClick={() => setIsVarModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Variable Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. batch_no"
                                    value={newVarName}
                                    onChange={(e) => setNewVarName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mock Value</label>
                                <input
                                    type="text"
                                    placeholder="e.g. B-99281"
                                    value={newVarValue}
                                    onChange={(e) => setNewVarValue(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setIsVarModalOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={handleAddCustomVar} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Add Variable</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
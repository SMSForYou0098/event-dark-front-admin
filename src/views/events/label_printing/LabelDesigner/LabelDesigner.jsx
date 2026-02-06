/**
 * Label Designer Component
 * 
 * Visual drag-and-drop interface for designing label layouts:
 * - Drag fields from palette onto label canvas
 * - Resize label dimensions by dragging edges
 * - Reposition elements within the label
 * - Resize individual elements
 * - Configure font sizes and styles
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Space, Tag, Slider, InputNumber, Select, Tooltip, message } from 'antd';
import {
    DragOutlined,
    DeleteOutlined,
    FontSizeOutlined,
    UndoOutlined,
    CopyOutlined,
    QrcodeOutlined,
    UserOutlined,
    BankOutlined,
    PhoneOutlined,
    IdcardOutlined,
    ShopOutlined,
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    BoldOutlined,
} from '@ant-design/icons';
import './LabelDesigner.css';

// Available field templates
const FIELD_TEMPLATES = [
    { id: 'name', label: 'Name', icon: <UserOutlined />, defaultWidth: 150, defaultHeight: 30, defaultFontSize: 18 },
    { id: 'surname', label: 'Surname', icon: <UserOutlined />, defaultWidth: 150, defaultHeight: 30, defaultFontSize: 18 },
    { id: 'company_name', label: 'Company', icon: <BankOutlined />, defaultWidth: 180, defaultHeight: 26, defaultFontSize: 14 },
    { id: 'designation', label: 'Designation', icon: <IdcardOutlined />, defaultWidth: 160, defaultHeight: 24, defaultFontSize: 12 },
    { id: 'number', label: 'Phone', icon: <PhoneOutlined />, defaultWidth: 140, defaultHeight: 22, defaultFontSize: 11 },
    { id: 'stall_number', label: 'Stall No.', icon: <ShopOutlined />, defaultWidth: 100, defaultHeight: 28, defaultFontSize: 14 },
    { id: 'qrcode', label: 'QR Code', icon: <QrcodeOutlined />, defaultWidth: 80, defaultHeight: 80, isQR: true },
];

// Label size presets in mm
const LABEL_PRESETS = [
    { value: '2x2', label: '2" x 2"', width: 50.8, height: 50.8 },
    { value: '2x1', label: '2" x 1"', width: 50.8, height: 25.4 },
    { value: '3x2', label: '3" x 2"', width: 76.2, height: 50.8 },
    { value: '4x2', label: '4" x 2"', width: 101.6, height: 50.8 },
    { value: '4x3', label: '4" x 3"', width: 101.6, height: 76.2 },
];

// Convert mm to pixels for display (1mm ≈ 3.78px at 96dpi, but we use 4 for nicer scaling)
const MM_TO_PX = 4;

const LabelDesigner = ({ onConfigChange, initialConfig }) => {
    // Canvas ref for drag calculations
    const canvasRef = useRef(null);
    
    // Label dimensions in mm
    const [labelWidth, setLabelWidth] = useState(initialConfig?.labelWidth || 50.8);
    const [labelHeight, setLabelHeight] = useState(initialConfig?.labelHeight || 50.8);
    const [selectedPreset, setSelectedPreset] = useState('2x2');
    
    // Elements on the label
    const [elements, setElements] = useState(initialConfig?.elements || []);
    const [selectedElement, setSelectedElement] = useState(null);
    
    // Drag state
    const [isDraggingNew, setIsDraggingNew] = useState(false);
    const [draggedTemplate, setDraggedTemplate] = useState(null);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    // Resize state for label
    const [isResizingLabel, setIsResizingLabel] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    
    // Resize state for elements
    const [isResizingElement, setIsResizingElement] = useState(false);
    const [elementResizeStart, setElementResizeStart] = useState(null);

    // History for undo
    const [history, setHistory] = useState([]);

    // Notify parent of config changes
    useEffect(() => {
        if (onConfigChange) {
            onConfigChange({
                labelWidth,
                labelHeight,
                elements,
            });
        }
    }, [labelWidth, labelHeight, elements, onConfigChange]);

    // Save to history
    const saveToHistory = useCallback(() => {
        setHistory(prev => [...prev.slice(-10), { elements: [...elements], labelWidth, labelHeight }]);
    }, [elements, labelWidth, labelHeight]);

    // Undo
    const handleUndo = useCallback(() => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setElements(prev.elements);
            setLabelWidth(prev.labelWidth);
            setLabelHeight(prev.labelHeight);
            setHistory(h => h.slice(0, -1));
        }
    }, [history]);

    // Handle preset change
    const handlePresetChange = useCallback((value) => {
        saveToHistory();
        setSelectedPreset(value);
        const preset = LABEL_PRESETS.find(p => p.value === value);
        if (preset) {
            setLabelWidth(preset.width);
            setLabelHeight(preset.height);
        }
    }, [saveToHistory]);

    // Start dragging new field from palette
    const handlePaletteDragStart = useCallback((e, template) => {
        e.dataTransfer.setData('text/plain', template.id);
        e.dataTransfer.effectAllowed = 'copy';
        setIsDraggingNew(true);
        setDraggedTemplate(template);
    }, []);

    // Handle drop on canvas
    const handleCanvasDrop = useCallback((e) => {
        e.preventDefault();
        if (!canvasRef.current || !draggedTemplate) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if field already exists
        const existingIndex = elements.findIndex(el => el.fieldId === draggedTemplate.id);
        if (existingIndex !== -1 && !draggedTemplate.isQR) {
            message.warning(`${draggedTemplate.label} field already exists on the label`);
            setIsDraggingNew(false);
            setDraggedTemplate(null);
            return;
        }

        saveToHistory();

        const newElement = {
            id: `${draggedTemplate.id}-${Date.now()}`,
            fieldId: draggedTemplate.id,
            label: draggedTemplate.label,
            x: Math.max(0, x - draggedTemplate.defaultWidth / 2),
            y: Math.max(0, y - draggedTemplate.defaultHeight / 2),
            width: draggedTemplate.defaultWidth,
            height: draggedTemplate.defaultHeight,
            fontSize: draggedTemplate.defaultFontSize || 14,
            isQR: draggedTemplate.isQR || false,
            textAlign: 'center',
            fontWeight: 'normal',
        };

        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
        setIsDraggingNew(false);
        setDraggedTemplate(null);
    }, [draggedTemplate, elements, saveToHistory]);

    // Handle drag over canvas
    const handleCanvasDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    // Start dragging existing element
    const handleElementMouseDown = useCallback((e, element) => {
        e.stopPropagation();
        if (e.target.classList.contains('resize-handle')) return;

        setSelectedElement(element.id);
        setIsDraggingElement(true);
        
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });

        saveToHistory();
    }, [saveToHistory]);

    // Handle mouse move for element dragging
    const handleMouseMove = useCallback((e) => {
        if (!canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Handle element dragging
        if (isDraggingElement && selectedElement) {
            const newX = e.clientX - canvasRect.left - dragOffset.x;
            const newY = e.clientY - canvasRect.top - dragOffset.y;

            setElements(prev => prev.map(el => {
                if (el.id === selectedElement) {
                    return {
                        ...el,
                        x: Math.max(0, Math.min(newX, labelWidth * MM_TO_PX - el.width)),
                        y: Math.max(0, Math.min(newY, labelHeight * MM_TO_PX - el.height)),
                    };
                }
                return el;
            }));
        }

        // Handle element resizing
        if (isResizingElement && elementResizeStart) {
            const deltaX = e.clientX - elementResizeStart.startX;
            const deltaY = e.clientY - elementResizeStart.startY;

            setElements(prev => prev.map(el => {
                if (el.id === elementResizeStart.elementId) {
                    return {
                        ...el,
                        width: Math.max(40, elementResizeStart.startWidth + deltaX),
                        height: Math.max(20, elementResizeStart.startHeight + deltaY),
                    };
                }
                return el;
            }));
        }

        // Handle label resizing
        if (isResizingLabel && resizeDirection) {
            const deltaX = (e.clientX - resizeStart.x) / MM_TO_PX;
            const deltaY = (e.clientY - resizeStart.y) / MM_TO_PX;

            let newWidth = resizeStart.width;
            let newHeight = resizeStart.height;

            if (resizeDirection.includes('e')) newWidth = Math.max(20, resizeStart.width + deltaX);
            if (resizeDirection.includes('s')) newHeight = Math.max(20, resizeStart.height + deltaY);

            setLabelWidth(Math.round(newWidth * 10) / 10);
            setLabelHeight(Math.round(newHeight * 10) / 10);
            setSelectedPreset('custom');
        }
    }, [isDraggingElement, selectedElement, dragOffset, labelWidth, labelHeight, isResizingElement, elementResizeStart, isResizingLabel, resizeDirection, resizeStart]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setIsDraggingElement(false);
        setIsResizingElement(false);
        setIsResizingLabel(false);
        setResizeDirection(null);
    }, []);

    // Start resizing element
    const handleElementResizeStart = useCallback((e, element) => {
        e.stopPropagation();
        saveToHistory();
        setIsResizingElement(true);
        setSelectedElement(element.id);
        setElementResizeStart({
            elementId: element.id,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: element.width,
            startHeight: element.height,
        });
    }, [saveToHistory]);

    // Start resizing label
    const handleLabelResizeStart = useCallback((e, direction) => {
        e.stopPropagation();
        saveToHistory();
        setIsResizingLabel(true);
        setResizeDirection(direction);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: labelWidth,
            height: labelHeight,
        });
    }, [labelWidth, labelHeight, saveToHistory]);

    // Delete selected element
    const handleDeleteElement = useCallback(() => {
        if (selectedElement) {
            saveToHistory();
            setElements(prev => prev.filter(el => el.id !== selectedElement));
            setSelectedElement(null);
        }
    }, [selectedElement, saveToHistory]);

    // Update element property
    const updateElementProperty = useCallback((property, value) => {
        if (!selectedElement) return;
        setElements(prev => prev.map(el => {
            if (el.id === selectedElement) {
                return { ...el, [property]: value };
            }
            return el;
        }));
    }, [selectedElement]);

    // Get selected element data
    const selectedElementData = elements.find(el => el.id === selectedElement);

    // Clear canvas click deselects
    const handleCanvasClick = useCallback((e) => {
        if (e.target === canvasRef.current) {
            setSelectedElement(null);
        }
    }, []);

    // Export config
    const handleExportConfig = useCallback(() => {
        const config = {
            labelWidth,
            labelHeight,
            elements: elements.map(el => ({
                fieldId: el.fieldId,
                x: el.x / (labelWidth * MM_TO_PX),
                y: el.y / (labelHeight * MM_TO_PX),
                width: el.width / (labelWidth * MM_TO_PX),
                height: el.height / (labelHeight * MM_TO_PX),
                fontSize: el.fontSize,
                textAlign: el.textAlign,
                fontWeight: el.fontWeight,
                isQR: el.isQR,
            })),
        };
        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
        message.success('Configuration copied to clipboard');
    }, [labelWidth, labelHeight, elements]);

    // Add event listeners
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div className="label-designer">
            {/* Toolbar */}
            <div className="ld-toolbar">
                <Space wrap>
                    <Select
                        value={selectedPreset}
                        onChange={handlePresetChange}
                        style={{ width: 140 }}
                        options={[
                            ...LABEL_PRESETS.map(p => ({ value: p.value, label: p.label })),
                            { value: 'custom', label: 'Custom' },
                        ]}
                    />
                    
                    <Space.Compact>
                        <InputNumber
                            value={labelWidth}
                            onChange={(v) => { setLabelWidth(v); setSelectedPreset('custom'); }}
                            min={20}
                            max={200}
                            step={0.1}
                            addonBefore="W"
                            addonAfter="mm"
                            style={{ width: 120 }}
                        />
                        <InputNumber
                            value={labelHeight}
                            onChange={(v) => { setLabelHeight(v); setSelectedPreset('custom'); }}
                            min={20}
                            max={200}
                            step={0.1}
                            addonBefore="H"
                            addonAfter="mm"
                            style={{ width: 120 }}
                        />
                    </Space.Compact>

                    <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={history.length === 0}>
                        Undo
                    </Button>
                    <Button icon={<CopyOutlined />} onClick={handleExportConfig}>
                        Export Config
                    </Button>
                </Space>
            </div>

            <div className="ld-content">
                {/* Field Palette */}
                <div className="ld-palette">
                    <div className="ld-palette-title">
                        <DragOutlined /> Drag Fields
                    </div>
                    <div className="ld-palette-fields">
                        {FIELD_TEMPLATES.map(template => {
                            const isUsed = elements.some(el => el.fieldId === template.id);
                            return (
                                <div
                                    key={template.id}
                                    className={`ld-palette-field ${isUsed ? 'used' : ''}`}
                                    draggable={!isUsed}
                                    onDragStart={(e) => handlePaletteDragStart(e, template)}
                                    onDragEnd={() => {
                                        setIsDraggingNew(false);
                                        setDraggedTemplate(null);
                                    }}
                                >
                                    {template.icon}
                                    <span>{template.label}</span>
                                    {isUsed && <Tag size="small" color="success">Added</Tag>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="ld-canvas-wrapper">
                    <div className="ld-canvas-info">
                        {labelWidth}mm × {labelHeight}mm
                    </div>
                    <div
                        ref={canvasRef}
                        className={`ld-canvas ${isDraggingNew ? 'drop-target' : ''}`}
                        style={{
                            width: labelWidth * MM_TO_PX,
                            height: labelHeight * MM_TO_PX,
                        }}
                        onDrop={handleCanvasDrop}
                        onDragOver={handleCanvasDragOver}
                        onClick={handleCanvasClick}
                    >
                        {/* Render elements */}
                        {elements.map(element => (
                            <div
                                key={element.id}
                                className={`ld-element ${selectedElement === element.id ? 'selected' : ''}`}
                                style={{
                                    left: element.x,
                                    top: element.y,
                                    width: element.width,
                                    height: element.height,
                                    fontSize: element.fontSize,
                                    textAlign: element.textAlign,
                                    fontWeight: element.fontWeight,
                                }}
                                onMouseDown={(e) => handleElementMouseDown(e, element)}
                            >
                                {element.isQR ? (
                                    <div className="ld-qr-placeholder">
                                        <QrcodeOutlined style={{ fontSize: Math.min(element.width, element.height) * 0.6 }} />
                                    </div>
                                ) : (
                                    <span>{element.label}</span>
                                )}
                                
                                {selectedElement === element.id && (
                                    <>
                                        <div
                                            className="resize-handle se"
                                            onMouseDown={(e) => handleElementResizeStart(e, element)}
                                        />
                                        <div className="ld-element-actions">
                                            <Tooltip title="Delete">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteElement(); }}
                                                />
                                            </Tooltip>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Label resize handles */}
                        <div
                            className="label-resize-handle e"
                            onMouseDown={(e) => handleLabelResizeStart(e, 'e')}
                        />
                        <div
                            className="label-resize-handle s"
                            onMouseDown={(e) => handleLabelResizeStart(e, 's')}
                        />
                        <div
                            className="label-resize-handle se"
                            onMouseDown={(e) => handleLabelResizeStart(e, 'se')}
                        />

                        {/* Empty state */}
                        {elements.length === 0 && (
                            <div className="ld-empty-state">
                                <DragOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                                <div>Drag fields here</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="ld-properties">
                    <div className="ld-properties-title">
                        Properties
                    </div>
                    {selectedElementData ? (
                        <div className="ld-properties-content">
                            <div className="ld-prop-group">
                                <label>Field</label>
                                <Tag color="red">{selectedElementData.label}</Tag>
                            </div>

                            {!selectedElementData.isQR && (
                                <>
                                    <div className="ld-prop-group">
                                        <label><FontSizeOutlined /> Font Size</label>
                                        <Slider
                                            min={8}
                                            max={36}
                                            value={selectedElementData.fontSize}
                                            onChange={(v) => updateElementProperty('fontSize', v)}
                                        />
                                        <InputNumber
                                            min={8}
                                            max={36}
                                            value={selectedElementData.fontSize}
                                            onChange={(v) => updateElementProperty('fontSize', v)}
                                            size="small"
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <div className="ld-prop-group">
                                        <label>Text Align</label>
                                        <Space.Compact block>
                                            <Button
                                                type={selectedElementData.textAlign === 'left' ? 'primary' : 'default'}
                                                icon={<AlignLeftOutlined />}
                                                onClick={() => updateElementProperty('textAlign', 'left')}
                                            />
                                            <Button
                                                type={selectedElementData.textAlign === 'center' ? 'primary' : 'default'}
                                                icon={<AlignCenterOutlined />}
                                                onClick={() => updateElementProperty('textAlign', 'center')}
                                            />
                                            <Button
                                                type={selectedElementData.textAlign === 'right' ? 'primary' : 'default'}
                                                icon={<AlignRightOutlined />}
                                                onClick={() => updateElementProperty('textAlign', 'right')}
                                            />
                                        </Space.Compact>
                                    </div>

                                    <div className="ld-prop-group">
                                        <label>Font Weight</label>
                                        <Button
                                            block
                                            type={selectedElementData.fontWeight === 'bold' ? 'primary' : 'default'}
                                            icon={<BoldOutlined />}
                                            onClick={() => updateElementProperty('fontWeight', 
                                                selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold')}
                                        >
                                            {selectedElementData.fontWeight === 'bold' ? 'Bold' : 'Normal'}
                                        </Button>
                                    </div>
                                </>
                            )}

                            <div className="ld-prop-group">
                                <label>Size</label>
                                <Space.Compact block>
                                    <InputNumber
                                        value={Math.round(selectedElementData.width)}
                                        onChange={(v) => updateElementProperty('width', v)}
                                        addonBefore="W"
                                        min={20}
                                        size="small"
                                    />
                                    <InputNumber
                                        value={Math.round(selectedElementData.height)}
                                        onChange={(v) => updateElementProperty('height', v)}
                                        addonBefore="H"
                                        min={20}
                                        size="small"
                                    />
                                </Space.Compact>
                            </div>

                            <div className="ld-prop-group">
                                <label>Position</label>
                                <Space.Compact block>
                                    <InputNumber
                                        value={Math.round(selectedElementData.x)}
                                        onChange={(v) => updateElementProperty('x', v)}
                                        addonBefore="X"
                                        min={0}
                                        size="small"
                                    />
                                    <InputNumber
                                        value={Math.round(selectedElementData.y)}
                                        onChange={(v) => updateElementProperty('y', v)}
                                        addonBefore="Y"
                                        min={0}
                                        size="small"
                                    />
                                </Space.Compact>
                            </div>

                            <Button
                                danger
                                block
                                icon={<DeleteOutlined />}
                                onClick={handleDeleteElement}
                                style={{ marginTop: 16 }}
                            >
                                Remove Field
                            </Button>
                        </div>
                    ) : (
                        <div className="ld-properties-empty">
                            Select an element to edit its properties
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelDesigner;

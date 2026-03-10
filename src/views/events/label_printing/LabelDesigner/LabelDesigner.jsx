/**
 * Clean, mm-based Label Designer
 * - Coordinates and sizes stored in mm (no px for dimensions)
 * - HTML5 drag/drop from palette -> canvas
 * - Click and drag to move elements on canvas
 * - Simple resize via properties panel (no freeform corner resize)
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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

const MM_TO_PX = 4; // rendering scale

const FIELD_TEMPLATES = [
    { id: 'name', label: 'Name', icon: <UserOutlined />, defaultWidthMm: 40, defaultHeightMm: 8, defaultFontSize: 6 },
    { id: 'surname', label: 'Surname', icon: <UserOutlined />, defaultWidthMm: 40, defaultHeightMm: 8, defaultFontSize: 6 },
    { id: 'company_name', label: 'Company', icon: <BankOutlined />, defaultWidthMm: 48, defaultHeightMm: 8, defaultFontSize: 5 },
    { id: 'designation', label: 'Designation', icon: <IdcardOutlined />, defaultWidthMm: 44, defaultHeightMm: 7, defaultFontSize: 4 },
    { id: 'number', label: 'Phone', icon: <PhoneOutlined />, defaultWidthMm: 36, defaultHeightMm: 7, defaultFontSize: 4 },
    { id: 'stall_number', label: 'Stall No.', icon: <ShopOutlined />, defaultWidthMm: 30, defaultHeightMm: 8, defaultFontSize: 6 },
    { id: 'qrcode', label: 'QR Code', icon: <QrcodeOutlined />, defaultWidthMm: 20, defaultHeightMm: 20, isQR: true },
];

const LABEL_PRESETS = [
    { value: '2x2', label: '2" x 2"', width: 50.8, height: 50.8 },
    { value: '2x1', label: '2" x 1"', width: 50.8, height: 25.4 },
    { value: '3x2', label: '3" x 2"', width: 76.2, height: 50.8 },
    { value: '4x2', label: '4" x 2"', width: 101.6, height: 50.8 },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const LabelDesigner = ({ onConfigChange, initialConfig, availableFields = [] }) => {
    const canvasRef = useRef(null);

    const [labelWidth, setLabelWidth] = useState(initialConfig?.labelWidth || 50.8);
    const [labelHeight, setLabelHeight] = useState(initialConfig?.labelHeight || 50.8);
    const [selectedPreset, setSelectedPreset] = useState('2x2');

    // elements store coordinates/sizes in mm
    const [elements, setElements] = useState(() => (initialConfig?.elements || []).map((el, idx) => ({
        id: el.id || `el-${Date.now()}-${idx}`,
        fieldId: el.fieldId,
        label: el.label || el.fieldId,
        x: el.x || 5,
        y: el.y || 5,
        width: el.width || 20,
        height: el.height || 8,
        fontSize: el.fontSize || 6,
        isQR: el.isQR || false,
        textAlign: el.textAlign || 'center',
        fontWeight: el.fontWeight || 'normal',
    })));

    const [selectedId, setSelectedId] = useState(null);
    const [dragging, setDragging] = useState(null); // { id, offsetXmm, offsetYmm }

    // merge available fields into palette
    const uploadedTemplates = useMemo(() => (availableFields || []).map(f => ({
        id: f.id,
        label: f.label,
        icon: <UserOutlined />,
        defaultWidthMm: 40,
        defaultHeightMm: 8,
        defaultFontSize: 6,
    })), [availableFields]);

    const mergedTemplates = useMemo(() => {
        const map = new Map();
        uploadedTemplates.forEach(t => map.set(t.id, t));
        FIELD_TEMPLATES.forEach(t => { if (!map.has(t.id)) map.set(t.id, t); });
        return Array.from(map.values());
    }, [uploadedTemplates]);

    // notify parent when config changes
    useEffect(() => {
        onConfigChange && onConfigChange({ labelWidth, labelHeight, elements });
    }, [labelWidth, labelHeight, elements, onConfigChange]);

    // drag start from palette - only transfer template id (avoid serializing React nodes)
    const onPaletteDragStart = useCallback((e, template) => {
        e.dataTransfer.setData('text/plain', template.id);
        e.dataTransfer.effectAllowed = 'copy';
    }, []);

    const onCanvasDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const onCanvasDrop = useCallback((e) => {
        e.preventDefault();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const tmplId = e.dataTransfer.getData('text/plain');
        if (!tmplId) return;
        const template = mergedTemplates.find(t => t.id === tmplId);
        if (!template) return;

        // compute mm position
        const xPx = e.clientX - rect.left;
        const yPx = e.clientY - rect.top;
        const xMm = clamp(xPx / MM_TO_PX - (template.defaultWidthMm || template.defaultWidth || 20) / 2, 0, labelWidth - (template.defaultWidthMm || 20));
        const yMm = clamp(yPx / MM_TO_PX - (template.defaultHeightMm || template.defaultHeight || 8) / 2, 0, labelHeight - (template.defaultHeightMm || 8));

        // prevent duplicate non-QR fields
        if (!template.isQR && elements.some(el => el.fieldId === template.id)) {
            message.warning(`${template.label} already on label`);
            return;
        }

        const el = {
            id: `${template.id}-${Date.now()}`,
            fieldId: template.id,
            label: template.label || template.id,
            x: Math.round(xMm * 10) / 10,
            y: Math.round(yMm * 10) / 10,
            width: template.defaultWidthMm || template.defaultWidth || 30,
            height: template.defaultHeightMm || template.defaultHeight || 8,
            fontSize: template.defaultFontSize || template.defaultFontSizeMm || 6,
            isQR: template.isQR || false,
            textAlign: 'center',
            fontWeight: 'normal',
        };

        setElements(prev => [...prev, el]);
        setSelectedId(el.id);
    }, [elements, labelWidth, labelHeight, mergedTemplates]);

    // start moving existing element
    const onElementMouseDown = useCallback((e, el) => {
        e.stopPropagation();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const startXpx = e.clientX - rect.left;
        const startYpx = e.clientY - rect.top;
        const offsetXmm = startXpx / MM_TO_PX - el.x;
        const offsetYmm = startYpx / MM_TO_PX - el.y;
        setDragging({ id: el.id, offsetXmm, offsetYmm });
        setSelectedId(el.id);
    }, []);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const xMm = clamp((e.clientX - rect.left) / MM_TO_PX - dragging.offsetXmm, 0, labelWidth - 1);
            const yMm = clamp((e.clientY - rect.top) / MM_TO_PX - dragging.offsetYmm, 0, labelHeight - 1);
            setElements(prev => prev.map(el => el.id === dragging.id ? { ...el, x: Math.round(xMm * 10)/10, y: Math.round(yMm*10)/10 } : el));
        };
        const onMouseUp = () => { setDragging(null); };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    }, [dragging, labelWidth, labelHeight]);

    const deleteSelected = useCallback(() => {
        if (!selectedId) return;
        setElements(prev => prev.filter(p => p.id !== selectedId));
        setSelectedId(null);
    }, [selectedId]);

    const updateSelected = useCallback((prop, value) => {
        if (!selectedId) return;
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, [prop]: value } : el));
    }, [selectedId]);

    const exportConfig = useCallback(() => {
        const cfg = { labelWidth, labelHeight, elements };
        navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
        message.success('Configuration copied to clipboard');
    }, [labelWidth, labelHeight, elements]);

    const selectedEl = elements.find(e => e.id === selectedId);

    return (
        <div className="label-designer">
            <div className="ld-toolbar">
                <Space wrap>
                    <Select
                        value={selectedPreset}
                        onChange={(v) => {
                            const p = LABEL_PRESETS.find(x => x.value === v);
                            if (p) { setLabelWidth(p.width); setLabelHeight(p.height); setSelectedPreset(v); }
                        }}
                        style={{ width: 160 }}
                        options={[...LABEL_PRESETS.map(p => ({ value: p.value, label: p.label })), { value: 'custom', label: 'Custom' }]}
                    />

                    <Space.Compact>
                        <InputNumber value={labelWidth} onChange={(v) => setLabelWidth(v)} addonBefore="W" addonAfter="mm" />
                        <InputNumber value={labelHeight} onChange={(v) => setLabelHeight(v)} addonBefore="H" addonAfter="mm" />
                    </Space.Compact>

                    <Button icon={<UndoOutlined />} disabled>
                        Undo
                    </Button>
                    <Button icon={<CopyOutlined />} onClick={exportConfig}>Export Config</Button>
                </Space>
            </div>

            <div className="ld-content">
                <div className="ld-palette">
                    <div className="ld-palette-title"><DragOutlined /> Drag Fields</div>
                    <div className="ld-palette-fields">
                        {mergedTemplates.map(t => {
                            const used = elements.some(e => e.fieldId === t.id) && !t.isQR;
                            return (
                                <div
                                    key={t.id}
                                    className={`ld-palette-field ${used ? 'used' : ''}`}
                                    draggable={!used}
                                    onDragStart={(e) => onPaletteDragStart(e, t)}
                                >
                                    {t.icon}
                                    <span>{t.label}</span>
                                    {used && <Tag size="small" color="success">Added</Tag>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="ld-canvas-wrapper">
                    <div className="ld-canvas-info">{labelWidth}mm × {labelHeight}mm</div>
                    <div
                        ref={canvasRef}
                        className="ld-canvas"
                        style={{ width: labelWidth * MM_TO_PX, height: labelHeight * MM_TO_PX }}
                        onDragOver={onCanvasDragOver}
                        onDrop={onCanvasDrop}
                        onClick={() => setSelectedId(null)}
                    >
                        {elements.map(el => (
                            <div
                                key={el.id}
                                className={`ld-element ${selectedId === el.id ? 'selected' : ''}`}
                                style={{
                                    left: el.x * MM_TO_PX,
                                    top: el.y * MM_TO_PX,
                                    width: el.width * MM_TO_PX,
                                    height: el.height * MM_TO_PX,
                                    fontSize: `${el.fontSize}mm`,
                                    textAlign: el.textAlign,
                                    fontWeight: el.fontWeight,
                                }}
                                onMouseDown={(e) => onElementMouseDown(e, el)}
                            >
                                {el.isQR ? (
                                    <div className="ld-qr-placeholder"><QrcodeOutlined style={{ fontSize: Math.min(el.width, el.height) * MM_TO_PX * 0.6 }} /></div>
                                ) : (
                                    <span>{el.label}</span>
                                )}
                            </div>
                        ))}

                        {elements.length === 0 && (
                            <div className="ld-empty-state"><DragOutlined style={{ fontSize: 32 }} /><div>Drag fields here</div></div>
                        )}
                    </div>
                </div>

                <div className="ld-properties">
                    <div className="ld-properties-title">Properties</div>
                    {selectedEl ? (
                        <div className="ld-properties-content">
                            <div className="ld-prop-group"><label>Field</label><Tag color="red">{selectedEl.label}</Tag></div>

                            {!selectedEl.isQR && (
                                <>
                                    <div className="ld-prop-group"><label><FontSizeOutlined /> Font Size (mm)</label>
                                        <Slider min={3} max={20} value={selectedEl.fontSize} onChange={(v) => updateSelected('fontSize', v)} />
                                    </div>
                                    <div className="ld-prop-group"><label>Text Align</label>
                                        <Space>
                                            <Button type={selectedEl.textAlign === 'left' ? 'primary' : 'default'} icon={<AlignLeftOutlined />} onClick={() => updateSelected('textAlign', 'left')} />
                                            <Button type={selectedEl.textAlign === 'center' ? 'primary' : 'default'} icon={<AlignCenterOutlined />} onClick={() => updateSelected('textAlign', 'center')} />
                                            <Button type={selectedEl.textAlign === 'right' ? 'primary' : 'default'} icon={<AlignRightOutlined />} onClick={() => updateSelected('textAlign', 'right')} />
                                        </Space>
                                    </div>
                                </>
                            )}

                            <div className="ld-prop-group"><label>Size (mm)</label>
                                <Space.Compact block>
                                    <InputNumber value={selectedEl.width} min={5} onChange={(v) => updateSelected('width', v)} addonBefore="W" />
                                    <InputNumber value={selectedEl.height} min={5} onChange={(v) => updateSelected('height', v)} addonBefore="H" />
                                </Space.Compact>
                            </div>

                            <div className="ld-prop-group"><label>Position (mm)</label>
                                <Space.Compact block>
                                    <InputNumber value={selectedEl.x} min={0} onChange={(v) => updateSelected('x', clamp(v, 0, labelWidth))} addonBefore="X" />
                                    <InputNumber value={selectedEl.y} min={0} onChange={(v) => updateSelected('y', clamp(v, 0, labelHeight))} addonBefore="Y" />
                                </Space.Compact>
                            </div>

                            <Button danger block icon={<DeleteOutlined />} onClick={deleteSelected} style={{ marginTop: 16 }}>Remove Field</Button>
                        </div>
                    ) : (
                        <div className="ld-properties-empty">Select an element to edit its properties</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelDesigner;

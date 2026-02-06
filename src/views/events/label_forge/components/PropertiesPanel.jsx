// Properties Panel Component for Label Forge

import React from 'react';
import { Input, InputNumber, Select, Slider, Button, Checkbox } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { MousePointer2 } from 'lucide-react';
import { FONTS } from '../constants';

/**
 * Right sidebar for element properties
 */
const PropertiesPanel = ({
    primarySelection,
    selectedIds,    
    onUpdate,
    onInteractionEnd,
    onDelete
}) => {
    if (!primarySelection) {
        return (
            <div 
                className="lf-panel border-start h-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
                style={{ width: 256, borderColor: 'var(--lf-border-secondary)' }}
            >
                <MousePointer2 size={48} className="lf-text-muted mb-3" style={{ opacity: 0.3 }} />
                <p className="lf-text-muted small fw-medium mb-1">
                    Select elements to edit
                </p>
                <p className="lf-text-muted" style={{ fontSize: 12 }}>
                    Hold Ctrl/Cmd to select multiple
                </p>
            </div>
        );
    }

    const handleChange = (field, value) => {
        onUpdate(primarySelection.id, { [field]: value });
    };

    const handleChangeWithCommit = (field, value) => {
        onUpdate(primarySelection.id, { [field]: value });
        onInteractionEnd();
    };

    return (
        <div 
            className="lf-panel border-start h-100 d-flex flex-column p-3"
            style={{ width: 256, borderColor: 'var(--lf-border-secondary)' }}
        >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0 fw-bold lf-text-heading">
                    Properties {selectedIds.length > 1 && `(${selectedIds.length})`}
                </h6>
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onDelete}
                    title="Delete"
                />
            </div>

            {/* Content */}
            <div className="overflow-auto flex-fill">
                {/* Content / Variable */}
                <div className="mb-3">
                    <label className="d-block small lf-text-muted mb-1">
                        Content / Variable
                    </label>
                    <Input
                        value={primarySelection.content || ''}
                        onChange={(e) => handleChange('content', e.target.value)}
                        onBlur={onInteractionEnd}
                        disabled={primarySelection.type === 'box'}
                    />
                </div>

                {/* Position */}
                <div className="row g-2 mb-3">
                    <div className="col-6">
                        <label className="d-block small lf-text-muted mb-1">
                            X (mm)
                        </label>
                        <InputNumber
                            className="w-100"
                            size="small"
                            value={Math.round(primarySelection.x * 10) / 10}
                            onChange={(value) => handleChange('x', value)}
                            step={0.5}
                        />
                    </div>
                    <div className="col-6">
                        <label className="d-block small lf-text-muted mb-1">
                            Y (mm)
                        </label>
                        <InputNumber
                            className="w-100"
                            size="small"
                            value={Math.round(primarySelection.y * 10) / 10}
                            onChange={(value) => handleChange('y', value)}
                            step={0.5}
                        />
                    </div>
                </div>

                {/* Text properties */}
                {primarySelection.type === 'text' && (
                    <>
                        <div className="mb-3">
                            <label className="d-block small lf-text-muted mb-1">
                                Font Family
                            </label>
                            <Select
                                className="w-100"
                                size="small"
                                value={primarySelection.fontFamily || 'Arial, sans-serif'}
                                onChange={(value) => handleChangeWithCommit('fontFamily', value)}
                                options={FONTS.map(f => ({ value: f.value, label: f.name }))}
                            />
                        </div>

                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                                <label className="small lf-text-muted">Font Size</label>
                                <span className="small lf-text-muted">{primarySelection.fontSize}px</span>
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                                <Slider
                                    className="flex-fill"
                                    min={8}
                                    max={72}
                                    value={primarySelection.fontSize}
                                    onChange={(value) => handleChange('fontSize', value)}
                                    onChangeComplete={onInteractionEnd}
                                />
                                <InputNumber
                                    size="small"
                                    style={{ width: 60 }}
                                    value={primarySelection.fontSize}
                                    onChange={(value) => handleChangeWithCommit('fontSize', value)}
                                    min={8}
                                    max={72}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <Button
                                type={primarySelection.fontWeight === 'bold' ? 'primary' : 'default'}
                                block
                                size="small"
                                onClick={() => handleChangeWithCommit(
                                    'fontWeight', 
                                    primarySelection.fontWeight === 'bold' ? 'normal' : 'bold'
                                )}
                            >
                                <strong>Bold</strong>
                            </Button>
                        </div>
                    </>
                )}

                {/* Size properties for resizable elements */}
                {(primarySelection.type === 'barcode' || 
                  primarySelection.type === 'qrcode' || 
                  primarySelection.type === 'box') && (
                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <label className="d-block small lf-text-muted mb-1">
                                Width
                            </label>
                            <InputNumber
                                className="w-100"
                                size="small"
                                value={Math.round(primarySelection.width)}
                                onChange={(value) => handleChange('width', value)}
                                min={1}
                            />
                        </div>
                        <div className="col-6">
                            <label className="d-block small lf-text-muted mb-1">
                                Height
                            </label>
                            <InputNumber
                                className="w-100"
                                size="small"
                                value={Math.round(primarySelection.height)}
                                onChange={(value) => handleChange('height', value)}
                                min={1}
                            />
                        </div>
                    </div>
                )}

                {/* QR Code specific properties */}
                {primarySelection.type === 'qrcode' && (
                    <>
                        <div className="mb-3">
                            <Checkbox
                                checked={primarySelection.showBorder || false}
                                onChange={(e) => handleChange('showBorder', e.target.checked)}
                            >
                                <span className="small">Show Border</span>
                            </Checkbox>
                        </div>

                        <div className="mb-3">
                            <label className="d-block small lf-text-muted mb-1">
                                Clearance (Padding)
                            </label>
                            <InputNumber
                                className="w-100"
                                size="small"
                                min={0}
                                max={10}
                                step={0.5}
                                value={primarySelection.padding || 0}
                                onChange={(value) => handleChange('padding', value)}
                            />
                        </div>
                    </>
                )}

                {/* Box specific properties */}
                {primarySelection.type === 'box' && (
                    <div className="mb-3">
                        <label className="d-block small lf-text-muted mb-1">
                            Thickness (mm)
                        </label>
                        <InputNumber
                            className="w-100"
                            size="small"
                            step={0.1}
                            min={0.1}
                            value={primarySelection.strokeWidth}
                            onChange={(value) => handleChange('strokeWidth', value)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel;

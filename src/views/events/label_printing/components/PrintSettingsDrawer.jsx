import React from "react";
import { Drawer, Card, Form, InputNumber, Slider, Select, Checkbox, Space, Typography, Divider, Tag } from "antd";
import { SettingsIcon } from "lucide-react";
import { AVAILABLE_FIELDS, FONT_FAMILIES } from "./constants";

const { Text } = Typography;

// Default font point sizes per label size (matches TSPL SIZE_CONFIG)
const LABEL_FONT_DEFAULTS = {
    "2x1": { namePt: 12, basePt: 8 },
    "2x2": { namePt: 16, basePt: 10 },
    "3x2": { namePt: 20, basePt: 12 },
    "4x3": { namePt: 26, basePt: 16 },
    "4x6": { namePt: 30, basePt: 18 },
    "5x4": { namePt: 30, basePt: 18 },
    "6x4": { namePt: 34, basePt: 20 },
};

const NAME_FIELDS = ['firstName', 'name', 'surname'];

/**
 * Print Settings Drawer
 * Configure font, spacing, and field-specific settings
 */
const PrintSettingsDrawer = ({
    open,
    onClose,
    selectedFields,
    setSelectedFields,
    fontFamily,
    setFontFamily,
    fontSizeMultiplier,
    setFontSizeMultiplier,
    lineGapMultiplier,
    setLineGapMultiplier,
    letterSpacing = 0,
    setLetterSpacing,
    marginMultiplier = 1.0,
    setMarginMultiplier,
    fieldFontSizes,
    setFieldFontSizes,
    isMobile,
    availableFields: availableFieldsProp,
    labelSize = "2x2",
}) => {
    // Use provided availableFields or fall back to static constant
    const availableFields = availableFieldsProp || AVAILABLE_FIELDS;
    const drawerWidth = isMobile ? "100%" : 520;
    const labelDefaults = LABEL_FONT_DEFAULTS[labelSize] || LABEL_FONT_DEFAULTS["2x2"];

    // Get the default pt size for a field (based on label size)
    const getDefaultPt = (fieldKey) => {
        return NAME_FIELDS.includes(fieldKey) ? labelDefaults.namePt : labelDefaults.basePt;
    };

    // Get the effective pt size (what will actually print)
    const getEffectivePt = (fieldKey) => {
        const basePt = fieldFontSizes[fieldKey] || getDefaultPt(fieldKey);
        return Math.max(6, Math.round(basePt * fontSizeMultiplier));
    };

    return (
        <Drawer
            title={
                <Space>
                    <SettingsIcon size={18} />
                    <span>Print Settings</span>
                </Space>
            }
            placement={isMobile ? "bottom" : "right"}
            open={open}
            onClose={onClose}
            height={isMobile ? "90%" : undefined}
            width={drawerWidth}
            styles={{
                body: { padding: isMobile ? 16 : 24 }
            }}
        >
            <Space direction="vertical" size="large" className="w-100" style={{ paddingBottom: 20 }}>
                {/* Fields Selection */}
                <Card
                    title={<Text strong>Fields to Print</Text>}
                    size="small"
                    styles={{
                        body: { padding: 16 },
                        header: { padding: '12px 16px' }
                    }}
                >
                    <Checkbox.Group
                        options={availableFields.map(f => ({
                            label: f.label,
                            value: f.key,
                        }))}
                        value={selectedFields}
                        onChange={setSelectedFields}
                        className="w-100"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}
                    />
                </Card>

                {/* Global Typography */}
                <Card
                    title={<Text strong>Global Typography</Text>}
                    size="small"
                    styles={{
                        body: { padding: 16 },
                        header: { padding: '12px 16px' }
                    }}
                >
                    <Space direction="vertical" size="middle" className="w-100">
                        <Form.Item label={<Text>Font Family</Text>} className="mb-3">
                            <Select
                                value={fontFamily}
                                onChange={setFontFamily}
                                style={{ width: "100%" }}
                                options={FONT_FAMILIES.map((f) => ({
                                    label: f.label,
                                    value: f.value,
                                }))}
                            />
                        </Form.Item>

                        <Divider className="my-2" />

                        <Form.Item label={<Text>Global Font Size Scale</Text>}>
                            <div className="d-flex align-items-center" style={{ gap: 12 }}>
                                <Slider
                                    min={50}
                                    max={300}
                                    step={10}
                                    value={Math.round(fontSizeMultiplier * 100)}
                                    onChange={(value) => setFontSizeMultiplier(value / 100)}
                                    style={{ flex: 1 }}
                                />
                                <Tag color="blue" style={{ minWidth: 50, textAlign: 'center' }}>
                                    {Math.round(fontSizeMultiplier * 100)}%
                                </Tag>
                            </div>
                        </Form.Item>

                        <Form.Item label={<Text>Line Spacing</Text>}>
                            <div className="d-flex align-items-center" style={{ gap: 12 }}>
                                <Slider
                                    min={0}
                                    max={40}
                                    step={1}
                                    value={Math.round(lineGapMultiplier * 16)}
                                    onChange={(value) => setLineGapMultiplier(value / 16)}
                                    style={{ flex: 1 }}
                                />
                                <Tag style={{ minWidth: 50, textAlign: 'center' }}>
                                    {Math.round(lineGapMultiplier * 16)}px
                                </Tag>
                            </div>
                        </Form.Item>

                        <Form.Item label={<Text>Letter Spacing</Text>}>
                            <InputNumber
                                min={0}
                                max={10}
                                step={0.5}
                                value={letterSpacing}
                                onChange={setLetterSpacing}
                                addonAfter="px"
                                style={{ width: 120 }}
                            />
                        </Form.Item>

                        <Form.Item label={<Text>Label Margin</Text>}>
                            <div className="d-flex align-items-center" style={{ gap: 12 }}>
                                <Slider
                                    min={0}
                                    max={40}
                                    step={1}
                                    value={Math.round(marginMultiplier * 4 * 10) / 10}
                                    onChange={(value) => setMarginMultiplier && setMarginMultiplier(value / 4)}
                                    style={{ flex: 1 }}
                                />
                                <Tag style={{ minWidth: 50, textAlign: 'center' }}>
                                    {(Math.round(marginMultiplier * 4 * 10) / 10)}mm
                                </Tag>
                            </div>
                        </Form.Item>
                    </Space>
                </Card>

                {/* Individual Field Font Sizes — direct point sizes */}
                {selectedFields.length > 0 && (
                    <Card
                        title={
                            <div className="d-flex justify-content-between align-items-center">
                                <Text strong>Field Font Sizes</Text>
                                <Tag color="geekblue" style={{ fontSize: 11 }}>
                                    Label: {labelSize} | Scale: {Math.round(fontSizeMultiplier * 100)}%
                                </Tag>
                            </div>
                        }
                        size="small"
                        styles={{
                            body: { padding: 16, maxHeight: isMobile ? 400 : 400, overflowY: "auto" },
                            header: { padding: '12px 16px' }
                        }}
                    >
                        <Space direction="vertical" size="small" className="w-100">
                            <div style={{ 
                                padding: '8px 12px', 
                                background: 'rgba(22, 119, 255, 0.06)', 
                                borderRadius: 6, 
                                marginBottom: 8,
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.65)'
                            }}>
                                Set each field's font size in <b>points (pt)</b>. 
                                This directly controls the thermal print size.
                                The "Effective" column shows the final size after global scaling.
                            </div>
                            {selectedFields.map((fieldValue) => {
                                const field = availableFields.find(f => f.key === fieldValue);
                                if (!field) return null;

                                const defaultPt = getDefaultPt(fieldValue);
                                const currentPt = fieldFontSizes[fieldValue] || defaultPt;
                                const effectivePt = getEffectivePt(fieldValue);

                                return (
                                    <div key={fieldValue} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '6px 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13 }}>{field.label}</Text>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <InputNumber
                                                min={6}
                                                max={72}
                                                value={Math.round(currentPt)}
                                                onChange={(value) => {
                                                    if (value !== null) {
                                                        setFieldFontSizes(prev => ({
                                                            ...prev,
                                                            [fieldValue]: value
                                                        }));
                                                    }
                                                }}
                                                addonAfter="pt"
                                                style={{ width: 100 }}
                                                size="small"
                                            />
                                            <Tag 
                                                color={effectivePt !== currentPt ? 'orange' : 'green'}
                                                style={{ minWidth: 42, textAlign: 'center', margin: 0 }}
                                            >
                                                → {effectivePt}pt
                                            </Tag>
                                        </div>
                                    </div>
                                );
                            })}
                        </Space>
                    </Card>
                )}
            </Space>
        </Drawer>
    );
};

export default PrintSettingsDrawer;

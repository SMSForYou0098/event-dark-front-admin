import React from "react";
import { Drawer, Card, Form, Slider, Select, Checkbox, Space, Row, Col, Typography, Divider } from "antd";
import { SettingsIcon } from "lucide-react";
import { AVAILABLE_FIELDS, FONT_FAMILIES } from "./constants";

const { Text } = Typography;

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
    fieldFontSizes,
    setFieldFontSizes,
    isMobile,
}) => {
    const drawerWidth = isMobile ? "100%" : 520;

    // Custom marks for sliders - only show key points to avoid overlap
    const globalMarks = {
        0.5: { style: { fontSize: '11px' }, label: '50%' },
        1.0: { style: { fontSize: '11px' }, label: '100%' },
        1.5: { style: { fontSize: '11px' }, label: '150%' },
        2.0: { style: { fontSize: '11px' }, label: '200%' },
    };

    const fieldMarks = {
        0.5: { style: { fontSize: '10px' }, label: '50%' },
        1.0: { style: { fontSize: '10px' }, label: '100%' },
        2.0: { style: { fontSize: '10px' }, label: '200%' },
        3.0: { style: { fontSize: '10px' }, label: '300%' },
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
                        options={AVAILABLE_FIELDS.map(f => ({
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

                        <Form.Item
                            label={
                                <Text>
                                    Line Spacing: <Text strong style={{ color: '#1677ff' }}>{Math.round(lineGapMultiplier * 100)}%</Text>
                                </Text>
                            }
                        >
                            <Slider
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                value={lineGapMultiplier}
                                onChange={setLineGapMultiplier}
                                marks={globalMarks}
                                tooltip={{
                                    formatter: (value) => `${Math.round(value * 100)}%`
                                }}
                            />
                        </Form.Item>
                    </Space>
                </Card>

                {/* Individual Field Font Sizes */}
                {selectedFields.length > 0 && (
                    <Card
                        title={<Text strong>Individual Field Font Sizes</Text>}
                        size="small"
                        styles={{
                            body: { padding: 16, maxHeight: isMobile ? 400 : 350, overflowY: "auto" },
                            header: { padding: '12px 16px' }
                        }}
                    >
                        <Space direction="vertical" size="large" className="w-100">
                            {selectedFields.map((fieldValue) => {
                                const field = AVAILABLE_FIELDS.find(f => f.key === fieldValue);
                                if (!field) return null;

                                const currentSize = fieldFontSizes[fieldValue] || field.defaultSize || 1.0;
                                const percentage = Math.round(currentSize * 100);

                                return (
                                    <div key={fieldValue} style={{ width: '100%' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Text strong>{field.label}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {percentage}%
                                            </Text>
                                        </div>
                                        <Slider
                                            min={0.5}
                                            max={3.0}
                                            step={0.1}
                                            value={currentSize}
                                            onChange={(value) => {
                                                setFieldFontSizes(prev => ({
                                                    ...prev,
                                                    [fieldValue]: value
                                                }));
                                            }}
                                            marks={fieldMarks}
                                            tooltip={{
                                                formatter: (value) => `${Math.round(value * 100)}%`
                                            }}
                                        />
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

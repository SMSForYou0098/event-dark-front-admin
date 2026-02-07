import React from "react";
import { Drawer, Card, Form, InputNumber, Select, Checkbox, Space, Typography, Divider } from "antd";
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
    letterSpacing = 0,
    setLetterSpacing,
    fieldFontSizes,
    setFieldFontSizes,
    isMobile,
}) => {
    const drawerWidth = isMobile ? "100%" : 520;
    const BASE_FONT_SIZE = 16; // Base font size in pixels

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

                        <Form.Item label={<Text>Line Spacing</Text>}>
                            <InputNumber
                                min={4}
                                max={64}
                                value={Math.round(lineGapMultiplier * BASE_FONT_SIZE)}
                                onChange={(value) => setLineGapMultiplier(value / BASE_FONT_SIZE)}
                                addonAfter="px"
                                style={{ width: 120 }}
                            />
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
                        <Space direction="vertical" size="middle" className="w-100">
                            {selectedFields.map((fieldValue) => {
                                const field = AVAILABLE_FIELDS.find(f => f.key === fieldValue);
                                if (!field) return null;

                                const currentSize = fieldFontSizes[fieldValue] || field.defaultSize || 1.0;
                                const pxValue = Math.round(currentSize * BASE_FONT_SIZE);

                                return (
                                    <div key={fieldValue} className="d-flex justify-content-between align-items-center">
                                        <Text>{field.label}</Text>
                                        <InputNumber
                                            min={8}
                                            max={72}
                                            value={pxValue}
                                            onChange={(value) => {
                                                setFieldFontSizes(prev => ({
                                                    ...prev,
                                                    [fieldValue]: value / BASE_FONT_SIZE
                                                }));
                                            }}
                                            addonAfter="px"
                                            style={{ width: 120 }}
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

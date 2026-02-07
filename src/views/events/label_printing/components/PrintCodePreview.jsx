import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, Input, Select, Space, Button, Typography, message, Tag, Alert, InputNumber, Row, Col } from "antd";
import { Copy, Printer, RefreshCw, FileCode } from "lucide-react";

const { TextArea } = Input;
const { Text } = Typography;

/**
 * TSPL Font Reference (working fonts):
 * Font "2": 12x20 - Small (good for company/long text)
 * Font "3": 16x24 - Medium (good for designation)
 * Font "4": 24x32 - Large (good for name)
 * Font "5": 32x48 - Extra Large
 * 
 * Working format: TEXT x,y,"font",rotation,x-scale,y-scale,"content"
 */
const TSPL_FONT_OPTIONS = [
    { value: "2", label: "Font 2 (12x20) - Small" },
    { value: "3", label: "Font 3 (16x24) - Medium" },
    { value: "4", label: "Font 4 (24x32) - Large" },
    { value: "5", label: "Font 5 (32x48) - XL" },
];

/**
 * ZPL Font Reference:
 * ^A0 = Scalable font (most compatible)
 * Height and width in dots (203 DPI)
 * Common sizes: 20, 25, 30, 35, 40, 50, 60, 80 dots
 */
const ZPL_SIZE_OPTIONS = [
    { value: 20, label: "20 dots (small)" },
    { value: 25, label: "25 dots" },
    { value: 30, label: "30 dots" },
    { value: 35, label: "35 dots" },
    { value: 40, label: "40 dots" },
    { value: 50, label: "50 dots (medium)" },
    { value: 60, label: "60 dots" },
    { value: 80, label: "80 dots (large)" },
];

/**
 * Print Code Preview Modal
 * Shows generated TSPL/ZPL code with editing capability
 */
const PrintCodePreview = ({
    open,
    onClose,
    printerType = "tspl",
    selectedRows = [],
    selectedFields = [],
    labelSize = "2x2",
    fontSizeMultiplier = 1.0,
    fieldFontSizes = {},
    lineGapMultiplier = 1.0,
    letterSpacing = 0,
    onPrintCustomCode,
    isConnected = false,
    isPrinting = false,
}) => {
    const [customCode, setCustomCode] = useState("");
    const [activeLabel, setActiveLabel] = useState(0);
    const [useCustomCode, setUseCustomCode] = useState(false);

    // TSPL settings - per field fonts (working values from user)
    const [tsplNameFont, setTsplNameFont] = useState("3");      // Font 3 for name
    const [tsplDesignationFont, setTsplDesignationFont] = useState("3"); // Font 3 for designation
    const [tsplCompanyFont, setTsplCompanyFont] = useState("2");  // Font 2 for company
    const [tsplOtherFont, setTsplOtherFont] = useState("3");      // Font 3 for other fields
    const [tsplStartX, setTsplStartX] = useState(5);
    const [tsplStartY, setTsplStartY] = useState(10);
    const [tsplLineGap, setTsplLineGap] = useState(50);

    // ZPL settings
    const [zplNameSize, setZplNameSize] = useState(50);
    const [zplOtherSize, setZplOtherSize] = useState(25);

    // Get label size config
    const labelConfig = useMemo(() => {
        const configs = {
            "2x1": { width: "50.8 mm", height: "25.4 mm", gap: "2 mm", startX: 5, startY: 10, lineGap: 50 },
            "2x2": { width: "50.8 mm", height: "50.8 mm", gap: "2 mm", startX: 5, startY: 20, lineGap: 60 },
            "3x2": { width: "76.2 mm", height: "50.8 mm", gap: "3 mm", startX: 10, startY: 20, lineGap: 70 },
        };
        return configs[labelSize] || configs["2x2"];
    }, [labelSize]);

    // Get font for field type
    const getFontForField = useCallback((field) => {
        if (field === 'firstName' || field === 'name' || field === 'surname') return tsplNameFont;
        if (field === 'designation') return tsplDesignationFont;
        if (field === 'company_name') return tsplCompanyFont;
        return tsplOtherFont;
    }, [tsplNameFont, tsplDesignationFont, tsplCompanyFont, tsplOtherFont]);

    // Generate TSPL code for a single label
    const generateTSPLCode = useCallback((row) => {
        const lines = [];
        const cfg = labelConfig;

        lines.push(`SIZE ${cfg.width}, ${cfg.height}`);
        lines.push(`GAP ${cfg.gap}, 0 mm`);
        lines.push("DIRECTION 1");
        lines.push("CLS");

        let y = tsplStartY;

        selectedFields.forEach((field) => {
            const value = row[field] || '';
            if (!value) return;

            const font = getFontForField(field);

            // TEXT x,y,"font",rotation,x-scale,y-scale,"content"
            lines.push(`TEXT ${tsplStartX},${y},"${font}",0,1,1,"${value}"`);
            y += tsplLineGap;
        });

        lines.push("PRINT 1,1");
        return lines.join("\r\n");
    }, [labelConfig, selectedFields, tsplStartX, tsplStartY, tsplLineGap, getFontForField]);

    // Generate ZPL code for a single label
    const generateZPLCode = useCallback((row) => {
        const lines = [];
        const zplConfigs = {
            "2x1": { width: 406, height: 203, startX: 20, startY: 25, lineGap: 45 },
            "2x2": { width: 406, height: 406, startX: 20, startY: 30, lineGap: 60 },
            "3x2": { width: 609, height: 406, startX: 30, startY: 40, lineGap: 70 },
        };
        const cfg = zplConfigs[labelSize] || zplConfigs["2x2"];
        const effectiveLineGap = Math.round(cfg.lineGap * lineGapMultiplier);

        lines.push("^XA");
        lines.push("^PON");
        lines.push("^LH0,0");

        let y = cfg.startY;

        selectedFields.forEach((field) => {
            const value = row[field] || '';
            if (!value) return;

            const isName = field === 'firstName' || field === 'name' || field === 'surname';
            const fontSize = isName ? zplNameSize : zplOtherSize;

            // ^FO = Field Origin, ^A0 = Scalable font, ^FD = Field Data
            lines.push(`^FO${cfg.startX},${y}`);
            lines.push(`^A0N,${fontSize},${fontSize}`);
            lines.push(`^FD${value}^FS`);
            y += effectiveLineGap;
        });

        lines.push("^XZ");
        return lines.join("\n");
    }, [labelSize, lineGapMultiplier, selectedFields, zplNameSize, zplOtherSize]);

    // Generate code for current label
    const generatedCode = useMemo(() => {
        if (!selectedRows.length) return "";
        const row = selectedRows[activeLabel] || selectedRows[0];
        return printerType === "zpl" ? generateZPLCode(row) : generateTSPLCode(row);
    }, [selectedRows, activeLabel, printerType, generateTSPLCode, generateZPLCode]);

    // Update custom code when generated code changes (if not in custom mode)
    useEffect(() => {
        if (!useCustomCode) {
            setCustomCode(generatedCode);
        }
    }, [generatedCode, useCustomCode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(customCode);
        message.success("Code copied to clipboard!");
    };

    const handleRegenerate = () => {
        setUseCustomCode(false);
        setCustomCode(generatedCode);
        message.info("Code regenerated from settings");
    };

    const handlePrint = () => {
        if (!customCode.trim()) {
            message.warning("No code to print");
            return;
        }
        const codeBytes = new TextEncoder().encode(customCode);
        onPrintCustomCode?.(codeBytes, selectedRows.length);
    };

    const handlePrintAll = async () => {
        if (!selectedRows.length) {
            message.warning("No labels selected");
            return;
        }

        const allCodes = selectedRows.map((row, idx) => {
            if (useCustomCode && idx === activeLabel) {
                return customCode; // Use edited code for active label
            }
            return printerType === "zpl" ? generateZPLCode(row) : generateTSPLCode(row);
        });

        const combinedBytes = allCodes.map(code => new TextEncoder().encode(code));
        onPrintCustomCode?.(combinedBytes, selectedRows.length, true);
    };

    return (
        <Modal
            title={
                <Space>
                    <FileCode size={18} />
                    <span>Printer Code Preview</span>
                    <Tag color={printerType === "zpl" ? "blue" : "green"}>
                        {printerType.toUpperCase()}
                    </Tag>
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={800}
            footer={
                <Space>
                    <Button onClick={onClose}>Close</Button>
                    <Button icon={<Copy size={14} />} onClick={handleCopy}>
                        Copy Code
                    </Button>
                    <Button icon={<RefreshCw size={14} />} onClick={handleRegenerate}>
                        Regenerate
                    </Button>
                    <Button
                        type="primary"
                        icon={<Printer size={14} />}
                        onClick={handlePrint}
                        disabled={!isConnected || isPrinting}
                        loading={isPrinting}
                    >
                        Print This Label
                    </Button>
                    {selectedRows.length > 1 && (
                        <Button
                            type="primary"
                            icon={<Printer size={14} />}
                            onClick={handlePrintAll}
                            disabled={!isConnected || isPrinting}
                            loading={isPrinting}
                        >
                            Print All ({selectedRows.length})
                        </Button>
                    )}
                </Space>
            }
        >
            <Space direction="vertical" size="middle" className="w-100">
                {/* Font Settings */}
                <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                    <Text strong style={{ marginBottom: 12, display: 'block' }}>
                        {printerType === "tspl" ? "TSPL Settings" : "ZPL Settings"} (changes regenerate code)
                    </Text>
                    
                    {printerType === "tspl" ? (
                        <Space direction="vertical" size="small" className="w-100">
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Name Font</Text>
                                    <Select
                                        value={tsplNameFont}
                                        onChange={(v) => { setTsplNameFont(v); setUseCustomCode(false); }}
                                        options={TSPL_FONT_OPTIONS}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                                <Col span={6}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Designation Font</Text>
                                    <Select
                                        value={tsplDesignationFont}
                                        onChange={(v) => { setTsplDesignationFont(v); setUseCustomCode(false); }}
                                        options={TSPL_FONT_OPTIONS}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                                <Col span={6}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Company Font</Text>
                                    <Select
                                        value={tsplCompanyFont}
                                        onChange={(v) => { setTsplCompanyFont(v); setUseCustomCode(false); }}
                                        options={TSPL_FONT_OPTIONS}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                                <Col span={6}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Other Font</Text>
                                    <Select
                                        value={tsplOtherFont}
                                        onChange={(v) => { setTsplOtherFont(v); setUseCustomCode(false); }}
                                        options={TSPL_FONT_OPTIONS}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={8}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Start X</Text>
                                    <InputNumber
                                        value={tsplStartX}
                                        onChange={(v) => { setTsplStartX(v); setUseCustomCode(false); }}
                                        min={0}
                                        max={200}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                                <Col span={8}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Start Y</Text>
                                    <InputNumber
                                        value={tsplStartY}
                                        onChange={(v) => { setTsplStartY(v); setUseCustomCode(false); }}
                                        min={0}
                                        max={400}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                                <Col span={8}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Line Gap</Text>
                                    <InputNumber
                                        value={tsplLineGap}
                                        onChange={(v) => { setTsplLineGap(v); setUseCustomCode(false); }}
                                        min={20}
                                        max={150}
                                        style={{ width: '100%' }}
                                        size="small"
                                    />
                                </Col>
                            </Row>
                        </Space>
                    ) : (
                        <Space wrap>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Name Font Size</Text>
                                <Select
                                    value={zplNameSize}
                                    onChange={(v) => { setZplNameSize(v); setUseCustomCode(false); }}
                                    options={ZPL_SIZE_OPTIONS}
                                    style={{ width: 160, display: 'block' }}
                                    size="small"
                                />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Other Font Size</Text>
                                <Select
                                    value={zplOtherSize}
                                    onChange={(v) => { setZplOtherSize(v); setUseCustomCode(false); }}
                                    options={ZPL_SIZE_OPTIONS}
                                    style={{ width: 160, display: 'block' }}
                                    size="small"
                                />
                            </div>
                        </Space>
                    )}
                </div>

                {/* Label selector if multiple labels */}
                {selectedRows.length > 1 && (
                    <div>
                        <Text type="secondary" style={{ marginRight: 8 }}>Preview Label:</Text>
                        <Select
                            value={activeLabel}
                            onChange={setActiveLabel}
                            style={{ width: 250 }}
                            options={selectedRows.map((row, idx) => ({
                                value: idx,
                                label: `${idx + 1}. ${row.firstName || row.name || ''} ${row.surname || ''}`.trim(),
                            }))}
                        />
                    </div>
                )}

                <Alert
                    type="info"
                    showIcon
                    message="Edit the code below directly. Changes will be used when printing."
                    style={{ marginBottom: 0 }}
                />

                {/* Code Editor */}
                <TextArea
                    value={customCode}
                    onChange={(e) => {
                        setCustomCode(e.target.value);
                        setUseCustomCode(true);
                    }}
                    rows={15}
                    style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                    }}
                    placeholder={`Enter ${printerType.toUpperCase()} code here...`}
                />

                {/* Reference */}
                <div style={{ background: '#fffbe6', padding: 12, borderRadius: 8, border: '1px solid #ffe58f' }}>
                    <Text strong>Quick Reference:</Text>
                    {printerType === "tspl" ? (
                        <Text style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                            TEXT x,y,"font",rotation,x-scale,y-scale,"content"<br/>
                            Working fonts: 2 (small), 3 (medium), 4 (large), 5 (XL)<br/>
                            Example: TEXT 5,10,"4",0,1,1,"Rajesh"
                        </Text>
                    ) : (
                        <Text style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                            ^FO x,y = Position | ^A0N,height,width = Font | ^FD content ^FS = Text<br/>
                            Example: ^FO20,30^A0N,50,50^FDHello^FS
                        </Text>
                    )}
                </div>
            </Space>
        </Modal>
    );
};

export default PrintCodePreview;

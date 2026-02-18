import React, { useState, useCallback, useMemo } from "react";
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Space,
    Radio,
    Typography,
    Slider,
    Divider,
    Tooltip,
    message,
    InputNumber,
    Select,
} from "antd";
import {
    PrinterIcon,
    SettingsIcon,
    Zap,
    RotateCcw,
} from "lucide-react";
import { LABEL_SIZES, AVAILABLE_FIELDS } from "./constants";

const { Text, Title } = Typography;
const { Option } = Select;

// Filter out surname for instant print
// const AVAILABLE_FIELDS = AVAILABLE_FIELDS.filter(f => f.key !== 'surname');

/**
 * Instant Print Tab Component
 * Saves label to batch AND prints in one action
 */
const InstantPrintTab = ({
    labelSize,
    setLabelSize,
    isPrinting,
    onInstantPrint,
    onOpenSettings,
    fontFamily,
    isConnected,
    connectionMode,
    fieldFontSizes: parentFieldFontSizes,
    setFieldFontSizes: parentSetFieldFontSizes,
    // Save functionality props
    batchGroups = [],
    onSaveToExistingBatch,
    onSaveToNewBatch,
    isSaving = false,
    isLoadingBatches = false,
    userId,
}) => {
    // Field values state
    const [fieldValues, setFieldValues] = useState(() => {
        const initialValues = {};
        AVAILABLE_FIELDS.forEach(field => {
            initialValues[field.key] = "";
        });
        return initialValues;
    });

    // Local font sizes (if parent doesn't provide) — direct pt values
    const [localFieldFontSizes, setLocalFieldFontSizes] = useState(() => {
        const sizes = {};
        AVAILABLE_FIELDS.forEach(field => {
            sizes[field.key] = field.defaultSize || 10;
        });
        return sizes;
    });

    // Use parent or local font sizes
    const fieldFontSizes = parentFieldFontSizes || localFieldFontSizes;
    const setFieldFontSizes = parentSetFieldFontSizes || setLocalFieldFontSizes;

    const [copies, setCopies] = useState(1);

    // Batch selection state
    const [saveMode, setSaveMode] = useState('existing'); // 'existing' or 'new'
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [newBatchName, setNewBatchName] = useState('');

    // Update field value
    const handleValueChange = useCallback((key, value) => {
        setFieldValues(prev => ({ ...prev, [key]: value }));
    }, []);

    // Update font size for a field
    const handleFontSizeChange = useCallback((key, size) => {
        setFieldFontSizes(prev => ({ ...prev, [key]: size }));
    }, [setFieldFontSizes]);

    // Reset all values
    const handleReset = useCallback(() => {
        const resetValues = {};
        AVAILABLE_FIELDS.forEach(field => {
            resetValues[field.key] = "";
        });
        setFieldValues(resetValues);
    }, []);

    // Reset font sizes to defaults (pt values)
    const handleResetFontSizes = useCallback(() => {
        const defaultSizes = {};
        AVAILABLE_FIELDS.forEach(field => {
            defaultSizes[field.key] = field.defaultSize || 10;
        });
        setFieldFontSizes(defaultSizes);
    }, [setFieldFontSizes]);

    // Get fields with values (for preview and print)
    const filledFields = useMemo(() => {
        return AVAILABLE_FIELDS.filter(field => fieldValues[field.key]?.trim());
    }, [fieldValues]);

    // Combined Save + Print handler
    const handleSaveAndPrint = useCallback(async () => {
        if (!fieldValues.name?.trim()) {
            message.warning("Name is required");
            return;
        }

        // Validate batch selection
        if (saveMode === 'existing' && !selectedBatchId) {
            message.warning("Please select a batch");
            return;
        }
        if (saveMode === 'new' && !newBatchName?.trim()) {
            message.warning("Please enter a batch name");
            return;
        }

        try {
            // Step 1: Save to database
            message.loading({ content: "Saving label...", key: "saveprint" });

            const labelPayload = {
                name: fieldValues.name?.trim() || '',
                surname: fieldValues.surname?.trim() || '',
                number: fieldValues.number?.trim() || '',
                designation: fieldValues.designation?.trim() || '',
                company_name: fieldValues.company_name?.trim() || '',
                stall_number: fieldValues.stall_number?.trim() || '',
            };

            if (saveMode === 'existing') {
                await onSaveToExistingBatch({
                    batch_id: selectedBatchId,
                    user_id: userId,
                    ...labelPayload,
                });
            } else {
                await onSaveToNewBatch({
                    user_id: userId,
                    batch_name: newBatchName.trim(),
                    labels: [labelPayload],
                });
            }

            message.success({ content: "Label saved!", key: "saveprint", duration: 1 });

            // Step 2: Print the label
            const labelData = {
                id: `instant_${Date.now()}`,
                ...fieldValues,
            };

            const labelsToPrint = [];
            for (let i = 0; i < copies; i++) {
                labelsToPrint.push({ ...labelData, key: `instant_${Date.now()}_${i}` });
            }

            onInstantPrint({
                labels: labelsToPrint,
                fieldFontSizes,
                isInstantPrint: true,
            });

            // Clear form after successful save+print
            handleReset();
            if (saveMode === 'new') {
                setNewBatchName('');
            }

        } catch (error) {
            message.error({ content: error.message || "Failed to save label", key: "saveprint" });
        }
    }, [
        fieldValues, saveMode, selectedBatchId, newBatchName, userId,
        onSaveToExistingBatch, onSaveToNewBatch, copies, fieldFontSizes,
        onInstantPrint, handleReset
    ]);

    // Check if can print
    const canPrint = filledFields.length > 0 && !isPrinting && !isSaving;

    return (
        <div className="instant-print-tab">
            {/* Batch Selection Card */}
            <Card className="" size="small">
                <Row gutter={[16, 8]} align="middle">

                    {/* Save Mode */}
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item label="Save To" className="mb-0">
                            <Radio.Group
                                value={saveMode}
                                onChange={(e) => setSaveMode(e.target.value)}
                            >
                                <Space>
                                    <Radio value="existing">Existing</Radio>
                                    <Radio value="new">New</Radio>
                                </Space>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    {/* Batch Selection */}
                    <Col xs={24} sm={12} md={6}>
                        {saveMode === "existing" ? (
                            <Form.Item label="Batch" className="mb-0">
                                <Select
                                    placeholder="Choose a batch"
                                    value={selectedBatchId}
                                    onChange={setSelectedBatchId}
                                    showSearch
                                    optionFilterProp="children"
                                    loading={isLoadingBatches}
                                    style={{ width: "100%" }}
                                    notFoundContent={
                                        isLoadingBatches ? "Loading..." : "No batches found"
                                    }
                                >
                                    {batchGroups.map((batch) => {
                                        const batchId = batch.batch_id || batch.batchId;
                                        return (
                                            <Option key={batchId} value={batchId}>
                                                {batchId} ({batch.total_records || batch.total || 0} labels)
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        ) : (
                            <Form.Item label="Batch Name" className="mb-0">
                                <Input
                                    placeholder="Enter batch name"
                                    value={newBatchName}
                                    onChange={(e) => setNewBatchName(e.target.value)}
                                />
                            </Form.Item>
                        )}
                    </Col>

                    {/* Label Size */}
                    <Col xs={12} sm={6} md={6}>
                        <Form.Item label="Label Size" className="mb-0">
                            <Select value={labelSize} onChange={setLabelSize} style={{ width: "100%" }}>
                                {LABEL_SIZES.map((size) => (
                                    <Option key={size.value} value={size.value}>
                                        {size.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* Copies */}
                    <Col xs={12} sm={6} md={6}>
                        <Form.Item label="Copies" className="mb-0">
                            <InputNumber
                                min={1}
                                max={100}
                                value={copies}
                                onChange={(val) => setCopies(Math.max(1, val || 1))}
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>

                </Row>
            </Card>


            {/* Fields Input Card */}
            <Card
                title={
                    <div className="d-flex align-items-center gap-2">
                        <Zap size={18} />
                        <span>Label Details</span>
                    </div>
                }
                extra={
                    <Space>
                        <div className="">
                            <Text type="secondary">
                                Copies: <Text strong>{copies}</Text>
                            </Text>
                        </div>
                        <Button
                            type="primary"
                            size="small"
                            icon={<PrinterIcon size={18} />}
                            disabled={!canPrint}
                            onClick={handleSaveAndPrint}
                            loading={isPrinting || isSaving}
                            className="d-flex align-items-center justify-content-center gap-2"
                        >
                            Save & Print
                        </Button>
                        <Button size="small" onClick={handleResetFontSizes}>
                            <div className="d-flex align-items-center" style={{ gap: 6 }}>
                                <RotateCcw size={14} />
                                <span>Reset Sizes</span>
                            </div>
                        </Button>
                        <Button size="small" onClick={handleReset}>
                            <div className="d-flex align-items-center" style={{ gap: 6 }}>
                                <RotateCcw size={14} />
                                <span>Clear</span>
                            </div>
                        </Button>
                        <Tooltip title="Print Settings">
                            <Button size="small" onClick={onOpenSettings}>
                                <div className="d-flex align-items-center">
                                    <SettingsIcon size={14} />
                                </div>
                            </Button>
                        </Tooltip>
                    </Space>
                }
                className="mb-4"
            >
                <Row gutter={[16, 20]} style={{ fontFamily }}>
                    {AVAILABLE_FIELDS.map((field) => (
                        <Col key={field.key} xs={24} sm={12} md={8}>
                            {/* Label */}
                            <div className="mb-1">
                                <Text strong>{field.label}</Text>
                                {field.key === 'name' && <Text type="danger"> *</Text>}
                            </div>
                            {/* Input */}
                            <Input
                                placeholder={`Enter ${field.label}`}
                                value={fieldValues[field.key]}
                                onChange={(e) => handleValueChange(field.key, e.target.value)}
                                style={{ fontFamily, marginBottom: 8 }}
                            />
                            {/* Size Slider */}
                            <div className="d-flex align-items-center gap-2">
                                <Text type="secondary" style={{ minWidth: 60, fontSize: 12 }}>
                                    Size: {fieldFontSizes[field.key]}pt
                                </Text>
                                <Slider
                                    min={6}
                                    max={72}
                                    step={1}
                                    value={fieldFontSizes[field.key] || field.defaultSize}
                                    onChange={(val) => handleFontSizeChange(field.key, val)}
                                    style={{ flex: 1 }}
                                    tooltip={{ formatter: (val) => `${val}pt` }}
                                />
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card>
        </div>
    );
};

export default InstantPrintTab;

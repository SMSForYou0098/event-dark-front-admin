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

    // Local font sizes (if parent doesn't provide)
    const [localFieldFontSizes, setLocalFieldFontSizes] = useState(() => {
        const sizes = {};
        AVAILABLE_FIELDS.forEach(field => {
            sizes[field.key] = field.defaultSize;
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

    // Reset font sizes to defaults
    const handleResetFontSizes = useCallback(() => {
        const defaultSizes = {};
        AVAILABLE_FIELDS.forEach(field => {
            defaultSizes[field.key] = field.defaultSize;
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
            <Card className="mb-4" size="small">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={6}>
                        <Text strong>Save to:</Text>
                        <Radio.Group
                            value={saveMode}
                            onChange={(e) => setSaveMode(e.target.value)}
                            className="d-block mt-2"
                        >
                            <Space direction="vertical">
                                <Radio value="existing">Existing Batch</Radio>
                                <Radio value="new">New Batch</Radio>
                            </Space>
                        </Radio.Group>
                    </Col>
                    <Col xs={24} md={10}>
                        {saveMode === 'existing' ? (
                            <Form.Item label="Select Batch" className="mb-0">
                                <Select
                                    placeholder="Choose a batch"
                                    value={selectedBatchId}
                                    onChange={setSelectedBatchId}
                                    style={{ width: '100%' }}
                                    showSearch
                                    optionFilterProp="children"
                                    loading={isLoadingBatches}
                                    notFoundContent={isLoadingBatches ? "Loading batches..." : "No batches found"}
                                >
                                    {batchGroups.map(batch => {
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
                            <Form.Item label="New Batch Name" className="mb-0">
                                <Input
                                    placeholder="Enter batch name"
                                    value={newBatchName}
                                    onChange={(e) => setNewBatchName(e.target.value)}
                                />
                            </Form.Item>
                        )}
                    </Col>
                    <Col xs={24} md={8}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Label Size" className="mb-0">
                                    <Select value={labelSize} onChange={setLabelSize} style={{ width: '100%' }}>
                                        {LABEL_SIZES.map((size) => (
                                            <Option key={size.value} value={size.value}>
                                                {size.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Copies" className="mb-0">
                                    <InputNumber
                                        min={1}
                                        max={100}
                                        value={copies}
                                        onChange={(val) => setCopies(Math.max(1, val || 1))}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
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
                        <Button size="small" icon={<RotateCcw size={14} />} onClick={handleResetFontSizes}>
                            Reset Sizes
                        </Button>
                        <Button size="small" icon={<RotateCcw size={14} />} onClick={handleReset}>
                            Clear
                        </Button>
                        <Tooltip title="Print Settings">
                            <Button size="small" icon={<SettingsIcon size={14} />} onClick={onOpenSettings} />
                        </Tooltip>
                    </Space>
                }
                className="mb-4"
            >
                <div style={{ fontFamily }}>
                    {AVAILABLE_FIELDS.map((field, index) => (
                        <div key={field.key}>
                            {index > 0 && <Divider className="my-3" />}
                            <Row gutter={[16, 8]} align="middle">
                                <Col xs={24} md={4}>
                                    <Text strong>{field.label}</Text>
                                    {field.key === 'name' && <Text type="danger"> *</Text>}
                                </Col>
                                <Col xs={24} md={10}>
                                    <Input
                                        placeholder={`Enter ${field.label}`}
                                        value={fieldValues[field.key]}
                                        onChange={(e) => handleValueChange(field.key, e.target.value)}
                                        size="large"
                                        style={{ fontFamily }}
                                    />
                                </Col>
                                <Col xs={24} md={10}>
                                    <div className="d-flex align-items-center gap-2">
                                        <Text type="secondary" style={{ minWidth: 60 }}>
                                            Size: {fieldFontSizes[field.key]?.toFixed(1)}x
                                        </Text>
                                        <Slider
                                            min={0.5}
                                            max={3}
                                            step={0.1}
                                            value={fieldFontSizes[field.key] || field.defaultSize}
                                            onChange={(val) => handleFontSizeChange(field.key, val)}
                                            style={{ flex: 1 }}
                                            tooltip={{ formatter: (val) => `${val?.toFixed(1)}x` }}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Preview & Print Button */}
            <Card className="mb-4">
                <Row gutter={24}>
                    <Col xs={24} md={14}>
                        <Title level={5}>Label Preview</Title>
                        <div
                            className="label-preview-box"
                            style={{
                                border: '2px dashed #d9d9d9',
                                borderRadius: 8,
                                padding: 16,
                                minHeight: 150,
                                backgroundColor: '#fafafa',
                                fontFamily,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {filledFields.length === 0 ? (
                                <Text type="secondary">Fill in fields to see preview</Text>
                            ) : (
                                <div className="text-center">
                                    {filledFields.map((field) => (
                                        <div
                                            key={field.key}
                                            style={{
                                                fontSize: 14 * (fieldFontSizes[field.key] || field.defaultSize),
                                                fontWeight: field.key === 'name' ? 'bold' : 'normal',
                                                marginBottom: 4,
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {fieldValues[field.key]}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Col>
                    <Col xs={24} md={10} className="d-flex flex-column justify-content-center">
                        <div className="mb-2">
                            <Text type="secondary">
                                Batch: <Text strong>
                                    {saveMode === 'existing'
                                        ? (selectedBatchId || 'Not selected')
                                        : (newBatchName || 'New batch')}
                                </Text>
                            </Text>
                        </div>
                        <div className="mb-2">
                            <Text type="secondary">
                                Copies: <Text strong>{copies}</Text>
                            </Text>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PrinterIcon size={18} />}
                            disabled={!canPrint}
                            onClick={handleSaveAndPrint}
                            loading={isPrinting || isSaving}
                            block
                            className="d-flex align-items-center justify-content-center gap-2"
                        >
                            Save & Print {copies > 1 ? `(${copies} copies)` : ''}
                        </Button>
                        {connectionMode !== 'browser' && !isConnected && (
                            <Text type="warning" className="mt-2 text-center d-block">
                                ⚠️ Printer not connected
                            </Text>
                        )}
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default InstantPrintTab;

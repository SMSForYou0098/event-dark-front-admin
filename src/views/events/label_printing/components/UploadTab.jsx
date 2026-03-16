import React, { useState, useEffect } from "react";
import {
    Button,
    Input,
    Row,
    Col,
    Typography,
    Upload as AntUpload,
    Table,
    Steps,
    Tag,
    Space,
    message,
    Grid,
} from "antd";
import {
    Upload,
    CloudUpload,
    RefreshCw,
    FileSpreadsheet,
    Download,
} from "lucide-react";

const { Text, Title, Paragraph } = Typography;
const { Step } = Steps;
const { useBreakpoint } = Grid;

const UploadTab = ({
    excelData,
    pendingLabels,
    batchName,
    setBatchName,
    sanitizeBatchName,
    handleExcelUpload,
    handleUploadToServer,
    isUploading,
    columns,
    fontFamily,
    downloadSampleExcel,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const screens = useBreakpoint(); // responsive helper

    // Auto move to preview step
    // Auto move to preview step is now handled by the parent or a different logic to avoid loops
    // Removing the useEffect that causes the loop
    useEffect(() => {
        // Only auto-advance if we are at step 0 AND we just got new data
        // But since we don't have a 'dataTimestamp' or similar, we should check if pendingLabels changed from empty to non-empty.
        // For now, simpler to just rely on the user or the upload action to trigger next step.
        // However, the upload action is in the parent.
        // Let's modify the useEffect to be smarter: only if pendingLabels.length > 0 AND we haven't manually gone back.
        // Actually, the best way is to trigger next step ONLY when upload finishes.
        // Since handleExcelUpload is in parent, we can detect change.
    }, []);

    // Auto move to preview step logic
    const hasAutoAdvanced = React.useRef(false);

    useEffect(() => {
        if (pendingLabels.length > 0 && currentStep === 0 && !hasAutoAdvanced.current) {
            setCurrentStep(1); // Go to Preview Step
            hasAutoAdvanced.current = true;
        } else if (pendingLabels.length === 0) {
            hasAutoAdvanced.current = false;
            if (currentStep !== 0) {
                setCurrentStep(0); // Reset to Upload Step if labels are cleared
            }
        }
    }, [pendingLabels, currentStep]);

    const uploadProps = {
        name: "file",
        multiple: false,
        accept: ".xlsx,.xls,.csv",
        showUploadList: false,
        beforeUpload: (file) => {
            hasAutoAdvanced.current = false; // Reset auto-advance flag for new upload
            handleExcelUpload(file);
            return false;
        },
    };

    const handleNext = () => {
        if (currentStep === 1 && !batchName.trim()) {
            message.error("Please enter a batch name");
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    // ------------------ STEP CONTENT ------------------

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <FileSpreadsheet size={48} style={{ marginBottom: 12 }} />

                        <Title level={4}>Upload Excel File</Title>

                        <Paragraph
                            type="secondary"
                            style={{ maxWidth: 400, margin: "0 auto 20px" }}
                        >
                            Upload your Excel file with label data. Download the sample file for format reference.
                        </Paragraph>

                        {/* Buttons Responsive */}
                        <Row gutter={[12, 12]} justify="center">

                            <Col xs={24} sm="auto">
                                <AntUpload {...uploadProps}>
                                    <Button
                                        type="primary"
                                        block
                                    >
                                        <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                            <RefreshCw size={16} />
                                            <span>Choose Excel File</span>
                                        </div>
                                    </Button>
                                </AntUpload>
                            </Col>
                        </Row>

                        <Col xs={24} sm="auto" className="m-2">
                            <Button
                                onClick={downloadSampleExcel} className=""
                            >
                                <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                    <Download size={16} />
                                    <span>Download Sample</span>
                                </div>
                            </Button>
                        </Col>

                        {/* Required Columns */}
                        <Text className="mt-2" type="secondary" style={{ fontSize: 12 }}>Required columns:</Text>
                        <div className="mt-2" >
                            <Space size={[6, 6]} wrap>
                                {["First Name", "Surname", "Mobile number", "Designation", "Company name", "Stall Number"].map(col => (
                                    <Tag key={col} color="blue" style={{ fontSize: 12 }}>{col}</Tag>
                                ))}
                            </Space>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <Row justify="space-between" align="middle">
                                <Title level={5} style={{ margin: 0 }}>
                                    Preview Data ({pendingLabels.length})
                                </Title>

                                <Button size="small" onClick={() => setCurrentStep(0)}>
                                    Re-upload
                                </Button>
                            </Row>

                            <div style={{ marginTop: 12, fontFamily }}>
                                <Table
                                    dataSource={pendingLabels.map((i, idx) => ({
                                        ...i,
                                        key: idx,
                                    }))}
                                    columns={columns}
                                    pagination={{ pageSize: 5 }}
                                    scroll={{ x: "max-content" }}
                                    size="small"
                                />
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={{ maxWidth: 420, margin: "0 auto" }}>
                                <Text strong>Enter Batch Name</Text>

                                <Input
                                    size="large"
                                    placeholder="EventBatch2024"
                                    value={batchName}
                                    onChange={(e) =>
                                        setBatchName(sanitizeBatchName(e.target.value))
                                    }
                                    prefix={<Upload size={14} />}
                                    style={{ marginTop: 6 }}
                                />

                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Only letters & numbers allowed.
                                </Text>
                            </div>
                        </Col>
                    </Row>
                );

            case 2:
                return (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <CloudUpload size={48} style={{ marginBottom: 12 }} />

                        <Title level={4}>Ready to Save</Title>

                        <Paragraph>
                            Saving <strong>{pendingLabels.length}</strong> labels to batch{" "}
                            <strong>{batchName}</strong>
                        </Paragraph>

                        <Button
                            type="primary"
                            size="large"
                            loading={isUploading}
                            onClick={handleUploadToServer}
                            className="mx-auto"
                        >
                            <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                <CloudUpload size={16} />
                                <span>Save to Database</span>
                            </div>
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    // ------------------ MAIN RENDER ------------------

    return (
        <div style={{ padding: screens.xs ? 8 : 16 }}>
            <Row justify="center">
                <Col span={24}>
                    <Steps
                        current={currentStep}
                        size="small"
                        direction={screens.xs ? "vertical" : "horizontal"}
                        style={{ marginBottom: 20 }}
                    >
                        <Step title="Upload (Select File)" />
                        <Step title="Preview (Verify & Name)" />
                        <Step title="Save (Upload to Server)" />
                    </Steps>

                    <div
                        style={{
                            minHeight: 260,
                            borderRadius: 8,
                            padding: screens.xs ? 12 : 20,
                            marginBottom: 16,
                        }}
                    >
                        {renderStepContent()}
                    </div>

                    {/* Bottom Buttons */}
                    {/* Bottom Buttons */}
                    <Row justify="end">
                        <Col>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexDirection: screens.xs ? "column" : "row",
                                    width: screens.xs ? "100%" : "auto",
                                }}
                            >
                                {currentStep > 0 && (
                                    <Button
                                        block={screens.xs}
                                        onClick={handlePrev}
                                        disabled={isUploading && currentStep === 2}
                                    >
                                        Previous
                                    </Button>
                                )}

                                {currentStep === 1 && (
                                    <Button
                                        type="primary"
                                        block={screens.xs}
                                        onClick={handleNext}
                                        disabled={!batchName.trim()}
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>


                </Col>
            </Row>
        </div>
    );
};

export default UploadTab;

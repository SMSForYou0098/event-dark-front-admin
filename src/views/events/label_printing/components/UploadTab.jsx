import React, { useCallback } from "react";
import {
    Button,
    Card,
    Input,
    Row,
    Col,
    Typography,
    Upload as AntUpload,
    Table,
    Empty,
} from "antd";
import { Upload, CloudUpload, RefreshCw } from "lucide-react";

const { Text, Title } = Typography;

/**
 * Upload Tab Component
 * 3-step horizontal layout: Upload Excel -> Enter Batch Name -> Save
 */
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
}) => {
    const uploadProps = {
        name: "file",
        multiple: false,
        accept: ".xlsx,.xls,.csv",
        showUploadList: false,
        beforeUpload: (file) => {
            handleExcelUpload(file);
            return false;
        },
    };

    return (
        <div className="upload-tab">
            {/* 3-Step Upload Card */}
            <Card className="mb-4">
                <Row gutter={[24, 16]} align="middle">
                    {/* Step 1: Upload Excel File */}
                    <Col xs={24} md={8}>
                        <div>
                            <Text strong className="d-block mb-2">Step 1: Upload Excel File</Text>
                            <AntUpload {...uploadProps}>
                                <Button icon={<RefreshCw size={16} />}>
                                    Choose Excel File
                                </Button>
                            </AntUpload>
                            <Text type="secondary" className="d-block mt-2" style={{ fontSize: 12 }}>
                                Required columns: First Name, Surname, Mobile number, Designation, Company name, Stall Number
                            </Text>
                        </div>
                    </Col>

                    {/* Step 2: Enter Batch Name */}
                    <Col xs={24} md={8}>
                        <div>
                            <Text strong className="d-block mb-2">Step 2: Enter Batch Name</Text>
                            <Input
                                placeholder="e.g., EventName2024"
                                value={batchName}
                                onChange={(e) => setBatchName(sanitizeBatchName(e.target.value))}
                                prefix={<Upload size={14} />}
                            />
                            <Text type="secondary" className="d-block mt-2" style={{ fontSize: 12 }}>
                                Only letters and numbers allowed
                            </Text>
                        </div>
                    </Col>

                    {/* Step 3: Save */}
                    <Col xs={24} md={8}>
                        <div>
                            <Text strong className="d-block mb-2">Step 3: Save</Text>
                            <Button
                                type="primary"
                                icon={<CloudUpload size={16} />}
                                onClick={handleUploadToServer}
                                loading={isUploading}
                                disabled={!batchName.trim() || pendingLabels.length === 0}
                            >
                                Save to Database
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Preview Table or Empty State */}
            <Card>
                {pendingLabels.length > 0 ? (
                    <div style={{ fontFamily }}>
                        <Table
                            dataSource={pendingLabels.map((item, idx) => ({ ...item, key: idx }))}
                            columns={columns}
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: true }}
                            size="small"
                        />
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="text-center">
                                <Title level={5} type="secondary">No Data Uploaded</Title>
                                <Text type="secondary">
                                    Upload an Excel file to preview labels before saving
                                </Text>
                            </div>
                        }
                    />
                )}
            </Card>
        </div>
    );
};

export default UploadTab;

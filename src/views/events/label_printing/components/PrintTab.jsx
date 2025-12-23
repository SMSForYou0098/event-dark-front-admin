import React from "react";
import {
    Button,
    Col,
    Form,
    Row,
    Space,
    Tag,
    Radio,
    Select,
    Card,
    Popconfirm,
    Tooltip,
    Empty,
    Typography,
    Alert,
    Divider,
} from "antd";
import { PrinterIcon, SettingsIcon, Trash2, Edit2, CheckCircle } from "lucide-react";
import DataTable from "../../common/DataTable";
import { LABEL_SIZES } from "./constants";

const { Text, Title } = Typography;

/**
 * Print Tab Component
 * Handles label selection and printing
 */
const PrintTab = ({
    batchGroups,
    selectedBatchId,
    setSelectedBatchId,
    selectedBatchLabels,
    selectedRows,
    setSelectedRows,
    labelSize,
    setLabelSize,
    isPrinting,
    onPrint,
    onOpenSettings,
    onEditLabel,
    onDeleteLabel,
    fontFamily,
    isConnected,
    connectionMode,
    isLoadingBatches = false,
    isLoadingLabels = false,
}) => {
    // Find selected batch info - support both field naming conventions
    const selectedBatch = batchGroups.find(b =>
        (b.batch_id || b.batchId) === selectedBatchId
    );

    // Compute batch stats - use API response field names
    const batchTotal = selectedBatch?.total_records || selectedBatch?.total || selectedBatch?.totalRecords || 0;
    const batchPrinted = selectedBatch?.printed_records || selectedBatch?.printed_count || selectedBatch?.printedRecords || 0;
    const batchPending = selectedBatch?.pending_records || selectedBatch?.pending_count || selectedBatch?.pendingRecords || 0;

    const columns = [
        {
            title: "Name",
            key: "fullName",
            render: (_, record) => (
                <Text strong>
                    {record.name} {record.surname}
                </Text>
            ),
        },
        {
            title: "Mobile",
            dataIndex: "number",
            render: (val) => val || <Text type="secondary">-</Text>,
        },
        {
            title: "Designation",
            dataIndex: "designation",
            render: (val) => val || <Text type="secondary">-</Text>,
        },
        {
            title: "Company",
            dataIndex: "company_name",
            render: (val) => val || <Text type="secondary">-</Text>,
        },
        {
            title: "Stall",
            dataIndex: "stall_number",
            align: "center",
            render: (val) => val ? <Tag>{val}</Tag> : <Text type="secondary">-</Text>,
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            width: 100,
            render: (status) => (
                <Tag
                    color={status ? "success" : "warning"}
                    icon={status ? <CheckCircle size={12} /> : null}
                >
                    {status ? "Printed" : "Pending"}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "action",
            width: 100,
            render: (_, record) =>
                record.id ? (
                    <Space size="small">
                        <Tooltip title="Edit">
                            <Button
                                size="small"
                                type="text"
                                onClick={() => onEditLabel(record)}
                                icon={<Edit2 size={14} />}
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Delete this label?"
                            onConfirm={() => onDeleteLabel(record.id)}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            cancelText="Cancel"
                        >
                            <Tooltip title="Delete">
                                <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<Trash2 size={14} />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                ) : null,
        },
    ];

    return (
        <div className="print-tab">
            {/* Batch Selection & Settings */}
            <Card className="mb-4">
                <Row gutter={[24, 16]} align="middle">
                    <Col xs={24} md={10}>
                        <Form.Item label="Select Batch" className="mb-0">
                            <Select
                                placeholder="Choose a batch to print"
                                value={selectedBatchId}
                                onChange={(val) => {
                                    setSelectedBatchId(val);
                                    setSelectedRows([]);
                                }}
                                options={batchGroups.map(b => {
                                    const batchId = b.batch_id || b.batchId;
                                    const pending = b.pending_records || b.pending_count || b.pendingRecords || 0;
                                    return {
                                        label: (
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>{batchId}</span>
                                                <Tag size="small">
                                                    {pending} pending
                                                </Tag>
                                            </div>
                                        ),
                                        value: batchId,
                                    };
                                })}
                                allowClear
                                style={{ width: '100%' }}
                                size="large"
                                loading={isLoadingBatches}
                                notFoundContent={isLoadingBatches ? "Loading..." : "No batches"}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Label Size" className="mb-0">
                            <Radio.Group
                                value={labelSize}
                                onChange={(e) => setLabelSize(e.target.value)}
                            >
                                <Space>
                                    {LABEL_SIZES.map((size) => (
                                        <Radio key={size.value} value={size.value}>
                                            {size.label}
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                        <Space className="w-100 justify-content-end">
                            <Tooltip title="Print Settings">
                                <Button
                                    icon={<SettingsIcon size={16} />}
                                    onClick={onOpenSettings}
                                />
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>

                {/* Selected Batch Info */}
                {selectedBatch && (
                    <>
                        <Divider className="my-3" />
                        <Row gutter={16}>
                            <Col>
                                <Text type="secondary">
                                    Total: <Text strong>{batchTotal}</Text>
                                </Text>
                            </Col>
                            <Col>
                                <Text type="secondary">
                                    Printed: <Text strong style={{ color: '#52c41a' }}>{batchPrinted}</Text>
                                </Text>
                            </Col>
                            <Col>
                                <Text type="secondary">
                                    Pending: <Text strong style={{ color: '#faad14' }}>{batchPending}</Text>
                                </Text>
                            </Col>
                            <Col>
                                <Text type="secondary">
                                    Selected: <Text strong style={{ color: '#1677ff' }}>{selectedRows.length}</Text>
                                </Text>
                            </Col>
                        </Row>
                    </>
                )}
            </Card>

            {/* Connection Status Alert */}
            {connectionMode !== 'browser' && (
                <Alert
                    className="mb-4"
                    type={isConnected ? "success" : "warning"}
                    message={
                        isConnected
                            ? "Thermal printer connected and ready"
                            : "Thermal printer not connected. Click 'Printer Settings' to connect."
                    }
                    showIcon
                />
            )}

            {/* Print Button */}
            <div className="d-flex justify-content-end mb-4">
                <Button
                    type="primary"
                    size="large"
                    icon={<PrinterIcon size={18} />}
                    disabled={!selectedRows.length}
                    onClick={onPrint}
                    loading={isPrinting}
                    className="d-flex align-items-center gap-2"
                >
                    Print Selected ({selectedRows.length})
                </Button>
            </div>

            {/* Labels Table */}
            {selectedBatchId ? (
                <Card
                    styles={{ body: { padding: 0 } }}
                    title={
                        <div className="d-flex align-items-center gap-2">
                            <PrinterIcon size={18} />
                            <span>Labels in Batch: {selectedBatchId}</span>
                        </div>
                    }
                >
                    <div style={{ fontFamily }}>
                        <DataTable
                            data={selectedBatchLabels.map((label, idx) => ({
                                ...label,
                                key: label.id || idx,
                            }))}
                            columns={columns}
                            enableSearch={true}
                            showSearch={true}
                            emptyText="No labels in this batch"
                            pageSizeOptions={["10", "20", "50", "100"]}
                            defaultPageSize={10}
                            tableProps={{
                                rowSelection: {
                                    type: 'checkbox',
                                    onChange: (_, rows) => setSelectedRows(rows),
                                    selectedRowKeys: selectedRows.map(row => row.key || row.id),
                                },
                            }}
                        />
                    </div>
                </Card>
            ) : (
                <Card>
                    <Empty
                        description={
                            <div className="text-center">
                                <Title level={5} type="secondary">No Batch Selected</Title>
                                <Text type="secondary">
                                    Select a batch from the dropdown above to view and print labels
                                </Text>
                            </div>
                        }
                    />
                </Card>
            )}
        </div>
    );
};

export default PrintTab;

import React, { useMemo, useState, useCallback } from "react";
import { Card, Row, Col, Button, Space, Tag, Popconfirm, Tooltip, Typography, Spin, Progress, Modal, Form, Input, Divider, message } from "antd";
import { Layers, Eye, Trash2, RefreshCw, Printer, Plus } from "lucide-react";
import DataTable from "../../common/DataTable";
import { AVAILABLE_FIELDS } from "./constants";

const { Text, Title } = Typography;

/**
 * Batches Tab Component
 * Displays statistics and saved label batches with progress
 */
const BatchesTab = ({
    batchGroups,
    isLoading,
    onRefresh,
    onViewBatch,
    onDeleteBatch,
    onAddLabel,
    isSaving = false,
    userId,
}) => {
    // Add label modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatchForAdd, setSelectedBatchForAdd] = useState(null);
    const [labelValues, setLabelValues] = useState(() => {
        const initial = {};
        AVAILABLE_FIELDS.forEach(f => { initial[f.key] = ''; });
        return initial;
    });

    const handleOpenAddModal = useCallback((batch) => {
        setSelectedBatchForAdd(batch);
        setShowAddModal(true);
    }, []);

    const handleCloseAddModal = useCallback(() => {
        setShowAddModal(false);
        setSelectedBatchForAdd(null);
        const reset = {};
        AVAILABLE_FIELDS.forEach(f => { reset[f.key] = ''; });
        setLabelValues(reset);
    }, []);

    const handleLabelValueChange = useCallback((key, value) => {
        setLabelValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleAddLabelSubmit = useCallback(async () => {
        if (!labelValues.name?.trim()) {
            message.warning("Name is required");
            return;
        }

        try {
            await onAddLabel({
                batch_id: selectedBatchForAdd?.batch_id || selectedBatchForAdd?.batchId,
                user_id: userId,
                name: labelValues.name?.trim() || '',
                surname: labelValues.surname?.trim() || '',
                number: labelValues.number?.trim() || '',
                designation: labelValues.designation?.trim() || '',
                company_name: labelValues.company_name?.trim() || '',
                stall_number: labelValues.stall_number?.trim() || '',
            });
            message.success("Label added successfully!");
            handleCloseAddModal();
        } catch (error) {
            message.error(error.message || "Failed to add label");
        }
    }, [labelValues, selectedBatchForAdd, userId, onAddLabel, handleCloseAddModal]);

    // Calculate totals from batch groups
    const stats = useMemo(() => {
        const totalBatches = batchGroups.length;
        const totalLabels = batchGroups.reduce((sum, b) => sum + (b.total_records || b.total || b.totalRecords || 0), 0);
        const printedLabels = batchGroups.reduce((sum, b) => sum + (b.printed_records || b.printed_count || b.printedRecords || 0), 0);
        const pendingLabels = batchGroups.reduce((sum, b) => sum + (b.pending_records || b.pending_count || b.pendingRecords || 0), 0);
        return { totalBatches, totalLabels, printedLabels, pendingLabels };
    }, [batchGroups]);

    const columns = [
        {
            title: "Batch",
            dataIndex: "batch_id",
            key: "batch_id",
            render: (text, record) => (
                <Space>
                    <Layers size={14} style={{ color: '#faad14' }} />
                    <Text strong>{text || record.batchId}</Text>
                </Space>
            ),
        },
        {
            title: "Total",
            dataIndex: "total_records",
            key: "total",
            align: "center",
            render: (val, record) => <Tag>{val || record.total || record.totalRecords || 0}</Tag>,
        },
        {
            title: "Progress",
            key: "progress",
            render: (_, record) => {
                const total = record.total_records || record.total || record.totalRecords || 0;
                const printed = record.printed_records || record.printed_count || record.printedRecords || 0;
                const percent = total > 0 ? Math.round((printed / total) * 100) : 0;
                return (
                    <Space>
                        <Progress
                            percent={percent}
                            size="small"
                            style={{ width: 100 }}
                            strokeColor={percent === 100 ? '#52c41a' : '#1677ff'}
                        />
                        <Text type="secondary">{percent}% {printed}/{total}</Text>
                    </Space>
                );
            },
        },
        {
            title: "Status",
            key: "status",
            align: "center",
            render: (_, record) => {
                const total = record.total_records || record.total || record.totalRecords || 0;
                const printed = record.printed_records || record.printed_count || record.printedRecords || 0;

                if (printed === total && total > 0) {
                    return <Tag color="success">Complete</Tag>;
                } else if (printed > 0) {
                    return <Tag color="processing">Partial</Tag>;
                }
                return <Tag color="warning">Pending</Tag>;
            },
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: "Created By",
            key: "created_by",
            render: (_, record) => record.user?.name || record.created_by || '-',
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Add Label">
                        <Button
                            size="small"
                            icon={<Plus size={14} />}
                            onClick={() => handleOpenAddModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="View Batch">
                        <Button
                            type="primary"
                            size="small"
                            icon={<Eye size={14} />}
                            onClick={() => onViewBatch(record.batch_id || record.batchId)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this batch?"
                        description="This will delete all labels in this batch."
                        onConfirm={() => onDeleteBatch(record.batch_id || record.batchId)}
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
            ),
        },
    ];

    return (
        <div className="batches-tab">
            {/* Add Label Modal */}
            <Modal
                title={`Add Label to ${selectedBatchForAdd?.batch_id || selectedBatchForAdd?.batchId || 'Batch'}`}
                open={showAddModal}
                onCancel={handleCloseAddModal}
                onOk={handleAddLabelSubmit}
                confirmLoading={isSaving}
                okText="Add Label"
            >
                <div className="py-2">
                    {AVAILABLE_FIELDS.map((field, index) => (
                        <div key={field.key}>
                            {index > 0 && <Divider className="my-2" />}
                            <Form.Item
                                label={field.label}
                                className="mb-2"
                                required={field.key === 'name'}
                            >
                                <Input
                                    placeholder={`Enter ${field.label}`}
                                    value={labelValues[field.key]}
                                    onChange={(e) => handleLabelValueChange(field.key, e.target.value)}
                                />
                            </Form.Item>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Text type="secondary" className="d-block">Total Batches</Text>
                        <Space>
                            <Layers size={16} style={{ color: '#faad14' }} />
                            <Title level={4} className="mb-0">{stats.totalBatches}</Title>
                        </Space>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Text type="secondary" className="d-block">Total Labels</Text>
                        <Title level={4} className="mb-0">{stats.totalLabels}</Title>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Text type="secondary" className="d-block">Printed</Text>
                        <Space>
                            <Printer size={16} style={{ color: '#52c41a' }} />
                            <Title level={4} className="mb-0" style={{ color: '#52c41a' }}>{stats.printedLabels}</Title>
                        </Space>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Text type="secondary" className="d-block">Pending</Text>
                        <Title level={4} className="mb-0" style={{ color: '#faad14' }}>{stats.pendingLabels}</Title>
                    </Card>
                </Col>
            </Row>

            {/* Table Content */}
            <div className="bg-white rounded border p-0">
                {isLoading ? (
                    <div className="text-center p-5">
                        <Spin size="large" />
                    </div>
                ) : (
                    <DataTable
                        title='Label Batches'
                        extraHeaderContent={
                            <Button
                                onClick={onRefresh}
                                loading={isLoading}
                                className="d-flex align-items-center justify-content-center"
                            >
                                <div className="d-flex align-items-center justify-content-center" style={{ gap: 8 }}>
                                    <RefreshCw size={16} />
                                    <span>Refresh</span>
                                </div>
                            </Button>
                        }
                        data={batchGroups.map((b, idx) => ({ ...b, key: idx }))}
                        columns={columns}
                        enableSearch={true}
                        showSearch={true}
                        emptyText="No batches found. Upload labels to create your first batch."
                        pageSizeOptions={["10", "20", "50"]}
                        defaultPageSize={10}
                    />
                )}
            </div>
        </div>
    );
};

export default BatchesTab;

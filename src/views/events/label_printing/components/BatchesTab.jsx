import React, { useMemo } from "react";
import { Card, Row, Col, Table, Button, Space, Tag, Popconfirm, Tooltip, Empty, Typography, Spin, Progress } from "antd";
import { Layers, Eye, Trash2, RefreshCw, CheckCircle, Printer } from "lucide-react";
import DataTable from "../../common/DataTable";

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
}) => {
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
                const pending = record.pending_records || record.pending_count || record.pendingRecords || 0;
                
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
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => onViewBatch(record.batch_id || record.batchId)}
                    >
                        View
                    </Button>
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

            {/* Batches Table */}
            <Card
                title={
                    <Space>
                        <Layers size={18} />
                        <span>Label Batches</span>
                    </Space>
                }
                extra={
                    <Button
                        icon={<RefreshCw size={16} />}
                        onClick={onRefresh}
                        loading={isLoading}
                    >
                        Refresh
                    </Button>
                }
            >
                {isLoading ? (
                    <div className="text-center p-5">
                        <Spin size="large" />
                    </div>
                ) : (
                    <DataTable
                        data={batchGroups.map((b, idx) => ({ ...b, key: idx }))}
                        columns={columns}
                        enableSearch={true}
                        showSearch={true}
                        emptyText="No batches found. Upload labels to create your first batch."
                        pageSizeOptions={["10", "20", "50"]}
                        defaultPageSize={10}
                    />
                )}
            </Card>
        </div>
    );
};

export default BatchesTab;

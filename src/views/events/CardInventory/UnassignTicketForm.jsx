import React, { useMemo, useState } from "react";
import {
    Card,
    Select,
    InputNumber,
    Button,
    Space,
    Row,
    Col,
    message,
    Form,
    Table,
    Alert,
    Typography,
    Tag,
} from "antd";
import { CloseOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";

const { Text } = Typography;

const UnassignTicketForm = ({ selectedEventId, ticketOptions, summary, refetchSummary }) => {
    const [form] = Form.useForm();
    const selectedTicketId = Form.useWatch('ticket_id', form);
    const [mutationError, setMutationError] = useState(null);

    // Get assigned blocks (everything except unassigned)
    const assignedBlocks = useMemo(() => {
        return (summary?.summary?.type_breakdown || []).filter(item => item.type !== 'unassigned');
    }, [summary]);

    // Get ticket assignments grouped by ticket
    const ticketAssignments = useMemo(() => {
        if (!selectedTicketId) return [];
        // Filter assigned blocks - in real scenario, you'd filter by ticket_id from API
        // For now, we'll show all assigned blocks when a ticket is selected
        return assignedBlocks;
    }, [selectedTicketId, assignedBlocks]);

    // Mutation for unassigning
    const unassignTicketMutation = useMutation({
        mutationFn: async (payload) => {
            return await apiClient.post("card-tokens/unassign-ticket", payload);
        },
        onSuccess: (res) => {
            message.success(res?.message || "Ticket & types unassigned successfully");
            form.resetFields();
            setMutationError(null);
            refetchSummary?.();
        },
        onError: (error) => {
            const errMsg = error?.response?.data?.message || error?.message || "Failed to unassign ticket";
            setMutationError(errMsg);
        },
    });

    const onFinish = (values) => {
        const { ticket_id, ranges } = values;

        if (!ranges || ranges.length === 0) {
            message.warning("Please add at least one range to unassign");
            return;
        }

        unassignTicketMutation.mutate({
            event_id: selectedEventId,
            ticket_id,
            ranges,
        });
    };

    return (
        <Card
            title={
                <Space>
                    <CloseOutlined />
                    <span>Unassign Ticket & Types</span>
                </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: "auto" }}
        >
            {mutationError && (
                <Alert
                    message={mutationError}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setMutationError(null)}
                    style={{ marginBottom: 16, borderRadius: 8 }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ ranges: [] }}
                disabled={!selectedEventId}
            >
                <Form.Item
                    label="Ticket"
                    name="ticket_id"
                    rules={[{ required: true, message: "Please select a ticket" }]}
                >
                    <Select
                        placeholder="Select a ticket"
                        options={ticketOptions}
                        notFoundContent={
                            selectedEventId ? "No tickets found" : "Select an event first"
                        }
                    />
                </Form.Item>

                {/* Show assigned ranges for selected ticket */}
                {selectedTicketId && assignedBlocks.length > 0 && (
                    <Alert
                        message={`Found ${assignedBlocks.length} assigned range(s) for this ticket`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16, borderRadius: 8 }}
                    />
                )}

                <Form.List name="ranges">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.length > 0 && (
                                <Row gutter={8} style={{ marginBottom: 6 }}>
                                    <Col span={8}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Range Start</Text>
                                    </Col>
                                    <Col span={8}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Range End</Text>
                                    </Col>
                                    <Col span={8}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Quantity</Text>
                                    </Col>
                                </Row>
                            )}
                            {fields.map(({ key, name, ...restField }) => {
                                const allRanges = form.getFieldValue('ranges') || [];
                                const currentRange = allRanges[name];
                                const quantity = (currentRange?.range_start && currentRange?.range_end)
                                    ? currentRange.range_end - currentRange.range_start + 1
                                    : null;

                                return (
                                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "range_start"]}
                                                rules={[
                                                    { required: true, message: "Required" },
                                                    {
                                                        validator(_, value) {
                                                            if (!value) return Promise.resolve();
                                                            // Check if start is within assigned ranges
                                                            const isValid = assignedBlocks.some(block =>
                                                                value >= block.range_start && value <= block.range_end
                                                            );
                                                            if (!isValid) {
                                                                return Promise.reject(new Error("Not in assigned range"));
                                                            }
                                                            return Promise.resolve();
                                                        },
                                                    },
                                                ]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber
                                                    placeholder="Start"
                                                    min={1}
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "range_end"]}
                                                rules={[
                                                    { required: true, message: "Required" },
                                                    {
                                                        validator(_, value) {
                                                            if (!value) return Promise.resolve();
                                                            const start = form.getFieldValue(['ranges', name, 'range_start']);
                                                            if (start && value < start) {
                                                                return Promise.reject(new Error("End must be >= Start"));
                                                            }
                                                            // Check if end is within assigned ranges
                                                            const isValid = assignedBlocks.some(block =>
                                                                value >= block.range_start && value <= block.range_end
                                                            );
                                                            if (!isValid) {
                                                                return Promise.reject(new Error("Not in assigned range"));
                                                            }
                                                            return Promise.resolve();
                                                        },
                                                    },
                                                ]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber
                                                    placeholder="End"
                                                    min={1}
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={6}>
                                            <Form.Item>
                                                <InputNumber
                                                    value={quantity}
                                                    disabled
                                                    placeholder="—"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={2} style={{ textAlign: "center" }}>
                                            <Form.Item>
                                                <DeleteOutlined
                                                    onClick={() => remove(name)}
                                                    style={{ color: "#ff4d4f", fontSize: 16, cursor: 'pointer' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                );
                            })}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    style={{ fontSize: 13 }}
                                >
                                    Add Range
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    block
                    loading={unassignTicketMutation.isPending}
                    icon={<CloseOutlined />}
                    style={{ marginTop: 8 }}
                >
                    Unassign Ticket & Types
                </Button>
            </Form>

            {/* Show assigned ranges table */}
            {selectedTicketId && assignedBlocks.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                        Assigned Ranges:
                    </Text>
                    <Table
                        dataSource={assignedBlocks}
                        rowKey={(r, i) => `${r.type}-${r.range_start}-${i}`}
                        pagination={false}
                        size="small"
                        summary={(pageData) => {
                            const total = pageData.reduce((sum, record) => sum + (record.count || 0), 0);
                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0}>
                                            <Text strong>Total</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1}>
                                            <Text strong>{total}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} />
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                        columns={[
                            {
                                title: 'Type',
                                dataIndex: 'type',
                                render: (v) => {
                                    const colorMap = {
                                        'online': 'green',
                                        'offline': 'blue',
                                    };
                                    return (
                                        <Tag color={colorMap[v] || 'default'}>
                                            {v?.toUpperCase()}
                                        </Tag>
                                    );
                                },
                            },
                            { title: 'Quantity', dataIndex: 'count' },
                            { title: 'Range', render: (_, record) => `${record.range_start}-${record.range_end}` },
                        ]}
                    />
                </div>
            )}
        </Card>
    );
};

export default UnassignTicketForm;

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
    Divider,
    Statistic,
    Spin,
    Table,
    Alert,
    Typography,
} from "antd";
import { TagsOutlined, PlusOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";
import useTicketInventory from "./hooks/useTicketInventory";

const { Text } = Typography;

const AssignTicketForm = ({ selectedEventId, ticketOptions, summary, refetchSummary }) => {
    const [form] = Form.useForm();
    const selectedTicketId = Form.useWatch('ticket_id', form);
    const typesWatch = Form.useWatch('types', form);
    const [mutationError, setMutationError] = useState(null);



    // Fetch ticket card inventory when both event and ticket are selected
    const { data: ticketInventory, isLoading: ticketInventoryLoading, refetch: refetchTicketInventory } = useTicketInventory(
        selectedEventId,
        selectedTicketId
    );

    // Compute the highest range_end from summary type_breakdown
    const maxRangeEnd = useMemo(() => {
        const breakdown = summary?.summary?.type_breakdown;
        if (!breakdown?.length) return 0;
        return breakdown
            .filter((item) => item.type !== 'unassigned')
            .reduce((max, item) => {
                const end = item.range_end || 0;
                return end > max ? end : max;
            }, 0);
    }, [summary]);

    // Total available tokens from summary
    const totalAvailable = useMemo(() => {
        return summary?.summary?.status_counts?.available || 0;
    }, [summary]);

    // Unassigned blocks for gap validation
    const unassignedBlocks = useMemo(() => {
        return (summary?.summary?.type_breakdown || []).filter(t => t.type === 'unassigned');
    }, [summary]);

    // Mutation
    const assignTicketMutation = useMutation({
        mutationFn: async (payload) => {
            return await apiClient.post("card-tokens/assign-ticket", payload);
        },
        onSuccess: (res) => {
            message.success(res?.message || "Ticket & types assigned successfully");
            form.resetFields();
            setMutationError(null);
            // Refetch both APIs
            refetchSummary?.();
            refetchTicketInventory?.();
        },
        onError: (error) => {
            const errMsg = error?.response?.data?.message || error?.message || "Failed to assign ticket";
            setMutationError(errMsg);
        },
    });

    const onFinish = (values) => {
        const { ticket_id, types } = values;

        if (!types || types.length === 0) {
            message.warning("Please add at least one type breakdown");
            return;
        }

        // Derive quantity and range_start from types
        const quantity = types.reduce((sum, t) => sum + (t?.quantity || 0), 0);
        const range_start = types[0]?.range_start;

        assignTicketMutation.mutate({
            event_id: selectedEventId,
            ticket_id,
            quantity,
            range_start,
            types,
        });
    };

    return (
        <Card
            title={
                <Space>
                    <TagsOutlined />
                    <span>Assign Ticket & Types</span>
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
                initialValues={{ types: [] }}
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


                {/* <Divider orientation="left" style={{ margin: "12px 0", fontSize: 13 }}>
                    Types Breakdown
                </Divider> */}

                <Form.List name="types">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.length > 0 && (
                                <Row gutter={8} style={{ marginBottom: 6 }}>
                                    <Col span={6}><Text type="secondary" style={{ fontSize: 12 }}>Type</Text></Col>
                                    <Col span={5}><Text type="secondary" style={{ fontSize: 12 }}>Range Start</Text></Col>
                                    <Col span={5}><Text type="secondary" style={{ fontSize: 12 }}>Quantity</Text></Col>
                                    <Col span={5}><Text type="secondary" style={{ fontSize: 12 }}>Range End</Text></Col>
                                    <Col span={3} />
                                </Row>
                            )}
                            {fields.map(({ key, name, ...restField }) => {
                                const allTypes = form.getFieldValue('types') || [];
                                const currentType = allTypes[name];
                                const rangeEnd = (currentType?.range_start && currentType?.quantity)
                                    ? currentType.range_start + currentType.quantity - 1
                                    : null;
                                return (
                                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                        <Col span={6}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "type"]}
                                                rules={[{ required: true, message: "Required" }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Select placeholder="Type">
                                                    <Select.Option value="offline">Offline</Select.Option>
                                                    <Select.Option value="online">Online</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col span={5}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "range_start"]}
                                                rules={[
                                                    { required: true, message: "Required" },
                                                    {
                                                        validator(_, value) {
                                                            if (!value) return Promise.resolve();

                                                            // 1. Check if start falls within ANY unassigned block
                                                            const inUnassigned = unassignedBlocks.some(b =>
                                                                value >= b.range_start && value <= b.range_end
                                                            );

                                                            if (!inUnassigned) {
                                                                return Promise.reject(new Error("Start not in unassigned range"));
                                                            }

                                                            // 2. Sequential check relative to previous row (optional for UX)
                                                            // We enforce > prevEnd strictly to keep rows sorted in UI, 
                                                            // but we allow start < maxRangeEnd (history) to fill gaps.
                                                            if (name > 0) {
                                                                const allTypes = form.getFieldValue('types') || [];
                                                                const prev = allTypes[name - 1];
                                                                const prevEnd = (prev?.range_start || 0) + (prev?.quantity || 0) - 1;
                                                                if (value <= prevEnd) {
                                                                    return Promise.reject(new Error(`Must be > ${prevEnd}`));
                                                                }
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
                                        <Col span={5}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "quantity"]}
                                                rules={[
                                                    { required: true, message: "Required" },
                                                    {
                                                        validator(_, value) {
                                                            if (!value) return Promise.resolve();
                                                            const currentStart = form.getFieldValue(['types', name, 'range_start']);

                                                            // 1. Check against specific unassigned block limit if start is provided
                                                            if (currentStart) {
                                                                const block = unassignedBlocks.find(b =>
                                                                    currentStart >= b.range_start && currentStart <= b.range_end
                                                                );
                                                                if (block) {
                                                                    const maxForBlock = block.range_end - currentStart + 1;
                                                                    if (value > maxForBlock) {
                                                                        return Promise.reject(new Error(`Max ${maxForBlock} for this range`));
                                                                    }
                                                                }
                                                            }

                                                            // 2. Original global check (optional but good as backup)
                                                            const allTypes = form.getFieldValue('types') || [];
                                                            let usedBefore = 0;
                                                            for (let i = 0; i < name; i++) {
                                                                usedBefore += allTypes[i]?.quantity || 0;
                                                            }
                                                            const remaining = totalAvailable - usedBefore;
                                                            if (value > remaining) {
                                                                return Promise.reject(
                                                                    new Error(`Max ${remaining} globally`)
                                                                );
                                                            }
                                                            return Promise.resolve();
                                                        },
                                                    },
                                                ]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber
                                                    placeholder="Qty"
                                                    min={1}
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={5}>
                                            <Form.Item>

                                                <InputNumber
                                                    value={rangeEnd}
                                                    disabled
                                                    placeholder="—"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={3} style={{ textAlign: "center" }}>
                                            <Form.Item>
                                                <DeleteOutlined
                                                    onClick={() => remove(name)}
                                                    style={{ color: "#ff4d4f", fontSize: 16 }}
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
                                    Add Type
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={assignTicketMutation.isPending}
                    icon={<TagsOutlined />}
                    style={{ marginTop: 8 }}
                >
                    Assign Ticket & Types
                </Button>
            </Form>

            {/* Ticket Inventory Data */}
            {selectedTicketId && (
                <Spin spinning={ticketInventoryLoading}>
                    {ticketInventory && (
                        <>
                            {ticketInventory?.history?.length > 0 && (
                                <Table
                                    dataSource={ticketInventory.history}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    columns={[
                                        {
                                            title: 'Qty',
                                            dataIndex: 'quantity',
                                            width: 60,
                                        },
                                        {
                                            title: 'Range',
                                            render: (_, r) => `${r.batch_index_range?.start} - ${r.batch_index_range?.end}`,
                                        },
                                        {
                                            title: 'Assigned By',
                                            dataIndex: 'assigned_by_user_name',
                                        },
                                        {
                                            title: 'Date',
                                            dataIndex: 'assigned_at',
                                            render: (v) => v?.split(' ')[0],
                                        },
                                    ]}
                                />
                            )}
                        </>
                    )}
                </Spin>
            )}
        </Card>
    );
};

export default AssignTicketForm;

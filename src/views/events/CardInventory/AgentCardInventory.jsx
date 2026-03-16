import { Card, Select, Typography, Space, Spin, Alert, Col, Row, Table, Form, InputNumber, Input, Button, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from 'auth/FetchInterceptor';
import { UserOutlined, TagsOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import useTicketInventory from "./hooks/useTicketInventory";
import TicketSelect from "./TicketSelect";
import Utils from "utils";
import { PERMISSIONS } from "constants/PermissionConstant";
import PermissionChecker from "layouts/PermissionChecker";
import { useMemo, useState } from 'react';

const { Text } = Typography;
const { TextArea } = Input;

const AgentCardInventory = ({ selectedEventId, ticketOptions, summary, refetchSummary }) => {
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [form] = Form.useForm();

    // Unassigned blocks for validation
    const unassignedBlocks = useMemo(() => {
        return (summary?.summary?.type_breakdown || []).filter(t => t.type === 'unassigned');
    }, [summary]);

    // Mutation for assigning user
    const assignMutation = useMutation({
        mutationFn: async (payload) => {
            return await apiClient.post("card-tokens/assign-user", payload);
        },
        onSuccess: (res) => {
            message.success(res?.message || "Assigned successfully");
            form.resetFields();
            refetchTicketInventory();
            refetchSummary?.();
        },
        onError: (err) => {
            message.error(Utils.getErrorMessage(err, "Failed to assign"));
        }
    });

    const handleAssign = (values) => {
        if (!selectedEventId || !selectedTicketId || !selectedAgent) return;

        // Construct payload with ranges array
        const payload = {
            event_id: selectedEventId,
            ticket_id: selectedTicketId,
            user_id: selectedAgent,
            ranges: values.ranges || [],
        };

        assignMutation.mutate(payload);
    };

    const { data: agents = [], isLoading, error } = useQuery({
        queryKey: ['agents-list'],
        queryFn: async () => {
            const res = await apiClient.get('users-by-role/agent');
            // Check for users array in res or res.data
            const users = res?.users || res?.data?.users || [];
            return Array.isArray(users) ? users : [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: userRanges } = useQuery({
        queryKey: ['user-ranges', selectedAgent],
        queryFn: async () => {
            const res = await apiClient.get(`card-tokens/user-ranges/${selectedAgent}`, {
                params: {
                    event_id: selectedEventId,
                    user_id: selectedAgent,
                    // ticket_id: selectedTicketId,
                }
            });
            return res.data || res;
        },
        enabled: !!selectedAgent,
    });

    const { data: ticketInventory, isLoading: ticketInventoryLoading, refetch: refetchTicketInventory } = useTicketInventory(
        selectedEventId,
        selectedTicketId,
        "offline"
    );

    const agentOptions = useMemo(() => {
        return agents; // Agents are already in { label, value } format
    }, [agents]);

    const handleAgentChange = (value) => {
        setSelectedAgent(value);
    };

    return (
        <Card
            title={
                <Space>
                    <UserOutlined />
                    <span>Agent Selection</span>
                </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
        >
            <Row gutter={16}>

                {/* Agent Select */}
                <Col xs={24} md={12}>
                    <Text
                        style={{
                            marginBottom: 4,
                            display: "block",
                            fontWeight: 500,
                            fontSize: 13,
                        }}
                    >
                        Select Agent
                    </Text>

                    {error ? (
                        <Alert message="Failed to load agents" description={Utils.getErrorMessage(error)} type="error" showIcon />
                    ) : (
                        <Select
                            placeholder="Select an Agent"
                            allowClear
                            showSearch
                            loading={isLoading}
                            value={selectedAgent}
                            onChange={handleAgentChange}
                            style={{ width: "100%" }}
                            optionFilterProp="label"
                            options={agentOptions}
                            notFoundContent={isLoading ? <Spin size="small" /> : null}
                        />
                    )}
                </Col>

                {/* Ticket Select */}
                <Col xs={24} md={12}>
                    <Text
                        style={{
                            marginBottom: 4,
                            display: "block",
                            fontWeight: 500,
                            fontSize: 13,
                        }}
                    >
                        Select Ticket
                    </Text>

                    <TicketSelect
                        options={ticketOptions}
                        value={selectedTicketId}
                        onChange={setSelectedTicketId}
                        disabled={!selectedEventId}
                        placeholder="Select a ticket"
                    />
                </Col>
            </Row>

            {/* Agent Inventory */}
            {selectedAgent && userRanges && (
                <div style={{ marginTop: 24, marginBottom: 24 }}>
                    <Text strong style={{ marginBottom: 12, display: 'block' }}>Agent's Current Inventory</Text>
                    <Table
                        dataSource={userRanges?.ranges || []}
                        rowKey="assignment_id"
                        pagination={false}
                        size="small"
                        scroll={{ x: true }}
                        columns={[
                            {
                                title: 'Ticket',
                                dataIndex: 'ticket_name',
                                key: 'ticket_name',
                            },
                            {
                                title: 'Range',
                                key: 'range',
                                render: (_, record) => (
                                    <Space direction="vertical" size={0}>
                                        <Text>{record.ticket_prefix}{record.range_start} - {record.ticket_prefix}{record.range_end}</Text>
                                        {/* {record.ticket_prefix && <Text type="secondary" style={{ fontSize: 11 }}>Prefix: {record.ticket_prefix}</Text>} */}
                                    </Space>
                                )
                            },
                            {
                                title: 'Tokens',
                                children: [
                                    {
                                        title: 'Total',
                                        dataIndex: 'total_tokens',
                                        key: 'total_tokens',
                                    },
                                    {
                                        title: 'Claimed',
                                        dataIndex: 'claimed_tokens',
                                        key: 'claimed_tokens',
                                    },
                                    {
                                        title: 'Available',
                                        dataIndex: 'available_tokens',
                                        key: 'available_tokens',
                                    }
                                ]
                            },
                            {
                                title: 'Assigned At',
                                dataIndex: 'assigned_at',
                                key: 'assigned_at',
                                render: (val) => val ? val.split(' ')[0] : '-',
                            }
                        ]}
                    />
                </div>
            )}


            {/* Ticket Inventory Data */}
            {selectedTicketId && (
                <div style={{ marginTop: 16 }}>
                    <Spin spinning={ticketInventoryLoading}>
                        {ticketInventory?.history?.length > 0 ? (
                            <Table
                                dataSource={ticketInventory.history}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                scroll={{ y: 300 }}
                                columns={[
                                    {
                                        title: 'Qty',
                                        dataIndex: 'quantity',
                                        width: 80,
                                    },
                                    {
                                        title: 'Range',
                                        render: (_, record) => `${record.batch_index_range?.start} - ${record.batch_index_range?.end}`,
                                    },
                                    {
                                        title: 'Assigned By',
                                        dataIndex: 'assigned_by_user_name',
                                    },
                                    {
                                        title: 'Date',
                                        dataIndex: 'assigned_at',
                                        render: (val) => val?.split(' ')[0],
                                    },
                                ]}
                            />
                        ) : (
                            !ticketInventoryLoading && <div style={{ color: '#999', fontStyle: 'italic' }}>No inventory history</div>
                        )}
                    </Spin>
                </div>
            )}

            {/* Assignment Form */}
            {selectedEventId && selectedTicketId && selectedAgent && (
                <div className='mt-3'>
                    <Text strong style={{ marginBottom: 12, display: 'block' }}>Assign Inventory to Agent</Text>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleAssign}
                        disabled={assignMutation.isPending}
                        initialValues={{ ranges: [{}] }}
                    >
                        <Form.List name="ranges">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            key={key}
                                            size="small"

                                            bodyStyle={{ padding: '12px 12px 0 12px' }}
                                        >
                                            <Row gutter={16} align="middle">
                                                <Col xs={24} md={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        label={name === 0 ? "Range Start" : undefined}
                                                        name={[name, 'range_start']}
                                                        rules={[
                                                            { required: true, message: "Required" },
                                                            {
                                                                validator(_, value) {
                                                                    if (!value) return Promise.resolve();

                                                                    // 1. Check for duplicate Start in the form
                                                                    const allRanges = form.getFieldValue('ranges') || [];
                                                                    // We are at index `name`. Check if any other row has this same start value.
                                                                    // Use strict equality check.
                                                                    const isDuplicate = allRanges.some((r, index) => index !== name && r?.range_start === value);
                                                                    if (isDuplicate) {
                                                                        return Promise.reject(new Error("Duplicate start range"));
                                                                    }

                                                                    // 2. Check if this range is ALREADY assigned to THIS agent (Prevent Double Assignment)
                                                                    const agentRanges = userRanges?.ranges || [];
                                                                    // Only check ranges for the CURRENTLY selected ticket
                                                                    const relevantAgentRanges = agentRanges.filter(r => r.ticket_id === selectedTicketId);

                                                                    const alreadyHas = relevantAgentRanges.find(r =>
                                                                        value >= r.range_start && value <= r.range_end
                                                                    );

                                                                    if (alreadyHas) {
                                                                        return Promise.reject(new Error(`Already assigned to this agent (${alreadyHas.range_start}-${alreadyHas.range_end})`));
                                                                    }

                                                                    // 3. Check if start exists in this ticket's available inventory (history)
                                                                    const history = ticketInventory?.history || [];
                                                                    const validBatch = history.find(r =>
                                                                        r.batch_index_range &&
                                                                        value >= r.batch_index_range.start &&
                                                                        value <= r.batch_index_range.end
                                                                    );

                                                                    // if (!validBatch) {
                                                                    //     return Promise.reject(new Error(`Start index not found`));
                                                                    // }

                                                                    return Promise.resolve();
                                                                },
                                                            },
                                                        ]}
                                                    >
                                                        <InputNumber
                                                            placeholder="Start"
                                                            style={{ width: '100%' }}
                                                            min={1}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        label={name === 0 ? "Quantity" : undefined}
                                                        name={[name, 'quantity']}
                                                        rules={[
                                                            { required: true, message: "Required" },
                                                            {
                                                                validator(_, value) {
                                                                    if (!value) return Promise.resolve();
                                                                    const currentStart = form.getFieldValue(['ranges', name, 'range_start']);

                                                                    if (currentStart) {
                                                                        // 1. Check for OVERLAP with other ranges in the form
                                                                        const currentEnd = currentStart + value - 1;
                                                                        const allRanges = form.getFieldValue('ranges') || [];

                                                                        const hasOverlap = allRanges.some((r, index) => {
                                                                            if (index === name) return false; // Skip self
                                                                            if (!r?.range_start || !r?.quantity) return false;

                                                                            const otherStart = r.range_start;
                                                                            const otherEnd = r.range_start + r.quantity - 1;

                                                                            // Check intersection: max(starts) <= min(ends)
                                                                            return Math.max(currentStart, otherStart) <= Math.min(currentEnd, otherEnd);
                                                                        });

                                                                        if (hasOverlap) {
                                                                            return Promise.reject(new Error("Overlaps with another range"));
                                                                        }

                                                                        // 2. Check overlap with Agent's EXISTING inventory
                                                                        const agentRanges = userRanges?.ranges || [];
                                                                        const relevantAgentRanges = agentRanges.filter(r => r.ticket_id === selectedTicketId);

                                                                        const overlapWithAgent = relevantAgentRanges.find(r =>
                                                                            Math.max(currentStart, r.range_start) <= Math.min(currentEnd, r.range_end)
                                                                        );

                                                                        if (overlapWithAgent) {
                                                                            return Promise.reject(new Error(`Overlaps with agent's inventory (${overlapWithAgent.range_start}-${overlapWithAgent.range_end})`));
                                                                        }

                                                                        // 3. Check max quantity against the specific batch
                                                                        const history = ticketInventory?.history || [];
                                                                        const validBatch = history.find(r =>
                                                                            r.batch_index_range &&
                                                                            currentStart >= r.batch_index_range.start &&
                                                                            currentStart <= r.batch_index_range.end
                                                                        );

                                                                        if (validBatch) {
                                                                            const maxForBatch = validBatch.batch_index_range.end - currentStart + 1;
                                                                            if (value > maxForBatch) {
                                                                                return Promise.reject(new Error(`Max ${maxForBatch}`));
                                                                            }
                                                                        }
                                                                    }
                                                                    return Promise.resolve();
                                                                },
                                                            },
                                                        ]}
                                                    >
                                                        <InputNumber
                                                            placeholder="Qty"
                                                            style={{ width: '100%' }}
                                                            min={1}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={4}>
                                                    <Form.Item
                                                        label={name === 0 ? "Range End" : undefined}
                                                        dependencies={[['ranges', name, 'range_start'], ['ranges', name, 'quantity']]}
                                                        shouldUpdate={(prevValues, currentValues) => {
                                                            const prevStart = prevValues?.ranges?.[name]?.range_start;
                                                            const prevQty = prevValues?.ranges?.[name]?.quantity;
                                                            const currStart = currentValues?.ranges?.[name]?.range_start;
                                                            const currQty = currentValues?.ranges?.[name]?.quantity;
                                                            return prevStart !== currStart || prevQty !== currQty;
                                                        }}
                                                    >
                                                        {() => {
                                                            const allRanges = form.getFieldValue('ranges') || [];
                                                            const currentRange = allRanges[name];
                                                            const rangeStart = currentRange?.range_start;
                                                            const quantity = currentRange?.quantity;
                                                            const rangeEnd = rangeStart && quantity ? rangeStart + quantity - 1 : null;
                                                            return (
                                                                <InputNumber
                                                                    value={rangeEnd}
                                                                    disabled
                                                                    placeholder="—"
                                                                    style={{ width: '100%' }}
                                                                    formatter={(value) => value ? String(value) : '—'}
                                                                />
                                                            );
                                                        }}
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        label={name === 0 ? "Notes" : undefined}
                                                        name={[name, 'notes']}
                                                    >
                                                        <Input placeholder="Notes" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={2} style={{ textAlign: 'center' }}>
                                                    {fields.length > 1 && (
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(name)}
                                                            style={{ marginTop: name === 0 ? 30 : 0 }}
                                                        />
                                                    )}
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Add Another Range
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                        <PermissionChecker permission={PERMISSIONS.ASSIGN_CARD_TOKENS}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                block
                                loading={assignMutation.isPending}
                            >
                                Assign to Agent
                            </Button>
                        </PermissionChecker>
                    </Form>
                </div>
            )}


            {/* here */}
        </Card>

    );
};

export default AgentCardInventory;

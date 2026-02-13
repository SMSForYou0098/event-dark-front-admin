import React, { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Card,
    Select,
    InputNumber,
    Input,
    Button,
    Typography,
    Space,
    Row,
    Col,
    message,
    Alert,
    Divider,
    Statistic,
    Skeleton,
    Tag,
    Table,
} from "antd";
import {
    PlusCircleOutlined,
} from "@ant-design/icons";
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from "Context/MyContextProvider";
import { useOrganizerEvents } from "views/events/Settings/hooks/useBanners";
import AssignTicketForm from "./AssignTicketForm";
import AgentCardInventory from "./AgentCardInventory";

const { Text } = Typography;

const CardInventory = () => {
    const { UserData } = useMyContext();

    // Event selection
    const [selectedEventId, setSelectedEventId] = useState(null);

    // Create Tokens state
    const [createQuantity, setCreateQuantity] = useState(null);
    const [createPrefix, setCreatePrefix] = useState('');

    // Fetch events (includes tickets per event)
    const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
        UserData?.id,
        UserData?.role
    );

    // Get tickets for the selected event
    const ticketOptions = useMemo(() => {
        if (!selectedEventId) return [];
        const selectedEvent = events.find((e) => e.value === selectedEventId);
        if (!selectedEvent?.tickets) return [];
        return selectedEvent.tickets.map((ticket) => ({
            label: ticket.name,
            value: ticket.id,
        }));
    }, [selectedEventId, events]);

    // Check if the selected event uses preprinted cards
    const usePreprintedCards = useMemo(() => {
        if (!selectedEventId) return false;
        const selectedEvent = events.find((e) => e.value === selectedEventId);
        const firstTicket = selectedEvent?.tickets?.[0];
        return firstTicket?.event?.event_controls?.use_preprinted_cards === true;
    }, [selectedEventId, events]);

    // Fetch summary for selected event
    const { data: summary, isLoading: summaryLoading, isError: summaryError, error: summaryErrorData, refetch: refetchSummary } = useQuery({
        queryKey: ["card-tokens-summary", selectedEventId],
        queryFn: async () => {
            const res = await apiClient.post("card-tokens/summary", {
                event_id: selectedEventId,
            });
            return res?.data || res;
        },
        enabled: !!selectedEventId,
    });

    // ==================== MUTATIONS ====================

    // 1. Create Card Tokens
    const createTokensMutation = useMutation({
        mutationFn: async (payload) => {
            return await apiClient.post("card-tokens/create", payload);
        },
        onSuccess: (res) => {
            message.success(res?.message || "Tokens created successfully");
            setCreateQuantity(null);
            setCreatePrefix('');
            refetchSummary?.();
        },
        onError: (error) => {
            message.error(
                error?.response?.data?.message || "Failed to create tokens"
            );
        },
    });

    // ==================== HANDLERS ====================

    const handleCreateTokens = () => {
        if (usePreprintedCards) {
            if (!selectedEventId || !createPrefix) {
                message.warning("Please select an event and enter a card prefix");
                return;
            }
            createTokensMutation.mutate({
                event_id: selectedEventId,
                quantity: 1,
                prefix: createPrefix,
            });
        } else {
            if (!selectedEventId || !createQuantity) {
                message.warning("Please select an event and enter a quantity");
                return;
            }
            createTokensMutation.mutate({
                event_id: selectedEventId,
                quantity: createQuantity,
            });
        }
    };

    // Reset ticket selection when event changes
    const handleEventChange = (value) => {
        setSelectedEventId(value);
    };

    // ==================== RENDER ====================

    const cardStyle = {
        borderRadius: 12,
        height: "100%",
    };

    const fieldLabelStyle = {
        marginBottom: 4,
        display: "block",
        fontWeight: 500,
        fontSize: 13,
    };

    return (
        <div>
            {/* Event Selection */}
            <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
                <Space wrap size="middle" align="center">
                    <Text strong style={{ fontSize: 16 }}>
                        Card Inventory
                    </Text>
                    <Divider type="vertical" />
                    <Text strong>Event:</Text>
                    <Select
                        placeholder="Select an Event"
                        allowClear
                        showSearch
                        loading={eventsLoading}
                        value={selectedEventId}
                        onChange={handleEventChange}
                        style={{ minWidth: 280 }}
                        optionFilterProp="label"
                        options={events}
                    />
                </Space>
            </Card>

            {!selectedEventId && (
                <Alert
                    message="Please select an event to manage card inventory"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                />
            )}

            {/* Summary */}
            {/* Summary */}
            {selectedEventId && (
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={12} md={6}>
                        <Card bordered={false} style={{ borderRadius: 12 }}>
                            <Skeleton loading={summaryLoading} active paragraph={{ rows: 1 }}>
                                <Statistic title="Total Tokens" value={summary?.summary?.total} />
                            </Skeleton>
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card bordered={false} style={{ borderRadius: 12 }}>
                            <Skeleton loading={summaryLoading} active paragraph={{ rows: 1 }}>
                                <Statistic title="Online" value={summary?.summary?.type_counts?.online || 0} valueStyle={{ color: '#52c41a' }} />
                            </Skeleton>
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card bordered={false} style={{ borderRadius: 12 }}>
                            <Skeleton loading={summaryLoading} active paragraph={{ rows: 1 }}>
                                <Statistic title="Offline" value={summary?.summary?.type_counts?.offline || 0} valueStyle={{ color: '#1890ff' }} />
                            </Skeleton>
                        </Card>
                    </Col>
                    <Col xs={12} md={6}>
                        <Card bordered={false} style={{ borderRadius: 12 }}>
                            <Skeleton loading={summaryLoading} active paragraph={{ rows: 1 }}>
                                <Statistic title="Available" value={summary?.summary?.status_counts?.available || 0} valueStyle={{ color: '#faad14' }} />
                            </Skeleton>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Action Cards */}
            {selectedEventId && (
                summaryError ? (
                    <Alert
                        message="Failed to load summary"
                        description={summaryErrorData?.response?.data?.message || summaryErrorData?.message || 'Something went wrong'}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16, borderRadius: 8 }}
                    />
                ) : (
                    <Row gutter={[16, 16]}>
                        {/* 1. Create Card Tokens */}
                        <Col xs={24} md={10}>
                            <Card
                                title={
                                    summaryLoading === false &&
                                    <Space>
                                        <PlusCircleOutlined />
                                        <span>Create Card Tokens</span>
                                    </Space>
                                }
                                bordered={false}
                                style={cardStyle}
                            >
                                <Skeleton loading={summaryLoading} active>
                                    <div style={{ marginBottom: 16 }}>
                                        {usePreprintedCards ? (
                                            <>
                                                <Text style={fieldLabelStyle}>Card Prefix</Text>
                                                <Input
                                                    placeholder="Enter card prefix"
                                                    value={createPrefix}
                                                    onChange={(e) => setCreatePrefix(e.target.value)}
                                                    style={{ width: "100%" }}
                                                    disabled={!selectedEventId}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Text style={fieldLabelStyle}>Quantity (1 - 10,000)</Text>
                                                <InputNumber
                                                    placeholder="Enter quantity"
                                                    min={1}
                                                    max={10000}
                                                    value={createQuantity}
                                                    onChange={setCreateQuantity}
                                                    style={{ width: "100%" }}
                                                    disabled={!selectedEventId}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <Button
                                        type="primary"
                                        block
                                        onClick={handleCreateTokens}
                                        loading={createTokensMutation.isPending}
                                        disabled={!selectedEventId || (usePreprintedCards ? !createPrefix : !createQuantity)}
                                        icon={<PlusCircleOutlined />}
                                    >
                                        Create Tokens
                                    </Button>
                                    {createTokensMutation.data?.data && (
                                        <Alert
                                            message={`Created ${createTokensMutation.data.data.tokens_created} tokens (Index ${createTokensMutation.data.data.batch_index_range?.start} - ${createTokensMutation.data.data.batch_index_range?.end})`}
                                            type="success"
                                            showIcon
                                            style={{ marginTop: 12, borderRadius: 8 }}
                                        />
                                    )}
                                    {summary?.summary?.type_breakdown?.length > 0 && (

                                        <Table
                                            dataSource={summary?.summary?.type_breakdown}
                                            rowKey={(r, i) => i}
                                            pagination={false}
                                            size="small"
                                            className="mt-3"
                                            columns={[
                                                {
                                                    title: 'Type',
                                                    dataIndex: 'type',
                                                    render: (v) => (
                                                        <Tag color={v === 'online' ? 'green' : 'blue'}>
                                                            {v?.toUpperCase()}
                                                        </Tag>
                                                    ),
                                                },
                                                { title: 'Quantity', dataIndex: 'count' },
                                                { title: 'Range', render: (_, record) => `${record.range_start}-${record.range_end}` },
                                            ]}
                                        />
                                    )}
                                </Skeleton>
                            </Card>

                        </Col>

                        {/* 2. Assign Ticket & Types (New Component) */}
                        <Col xs={24} md={14}>
                            {summaryLoading ? (
                                <>
                                    <Card bordered={false} style={cardStyle}><Skeleton active paragraph={{ rows: 4 }} /></Card>
                                    <Card bordered={false} style={{ ...cardStyle, marginTop: 16 }}><Skeleton active paragraph={{ rows: 4 }} /></Card>
                                </>
                            ) : (
                                <>
                                    <AssignTicketForm
                                        selectedEventId={selectedEventId}
                                        ticketOptions={ticketOptions}
                                        summary={summary}
                                        refetchSummary={refetchSummary}
                                    />
                                    <AgentCardInventory
                                        selectedEventId={selectedEventId}
                                        ticketOptions={ticketOptions}
                                        summary={summary}
                                        refetchSummary={refetchSummary}
                                    />
                                </>
                            )}
                        </Col>
                    </Row>
                )
            )}
        </div>
    );
};

export default CardInventory;

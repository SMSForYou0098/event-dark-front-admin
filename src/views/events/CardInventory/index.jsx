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
    Dropdown,
} from "antd";
import {
    ExportOutlined,
    PlusCircleOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from "Context/MyContextProvider";
import { useOrganizerEvents } from "views/events/Settings/hooks/useBanners";
import AssignTicketForm from "./AssignTicketForm";
import AgentCardInventory from "./AgentCardInventory";
import ExportTokensDrawer from "./ExportTokensDrawer";

const { Text } = Typography;

const CardInventory = () => {
    const { UserData } = useMyContext();

    // Event selection
    const [selectedEventId, setSelectedEventId] = useState(null);

    // Create Tokens state
    const [createQuantity, setCreateQuantity] = useState(null);
    const [createPrefix, setCreatePrefix] = useState('');

    // View mode: 'assign', 'unassign', or 'all'
    const [viewMode, setViewMode] = useState('assign');

    const [exportDrawerOpen, setExportDrawerOpen] = useState(false);

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

    // Filter type breakdown based on view mode
    const filteredTypeBreakdown = useMemo(() => {
        const breakdown = summary?.summary?.type_breakdown || [];
        if (viewMode === 'all') return breakdown;
        if (viewMode === 'unassign') {
            return breakdown.filter(item => item.type === 'unassigned');
        }
        // assign mode - show everything except unassigned
        return breakdown.filter(item => item.type !== 'unassigned');
    }, [summary, viewMode]);

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

    // Export Tokens
    const exportTokensMutation = useMutation({
        mutationFn: async (payload) => {
            return await apiClient.post("card-tokens/card/export", payload, { responseType: 'blob' });
        },
        onSuccess: async (res, payload) => {
            try {
                const blob = res?.data || res;
                const blobObj = blob instanceof Blob ? blob : new Blob([blob]);

                // If backend returned JSON error (e.g. { status: false, message: "..." }), blob will be small and parseable
                const text = await blobObj.slice(0, 500).text();
                if (typeof text === 'string' && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
                    try {
                        const json = JSON.parse(text);
                        if (json?.status === false && json?.message) {
                            message.error(json.message);
                            return;
                        }
                    } catch (_) { /* not JSON or invalid, treat as file */ }
                }

                const disposition = res?.headers?.['content-disposition'] || res?.headers?.['Content-Disposition'] || '';
                const dateStr = new Date().toISOString().split('T')[0];
                let filename = `cards_export_${dateStr}.xlsx`;
                if (payload?.type != null && payload?.status != null && payload?.range_start != null && payload?.range_end != null) {
                    filename = `cards_export_${payload.type}_${payload.status}_${payload.range_start}-${payload.range_end}.xlsx`;
                }
                if (disposition) {
                    const filenameMatch = disposition.match(/filename\*=UTF-8''([^;\n\r"]+)/);
                    if (filenameMatch?.[1]) {
                        filename = decodeURIComponent(filenameMatch[1]);
                    } else {
                        const fallbackMatch = disposition.match(/filename="?([^";]+)"?/);
                        if (fallbackMatch?.[1]) filename = fallbackMatch[1];
                    }
                }

                const url = window.URL.createObjectURL(blobObj);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                message.success('Tokens exported successfully');
            } catch (e) {
                message.error('Failed to process exported file');
            }
            setExportDrawerOpen(false);
        },
        onError: async (error) => {
            const data = error?.response?.data;
            if (data instanceof Blob) {
                try {
                    const text = await data.text();
                    const json = JSON.parse(text);
                    const msg = json?.message || error?.message || 'Failed to export tokens';
                    message.error(msg);
                    return;
                } catch (_) {}
            }
            message.error(
                error?.response?.data?.message || error?.message || 'Failed to export tokens'
            );
        },
    });
    const handleExport = (payload) => {
        if (!selectedEventId) {
            message.warning("Please select an event");
            return;
        }
        exportTokensMutation.mutate({
            event_id: selectedEventId,
            ...payload,
        });
    };

    const handleExportRow = (record, status) => {
        const type = record.type === 'unassigned' ? 'unassigned' : 'assigned';
        handleExport({
            type,
            range_start: record.range_start,
            range_end: record.range_end,
            status,
        });
    };

    return (
        <div>
            {/* Event Selection */}
            <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}
                title="Card Inventory"
                extra={
                    <>
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
                            className="mr-2 mb-2"
                    />
                    {selectedEventId && (
                        <Button
                            onClick={() => setExportDrawerOpen(true)}
                            icon={<ExportOutlined />}
                            disabled={!selectedEventId}
                        >
                            Export
                        </Button>
                    )}
                    </>
                }>

            </Card>

            <ExportTokensDrawer
                open={exportDrawerOpen}
                onClose={() => setExportDrawerOpen(false)}
                selectedEventId={selectedEventId}
                loading={exportTokensMutation.isPending}
                onExport={(payload) => handleExport(payload)}
            />

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
                    <>
                        {/* View Mode Selector */}

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
                                        <Select
                                            value={viewMode}
                                            className="mt-3 w-100"
                                            onChange={setViewMode}
                                            options={[
                                                { label: 'Assign', value: 'assign' },
                                                { label: 'Unassign', value: 'unassign' },
                                                { label: 'All', value: 'all' },
                                            ]}
                                        />
                                        {createTokensMutation.data?.data && (
                                            <Alert
                                                message={`Created ${createTokensMutation.data.data.tokens_created} tokens (Index ${createTokensMutation.data.data.batch_index_range?.start} - ${createTokensMutation.data.data.batch_index_range?.end})`}
                                                type="success"
                                                showIcon
                                                style={{ marginTop: 12, borderRadius: 8 }}
                                            />
                                        )}
                                        {/* Table with filtered data based on viewMode */}
                                        {filteredTypeBreakdown.length > 0 && (() => {
                                            const total = filteredTypeBreakdown.reduce((sum, record) => sum + (record.count || 0), 0);

                                            const tableColumns = [
                                                {
                                                    title: 'Type',
                                                    dataIndex: 'type',
                                                    render: (v) => {
                                                        const colorMap = {
                                                            'online': 'green',
                                                            'offline': 'blue',
                                                            'unassigned': 'default',
                                                        };
                                                        return (
                                                            <Tag color={colorMap[v] || 'default'}>
                                                                {v?.toUpperCase()}
                                                            </Tag>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: () => (
                                                        <span>
                                                            Quantity
                                                        </span>
                                                    ),
                                                    dataIndex: 'count',
                                                },
                                                { title: 'Range', render: (_, record) => `${record.range_start}-${record.range_end}` },
                                                {
                                                    title: 'Export',
                                                    key: 'export',
                                                    width: 120,
                                                    render: (_, record) =>
                                                        record.type === 'unassigned' ? (
                                                            <Button
                                                                size="small"
                                                                icon={<ExportOutlined />}
                                                                loading={exportTokensMutation.isPending}
                                                                onClick={() => handleExportRow(record, 'all')}
                                                            />
                                                        ) : (
                                                            <Dropdown
                                                                trigger={['click']}
                                                                placement="bottomRight"
                                                                menu={{
                                                                    items: [
                                                                        { key: 'claimed', label: 'Claimed' },
                                                                        { key: 'available', label: 'Available' },
                                                                        { key: 'all', label: 'All' },
                                                                    ],
                                                                    onClick: ({ key }) => handleExportRow(record, key),
                                                                }}
                                                            >
                                                                <Button
                                                                    size="small"
                                                                    icon={<ExportOutlined />}
                                                                    loading={exportTokensMutation.isPending}
                                                                >
                                                                    <MoreOutlined style={{ marginLeft: 4, fontSize: 10 }} />
                                                                </Button>
                                                            </Dropdown>
                                                        ),
                                                },
                                            ];

                                            return (
                                                <Table
                                                    dataSource={filteredTypeBreakdown}
                                                    rowKey={(r, i) => `${r.type}-${r.range_start}-${i}`}
                                                    pagination={false}
                                                    size="small"
                                                    className="mt-3"
                                                    columns={tableColumns}
                                                    summary={() => (
                                                        <Table.Summary  >
                                                            <Table.Summary.Row className='bg-dark border-0'>
                                                                <Table.Summary.Cell index={0}>
                                                                    <Text strong>Total</Text>
                                                                </Table.Summary.Cell>
                                                                <Table.Summary.Cell index={1}>
                                                                    <Text strong>{total}</Text>
                                                                </Table.Summary.Cell>
                                                                <Table.Summary.Cell index={2}>
                                                                    <Text type="secondary">—</Text>
                                                                </Table.Summary.Cell>
                                                                <Table.Summary.Cell index={3} />
                                                            </Table.Summary.Row>
                                                        </Table.Summary>
                                                    )}
                                                />
                                            );
                                        })()}
                                    </Skeleton>
                                </Card>

                            </Col>

                            {/* 2. Assign/Unassign Ticket & Types */}
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
                                            mode={viewMode === 'unassign' ? 'unassign' : 'assign'}
                                        />
                                        {viewMode !== 'unassign' && (
                                            <AgentCardInventory
                                                selectedEventId={selectedEventId}
                                                ticketOptions={ticketOptions}
                                                summary={summary}
                                                refetchSummary={refetchSummary}
                                            />
                                        )}
                                    </>
                                )}
                            </Col>
                        </Row>
                    </>
                )
            )}
        </div>
    );
};

export default CardInventory;

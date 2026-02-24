import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Typography, Row, Col, Statistic, Table, Spin, Empty, Tag, Progress } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import api from 'auth/FetchInterceptor';
import EventTicketDropdowns from '../common/EventTicketDropdowns';
import StatSection from '../Dashboard/components/StatSection';

const { Title, Text } = Typography;
const CARD_DASHBOARD = 'card-dashboard';

// Helper: normalize API response to get .data (backend returns { status, data })
const getData = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

const CardReport = () => {
    const { UserData, isMobile, userRole } = useMyContext();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const eventId = selectedEvent?.value;

    const handleEventChange = useCallback((event) => {
        setSelectedEvent(event);
        setSelectedTicketId(null);
    }, []);

    const ticketOptions = useMemo(() => {
        const list = selectedEvent?.tickets || [];
        if (!Array.isArray(list) || list.length === 0) return [];
        return list.map((t) => ({ value: t.id, label: t.name ?? `Ticket #${t.id}` }));
    }, [selectedEvent?.tickets]);

    useEffect(() => {
        if (ticketOptions.length > 0) {
            const firstValue = ticketOptions[0].value;
            const currentValid =
                selectedTicketId != null &&
                selectedTicketId !== '' &&
                ticketOptions.some((o) => o.value === selectedTicketId);
            if (!currentValid) setSelectedTicketId(firstValue);
        }
    }, [ticketOptions, selectedTicketId]);

    const { data: overviewRaw, isLoading: overviewLoading } = useQuery({
        queryKey: ['card-dashboard-overview', eventId],
        queryFn: () => api.post(`${CARD_DASHBOARD}/overview`, { event_id: eventId }),
        enabled: !!eventId,
    });

    const { data: agentBoardRaw, isLoading: agentBoardLoading } = useQuery({
        queryKey: ['card-dashboard-agent-board', eventId, selectedTicketId],
        queryFn: () =>
            api.post(`${CARD_DASHBOARD}/agent-board`, {
                event_id: eventId,
                ticket_id: selectedTicketId,
            }),
        enabled: !!eventId && !!selectedTicketId,
    });

    const { data: myReportRaw, isLoading: myReportLoading } = useQuery({
        queryKey: ['card-dashboard-my-report', eventId, userRole],
        queryFn: () => api.post(`${CARD_DASHBOARD}/my-report`, { event_id: eventId }),
        enabled: !!eventId && userRole === 'Agent',
    });

    const { data: dispatchProgressRaw, isLoading: dispatchProgressLoading } = useQuery({
        queryKey: ['card-dashboard-dispatch-progress', eventId],
        queryFn: () =>
            api.post(`${CARD_DASHBOARD}/dispatch-progress`, {
                event_id: eventId,
                status: 'dispatched',
                search: 'token123',
                per_page: 20,
            }),
        enabled: !!eventId,
    });

    const overview = getData(overviewRaw);
    const agentBoard = getData(agentBoardRaw);
    const myReport = getData(myReportRaw);
    const dispatchProgress = getData(dispatchProgressRaw);

    const anyLoading =
        overviewLoading || agentBoardLoading || myReportLoading || dispatchProgressLoading;

    // Overview: tokens stats
    const tokens = overview?.tokens;
    const byTicket = overview?.by_ticket || [];
    const dispatchOverview = overview?.dispatch;
    const agentsOverview = overview?.agents;

    // My Report
    const myReportMessage = myReportRaw?.message;
    const myReportSummary = myReport?.summary;
    const myReportRanges = myReport?.ranges || [];
    const myReportTokens = myReport?.tokens || [];

    // Dispatch Progress
    const dispatchSummary = dispatchProgress?.summary;
    const recentReassignments = dispatchProgress?.recent_reassignments || [];
    const dispatchPagination = dispatchProgress?.pagination;

    // Agent Board
    const agentsList = agentBoard?.agents || [];
    const totalAgents = agentBoard?.total_agents;

    const overviewStats = tokens
        ? [
            { title: 'Total', value: tokens.total },
            { title: 'Assigned', value: tokens.assigned },
            { title: 'Unassigned', value: tokens.unassigned },
            { title: 'Claimed', value: tokens.claimed },
            { title: 'Available', value: tokens.available },
            { title: 'Under agents', value: tokens.under_agents },
        ]
        : [];

    const byTicketColumns = [
        { title: 'Ticket', dataIndex: 'ticket_name', key: 'ticket_name', align: 'center' },
        { title: 'Prefix', dataIndex: 'prefix', key: 'prefix', align: 'center' },
        { title: 'Total', dataIndex: 'total', key: 'total', align: 'center', },
        { title: 'Claimed', dataIndex: 'claimed', key: 'claimed', align: 'center',  },
        { title: 'Available', dataIndex: 'available', key: 'available', align: 'center', },
        { title: 'Online', dataIndex: 'online', key: 'online', align: 'center', },
        { title: 'Offline', dataIndex: 'offline', key: 'offline', align: 'center', },
    ];

    const reassignmentColumns = [
        { title: 'Booking ID', dataIndex: 'booking_id', key: 'booking_id', width: 100 },
        { title: 'Previous Token', dataIndex: 'previous_token', key: 'previous_token' },
        { title: 'New Token', dataIndex: 'new_token', key: 'new_token' },
        { title: 'Replaced By', dataIndex: 'replaced_by', key: 'replaced_by' },
        { title: 'Reason', dataIndex: 'reason', key: 'reason' },
        {
            title: 'Replaced At',
            dataIndex: 'replaced_at',
            key: 'replaced_at',
            render: (v) => (v ? new Date(v).toLocaleString() : '—'),
        },
    ];

    const agentRangesColumns = [
        { title: 'Range', key: 'range', render: (_, r) => `${r.range_start} – ${r.range_end}` },
        { title: 'Ticket', dataIndex: 'ticket_name', key: 'ticket_name' },
        { title: 'Prefix', dataIndex: 'ticket_prefix', key: 'ticket_prefix', width: 80 },
        { title: 'Total', dataIndex: 'total_tokens', key: 'total_tokens', align: 'right' },
        { title: 'Claimed', dataIndex: 'claimed_tokens', key: 'claimed_tokens', align: 'right' },
        { title: 'Available', dataIndex: 'available_tokens', key: 'available_tokens', align: 'right' },
        { title: 'Assigned At', dataIndex: 'assigned_at', key: 'assigned_at' },
    ];

    const myReportRangesColumns = [
        { title: 'Ticket', dataIndex: 'ticket_name', key: 'ticket_name' },
        { title: 'Range Starts', dataIndex: 'range_start', key: 'range_start' },
        { title: 'Range Ends', dataIndex: 'range_end', key: 'range_end' },
        { title: 'Total Tokens', dataIndex: 'total_tokens', key: 'total_tokens', align: 'right' },
        { title: 'Assigned At', dataIndex: 'assigned_at', key: 'assigned_at' },
    ];

    const myReportTokensColumns = [
        { title: 'Token Number', dataIndex: 'token_number', key: 'token_number' },
        { title: 'Ticket', dataIndex: 'ticket_name', key: 'ticket_name' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'claimed') color = 'green';
                if (status === 'available') color = 'blue';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        { title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at' },
    ];

    return (
        <Card
            bordered={false}
            className="min-vh-100"
            title={<Title level={2} className="m-0">Card Report</Title>}
            extra={
                <EventTicketDropdowns
                    organizerId={UserData?.id}
                    role={UserData?.role}
                    selectedEvent={selectedEvent}
                    selectedTicketId={selectedTicketId}
                    onEventChange={handleEventChange}
                    onTicketChange={setSelectedTicketId}
                />
            }
        >
            {!selectedEvent ? (
                <Empty description="Select an event (and optionally a ticket) from the dropdowns above to view the card report." />
            ) : anyLoading ? (
                <div className="text-center p-5">
                    <Spin size="large" tip="Loading dashboard…" />
                </div>
            ) : (
                <>
                    {/* 1. Dashboard Overview */}
                    {overview && (
                        <div className="mb-4 rounded shadow-sm overflow-hidden">
                            {overviewStats.length > 0 && (
                                <Row>
                                    <StatSection
                                        title="Dashboard Overview"
                                        stats={overviewStats.map(s => ({ title: s.title, value: s.value }))}
                                        colConfig={{ xs: 12, sm: 8, md: 4 }}
                                        containerCol={{ span: 24 }}
                                        isMobile={isMobile}
                                    />
                                </Row>
                            )}

                            <Row gutter={[16, 16]} align="stretch" className="mb-4">
                                {tokens?.by_type && (
                                    <StatSection
                                        title={<span style={{ fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8c8c8c' }}>Tokens by Type</span>}
                                        stats={[
                                            { title: 'Online', value: tokens.by_type.online ?? 0 },
                                            { title: 'Offline', value: tokens.by_type.offline ?? 0 },
                                            { title: 'Untyped', value: tokens.by_type.untyped ?? 0 }
                                        ]}
                                        colConfig={{ span: 8 }}
                                        containerCol={{ xs: 24, md: 12 }}
                                        isMobile={isMobile}
                                    />
                                )}
                                {agentsOverview && (
                                    <StatSection
                                        title={<span style={{ fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8c8c8c' }}>Agent Allocation</span>}
                                        stats={[
                                            { title: 'Total Agents', value: agentsOverview.total_agents },
                                            { title: 'Tokens Under Agents', value: agentsOverview.total_tokens_under_agents }
                                        ]}
                                        colConfig={{ span: 8 }}
                                        containerCol={{ xs: 24, md: 12 }}
                                        isMobile={isMobile}
                                    />
                                )}
                            </Row>

                            {dispatchOverview && (
                                <Row className="mb-4">
                                    <StatSection
                                        title={<span style={{ fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8c8c8c' }}>Global Dispatch Status</span>}
                                        stats={[
                                            { title: 'Total', value: dispatchOverview.total },
                                            { title: 'Pending', value: dispatchOverview.pending },
                                            { title: 'Dispatched', value: dispatchOverview.dispatched },
                                            { title: 'In Transit', value: dispatchOverview.in_transit },
                                            { title: 'Delivered', value: dispatchOverview.delivered },
                                            { title: 'Returned/Cancel', value: (dispatchOverview.returned || 0) + (dispatchOverview.cancelled || 0) }
                                        ]}
                                        colConfig={{ xs: 12, sm: 8, md: 4 }}
                                        containerCol={{ span: 24 }}
                                        isMobile={isMobile}
                                    />
                                </Row>
                            )}

                            {byTicket.length > 0 && (
                                <div className="mt-4">
                                    <Title level={5}>Ticket Breakdown</Title>
                                    <Table
                                        size="small"
                                        rowKey="ticket_id"
                                        dataSource={byTicket}
                                        columns={byTicketColumns}
                                        pagination={false}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. My Agent Report */}
                    {(myReport || myReportMessage) && (
                        <div className="mb-4 rounded shadow-sm overflow-hidden">
                            {myReportMessage && <Text type="secondary" className="d-block mb-3">{myReportMessage}</Text>}
                            {myReportSummary && (
                                <Row>
                                    <StatSection
                                        title={<span style={{ color: '#722ed1' }}>My Agent Report</span>}
                                        stats={[
                                            { title: 'Total Allocated', value: myReportSummary.total },
                                            { title: 'Claimed', value: myReportSummary.claimed },
                                            { title: 'Available', value: myReportSummary.available }
                                        ]}
                                        colConfig={{ xs: 24, sm: 8 }}
                                        containerCol={{ span: 24 }}
                                        isMobile={isMobile}
                                    />
                                </Row>
                            )}
                            {myReportRanges.length > 0 && (
                                <div className="mt-4">
                                    <Title level={5}>Assigned Ranges</Title>
                                    <Table
                                        dataSource={myReportRanges}
                                        columns={myReportRangesColumns}
                                        rowKey={(r) => `${r.range_start}-${r.range_end}`}
                                        size="small"
                                        pagination={{ pageSize: 5 }}
                                    />
                                </div>
                            )}
                            {myReportTokens.length > 0 && (
                                <div className="mt-4">
                                    <Title level={5}>Individual Tokens</Title>
                                    <Table
                                        dataSource={myReportTokens}
                                        columns={myReportTokensColumns}
                                        rowKey="token_number"
                                        size="small"
                                        pagination={{ pageSize: 10 }}
                                    />
                                </div>
                            )}
                            {!myReportSummary && !myReportRanges.length && !myReportTokens.length && !myReportMessage && (
                                <Empty description="No data" />
                            )}
                        </div>
                    )}

                    {/* 3. Dispatch Progress */}
                    {dispatchProgress && (
                        <div className="mb-4 rounded shadow-sm overflow-hidden">
                            {dispatchSummary && (
                                <Row>
                                    <StatSection
                                        title="Dispatch Progress"
                                        stats={[
                                            { title: 'Total', value: dispatchSummary.total },
                                            { title: 'Dispatched', value: dispatchSummary.dispatched },
                                            { title: 'In transit', value: dispatchSummary.in_transit },
                                            { title: 'Delivered', value: dispatchSummary.delivered },
                                            { title: 'Returned', value: dispatchSummary.returned },
                                            { title: 'Cancelled', value: dispatchSummary.cancelled },
                                            { title: 'Pending', value: dispatchSummary.pending },
                                        ]}
                                        colConfig={{ xs: 12, sm: 8, md: 4, xl: 3 }}
                                        containerCol={{ span: 24 }}
                                        isMobile={isMobile}
                                    />
                                </Row>
                            )}
                            {recentReassignments.length > 0 && (
                                <>
                                    <Title level={5}>Recent reassignments</Title>
                                    <Table
                                        size="small"
                                        rowKey="id"
                                        dataSource={recentReassignments}
                                        columns={reassignmentColumns}
                                        pagination={dispatchPagination ? { pageSize: 10, total: dispatchPagination.total } : false}
                                    />
                                </>
                            )}
                            {!dispatchSummary && recentReassignments.length === 0 && (
                                <Empty description="No dispatch data" />
                            )}
                        </div>
                    )}

                    {/* 4. Agent Board (when ticket selected) */}
                    {selectedTicketId && (
                        <div className="mb-4 rounded shadow-sm overflow-hidden">
                            <div className="">
                                <Title level={4} className="m-0 text-info">Agent Board</Title>
                            </div>
                            {agentBoardLoading ? (
                                <div className="text-center p-4"><Spin /></div>
                            ) : agentsList.length === 0 ? (
                                <Empty description="No agents / assignments for this ticket" />
                            ) : (
                                <>
                                    {totalAgents != null && (
                                        <Row className="mb-4">
                                            <StatSection
                                                title=""
                                                stats={[{ title: 'Total Agents', value: totalAgents }]}
                                                colConfig={{ xs: 24, sm: 8, md: 4 }}
                                                containerCol={{ span: 24 }}
                                                isMobile={isMobile}
                                            />
                                        </Row>
                                    )}
                                    {agentsList.map((agent) => (
                                        <Card key={agent.user_id} bordered={true} className="mb-3 rounded border-light">
                                            <Row gutter={[16, 8]}>
                                                <Col span={24}>
                                                    <Text strong>{agent.user_name}</Text>
                                                    {agent.user_email && <><br /><Text type="secondary">{agent.user_email}</Text></>}
                                                    {agent.user_number && <><br /><Text type="secondary">{agent.user_number}</Text></>}
                                                </Col>
                                                <Col xs={12} sm={6}>
                                                    <Statistic title="Total tokens" value={agent.total_tokens} />
                                                </Col>
                                                <Col xs={12} sm={12}>
                                                    <Text type="secondary" className="d-block mb-1" style={{ fontSize: '12px' }}>Claimed vs Available</Text>
                                                    <Progress
                                                        percent={agent.total_tokens > 0 ? Math.round((agent.claimed_tokens / agent.total_tokens) * 100) : 0}
                                                        success={{ percent: agent.total_tokens > 0 ? Math.round((agent.claimed_tokens / agent.total_tokens) * 100) : 0, strokeColor: '#52c41a' }}
                                                        format={() => `${agent.claimed_tokens} Claimed / ${agent.available_tokens} Avail`}
                                                        strokeColor="#1890ff"
                                                        status="active"
                                                    />
                                                </Col>
                                            </Row>
                                            {agent.ranges && agent.ranges.length > 0 && (
                                                <Table
                                                    size="small"
                                                    rowKey="assignment_id"
                                                    dataSource={agent.ranges}
                                                    columns={agentRangesColumns}
                                                    pagination={false}
                                                    className="mt-3"
                                                />
                                            )}
                                        </Card>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};

export default CardReport;

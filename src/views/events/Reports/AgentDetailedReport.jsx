import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { Spin, Card, Form, Row, Col } from 'antd';
import { OrganisationList } from 'utils/CommonInputs';
import { useMyContext } from 'Context/MyContextProvider';
import { ExpandDataTable } from '../common/ExpandDataTable';

const AgentDetailedReport = () => {
    const { UserData, userRole } = useMyContext();
    const [form] = Form.useForm();
    const [orgId, setOrgId] = useState(null);
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [agentDailyReports, setAgentDailyReports] = useState({});
    const [expansionLoading, setExpansionLoading] = useState({});

    // Initialize orgId from UserData if not set and user is an Organizer
    useEffect(() => {
        if (!orgId && UserData?.id && userRole === 'Organizer') {
            setOrgId(UserData.id);
            form.setFieldsValue({ org_id: String(UserData.id) });
        }
    }, [UserData, userRole, orgId, form]);

    // Calling the org/agent-stats API using TanStack Query
    const { data: statsData, isLoading, isError, error } = useQuery({
        queryKey: ['orgAgentStats', orgId],
        queryFn: async () => {
            if (!orgId) return null;
            const response = await api.get(`org/agent-stats?organizer_id=${orgId}`);
            return response;
        },
        enabled: !!orgId
    });

    const handleOrgChange = (value) => {
        setOrgId(value);
        setExpandedRowKeys([]);
        setAgentDailyReports({});
    };

    const handleExpandUpdate = async (expanded, record) => {
        const agentId = record.agent_id;

        if (expanded) {
            setExpandedRowKeys(prev => [...prev, agentId]);

            // Only fetch if not already loaded
            if (!agentDailyReports[agentId]) {
                setExpansionLoading(prev => ({ ...prev, [agentId]: true }));
                try {
                    const response = await api.get(`agent/daily-report/${agentId}`);
                    setAgentDailyReports(prev => ({ ...prev, [agentId]: response }));
                } catch (err) {
                    console.error("Error fetching agent daily report:", err);
                } finally {
                    setExpansionLoading(prev => ({ ...prev, [agentId]: false }));
                }
            }
        } else {
            setExpandedRowKeys(prev => prev.filter(key => key !== agentId));
        }
    };

    const columns = [
        {
            title: 'Agent ID',
            dataIndex: 'agent_id',
            key: 'agent_id',
            width: 100,
        },
        {
            title: 'Agent Name',
            dataIndex: 'agent_name',
            key: 'agent_name',
            sorter: (a, b) => a.agent_name.localeCompare(b.agent_name),
        },
        {
            title: 'Total Bookings',
            dataIndex: 'total_bookings',
            key: 'total_bookings',
            align: 'center',
            sorter: (a, b) => a.total_bookings - b.total_bookings,
        },
        {
            title: 'Total Sales',
            dataIndex: 'total_sales',
            key: 'total_sales',
            align: 'right',
            render: (val) => `₹${Number(val || 0).toLocaleString()}`,
            sorter: (a, b) => a.total_sales - b.total_sales,
        }
    ];

    const innerColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => (
                <span className="text-muted">
                    <i className="anticon anticon-calendar mr-2" />
                    {date}
                </span>
            )
        },
        {
            title: 'Daily Bookings',
            dataIndex: 'total_bookings',
            key: 'total_bookings',
            align: 'center',
            render: (val) => <div className="text-info font-weight-bold">{val}</div>
        },
        {
            title: 'Daily Sales',
            dataIndex: 'total_sales',
            key: 'total_sales',
            align: 'right',
            render: (val) => <span className="text-success">₹{Number(val || 0).toLocaleString()}</span>
        }
    ];

    const processedData = useMemo(() => {
        const rawData = Array.isArray(statsData) ? statsData : (statsData?.data || []);

        return rawData.map(item => ({
            ...item,
            id: item.agent_id,
            set_id: item.agent_id,
            is_set: true, // Mark as expandable for the component
            bookings: agentDailyReports[item.agent_id]?.data?.days || [],
            loading: expansionLoading[item.agent_id]
        }));
    }, [statsData, agentDailyReports, expansionLoading]);

    return (
        <div className="p-4">
            <Card className="mb-4">
                <Form form={form} layout="vertical">
                    <Row gutter={16} align="bottom">
                        <Col xs={24} sm={12} md={8}>
                            <OrganisationList onChange={handleOrgChange} />
                        </Col>
                        {orgId && (
                            <Col>
                                <div className="mb-4">
                                    <strong>Organizer ID:</strong> {orgId}
                                </div>
                            </Col>
                        )}
                    </Row>
                </Form>
            </Card>

            <ExpandDataTable
                title="Agent Detailed Report"
                columns={columns}
                innerColumns={innerColumns}
                data={processedData}
                loading={isLoading}
                showSearch={true}
                showReportSwitch={false}
                expandedRowKeys={expandedRowKeys}
                onExpand={handleExpandUpdate}
                tableProps={{
                    scroll: { x: 1200 }
                }}
            />

            {isError && (
                <Card className="m-3">
                    <div className="text-danger">
                        Error fetching agent stats: {error?.message || 'Unknown error'}
                    </div>
                </Card>
            )}
        </div>
    );
};


export default AgentDetailedReport;



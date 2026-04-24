import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { Card, Form, Row, Col, Select, Table } from 'antd';
import { OrganisationList } from 'utils/CommonInputs';
import { useMyContext } from 'Context/MyContextProvider';
import { ExpandDataTable } from '../common/ExpandDataTable';

const OrgUserDetailedReport = ({ type: propType }) => {
    const { UserData, userRole } = useMyContext();
    const [form] = Form.useForm();
    const [orgId, setOrgId] = useState(null);
    const [stateType, setStateType] = useState('agent');

    const isSpecificRole = useMemo(() => {
        const role = userRole?.toLowerCase();
        return ['pos', 'agent', 'sponsor'].includes(role);
    }, [userRole]);

    const currentType = propType || stateType;
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [agentDailyReports, setAgentDailyReports] = useState({});
    const [expansionLoading, setExpansionLoading] = useState({});

    // Initialize orgId and stateType from UserData if not set
    useEffect(() => {
        if (UserData?.id && userRole) {
            const lowerRole = userRole.toLowerCase();
            if (isSpecificRole) {
                setOrgId(UserData.id);
                setStateType(lowerRole);
            } else if (userRole === 'Organizer' && !orgId) {
                setOrgId(UserData.id);
                form.setFieldsValue({ org_id: String(UserData.id) });
            }
        }
    }, [UserData, userRole, orgId, form, isSpecificRole]);

    // Non-specific roles: fetch user stats for expandable table
    const { data: statsData, isLoading: isStatsLoading, isError: isStatsError, error: statsError } = useQuery({
        queryKey: ['orgUserStats', orgId, currentType],
        queryFn: async () => {
            if (!orgId) return null;
            const response = await api.get(`org/user-stats/${orgId}/${currentType}`);
            return response;
        },
        enabled: !!orgId && !isSpecificRole
    });

    // Specific roles (agent/pos/sponsor): fetch direct daily report only once
    const { data: specificRoleDailyData, isLoading: isDailyLoading, isError: isDailyError, error: dailyError } = useQuery({
        queryKey: ['specificRoleDailyReport', orgId, currentType],
        queryFn: async () => {
            if (!orgId || !currentType) return null;
            const response = await api.get(`daily-report/${orgId}/${currentType}`);
            return response;
        },
        enabled: !!orgId && !!currentType && isSpecificRole
    });

    const handleOrgChange = (value) => {
        setOrgId(value);
        setExpandedRowKeys([]);
        setAgentDailyReports({});
    };

    const handleTypeChange = (value) => {
        setStateType(value);
        setExpandedRowKeys([]);
        setAgentDailyReports({});
    };

    const handleExpandUpdate = async (expanded, record) => {
        const agentId = record.user_id;

        if (expanded) {
            setExpandedRowKeys(prev => [...prev, agentId]);

            // Only fetch if not already loaded
            if (!agentDailyReports[agentId]) {
                setExpansionLoading(prev => ({ ...prev, [agentId]: true }));
                try {
                    const lowerRole = userRole?.toLowerCase();
                    const fetchId = isSpecificRole ? UserData?.id : agentId;
                    const fetchType = isSpecificRole ? lowerRole : currentType;

                    const response = await api.get(`daily-report/${fetchId}/${fetchType}`);
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
            title: 'Name',
            dataIndex: 'user_name',
            key: 'user_name',
            sorter: (a, b) => a.user_name.localeCompare(b.user_name),
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
            align: 'center',
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
            align: 'center',
            render: (val) => <span className="text-success">₹{Number(val || 0).toLocaleString()}</span>
        }
    ];

    const processedData = useMemo(() => {
        const rawData = Array.isArray(statsData) ? statsData : (statsData?.data || []);

        return rawData.map(item => ({
            ...item,
            id: item.user_id,
            set_id: item.user_id,
            is_set: true, // Mark as expandable for the component
            bookings: agentDailyReports[item.user_id]?.data?.days || [],
            loading: expansionLoading[item.user_id]
        }));
    }, [statsData, agentDailyReports, expansionLoading]);

    const summaryData = useMemo(() => {
        return statsData?.summary || { total_bookings: 0, total_sales: 0 };
    }, [statsData]);

    const specificRoleDaysData = useMemo(() => {
        return specificRoleDailyData?.data?.days || [];
    }, [specificRoleDailyData]);

    const specificRoleSummary = useMemo(() => {
        return specificRoleDailyData?.data?.summary || { total_bookings: 0, total_sales: 0 };
    }, [specificRoleDailyData]);

    const specificRoleColumns = [
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
            align: 'center',
            render: (val) => <span className="text-success">₹{Number(val || 0).toLocaleString()}</span>
        }
    ];

    const isLoading = isSpecificRole ? isDailyLoading : isStatsLoading;
    const isError = isSpecificRole ? isDailyError : isStatsError;
    const error = isSpecificRole ? dailyError : statsError;
    const activeSummary = isSpecificRole ? specificRoleSummary : summaryData;

    return (
        <div>
            {isSpecificRole ? (
                <Card title={`${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Detailed Report`} className="mb-3">
                    <Table
                        rowKey={(record) => record.date}
                        columns={specificRoleColumns}
                        dataSource={specificRoleDaysData}
                        loading={isLoading}
                        pagination={false}
                        scroll={{ x: 300 }}
                    />
                </Card>
            ) : (
                <ExpandDataTable
                    title={`${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Detailed Report`}
                    columns={columns}
                    innerColumns={innerColumns}
                    data={processedData}
                    loading={isLoading}
                    showSearch={false}
                    showReportSwitch={false}
                    expandedRowKeys={expandedRowKeys}
                    onExpand={handleExpandUpdate}
                    tableProps={{
                        scroll: { x: 300 }
                    }}
                    extraHeaderContent={
                        <>
                            {userRole === 'Admin' && (
                                <OrganisationList onChange={handleOrgChange} />
                            )}
                            {!propType && !isSpecificRole && (
                                <Form.Item name="type">
                                    <Select
                                        value={stateType}
                                        onChange={handleTypeChange}
                                        style={{ width: 130 }}
                                        placeholder="Select Role"
                                        options={[
                                            { value: 'agent', label: 'Agent' },
                                            { value: 'sponsor', label: 'Sponsor' },
                                            { value: 'pos', label: 'POS' },
                                        ]}
                                        
                                    />
                                </Form.Item>
                            )}
                        </>
                    }
                />
            )}

            {orgId && !isLoading && !isError && (
                <Row gutter={16} className="mb-4">
                    <Col xs={12} sm={12} md={12}>
                        <Card>
                            <div className="text-muted mb-1">Overall Total Bookings</div>
                            <div className="font-weight-bold" style={{ fontSize: 24 }}>{activeSummary.total_bookings}</div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={12} md={12}>
                        <Card>
                            <div className="text-muted mb-1">Overall Total Sales</div>
                            <div className="font-weight-bold text-success" style={{ fontSize: 24 }}>₹{Number(activeSummary.total_sales || 0).toLocaleString()}</div>
                        </Card>
                    </Col>
                </Row>
            )}


            {isError && (
                <Card className="m-3">
                    <div className="text-danger">
                        Error fetching stats: {error?.message || 'Unknown error'}
                    </div>
                </Card>
            )}
        </div>
    );
};


export default OrgUserDetailedReport;

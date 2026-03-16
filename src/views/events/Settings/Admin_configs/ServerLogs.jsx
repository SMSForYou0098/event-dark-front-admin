import React, { useState, useMemo, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Select,
    Button,
    Statistic,
    Tag,
    Typography,
    Space,
    Modal,
    message,
    Tooltip,
    Popconfirm
} from 'antd';
import {
    DeleteOutlined,
    SyncOutlined,
    FileSearchOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    ExclamationCircleOutlined,
    DatabaseOutlined
} from '@ant-design/icons';
import DataTable from 'views/events/common/DataTable';
import {
    useLogTypes,
    useLogStats,
    useLogs,
    useClearLogs
} from '../hooks/useSettings';
import Flex from 'components/shared-components/Flex';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ServerLogs = () => {
    const [selectedType, setSelectedType] = useState('app');

    // Hooks
    const { data: logTypes = [], isLoading: loadingTypes } = useLogTypes();
    const { data: stats = {}, isLoading: loadingStats, refetch: refetchStats } = useLogStats();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    // Reset page when type changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType]);

    const { data: logsData = { data: [], meta: {} }, isLoading: loadingLogs, refetch: refetchLogs } = useLogs({
        type: selectedType,
        page: currentPage,
        per_page: pageSize
    });

    const logEntries = logsData.data || [];
    const logMeta = logsData.meta || {};

    const clearMutation = useClearLogs({
        onSuccess: () => {
            message.success('Logs cleared successfully');
            refetchLogs();
            refetchStats();
        },
        onError: (err) => {
            message.error(err.message || 'Failed to clear logs');
        }
    });

    const handleClearLogs = () => {
        clearMutation.mutate({ type: selectedType });
    };

    const handleRefresh = () => {
        refetchLogs();
        refetchStats();
    };

    const onPaginationChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    // Stats display cards
    const StatsSection = () => (
        <Row gutter={16} className="mb-4">
            <Col xs={24} sm={8}>
                <Card size="small">
                    <Statistic
                        title="Current File Size"
                        value={stats.table_size_mb ? `${stats.table_size_mb} MB` : (stats.size_formatted || stats.size || '0 KB')}
                        prefix={<DatabaseOutlined />}
                        valueStyle={{ fontSize: '18px' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={8}>
                <Card size="small">
                    <Statistic
                        title="Total Entries"
                        value={stats.total !== undefined ? stats.total : (stats.total_entries || logEntries.length || 0)}
                        prefix={<FileSearchOutlined />}
                        valueStyle={{ fontSize: '18px' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={8}>
                <Card size="small">
                    <Statistic
                        title="Last Log Entry"
                        value={stats.last_modified ? dayjs(stats.last_modified).format('HH:mm:ss') : 'N/A'}
                        prefix={<SyncOutlined />}
                        valueStyle={{ fontSize: '18px' }}
                    />
                </Card>
            </Col>
        </Row>
    );

    const columns = [
        {
            title: 'Time',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
            sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
        },
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level',
            width: 100,
            render: (level) => {
                let color = 'blue';
                if (level?.toLowerCase() === 'error' || level?.toLowerCase() === 'critical') color = 'red';
                if (level?.toLowerCase() === 'warning') color = 'orange';
                if (level?.toLowerCase() === 'info') color = 'blue';
                if (level?.toLowerCase() === 'debug') color = 'gray';
                return <Tag color={color}>{level?.toUpperCase()}</Tag>;
            },
            filters: [
                { text: 'INFO', value: 'info' },
                { text: 'ERROR', value: 'error' },
                { text: 'WARNING', value: 'warning' },
                { text: 'DEBUG', value: 'debug' },
                { text: 'CRITICAL', value: 'critical' },
            ],
            onFilter: (value, record) => record.level?.toLowerCase().includes(value),
        },
        {
            title: 'Environment',
            dataIndex: 'env',
            key: 'env',
            width: 120,
            hidden: selectedType !== 'app',
        },
        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <Text style={{ fontFamily: 'monospace' }}>{text}</Text>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="container-fluid">
            <Flex justifyContent="space-between" alignItems="center" className="mb-4">
                <div>
                    <Title level={2}>Server Logs</Title>
                    <Text type="secondary">View and manage server activity logs</Text>
                </div>
                <Space>
                    <Select
                        placeholder="Select Log Type"
                        style={{ width: 180 }}
                        value={selectedType}
                        onChange={setSelectedType}
                        loading={loadingTypes}
                    >
                        {Array.isArray(logTypes) ? logTypes.map(type => (
                            <Option key={type} value={type}>{type.toUpperCase()}</Option>
                        )) : null}
                    </Select>
                    <Button
                        icon={<SyncOutlined spin={loadingLogs} />}
                        onClick={handleRefresh}
                        loading={loadingLogs}
                    >
                        Refresh
                    </Button>
                    <Popconfirm
                        title="Clear Logs"
                        description={`Are you sure you want to clear the ${selectedType} logs? This action cannot be undone.`}
                        onConfirm={handleClearLogs}
                        okText="Yes, Clear"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                    >
                        <Button danger icon={<DeleteOutlined />} loading={clearMutation.isPending}>
                            Clear Logs
                        </Button>
                    </Popconfirm>
                </Space>
            </Flex>

            <StatsSection />

            <DataTable
                title={`${selectedType.toUpperCase()} Log Entries`}
                data={logEntries}
                columns={columns}
                loading={loadingLogs}
                showRefresh={false}
                enableSearch={true}
                serverSide={true}
                pagination={logMeta}
                onPaginationChange={onPaginationChange}
                tableProps={{
                    size: 'small',
                    pagination: false,
                    expandable: {
                        expandedRowRender: (record) => (
                            <Card size="small" className="bg-light">
                                <Text strong>Context / Stack Trace:</Text>
                                <pre style={{
                                    marginTop: '10px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    fontSize: '12px',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    fontFamily: 'monospace'
                                }}>
                                    {record.stack || record.context || 'No additional details available'}
                                </pre>
                            </Card>
                        ),
                    }
                }}
            />
        </div>
    );
};

export default ServerLogs;

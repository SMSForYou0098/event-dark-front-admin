import React, { useState, useEffect } from 'react';
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
    message,
    Tooltip,
    Popconfirm
} from 'antd';
import {
    DeleteOutlined,
    SyncOutlined,
    FileSearchOutlined,
    ExclamationCircleOutlined,
    DatabaseOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { Drawer, DatePicker as AntDatePicker } from 'antd';
import DataTable from 'views/events/common/DataTable';
import {
    useLogStats,
    useLogs,
    useClearLogs
} from '../hooks/useSettings';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = AntDatePicker;

const STATIC_LOG_TYPES = [
    'app',
    'queue-critical',
    'queue-high',
    'queue-normal',
    'octane',
    'reverb',
    'swoole'
];

const ServerLogs = () => {
    const [selectedType, setSelectedType] = useState('app');
    const [dateRange, setDateRange] = useState(null);

    // Hooks
    // const { data: logTypes = [], isLoading: loadingTypes } = useLogTypes();
    const logTypes = STATIC_LOG_TYPES;
    const loadingTypes = false;

    const { data: stats = {}, refetch: refetchStats } = useLogStats();

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
        per_page: pageSize,
        date: dateRange ? `${dateRange[0].format('YYYY-MM-DD')},${dateRange[1].format('YYYY-MM-DD')}` : undefined
    });

    const [contextDrawerVisible, setContextDrawerVisible] = useState(false);
    const [selectedLogContext, setSelectedLogContext] = useState(null);

    const parseNestedJson = (data) => {
        if (typeof data !== 'string') {
            if (data && typeof data === 'object') {
                const newData = Array.isArray(data) ? [] : {};
                for (const key in data) {
                    newData[key] = parseNestedJson(data[key]);
                }
                return newData;
            }
            return data;
        }

        try {
            const parsed = JSON.parse(data);
            return parseNestedJson(parsed);
        } catch (e) {
            return data;
        }
    };

    const showContext = (context) => {
        const parsedContext = parseNestedJson(context);
        setSelectedLogContext(parsedContext);
        setContextDrawerVisible(true);
    };

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
            render: (text, record) => {
                const time = text || record.created_at;
                return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : 'N/A';
            },
            sorter: (a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at),
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
        {
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <Tooltip title="View Context">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showContext(record.context || record.stack)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="container-fluid">
            <Row gutter={[16, 16]} className="mb-4" align="top">
                <Col xs={24} lg={10} xl={8}>
                    <div>
                        <Title level={2} className="mb-2">
                            Server Logs
                        </Title>
                        <Text type="secondary" style={{ display: 'block' }}>
                            View and manage server activity logs
                        </Text>
                    </div>
                </Col>
                <Col xs={24} lg={14} xl={16}>
                    <Space wrap size={[8, 8]} style={{ width: '100%' }}>
                        <Select
                            placeholder="Select Log Type"
                            value={selectedType}
                            onChange={setSelectedType}
                            loading={loadingTypes}
                            style={{ width: '100%', minWidth: 140, maxWidth: 280 }}
                        >
                            {logTypes.map(type => (
                                <Option key={type} value={type}>{type.toUpperCase()}</Option>
                            ))}
                        </Select>
                        <RangePicker
                            onChange={(dates) => setDateRange(dates)}
                            style={{ width: '100%', maxWidth: 360 }}
                        />
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
                </Col>
            </Row>

            <StatsSection />

            <DataTable
                title={`${selectedType.toUpperCase()} Log Entries`}
                data={logEntries}
                columns={columns}
                loading={loadingLogs}
                showRefresh={false}
                enableSearch={true}
                // serverSide={true}
                pagination={logMeta}
                onPaginationChange={onPaginationChange}
                tableProps={{
                    size: 'small',
                }}
            />

            <Drawer
                title="Log Context Details"
                placement="right"
                width={600}
                onClose={() => setContextDrawerVisible(false)}
                open={contextDrawerVisible}
            >
                {selectedLogContext ? (
                    <div style={{
                        background: '#141414',
                        padding: '20px',
                        borderRadius: '8px',
                        overflow: 'auto',
                        border: '1px solid #303030',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        <pre style={{
                            color: '#52c41a',
                            margin: 0,
                            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                            fontSize: '12px',
                            lineHeight: '1.5'
                        }}>
                            {JSON.stringify(selectedLogContext, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <Text italic>No additional context details available for this log entry.</Text>
                )}
            </Drawer>
        </div>
    );
};

export default ServerLogs;

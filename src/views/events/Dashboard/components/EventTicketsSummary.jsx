import React, { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  Col,
  Collapse,
  Empty,
  Input,
  Pagination,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  FundProjectionScreenOutlined,
  RiseOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  WifiOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Panel } = Collapse;

// Dark theme colors
const darkTheme = {
  bg: '#141414',
  cardBg: '#1f1f1f',
  borderColor: '#303030',
  textPrimary: '#ffffff',
  textSecondary: '#8c8c8c',
  primary: '#177ddc',
  primaryBg: '#111d2c',
  success: '#49aa19',
  successBg: '#162312',
  warning: '#d89614',
  warningBg: '#2b2111',
  error: '#d32029',
  errorBg: '#2a1215',
  hoverBg: '#262626',
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString('en-IN');
const formatAmount = (value) => `₹${Number(value ?? 0).toLocaleString('en-IN')}`;

const getCount = (entity, period) => {
  if (!entity) return 0;
  const keyed = entity?.[`${period}_count`];
  if (keyed !== undefined) return keyed ?? 0;
  if (entity?.[period] !== undefined) return entity[period] ?? 0;
  return 0;
};

const getAmount = (entity, period) => {
  if (!entity) return 0;
  const keyed = entity?.[`${period}_amount`];
  if (keyed !== undefined) return keyed ?? 0;
  const legacy = entity?.[`${period}Amount`];
  if (legacy !== undefined) return legacy ?? 0;
  return 0;
};

const growthLabel = (today, yesterday) => {
  const current = Number(today ?? 0);
  const prev = Number(yesterday ?? 0);
  if (prev === 0 && current === 0) return { text: 'No change', color: 'default' };
  if (prev === 0 && current > 0) return { text: 'New sales today', color: 'success' };

  const diff = current - prev;
  const pct = ((diff / prev) * 100).toFixed(0);
  if (diff > 0) return { text: `▲ ${Math.abs(pct)}% vs yesterday`, color: 'success' };
  if (diff < 0) return { text: `▼ ${Math.abs(pct)}% vs yesterday`, color: 'error' };
  return { text: 'Stable vs yesterday', color: 'default' };
};

// Dark themed MetricCard
const MetricCard = ({ title, count, amount, icon, variant = 'primary' }) => {
  const Icon = icon;
  
  const colorMap = {
    primary: { bg: darkTheme.primaryBg, color: darkTheme.primary },
    warning: { bg: darkTheme.warningBg, color: darkTheme.warning },
    success: { bg: darkTheme.successBg, color: darkTheme.success },
    error: { bg: darkTheme.errorBg, color: darkTheme.error }
  };

  const colors = colorMap[variant] || colorMap.primary;

  return (
    <Card 
      bordered={false}
      style={{ 
        borderRadius: 12,
        background: darkTheme.cardBg,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        height: '100%'
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div 
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 10,
              background: colors.bg,
              color: colors.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}
          >
            <Icon />
          </div>
        </div>
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 500, color: darkTheme.textSecondary }}>
            {title}
          </Text>
          <Statistic 
            value={count} 
            formatter={(val) => formatNumber(val)}
            valueStyle={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: darkTheme.textPrimary }}
          />
          <Text style={{ fontSize: 13, color: darkTheme.textSecondary }}>
            Revenue: <Text strong style={{ color: colors.color }}>{formatAmount(amount)}</Text>
          </Text>
        </Space>
      </Space>
    </Card>
  );
};

// Dark themed ChannelCard
const ChannelCard = ({ title, data, variant = 'primary', icon: Icon }) => {
  const today = getCount(data, 'today');
  const yesterday = getCount(data, 'yesterday');
  const total = getCount(data, 'overall');
  const todayAmount = getAmount(data, 'today');
  const yesterdayAmount = getAmount(data, 'yesterday');
  const totalAmount = getAmount(data, 'overall');

  const colorMap = {
    success: { primary: darkTheme.success, bg: darkTheme.successBg },
    error: { primary: darkTheme.error, bg: darkTheme.errorBg },
    primary: { primary: darkTheme.primary, bg: darkTheme.primaryBg }
  };

  const colors = colorMap[variant] || colorMap.primary;

  return (
    <Card 
      bordered
      style={{ 
        borderRadius: 12, 
        height: '100%',
        background: darkTheme.cardBg,
        borderColor: colors.primary,
        borderWidth: 2
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 8,
              background: colors.bg,
              color: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}
          >
            <Icon />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 15, color: darkTheme.textPrimary }}>{title}</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color={colors.primary} style={{ borderRadius: 6, background: colors.bg, borderColor: colors.primary }}>
                {formatNumber(total)} total
              </Tag>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: darkTheme.hoverBg, borderRadius: 8 }}>
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>Today</Text>
              <Text strong style={{ fontSize: 16, color: darkTheme.textPrimary }}>{formatNumber(today)}</Text>
            </Space>
            <Text style={{ color: darkTheme.textSecondary }}>{formatAmount(todayAmount)}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: darkTheme.hoverBg, borderRadius: 8 }}>
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>Yesterday</Text>
              <Text strong style={{ fontSize: 16, color: darkTheme.textPrimary }}>{formatNumber(yesterday)}</Text>
            </Space>
            <Text style={{ color: darkTheme.textSecondary }}>{formatAmount(yesterdayAmount)}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: darkTheme.hoverBg, borderRadius: 8 }}>
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>Overall</Text>
              <Text strong style={{ fontSize: 16, color: darkTheme.textPrimary }}>{formatNumber(total)}</Text>
            </Space>
            <Text style={{ color: darkTheme.textSecondary }}>{formatAmount(totalAmount)}</Text>
          </div>
        </Space>
      </Space>
    </Card>
  );
};

const TicketBreakdownTable = ({ tickets = [] }) => {
  const rows = [];

  tickets.forEach((ticket, index) => {
    const headerKey = `header-${index}`;
    rows.push({
      key: headerKey,
      segment: ticket?.name ?? 'Ticket',
      header: true,
    });
    rows.push({
      key: `${headerKey}-total`,
      segment: 'Total',
      today: { count: getCount(ticket, 'today'), amount: getAmount(ticket, 'today') },
      yesterday: { count: getCount(ticket, 'yesterday'), amount: getAmount(ticket, 'yesterday') },
      overall: { count: getCount(ticket, 'overall'), amount: getAmount(ticket, 'overall') },
    });
    rows.push({
      key: `${headerKey}-online`,
      segment: 'Online',
      today: { count: getCount(ticket?.online, 'today'), amount: getAmount(ticket?.online, 'today') },
      yesterday: { count: getCount(ticket?.online, 'yesterday'), amount: getAmount(ticket?.online, 'yesterday') },
      overall: { count: getCount(ticket?.online, 'overall'), amount: getAmount(ticket?.online, 'overall') },
    });
    rows.push({
      key: `${headerKey}-offline`,
      segment: 'Offline',
      today: { count: getCount(ticket?.offline, 'today'), amount: getAmount(ticket?.offline, 'today') },
      yesterday: { count: getCount(ticket?.offline, 'yesterday'), amount: getAmount(ticket?.offline, 'yesterday') },
      overall: { count: getCount(ticket?.offline, 'overall'), amount: getAmount(ticket?.offline, 'overall') },
    });
  });

  const columns = [
    {
      title: <span style={{ color: darkTheme.textPrimary }}>Segment</span>,
      dataIndex: 'segment',
      render: (_, record) =>
        record.header ? (
          <Title level={5} style={{ margin: 0, padding: '8px 0', color: darkTheme.textPrimary }}>{record.segment}</Title>
        ) : (
          <Text strong style={{ color: darkTheme.textPrimary }}>{record.segment}</Text>
        ),
      onCell: (record) => record.header ? { colSpan: 4 } : {},
    },
    {
      title: <span style={{ color: darkTheme.textPrimary }}>Today</span>,
      dataIndex: ['today'],
      align: 'center',
      render: (value, record) =>
        record.header ? null : (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 15, color: darkTheme.textPrimary }}>{formatNumber(value?.count ?? 0)}</Text>
            <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>{formatAmount(value?.amount ?? 0)}</Text>
          </Space>
        ),
      onCell: (record) => (record.header ? { colSpan: 0 } : {}),
    },
    {
      title: <span style={{ color: darkTheme.textPrimary }}>Yesterday</span>,
      dataIndex: ['yesterday'],
      align: 'center',
      render: (value, record) =>
        record.header ? null : (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text style={{ fontSize: 15, color: darkTheme.textPrimary }}>{formatNumber(value?.count ?? 0)}</Text>
            <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>{formatAmount(value?.amount ?? 0)}</Text>
          </Space>
        ),
      onCell: (record) => (record.header ? { colSpan: 0 } : {}),
    },
    {
      title: <span style={{ color: darkTheme.textPrimary }}>Overall</span>,
      dataIndex: ['overall'],
      align: 'center',
      render: (value, record) =>
        record.header ? null : (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text style={{ fontSize: 15, color: darkTheme.textPrimary }}>{formatNumber(value?.count ?? 0)}</Text>
            <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>{formatAmount(value?.amount ?? 0)}</Text>
          </Space>
        ),
      onCell: (record) => (record.header ? { colSpan: 0 } : {}),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={rows}
      pagination={false}
      bordered
      size="middle"
      style={{ 
        marginTop: 16,
        background: darkTheme.cardBg
      }}
      className="dark-table"
    />
  );
};

const EventTicketsSummary = ({ organizerTickets = [], isLoading = false }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const filtered = useMemo(() => {
    if (!Array.isArray(organizerTickets)) return [];
    if (!search) return organizerTickets;
    return organizerTickets.filter((event) => 
      (event?.name ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [organizerTickets, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <Card style={{ borderRadius: 16, marginTop: 24, background: darkTheme.cardBg }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!organizerTickets?.length) {
    return (
      <Card style={{ borderRadius: 16, marginTop: 24, padding: '48px 24px', background: darkTheme.cardBg }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ marginBottom: 0, color: darkTheme.textPrimary }}>No events yet</Title>
              <Text style={{ color: darkTheme.textSecondary }}>Create an event to start tracking ticket performance.</Text>
            </Space>
          }
        />
      </Card>
    );
  }

  const startIndex = (page - 1) * pageSize;

  return (
    <div style={{ background: darkTheme.bg, minHeight: '100vh', padding: '24px' }}>
      <Card 
        bordered={false}
        style={{ 
          borderRadius: 16, 
          marginTop: 24,
          background: darkTheme.cardBg,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          paddingBottom: 24, 
          borderBottom: `1px solid ${darkTheme.borderColor}` 
        }}>
          <Space size={16} align="start">
            <div 
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12,
                background: darkTheme.primaryBg,
                color: darkTheme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}
            >
              <CalendarOutlined />
            </div>
            <div>
              <Title level={4} style={{ marginBottom: 4, color: darkTheme.textPrimary }}>Event Tickets Dashboard</Title>
              <Text style={{ color: darkTheme.textSecondary }}>Monitor online/offline sales, growth, and ticket types per event.</Text>
            </div>
          </Space>
          <Tag 
            color={darkTheme.primary}
            style={{ 
              padding: '6px 16px', 
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              background: darkTheme.primaryBg,
              borderColor: darkTheme.primary
            }}
          >
            {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
          </Tag>
        </div>

        {/* Body */}
        <div style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={16} md={12}>
              <Input
                prefix={<SearchOutlined style={{ color: darkTheme.textSecondary }} />}
                allowClear
                size="large"
                placeholder="Search events by name..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ 
                  borderRadius: 8,
                  background: darkTheme.hoverBg,
                  borderColor: darkTheme.borderColor,
                  color: darkTheme.textPrimary
                }}
                className="dark-input"
              />
            </Col>
          </Row>

          {!filtered.length ? (
            <Empty 
              description={<span style={{ color: darkTheme.textSecondary }}>No events match your search</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          ) : (
            <>
              <Collapse 
                accordion 
                bordered={false} 
                style={{ background: 'transparent' }}
                expandIconPosition="end"
                className="dark-collapse"
              >
                {pageData.map((event, idx) => {
                  const today = getCount(event, 'today');
                  const yesterday = getCount(event, 'yesterday');
                  const growth = growthLabel(today, yesterday);
                  const totalTickets = getCount(event, 'overall');
                  const totalRevenue = getAmount(event, 'overall');
                  const onlineTotal = getCount(event?.online, 'overall');
                  const offlineTotal = getCount(event?.offline, 'overall');
                  const panelKey = startIndex + idx;

                  const header = (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 16,
                      width: '100%', 
                      paddingRight: 24 
                    }}>
                      <Space direction="vertical" size={4}>
                        <Text style={{ fontSize: 12, color: darkTheme.textSecondary }}>#{panelKey + 1}</Text>
                        <Text strong style={{ fontSize: 17, color: darkTheme.textPrimary }}>{event?.name ?? 'Untitled Event'}</Text>
                        <Space size={8} wrap>
                          <Tag color={darkTheme.primary} style={{ borderRadius: 6, background: darkTheme.primaryBg, borderColor: darkTheme.primary }}>
                            {formatNumber(totalTickets)} tickets
                          </Tag>
                          <Tag color={darkTheme.success} style={{ borderRadius: 6, background: darkTheme.successBg, borderColor: darkTheme.success }}>
                            {formatAmount(totalRevenue)}
                          </Tag>
                          <Tag 
                            color={growth.color === 'success' ? darkTheme.success : growth.color === 'error' ? darkTheme.error : darkTheme.textSecondary} 
                            style={{ 
                              borderRadius: 6, 
                              background: growth.color === 'success' ? darkTheme.successBg : growth.color === 'error' ? darkTheme.errorBg : darkTheme.hoverBg,
                              borderColor: growth.color === 'success' ? darkTheme.success : growth.color === 'error' ? darkTheme.error : darkTheme.textSecondary
                            }}
                          >
                            {growth.text}
                          </Tag>
                        </Space>
                      </Space>
                      <Space size={8} wrap>
                        <Tag color={darkTheme.success} style={{ borderRadius: 6, padding: '4px 12px', background: darkTheme.successBg, borderColor: darkTheme.success }}>
                          <WifiOutlined /> {formatNumber(onlineTotal)} online
                        </Tag>
                        <Tag color={darkTheme.error} style={{ borderRadius: 6, padding: '4px 12px', background: darkTheme.errorBg, borderColor: darkTheme.error }}>
                          <ShopOutlined /> {formatNumber(offlineTotal)} offline
                        </Tag>
                      </Space>
                    </div>
                  );

                  return (
                    <Panel 
                      header={header} 
                      key={panelKey} 
                      style={{ 
                        marginBottom: 12, 
                        background: darkTheme.hoverBg, 
                        borderRadius: 12,
                        border: `1px solid ${darkTheme.borderColor}`
                      }}
                    >
                      <div style={{ padding: '12px 0' }}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={8}>
                            <MetricCard
                              title="Today"
                              count={today}
                              amount={getAmount(event, 'today')}
                              icon={RiseOutlined}
                              variant="primary"
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <MetricCard
                              title="Yesterday"
                              count={yesterday}
                              amount={getAmount(event, 'yesterday')}
                              icon={CalendarOutlined}
                              variant="warning"
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <MetricCard
                              title="Overall"
                              count={totalTickets}
                              amount={totalRevenue}
                              icon={FundProjectionScreenOutlined}
                              variant="success"
                            />
                          </Col>
                        </Row>

                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                          <Col xs={24} md={12}>
                            <ChannelCard 
                              title="Online Sales" 
                              data={event?.online} 
                              icon={WifiOutlined} 
                              variant="success"
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ChannelCard 
                              title="Offline Sales" 
                              data={event?.offline} 
                              icon={ShopOutlined}
                              variant="error"
                            />
                          </Col>
                        </Row>

                        <Card 
                          size="small" 
                          style={{ 
                            marginTop: 16, 
                            borderRadius: 12,
                            background: darkTheme.cardBg,
                            border: `1px solid ${darkTheme.borderColor}`
                          }}
                        >
                          <Space align="center" size={12} style={{ marginBottom: 16 }}>
                            <ShoppingCartOutlined style={{ color: darkTheme.primary, fontSize: 18 }} />
                            <Text strong style={{ fontSize: 15, color: darkTheme.textPrimary }}>Ticket-wise Breakdown</Text>
                          </Space>
                          <TicketBreakdownTable tickets={event?.tickets} />
                        </Card>
                      </div>
                    </Panel>
                  );
                })}
              </Collapse>

              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginTop: 24 
                }}>
                  <Text style={{ color: darkTheme.textSecondary }}>
                    Showing {startIndex + 1} - {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} events
                  </Text>
                  <Pagination 
                    current={page} 
                    pageSize={pageSize} 
                    total={filtered.length} 
                    onChange={(p) => setPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Dark Theme CSS */}
      <style jsx global>{`
        .dark-input input {
          background: ${darkTheme.hoverBg} !important;
          color: ${darkTheme.textPrimary} !important;
        }
        .dark-input input::placeholder {
          color: ${darkTheme.textSecondary} !important;
        }
        .dark-collapse .ant-collapse-header {
          color: ${darkTheme.textPrimary} !important;
          background: ${darkTheme.hoverBg} !important;
        }
        .dark-collapse .ant-collapse-content {
          background: ${darkTheme.cardBg} !important;
          border-color: ${darkTheme.borderColor} !important;
        }
        .dark-table .ant-table {
          background: ${darkTheme.cardBg} !important;
          color: ${darkTheme.textPrimary} !important;
        }
        .dark-table .ant-table-thead > tr > th {
          background: ${darkTheme.hoverBg} !important;
          color: ${darkTheme.textPrimary} !important;
          border-color: ${darkTheme.borderColor} !important;
        }
        .dark-table .ant-table-tbody > tr > td {
          background: ${darkTheme.cardBg} !important;
          border-color: ${darkTheme.borderColor} !important;
        }
        .dark-table .ant-table-tbody > tr:hover > td {
          background: ${darkTheme.hoverBg} !important;
        }
        .ant-pagination-item {
          background: ${darkTheme.cardBg} !important;
          border-color: ${darkTheme.borderColor} !important;
        }
        .ant-pagination-item a {
          color: ${darkTheme.textPrimary} !important;
        }
        .ant-pagination-item-active {
          background: ${darkTheme.primary} !important;
          border-color: ${darkTheme.primary} !important;
        }
      `}</style>
    </div>
  );
};

export default EventTicketsSummary;

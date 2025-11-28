import React, { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Collapse,
  Col,
  Grid,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  GlobalOutlined,
  RiseOutlined,
  ShopOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const cleanGateways = (gateways = []) =>
  gateways.filter((gw) => {
    const name = (gw?.name ?? '').toLowerCase();
    return name && name !== 'unknown' && name !== 'free';
  });

const GatewayList = ({ gateways }) => {
  const filtered = cleanGateways(gateways);
  if (!filtered.length) {
    return (
      <Text type="secondary" italic>
        No gateway data
      </Text>
    );
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space size={6} align="center">
        <CreditCardOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
        <Text type="secondary" style={{ letterSpacing: 0.5, fontSize: 12 }}>
          Gateway Breakdown
        </Text>
      </Space>
      {filtered.map((gw, idx) => (
        <Card
          key={`${gw?.name ?? 'gateway'}-${idx}`}
          size="small"
          bodyStyle={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
          }}
        >
          <Text strong style={{ textTransform: 'capitalize' }}>
            {gw?.name}
          </Text>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <Text strong>{formatCurrency(gw?.total_amount)}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {gw?.total_bookings} bookings
              </Text>
            </div>
          </div>
        </Card>
      ))}
    </Space>
  );
};

const MetricTile = ({ label, value, color }) => (
  <Card
    size="small"
    bordered={false}
    style={{
      background: `linear-gradient(135deg, ${color}1a, ${color}33)`,
    }}
  >
    <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
      {label}
    </Text>
    <div>
      <Title level={4} style={{ margin: 0 }}>
        {value}
      </Title>
    </div>
  </Card>
);

const OrganizerSummary = ({ organizerSummary = [] }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();

  const dataSource = useMemo(
    () =>
      organizerSummary.map((org, index) => ({
        key: org?.organizer_id ?? index,
        index: index + 1,
        organisation: org?.organisation ?? 'N/A',
        organizerName: org?.organizer_name ?? '—',
        overallTotal: org?.overall_total,
        onlineTotal: org?.online_overall_total,
        offlineTotal: org?.offline_overall_total,
        detail: org,
        hasDetail:
          cleanGateways(org?.today?.gateway_wise).length ||
          cleanGateways(org?.yesterday?.gateway_wise).length ||
          cleanGateways(org?.gateway_wise_overall).length,
      })),
    [organizerSummary],
  );

  if (!organizerSummary?.length) return null;

  const desktopColumns = [
    {
      title: '#',
      dataIndex: 'index',
      width: 60,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Organization',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.organisation}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.organizerName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Overall Total',
      dataIndex: 'overallTotal',
      align: 'right',
      render: (value) => (
        <Tag color="green" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 999 }}>
          {formatCurrency(value)}
        </Tag>
      ),
    },
    {
      title: (
        <Space>
          <GlobalOutlined />
          Online
        </Space>
      ),
      dataIndex: 'onlineTotal',
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: token.colorPrimary }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: (
        <Space>
          <ShopOutlined />
          Offline
        </Space>
      ),
      dataIndex: 'offlineTotal',
      align: 'right',
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      align: 'center',
      width: 100,
      render: (_, record) =>
        record.hasDetail ? (
          <Button
            shape="circle"
            type={expandedRowKeys.includes(record.key) ? 'primary' : 'default'}
            icon={expandedRowKeys.includes(record.key) ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            onClick={() =>
              setExpandedRowKeys((prev) =>
                prev.includes(record.key) ? prev.filter((key) => key !== record.key) : [...prev, record.key],
              )
            }
          />
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  const detailPanel = (data) => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card size="small" style={{ borderTop: `3px solid ${token.colorPrimary}` }} bodyStyle={{ padding: 16 }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <CalendarOutlined style={{ color: token.colorPrimary }} />
              <Text strong>Today</Text>
            </Space>
            <Badge color={token.colorPrimary} text="Active" />
          </Space>
          <Row gutter={12} style={{ marginTop: 12 }}>
            <Col span={12}>
              <MetricTile label="Online" value={formatCurrency(data?.today?.online)} color={token.colorPrimary} />
            </Col>
            <Col span={12}>
              <MetricTile label="Offline" value={formatCurrency(data?.today?.offline)} color={token.colorPrimary} />
            </Col>
          </Row>
          <GatewayList gateways={data?.today?.gateway_wise} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card size="small" style={{ borderTop: '3px solid #faad14' }} bodyStyle={{ padding: 16 }}>
          <Space align="center">
            <CalendarOutlined style={{ color: '#faad14' }} />
            <Text strong>Yesterday</Text>
          </Space>
          <Row gutter={12} style={{ marginTop: 12 }}>
            <Col span={12}>
              <MetricTile label="Online" value={formatCurrency(data?.yesterday?.online)} color="#faad14" />
            </Col>
            <Col span={12}>
              <MetricTile label="Offline" value={formatCurrency(data?.yesterday?.offline)} color="#faad14" />
            </Col>
          </Row>
          <GatewayList gateways={data?.yesterday?.gateway_wise} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card size="small" style={{ borderTop: '3px solid #52c41a' }} bodyStyle={{ padding: 16 }}>
          <Space align="center">
            <RiseOutlined style={{ color: '#52c41a' }} />
            <Text strong>Overall Performance</Text>
          </Space>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(82,196,26,0.1)',
              textAlign: 'center',
              margin: '12px 0',
            }}
          >
            <Text type="success" style={{ fontSize: 12 }}>
              Total Revenue
            </Text>
            <Title level={4} style={{ margin: 0, color: '#389e0d' }}>
              {formatCurrency(data?.overall_total)}
            </Title>
          </div>
          <GatewayList gateways={data?.gateway_wise_overall} />
        </Card>
      </Col>
    </Row>
  );

  const collapseItems = dataSource.map((record) => ({
    key: record.key,
    label: (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space direction="vertical" size={0}>
          <Text strong>{record.organisation}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.organizerName}
          </Text>
        </Space>
        <Tag color="success" style={{ fontSize: 12 }}>
          {formatCurrency(record.overallTotal)}
        </Tag>
      </Space>
    ),
    children: detailPanel(record.detail),
  }));

  return (
    <Card style={{ borderRadius: 16, marginTop: 24 }} bodyStyle={{ padding: 0 }}>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space align="center">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: token.colorPrimaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BankOutlined style={{ color: token.colorPrimary }} />
          </div>
          <div>
            <Text strong style={{ display: 'block', fontSize: 16 }}>
              Organizer Summary
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Financial performance overview
            </Text>
          </div>
        </Space>
        <Badge count={`Total: ${organizerSummary.length}`} style={{ backgroundColor: token.colorPrimary }} />
      </div>

      <div style={{ padding: 16 }}>
        {isMobile ? (
          <Collapse accordion ghost expandIconPosition="end">
            {collapseItems.map((item) => (
              <Panel key={item.key} header={item.label}>
                {item.children}
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Table
            columns={desktopColumns}
            dataSource={dataSource}
            pagination={false}
            rowKey="key"
            size="middle"
            expandable={{
              expandedRowRender: (record) => detailPanel(record.detail),
              expandedRowKeys,
              onExpand: (expanded, record) => {
                setExpandedRowKeys((prev) =>
                  expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key),
                );
              },
              expandIconColumnIndex: -1,
              rowExpandable: (record) => record.hasDetail,
            }}
          />
        )}
      </div>
    </Card>
  );
};

export default OrganizerSummary;


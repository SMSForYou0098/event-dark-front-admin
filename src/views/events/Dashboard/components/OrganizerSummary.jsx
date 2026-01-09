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
  Tooltip,
  Typography,
  theme,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  GiftOutlined,
  GlobalOutlined,
  RiseOutlined,
  ShopOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

/* ---------------- UTILITIES ---------------- */

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

/**
 * IMPORTANT:
 * Empty gateway name = FREE BOOKING (₹0 bookings)
 * Do NOT filter it out
 */
const normalizeGateways = (gateways = []) =>
  gateways.map((gw) => ({
    ...gw,
    name: gw?.name?.trim() || 'Free Booking',
  }));

/* ---------------- GATEWAY LIST ---------------- */

const GatewayItem = ({ gateway, isFreeBooking }) => {
  if (isFreeBooking) {
    return (
      <div
        className="border border-2 border-dashed rounded-3 p-3 mb-2"
        style={{
          backgroundColor: '#000',
          borderColor: '#91caff !important'
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <Space size={8}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 28,
                height: 28,
                backgroundColor: '#fff'
              }}
            >
              <GiftOutlined className="text-primary" style={{ fontSize: 14 }} />
            </div>
            <div>
              <Tag color="cyan" className="mb-0 fw-semibold">
                Free Booking
              </Tag>
              <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                ₹0 tickets
              </div>
            </div>
          </Space>
          <div className="text-end">
            <Badge
              count={`${gateway.total_bookings} ${gateway.total_bookings === 1 ? 'booking' : 'bookings'}`}
              style={{
                backgroundColor: '#b51515',
                fontSize: 12,
                padding: '0 10px',
                fontWeight: 600
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-between align-items-center py-2 px-2 bg-light bg-opacity-50 rounded mb-1">
      <Space size={8}>
        <CreditCardOutlined className="text-success" style={{ fontSize: 16 }} />
        <Text strong className="text-capitalize">{gateway.name}</Text>
      </Space>
      <div className="text-end">
        <Text strong className="text-success" style={{ fontSize: 14 }}>
          {formatCurrency(gateway.total_amount)}
        </Text>
        <div className="text-muted" style={{ fontSize: 11 }}>
          {gateway.total_bookings} {gateway.total_bookings === 1 ? 'booking' : 'bookings'}
        </div>
      </div>
    </div>
  );
};

const GatewayList = ({ gateways }) => {
  const list = normalizeGateways(gateways);

  if (!list?.length) {
    return (
      <div
        className="text-center py-3"
        style={{
          background: 'rgba(0,0,0,0.02)',
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        <Text type="secondary" italic style={{ fontSize: 12 }}>
          No gateway data available
        </Text>
      </div>
    );
  }

  // Separate free bookings from paid gateways for better organization
  const freeBookings = list.filter((gw) => gw.name === 'Free Booking');
  const paidGateways = list.filter((gw) => gw.name !== 'Free Booking');

  return (
    <Card
      size="small"
      className="mt-3"
      bodyStyle={{ padding: 12 }}
      style={{ borderRadius: 10 }}
    >
      <Space size={6} className="mb-2">
        <CreditCardOutlined style={{ color: '#8c8c8c' }} />
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
          Payment Breakdown
        </Text>
      </Space>

      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* Show paid gateways first */}
        {paidGateways.map((gw, idx) => (
          <GatewayItem key={`paid-${idx}`} gateway={gw} isFreeBooking={false} />
        ))}

        {/* Show free bookings with special styling */}
        {freeBookings.map((gw, idx) => (
          <GatewayItem key={`free-${idx}`} gateway={gw} isFreeBooking={true} />
        ))}
      </Space>
    </Card>
  );
};

/* ---------------- METRIC TILE ---------------- */

const MetricTile = ({ label, value, color }) => (
  <Card
    size="small"
    bordered={false}
    className="text-center"
    style={{
      background: `linear-gradient(135deg, ${color}1a, ${color}33)`,
    }}
  >
    <Text type="secondary" style={{ fontSize: 11 }}>
      {label}
    </Text>
    <Title level={5} style={{ margin: 0 }}>
      {value}
    </Title>
  </Card>
);

/* ---------------- MAIN COMPONENT ---------------- */

const OrganizerSummary = ({ organizerSummary }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();

  if (!organizerSummary) return null;

  /* ---------------- DETAIL PANEL ---------------- */

  const detailPanel = (data) => (
    <Row gutter={[12, 12]}>
      {/* TODAY */}
      <Col xs={24} md={8} className="mb-2 mb-md-0">
        <Card size="small" bodyStyle={{ padding: 16 }} style={{ borderTop: `3px solid ${token.colorPrimary}` }}>
          <Space className="w-100 justify-content-between">
            <Space>
              <CalendarOutlined style={{ color: token.colorPrimary }} />
              <Text strong>Today</Text>
            </Space>
            <Badge color={token.colorPrimary} text="Live" />
          </Space>

          <Row gutter={8} className="mt-2">
            <Col span={12}>
              <MetricTile
                label="Online"
                value={formatCurrency(data?.today?.online)}
                color={token.colorPrimary}
              />
            </Col>
            <Col span={12}>
              <MetricTile
                label="Offline"
                value={formatCurrency(data?.today?.offline)}
                color={token.colorPrimary}
              />
            </Col>
          </Row>

          <GatewayList gateways={data?.today?.gateway_wise} />
        </Card>
      </Col>

      {/* YESTERDAY */}
      <Col xs={24} md={8} className="mb-2 mb-md-0">
        <Card size="small" bodyStyle={{ padding: 16 }} style={{ borderTop: '3px solid #faad14' }}>
          <Space>
            <CalendarOutlined style={{ color: '#faad14' }} />
            <Text strong>Yesterday</Text>
          </Space>

          <Row gutter={8} className="mt-2">
            <Col span={12}>
              <MetricTile
                label="Online"
                value={formatCurrency(data?.yesterday?.online)}
                color="#faad14"
              />
            </Col>
            <Col span={12}>
              <MetricTile
                label="Offline"
                value={formatCurrency(data?.yesterday?.offline)}
                color="#faad14"
              />
            </Col>
          </Row>

          <GatewayList gateways={data?.yesterday?.gateway_wise} />
        </Card>
      </Col>

      {/* OVERALL */}
      <Col xs={24} md={8}>
        <Card size="small" bodyStyle={{ padding: 16 }} style={{ borderTop: '3px solid #52c41a' }}>
          <Space>
            <RiseOutlined style={{ color: '#52c41a' }} />
            <Text strong>Overall</Text>
          </Space>

          <div
            className="text-center my-3 p-3"
            style={{ background: 'rgba(82,196,26,0.1)', borderRadius: 12 }}
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

  /* ---------------- DESKTOP VIEW ---------------- */

  const renderDesktopView = () => (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 px-4 py-3 border-bottom">
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {organizerSummary.organisation}
          </Text>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {organizerSummary.organizer_name}
          </div>
        </div>

        <Space wrap size={24}>
          <Tooltip title="Total revenue from all sources (Online + Offline)">
            <div className="text-end">
              <Tag color="green" style={{ fontSize: 14 }}>
                {formatCurrency(organizerSummary.overall_total)}
              </Tag>
            </div>
          </Tooltip>

          <Tooltip title="Total online bookings revenue">
            <div className="text-end">
              <GlobalOutlined className="me-1" />
              <Text strong>
                {formatCurrency(organizerSummary.online_overall_total)}
              </Text>
            </div>
          </Tooltip>

          <Tooltip title="Total offline bookings revenue">
            <div className="text-end">
              <ShopOutlined className="me-1" />
              <Text strong>
                {formatCurrency(organizerSummary.offline_overall_total)}
              </Text>
            </div>
          </Tooltip>

          <Tooltip title={isExpanded ? "Hide details" : "Show details"}>
            <Button
              shape="circle"
              icon={isExpanded ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </Tooltip>
        </Space>
      </div>

      {isExpanded && <div className="p-4">{detailPanel(organizerSummary)}</div>}

      {/* Tickets Breakdown Section */}
      {organizerSummary?.tickets?.length > 0 && (
        <div className="px-4 pb-4">
          <Card size="small" className="mt-3">
            <div className="mb-3">
              <Text strong style={{ fontSize: 14 }}>Ticket-Wise Breakdown</Text>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Revenue details for each ticket type
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Table
                dataSource={organizerSummary.tickets}
                rowKey="ticket_id"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                expandable={{
                  expandedRowRender: (ticket) => (
                    <div style={{ padding: '12px 0' }}>
                      <Row gutter={[12, 12]}>
                        <Col xs={24} md={8}>
                          <Card size="small" style={{ borderLeft: '3px solid #1890ff' }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Today Gateways</Text>
                            <GatewayList gateways={ticket.today?.gateway_wise} />
                          </Card>
                        </Col>
                        <Col xs={24} md={8}>
                          <Card size="small" style={{ borderLeft: '3px solid #faad14' }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Yesterday Gateways</Text>
                            <GatewayList gateways={ticket.yesterday?.gateway_wise} />
                          </Card>
                        </Col>
                        <Col xs={24} md={8}>
                          <Card size="small" style={{ borderLeft: '3px solid #52c41a' }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Total Gateways</Text>
                            <GatewayList gateways={ticket.total?.gateway_wise} />
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                  rowExpandable: (ticket) =>
                    ticket.today?.gateway_wise?.length > 0 ||
                    ticket.yesterday?.gateway_wise?.length > 0 ||
                    ticket.total?.gateway_wise?.length > 0,
                }}
                columns={[
                  {
                    title: 'Ticket Name',
                    dataIndex: 'ticket_name',
                    key: 'ticket_name',
                    render: (name) => <Text strong>{name}</Text>,
                  },
                  {
                    title: 'Today',
                    key: 'today',
                    children: [
                      {
                        title: 'Online',
                        key: 'today_online',
                        align: 'right',
                        render: (_, ticket) => (
                          <Text style={{ color: token.colorPrimary }}>
                            {formatCurrency(ticket.today?.online || 0)}
                          </Text>
                        ),
                      },
                      {
                        title: 'Offline',
                        key: 'today_offline',
                        align: 'right',
                        render: (_, ticket) => (
                          <Text>{formatCurrency(ticket.today?.offline || 0)}</Text>
                        ),
                      },
                    ],
                  },
                  {
                    title: 'Yesterday',
                    key: 'yesterday',
                    children: [
                      {
                        title: 'Online',
                        key: 'yesterday_online',
                        align: 'right',
                        render: (_, ticket) => (
                          <Text style={{ color: token.colorPrimary }}>
                            {formatCurrency(ticket.yesterday?.online || 0)}
                          </Text>
                        ),
                      },
                      {
                        title: 'Offline',
                        key: 'yesterday_offline',
                        align: 'right',
                        render: (_, ticket) => (
                          <Text>{formatCurrency(ticket.yesterday?.offline || 0)}</Text>
                        ),
                      },
                    ],
                  },
                  {
                    title: 'Total',
                    key: 'total',
                    children: [
                      {
                        title: 'Online',
                        key: 'total_online',
                        align: 'right',
                        render: (_, ticket) => (
                          <Text strong style={{ color: token.colorPrimary }}>
                            {formatCurrency(ticket.total?.online || 0)}
                          </Text>
                        ),
                      },
                      {
                        title: 'Offline',
                        key: 'total_offline',
                        align: 'right',
                        render: (_, ticket) => (
                          <Text strong>{formatCurrency(ticket.total?.offline || 0)}</Text>
                        ),
                      },
                      {
                        title: 'Overall',
                        key: 'total_overall',
                        align: 'right',
                        render: (_, ticket) => (
                          <Tag color="success" style={{ fontSize: 12 }}>
                            {formatCurrency(ticket.total?.overall_total || 0)}
                          </Tag>
                        ),
                      },
                    ],
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );

  /* ---------------- MOBILE VIEW ---------------- */

  const renderMobileView = () => (
    <Collapse accordion ghost>
      <Panel
        header={
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              <Text strong>{organizerSummary.organisation}</Text>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {organizerSummary.organizer_name}
              </div>
            </div>
            <Tag color="success">
              {formatCurrency(organizerSummary.overall_total)}
            </Tag>
          </div>
        }
      >
        <Row gutter={[8, 8]} className="mb-3">
          <Col span={8}>
            <MetricTile
              label="Total"
              value={formatCurrency(organizerSummary.overall_total)}
              color={token.colorPrimary}
            />
          </Col>
          <Col span={8}>
            <MetricTile
              label="Online"
              value={formatCurrency(organizerSummary.online_overall_total)}
              color={token.colorPrimary}
            />
          </Col>
          <Col span={8}>
            <MetricTile
              label="Offline"
              value={formatCurrency(organizerSummary.offline_overall_total)}
              color={token.colorPrimary}
            />
          </Col>
        </Row>

        {detailPanel(organizerSummary)}

        {/* Tickets Breakdown for Mobile */}
        {organizerSummary?.tickets?.length > 0 && (
          <div className="mt-3">
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Ticket-Wise Breakdown
            </Text>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {organizerSummary.tickets.map((ticket) => (
                <Card key={ticket.ticket_id} size="small" style={{ borderLeft: '3px solid #1890ff' }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>{ticket.ticket_name}</Text>

                  <Row gutter={[8, 8]}>
                    <Col span={8}>
                      <div className="text-center">
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Today</Text>
                        <Text strong style={{ fontSize: 12, color: token.colorPrimary }}>
                          {formatCurrency(ticket.today?.online + ticket.today?.offline || 0)}
                        </Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="text-center">
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Yesterday</Text>
                        <Text strong style={{ fontSize: 12, color: '#faad14' }}>
                          {formatCurrency(ticket.yesterday?.online + ticket.yesterday?.offline || 0)}
                        </Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="text-center">
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Total</Text>
                        <Tag color="success" style={{ fontSize: 11 }}>
                          {formatCurrency(ticket.total?.overall_total || 0)}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </div>
        )}
      </Panel>
    </Collapse>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <Card style={{ borderRadius: 16, marginTop: 24 }} bodyStyle={{ padding: 0 }}>
      <div className="d-flex align-items-center gap-3 px-4 py-3 border-bottom">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: token.colorPrimaryBg,
          }}
        >
          <BankOutlined style={{ color: token.colorPrimary }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 16 }}>
            Organizer Summary
          </Text>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Financial performance overview
          </div>
        </div>
        <Badge
          count="1 Organizer"
          className="ms-auto"
          style={{ backgroundColor: token.colorPrimary }}
        />
      </div>

      {isMobile ? renderMobileView() : renderDesktopView()}
    </Card>
  );
};

export default OrganizerSummary;

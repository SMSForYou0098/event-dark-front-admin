import React from 'react';
import { Card, Col, Row, Table, Typography, Progress } from 'antd';
import ChartComponent from 'components/shared-components/Chart/ChartComponent';
import { bookingTypeColumns, paymentGatewayColumns, ticketColumns } from '../utils/reportColumns';
import { formatCurrency, getBookingTypeRows, getUserWiseSales } from '../utils/reportHelpers';
import { CHART_COLORS, PRIMARY } from 'utils/consts';
import Flex from 'components/shared-components/Flex';

const { Title } = Typography;

const ReportTables = ({
  reportData,
  showTickets = true,
  showOfflineBookingType = true,
  showOnlinePaymentGateways = true,
  pdfMode = false,
}) => {
  const bookingTypeRows = getBookingTypeRows(reportData);
  const { hasPayload: hasUserWiseSales, agentWiseSales, posWiseSales, sponsorWiseSales } = getUserWiseSales(reportData);
  const rawTickets = Array.isArray(reportData?.tickets) ? reportData.tickets : [];
  const isTicketBreakdownShape = rawTickets.some((ticket) => Array.isArray(ticket?.bookings));

  const ticketsWithSummary = rawTickets.map((ticket) => {
    const bookingRows = Array.isArray(ticket?.bookings) ? ticket.bookings : [];

    return {
      ...ticket,
      total_bookings: bookingRows.reduce(
        (sum, booking) => sum + Number(booking?.total_bookings || 0),
        0,
      ),
      total_amount: bookingRows.reduce(
        (sum, booking) => sum + Number(booking?.total_amount || 0),
        0,
      ),
      total_tickets: bookingRows.reduce(
        (sum, booking) => sum + Number(booking?.total_tickets || 0),
        0,
      ),
    };
  });

const ticketSummaryColumns = [
  {
    title: 'Ticket Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Total Bookings',
    dataIndex: 'total_bookings',
    key: 'total_bookings',
    render: (value) => value ?? 0,
  },
  {
    title: 'Total Sold',
    dataIndex: 'total_tickets',
    key: 'total_tickets',
    render: (value) => value ?? 0,
  },
  {
    title: 'Total Tickets',
    dataIndex: 'quantity',
    key: 'quantity',
    render: (value) => value ?? 0,
  },
  {
    title: 'Sales',
    dataIndex: 'total_amount',
    key: 'total_amount',
    render: (value, record) => {
      const totalTicketsSold = record?.total_tickets || 0;
      const totalQuantity = record?.quantity || 0;
      const percentage = totalQuantity > 0
        ? ((Number(totalTicketsSold) / totalQuantity) * 100).toFixed(1)
        : 0;

      return (
        <Flex align="center" gap={8}>
          <div style={{ flex: 1 }}>
            <Progress
             strokeColor={{
              '0%': PRIMARY,
              '100%': 'rgb(94, 17, 21)',
              }}
              type="line"
              status="active"
              percent={Math.min(parseFloat(percentage), 100)}
              showInfo={false}
            />
          </div>
          <span>{percentage}%</span>
        </Flex>
      );
    },
  },
];

  const ticketBookingColumns = [
    {
      title: 'Booking Type',
      dataIndex: 'type',
      key: 'type',
      render: (value) => value || '-',
    },
    {
      title: 'Bookings',
      dataIndex: 'total_bookings',
      key: 'total_bookings',
      render: (value) => value ?? 0,
    },
    {
      title: 'Total Tickets',
      dataIndex: 'total_tickets',
      key: 'total_tickets',
      render: (value) => value ?? 0,
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => formatCurrency(value),
    },
  ];

  const userWiseSalesColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value) => value || '-',
    },
    {
      title: 'Bookings',
      dataIndex: 'total_bookings',
      key: 'total_bookings',
      render: (value) => value ?? 0,
    },
    {
      title: 'Discount',
      dataIndex: 'total_discount',
      key: 'total_discount',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => formatCurrency(value),
    },
  ];

  const ticketBreakdownColumns = [
    {
      title: 'Ticket Name',
      dataIndex: 'ticket_name',
      key: 'ticket_name',
      render: (value) => value || '-',
    },
    {
      title: 'Bookings',
      dataIndex: 'total_bookings',
      key: 'total_bookings',
      render: (value) => value ?? 0,
    },
    {
      title: 'Discount',
      dataIndex: 'total_discount',
      key: 'total_discount',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => formatCurrency(value),
    },
  ];

  const visibleUserWiseSalesSections = [
    {
      key: 'agent',
      title: 'Agent Wise Sales',
      data: agentWiseSales,
      emptyText: 'No agent wise sales data',
    },
    {
      key: 'pos',
      title: 'POS Sales',
      data: posWiseSales,
      emptyText: 'No POS sales data',
    },
    {
      key: 'sponsor',
      title: 'Sponsor Wise Sales',
      data: sponsorWiseSales,
      emptyText: 'No sponsor wise sales data',
    },
  ].filter((section) => Array.isArray(section.data) && section.data.length > 0);

  const hasVisibleUserWiseSales = hasUserWiseSales && visibleUserWiseSalesSections.length > 0;
  const showOfflineSection = showOfflineBookingType || hasVisibleUserWiseSales;
  const visibleSectionCount = [showOnlinePaymentGateways, showOfflineSection].filter(Boolean).length;

  const userWiseColLgSpan =
    visibleUserWiseSalesSections.length <= 1 ? 24 :
      visibleUserWiseSalesSections.length === 2 ? 12 : 8;

  const channelColProps = pdfMode
    ? { span: 12 }
    : { xs: 24, md: 12, lg: 12 };

  const userWiseColProps = pdfMode
    ? { span: userWiseColLgSpan }
    : { xs: 24, lg: userWiseColLgSpan };

  return (
    <>
      {visibleSectionCount > 0 && (
        <Card
          data-pdf-section={pdfMode ? 'true' : undefined}
          size="small"
          className="bg-transparent"
          title="Sales by Source"
          extra={
            <span className='fw-bold'>
              {formatCurrency(reportData?.summary?.total_amount?.total || 0)}
            </span>
          }>
          <Row gutter={[16, 16]}>
            {/* Online Gateways */}
            {showOnlinePaymentGateways && (
              <Col {...channelColProps}>
                <Card size="small" title="Online Gateways"
                  extra={
                    <span className="fw-bold">
                      {formatCurrency(reportData?.summary?.total_amount?.online || 0)}
                      </span>
                  }
                >
                  <Row>
                    <Col lg={reportData?.payment_gateways?.length > 0 ? 18 : 24}>
                      <Table
                        size="small"
                        rowKey={(record, index) => `${record?.gateway || 'gateway'}-${index}`}
                        columns={paymentGatewayColumns}
                        dataSource={reportData?.payment_gateways || []}
                        pagination={false}
                        locale={{ emptyText: 'No payment gateway data' }}
                      />
                    </Col>
                    <Col lg={6} xs={24}>
                      {Array.isArray(reportData?.payment_gateways) && reportData?.payment_gateways.length > 0 && (
                        <div>
                          <ChartComponent
                            type="donut"
                            series={reportData?.payment_gateways.map((gw) => Number(gw?.total_amount || 0))}
                            labels={reportData?.payment_gateways.map((gw) => gw?.gateway || gw?.payment_gateway || 'Unknown')}
                            colors={CHART_COLORS}
                            height={200}
                            legendPosition="bottom"
                          />
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}

            {/* Offline Types */}
            {showOfflineBookingType && (
              <Col {...channelColProps}>
                <Card size="small" title="Offline Types"
                  extra={
                    <span className="fw-bold">
                      {formatCurrency(reportData?.summary?.total_amount?.offline || 0)}
                      </span>
                  }
                >
                  <Row>
                    <Col lg={bookingTypeRows?.length > 0 ? 18 : 24}>
                      <Table
                        size="small"
                        rowKey="key"
                        columns={bookingTypeColumns}
                        dataSource={bookingTypeRows}
                        pagination={false}
                        locale={{ emptyText: 'No offline booking type data' }}
                      />
                    </Col>
                    <Col lg={6} xs={24}>
                      {Array.isArray(bookingTypeRows) && bookingTypeRows?.length > 0 && (
                        <div>
                          <ChartComponent
                            type="donut"
                            series={bookingTypeRows.map((row) => Number(row?.total_amount || 0))}
                            labels={bookingTypeRows.map((row) => row?.booking_type || row?.type || 'Unknown')}
                            colors={CHART_COLORS}
                            height={200}
                            legendPosition="bottom"
                          />
                        </div>
                      )}
                    </Col>

                  </Row>
                </Card>
              </Col>
            )}

            {/* Center - Pie Chart */}
            {/* {showOnlinePaymentGateways && showOfflineBookingType && (
              <Col xs={24} md={24} lg={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChartComponent
                  type="donut"
                  series={[
                    Number(reportData?.summary?.total_amount?.online || 0),
                    Number(reportData?.summary?.total_amount?.offline || 0),
                  ]}
                  labels={['Online', 'Offline']}
                  colors={[PRIMARY, SECONDARY]}
                  height={200}
                  donutSize="85%"
                />
              </Col>
            )} */}
          </Row>
        </Card>
      )}

      {/* User Wise Sales Section */}
      {hasVisibleUserWiseSales && (
        <Row gutter={[16, 16]} className="mt-4">
          {visibleUserWiseSalesSections.map((section) => (
            <Col key={section.key} {...userWiseColProps}>
              <Card size="small" data-pdf-section={pdfMode ? 'true' : undefined}>
                <Title level={5} className="mb-2">{section?.title}</Title>
                <Table
                  size="small"
                  rowKey={(record, index) => `${section.key}-${record?.name || index}`}
                  columns={userWiseSalesColumns}
                  dataSource={section?.data}
                  pagination={false}
                  locale={{ emptyText: section.emptyText }}
                  expandable={{
                    expandedRowRender: (record) => {
                      const tickets = Array.isArray(record?.tickets) ? record.tickets : [];
                      return (
                        <Table
                          size="small"
                          rowKey={(ticket, index) => `${record?.name}-${ticket?.ticket_name || index}`}
                          columns={ticketBreakdownColumns}
                          dataSource={tickets}
                          pagination={false}
                          locale={{ emptyText: 'No ticket data for this entry' }}
                        />
                      );
                    },
                    rowExpandable: (record) => Array.isArray(record?.tickets) && record.tickets.length > 0,
                  }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {showTickets && (
        <Card title="Ticket Wise Sales" className="mt-3" data-pdf-section={pdfMode ? 'true' : undefined}>
          {isTicketBreakdownShape ? (
            <Table
              size="small"
              rowKey={(record) => record?.id}
              columns={ticketSummaryColumns}
              dataSource={ticketsWithSummary}
              pagination={{ pageSize: 8 }}
              expandable={{
                expandedRowRender: (record) => {
                  const bookingRows = Array.isArray(record?.bookings) ? record.bookings : [];

                  return (
                    <Table
                      size="small"
                      rowKey={(booking, index) => `${record?.id}-${booking?.type || index}`}
                      columns={ticketBookingColumns}
                      dataSource={bookingRows}
                      pagination={false}
                      locale={{ emptyText: 'No booking breakdown for this ticket' }}
                    />
                  );
                },
                rowExpandable: (record) => Array.isArray(record?.bookings) && record.bookings.length > 0,
              }}
            />
          ) : (
            <Table
              size="small"
              rowKey="id"
              columns={ticketColumns}
              dataSource={rawTickets}
              pagination={{ pageSize: 8 }}
            />
          )}
        </Card>
      )}
    </>
  );
};

export default ReportTables;

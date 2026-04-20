import React from 'react';
import { Card, Col, Row, Table, Typography } from 'antd';
import { bookingTypeColumns, paymentGatewayColumns, ticketColumns } from '../utils/reportColumns';
import { formatCurrency, getBookingTypeRows, getUserWiseSales } from '../utils/reportHelpers';

const { Title } = Typography;

const ReportTables = ({
  reportData,
  showTickets = true,
  showOfflineBookingType = true,
  showOnlinePaymentGateways = true,
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
      title: 'Total Tickets',
      dataIndex: 'total_tickets',
      key: 'total_tickets',
      render: (value) => value ?? 0,

    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => formatCurrency(value),
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
      title : 'Total Tickets',
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
      title: 'POS Wise Sales',
      data: posWiseSales,
      emptyText: 'No POS wise sales data',
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
  const sectionLgSpan = visibleSectionCount > 1 ? 12 : 24;

  const userWiseColLgSpan =
    visibleUserWiseSalesSections.length <= 1 ? 24 :
      visibleUserWiseSalesSections.length === 2 ? 12 : 8;

  return (
    <>
      {visibleSectionCount > 0 && (
        <Row gutter={[16, 16]} className="mt-4">
          {showOnlinePaymentGateways && (
            <Col xs={24} lg={sectionLgSpan}>
              <Card size="small" title="Online" className="h-100">
                <Title level={5} className="mb-2">Payment Gateways</Title>
                <Table
                  size="small"
                  rowKey={(record, index) => `${record?.gateway || 'gateway'}-${index}`}
                  columns={paymentGatewayColumns}
                  dataSource={reportData?.payment_gateways || []}
                  pagination={false}
                  locale={{ emptyText: 'No payment gateway data' }}
                />
              </Card>
            </Col>
          )}

          {showOfflineSection && (
            <Col xs={24} lg={sectionLgSpan}>
              <Card size="small" title="Offline" className="h-100">
                {showOfflineBookingType && (
                  <>
                    <Table
                      size="small"
                      rowKey="key"
                      columns={bookingTypeColumns}
                      dataSource={bookingTypeRows}
                      pagination={false}
                      locale={{ emptyText: 'No offline booking type data' }}
                    />
                  </>
                )}

                {hasVisibleUserWiseSales && (
                  <>
                    <Row gutter={[16, 16]} className="mt-3">
                      {visibleUserWiseSalesSections.map((section) => (
                        <Col key={section.key} xs={24} lg={userWiseColLgSpan}>
                          <Card size="small">
                            <Title level={5} className="mb-2">{section?.title}</Title>
                            <Table
                              size="small"
                              rowKey={(record, index) => `${section.key}-${record?.name || index}`}
                              columns={userWiseSalesColumns}
                              dataSource={section?.data}
                              pagination={false}
                              locale={{ emptyText: section.emptyText }}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {showTickets && (
        <Card title="Ticket Wise Sales" className="mt-3">
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

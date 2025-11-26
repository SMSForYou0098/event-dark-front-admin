import React, { Fragment } from 'react';
import { Button, Card, Typography, List, Space, Avatar, Row, Col, Tag } from 'antd';
import { MailOutlined, PhoneOutlined, ShoppingOutlined, TagOutlined, UserOutlined } from '@ant-design/icons';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil';
import Flex from 'components/shared-components/Flex';

const { Text } = Typography;

const BookingSummary = ({ setCurrentStep, response, setResponse }) => {
  const handleBookNew = () => {
    setResponse(null);
    setCurrentStep(0);
  };

  // Ensure response is an array
  const bookings = Array.isArray(response) ? response : [];

  if (bookings.length === 0) {
    return (
      <Card bordered style={{ width: '100%', margin: '16px 0' }}>
        <Text type="secondary">No booking data available.</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleBookNew}>
            Book New
          </Button>
        </div>
      </Card>
    );
  }

  // ✅ Group bookings by ticket_id
  const groupedByTicket = bookings.reduce((acc, booking) => {
    const ticketId = booking.ticket_id;
    if (!acc[ticketId]) {
      acc[ticketId] = {
        ticket: booking.ticket,
        bookings: [],
        totalAmount: 0,
        totalDiscount: 0,
        attendees: [],
        sectionGroups: {} // Nested grouping by section
      };
    }

    acc[ticketId].bookings.push(booking);
    acc[ticketId].totalAmount += parseFloat(booking.total_amount || 0);
    acc[ticketId].totalDiscount += parseFloat(booking.discount || 0);

    // Group seats by section within this ticket
    if (booking.seat_name && booking.l_section) {
      const sectionId = booking.l_section.id || 'no-section';
      const sectionName = booking.l_section.name || 'General';

      if (!acc[ticketId].sectionGroups[sectionId]) {
        acc[ticketId].sectionGroups[sectionId] = {
          sectionId: sectionId,
          sectionName: sectionName,
          seats: []
        };
      }

      acc[ticketId].sectionGroups[sectionId].seats.push({
        seatName: booking.seat_name,
        bookingId: booking.id,
        attendee: booking.attendee
      });
    }

    // Add attendee if exists
    if (booking.attendee) {
      acc[ticketId].attendees.push({
        ...booking.attendee,
        bookingId: booking.id,
        seatName: booking.seat_name
      });
    }

    return acc;
  }, {});

  // Calculate overall totals
  const overallTotal = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const overallDiscount = bookings.reduce((sum, b) => sum + parseFloat(b.discount || 0), 0);

  // Get customer info from first booking
  const customerInfo = bookings[0];

  // Derive event name from normal or master booking structures
  const eventName = (() => {
    // Find the first booking entry that contains event/ticket details
    const sample = bookings.find((b) => b?.ticket?.event?.name || b?.ticket?.event?.title || b?.ticket?.name) || bookings[0];
    if (!sample) return '-';
    return (
      sample?.ticket?.event?.name ||
      sample?.ticket?.event?.title ||
      sample?.ticket?.name ||
      '-'
    );
  })();

  const formatINR = (value) => {
    const num = parseFloat(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(num);
  };
  const customerData = [
    {
      icon: <UserOutlined />,
      label: 'Name',
      value: customerInfo.name,
      strong: true
    },
    {
      icon: <MailOutlined />,
      label: 'Email',
      value: customerInfo.email,
      strong: false
    },
    {
      icon: <PhoneOutlined />,
      label: 'Phone',
      value: customerInfo.number,
      strong: false
    }
  ];
  return (
    <Card
      bordered={false}
      className='bg-transparent'
    //title={`Booking Confirmed : ${eventName}`}
    >
      {/* Success Message */}
      <Row gutter={ROW_GUTTER}>
        <Col xs={24} md={8}>
          <Row>
            <Col xs={24} md={24}>
              <Card
                size="small"
                title={
                  <Space size={8}>
                    <Avatar
                      size={40}
                      shape='square'
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: getBackgroundWithOpacity('var(--primary-color)', 0.15)
                      }}
                    />
                    Customer Information
                  </Space>
                }
              >
                <List
                  size="small"
                  dataSource={customerData}
                  renderItem={(item) => (
                    <List.Item style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <List.Item.Meta
                        avatar={item.icon}
                        title={<Text style={{ opacity: 0.5 }}>{item.label}</Text>}
                        description={<Text>{item.value || '-'}</Text>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} md={24}>
              <Card
                size="small"
                title={
                  <Space size={8}>
                    <Avatar
                      size={32}
                      shape='square'
                      icon={<ShoppingOutlined />}
                      style={{
                        backgroundColor: '#faad14',
                      }}
                    />
                    <Text strong style={{ fontSize: 16 }}>Order Summary</Text>
                  </Space>
                }
              >
                <List
                  size="small"
                  split={true}
                  dataSource={[
                    { label: 'Total Bookings', value: bookings.length, color: '#fff' },
                    { label: 'Total Amount', value: formatINR(overallTotal), color: '#52c41a' },
                    { label: 'Total Discount', value: formatINR(overallDiscount), color: '#faad14' }
                  ]}
                  renderItem={(item) => (
                    <List.Item className='d-flex justify-content-between align-items-center' style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <Text type="secondary">{item.label}</Text>
                      <Text
                        strong
                        style={{
                          fontSize: 24,
                          color: item.color
                        }}
                      >
                        {item.value}
                      </Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
        <Col xs={24} md={16}>
          <Card title={
            <Space size={8}>
              <Avatar
                size={32}
                shape='square'
                icon={<TagOutlined />}
                style={{
                  backgroundColor: '#1890ff',
                }}
              />
              <Text strong style={{ fontSize: 18 }}>{eventName}</Text>
            </Space>
          }
            extra={<Button type="primary" onClick={handleBookNew}>
              Book New
            </Button>}
          >
            <Row style={{ maxHeight: '75vh', overflow: 'auto' }}>
              {Object.entries(groupedByTicket).map(([ticketId, group]) => {
                const ticket = group.ticket;
                return (
                  <Col xs={24} md={24} key={ticketId}>
                    <Card
                      size="small"
                      className='mb-0'
                      title={ticket?.name || 'N/A'}
                      extra={
                        <Row gutter={[24, 16]} align="middle">
                          <Col xs={24} sm={24} md={12} lg={14}>
                            <Flex gap={16} wrap="wrap" align="flex-start">
                              {Object.entries(group.sectionGroups).map(([sectionId, sectionData]) => (
                                <div key={sectionId}>
                                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                    {sectionData.sectionName}
                                  </Text>
                                  <Flex wrap="wrap" gap={4}>
                                    {sectionData.seats.map((seat) => (
                                      <Tag key={seat.bookingId} color="green" className='px-2 py-1'>
                                        {seat.seatName}
                                      </Tag>
                                    ))}
                                  </Flex>
                                </div>
                              ))}
                            </Flex>
                          </Col>

                          <Col xs={12} sm={12} md={6} lg={5}>
                            <div className='text-center'>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>QTY</Text>
                              <Text strong style={{ fontSize: 18 }}>{group.bookings.length}</Text>
                            </div>
                          </Col>

                          <Col xs={12} sm={12} md={6} lg={5}>
                            <div className='text-center'>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>AMOUNT</Text>
                              <Text strong style={{ fontSize: 18, color: '#52c41a' }}>{formatINR(group.totalAmount)}</Text>
                            </div>
                          </Col>
                        </Row>
                      }
                    >

                      {/* Attendees Section */}
                      <div className='border-top pt-2'>
                        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                          ATTENDEES ({group.attendees.length})
                        </Text>

                        <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                          {group.attendees.map((attendee) => (
                            <Col xs={24} sm={12} md={12} lg={8} xl={8} key={attendee.id}>
                              <Card
                                size="small"
                                style={{
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              >
                                <Space>
                                  {attendee.Photo ? (
                                    <Avatar src={attendee.Photo} size={48} shape="square" />
                                  ) : (
                                    <Avatar
                                      icon={<UserOutlined />}
                                      size={48}
                                      shape="square"
                                      style={{ backgroundColor: '#1890ff' }}
                                    />
                                  )}
                                  <div>
                                    <Text strong style={{ display: 'block' }}>
                                      {attendee.Name || 'N/A'}
                                    </Text>
                                    {/* {attendee.seatName && (
                                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                        🎫 {attendee.seatName}
                                      </Text>
                                    )} */}
                                    {attendee.Mo && (
                                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                        📱 {attendee.Mo}
                                      </Text>
                                    )}
                                  </div>
                                </Space>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>
    </Card >
  );
};

export default BookingSummary;
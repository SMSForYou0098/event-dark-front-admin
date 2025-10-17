import React from 'react';
import { Button, Card, Typography, Descriptions, List, Tag, Divider, Space, Avatar, Row, Col } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

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
        attendees: []
      };
    }
    
    acc[ticketId].bookings.push(booking);
    acc[ticketId].totalAmount += parseFloat(booking.total_amount || 0);
    acc[ticketId].totalDiscount += parseFloat(booking.discount || 0);
    
    // Add attendee if exists
    if (booking.attendee) {
      acc[ticketId].attendees.push({
        ...booking.attendee,
        bookingId: booking.id
      });
    }
    
    return acc;
  }, {});

  // Calculate overall totals
  const overallTotal = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const overallDiscount = bookings.reduce((sum, b) => sum + parseFloat(b.discount || 0), 0);

  // Get customer info from first booking
  const customerInfo = bookings[0];

  const formatINR = (value) => {
    const num = parseFloat(value || 0);
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(num);
  };

  return (
    <Card
      bordered
      style={{ width: '100%', margin: '16px 0' }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Title level={4} style={{ margin: 0 }}>Booking Summary</Title>
          <Button type="primary" onClick={handleBookNew}>
            Book New
          </Button>
        </div>
      }
    >
      {/* Success Message */}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Tag color="success" style={{ fontSize: 14, padding: '8px 16px' }}>
          ✅ Booking completed successfully!
        </Tag>

        {/* Customer Details */}
        <Card size="small" title="Customer Information">
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label="Name">
              <Text strong>{customerInfo.name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {customerInfo.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {customerInfo.number || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Overall Summary */}
        <Card size="small" title="Order Summary">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Text type="secondary">Total Bookings:</Text>
              <div><Text strong style={{ fontSize: 18 }}>{bookings.length}</Text></div>
            </Col>
            <Col xs={24} sm={8}>
              <Text type="secondary">Total Amount:</Text>
              <div><Text strong style={{ fontSize: 18, color: '#52c41a' }}>{formatINR(overallTotal)}</Text></div>
            </Col>
            <Col xs={24} sm={8}>
              <Text type="secondary">Total Discount:</Text>
              <div><Text strong style={{ fontSize: 18 }}>{formatINR(overallDiscount)}</Text></div>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* Tickets Grouped by Ticket ID */}
        <Title level={5}>Ticket Details</Title>
        
        {Object.entries(groupedByTicket).map(([ticketId, group]) => {
          const ticket = group.ticket;
          const event = ticket?.event;

          return (
            <Card 
              key={ticketId}
              size="small" 
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <Text strong style={{ fontSize: 16 }}>
                    {ticket?.name || 'Ticket'} 
                  </Text>
                  <Tag color="blue">{group.bookings.length} booking(s)</Tag>
                </Space>
              }
            >
              {/* Event Info */}
              {event && (
                <Card size="small" >
                  <Space direction="vertical" size={4}>
                    <Text strong>Event: {event.name || '-'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Event ID: {event.id}
                    </Text>
                  </Space>
                </Card>
              )}

              {/* Ticket Summary */}
              <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
                <Col xs={12} sm={8}>
                  <Text type="secondary">Quantity:</Text>
                  <div><Text strong>{group.bookings.length}</Text></div>
                </Col>
                <Col xs={12} sm={8}>
                  <Text type="secondary">Total Amount:</Text>
                  <div><Text strong type="success">{formatINR(group.totalAmount)}</Text></div>
                </Col>
                <Col xs={12} sm={8}>
                  <Text type="secondary">Discount:</Text>
                  <div><Text strong>{formatINR(group.totalDiscount)}</Text></div>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              {/* Attendees List */}
              <Text strong style={{ fontSize: 14 }}>Attendees ({group.attendees.length})</Text>
              
              <List
                style={{ marginTop: 8 }}
                dataSource={group.attendees}
                locale={{ emptyText: 'No attendee information' }}
                renderItem={(attendee) => (
                  <List.Item key={attendee.id} style={{ padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={
                        attendee.Photo ? (
                          <Avatar src={attendee.Photo} size={48} />
                        ) : (
                          <Avatar icon={<UserOutlined />} size={48} />
                        )
                      }
                      title={
                        <Space>
                          <Text strong>{attendee.Name || 'N/A'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            (ID: {attendee.id})
                          </Text>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          {attendee.Email && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              📧 {attendee.Email}
                            </Text>
                          )}
                          {attendee.Mo && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              📱 {attendee.Mo}
                            </Text>
                          )}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Booking ID: {attendee.bookingId}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />

              {/* Individual Booking IDs */}
              <Divider style={{ margin: '12px 0' }} />
              <Space wrap size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>Booking IDs:</Text>
                {group.bookings.map(b => (
                  <Tag key={b.id} style={{ fontSize: 11 }}>{b.id}</Tag>
                ))}
              </Space>
            </Card>
          );
        })}
      </Space>
    </Card>
  );
};

export default BookingSummary;
import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Typography, Empty, Tag, Divider, Alert } from 'antd';
import { CalendarOutlined, TagsOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// Dummy data - Replace with actual API calls
const DUMMY_EVENTS = [
  { id: 1, name: 'IPL 2024 - Final', date: '2024-05-26', venue: 'Narendra Modi Stadium' },
  { id: 2, name: 'India vs Australia - Test Match', date: '2024-03-15', venue: 'M. Chinnaswamy Stadium' },
  { id: 3, name: 'PSL Finals 2024', date: '2024-04-20', venue: 'Gaddafi Stadium' },
];

const DUMMY_TICKET_TYPES = [
  { id: 1, name: 'General', price: 500, color: '#52c41a' },
  { id: 2, name: 'Premium', price: 1500, color: '#faad14' },
  { id: 3, name: 'VIP', price: 3000, color: '#f5222d' },
  { id: 4, name: 'Corporate Box', price: 10000, color: '#722ed1' },
  { id: 5, name: 'Student', price: 300, color: '#13c2c2' },
];

const EventTicketSelector = ({ onEventChange, onTicketTypeChange, selectedEvent, selectedTicketType }) => {
  const [events, setEvents] = useState(DUMMY_EVENTS);
  const [ticketTypes, setTicketTypes] = useState(DUMMY_TICKET_TYPES);
  const [loading, setLoading] = useState(false);

  // Replace with actual API calls
  useEffect(() => {
    // Fetch events from API
    setLoading(false);
  }, []);

  const handleEventSelect = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    onEventChange?.(event);
  };

  const handleTicketTypeSelect = (ticketTypeId) => {
    const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
    onTicketTypeChange?.(ticketType);
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: 'var(--component-bg)',
        borderColor: selectedEvent && selectedTicketType ? '#52c41a' : 'var(--border-secondary)',
        boxShadow: selectedEvent && selectedTicketType ? '0 0 12px rgba(82, 196, 26, 0.2)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: 12, color: 'var(--text-white)' }}>
            <CalendarOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />
            Select Event
          </Title>
          <Select
            showSearch
            placeholder="Choose an event"
            style={{ width: '100%' }}
            loading={loading}
            value={selectedEvent?.id}
            onChange={handleEventSelect}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            size="large"
          >
            {events.map((event) => (
              <Option key={event.id} value={event.id}>
                <Space direction="vertical" size={0}>
                  <Text strong>{event.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {event.date} • {event.venue}
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>

          {selectedEvent && (
            <Card
              size="small"
              style={{
                marginTop: 12,
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                borderColor: 'var(--primary-color)',
              }}
            >
              <Space direction="vertical" size={4}>
                <Text strong style={{ color: 'var(--text-white)' }}>
                  {selectedEvent.name}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  📅 {selectedEvent.date} • 📍 {selectedEvent.venue}
                </Text>
              </Space>
            </Card>
          )}
        </div>

        <Divider style={{ margin: '12px 0', borderColor: 'var(--border-secondary)' }} />

        <div>
          <Title level={5} style={{ marginBottom: 12, color: 'var(--text-white)' }}>
            <TagsOutlined style={{ marginRight: 8, color: 'var(--success-color)' }} />
            Select Ticket Type
          </Title>
          <Select
            showSearch
            placeholder="Choose ticket type"
            style={{ width: '100%' }}
            loading={loading}
            value={selectedTicketType?.id}
            onChange={handleTicketTypeSelect}
            disabled={!selectedEvent}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            size="large"
          >
            {ticketTypes.map((ticket) => (
              <Option key={ticket.id} value={ticket.id}>
                <Space>
                  <Tag color={ticket.color} style={{ margin: 0 }}>
                    {ticket.name}
                  </Tag>
                  <Text>₹{ticket.price.toLocaleString()}</Text>
                </Space>
              </Option>
            ))}
          </Select>

          {selectedTicketType && (
            <Card
              size="small"
              style={{
                marginTop: 12,
                backgroundColor: `${selectedTicketType.color}15`,
                borderColor: selectedTicketType.color,
              }}
            >
              <Space>
                <Tag color={selectedTicketType.color}>{selectedTicketType.name}</Tag>
                <Text strong style={{ color: 'var(--text-white)' }}>
                  ₹{selectedTicketType.price.toLocaleString()}
                </Text>
              </Space>
            </Card>
          )}

          {!selectedEvent && (
            <Empty
              description="Select an event first"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 12 }}
            />
          )}
        </div>

        {/* Success Banner */}
        {selectedEvent && selectedTicketType && (
          <>
            <Divider style={{ margin: '12px 0', borderColor: 'var(--border-secondary)' }} />
            <Alert
              message="Ready to Assign Tickets!"
              description={`You can now use the 🏷️ buttons in Stands, Tiers, Sections, or Rows to assign ${selectedTicketType.name} tickets (₹${selectedTicketType.price?.toLocaleString()}) for ${selectedEvent.name}.`}
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              style={{ borderRadius: 8 }}
            />
          </>
        )}
      </Space>
    </Card>
  );
};

export default EventTicketSelector;


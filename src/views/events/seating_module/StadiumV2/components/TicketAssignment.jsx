/**
 * TicketAssignment - Assign tickets to stands/tiers/sections/rows
 * 
 * Features:
 * - Select event first
 * - Then select ticket type
 * - Assign at any level (cascades down)
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Select,
  Space,
  Typography,
  Tag,
  Button,
  Divider,
  Empty,
  Alert,
  Radio,
} from 'antd';
import {
  CheckOutlined,
  CalendarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { DUMMY_EVENTS, DUMMY_TICKETS, SEAT_ICONS } from '../api/ticketData';

const { Text } = Typography;
const { Option } = Select;

const TicketAssignment = ({
  level, // 'stand' | 'tier' | 'section' | 'row'
  target, // The item being assigned (stand, tier, section, or row object)
  parentPath, // { stand, tier, section } - parents for context
  onAssign,
  onClose,
}) => {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('cascade'); // 'cascade' | 'this-only'

  // Get tickets for selected event
  const availableTickets = useMemo(() => {
    if (!selectedEventId) return [];
    return DUMMY_TICKETS[selectedEventId] || [];
  }, [selectedEventId]);

  // Get selected ticket details
  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return availableTickets.find(t => t.id === selectedTicketId);
  }, [selectedTicketId, availableTickets]);

  // Handle assignment
  const handleAssign = () => {
    if (!selectedTicketId) return;

    onAssign?.({
      ticketId: selectedTicketId,
      icon: selectedIcon || selectedTicket?.icon || 'circle',
      mode: assignmentMode,
      eventId: selectedEventId,
    });
  };

  // Get level label
  const getLevelLabel = () => {
    switch (level) {
      case 'stand': return `Stand: ${target?.name}`;
      case 'tier': return `Tier: ${target?.name}`;
      case 'section': return `Section: ${target?.name}`;
      case 'row': return `Row: ${target?.label}`;
      default: return 'Unknown';
    }
  };

  return (
    <Card
      title={
        <Space>
          <TagOutlined />
          <span>Assign Ticket</span>
        </Space>
      }
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      bodyStyle={{ padding: 20 }}
    >
      {/* Target info */}
      <Alert
        type="info"
        showIcon={false}
        message={
          <Space direction="vertical" size={4}>
            <Text strong style={{ color: '#fff' }}>{getLevelLabel()}</Text>
            {parentPath?.stand && level !== 'stand' && (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                {parentPath.stand.name}
                {parentPath.tier && ` → ${parentPath.tier.name}`}
                {parentPath.section && ` → ${parentPath.section.name}`}
              </Text>
            )}
          </Space>
        }
        style={{
          background: 'rgba(24, 144, 255, 0.1)',
          border: '1px solid rgba(24, 144, 255, 0.3)',
          marginBottom: 20,
        }}
      />

      {/* Step 1: Select Event */}
      <div style={{ marginBottom: 20 }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
          1. Select Event
        </Text>
        <Select
          placeholder="Choose an event..."
          value={selectedEventId}
          onChange={(v) => {
            setSelectedEventId(v);
            setSelectedTicketId(null); // Reset ticket when event changes
          }}
          style={{ width: '100%' }}
          size="large"
        >
          {DUMMY_EVENTS.map(event => (
            <Option key={event.id} value={event.id}>
              <Space>
                <CalendarOutlined />
                <span>{event.name}</span>
                <Tag size="small">{event.date}</Tag>
              </Space>
            </Option>
          ))}
        </Select>
      </div>

      {/* Step 2: Select Ticket */}
      {selectedEventId && (
        <div style={{ marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            2. Select Ticket Type
          </Text>
          {availableTickets.length === 0 ? (
            <Empty description="No tickets for this event" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: selectedTicketId === ticket.id 
                      ? 'rgba(24, 144, 255, 0.2)' 
                      : 'rgba(255,255,255,0.03)',
                    border: selectedTicketId === ticket.id 
                      ? '2px solid #1890ff' 
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Space>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: ticket.color,
                      }}
                    />
                    <div>
                      <Text strong style={{ color: '#fff' }}>{ticket.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
                        ₹{ticket.price.toLocaleString()}
                      </Text>
                    </div>
                  </Space>
                  {selectedTicketId === ticket.id && (
                    <CheckOutlined style={{ color: '#1890ff' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Icon (Optional) */}
      {selectedTicketId && (
        <div style={{ marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            3. Seat Icon (Optional)
          </Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(SEAT_ICONS).map(([key, icon]) => (
              <div
                key={key}
                onClick={() => setSelectedIcon(key)}
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selectedIcon === key 
                    ? 'rgba(24, 144, 255, 0.2)' 
                    : 'rgba(255,255,255,0.03)',
                  border: selectedIcon === key 
                    ? '2px solid #1890ff' 
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title={icon.name}
              >
                <canvas
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, 24, 24);
                      icon.draw(ctx, 12, 12, 16, selectedTicket?.color || '#52c41a', 'rgba(255,255,255,0.3)');
                    }
                  }}
                  width={24}
                  height={24}
                  style={{ display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Assignment Mode */}
      {selectedTicketId && level !== 'row' && (
        <div style={{ marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            4. Assignment Mode
          </Text>
          <Radio.Group
            value={assignmentMode}
            onChange={(e) => setAssignmentMode(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="cascade" style={{ color: '#fff' }}>
                <div>
                  <Text strong style={{ color: '#fff' }}>Apply to all children</Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    {level === 'stand' && 'All tiers, sections, and rows in this stand'}
                    {level === 'tier' && 'All sections and rows in this tier'}
                    {level === 'section' && 'All rows in this section'}
                  </Text>
                </div>
              </Radio>
              <Radio value="this-only" style={{ color: '#fff' }}>
                <div>
                  <Text strong style={{ color: '#fff' }}>This {level} only</Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    Only set default for this {level}, children can override
                  </Text>
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      )}

      <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Actions */}
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          disabled={!selectedTicketId}
          onClick={handleAssign}
        >
          Assign Ticket
        </Button>
      </Space>
    </Card>
  );
};

export default TicketAssignment;


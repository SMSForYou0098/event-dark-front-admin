/**
 * TicketAssignment - Assign tickets to stands/tiers/sections/rows
 * 
 * Features:
 * - Event is selected at stadium level (passed as prop)
 * - Select ticket type from available tickets for the event
 * - Assign at any level (always cascades down to children)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Space,
  Typography,
  Button,
  Divider,
  Empty,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  CheckOutlined,
  CalendarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { DUMMY_EVENTS, DUMMY_TICKETS } from '../api/ticketData';
import { getIconComponent, seatIcons } from '../../theatre_layout/components/consts';

const { Text } = Typography;

const TicketAssignment = ({
  level, // 'stand' | 'tier' | 'section' | 'row'
  target, // The item being assigned (stand, tier, section, or row object)
  parentPath, // { stand, tier, section } - parents for context
  selectedEventId, // Event ID passed from parent (stadium level)
  onAssign,
  onClose,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  // Always cascade to children - no mode selection needed

  // Get the selected event details
  const selectedEvent = useMemo(() => {
    return DUMMY_EVENTS.find(e => e.id === selectedEventId);
  }, [selectedEventId]);

  // Initialize with previously assigned ticket (if any)
  useEffect(() => {
    if (target) {
      if (target.ticketId) {
        setSelectedTicketId(target.ticketId);
      } else {
        setSelectedTicketId(null);
      }
      
      if (target.icon) {
        setSelectedIcon(target.icon);
      } else {
        setSelectedIcon(null);
      }
    }
  }, [target]);

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

  // Handle assignment - always cascade to all children
  const handleAssign = () => {
    if (!selectedTicketId) return;

    onAssign?.({
      ticketId: selectedTicketId,
      icon: selectedIcon || selectedTicket?.icon || 'circle',
      mode: 'cascade', // Always apply to all children
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

      {/* Event Info (read-only, set at stadium level) */}
      <div style={{ marginBottom: 20 }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
          Event
        </Text>
        {selectedEvent ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'rgba(82, 196, 26, 0.1)',
            border: '1px solid rgba(82, 196, 26, 0.3)',
            borderRadius: 8,
          }}>
            <CalendarOutlined style={{ fontSize: 18, color: '#52c41a' }} />
            <div>
              <Text strong style={{ color: '#fff', display: 'block' }}>{selectedEvent.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{selectedEvent.date}</Text>
            </div>
          </div>
        ) : (
          <Alert
            type="warning"
            message="No event selected. Please select an event from the header first."
            style={{ background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.3)' }}
          />
        )}
      </div>

      {/* Select Ticket Type */}
      {selectedEventId && (
        <div style={{ marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            Select Ticket Type
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
          <Row gutter={[8, 8]}>
            {/* Default circle icon */}
            <Col>
              <div
                onClick={() => setSelectedIcon('circle')}
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selectedIcon === 'circle' || !selectedIcon
                    ? selectedTicket?.color || '#1890ff'
                    : 'rgba(255,255,255,0.05)',
                  border: selectedIcon === 'circle' || !selectedIcon
                    ? '2px solid #1890ff' 
                    : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Default Circle"
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: selectedIcon === 'circle' || !selectedIcon ? '#fff' : 'rgba(255,255,255,0.3)',
                }} />
              </div>
            </Col>

            {/* Chair/Seat icons from theatre layout */}
            {seatIcons?.map(iconObj => {
              const IconComponent = getIconComponent(iconObj.icon);
              const isActive = selectedIcon === iconObj.icon;

              return (
                <Col key={iconObj.id}>
                  <div
                    onClick={() => setSelectedIcon(iconObj.icon)}
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive 
                        ? selectedTicket?.color || '#1890ff'
                        : 'rgba(255,255,255,0.05)',
                      border: isActive 
                        ? '2px solid #1890ff' 
                        : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontSize: 22,
                    }}
                    title={iconObj.name}
                  >
                    {IconComponent && <IconComponent />}
                  </div>
                </Col>
              );
            })}
          </Row>
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


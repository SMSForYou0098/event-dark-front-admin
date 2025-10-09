// TicketsStep.jsx
import React from 'react';
import { Form, Input, Row, Col, Switch, Card } from 'antd';
import TicketManager from 'views/events/Tickets/TicketManager/TicketManager';

const { TextArea } = Input;

const TicketsStep = ({ eventId, eventName }) => {
  // For now, using dummy values
  // You can replace these with actual props later

console.log('TicketsStep eventId:', eventId, 'eventName:', eventName);

  const toChecked = (v) => v === 1 || v === '1';
  const toNumber = (checked) => (checked ? 1 : 0);

  const switchFields = [
    { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans' },
    { name: 'ticket_system', label: 'Booking By Ticket' },
    { name: 'bookingBySeat', label: 'Booking By Seat' },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Ticket Manager Section */}
      <Card className="mb-4">
        <TicketManager
          eventId={eventId}
          eventName={eventName}
          showEventName={true}
        />
      </Card>

      {/* Ticket Settings */}
      <Card title="Ticket Settings" className="mb-4">
        <Row gutter={[16, 16]}>
          {switchFields.map((f) => (
            <Col xs={24} sm={8} key={f.name}>
              <Form.Item
                name={f.name}
                label={f.label}
                tooltip={f.tooltip}
                valuePropName="checked"
                getValueProps={(v) => ({ checked: toChecked(v) })}
                getValueFromEvent={toNumber}
                initialValue={0}
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Terms & Conditions */}
      <Card title="Terms & Conditions">
        <Form.Item
          name="ticket_terms"
          label="Ticket Terms & Conditions"
          rules={[{ required: true, message: 'Please enter ticket terms' }]}
        >
          <TextArea
            rows={6}
            placeholder="Enter ticket terms and conditions..."
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Card>
    </div>
  );
};

export default TicketsStep;
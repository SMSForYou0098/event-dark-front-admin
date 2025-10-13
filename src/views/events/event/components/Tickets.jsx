// TicketsStep.jsx
import React from 'react';
import { Form, Input, Row, Col, Switch, Card } from 'antd';
import TicketManager from 'views/events/Tickets/TicketManager/TicketManager';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { TextArea } = Input;

const TicketsStep = ({ eventId, eventName }) => {
  // For now, using dummy values
  // You can replace these with actual props later

  const toChecked = (v) => v === 1 || v === '1';
  const toNumber = (checked) => (checked ? 1 : 0);

  const switchFields = [
    { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans' },
    { name: 'ticket_system', label: 'Booking By Ticket' },
    { name: 'bookingBySeat', label: 'Booking By Seat' },
  ];

  return (
    <Row gutter={ROW_GUTTER}>
      <Col xs={24} md={12} lg={18}>
        {/* Ticket Manager Section */}
        <Card className="mb-4">
          <TicketManager
            eventId={eventId}
            eventName={eventName}
            showEventName={true}
          />
        </Card>
      </Col>

      {/* Ticket Settings */}
      <Col xs={24} md={12} lg={6}>
        <Card title="Ticket Settings">
          <div className="d-flex flex-column gap-3">
            {switchFields.map((f) => (
              <div key={f.name} className="d-flex justify-content-between align-items-center mb-4">
                <span style={{ fontSize: '14px' }}>{f.label}</span>
                <Form.Item
                  name={f.name}
                  valuePropName="checked"
                  getValueProps={(v) => ({ checked: toChecked(v) })}
                  getValueFromEvent={toNumber}
                  initialValue={0}
                  noStyle
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </div>
            ))}
          </div>
        </Card>
      </Col>
      {/* Terms & Conditions */}
      <Col span={24}>
        <Card title="Terms & Conditions">
          <Form.Item
            name="ticket_terms"
            label="Ticket Terms & Conditions"
            rules={[{ required: true, message: 'Please enter ticket terms' }]}
          >
            <TextArea
              rows={3}
              placeholder="Enter ticket terms and conditions..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );
};

export default TicketsStep;
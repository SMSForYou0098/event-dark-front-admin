// TicketsStep.jsx
import React from 'react';
import { Form, Input, Row, Col, Switch, Card } from 'antd';
import TicketManager from 'views/events/Tickets/TicketManager/TicketManager';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { TextArea } = Input;

const TicketsStep = ({ eventId, eventName }) => {
  const form = Form.useFormInstance();

  const toChecked = (v) => v === 1 || v === '1';
  const toNumber = (checked) => (checked ? 1 : 0);

  const handleBookingTypeChange = (fieldName, checked) => {
    if (checked) {
      // If one is turned on, turn off the other
      if (fieldName === 'ticket_system') {
        form.setFieldValue('bookingBySeat', 0);
      } else if (fieldName === 'bookingBySeat') {
        form.setFieldValue('ticket_system', 0);
      }
    }
    return toNumber(checked);
  };

  const switchFields = [
    { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans', initialValue: 0 },
    { 
      name: 'ticket_system', 
      label: 'Booking By Ticket',
      onChange: (checked) => handleBookingTypeChange('ticket_system', checked),
      initialValue: 1  // Default checked
    },
    { 
      name: 'bookingBySeat', 
      label: 'Booking By Seat',
      onChange: (checked) => handleBookingTypeChange('bookingBySeat', checked),
      initialValue: 0
    },
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
                  getValueFromEvent={f.onChange || toNumber}
                  initialValue={f.initialValue}
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
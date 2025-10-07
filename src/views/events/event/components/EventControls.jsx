// EventControlsStep.jsx
import React from 'react';
import { Form, Input, Select, Switch, Card, Row, Col, Space } from 'antd';
import { CONSTANTS } from './CONSTANTS';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { TextArea } = Input;

// helpers — accept "1"/1 => true, "0"/0/undefined => false
const toChecked = (v) => v === 1 || v === '1';
const toNumber = (checked) => (checked ? 1 : 0);

const EventControlsStep = ({ form, isEdit }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {/* Top controls */}
      <Row gutter={ROW_GUTTER}>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item
            name="scan_detail"
            label="User Data While Scan"
            initialValue={null}
            rules={[{ required: true, message: 'Please select user data option' }]}
          >
            <Select options={CONSTANTS.userDataOptions} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Form.Item
            name="insta_whts_url"
            label="Instagram URL"
            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
          >
            <Input placeholder="https://instagram.com/your-event" />
          </Form.Item>
        </Col>
      </Row>

      {/* Switch Section */}
      <Card title="Event Settings" size="small">
        <Row gutter={ROW_GUTTER}>
          {[
            { name: 'event_feature', label: 'High Demand', tooltip: 'Mark this event as high demand' },
            { name: 'status', label: 'Event Status', tooltip: 'Enable or disable event', onLabels: ['Active', 'Inactive'] },
            { name: 'house_full', label: 'House Full', tooltip: 'Mark event as sold out' },
            { name: 'online_att_sug', label: 'Hide Online Attendee Suggestion' },
            { name: 'offline_att_sug', label: 'Hide Agent Attendee Suggestion' },
            { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans' },
            { name: 'ticket_system', label: 'Booking By Ticket' },
            { name: 'bookingBySeat', label: 'Booking By Seat' },
          ].map((f) => (
            <Col xs={24} sm={12} lg={8} key={f.name}>
              <Form.Item
                name={f.name}
                label={f.label}
                tooltip={f.tooltip}
                valuePropName="checked"
                // 👇 FIX: use checked, not value
                getValueProps={(v) => ({ checked: toChecked(v) })}
                getValueFromEvent={toNumber}
                initialValue={0}
              >
                <Switch
                  checkedChildren={f.onLabels?.[0] || 'Yes'}
                  unCheckedChildren={f.onLabels?.[1] || 'No'}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>

      {/* WhatsApp Note */}
      <Form.Item
        name="whts_note"
        label="WhatsApp Note"
        tooltip="This note will be sent via WhatsApp to attendees"
      >
        <TextArea
          rows={3}
          placeholder="Enter WhatsApp notification message..."
          showCount
          maxLength={200}
        />
      </Form.Item>
    </Space>
  );
};

export default EventControlsStep;

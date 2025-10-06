// EventControlsStep.jsx
import React, { useEffect } from 'react';
import { Form, Input, Select, Switch, Card, Row, Col, Space } from 'antd';
import { CONSTANTS } from './CONSTANTS';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { TextArea } = Input;

const EventControlsStep = ({ form }) => {
  // helper to sync boolean → 0/1 for given field
  const handleSwitchChange = (fieldName) => (checked) => {
    form.setFieldsValue({ [fieldName]: checked ? 1 : 0 });
  };

  // set default 0 for missing fields on mount (so backend always receives numeric)
  useEffect(() => {
    const numericDefaults = {
      event_feature: 0,
      status: 0,
      house_full: 0,
      online_att_sug: 0,
      offline_att_sug: 0,
      multi_scan: 0,
      ticket_system: 0,
      bookingBySeat: 0,
    };
    form.setFieldsValue(numericDefaults);
  }, [form]);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Row gutter={ROW_GUTTER}>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item
            name="scan_detail"
            label="User Data While Scan"
            initialValue="both"
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

      <Card title="Event Settings" size="small">
        <Row gutter={ROW_GUTTER}>
          {/* Each Switch synced with hidden 0/1 field */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="High Demand" tooltip="Mark this event as high demand">
              <Switch
                onChange={handleSwitchChange('event_feature')}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </Form.Item>
            <Form.Item name="event_feature" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="Event Status" tooltip="Enable or disable event">
              <Switch
                onChange={handleSwitchChange('status')}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>
            <Form.Item name="status" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="House Full" tooltip="Mark event as sold out">
              <Switch
                onChange={handleSwitchChange('house_full')}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </Form.Item>
            <Form.Item name="house_full" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="Hide Online Attendee Suggestion">
              <Switch
                onChange={handleSwitchChange('online_att_sug')}
                checkedChildren="Hide"
                unCheckedChildren="Show"
              />
            </Form.Item>
            <Form.Item name="online_att_sug" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="Hide Agent Attendee Suggestion">
              <Switch
                onChange={handleSwitchChange('offline_att_sug')}
                checkedChildren="Hide"
                unCheckedChildren="Show"
              />
            </Form.Item>
            <Form.Item name="offline_att_sug" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="Multi Scan Ticket" tooltip="Allow multiple scans">
              <Switch
                onChange={handleSwitchChange('multi_scan')}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </Form.Item>
            <Form.Item name="multi_scan" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="Booking By Ticket">
              <Switch
                onChange={handleSwitchChange('ticket_system')}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </Form.Item>
            <Form.Item name="ticket_system" hidden><input /></Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="Booking By Seat">
              <Switch
                onChange={handleSwitchChange('bookingBySeat')}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </Form.Item>
            <Form.Item name="bookingBySeat" hidden><input /></Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.Item
        name="whatsappNote"
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

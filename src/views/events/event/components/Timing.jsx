// TimingStep.jsx
import React from 'react';
import { Form, DatePicker, TimePicker, Switch, Card, Row, Col, Space } from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import LocationStep from './LocationStep';

const { RangePicker } = DatePicker;

const TimingStep = ({ form },props) => (
    <Row gutter={ROW_GUTTER}>
        <Col xs={12}>
            <Row gutter={16}>
            <Col xs={12}>
                <Form.Item
                    name="dateRange"
                    label="Event Date Range"
                    rules={[{ required: true, message: 'Please select date range' }]}
                >
                    <RangePicker showTime placeholder={['Start Date', 'End Date']} />
                </Form.Item>
            </Col>
            <Col xs={8}>
                <Form.Item
                    name="entryTime"
                    label="Entry Time"
                    rules={[{ required: true, message: 'Please select entry time' }]}
                >
                    <TimePicker
                        style={{ width: '100%' }}
                        format="HH:mm"
                        placeholder="Select entry time"
                    />
                </Form.Item>
            </Col>
            <Col xs={4}>
                <Form.Item
                    name="eventType"
                    label="Event Type"
                    tooltip="Choose between Daily or Seasonal event"
                >
                    <Switch
                        checkedChildren="Daily"
                        unCheckedChildren="Seasonal"
                        defaultChecked
                        onChange={(checked) => {
                            form.setFieldValue('eventType', checked ? 'daily' : 'seasonal');
                        }}
                    />
                </Form.Item>
            </Col>
            </Row>
        </Col>
        <Col xs={12}>
            <LocationStep {...props}/>
        </Col>
    </Row>
);

export default TimingStep;
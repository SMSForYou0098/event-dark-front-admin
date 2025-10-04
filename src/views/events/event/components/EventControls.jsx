// EventControlsStep.jsx
import React from 'react';
import { Form, Input, Select, Switch, Card, Row, Col, Space } from 'antd';
import { CONSTANTS } from './CONSTANTS';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { TextArea } = Input;

const EventControlsStep = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
        <Row gutter={ROW_GUTTER}>
            <Col xs={24} sm={12} lg={12}>
                <Form.Item
                    name="userDataWhileScan"
                    label="User Data While Scan"
                    initialValue="both"
                    rules={[{ required: true, message: 'Please select user data option' }]}
                >
                    <Select options={CONSTANTS.userDataOptions} />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={12}>
                <Form.Item
                    name="instagramUrl"
                    label="Instagram URL"
                    rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                >
                    <Input placeholder="https://instagram.com/your-event" />
                </Form.Item>
            </Col>
        </Row>
        <Card title="Event Settings" size="small">
            <Row gutter={ROW_GUTTER}>
                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="highDemand"
                        label="High Demand"
                        valuePropName="checked"
                        tooltip="Mark this event as high demand"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="eventStatus"
                        label="Event Status"
                        valuePropName="checked"
                        tooltip="Enable or disable event"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="houseFull"
                        label="House Full"
                        valuePropName="checked"
                        tooltip="Mark event as sold out"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="hideOnlineAttendee"
                        label="Hide Online Attendee Suggestion"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="hideAgentAttendee"
                        label="Hide Agent Attendee Suggestion"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="multiScanTicket"
                        label="Multi Scan Ticket"
                        valuePropName="checked"
                        tooltip="Allow tickets to be scanned multiple times"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="bookingByTicket"
                        label="Booking By Ticket"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        name="bookingBySeat"
                        label="Booking By Seat"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
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

export default EventControlsStep;
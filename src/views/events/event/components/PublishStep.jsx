// PublishStep.jsx
import React from 'react';
import { Card, Space, Typography, Alert, Divider } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PublishStep = ({ formData }) => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a', marginBottom: 24 }} />

        <Title level={2}>Review & Publish Event</Title>

        <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            Please review all the information you've entered before publishing your event.
            Once published, your event will be visible to all users on the platform.
        </Paragraph>

        <Alert
            message="Important Notice"
            description="Make sure all required fields are filled correctly. You can edit the event after publishing, but some changes may affect existing bookings and attendees."
            type="info"
            showIcon
            style={{ marginBottom: 32, textAlign: 'left', maxWidth: 700, margin: '0 auto 32px' }}
        />

        <Card
            title="Event Summary"
            size="small"
            style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                    <Text strong>Event Name:</Text>{' '}
                    <Text>{formData.name || 'N/A'}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                    <Text strong>Category:</Text>{' '}
                    <Text>{formData.category || 'N/A'}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                    <Text strong>Venue:</Text>{' '}
                    <Text>{formData.venue_id || 'N/A'}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                    <Text strong>Location:</Text>{' '}
                    <Text>{formData.city || 'N/A'}, {formData.state || 'N/A'}</Text>
                </div>
            </Space>
        </Card>
    </div>
);

export default PublishStep;
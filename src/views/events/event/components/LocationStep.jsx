// LocationStep.jsx
import React from 'react';
import { Form, Input, Card, Space } from 'antd';

const { TextArea } = Input;

const LocationStep = ({ embedCode, onEmbedChange }) => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Form.Item
            name="mapEmbedCode"
            label="Google Map Embed Code"
            rules={[{ required: true, message: 'Please enter map embed code' }]}
            tooltip="Copy the embed code from Google Maps"
        >
            <TextArea
                rows={4}
                placeholder='Paste Google Map embed code here...'
                onChange={onEmbedChange}
            />
        </Form.Item>

        {embedCode && (
            <Card title="Map Preview" size="small">
                <div
                    style={{
                        width: '100%',
                        height: '400px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ __html: embedCode }}
                />
            </Card>
        )}
    </Space>
);

export default LocationStep;
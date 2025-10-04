// MediaStep.jsx
import React from 'react';
import { Form, Input, Upload, Row, Col, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const MediaStep = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Form.Item
            name="eventThumbnail"
            label="Event Thumbnail"
            rules={[{ required: true, message: 'Please upload event thumbnail' }]}
            tooltip="Recommended size: 1200x630px"
        >
            <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
                accept="image/*"
            >
                <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload Thumbnail</div>
                </div>
            </Upload>
        </Form.Item>

        <Row gutter={16}>
            <Col xs={24} md={12}>
                <Form.Item
                    name="youtubeUrl"
                    label="YouTube Video URL"
                    rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                >
                    <Input
                        placeholder="https://youtube.com/watch?v=..."
                        size="large"
                    />
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
                <Form.Item
                    name="instagramMediaUrl"
                    label="Instagram URL"
                    rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                >
                    <Input
                        placeholder="https://instagram.com/p/..."
                        size="large"
                    />
                </Form.Item>
            </Col>
        </Row>

        <Row gutter={16}>
            <Col xs={24} md={12}>
                <Form.Item
                    name="instagramThumbnail"
                    label="Instagram Thumbnail"
                >
                    <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        accept="image/*"
                    >
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    </Upload>
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
                <Form.Item
                    name="arenaLayout"
                    label="Ground/Arena Layout Image"
                >
                    <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        accept="image/*"
                    >
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload Layout</div>
                        </div>
                    </Upload>
                </Form.Item>
            </Col>
        </Row>

        <Form.Item
            name="eventGallery"
            label="Event Image Gallery (Max 5 images)"
        >
            <Upload
                listType="picture-card"
                multiple
                maxCount={5}
                beforeUpload={() => false}
                accept="image/*"
            >
                <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload Images</div>
                </div>
            </Upload>
        </Form.Item>
    </Space>
);

export default MediaStep;
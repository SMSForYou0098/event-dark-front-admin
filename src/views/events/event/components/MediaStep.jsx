// MediaStep.jsx
import React from 'react';
import { Form, Input, Upload, Row, Col, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const normFile = (e) => Array.isArray(e) ? e : e?.fileList;

const MediaStep = () => (
  <Space direction="vertical" size="large" style={{ width: '100%' }}>
    {/* Event thumbnail (single) */}
    <Form.Item
      name="event_thumbnail"
      label="Event Thumbnail"
      rules={[{ required: true, message: 'Please upload event thumbnail' }]}
      tooltip="Recommended size: 1200x630px"
      valuePropName="fileList"
      getValueFromEvent={normFile}
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
          name="youtube_url"
          label="YouTube Video URL"
          rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
        >
          <Input placeholder="https://youtube.com/watch?v=..." size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="instagram_media_url"
          label="Instagram URL"
          rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
        >
          <Input placeholder="https://instagram.com/p/..." size="large" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="instagram_thumbnail"
          label="Instagram Thumbnail"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} accept="image/*">
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="arena_layout"
          label="Ground/Arena Layout Image"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} accept="image/*">
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload Layout</div>
            </div>
          </Upload>
        </Form.Item>
      </Col>
    </Row>

    <Form.Item
      name="event_gallery"
      label="Event Image Gallery (Max 5 images)"
      valuePropName="fileList"
      getValueFromEvent={normFile}
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

// MediaStep.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Input, Upload, Row, Col, Space, Image } from 'antd';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import Dragger from 'antd/es/upload/Dragger';

const normFile = (e) => {
  if (Array.isArray(e)) return e;
  if (e && Array.isArray(e.fileList)) return e.fileList;
  return [];
};

const MediaStep = ({ form }) => {
  // ---- Thumbnail preview (existing or just-picked) ----
  const thumbList = Form.useWatch('thumbnail', form);
  const [thumbPreview, setThumbPreview] = useState(null);
  const objectUrlRef = useRef(null); // so we can revoke created ObjectURLs

  useEffect(() => {
    // cleanup old object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (Array.isArray(thumbList) && thumbList.length > 0) {
      const f = thumbList[0];
      if (f?.url) {
        // existing server image (edit mode)
        setThumbPreview(f.url);
      } else if (f?.originFileObj) {
        // newly selected local file
        const url = URL.createObjectURL(f.originFileObj);
        objectUrlRef.current = url;
        setThumbPreview(url);
      } else {
        setThumbPreview(null);
      }
    } else {
      setThumbPreview(null);
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [thumbList]);

  // Keep only 1 thumb in the list on change
  const handleThumbChange = (info) => {
    const fileList = (info?.fileList || []).slice(-1); // ensure max 1
    form.setFieldsValue({ thumbnail: fileList });
  };

  const handleThumbRemove = () => {
    // If you want to track removal of an existing thumbnail to delete on backend,
    // you can set another hidden field here (e.g., remove_thumbnail: true).
    // Currently not required by your controller, so we just allow removal.
    return true;
  };

  // ---- Gallery removal tracking (existing URLs only) ----
  const handleGalleryRemove = useCallback(
    (file) => {
      const url = file?.url;
      if (url) {
        const prev = form.getFieldValue('remove_images') || [];
        if (!prev.includes(url)) {
          form.setFieldsValue({ remove_images: [...prev, url] });
        }
      }
      return true;
    },
    [form]
  );

  const handleRemove = (file) => {
    if (file?.url) {
      const prev = form.getFieldValue('remove_images') || [];
      form.setFieldsValue({ remove_images: [...prev, file.url] });
    }
    return true;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Hidden array field to collect URLs/paths of removed gallery images */}
      <Form.Item name="remove_images" hidden>
        <input />
      </Form.Item>

      {/* Event thumbnail (single) with side-by-side preview */}
      <Form.Item
        name="thumbnail"
        label="Event Thumbnail"
        rules={[{ required: true, message: 'Please upload event thumbnail' }]}
        valuePropName="fileList"
        getValueFromEvent={normFile}
      >
        <Row gutter={16} align="middle">
          <Col>
            <div
              style={{
                width: 220,
                height: 220,
                margin: 'auto',
              }}
            >
              <Dragger
                multiple={false}
                maxCount={1}
                beforeUpload={() => false} // prevent auto-upload
                accept="image/*"
                onChange={handleThumbChange}
                onRemove={handleThumbRemove}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 10,
                }}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 0 }}>
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 13 }}>
                  Upload Thumbnail
                </p>
              </Dragger>
            </div>
          </Col>

          {thumbPreview && (
            <Col>
              <div
                style={{
                  width: 220,
                  height: 220,
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={thumbPreview}
                  alt="Thumbnail Preview"
                  width={220}
                  height={220}
                  style={{ objectFit: 'cover' }}
                  preview={false}
                />
              </div>
            </Col>
          )}
        </Row>
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
            name="insta_thumb"
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
            name="layout_image"
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
        name="images"
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
          onRemove={handleGalleryRemove}
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload Images</div>
          </div>
        </Upload>
      </Form.Item>
    </Space>
  );
};

export default MediaStep;

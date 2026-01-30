// MediaStep.jsx
import React, { useCallback, useState } from 'react';
import { Form, Input, Row, Col, Space, Image, Button } from 'antd';
import { PlusOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const MediaStep = ({ form }) => {
  // Modal visibility states for each picker
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [instaThumbModalOpen, setInstaThumbModalOpen] = useState(false);
  const [layoutImageModalOpen, setLayoutImageModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  // Watch form values for previews
  const thumbnailValue = Form.useWatch('thumbnail', form);
  const instaThumbValue = Form.useWatch('insta_thumbnail', form);
  const layoutImageValue = Form.useWatch('layout_image', form);
  const galleryImages = Form.useWatch('images', form);

  // Handler for thumbnail selection (single image with dimension validation)
  const handleThumbnailSelect = useCallback((url) => {
    form.setFieldsValue({ thumbnail: url });
  }, [form]);

  // Handler for insta thumbnail selection (single image)
  const handleInstaThumbSelect = useCallback((url) => {
    form.setFieldsValue({ insta_thumbnail: url });
  }, [form]);

  // Handler for layout image selection (single image)
  const handleLayoutImageSelect = useCallback((url) => {
    form.setFieldsValue({ layout_image: url });
  }, [form]);

  // Handler for gallery images selection (multiple)
  const handleGallerySelect = useCallback((urls) => {
    form.setFieldsValue({ images: urls });
  }, [form]);

  // Simple remove handlers - just clear the value
  const handleRemoveThumbnail = useCallback(() => {
    form.setFieldsValue({ thumbnail: null });
  }, [form]);

  const handleRemoveInstaThumb = useCallback(() => {
    form.setFieldsValue({ insta_thumbnail: null });
  }, [form]);

  const handleRemoveLayoutImage = useCallback(() => {
    form.setFieldsValue({ layout_image: null });
  }, [form]);

  const handleRemoveGalleryImage = useCallback((urlToRemove) => {
    const currentUrls = form.getFieldValue('images') || [];
    form.setFieldsValue({ images: currentUrls.filter(url => url !== urlToRemove) });
  }, [form]);

  // Reusable image preview card component
  const ImagePreviewCard = ({ src, onRemove, width = 150, height = 150, label }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          width,
          height,
          border: '1px solid #303030',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#1a1a1a',
        }}
      >
        <Image
          src={src}
          alt={label}
          width={width}
          height={height}
          style={{ objectFit: 'cover' }}
          preview={{ mask: 'Preview' }}
        />
      </div>
      {onRemove && (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );

  // Placeholder upload button
  const UploadPlaceholder = ({ onClick, label, size = 150 }) => (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        border: '2px dashed #404040',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: '#1a1a1a',
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#404040'}
    >
      <PictureOutlined style={{ fontSize: 28, color: '#666', marginBottom: 8 }} />
      <span style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '0 8px' }}>
        {label}
      </span>
    </div>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Event Thumbnail (single, 600×725px required) */}
      <Form.Item
        name="thumbnail"
        label="Event Thumbnail"
        rules={[{ required: true, message: 'Please select event thumbnail' }]}
      >
        <Row gutter={16} align="middle">
          <Col>
            {thumbnailValue ? (
              <ImagePreviewCard
                src={thumbnailValue}
                onRemove={handleRemoveThumbnail}
                width={180}
                height={218}
                label="Thumbnail"
              />
            ) : (
              <UploadPlaceholder
                onClick={() => setThumbnailModalOpen(true)}
                label="Select Thumbnail (600×725px)"
                size={180}
              />
            )}
          </Col>
          {thumbnailValue && (
            <Col>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setThumbnailModalOpen(true)}
              >
                Change Thumbnail
              </Button>
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
        {/* Instagram Thumbnail */}
        <Col xs={24} md={12}>
          <Form.Item
            name="insta_thumbnail"
            label="Instagram Thumbnail"
          >
            <Row gutter={12} align="middle">
              <Col>
                {instaThumbValue ? (
                  <ImagePreviewCard
                    src={instaThumbValue}
                    onRemove={handleRemoveInstaThumb}
                    width={120}
                    height={120}
                    label="Insta Thumbnail"
                  />
                ) : (
                  <UploadPlaceholder
                    onClick={() => setInstaThumbModalOpen(true)}
                    label="Select Image"
                    size={120}
                  />
                )}
              </Col>
              {instaThumbValue && (
                <Col>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setInstaThumbModalOpen(true)}
                  >
                    Change
                  </Button>
                </Col>
              )}
            </Row>
          </Form.Item>
        </Col>

        {/* Layout Image */}
        <Col xs={24} md={12}>
          <Form.Item
            name="layout_image"
            label="Ground/Arena Layout Image"
          >
            <Row gutter={12} align="middle">
              <Col>
                {layoutImageValue ? (
                  <ImagePreviewCard
                    src={layoutImageValue}
                    onRemove={handleRemoveLayoutImage}
                    width={120}
                    height={120}
                    label="Layout"
                  />
                ) : (
                  <UploadPlaceholder
                    onClick={() => setLayoutImageModalOpen(true)}
                    label="Select Layout"
                    size={120}
                  />
                )}
              </Col>
              {layoutImageValue && (
                <Col>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setLayoutImageModalOpen(true)}
                  >
                    Change
                  </Button>
                </Col>
              )}
            </Row>
          </Form.Item>
        </Col>
      </Row>

      {/* Event Gallery (multiple, max 5) */}
      <Form.Item
        name="images"
        label="Event Image Gallery (Max 5 images)"
      >
        <Row gutter={[12, 12]} align="middle">
          {/* Show existing gallery images */}
          {Array.isArray(galleryImages) && galleryImages.map((url, index) => (
            <Col key={url || index}>
              <ImagePreviewCard
                src={url}
                onRemove={() => handleRemoveGalleryImage(url)}
                width={100}
                height={100}
                label={`Gallery ${index + 1}`}
              />
            </Col>
          ))}

          {/* Add more button (only if less than 5) */}
          {(!galleryImages || galleryImages.length < 5) && (
            <Col>
              <UploadPlaceholder
                onClick={() => setGalleryModalOpen(true)}
                label={galleryImages?.length ? 'Add More' : 'Select Images'}
                size={100}
              />
            </Col>
          )}
        </Row>
      </Form.Item>

      {/* Media Gallery Picker Modals */}
      <MediaGalleryPickerModal
        open={thumbnailModalOpen}
        onCancel={() => setThumbnailModalOpen(false)}
        onSelect={handleThumbnailSelect}
        multiple={false}
        title="Select Event Thumbnail"
        value={thumbnailValue}
        dimensionValidation={{ width: 600, height: 725, strict: true }}
      />

      <MediaGalleryPickerModal
        open={instaThumbModalOpen}
        onCancel={() => setInstaThumbModalOpen(false)}
        onSelect={handleInstaThumbSelect}
        multiple={false}
        title="Select Instagram Thumbnail"
        value={instaThumbValue}
      />

      <MediaGalleryPickerModal
        open={layoutImageModalOpen}
        onCancel={() => setLayoutImageModalOpen(false)}
        onSelect={handleLayoutImageSelect}
        multiple={false}
        title="Select Layout Image"
        value={layoutImageValue}
      />

      <MediaGalleryPickerModal
        open={galleryModalOpen}
        onCancel={() => setGalleryModalOpen(false)}
        onSelect={handleGallerySelect}
        multiple={true}
        maxCount={5}
        title="Select Gallery Images (Max 5)"
        value={galleryImages}
      />
    </Space>
  );
};

export default MediaStep;

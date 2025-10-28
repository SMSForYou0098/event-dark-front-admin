import React, { useState, useRef, useEffect, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import {
  Button, Form, Card, Row, Col, Alert, Switch, Input, Upload, Image, message
} from 'antd';
import { DeleteOutlined, UploadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import MetaFields from './MetaFields';


const BlogPostEditor = ({
  initialContent = '',
  initialTitle = '',
  initialFeaturedImage = null,
  initialStatus = false,
  onSave,
  onCancel,
  isEditing = false,
  metaFields,
  setMetaFields,
}) => {
  const [content, setContent] = useState(initialContent);
  const [imagePreview, setImagePreview] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editor = useRef(null);


  useEffect(() => {
    if (isEditing) {
      setContent(initialContent);
    }
  }, [initialContent, isEditing]);


  const [formData, setFormData] = useState({
    title: initialTitle,
    featuredImageFile: initialFeaturedImage,
    previewFeaturedImage: initialFeaturedImage,
    status: initialStatus,
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleFeaturedImageChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (!file) return;


    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        featuredImageFile: file,
        previewFeaturedImage: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };


  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      featuredImageFile: null,
      previewFeaturedImage: null,
    }));
  };


  const toggleStatus = (checked) => {
    setFormData((prev) => ({ ...prev, status: checked }));
  };


  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);


    try {
      const latestContent = (content || '').trim();
      
      if (!latestContent || latestContent === '<p><br></p>' || latestContent === '<p></p>') {
        message.error('Please enter content before submitting');
        setIsSubmitting(false);
        return;
      }


      if (!formData.title || !formData.title.trim()) {
        message.error('Please enter a title before submitting');
        setIsSubmitting(false);
        return;
      }


      await onSave({
        title: formData.title,
        content: latestContent,
        thumbnail: formData.featuredImageFile,
        status: formData.status,
      });
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post. Please try again.');
      message.error('Failed to save post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // ✅ Memoize config to prevent re-renders
  const config = useMemo(() => ({
    readonly: false,
    autofocus: false,
    uploader: { insertImageAsBase64URI: true, url: '' },
    image: { edit: true, resize: true, width: '100%', height: 'auto' },
    buttons: [
      'source','|','bold','italic','underline','strikethrough','|',
      'ul','ol','|','font','fontsize','brush','paragraph','|',
      'image','video','table','link','|','align','undo','redo','|',
      'hr','eraser','fullsize','preview'
    ],
    height: 500,
  }), []);


  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: handleFeaturedImageChange,
    maxCount: 1,
    showUploadList: false,
  };


  return (
    <div className="blog-post-editor mt-4">
      <Card>
        <Row gutter={24}>
          {/* Left Column */}
          <Col xs={24} md={8}>
            <Form.Item label="Post Title" required>
              <Input
                name="title"
                placeholder="Enter post title"
                value={formData.title}
                onChange={handleChange}
                size="large"
              />
            </Form.Item>


            <Form.Item label="Featured Image">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
            </Form.Item>


            {formData.previewFeaturedImage && (
              <div className="mb-3">
                <Card
                  size="small"
                  cover={
                    <Image
                      src={formData.previewFeaturedImage}
                      alt="Featured"
                      style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                      preview={{
                        visible: imagePreview,
                        onVisibleChange: (visible) => setImagePreview(visible),
                      }}
                      onClick={() => setImagePreview(true)}
                    />
                  }
                >
                  <div className="text-center">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                    >
                      Remove Image
                    </Button>
                  </div>
                </Card>
              </div>
            )}


            <Form.Item label="Status">
              <Switch
                checked={formData.status}
                onChange={toggleStatus}
                checkedChildren="Published"
                unCheckedChildren="Draft"
              />
            </Form.Item>


            <MetaFields
              meta={metaFields}
              onChange={(key, value) =>
                setMetaFields((prev) => ({ ...prev, [key]: value }))
              }
            />
          </Col>


          {/* Right Column */}
          <Col xs={24} md={16}>
            <Form.Item label="Content" required>
              <div style={{ minHeight: '60vh' }}>
                <JoditEditor
                  ref={editor}
                  value={content}
                  config={config}
                  tabIndex={1}
                  onBlur={(newContent) => setContent(newContent)} // ✅ Only use onBlur
                  onChange={(newContent) => {}} // ✅ Leave onChange empty
                />
              </div>
            </Form.Item>
          </Col>
        </Row>


        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mt-3"
          />
        )}


        <div className="d-flex justify-content-between mt-4">
          <Button danger icon={<CloseOutlined />} onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={isSubmitting || !formData.title}
            loading={isSubmitting}
            size="large"
          >
            {isEditing ? 'Update Post' : 'Publish Post'}
          </Button>
        </div>
      </Card>
    </div>
  );
};


export default BlogPostEditor;

import { EyeOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tabs, Input, Switch, Upload, Button, Checkbox, Modal, Form, message } from 'antd';

const SiteSettings = ({ loading, form, fileUploads, setFileUploads }) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  // Convert fileUploads to Upload component format
  const getFileList = (fieldName) => {
    const file = fileUploads[fieldName];
    if (!file) return [];
    
    if (typeof file === 'string') {
      return [{
        uid: '-1',
        name: fieldName,
        status: 'done',
        url: file,
      }];
    }
    
    if (file instanceof File) {
      return [{
        uid: '-1',
        name: file.name,
        status: 'done',
        originFileObj: file,
        url: URL.createObjectURL(file),
      }];
    }
    
    return [];
  };

  // Handle preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  // Convert file to base64
  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Generic file handler
  const handleFileChange = (fieldName) => ({ fileList }) => {
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj || fileList[0];
      setFileUploads(prev => ({ ...prev, [fieldName]: file }));
    } else {
      setFileUploads(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  // Upload props for images
  const getImageUploadProps = (fieldName) => ({
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
    onChange: handleFileChange(fieldName),
    onPreview: handlePreview,
    fileList: getFileList(fieldName),
    maxCount: 1,
    listType: 'picture-card',
    accept: 'image/*',
  });

  // Upload props for PDF
  const getPdfUploadProps = (fieldName) => ({
    beforeUpload: (file) => {
      const isPdf = file.type === 'application/pdf';
      if (!isPdf) {
        message.error('You can only upload PDF files!');
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('PDF must be smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: handleFileChange(fieldName),
    fileList: getFileList(fieldName),
    maxCount: 1,
    accept: 'application/pdf',
  });

  const brandingFields = [
    { field: 'logo', label: 'Logo' },
    { field: 'authLogo', label: 'Auth Logo' },
    { field: 'mobileLogo', label: 'Mobile Logo' },
    { field: 'favicon', label: 'Favicon' }
  ];

  const tabItems = [
    {
      key: 'branding',
      label: 'Media',
      children: (
        <>
          <h4 style={{ marginBottom: '16px' }}>Branding Settings</h4>
          <Row gutter={[16, 16]}>
            {brandingFields.map(({ field, label }) => (
              <Col xs={24} sm={12} lg={6} key={field}>
                <Form.Item label={label}>
                  <Upload {...getImageUploadProps(field)}>
                    {getFileList(field).length < 1 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>
            ))}

            <Col xs={24} lg={12}>
              <Form.Item 
                label="App Name" 
                name="app_name"
                rules={[{ required: true, message: 'Please enter app name' }]}
              >
                <Input placeholder="App name" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'contact',
      label: 'Contact Info',
      children: (
        <>
          <h4 style={{ marginBottom: '16px' }}>Contact Information</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item label="WhatsApp Number" name="whatsapp_number">
                <Input type="number" placeholder="WhatsApp Number" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Missed Call Number" name="missed_call_no">
                <Input type="number" placeholder="Missed Call Number" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'features',
      label: 'Features',
      children: (
        <>
          <h4 style={{ marginBottom: '16px' }}>Feature Toggles</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item 
                label="User Notification Permission" 
                name="notify_req"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item 
                label="Complimentary User Validation" 
                name="complimentary_attendee_validation"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'homepage',
      label: 'Homepage',
      children: (
        <>
          <h4 style={{ marginBottom: '16px' }}>Homepage Settings</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item label="Home Divider Image">
                <Upload {...getImageUploadProps('homeDivider')}>
                  {getFileList('homeDivider').length < 1 && (
                    <Button icon={<UploadOutlined />} block>
                      Upload Divider Image
                    </Button>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item label="Home Divider External URL" name="home_divider_url">
                <Input placeholder="Enter external image URL" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item name="external_link" valuePropName="checked">
                <Checkbox>Use External Link</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="new_tab" valuePropName="checked">
                <Checkbox>Open in New Tab</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'agreement',
      label: 'Agreement',
      children: (
        <>
          <h4 style={{ marginBottom: '16px' }}>Agreement Settings</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item label="Agreement PDF">
                <Upload {...getPdfUploadProps('agreementPdf')}>
                  <Button icon={<UploadOutlined />} block>
                    Upload PDF
                  </Button>
                </Upload>
                {getFileList('agreementPdf').length > 0 && (
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setShowPdfModal(true)}
                    style={{ marginTop: 8 }}
                  >
                    Preview PDF
                  </Button>
                )}
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item label="E-Signature Image">
                <Upload {...getImageUploadProps('eSignature')}>
                  {getFileList('eSignature').length < 1 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload Signature</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'seo',
      label: 'SEO',
      children: (
        <>
          <h4 style={{ marginBottom: '16px' }}>SEO Settings</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item label="Meta Title" name="meta_title">
                <Input placeholder="Enter meta title" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Meta Tag" name="meta_tag">
                <Input placeholder="Enter meta tag" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Meta Description" name="meta_description">
                <Input.TextArea rows={3} placeholder="Enter meta description" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Copyright" name="copyright">
                <Input placeholder="Enter copyright text" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item label="Copyright Link" name="copyright_link">
                <Input placeholder="Enter copyright link" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    }
  ];

  return (
    <>
      <Tabs
        defaultActiveKey="branding"
        items={tabItems}
        tabPosition="top"
        style={{ width: '100%' }}
      />

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img
          alt="preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        open={showPdfModal}
        onCancel={() => setShowPdfModal(false)}
        width={800}
        footer={null}
        title="Agreement PDF Preview"
      >
        {getFileList('agreementPdf').length > 0 && (
          <iframe
            src={getFileList('agreementPdf')[0].url}
            title="Agreement Preview"
            width="100%"
            height="600px"
            style={{ border: 'none' }}
          />
        )}
      </Modal>
    </>
  );
};

export default SiteSettings;
import React, { memo, useEffect, useState, useMemo, useRef } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  Button, 
  Modal, 
  Radio, 
  message, 
  Table, 
  Space,
  Tooltip,
  Spin
} from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';
import JoditEditor from 'jodit-react';
import DOMPurify from 'dompurify';
import {
  useEmailConfig,
  useStoreEmailConfig,
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate
} from '../hooks/useSettings';

const MailSettings = memo(() => {
  const { UserData } = useMyContext();
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const editor = useRef(null);
  const [bodyContent, setBodyContent] = useState('');

  // Only essential states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editState, setEditState] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [templatePreview, setTemplatePreview] = useState('');
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });

  // Jodit Config
  const joditConfig = useMemo(() => ({
    readonly: false,
    autofocus: false,
    uploader: { insertImageAsBase64URI: true, url: '' },
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|', 'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize', 'preview'
    ],
    height: 300,
  }), []);

  // Tanstack Query Hooks
  const { data: emailConfig, isLoading: isLoadingConfig } = useEmailConfig();
  const { data: templates = [], isLoading: isLoadingTemplates, refetch: refetchTemplates } = useEmailTemplates(UserData?.id);

  const { mutate: storeEmailConfig, isPending: isSavingConfig } = useStoreEmailConfig({
    onSuccess: (res) => {
      message.success(res?.message || 'Email Configuration Stored Successfully');
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to store mail configuration');
    }
  });

  const { mutate: createTemplate, isPending: isCreatingTemplate } = useCreateEmailTemplate({
    onSuccess: (res) => {
      message.success(res?.message || 'Template created successfully');
      handleTemplateModalClose();
      refetchTemplates();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to create template');
    }
  });

  const { mutate: updateTemplate, isPending: isUpdatingTemplate } = useUpdateEmailTemplate({
    onSuccess: (res) => {
      message.success(res?.message || 'Template updated successfully');
      handleTemplateModalClose();
      refetchTemplates();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to update template');
    }
  });

  const { mutate: deleteTemplate, isPending: isDeletingTemplate } = useDeleteEmailTemplate({
    onSuccess: (res) => {
      message.success(res?.message || 'Template deleted successfully');
      cancelDeleteModal();
      refetchTemplates();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to delete template');
    }
  });

  // Set form values when email config is loaded
  useEffect(() => {
    if (emailConfig) {
      form.setFieldsValue({
        mail_host: emailConfig?.mail_host || '',
        mail_port: emailConfig?.mail_port || '',
        mail_username: emailConfig?.mail_username || '',
        mail_password: emailConfig?.mail_password || '',
        mail_encryption: emailConfig?.mail_encryption || 'ssl',
        mail_from_address: emailConfig?.mail_from_address || '',
        mail_from_name: emailConfig?.mail_from_name || '',
      });
    }
  }, [emailConfig, form]);

  // Handle Mail Configuration Submit
  const HandleMailConfig = async () => {
    try {
      const values = await form.validateFields();
      storeEmailConfig({
        mail_driver: 'smtp',
        ...values,
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Handle Template Modal
  const handleTemplateModalClose = () => {
    setShowTemplateModal(false);
    setEditState(false);
    setTemplateId('');
    setBodyContent('');
    templateForm.resetFields();
  };

  const handleTemplateModalShow = () => {
    setShowTemplateModal(true);
  };

  // Handle Template Submit
  const HandleTemplateSubmit = async () => {
    try {
      const values = await templateForm.validateFields();
      
      if (!bodyContent || bodyContent.trim() === '' || bodyContent === '<p><br></p>') {
        message.error('Please enter body content');
        return;
      }

      const payload = {
        user_id: UserData?.id,
        template_name: values.template_name,
        subject: values.subject,
        body: bodyContent,
      };

      if (editState) {
        payload.id = templateId;
        updateTemplate(payload);
      } else {
        createTemplate(payload);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Handle Edit Template
  const handleEdit = (record) => {
    setEditState(true);
    setTemplateId(record?.id);
    setBodyContent(record?.body || '');
    templateForm.setFieldsValue({
      template_name: record?.template_id,
      subject: record?.subject,
    });
    setShowTemplateModal(true);
  };

  // Handle Preview
  const HandlePreview = (record) => {
    try {
      const sanitizedHTML = DOMPurify.sanitize(record.body);
      setTemplatePreview(sanitizedHTML);
      setShowPreviewModal(true);
    } catch (err) {
      message.error('Failed to load preview');
    }
  };

  // Handle Delete Modal
  const showDeleteModal = (id) => {
    setDeleteModal({ visible: true, id });
  };

  const cancelDeleteModal = () => {
    setDeleteModal({ visible: false, id: null });
  };

  const confirmDelete = () => {
    deleteTemplate(deleteModal.id);
  };

  // Table Columns
  const columns = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: 'Name',
        dataIndex: 'template_id',
        key: 'template_id',
        sorter: (a, b) => a.template_id.localeCompare(b.template_id),
      },
      {
        title: 'Subject',
        dataIndex: 'subject',
        key: 'subject',
        sorter: (a, b) => a.subject.localeCompare(b.subject),
      },
      {
        title: 'Body',
        dataIndex: 'body',
        key: 'body',
        render: (body) => {
          // Strip HTML tags for display
          const text = body?.replace(/<[^>]*>/g, '');
          return <span>{text?.length > 50 ? text.substring(0, 50) + '...' : text}</span>;
        },
      },
      {
        title: 'Action',
        key: 'action',
        width: 150,
        align: 'center',
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Edit">
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Tooltip title="View">
              <Button
                type="default"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => HandlePreview(record)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => showDeleteModal(record.id)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    []
  );

  if (isLoadingConfig) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading email configuration..." />
      </div>
    );
  }

  const isTemplateLoading = isCreatingTemplate || isUpdatingTemplate;

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Are you sure?"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={cancelDeleteModal}
        okText="Yes, delete it!"
        cancelText="Cancel"
        confirmLoading={isDeletingTemplate}
        centered
        okButtonProps={{ danger: true }}
      >
        <p>You won't be able to revert this!</p>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Template Preview"
        open={showPreviewModal}
        onCancel={() => setShowPreviewModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <div
          dangerouslySetInnerHTML={{ __html: templatePreview }}
          style={{ maxHeight: '500px', overflowY: 'auto', padding: '16px' }}
        />
      </Modal>

      {/* Template Modal */}
      <Modal
        title={`${editState ? 'Update' : 'Add New'} Template`}
        open={showTemplateModal}
        onCancel={handleTemplateModalClose}
        footer={[
          <Button key="cancel" onClick={handleTemplateModalClose}>
            Discard Changes
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={isTemplateLoading} 
            onClick={HandleTemplateSubmit}
          >
            {isTemplateLoading 
              ? editState 
                ? 'Updating...' 
                : 'Saving...'
              : 'Save'}
          </Button>,
        ]}
        width={1000}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            label="Template Name"
            name="template_name"
            rules={[
              { required: true, message: 'Please enter template name' },
              { min: 3, message: 'Template name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>
          <Form.Item
            label="Subject"
            name="subject"
            rules={[
              { required: true, message: 'Please enter subject' },
              { min: 3, message: 'Subject must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter subject" />
          </Form.Item>
          <Form.Item
            label="Body"
            required
          >
            <JoditEditor
              ref={editor}
              value={bodyContent}
              config={joditConfig}
              tabIndex={1}
              onBlur={(newContent) => setBodyContent(newContent)}
              onChange={() => {}}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        {/* Mail Configuration */}
        <Col xs={24} lg={10}>
          <Card title="Mail Configuration">
            <Form form={form} layout="vertical" initialValues={{ mail_encryption: 'ssl' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Mailer">
                    <Input value="SMTP" disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail Host"
                    name="mail_host"
                    rules={[{ required: true, message: 'Please enter mail host' }]}
                  >
                    <Input placeholder="smtp.example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail Port"
                    name="mail_port"
                    rules={[
                      { required: true, message: 'Please enter mail port' },
                      { pattern: /^\d+$/, message: 'Port must be a number' }
                    ]}
                  >
                    <Input placeholder="587" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail Username"
                    name="mail_username"
                    rules={[{ required: true, message: 'Please enter mail username' }]}
                  >
                    <Input placeholder="username@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail Password"
                    name="mail_password"
                    rules={[{ required: true, message: 'Please enter mail password' }]}
                  >
                    <Input.Password placeholder="Enter password" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail From Name"
                    name="mail_from_name"
                    rules={[{ required: true, message: 'Please enter from name' }]}
                  >
                    <Input placeholder="Your Company" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail From Email"
                    name="mail_from_address"
                    rules={[
                      { required: true, message: 'Please enter from email' },
                      { type: 'email', message: 'Please enter valid email' },
                    ]}
                  >
                    <Input placeholder="noreply@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mail Encryption"
                    name="mail_encryption"
                    rules={[{ required: true, message: 'Please select encryption' }]}
                  >
                    <Radio.Group>
                      <Radio value="ssl">SSL</Radio>
                      <Radio value="tls">TLS</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      type="primary" 
                      loading={isSavingConfig} 
                      onClick={HandleMailConfig}
                    >
                      {isSavingConfig ? 'Saving...' : 'Submit'}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* Mail Templates */}
        <Col xs={24} lg={14}>
          <Card
            title="Mail Templates"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleTemplateModalShow}>
                New Template
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={templates}
              rowKey="id"
              loading={isLoadingTemplates}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} templates`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>



        </Row>    </>
  );
}
);
MailSettings.displayName = 'MailSettings';
export default MailSettings;

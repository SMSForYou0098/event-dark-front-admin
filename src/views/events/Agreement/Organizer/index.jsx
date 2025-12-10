import React, { useState, useRef, useMemo, useCallback } from 'react';
import JoditEditor from 'jodit-react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  Space,
  Popconfirm,
  Spin,
  Switch,
  Row,
  Col,
  message,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  useGetAllOrganizerAgreements,
  useCreateOrganizerAgreement,
  useUpdateOrganizerAgreement,
  useDeleteOrganizerAgreement,
} from './useOrganizerAgreement';
import SignatureInput, { SIGNATURE_FONTS } from '../../../../components/shared-components/SignatureInput';
import { joditConfig } from 'utils/consts';

const OrganizerAgreement = () => {
  // ========================= STATE =========================
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [content, setContent] = useState('');

  // Signature states
  const [signatureType, setSignatureType] = useState('type');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null); // For image preview

  const [form] = Form.useForm();
  const editor = useRef(null);
  const canvasRef = useRef(null);

  // ========================= TANSTACK QUERY HOOKS =========================
  const { data: agreements = [], isLoading } = useGetAllOrganizerAgreements();

  const createMutation = useCreateOrganizerAgreement({
    onSuccess: () => handleModalClose(),
  });

  const updateMutation = useUpdateOrganizerAgreement({
    onSuccess: () => handleModalClose(),
  });

  const deleteMutation = useDeleteOrganizerAgreement();

  // ========================= MODAL HANDLERS =========================
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditRecord(null);
    setContent('');
    setSignatureType('type');
    setTypedSignature('');
    setUploadedSignature(null);
    setSignaturePreview(null);
    setSelectedFont(SIGNATURE_FONTS[0]);
    clearCanvas();
    form.resetFields();
  }, [form]);

  const handleModalOpen = useCallback(() => {
    form.resetFields();
    setEditRecord(null);
    setContent('');
    setSignatureType('type');
    setTypedSignature('');
    setUploadedSignature(null);
    setSignaturePreview(null);
    setSelectedFont(SIGNATURE_FONTS[0]);
    setModalVisible(true);
  }, [form]);

  // ========================= SIGNATURE HANDLERS =========================
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureData = useCallback(async () => {
    if (signatureType === 'draw' && canvasRef.current) {
      return canvasRef.current.toDataURL();
    } else if (signatureType === 'type' && typedSignature) {
      return { text: typedSignature, font: selectedFont.name, fontStyle: selectedFont.style };
    } else if (signatureType === 'upload' && uploadedSignature) {
      // Return the actual file object for FormData
      return uploadedSignature;
    }
    return null;
  }, [signatureType, typedSignature, selectedFont, uploadedSignature]);

  // ========================= FORM SUBMIT =========================
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (!content || content.trim() === '' || content === '<p><br></p>') {
        message.error('Please enter content');
        return;
      }

      // Get signature data
      const signatureData = await getSignatureData();

      // Use FormData instead of JSON payload
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', content);
      formData.append('status', values.status ? 1 : 0);
      formData.append('signature_type', signatureType);

      // Add signature based on type
      if (signatureType === 'type' && signatureData) {
        formData.append('signature_text', signatureData.text);
        formData.append('signature_font', signatureData.font);
        formData.append('signature_font_style', signatureData.fontStyle);
      } else if ((signatureType === 'draw' || signatureType === 'upload') && signatureData) {
        formData.append('signature_image', signatureData);
      }

      if (editRecord) {
        updateMutation.mutate({ id: editRecord.id, payload: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (err) {
      // Form validation error - handled by antd
    }
  }, [form, content, editRecord, createMutation, updateMutation, signatureType, getSignatureData]);

  // ========================= DELETE =========================
  const handleDelete = useCallback(
    (id) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  // ========================= EDIT =========================
  const handleEdit = useCallback(
    (record) => {
      setEditRecord(record);
      setContent(record.content || '');
      form.setFieldsValue({
        title: record.title,
        status: record.status === 1 || record.status === true,
      });

      // Load signature data if available
      if (record.signature_type) {
        setSignatureType(record.signature_type);
        if (record.signature_type === 'type' && record.signature_text) {
          setTypedSignature(record.signature_text);
          const font = SIGNATURE_FONTS.find(f => f.name === record.signature_font);
          if (font) setSelectedFont(font);
        } else if (record.signature_type === 'upload' && record.signature_image) {
          // For existing records, signature_image is a URL - use it as preview
          setSignaturePreview(record.signature_image);
          setUploadedSignature(null); // No file object yet, user can re-upload if needed
        } else if (record.signature_type === 'draw' && record.signature_image) {
          // Load drawn signature onto canvas after modal opens
          setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas && record.signature_image) {
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = record.signature_image;
            }
          }, 100);
        }
      }

      setModalVisible(true);
    },
    [form]
  );

  // ========================= TABLE COLUMNS =========================
  const columns = useMemo(
    () => [
      {
        title: '#',
        render: (_, __, i) => i + 1,
        width: 60,
      },
      {
        title: 'Title',
        dataIndex: 'title',
        sorter: (a, b) => a.title.localeCompare(b.title),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        align: 'center',
        width: 100,
        render: (val) =>
          val === 1 || val === true ? (
            <CheckOutlined style={{ color: 'green' }} />
          ) : (
            <CloseOutlined style={{ color: 'red' }} />
          ),
      },
      {
        title: 'Action',
        align: 'center',
        width: 120,
        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
            <Popconfirm
              title="Delete this agreement?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete]
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ========================= RENDER =========================
  return (
    <Card
      bordered={false}
      title="Organizer Agreements"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleModalOpen}
        >
          Add New Agreement
        </Button>
      }
    >
      <Spin spinning={isLoading}>
        <Table
          rowKey="id"
          dataSource={agreements}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        open={modalVisible}
        title={editRecord ? 'Edit Agreement' : 'New Agreement'}
        onCancel={handleModalClose}
        onOk={handleSubmit}
        okText="Save"
        width={1000}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: 'Title is required' }]}
              >
                <Input placeholder="Enter agreement title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Content"
            required
          >
            <JoditEditor
              ref={editor}
              value={content}
              config={joditConfig}
              tabIndex={1}
              onBlur={(newContent) => setContent(newContent)}
              onChange={() => {}}
            />
          </Form.Item>

          {/* Signature Section */}
          <Form.Item label="Admin Signature">
            <SignatureInput
              signatureType={signatureType}
              onSignatureTypeChange={setSignatureType}
              selectedFont={selectedFont}
              onFontChange={setSelectedFont}
              typedSignature={typedSignature}
              onTypedSignatureChange={setTypedSignature}
              uploadedSignature={uploadedSignature}
              onUploadedSignatureChange={setUploadedSignature}
              signaturePreview={signaturePreview}
              onSignaturePreviewChange={setSignaturePreview}
              canvasRef={canvasRef}
              onClearCanvas={clearCanvas}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default OrganizerAgreement;

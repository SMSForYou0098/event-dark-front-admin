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
  Tabs,
  Select,
  Upload,
  Typography,
  message,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined, UploadOutlined, FontSizeOutlined } from '@ant-design/icons';
import {
  useGetAllOrganizerAgreements,
  useCreateOrganizerAgreement,
  useUpdateOrganizerAgreement,
  useDeleteOrganizerAgreement,
} from './useOrganizerAgreement';

const { Text } = Typography;
const { Option } = Select;

const SIGNATURE_FONTS = [
  { name: 'Brush Script', style: 'Brush Script MT, cursive' },
  { name: 'Lucida Handwriting', style: 'Lucida Handwriting, cursive' },
  { name: 'Snell Roundhand', style: 'Snell Roundhand, cursive' },
  { name: 'Zapfino', style: 'Zapfino, cursive' },
  { name: 'Edwardian Script', style: 'Edwardian Script ITC, cursive' }
];

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
  const [isDrawing, setIsDrawing] = useState(false);

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

  // ========================= JODIT CONFIG =========================
  const joditConfig = useMemo(() => ({
    readonly: false,
    autofocus: false,
    uploader: { insertImageAsBase64URI: true, url: '' },
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|', 'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize', 'preview'
    ],
    height: 400,
  }), []);

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
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleImageUpload = (info) => {
    // File is already handled in beforeUpload
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files allowed!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    // Store the actual file object for FormData
    setUploadedSignature(file);
    // Create preview URL
    setSignaturePreview(URL.createObjectURL(file));
    return false; // Prevent auto upload
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
            <Tabs activeKey={signatureType} onChange={setSignatureType}>
              <Tabs.TabPane tab={<><EditOutlined /> Draw Signature</>} key="draw">
                <div className="text-center">
                  <div className="d-inline-block">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="border border-2 rounded"
                      style={{ cursor: 'crosshair', touchAction: 'none', maxWidth: '100%', background: 'white' }}
                    />
                  </div>
                  <div className="mt-3">
                    <Button onClick={clearCanvas} danger>Clear Signature</Button>
                  </div>
                  <Text type="secondary" className="d-block mt-2">
                    Draw your signature using mouse/touchpad
                  </Text>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab={<><FontSizeOutlined /> Type Signature</>} key="type">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Select Font Style">
                      <Select
                        value={selectedFont.name}
                        onChange={(val) => setSelectedFont(SIGNATURE_FONTS.find(f => f.name === val))}
                      >
                        {SIGNATURE_FONTS.map(font => (
                          <Option key={font.name} value={font.name}>
                            <span style={{ fontFamily: font.style, fontSize: '20px' }}>{font.name}</span>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Type Your Signature">
                      <Input
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={50}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <div className="border border-2 rounded p-4 text-center" style={{ background: 'white' }}>
                      <Text type="secondary" className="d-block mb-3">Signature Preview:</Text>
                      {typedSignature ? (
                        <div style={{ fontFamily: selectedFont.style, fontSize: '32px', color: '#000' }}>
                          {typedSignature}
                        </div>
                      ) : (
                        <Text type="secondary">Type your name above to preview</Text>
                      )}
                    </div>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane tab={<><UploadOutlined /> Upload Signature</>} key="upload">
                <div className="text-center">
                  <Upload
                    accept="image/jpeg,image/png,image/jpg"
                    beforeUpload={beforeUpload}
                    onChange={handleImageUpload}
                    showUploadList={false}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />} type="dashed">
                      Click to Upload Signature
                    </Button>
                  </Upload>
                  <div className="mt-3">
                    <Text type="secondary" className="d-block">
                      <strong>Accepted formats:</strong> JPG, PNG (Max 2MB)
                    </Text>
                    <Text type="secondary" className="d-block">
                      <strong>Recommended:</strong> White background, 600×200px
                    </Text>
                  </div>
                  {signaturePreview && (
                    <div className="border border-2 rounded p-3 mt-4 d-inline-block bg-white">
                      <Text strong className="d-block mb-2">Uploaded Signature:</Text>
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="img-fluid"
                        style={{ maxHeight: '150px', maxWidth: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </Tabs.TabPane>
            </Tabs>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default OrganizerAgreement;

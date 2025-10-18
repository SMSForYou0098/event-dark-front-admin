import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Modal,
  Badge,
  Select,
  Space,
  Table,
  Tooltip,
  message,
  Spin,
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useMyContext } from '../../../../Context/MyContextProvider';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SytemVariables from './SytemVariables';
import {
  useWhatsAppConfig,
  useStoreWhatsAppConfig,
  useWhatsAppApis,
  useStoreWhatsAppApi,
  useUpdateWhatsAppApi,
  useDeleteWhatsAppApi
} from '../hooks/useSettings';

const { TextArea } = Input;
const { Option } = Select;

const WhatsAppConfig = () => {
  const { UserData, showLoading, SystemVars, api, authToken } = useMyContext();
  const [form] = Form.useForm();
  const [previewForm] = Form.useForm();
  const [templateForm] = Form.useForm();

  // Template States
  const [customShow, setCustomShow] = useState(false);
  const [badges, setBadges] = useState([]);

  // Modal States
  const [show, setShow] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editState, setEditState] = useState(false);
  const [editID, setEditID] = useState('');
  const [previewData, setPreviewData] = useState();
  const [dynamicFields, setDynamicFields] = useState({});
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });

  // Tanstack Query Hooks
  const { data: configData, isLoading: isLoadingConfig } = useWhatsAppConfig(UserData?.id);
  const { data: apisData = [], isLoading: isLoadingApis, refetch: refetchApis } = useWhatsAppApis(UserData?.id);

  const { mutate: storeConfig, isPending: isSavingConfig } = useStoreWhatsAppConfig({
    onSuccess: (res) => {
      message.success(res?.message || 'Configuration saved successfully');
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to save configuration');
    }
  });

  const { mutate: storeApi, isPending: isCreatingApi } = useStoreWhatsAppApi({
    onSuccess: (res) => {
      message.success(res?.message || 'Configuration created successfully');
      handleClose();
      refetchApis();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to create configuration');
    }
  });

  const { mutate: updateApi, isPending: isUpdatingApi } = useUpdateWhatsAppApi({
    onSuccess: (res) => {
      message.success(res?.message || 'Configuration updated successfully');
      handleClose();
      refetchApis();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to update configuration');
    }
  });

  const { mutate: deleteApi, isPending: isDeletingApi } = useDeleteWhatsAppApi({
    onSuccess: (res) => {
      message.success(res?.message || 'Deleted successfully');
      cancelDeleteModal();
      refetchApis();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to delete');
    }
  });

  // Set form values when config data is loaded
  useEffect(() => {
    if (configData) {
      form.setFieldsValue({
        api_key: configData?.api_key || '',
      });
    }
  }, [configData, form]);

  // System Variables Options
  const options = useMemo(() => SystemVars.map((item) => ({
    value: item.key,
    label: `${item.value} : (${item.key})`,
  })), [SystemVars]);

  // Handle Config Submit
  const HandleConfig = async () => {
    try {
      const values = await form.validateFields();
      storeConfig({
        user_id: UserData?.id,
        ...values
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Badge Movement for Drag & Drop
  const moveBadge = (draggedIndex, hoveredIndex) => {
    const updatedBadges = [...badges];
    const draggedBadge = updatedBadges[draggedIndex];
    updatedBadges.splice(draggedIndex, 1);
    updatedBadges.splice(hoveredIndex, 0, draggedBadge);
    setBadges(updatedBadges);
  };

  // Badge Item Component with Drag & Drop
  const BadgeItem = ({ badge, index }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'BADGE',
      item: { type: 'BADGE', index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'BADGE',
      hover: (draggedItem) => {
        if (draggedItem.index !== index) {
          moveBadge(draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    });

    return (
      <Tag
        ref={(node) => drag(drop(node))}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 4,
          padding: '4px 8px',
          margin: 4,
          cursor: 'move',
          opacity: isDragging ? 0.5 : 1,
          userSelect: 'none',
        }}
      >
        <Badge count={index + 1} className='bg-primary rounded-circle mr-2' />
        <span style={{ marginRight: 8 }}>{badge}</span>
        <CloseOutlined
          style={{ fontSize: 12, cursor: 'pointer', color: '#ff4d4f' }}
          onClick={(e) => {
            e.stopPropagation();
            setBadges((prev) => prev.filter((_, i) => i !== index));
          }}
        />
      </Tag>
    );
  };

  // Handle Select Change
  const handleSelectChange = (value) => {
    if (value && !badges.includes(value)) {
      setBadges((prev) => [...prev, value]);
    }
  };

  // Handle Edit
  const handleEdit = (record) => {
    setEditState(true);
    setEditID(record?.id);
    const vars = record?.variables ? record?.variables : [];
    setBadges(vars);
    setCustomShow(record?.custom === 1);

    templateForm.setFieldsValue({
      title: record?.title,
      template_name: record?.template_name,
      url: record?.url || '',
    });

    setShow(true);
  };

  // Handle Close Modal
  const handleClose = () => {
    setCustomShow(false);
    setBadges([]);
    setEditState(false);
    setEditID('');
    setShow(false);
    templateForm.resetFields();
  };

  // Handle Close Preview
  const handleClosePreview = () => {
    setPreviewData();
    setShowPreview(false);
    setDynamicFields({});
    previewForm.resetFields();
  };

  // Handle Submit
  const HandleSubmit = async () => {
    try {
      const values = await templateForm.validateFields();

      const payload = {
        user_id: UserData?.id,
        title: values.title,
        template_name: values.template_name,
        custom: customShow ? 1 : 0,
        url: values.url || '',
        variables: badges,
      };

      if (editState) {
        updateApi({ id: editID, payload });
      } else {
        storeApi(payload);
      }
    } catch (error) {
      console.error('Validation failed:', error);
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
    deleteApi(deleteModal.id);
  };

  // Handle Show Preview
  const HandleShowPreview = (record) => {
    setBadges(record?.variables || []);
    setPreviewData(record);
    setShowPreview(true);
  };

  // Generate Preview
  const GenratePreview = () => {
    if (!previewData) return '';

    const isCustom = previewData?.custom === 1;
    if (isCustom) {
      return previewData?.url;
    } else {
      const apiKey = configData?.api_key || '';
      const number = previewForm.getFieldValue('number') || ':NUMBER';
      const validNumber = validateNumber(number);

      const api = `https://waba.smsforyou.biz/api/send-messages?apikey=*${apiKey}*&to=*${validNumber || ':NUMBER'
        }*&type=T&tname=*${previewData?.template_name}*&values=*${badges?.join(
          ','
        )}*&media_url=:IMAGE`;
      return boldifyText(api);
    }
  };

  // Validate Number
  const validateNumber = (number) => {
    const regex = /^\d{10,12}$/;
    return regex.test(number) ? number : '';
  };

  // Boldify Text
  const boldifyText = (text) => {
    const regex = /\*(.*?)\*/g;
    return text.replace(regex, (match, p1) => `<b>${p1}</b>`);
  };

  // Handle Send Message
  const HandleSendMessage = async () => {
    try {
      const values = await previewForm.validateFields();
      const number = values.number;

      if (!validateNumber(number)) {
        message.error('Please enter a valid mobile number (10 or 12 digits).');
        return;
      }

      if (previewData?.custom !== 1 && badges?.length > 0) {
        for (const item of badges) {
          if (!dynamicFields[item]) {
            message.error(`Please enter a value for ${getByLabelText(item)}.`);
            return;
          }
        }
      }

      const fieldValues = Object.values(dynamicFields);
      const image = `https://smsforyou.biz/wp-content/uploads/2023/10/smsforyou.png`;
      const apiUrl = `https://waba.smsforyou.biz/api/send-messages?apikey=${configData?.api_key}&to=${number}&type=T&tname=${previewData?.template_name
        }&values=${fieldValues?.join(',')}&media_url=${image}`;

      const loader = showLoading('Sending Message');
      try {
        await axios.post(apiUrl);
        loader.close();
        message.success('Message sent successfully');
        handleClosePreview();
      } catch (error) {
        loader.close();
        message.error('Error sending message');
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Get Label Text
  const getByLabelText = (key) => {
    const value = SystemVars?.find((tt) => tt?.key === key);
    return value?.value;
  };

  const formattedApi = GenratePreview();

  // Table Columns
  const columns = useMemo(() => [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Template',
      dataIndex: 'template_name',
      key: 'template_name',
      sorter: (a, b) => a.template_name.localeCompare(b.template_name),
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
              onClick={() => HandleShowPreview(record)}
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
  ], []);

  if (isLoadingConfig) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading WhatsApp configuration..." />
      </div>
    );
  }

  const isTemplateLoading = isCreatingApi || isUpdatingApi;

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Are you sure?"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={cancelDeleteModal}
        okText="Yes, delete it!"
        cancelText="Cancel"
        confirmLoading={isDeletingApi}
        centered
        okButtonProps={{ danger: true }}
      >
        <p>You won't be able to revert this!</p>
      </Modal>

      {/* Template Modal */}
      <Modal
        title={`${editState ? 'Update' : 'Add New'} Configuration`}
        open={show}
        onCancel={handleClose}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            Close
          </Button>,
          <Button key="submit" type="primary" loading={isTemplateLoading} onClick={HandleSubmit}>
            {isTemplateLoading ? (editState ? 'Updating...' : 'Saving...') : 'Save'}
          </Button>,
        ]}
        width={800}
      >
        <Form form={templateForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Form.Item label="Custom" style={{ marginBottom: 16 }}>
                  <Button
                    type={customShow ? 'primary' : 'default'}
                    onClick={() => setCustomShow(!customShow)}
                  >
                    {customShow ? 'Custom Enabled' : 'Enable Custom'}
                  </Button>
                </Form.Item>
              </div>
            </Col>
            {!editState && (
              <Col xs={24} md={12}>
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[
                    { required: true, message: 'Please enter title' },
                    { min: 3, message: 'Title must be at least 3 characters' }
                  ]}
                >
                  <Input placeholder="Enter Title" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={editState ? 24 : 12}>
              <Form.Item
                label="Template Name"
                name="template_name"
                rules={[
                  { required: true, message: 'Please enter template name' },
                  { min: 3, message: 'Template name must be at least 3 characters' }
                ]}
              >
                <Input placeholder="Enter template name" />
              </Form.Item>
            </Col>
            {customShow ? (
              <>
                <Col xs={24}>
                  <Form.Item
                    label="Custom API"
                    name="url"
                    rules={[
                      { required: true, message: 'Please enter custom API' },
                      { pattern: /^https?:\/\/.+/, message: 'Please enter a valid URL' }
                    ]}
                  >
                    <TextArea rows={4} placeholder="Enter custom API URL" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    <strong>Note:</strong> Use system variables for dynamic content
                  </div>
                </Col>
              </>
            ) : (
              <Col xs={24}>
                <Form.Item label="Variables">
                  <div
                  className='border-secondary rounded-5'
                    style={{
                      padding: badges?.length > 0 ? '8px' : '0',
                    }}
                  >
                    {badges?.map((badge, index) => (
                      <BadgeItem key={index} badge={badge} index={index} />
                    ))}
                    <Select
                      style={{ width: '100%', marginTop: badges?.length > 0 ? 8 : 0 }}
                      placeholder="Type or select variable"
                      showSearch
                      allowClear
                      onChange={handleSelectChange}
                      value={null}
                    >
                      {options.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="API Preview"
        open={showPreview}
        onCancel={handleClosePreview}
        footer={[
          <Button key="send" type="primary" onClick={HandleSendMessage}>
            Send Message
          </Button>,
        ]}
        width={800}
      >
        <Form form={previewForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item label="Preview">
                <Tag>
                  <div
                    dangerouslySetInnerHTML={{ __html: formattedApi }}
                    style={{
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflowY: 'auto',
                    }}
                  />
                </Tag>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <h5>Demo Test</h5>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Mobile Number"
                name="number"
                rules={[
                  { required: true, message: 'Please enter mobile number' },
                  {
                    pattern: /^\d{10,12}$/,
                    message: 'Mobile number must be 10-12 digits',
                  },
                ]}
              >
                <Input placeholder="Enter Number" />
              </Form.Item>
            </Col>
            {previewData?.custom !== 1 &&
              badges?.length > 0 &&
              badges?.map((item, i) => (
                <Col xs={24} md={12} key={i}>
                  <Form.Item
                    label={`Enter ${getByLabelText(item)}`}
                    name={`field_${i}`}
                    rules={[
                      {
                        required: true,
                        message: `Please enter ${getByLabelText(item)}`,
                      },
                    ]}
                  >
                    <Input
                      placeholder={`Enter ${getByLabelText(item)}`}
                      onChange={(e) =>
                        setDynamicFields((prev) => ({ ...prev, [item]: e.target.value }))
                      }
                    />
                  </Form.Item>
                </Col>
              ))}
          </Row>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            {/* WhatsApp Config Settings */}
            <Col xs={24}>
              <Card title="WhatsApp Config Settings">
                <Form form={form} layout="vertical">
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Form.Item
                        label="API Key"
                        name="api_key"
                        rules={[
                          { required: true, message: 'Please enter API key' },
                          { min: 10, message: 'API key must be at least 10 characters' }
                        ]}
                      >
                        <Input placeholder="Enter API Key" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" loading={isSavingConfig} onClick={HandleConfig}>
                          {isSavingConfig ? 'Saving...' : 'Submit'}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>

            {/* System Variables */}
            <Col xs={24}>
              <SytemVariables />
            </Col>
          </Row>
        </Col>

        {/* Right Column - WhatsApp Configs Table */}
        <Col xs={24} lg={12}>
          <Card
            title="WhatsApp Configs"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShow(true)}>
                New Config
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={apisData}
              rowKey="id"
              loading={isLoadingApis}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} configs`,
              }}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </DndProvider>
  );
};

export default WhatsAppConfig;
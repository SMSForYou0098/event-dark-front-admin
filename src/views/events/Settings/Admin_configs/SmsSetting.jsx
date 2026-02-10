import React, { useEffect, useState, useMemo } from 'react';
import DataTable from '../../common/DataTable';
import {
    Card,
    Row,
    Col,
    Form,
    Input,
    Button,
    Radio,
    Table,
    Space,
    Tooltip,
    message,
    Switch,
    Alert,
    Modal,
    Spin
} from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';
import SytemVariables from './SytemVariables';
import {
    useSMSConfig,
    useStoreSMSConfig,
    useCreateSMSTemplate,
    useUpdateSMSTemplate,
    useDeleteSMSTemplate
} from '../hooks/useSettings';

const { TextArea } = Input;

const SmsSetting = () => {
    const { UserData } = useMyContext();
    const [form] = Form.useForm();
    const [templateForm] = Form.useForm();

    // Only essential states
    const [customShow, setCustomShow] = useState(false);
    const [editId, setEditId] = useState('');
    const [editState, setEditState] = useState(false);
    const [status, setStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
    const [searchText, setSearchText] = useState('');

    // Tanstack Query Hooks
    const { data: smsData, isLoading: isLoadingSMS, refetch } = useSMSConfig(UserData?.id);

    const { mutate: storeSMSConfig, isPending: isSavingConfig } = useStoreSMSConfig({
        onSuccess: (res) => {
            message.success(res?.message || 'Configuration saved successfully');
            refetch();
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to save configuration');
        }
    });

    const { mutate: createTemplate, isPending: isCreatingTemplate } = useCreateSMSTemplate({
        onSuccess: (res) => {
            message.success(res?.message || 'Template created successfully');
            templateForm.resetFields();
            refetch();
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to create template');
        }
    });

    const { mutate: updateTemplate, isPending: isUpdatingTemplate } = useUpdateSMSTemplate({
        onSuccess: (res) => {
            message.success(res?.message || 'Template updated successfully');
            setEditState(false);
            setEditId('');
            templateForm.resetFields();
            refetch();
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to update template');
        }
    });

    const { mutate: deleteTemplate, isPending: isDeletingTemplate } = useDeleteSMSTemplate({
        onSuccess: (res) => {
            message.success(res?.message || 'Template deleted successfully');
            cancelDeleteModal();
            refetch();
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to delete template');
        }
    });

    // Set form values when data is loaded
    useEffect(() => {
        if (smsData) {
            form.setFieldsValue({
                api_key: smsData.config?.api_key || '',
                sender_id: smsData.config?.sender_id || '',
                custom_url: smsData.custom?.url || '',
            });
            setStatus(smsData.config?.status === '1');
        }
    }, [smsData, form]);

    const HandleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const payload = {
                user_id: UserData?.id,
                status: status
            };

            if (customShow) {
                payload.url = values.custom_url.trim();
                payload.sms = 'custom';
            } else {
                payload.api_key = values.api_key.trim();
                payload.sender_id = values.sender_id.trim();
                payload.sms = 'default';
            }

            storeSMSConfig({
                userId: UserData?.id,
                isCustom: customShow,
                payload
            });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const SubmitTemplate = async () => {
        try {
            const values = await templateForm.validateFields();

            const payload = {
                user_id: UserData?.id,
                template_name: values.template_name.trim(),
                template_id: values.template_id.trim(),
                content: values.content.trim(),
            };

            if (editState) {
                updateTemplate({ id: editId, payload });
            } else {
                createTemplate({ userId: UserData?.id, payload });
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleEdit = (record) => {
        setEditState(true);
        setEditId(record?.id);
        templateForm.setFieldsValue({
            template_name: record?.template_name,
            template_id: record?.template_id,
            content: record?.content,
        });
    };

    const showDeleteModal = (id) => {
        setDeleteModal({ visible: true, id });
    };

    const cancelDeleteModal = () => {
        setDeleteModal({ visible: false, id: null });
    };

    const confirmDelete = () => {
        deleteTemplate(deleteModal.id);
    };

    const cancelEdit = () => {
        setEditState(false);
        setEditId('');
        templateForm.resetFields();
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
                dataIndex: 'template_name',
                key: 'template_name',
                sorter: (a, b) => a.template_name.localeCompare(b.template_name),
                searchable: true,
            },
            {
                title: 'Content',
                dataIndex: 'content',
                key: 'content',
                render: (content) => (
                    <span>{content?.length > 50 ? content.substring(0, 50) + '...' : content}</span>
                ),
            },
            {
                title: 'Action',
                key: 'action',
                width: 120,
                align: 'left',
                render: (_, record) => (
                    <Space size="small">
                        <Tooltip title="Edit">
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
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

    if (isLoadingSMS) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" tip="Loading SMS configuration..." />
            </div>
        );
    }

    const templates = smsData?.templates || [];
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

            <Row gutter={[16, 16]}>
                {/* Left Column */}
                <Col xs={24} lg={12}>
                    <Row gutter={[16, 16]}>
                        {/* SMS Settings */}
                        <Col xs={24}>
                            <Card
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>SMS Settings</span>
                                        <Space>
                                            <span>Custom</span>
                                            <Switch checked={customShow} onChange={(checked) => setCustomShow(checked)} />
                                        </Space>
                                    </div>
                                }
                            >
                                <Form form={form} layout="vertical">
                                    <Row gutter={[16, 16]}>
                                        {customShow ? (
                                            <>
                                                <Col xs={24}>
                                                    <Form.Item
                                                        label="Custom API"
                                                        name="custom_url"
                                                        rules={[
                                                            { required: true, message: 'Please enter custom API URL' },
                                                            {
                                                                pattern: /^https?:\/\/.+/,
                                                                message: 'Please enter a valid URL starting with http:// or https://',
                                                            },
                                                        ]}
                                                    >
                                                        <TextArea
                                                            rows={3}
                                                            placeholder="https://api.example.com/send?number=:NUMBER&message=:MESSAGE&template_id=:TID"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24}>
                                                    <Alert
                                                        message={
                                                            <div>
                                                                <strong>Required placeholders:</strong>
                                                                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                                                    <li>
                                                                        <strong>:NUMBER</strong> - Mobile number
                                                                    </li>
                                                                    <li>
                                                                        <strong>:MESSAGE</strong> - Message content
                                                                    </li>
                                                                    <li>
                                                                        <strong>:TID</strong> - Template ID (optional)
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        }
                                                        type="info"
                                                    />
                                                </Col>
                                            </>
                                        ) : (
                                            <>
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="API Key"
                                                        name="api_key"
                                                        rules={[
                                                            { required: true, message: 'Please enter API key' },
                                                            { min: 10, message: 'API Key must be at least 10 characters' },
                                                        ]}
                                                    >
                                                        <Input placeholder="Enter your API Key" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Sender ID"
                                                        name="sender_id"
                                                        rules={[
                                                            { required: true, message: 'Please enter sender ID' },
                                                            {
                                                                pattern: /^[A-Za-z0-9]{3,11}$/,
                                                                message: 'Sender ID must be 3-11 alphanumeric characters',
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            placeholder="Enter Sender ID (3-11 chars)"
                                                            maxLength={11}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </>
                                        )}
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Status">
                                                <Radio.Group value={status} onChange={(e) => setStatus(e.target.value)}>
                                                    <Radio value={true}>Enable</Radio>
                                                    <Radio value={false}>Disable</Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    type="primary"
                                                    icon={<SaveOutlined />}
                                                    loading={isSavingConfig}
                                                    onClick={HandleSubmit}
                                                >
                                                    {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>
                        </Col>

                        {/* Template Form */}
                        <Col xs={24}>
                            <Card
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{editState ? 'Edit' : 'New'} Template</span>
                                        {editState && (
                                            <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit}>
                                                Cancel Edit
                                            </Button>
                                        )}
                                    </div>
                                }
                            >
                                <Form form={templateForm} layout="vertical">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Template Name"
                                                name="template_name"
                                                rules={[
                                                    { required: true, message: 'Please enter template name' },
                                                    { min: 3, message: 'Template name must be at least 3 characters' },
                                                    { max: 50, message: 'Template name must not exceed 50 characters' },
                                                ]}
                                            >
                                                <Input
                                                    placeholder="Enter template name (3-50 chars)"
                                                    maxLength={50}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Template ID"
                                                name="template_id"
                                                rules={[
                                                    { required: true, message: 'Please enter template ID' },
                                                    {
                                                        pattern: /^[A-Za-z0-9_-]+$/,
                                                        message: 'Only letters, numbers, hyphens, and underscores allowed',
                                                    },
                                                ]}
                                                extra="Only letters, numbers, hyphens, and underscores allowed"
                                            >
                                                <Input placeholder="e.g., welcome_msg, otp_template" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24}>
                                            <Form.Item
                                                label="Template Content"
                                                name="content"
                                                rules={[
                                                    { required: true, message: 'Please enter template content' },
                                                    { min: 10, message: 'Template content must be at least 10 characters' },
                                                    { max: 1000, message: 'Template content must not exceed 1000 characters' },
                                                ]}
                                            >
                                                <TextArea
                                                    rows={5}
                                                    placeholder="Enter your SMS template content here..."
                                                    maxLength={1000}
                                                    showCount
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                {editState && (
                                                    <Button onClick={cancelEdit}>Cancel</Button>
                                                )}
                                                <Button
                                                    type="primary"
                                                    icon={<SaveOutlined />}
                                                    loading={isTemplateLoading}
                                                    onClick={SubmitTemplate}
                                                >
                                                    {isTemplateLoading
                                                        ? editState
                                                            ? 'Updating...'
                                                            : 'Saving...'
                                                        : editState
                                                            ? 'Update Template'
                                                            : 'Save Template'}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </Col>

                {/* Right Column */}
                <Col xs={24} lg={12}>
                    <Row gutter={[16, 16]}>
                        {/* SMS Templates Table */}
                        <Col xs={24}>
                            <Card
                                title="SMS Templates"
                                size="small"
                                extra={
                                    <Input
                                        placeholder="Search..."
                                        prefix={<SearchOutlined />}
                                        allowClear
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{ width: 150 }}
                                        size="small"
                                    />
                                }
                            >
                                <Table
                                    dataSource={templates.filter(item =>
                                        !searchText ||
                                        item.template_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        item.content?.toLowerCase().includes(searchText.toLowerCase())
                                    )}
                                    columns={columns}
                                    loading={isLoadingSMS}
                                    size="small"
                                    pagination={{
                                        pageSize: 5,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['5', '10', '20', '50'],
                                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                    }}
                                    scroll={{ x: 600 }}
                                    rowKey="id"
                                />
                            </Card>
                        </Col>

                        {/* System Variables */}
                        <Col xs={24}>
                            <SytemVariables />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>
    );
};

export default SmsSetting;
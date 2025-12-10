import React, { useState, useRef, useMemo, useCallback } from 'react';
import JoditEditor from 'jodit-react';
import { Button, Card, Form, Input, Modal, Table, Space, Popconfirm, Spin, Row, Col, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
    useGetAllContentMaster,
    useCreateContentMaster,
    useUpdateContentMaster,
    useDeleteContentMaster,
} from './useContentMaster';
import { useMyContext } from 'Context/MyContextProvider';
import { OrganisationList } from 'utils/CommonInputs';
import { joditConfig } from 'utils/consts';

const ContentMaster = () => {
    const { UserData } = useMyContext();
    const isUserOrganizer = UserData?.role?.toLowerCase() === 'organizer';
    
    // ========================= STATE =========================
    const [modalVisible, setModalVisible] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [content, setContent] = useState('');
    const [searchText, setSearchText] = useState('');

    const [form] = Form.useForm();
    const editor = useRef(null);

    // ========================= TANSTACK QUERY HOOKS =========================
    const { data: contentList = [], isLoading } = useGetAllContentMaster();

    // ========================= FILTERED DATA =========================
    const filteredContentList = useMemo(() => {
        if (!searchText.trim()) return contentList;
        return contentList.filter((item) =>
            item.title?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [contentList, searchText]);

    const createMutation = useCreateContentMaster({
        onSuccess: () => handleModalClose(),
    });

    const updateMutation = useUpdateContentMaster({
        onSuccess: () => handleModalClose(),
    });

    const deleteMutation = useDeleteContentMaster();

    // ========================= JODIT CONFIG =========================
 

    // ========================= MODAL HANDLERS =========================
    const handleModalClose = useCallback(() => {
        setModalVisible(false);
        setEditRecord(null);
        setContent('');
        form.resetFields();
    }, [form]);

    const handleModalOpen = useCallback(() => {
        form.resetFields();
        setEditRecord(null);
        setContent('');
        setModalVisible(true);
    }, [form]);

    // ========================= FORM SUBMIT =========================
    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();

            if (!content || content.trim() === '' || content === '<p><br></p>') {
                message.error('Please enter content');
                return;
            }

            const payload = {
                user_id: isUserOrganizer ? UserData?.id : values.org_id,
                title: values.title,
                content: content,
                status: values.status ? 1 : 0,
            };

            if (editRecord) {
                updateMutation.mutate({ id: editRecord.id, payload });
            } else {
                createMutation.mutate(payload);
            }
        } catch (err) {
            // Form validation error - handled by antd
        }
    }, [form, content, editRecord, createMutation, updateMutation, isUserOrganizer, UserData?.id]);

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
                sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
            },
            {
                title: 'Content',
                dataIndex: 'content',
                ellipsis: true,
                render: (text) => {
                    // Strip HTML tags and truncate
                    const plainText = text?.replace(/<[^>]*>/g, '') || '';
                    const truncated = plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
                    return truncated;
                },
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
                            title="Delete this content?"
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
            title="Content Master"
            extra={
                <Space>
                    <Input.Search
                        placeholder="Search by title"
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleModalOpen}
                    >
                        Add New Content
                    </Button>
                </Space>
            }
        >
            <Spin spinning={isLoading}>
                <Table
                    rowKey="id"
                    dataSource={filteredContentList}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                />
            </Spin>

            <Modal
                open={modalVisible}
                title={editRecord ? 'Edit Content' : 'New Content'}
                onCancel={handleModalClose}
                onOk={handleSubmit}
                okText="Save"
                width={900}
                confirmLoading={isSubmitting}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ status: true }}
                >
                    <Row gutter={16}>
                            {!isUserOrganizer && (
                                <Col xs={24} md={12}>
                                    <OrganisationList/>
                                </Col>
                            )}
                        <Col span={12}>
                            <Form.Item
                                label="Title"
                                name="title"
                                rules={[{ required: true, message: 'Title is required' }]}
                            >
                                <Input placeholder="Enter content title" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Status"
                                name="status"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </Col>
                    </Row> */}

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
                            onChange={() => { }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ContentMaster;

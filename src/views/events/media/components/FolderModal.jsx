import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { FolderOutlined } from '@ant-design/icons';

const FolderModal = ({
    open,
    onCancel,
    onSubmit,
    folder = null, // null for create, object for edit
    loading = false,
    parentId = null,
}) => {
    const [form] = Form.useForm();
    const isEdit = !!folder;

    useEffect(() => {
        if (open) {
            if (folder) {
                form.setFieldsValue({
                    name: folder.name,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, folder, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const data = {
                name: values.name,
            };
            if (parentId) {
                data.parent_id = parentId;
            }
            onSubmit?.(data, folder?.id);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel?.();
    };

    return (
        <Modal
            title={
                <span>
                    <FolderOutlined style={{ marginRight: 8, color: '#faad14' }} />
                    {isEdit ? 'Rename Folder' : 'Create New Folder'}
                </span>
            }
            open={open}
            onCancel={handleCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText={isEdit ? 'Rename' : 'Create'}
            destroyOnClose
            width={400}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    label="Folder Name"
                    name="name"
                    rules={[
                        { required: true, message: 'Please enter folder name' },
                        { max: 100, message: 'Name cannot exceed 100 characters' },
                    ]}
                >
                    <Input
                        placeholder="Enter folder name"
                        prefix={<FolderOutlined style={{ color: '#faad14' }} />}
                        autoFocus
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default FolderModal;

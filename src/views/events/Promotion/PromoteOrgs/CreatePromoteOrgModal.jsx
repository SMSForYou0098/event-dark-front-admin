import React, { useState } from 'react';
import { Modal, Form, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { OrganisationList } from 'utils/CommonInputs';
import api from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';

const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e && e.fileList;
};

export default function CreatePromoteOrgModal({ visible, onClose, onSuccess }) {
    const { UserData } = useMyContext()
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (!values.org_id || !values.thumbnail?.length) {
                message.error('Both fields are required');
                return;
            }
            setSubmitting(true);
            const formData = new FormData();
            formData.append('user_id', UserData?.id);
            formData.append('org_id', values.org_id);
            formData.append('thumbnail', values.thumbnail[0].originFileObj);
            // POST to API
            await api.post('/api/promoted-orgs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            message.success('Promoted organization created!');
            form.resetFields();
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to create entry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Create Promoted Organization"
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={submitting}
            destroyOnClose
            okText="Create"
        >
            <Form layout="vertical" form={form}>
                <OrganisationList />
                <Form.Item
                    label="Thumbnail"
                    name="thumbnail"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[{ required: true, message: 'Please upload an image!' }]}
                >
                    <Upload
                        name="thumbnail"
                        listType="picture-card"
                        accept="image/*"
                        maxCount={1}
                        beforeUpload={() => false} // no upload, just local
                    >
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
}

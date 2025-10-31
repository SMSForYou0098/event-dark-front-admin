import React, { useEffect } from 'react';
import { Modal, Form, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationList } from 'utils/CommonInputs';
import api from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';

const normFile = (e) => {
  if (Array.isArray(e)) return e;
  return e && e.fileList;
};

export default function CreatePromoteOrgModal({ visible, onClose, editingOrg = null }) {
  const { UserData } = useMyContext();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEditing = !!editingOrg;

  // Create promoted org mutation
  const createPromotedOrgMutation = useMutation({
    mutationFn: async (formData) => {
      const endpoint = isEditing 
        ? `/promote-org/update/${editingOrg.id}` 
        : '/promote-org';
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      message.success(
        isEditing 
          ? 'Promoted organization updated successfully!' 
          : 'Promoted organization created successfully!'
      );
      queryClient.invalidateQueries({ queryKey: ['promote-orgs'] });
      form.resetFields();
      onClose();
    },
    onError: (error) => {
      message.error(
        error?.response?.data?.message || 
        `Failed to ${isEditing ? 'update' : 'create'} entry`
      );
    },
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!isEditing && (!values.org_id || !values.thumbnail?.length)) {
        message.error('Both fields are required');
        return;
      }
      if (!isEditing && !values.org_id) {
        message.error('Organization is required');
        return;
      }
      const formData = new FormData();
      formData.append('user_id', UserData?.id);
      formData.append('org_id', String(values.org_id));

      // Only append image if new one (originFileObj exists)
      if (values.thumbnail?.length) {
        const file = values.thumbnail[0];
        if (file.originFileObj) {
          formData.append('image', file.originFileObj);
        }
      }
      createPromotedOrgMutation.mutate(formData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Populate form for editing
  useEffect(() => {
    if (visible && editingOrg) {
      form.setFieldsValue({
        org_id: String(editingOrg.org_id),
        thumbnail: editingOrg.image
          ? [{
              uid: '-1',
              name: 'Current Image',
              status: 'done',
              url: editingOrg.image,
            }]
          : [],
      });
    } else if (!visible) {
      form.resetFields();
    }
  }, [visible, editingOrg, form]);

  // Sync Upload field with form
  const fileList = Form.useWatch('thumbnail', form) || [];
  const handleUploadChange = ({ fileList: newFileList }) => {
    form.setFieldsValue({ thumbnail: newFileList });
  };

  return (
    <Modal
      title={isEditing ? 'Edit Promoted Organization' : 'Create Promoted Organization'}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      confirmLoading={createPromotedOrgMutation.isPending}
      destroyOnClose
      okText={isEditing ? 'Update' : 'Create'}
    >
      <Form layout="vertical" form={form}>
        <OrganisationList />
        <Form.Item
          label="Thumbnail"
          name="thumbnail"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{
            required: !isEditing,
            message: 'Please upload an image!'
          }]}
          extra={isEditing && "Leave empty to keep current image"}
        >
          <Upload
            name="thumbnail"
            listType="picture-card"
            accept="image/*"
            maxCount={1}
            beforeUpload={() => false}
            fileList={fileList}
            onChange={handleUploadChange}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>{isEditing ? 'Change Image' : 'Upload'}</div>
            </div>
          </Upload>
        </Form.Item>
        {isEditing && editingOrg?.image && (
          <Form.Item label="Current Image">
            <img
              src={editingOrg.image}
              alt="Current"
              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

import React, { useEffect, useState } from 'react';
import { Modal, Form, message, Card, Image, Space, Button } from 'antd';
import { PlusOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationList } from 'utils/CommonInputs';
import api from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const normFile = (e) => {
  if (Array.isArray(e)) return e;
  return e && e.fileList;
};

export default function CreatePromoteOrgModal({ visible, onClose, editingOrg = null }) {
  const { UserData } = useMyContext();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEditing = !!editingOrg;
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

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

      // Check if image is present (either new upload/selection or existing one for update)
      // Note: for update, we might not always require re-upload if logic allows keeping partial state, 
      // but form rules handle requirement.

      const formData = new FormData();
      formData.append('user_id', UserData?.id);
      formData.append('org_id', String(values.org_id));

      // Handle image upload properly
      if (values.thumbnail?.length) {
        const file = values.thumbnail[0];
        if (file.originFileObj) {
          formData.append('image', file.originFileObj);
        } else if (file.url) {
          formData.append('image', file.url);
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

  // Handle media selection from picker
  const handleMediaSelect = (url) => {
    if (!url) return;

    const newFile = {
      uid: `gallery-${Date.now()}`,
      name: 'gallery-image.jpg',
      status: 'done',
      url: url,
    };

    form.setFieldsValue({ thumbnail: [newFile] });
    setMediaPickerOpen(false);
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
          <Form.Item shouldUpdate={(prev, curr) => prev.thumbnail !== curr.thumbnail} noStyle>
            {({ getFieldValue, setFieldsValue }) => {
              const fileList = getFieldValue('thumbnail') || [];
              const file = fileList[0];
              const imageUrl = file?.url || (file?.originFileObj ? URL.createObjectURL(file.originFileObj) : null);

              return (
                <Card
                  size="small"
                  style={{
                    border: imageUrl ? '2px solid #52c41a' : '1px dashed #d9d9d9',
                    textAlign: 'center',
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  styles={{ body: { padding: 8 } }}
                >
                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt="Thumbnail"
                        style={{ maxHeight: 80, objectFit: 'contain' }}
                        className="rounded mb-2"
                      />
                      <Space size="small">
                        <Button
                          size="small"
                          icon={<PictureOutlined />}
                          onClick={() => setMediaPickerOpen(true)}
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setFieldsValue({ thumbnail: [] })}
                        />
                      </Space>
                    </>
                  ) : (
                    <div
                      onClick={() => setMediaPickerOpen(true)}
                      style={{ cursor: 'pointer', padding: '10px 0' }}
                    >
                      <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                      <div style={{ marginTop: 8, fontSize: 12 }}>Select Image</div>
                    </div>
                  )}
                </Card>
              );
            }}
          </Form.Item>
        </Form.Item>
      </Form>

      {/* Media Picker Modal */}
      <MediaGalleryPickerModal
        open={mediaPickerOpen}
        onCancel={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={false}
        title="Select Organization Image"
        // Adjust these dimensions as needed for Promote Org, or make them optional
        dimensionValidation={{ width: 600, height: 600, strict: false }}
      />
    </Modal>
  );
}

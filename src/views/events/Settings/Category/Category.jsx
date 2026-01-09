// Category.jsx
import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Switch,
  Upload,
  Table,
  Space,
  Popconfirm,
  Spin,
  message,
  Image,
  Typography
} from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, DeleteOutlined, PlusOutlined, PictureOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import AssignFields from "./AssignFields";
import SelectedOptionView from "./SelectedOptionView";
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const Category = () => {
  const queryClient = useQueryClient();

  // ========================= STATE =========================
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [fields, setFields] = useState({ show: false, ids: [], names: [] });

  // Media Picker State
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [form] = Form.useForm();

  // ========================= FETCH CATEGORIES =========================
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('category');
      return res.categoryData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents refetching on every render
    refetchOnWindowFocus: false,
  });

  // ========================= MUTATIONS =========================
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      formData.append("title", values.title);
      // Send as boolean as requested
      formData.append("status", values.status);
      formData.append("attendy_required", values.attendyRequired);
      formData.append("photo_required", values.photoRequired);

      // Handle image upload properly
      // Handle image upload properly
      let fileList = [];
      if (Array.isArray(values.image)) {
        fileList = values.image;
      } else if (values.image?.fileList) {
        fileList = values.image.fileList;
      }

      if (fileList.length > 0) {
        const file = fileList[0];
        if (file.originFileObj) {
          formData.append("image", file.originFileObj);
        } else if (file.url) {
          formData.append("image", file.url);
        }
      }

      const url = editRecord
        ? `category-update/${editRecord.id}`
        : `category-store`;

      const res = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Attach fields if successful and we have a category ID
      if (res.status) {
        const categoryId = res.categoryData?.id;
        if (categoryId) {
          await api.post(
            `catrgoty-fields-store`,
            { category_id: categoryId, custom_fields_id: fields.ids || [] }
          );
        }
      }
      return res;
    },
    onSuccess: (data) => {
      if (data.status) {
        message.success(data.message || "Category saved");

        // Update cache directly instead of refetching
        queryClient.setQueryData(['categories'], (oldData) => {
          if (!oldData) return [data.categoryData];

          // If editing, update the existing category
          if (editRecord) {
            return oldData.map(cat =>
              cat.id === data.categoryData.id ? data.categoryData : cat
            );
          }
          // If creating, add to beginning of list
          return [data.categoryData, ...oldData];
        });

        handleModalClose();
      } else {
        message.error(data.message || "Failed to save");
      }
    },
    onError: (err) => {
      message.error(err.message || "Error saving category");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`category-destroy/${id}`);
    },
    onSuccess: (_, deletedId) => {
      message.success("Category deleted successfully");

      // Remove from cache directly instead of refetching
      queryClient.setQueryData(['categories'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(cat => cat.id !== deletedId);
      });
    },
    onError: () => {
      message.error("Failed to delete category");
    }
  });

  // ========================= HANDLERS =========================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      saveMutation.mutate(values);
    } catch (err) {
      if (err?.errorFields) return; // form validation error
      console.error(err);
    }
  };

  const handleDelete = useCallback((id) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditRecord(null);
    setFields({ show: false, ids: [], names: [] });
    form.resetFields();
  }, [form]);

  const handleModalOpen = useCallback(() => {
    form.resetFields();
    setEditRecord(null);
    setFields({ show: false, ids: [], names: [] });
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback(
    (record) => {
      setEditRecord(record);
      setModalVisible(true);

      // Parse field IDs and set fields
      const fieldIds = record?.catrgotyhas_field?.custom_fields_id
        ?.split(",")
        ?.map(Number);

      setFields({
        ids: fieldIds || [],
        names: record?.fields || [],
        show: false,
      });

      // Prepare image file list
      let imageFileList = [];
      if (record.image) {
        imageFileList = [
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: record.image,
          },
        ];
      }

      // Set form values
      form.setFieldsValue({
        title: record.title,
        attendyRequired: record.attendy_required,
        photoRequired: record.photo_required,
        status: record.status,
        image: imageFileList,
      });
    },
    [form]
  );

  // Handle media selection from picker
  const handleMediaSelect = (url) => {
    if (!url) return;

    const newFile = {
      uid: `gallery-${Date.now()}`,
      name: 'gallery-image.jpg',
      status: 'done',
      url: url,
    };

    form.setFieldsValue({ image: [newFile] });
    setMediaPickerOpen(false);
  };

  // ========================= TABLE COLUMNS =========================
  const columns = useMemo(
    () => [
      {
        title: "#",
        render: (_, __, i) => i + 1,
        width: 60,
      },
      {
        title: "Category",
        dataIndex: "title",
        sorter: (a, b) => a.title.localeCompare(b.title),
      },
      {
        title: "Attendee Details Required",
        dataIndex: "attendy_required",
        align: "center",
        render: (val) =>
          val ? (
            <CheckOutlined style={{ color: "green" }} />
          ) : (
            <CloseOutlined style={{ color: "red" }} />
          ),
      },
      {
        title: "Status",
        dataIndex: "status",
        align: "center",
        render: (val) =>
          val ? (
            <CheckOutlined style={{ color: "green" }} />
          ) : (
            <CloseOutlined style={{ color: "red" }} />
          ),
      },
      {
        title: "Action",
        align: "center",
        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
            <Popconfirm
              title="Delete this category?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Empty deps - handlers are stable due to useCallback
  );

  // ========================= UPLOAD NORMALIZATION =========================
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // ========================= RENDER =========================
  return (
    <Card
      title="Categories"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleModalOpen}
        >
          Add New Category
        </Button>
      }
    >
      <Spin spinning={isLoading}>
        <Table
          rowKey="id"
          dataSource={categories}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        open={modalVisible}
        title={editRecord ? "Edit Category" : "New Category"}
        onCancel={handleModalClose}
        onOk={handleSubmit}
        okText="Save"
        width={600}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: true,
            attendyRequired: false,
            photoRequired: false,
          }}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Enter category title" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Image (282 × 260 px)"
                name="image"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              // rules={[
              //   {
              //     // required: !editRecord,
              //     message: 'Please upload image'
              //   }
              // ]}
              >
                <Form.Item shouldUpdate={(prev, curr) => prev.image !== curr.image} noStyle>
                  {({ getFieldValue, setFieldsValue }) => {
                    const fileList = getFieldValue('image') || [];
                    const file = fileList[0];
                    const imageUrl = file?.url || (file?.originFileObj ? URL.createObjectURL(file.originFileObj) : null);

                    return (
                      <Card
                        size="small"
                        style={{
                          border: imageUrl ? '2px solid #52c41a' : '1px dashed #d9d9d9',
                          textAlign: 'center',
                          height: '100%',
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
                              alt="Category"
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
                                onClick={() => setFieldsValue({ image: [] })}
                              />
                            </Space>
                          </>
                        ) : (
                          <div
                            onClick={() => setMediaPickerOpen(true)}
                            style={{ cursor: 'pointer', padding: '10px 0' }}
                          >
                            <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                            <div style={{ marginTop: 8, fontSize: 12 }}>Select</div>
                          </div>
                        )}
                      </Card>
                    );
                  }}
                </Form.Item>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Attendee Required"
                name="attendyRequired"
                valuePropName="checked"
              >
                <Switch
                  onChange={(checked) =>
                    checked &&
                    setFields((prev) => ({
                      ...prev,
                      show: true,
                    }))
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Status"
                name="status"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.attendyRequired !== curr.attendyRequired}>
            {({ getFieldValue }) =>
              getFieldValue("attendyRequired") && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>Attendee Fields:</strong>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => setFields((prev) => ({ ...prev, show: true }))}
                    >
                      Edit Fields
                    </Button>
                  </div>
                  <Row gutter={[8, 8]}>
                    {fields.names?.map((field, i) => (
                      <Col span={8} key={i}>
                        <SelectedOptionView item={field.field_name} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Media Picker Modal */}
      <MediaGalleryPickerModal
        open={mediaPickerOpen}
        onCancel={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={false}
        title="Select Category Image"
        dimensionValidation={{ width: 282, height: 260, strict: false }}
      />

      <AssignFields
        editState={!!editRecord}
        showFields={fields.show}
        onClose={() => setFields((prev) => ({ ...prev, show: false }))}
        onFieldsChange={(ids) => setFields((prev) => ({ ...prev, ids }))}
        selectedIds={fields.ids}
        onFieldsNameChange={(names) => setFields((prev) => ({ ...prev, names }))}
      />
    </Card>
  );
};

Category.displayName = "Category";
export default React.memo(Category);
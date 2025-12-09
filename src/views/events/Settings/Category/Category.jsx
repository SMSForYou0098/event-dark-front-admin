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
  notification,
  Spin,
  message,
} from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import AssignFields from "./AssignFields";
import SelectedOptionView from "./SelectedOptionView";

const Category = () => {
  const queryClient = useQueryClient();

  // ========================= STATE =========================
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [fields, setFields] = useState({ show: false, ids: [], names: [] });

  const [form] = Form.useForm();

  // ========================= FETCH CATEGORIES =========================
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('category');
      return res.categoryData || [];
    }
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
      if (values.image?.fileList?.length > 0) {
        const file = values.image.fileList[0];
        if (file.originFileObj) {
          formData.append("image", file.originFileObj);
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
        notification.success({ message: data.message || "Category saved" });
        queryClient.invalidateQueries(['categories']);
        handleModalClose();
      } else {
        notification.error({ message: data.message || "Failed to save" });
      }
    },
    onError: (err) => {
      notification.error({ message: err.message || "Error saving category" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`category-destroy/${id}`);
    },
    onSuccess: () => {
      notification.success({ message: "Category deleted successfully" });
      queryClient.invalidateQueries(['categories']);
    },
    onError: () => {
      notification.error({ message: "Failed to delete category" });
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

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

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

      // Set form values including image if exists
      const formValues = {
        title: record.title,
        attendyRequired: record.attendy_required,
        photoRequired: record.photo_required,
        status: record.status,
      };

      // If editing and there's an existing image, create a file list array
      if (record.image) {
        formValues.image = [
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: record.image,
          },
        ];
      }

      form.setFieldsValue(formValues);
    },
    [form]
  );

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
    [handleEdit, handleDelete] // Dependencies for useCallback inside columns
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
                rules={[
                  {
                    required: !editRecord,
                    message: 'Please upload image'
                  }
                ]}
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('You can only upload image files!');
                      return Upload.LIST_IGNORE;
                    }
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error('Image must be smaller than 5MB!');
                      return Upload.LIST_IGNORE;
                    }
                    return false; // Prevent auto upload
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
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
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import axios from "axios";
import { useMyContext } from "../../../../Context/MyContextProvider";
import AssignFields from "./AssignFields";
import SelectedOptionView from "./SelectedOptionView";

const Category = () => {
  const { api, authToken } = useMyContext();

  // ========================= STATE =========================
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [fields, setFields] = useState({ show: false, ids: [], names: [] });
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();

  // ========================= FETCH CATEGORIES =========================
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}category`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data.status) setData(res.data.categoryData);
    } catch (err) {
      notification.error({ message: "Failed to fetch categories" });
    } finally {
      setLoading(false);
    }
  }, [api, authToken]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ========================= FORM SUBMIT =========================
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("status", values.status ? 1 : 0);
      formData.append("attendy_required", values.attendyRequired ? 1 : 0);
      formData.append("photo_required", values.photoRequired ? 1 : 0);
      
      // Handle image upload properly
      if (values.image?.fileList?.length > 0) {
        const file = values.image.fileList[0];
        if (file.originFileObj) {
          formData.append("image", file.originFileObj);
        }
      }

      const url = editRecord
        ? `${api}category-update/${editRecord.id}`
        : `${api}category-store`;

      const res = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.data.status) {
        // attach fields
        await axios.post(
          `${api}catrgoty-fields-store`,
          { category_id: res.data.categoryData?.id, custom_fields_id: fields.ids || [] },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        notification.success({ message: res.data.message || "Category saved" });
        fetchCategories();
        handleModalClose();
      } else {
        notification.error({ message: res.data.message || "Failed to save" });
      }
    } catch (err) {
      if (err?.errorFields) return; // form validation error
      notification.error({ message: err.message || "Error saving category" });
    } finally {
      setSubmitting(false);
    }
  }, [form, api, authToken, editRecord, fields.ids, fetchCategories]);

  // ========================= MODAL HANDLERS =========================
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

  // ========================= DELETE =========================
  const handleDelete = useCallback(
    async (id) => {
      try {
        await axios.delete(`${api}category-destroy/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        notification.success({ message: "Category deleted successfully" });
        fetchCategories();
      } catch {
        notification.error({ message: "Failed to delete category" });
      }
    },
    [api, authToken, fetchCategories]
  );

  // ========================= EDIT =========================
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
        attendyRequired: record.attendy_required === 1,
        photoRequired: record.photo_required === 1,
        status: record.status === 1,
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
          val === 1 ? (
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
    [handleEdit, handleDelete]
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
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          dataSource={data}
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
        confirmLoading={submitting}
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
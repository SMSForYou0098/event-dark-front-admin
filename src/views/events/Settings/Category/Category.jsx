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
} from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
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
      if (values.image?.file) formData.append("image", values.image.file.originFileObj);

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
        setModalVisible(false);
        setEditRecord(null);
        form.resetFields();
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
      form.setFieldsValue({
        title: record.title,
        attendyRequired: record.attendy_required === 1,
        photoRequired: record.photo_required === 1,
        status: record.status === 1,
      });
      const fieldIds = record?.catrgotyhas_field?.custom_fields_id
        ?.split(",")
        ?.map(Number);
      setFields({
        ids: fieldIds || [],
        names: record?.fields || [],
        show: false,
      });
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
        title: "Photo Required",
        dataIndex: "photo_required",
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

  // ========================= RENDER =========================
  return (
    <Card title="Categories" extra={
       <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditRecord(null);
            setModalVisible(true);
          }}
        >
          Add New Category
        </Button>
    }>

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
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="Save"
        style={{top: 0}}
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

          <Form.Item label="Image (282 × 260 px)" name="image" valuePropName="fileList">
            <Upload
              maxCount={1}
              listType="picture"
              beforeUpload={() => false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Attendee Required" name="attendyRequired" valuePropName="checked">
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
              <Form.Item label="Photo Required" name="photoRequired" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Status" name="status" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          {form.getFieldValue("attendyRequired") && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Attendee Fields:</p>
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
          )}
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

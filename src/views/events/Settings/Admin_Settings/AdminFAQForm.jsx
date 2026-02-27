import React, { useState } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Space,
  Tag,
  Empty,
  Spin,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Collapse,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  SaveOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyContext } from "../../../../Context/MyContextProvider";
import apiClient from "auth/FetchInterceptor";
import Utils from "utils";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Link } = Typography;
const { Panel } = Collapse;

const FAQAdmin = ({ options }) => {
  const { formatDateTime } = useMyContext();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const formattedOptions = options.map((item) => ({
    value: item.id,
    label: item.title,
  }));

  // Fetch FAQs using TanStack Query
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const response = await apiClient.get("faq-list");
      if (response?.status) {
        return response.data || [];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create/Update FAQ Mutation
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const validLinks = values.links.filter(
        (link) => link.text?.trim() && link.url?.trim()
      );

      const faqData = {
        question: values.question.trim(),
        answer: values.answer.trim(),
        category: values.category,
        links: JSON.stringify(validLinks),
        is_active: values.isActive ? 1 : 0,
      };

      if (editingId) {
        return await apiClient.post(`faq-update/${editingId}`, faqData);
      } else {
        return await apiClient.post("faq-store", faqData);
      }
    },
    onSuccess: (response) => {
      if (response?.status || response?.success) {
        message.success(
          editingId ? "FAQ updated successfully!" : "FAQ added successfully!"
        );
        resetForm();
        queryClient.invalidateQueries(["faqs"]);
      } else {
        message.error(response?.message || "Operation failed");
      }
    },
    onError: (error) => {
      console.error("Error saving FAQ:", error);
      message.error(Utils.getErrorMessage(error, "Failed to save FAQ"));
    },
  });

  // Delete FAQ Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiClient.delete(`faq-destroy/${id}`);
    },
    onSuccess: (response) => {
      if (response?.status || response?.success) {
        message.success("FAQ deleted successfully!");
        queryClient.invalidateQueries(["faqs"]);
      } else {
        message.error(response?.message || "Failed to delete FAQ");
      }
    },
    onError: (error) => {
      console.error("Error deleting FAQ:", error);
      message.error(Utils.getErrorMessage(error, "Failed to delete FAQ"));
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (faq) => {
      const updatedData = {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        links: faq.links || "[]",
        is_active: faq.is_active == 1 ? 0 : 1,
      };
      return await apiClient.post(`faq-update/${faq.id}`, updatedData);
    },
    onSuccess: (response) => {
      if (response?.status || response?.success) {
        message.success("FAQ status updated!");
        queryClient.invalidateQueries(["faqs"]);
      } else {
        message.error(response?.message || "Failed to update FAQ status");
      }
    },
    onError: (error) => {
      console.error("Error updating FAQ status:", error);
      message.error(Utils.getErrorMessage(error, "Failed to update FAQ status"));
    },
  });

  // Fetch FAQ details for editing
  const handleEdit = async (faq) => {
    try {
      const response = await apiClient.get(`faq-show/${faq.id}`);

      if (response?.status || response?.success) {
        const faqData = response.data;
        let parsedLinks = [];

        try {
          parsedLinks = faqData.links ? JSON.parse(faqData.links) : [];
        } catch (e) {
          console.error("Error parsing links:", e);
          parsedLinks = [];
        }

        form.setFieldsValue({
          question: faqData.question || "",
          answer: faqData.answer || "",
          category: faqData.category || "",
          links: parsedLinks.length > 0 ? parsedLinks : [{ text: "", url: "" }],
          isActive: faqData.is_active == 1,
        });
        setEditingId(faq.id);
        setShowForm(true);
      } else {
        message.error("Failed to fetch FAQ details");
      }
    } catch (error) {
      console.error("Error fetching FAQ details:", error);
      message.error(Utils.getErrorMessage(error, "Failed to fetch FAQ details"));
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure?",
      content: "This action will permanently delete the FAQ.",
      okText: "Yes, delete it!",
      okType: "primary",
      cancelText: "Cancel",
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const resetForm = () => {
    form.resetFields();
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (values) => {
    saveMutation.mutate(values);
  };

  const getCategoryLabel = (faq) => {
    if (faq.category_data && faq.category_data.title) {
      return faq.category_data.title;
    }
    const option = formattedOptions.find((opt) => opt.value == faq.category);
    return option ? option.label : `Category ${faq.category}`;
  };

  return (
    <div className="p-4">
      <Card>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Title level={3} className="m-0">
            📋 FAQ Management
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowForm(true)}
            disabled={isLoading}
          >
            Add New FAQ
          </Button>
        </div>

        {/* FAQ Form Modal */}
        <Modal
          open={showForm}
          onCancel={resetForm}
          title={editingId ? "Edit FAQ" : "Add New FAQ"}
          width={800}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              question: "",
              answer: "",
              category: "",
              links: [{ text: "", url: "" }],
              isActive: true,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Question"
                  name="question"
                  rules={[
                    { required: true, message: "Please enter question" },
                    {
                      min: 10,
                      message: "Question must be at least 10 characters",
                    },
                    {
                      max: 255,
                      message: "Question cannot exceed 255 characters",
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter the FAQ question (minimum 10 characters)"
                    showCount
                    maxLength={255}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Category"
                  name="category"
                  rules={[
                    { required: true, message: "Please select a category" },
                  ]}
                >
                  {formattedOptions.length > 0 ? (
                    <Select
                      placeholder="Select a category"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={formattedOptions}
                    />
                  ) : (
                    <Input placeholder="Type your category..." />
                  )}
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Answer"
              name="answer"
              rules={[
                { required: true, message: "Please enter answer" },
                { min: 20, message: "Answer must be at least 20 characters" },
                {
                  max: 1000,
                  message: "Answer cannot exceed 1000 characters",
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Enter the detailed answer (minimum 20 characters)"
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item label="Related Links">
              <Form.List name="links">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space
                        key={key}
                        className="d-flex mb-2 w-100"
                        align="baseline"
                      >
                        <Form.Item
                          {...restField}
                          name={[name, "text"]}
                          className="flex-fill mb-0"
                        >
                          <Input placeholder="Link text" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "url"]}
                          className="flex-fill mb-0"
                          style={{ flex: 2 }}
                          rules={[
                            {
                              type: "url",
                              message: "Please enter a valid URL",
                            },
                          ]}
                        >
                          <Input placeholder="https://example.com" />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Tooltip title="Remove this link">
                            <Button
                              type="text"
                              danger
                              icon={<CloseOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Tooltip>
                        )}
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Link
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item name="isActive" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              <Text type="secondary" className="ms-2">
                Active (visible to users)
              </Text>
            </Form.Item>

            <Divider />

            <div className="d-flex justify-content-end">
              <Space>
                <Button onClick={resetForm} disabled={saveMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveMutation.isPending}
                >
                  {editingId ? "Update FAQ" : "Add FAQ"}
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* FAQ Collapse */}
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Title level={5} className="m-0">
              FAQ List ({faqs.length})
            </Title>
            {isLoading && <Spin size="small" />}
          </div>

          {isLoading && faqs.length === 0 ? (
            <div className="text-center py-5">
              <Spin size="large" tip="Loading FAQs..." />
            </div>
          ) : faqs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  No FAQs Found
                  <br />
                  <Text type="secondary">
                    Click "Add New FAQ" to create your first FAQ item.
                  </Text>
                </span>
              }
            />
          ) : (
            <Collapse accordion ghost>
              {faqs.map((faq) => (
                <Panel
                  key={faq.id}
                  header={
                    <div className="d-flex align-items-center justify-content-between w-100 p-2">
                      <Space wrap>
                        <Tag color={faq.is_active ? "success" : "default"}>
                          {faq.is_active ? "Active" : "Inactive"}
                        </Tag>
                        <Tag color="blue">{getCategoryLabel(faq)}</Tag>
                        <Text strong>{faq.question}</Text>
                      </Space>
                    </div>
                  }
                  extra={
                    <Space
                      onClick={(e) => e.stopPropagation()}
                      className="ms-2"
                    >
                      <Tooltip title="Edit FAQ" placement="top">
                        <Button
                          type="primary"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(faq)}
                          disabled={isLoading}
                        />
                      </Tooltip>
                      <Tooltip
                        title={
                          faq.is_active
                            ? "Deactivate FAQ"
                            : "Activate FAQ"
                        }
                        placement="top"
                      >
                        <Button
                          type={faq.is_active ? "default" : "primary"}
                          size="small"
                          icon={
                            faq.is_active ? (
                              <EyeInvisibleOutlined />
                            ) : (
                              <EyeOutlined />
                            )
                          }
                          onClick={() => toggleStatusMutation.mutate(faq)}
                          disabled={toggleStatusMutation.isPending}
                        />
                      </Tooltip>
                      <Tooltip title="Delete FAQ" placement="top">
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(faq.id)}
                          disabled={deleteMutation.isPending}
                        />
                      </Tooltip>
                    </Space>
                  }
                >
                  <Space direction="vertical" className="w-100">
                    <Text>{faq.answer}</Text>

                    {faq.links &&
                      (() => {
                        try {
                          const parsedLinks = JSON.parse(faq.links);
                          return parsedLinks.length > 0 ? (
                            <div className="mt-3">
                              <Text strong>Related Links:</Text>
                              <ul className="list-unstyled ps-0 mt-2">
                                {parsedLinks.map((link, linkIndex) => (
                                  <li key={linkIndex} className="mb-1">
                                    <LinkOutlined className="me-2 text-primary" />
                                    <Link
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {link.text}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null;
                        } catch (e) {
                          return null;
                        }
                      })()}

                    <Text type="secondary" className="small mt-2">
                      Created: {formatDateTime(faq.created_at)}
                      {faq.updated_at !== faq.created_at && (
                        <span>
                          {" "}
                          | Updated: {formatDateTime(faq.updated_at)}
                        </span>
                      )}
                    </Text>
                  </Space>
                </Panel>
              ))}
            </Collapse>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FAQAdmin;

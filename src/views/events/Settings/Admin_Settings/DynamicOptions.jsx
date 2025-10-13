import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Space,
  Typography,
  Empty,
  Spin,
  Alert,
  message,
  Modal,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";
import FAQAdmin from "./AdminFAQForm";

const { Title, Text } = Typography;

const DynamicOptions = ({ type, heading }) => {
  const queryClient = useQueryClient();

  const [newOption, setNewOption] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // Fetch options using TanStack Query
  const {
    data: options = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["contactOptions", type],
    queryFn: async () => {
      const response = await apiClient.get(`query-list?type=${type}`);
      return response?.data || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    cacheTime: 5 * 60 * 1000,
  });

  // Add option mutation - Pessimistic Update
  const addMutation = useMutation({
    mutationFn: async (title) => {
      const response = await apiClient.post("query-store", { title, type });
      return response;
    },
    onSuccess: () => {
      message.success("Option added successfully!");
      setNewOption("");
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["contactOptions", type] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Failed to add option");
    },
  });

  // Delete option mutation - Pessimistic Update
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`query-destroy/${id}`);
      return id;
    },
    onSuccess: () => {
      message.success("Option deleted successfully!");
      setDeleteModalVisible(false);
      setDeletingItem(null);
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["contactOptions", type] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Failed to delete option");
      setDeleteModalVisible(false);
      setDeletingItem(null);
    },
  });

  // Update option mutation - Pessimistic Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, title }) => {
      const response = await apiClient.post(`query-update/${id}`, {
        title,
        type,
      });
      return response;
    },
    onSuccess: () => {
      message.success("Option updated successfully!");
      setEditingId(null);
      setEditingText("");
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["contactOptions", type] });
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Failed to update option");
    },
  });

  // Handle add option
  const handleAdd = () => {
    if (!newOption.trim()) {
      message.warning("Please enter an option name");
      return;
    }
    addMutation.mutate(newOption);
  };

  // Handle delete option - Open modal
  const handleDelete = (id, title) => {
    setDeletingItem({ id, title });
    setDeleteModalVisible(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setDeletingItem(null);
  };

  // Start editing
  const handleEdit = (id, title) => {
    setEditingId(id);
    setEditingText(title);
  };

  // Save edit
  const handleSaveEdit = (id) => {
    if (!editingText.trim()) {
      message.warning("Option name cannot be empty");
      return;
    }
    updateMutation.mutate({ id, title: editingText });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  return (
    <>
      <Card>
        <div className="mb-4">
          <Title level={4} className="m-0">
            Manage {heading} Options
          </Title>
          <Text type="secondary">
            Add, edit, or delete {heading.toLowerCase()} options
          </Text>
        </div>

        {isError && (
          <Alert
            message="Error"
            description={error?.message || "Failed to load options"}
            type="error"
            showIcon
            className="mb-3"
          />
        )}

        {/* Add new option */}
        <Space.Compact className="w-100 mb-4">
          <Input
            placeholder="Enter option name"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onPressEnter={handleAdd}
            disabled={addMutation.isPending}
            size="large"
          />
          <Tooltip title="Add new option" placement="top">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={addMutation.isPending || !newOption.trim()}
              loading={addMutation.isPending}
              size="large"
            >
              Add
            </Button>
          </Tooltip>
        </Space.Compact>

        {/* List of options */}
        {isLoading ? (
          <div className="text-center py-5">
            <Spin size="large" tip="Loading options..." />
          </div>
        ) : options.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No options found
                <br />
                <Text type="secondary">
                  Add your first {heading.toLowerCase()} option above
                </Text>
              </span>
            }
          />
        ) : (
          <List
            bordered
            dataSource={options}
            renderItem={(opt) => (
              <List.Item key={opt.id} className="p-3">
                <Row className="w-100" align="middle" gutter={16}>
                  <Col xs={24} sm={16} md={18}>
                    {editingId === opt.id ? (
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onPressEnter={() => handleSaveEdit(opt.id)}
                        disabled={updateMutation.isPending}
                        autoFocus
                      />
                    ) : (
                      <Text strong>{opt.title}</Text>
                    )}
                  </Col>
                  <Col xs={24} sm={8} md={6}>
                    <Space wrap className="d-flex justify-content-end w-100">
                      {editingId === opt.id ? (
                        <>
                          <Tooltip title="Save changes" placement="top">
                            <Button
                              type="primary"
                              icon={<SaveOutlined />}
                              onClick={() => handleSaveEdit(opt.id)}
                              disabled={
                                updateMutation.isPending || !editingText.trim()
                              }
                              loading={updateMutation.isPending}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Cancel editing" placement="top">
                            <Button
                              icon={<CloseOutlined />}
                              onClick={handleCancelEdit}
                              disabled={updateMutation.isPending}
                              size="small"
                            />
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit option" placement="top">
                            <Button
                              type="default"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(opt.id, opt.title)}
                              disabled={editingId !== null}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Delete option" placement="top">
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(opt.id, opt.title)}
                              disabled={editingId !== null}
                              size="small"
                            />
                          </Tooltip>
                        </>
                      )}
                    </Space>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Option"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Yes, Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deleteMutation.isPending,
          icon: <DeleteOutlined />,
        }}
        cancelButtonProps={{
          disabled: deleteMutation.isPending,
        }}
        closable={!deleteMutation.isPending}
        maskClosable={!deleteMutation.isPending}
        keyboard={!deleteMutation.isPending}
      >
        <Space direction="vertical" className="w-100">
          <Text>
            Are you sure you want to delete{" "}
            <Text strong>"{deletingItem?.title}"</Text>?
          </Text>
          <Alert
            message="This action cannot be undone"
            type="warning"
            showIcon
          />
        </Space>
      </Modal>

      {/* FAQ Admin component */}
      {type === "faq" && (
        <div className="mt-4">
          <FAQAdmin options={options} />
        </div>
      )}
    </>
  );
};

export default DynamicOptions;

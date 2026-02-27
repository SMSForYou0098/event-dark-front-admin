import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Form, Input, Table, Space, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';
import Utils from 'utils';

const SytemVariables = () => {
  const { authToken, api } = useMyContext();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Only essential states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
  const [copiedRowId, setCopiedRowId] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Fetch system variables with React Query
  const { data: SystemVars = [], isLoading } = useQuery({
    queryKey: ['systemVariables'],
    queryFn: async () => {
      const response = await axios.get(`${api}system-variables`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return response.data?.systemData || response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const url = isEditing
        ? `${api}system-variables-update/${editId}`
        : `${api}system-variables-store`;

      return await axios.post(url, values, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemVariables'] });
      message.success(
        `System variable ${isEditing ? 'updated' : 'created'} successfully`
      );
      handleCloseModal();
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await axios.delete(`${api}system-variables-destroy/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemVariables'] });
      message.success('System variable deleted successfully');
      cancelDeleteModal();
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error));
    },
  });

  const fallbackCopyTextToClipboard = (text, id) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedRowId(id)
        setTimeout(() => setCopiedRowId(null), 3000);
        message.success('Key copied to clipboard');
      } else {
        message.error('Copy failed');
      }
    } catch (err) {
      message.error('Copy not supported');
    }

    document.body.removeChild(textArea);
  };

  const handleCopy = (record) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(record.key).then(() => {
        setCopiedRowId(record.id);
        message.success('Key copied to clipboard');
        setTimeout(() => setCopiedRowId(null), 3000);
      }).catch(() => {
        fallbackCopyTextToClipboard(record.key, record.id);
      });
    } else {
      fallbackCopyTextToClipboard(record.key, record.id);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setIsEditing(true);
    setShowModal(true);
    form.setFieldsValue({
      key: item.key,
      value: item.value,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      saveMutation.mutate(values);
    } catch (error) {
      // Validation error
    }
  };

  const showDeleteModalHandler = (id) => {
    setDeleteModal({ visible: true, id });
  };

  const cancelDeleteModal = () => {
    setDeleteModal({ visible: false, id: null });
  };

  const confirmDelete = async () => {
    deleteMutation.mutate(deleteModal.id);
  };

  // Memoized filtered data for better performance
  const filteredData = useMemo(() => {
    if (!searchText) return SystemVars;

    const searchLower = searchText.toLowerCase();
    return SystemVars.filter((item) =>
      item.key?.toLowerCase().includes(searchLower) ||
      item.value?.toLowerCase().includes(searchLower)
    );
  }, [SystemVars, searchText]);

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key.localeCompare(b.key),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      sorter: (a, b) => a.value.localeCompare(b.value),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      align: 'left',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => showDeleteModalHandler(record.id)}
            />
          </Tooltip>
          <Tooltip title="Copy Key">
            <Button
              size="small"
              disabled={copiedRowId === record.id}
              icon={
                copiedRowId === record.id ? <CheckOutlined /> : <CopyOutlined />
              }
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Are you sure?"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={cancelDeleteModal}
        okText="Yes, delete it!"
        cancelText="Cancel"
        confirmLoading={deleteMutation.isPending}
        centered
        okButtonProps={{ danger: true }}
      >
        <p>You won't be able to revert this!</p>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        title={`${isEditing ? 'Edit' : 'Add New'} System Variable`}
        open={showModal}
        onCancel={handleCloseModal}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={saveMutation.isPending} onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} >
          <Form.Item
            label="Key"
            name="key"
            rules={[
              { required: true, message: 'Please enter key' },
              { whitespace: true, message: 'Key cannot be empty' },
            ]}
          >
            <Input placeholder="Enter key" />
          </Form.Item>
          <Form.Item
            label="Value"
            name="value"
            rules={[
              { required: true, message: 'Please enter value' },
              { whitespace: true, message: 'Value cannot be empty' },
            ]}
          >
            <Input placeholder="Enter value" />
          </Form.Item>
        </Form>
      </Modal>

      <Card
        title="System Variables"
        extra={
          <Space size="small" style={{ width: '100%' }}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '140px',
              }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowModal(true)}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} variables`,
          }}
          scroll={{ x: 600 }}
        />
      </Card>
    </>
  );
};

export default SytemVariables;
import React, { useState } from 'react';
import { Card, Button, Modal, Form, Input, Table, Space, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';

const SytemVariables = () => {
  const { SystemVars, GetSystemVars, authToken, api } = useMyContext();
  const [form] = Form.useForm();

  // Only essential states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState(null);

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
      setLoading(true);

      const url = isEditing
        ? `${api}system-variables-update/${editId}`
        : `${api}system-variables-store`;

      const response = await axios.post(url, values, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 || response.status === 201) {
        message.success(
          `System variable ${isEditing ? 'updated' : 'created'} successfully`
        );
        handleCloseModal();
        await GetSystemVars();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Error saving system variable';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showDeleteModalHandler = (id) => {
    setDeleteModal({ visible: true, id });
  };

  const cancelDeleteModal = () => {
    setDeleteModal({ visible: false, id: null });
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axios.delete(`${api}system-variables-destroy/${deleteModal.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.status) {
        await GetSystemVars();
        message.success('System variable deleted successfully');
        cancelDeleteModal();
      } else {
        message.error('Error deleting system variable');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error deleting system variable');
    } finally {
      setDeleteLoading(false);
    }
  };

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
      width: 120,
      align: 'center',
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
        confirmLoading={deleteLoading}
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
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowModal(true)}
          >
            Add New Variable
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={SystemVars}
          rowKey="id"
          pagination={{
            pageSize: 10,
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

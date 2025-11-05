import React, { memo, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Form, Input, Select, Button, Space, Tag, message, Row, Col } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import apiClient from 'auth/FetchInterceptor';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from 'views/events/common/DataTable';

const { confirm } = Modal;
const { Option } = Select;

const Promocode = memo(() => {
  const { UserData } = useMyContext();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch promocodes using TanStack Query
  const {
    data: promocodes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['promocodes', UserData?.id],
    queryFn: async () => {
      const response = await apiClient.get(`promo-list/${UserData?.id}`);
      return response?.promoCodes?.reverse() || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!UserData?.id,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const endpoint = editingId ? 'promo-update' : 'promo-store';
      const method = editingId ? 'put' : 'post';
      const data = {
        ...values,
        status: values.status ? 1 : 0,
        ...(editingId && { id: editingId }),
      };
      return await apiClient[method](endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promocodes', UserData?.id]);
      message.success(
        `Promocode ${editingId ? 'updated' : 'created'} successfully!`
      );
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error saving promocode:', error);
      message.error('Failed to save promocode');
    },
  });

  // Delete mutation
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiClient.delete(`promo-destroy/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries(['promocodes', UserData?.id]);
      message.success('Promocode deleted successfully!');
      // Close modal if the deleted item was being edited
      if (editingId === deletedId) {
        handleCloseModal();
      }
    },
    onError: (error) => {
      console.error('Error deleting promocode:', error);
      message.error('Failed to delete promocode');
    },
  });

  // Handle modal open for create/edit
  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        code: record.code,
        description: record.description,
        discount_type: record.discount_type,
        discount_value: record.discount_value,
        minimum_spend: record.minimum_spend,
        usage_limit: record.usage_limit,
        usage_per_user: record.usage_per_user,
        status: record.status === 1,
      });
    }
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  // Handle form submit
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      saveMutation.mutate(values);
    });
  };

  // Handle delete with confirmation
  const handleDelete = (id) => {
    confirm({
      title: 'Are you sure?',
      icon: <ExclamationCircleOutlined />,
      content: "You won't be able to revert this!",
      okText: 'Yes, delete it!',
      cancelText: 'Cancel',
      onOk() {
        deleteMutation.mutate(id);
      },
    });
  };

  // Define columns
  const columns = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        align: 'center',
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        align: 'center',
        searchable: true,
        sorter: (a, b) => a.code.localeCompare(b.code),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        align: 'center',
        searchable: true,
        ellipsis: true,
      },
      {
        title: 'Discount Type',
        dataIndex: 'discount_type',
        key: 'discount_type',
        align: 'center',
        filters: [
          { text: 'Percentage', value: 'percentage' },
          { text: 'Fixed', value: 'fixed' },
        ],
        onFilter: (value, record) => record.discount_type === value,
        render: (type) => (
          <Tag color={type === 'percentage' ? 'blue' : 'green'}>
            {type?.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Discount Value',
        dataIndex: 'discount_value',
        key: 'discount_value',
        align: 'center',
        sorter: (a, b) => a.discount_value - b.discount_value,
      },
      {
        title: 'Minimum Spend',
        dataIndex: 'minimum_spend',
        key: 'minimum_spend',
        align: 'center',
        sorter: (a, b) => a.minimum_spend - b.minimum_spend,
      },
      {
        title: 'Usage Limit',
        dataIndex: 'usage_limit',
        key: 'usage_limit',
        align: 'center',
        sorter: (a, b) => a.usage_limit - b.usage_limit,
      },
      {
        title: 'Remaining Limit',
        dataIndex: 'remaining_count',
        key: 'remaining_count',
        align: 'center',
        sorter: (a, b) => a.remaining_count - b.remaining_count,
        render: (count) => (
          <Tag color={count > 10 ? 'success' : count > 0 ? 'warning' : 'error'}>
            {count}
          </Tag>
        ),
      },
      {
        title: 'Usage Per User',
        dataIndex: 'usage_per_user',
        key: 'usage_per_user',
        align: 'center',
        sorter: (a, b) => a.usage_per_user - b.usage_per_user,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 100,
        filters: [
          { text: 'Active', value: 1 },
          { text: 'Inactive', value: 0 },
        ],
        onFilter: (value, record) => record.status === value,
        render: (status) => (
          <Tag color={status === 1 ? 'success' : 'error'}>
            {status === 1 ? 'Active' : 'Inactive'}
          </Tag>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        width: 120,
        render: (_, record) => (
          <Space size="small">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              title="Edit"
              size="small"
            />
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              loading={deleteMutation.isPending}
              title="Delete"
              size="small"
            />
          </Space>
        ),
      },
    ],
    [deleteMutation.isPending]
  );

  return (
    <>
      {/* Create/Edit Modal */}
      <Modal
        title={editingId ? 'Update Promocode' : 'Add New Promocode'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        width={800}
        footer={[
          <Button key="cancel" danger onClick={handleCloseModal}>
            Discard Changes
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saveMutation.isPending}
            onClick={handleSubmit}
          >
            Save
          </Button>,
        ]}
        centered
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Code"
                name="code"
                rules={[{ required: true, message: 'Please enter promo code!' }]}
                normalize={(value) => value?.toUpperCase()}
              >
                <Input
                  className='text-upper'
                  placeholder="Enter promo code"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: 'Please enter description!' }]}
              >
                <Input placeholder="Enter description" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Discount Type"
                name="discount_type"
                rules={[{ required: true, message: 'Please select discount type!' }]}
              >
                <Select placeholder="Select discount type">
                  <Option value="percentage">Percentage</Option>
                  <Option value="fixed">Fixed</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Discount Value"
                name="discount_value"
                rules={[{ required: true, message: 'Please enter discount value!' }]}
              >
                <Input type="number" placeholder="Enter discount value" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Minimum Spend"
                name="minimum_spend"
                rules={[{ required: true, message: 'Please enter minimum spend!' }]}
              >
                <Input type="number" placeholder="Enter minimum spend" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Usage Limit"
                name="usage_limit"
                rules={[{ required: true, message: 'Please enter usage limit!' }]}
              >
                <Input type="number" placeholder="Enter usage limit" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Usage Per User"
                name="usage_per_user"
                rules={[{ required: true, message: 'Please enter usage per user!' }]}
              >
                <Input type="number" placeholder="Enter usage per user" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status!' }]}
                initialValue={true}
              >
                <Select placeholder="Select status">
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* DataTable */}
      <DataTable
        title="Promo Codes"
        data={promocodes}
        columns={columns}
        loading={isLoading}
        error={error}
        showRefresh
        onRefresh={refetch}
        enableExport
        exportRoute="export-promocode"
        ExportPermission={true}
        emptyText="No promo codes found"
        enableSearch
        showSearch
        extraHeaderContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Add New
          </Button>
        }
        tableProps={{
          bordered: false,
        }}
      />
    </>
  );
});

Promocode.displayName = 'Promocode';
export default Promocode;
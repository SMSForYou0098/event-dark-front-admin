import React, { useState } from 'react';
import {
  Button,
  Space,
  Tooltip,
  message,
  Modal,
  Tag,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  useBanners,
  useDeleteBanner,
} from '../hooks/useBanners';
import BannerForm from './BannerForm';
import DataTable from 'views/events/common/DataTable';

const BannerList = () => {
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
  const [bannerModal, setBannerModal] = useState({
    visible: false,
    mode: 'create',
    id: null,
    data: null
  });

  // Fetch banners
  const { data: bannersData = [], isLoading, refetch, error } = useBanners();

  // Delete mutation
  const { mutate: deleteBanner, isPending: isDeleting } = useDeleteBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banner deleted successfully');
      cancelDeleteModal();
      refetch();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to delete banner');
    },
  });

  // Handle delete modal
  const showDeleteModal = (id) => {
    setDeleteModal({ visible: true, id });
  };

  const cancelDeleteModal = () => {
    setDeleteModal({ visible: false, id: null });
  };

  const confirmDelete = () => {
    deleteBanner(deleteModal.id);
  };

  // Handle banner modal (create/edit)
  const showCreateModal = () => {
    setBannerModal({ visible: true, mode: 'create', id: null, data: null });
  };

  const showEditModal = (record) => {
    setBannerModal({
      visible: true,
      mode: 'edit',
      id: record.id,
      data: record
    });
  };

  const closeBannerModal = () => {
    setBannerModal({ visible: false, mode: 'create', id: null, data: null });
  };

  // Handle banner form success
  const handleBannerSuccess = () => {
    closeBannerModal();
    refetch();
  };

  // Table columns
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      width: 120,
      render: (image) => (
        <Image
          src={image}
          alt="Banner"
          width={80}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{
            mask: <EyeOutlined />,
          }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      searchable: true,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type) => {
        const colorMap = {
          main: 'blue',
          organization: 'green',
          category: 'purple',
        };
        return (
          <Tag color={colorMap[type] || 'default'}>
            {type ? type.toUpperCase() : '-'}
          </Tag>
        );
      },
      filters: [
        { text: 'Main', value: 'main' },
        { text: 'Organization', value: 'organization' },
        { text: 'Category', value: 'category' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Category',
      dataIndex: ['category', 'title'],
      key: 'category',
      render: (categoryTitle) => categoryTitle || '-',
    },
    // {
    //   title: 'Event Key',
    //   dataIndex: 'event_key',
    //   key: 'event_key',
    //   searchable: true,
    //   render: (key) => key ? <Tag>{key}</Tag> : '-',
    // },
    // {
    //   title: 'Event ID',
    //   dataIndex: 'event_id',
    //   key: 'event_id',
    //   width: 100,
    //   render: (id) => id || '-',
    // },
    {
      title: 'Button Text',
      dataIndex: 'button_text',
      key: 'button_text',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          {text ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : '-'}
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => showDeleteModal(record.id)}
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
        title="Delete Banner"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={cancelDeleteModal}
        okText="Yes, delete it!"
        cancelText="Cancel"
        confirmLoading={isDeleting}
        centered
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this banner? You won't be able to revert this!</p>
      </Modal>

      {/* Banner Form Modal */}

        <BannerForm
          mode={bannerModal.mode}
          id={bannerModal.id}
          bannerData={bannerModal.data}
          onSuccess={handleBannerSuccess}
          onCancel={closeBannerModal}
          visible={bannerModal.visible}
        />

      {/* DataTable */}
      <DataTable
        title="Banners Management"
        data={bannersData}
        columns={columns}
        loading={isLoading}
        error={error}
        showRefresh={true}
        onRefresh={refetch}
        showSearch={true}
        enableSearch={true}
        emptyText="No banners found"
        extraHeaderContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            New Banner
          </Button>
        }
        tableProps={{
          rowKey: 'id',
          scroll: { x: 1400 },
        }}
      />
    </>
  );
};

export default BannerList;
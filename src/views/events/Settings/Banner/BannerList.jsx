import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tooltip,
  message,
  Modal,
  Tag,
  Image,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  useBanners,
  useDeleteBanner,
  useRearrangeBanner,
} from '../hooks/useBanners';

const DraggableRow = ({ index, moveRow, className, style, ...restProps }) => {
  const ref = React.useRef(null);
  
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: 'DraggableRow',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      dropClassName: monitor.isOver() ? 'drop-over' : '',
    }),
    drop: (item) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'DraggableRow',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(drag(ref));

  return (
    <tr
      ref={ref}
      className={`${className} ${isOver ? dropClassName : ''}`}
      style={{
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        ...style,
      }}
      {...restProps}
    />
  );
};

const BannerList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
  const [dataSource, setDataSource] = useState([]);

  // Fetch banners
  const { data: bannersData = [], isLoading, refetch } = useBanners();

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

  // Rearrange mutation
  const { mutate: rearrangeBanner, isPending: isRearranging } = useRearrangeBanner({
    onSuccess: (res) => {
      message.success(res?.message || 'Banners rearranged successfully');
      refetch();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to rearrange banners');
    },
  });

  // Filter banners by type
  const filteredBanners = useMemo(() => {
    const filtered = bannersData.filter(banner => {
      if (activeTab === 'main') {
        return !banner.event_id; // Main banners don't have event_id
      } else {
        return banner.event_id; // Category banners have event_id
      }
    });
    
    setDataSource(filtered);
    return filtered;
  }, [bannersData, activeTab]);

  // Handle row move
  const moveRow = (dragIndex, hoverIndex) => {
    const dragRow = dataSource[dragIndex];
    const newData = [...dataSource];
    newData.splice(dragIndex, 1);
    newData.splice(hoverIndex, 0, dragRow);
    setDataSource(newData);
  };

  // Save new order
  const handleSaveOrder = () => {
    const orderedBanners = dataSource.map((banner, index) => ({
      id: banner.id,
      order: index + 1,
    }));

    rearrangeBanner({
      type: activeTab,
      banners: orderedBanners,
    });
  };

  // Check if order changed
  const isOrderChanged = useMemo(() => {
    if (dataSource.length !== filteredBanners.length) return true;
    
    return dataSource.some((item, index) => item.id !== filteredBanners[index]?.id);
  }, [dataSource, filteredBanners]);

  // Handle delete
  const showDeleteModal = (id) => {
    setDeleteModal({ visible: true, id });
  };

  const cancelDeleteModal = () => {
    setDeleteModal({ visible: false, id: null });
  };

  const confirmDelete = () => {
    deleteBanner(deleteModal.id);
  };

  // Table columns
  const columns = [
    {
      title: <DragOutlined />,
      key: 'drag',
      width: 50,
      align: 'center',
      render: () => <DragOutlined style={{ cursor: 'move' }} />,
    },
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
      width: 100,
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
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category || '-',
    },
    ...(activeTab === 'category' ? [{
      title: 'Event',
      dataIndex: 'event_name',
      key: 'event_name',
      render: (name) => name || '-',
    }] : []),
    {
      title: 'Button',
      key: 'button',
      render: (_, record) => (
        record.button_text ? (
          <Tag color="blue">{record.button_text}</Tag>
        ) : '-'
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/settings/banner/edit/${record.id}`)}
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

  const tabItems = [
    {
      key: 'main',
      label: 'Main Banners',
    },
    {
      key: 'category',
      label: 'Category Banners',
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
        confirmLoading={isDeleting}
        centered
        okButtonProps={{ danger: true }}
      >
        <p>You won't be able to revert this!</p>
      </Modal>

      <Card
        title="Banners"
        extra={
          <Space>
            {isOrderChanged && (
              <Button
                type="primary"
                onClick={handleSaveOrder}
                loading={isRearranging}
              >
                Save Order
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/settings/banner/create')}
            >
              New Banner
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
        />

        <DndProvider backend={HTML5Backend}>
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} banners`,
            }}
            components={{
              body: {
                row: DraggableRow,
              },
            }}
            onRow={(record, index) => ({
              index,
              moveRow,
            })}
            scroll={{ x: 800 }}
          />
        </DndProvider>
      </Card>
    </>
  );
};

export default BannerList;
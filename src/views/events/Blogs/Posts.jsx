import React from 'react';
import { Button, Space, Image, Tag, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import dayjs from 'dayjs';
import api from 'auth/FetchInterceptor';

const Posts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const response = await api.get('blog-list');
      if (response?.status && Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error('Invalid response format.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`blog-destroy/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      message.success('The blog post has been deleted.');
    },
    onError: () => {
      message.error('Failed to delete the post.');
    },
  });

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure?',
      content: 'This action will permanently delete the blog post.',
      okText: 'Yes, delete it!',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      render: (thumbnail) => (
        <Image
          src={thumbnail}
          alt="thumbnail"
          width={80}
          height={60}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          preview
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      searchable: true,
      render: (text) => <span className="font-weight-semibold">{text}</span>,
    },
    {
      title: 'Author',
      dataIndex: ['user_data', 'name'],
      key: 'author',
      searchable: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'orange'}>
          {status === 1 ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`update/${record.id}`)}
            size="small"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        title="All Blog Posts"
        data={posts}
        columns={columns}
        loading={loading}
        error={error}
        showRefresh={true}
        onRefresh={refetch}
        showSearch={true}
        enableSearch={true}
        emptyText="No blog posts found"
        extraHeaderContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('new')}
          >
            Create Post
          </Button>
        }
        tableProps={{
          rowKey: 'id',
        }}
      />
    </div>
  );
};

export default Posts;
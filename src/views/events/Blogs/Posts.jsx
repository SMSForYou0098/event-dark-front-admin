import React, { useEffect, useState } from 'react';
import { Button, Space, Image, Tag, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useMyContext } from '../../../Context/MyContextProvider';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import dayjs from 'dayjs';

const Posts = () => {
  const { authToken, api } = useMyContext();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${api}blog-list`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data?.status && Array.isArray(response.data.data)) {
        setPosts(response.data.data);
      } else {
        setError({ message: 'Invalid response format.' });
      }
    } catch (err) {
      console.error(err);
      setError({ 
        message: err.response?.data?.message || 'Failed to fetch blog posts.' 
      });
      message.error(err.response?.data?.message || 'Failed to fetch blog posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure?',
      content: 'This action will permanently delete the blog post.',
      okText: 'Yes, delete it!',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`${api}blog-destroy/${id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          const updated = posts.filter((post) => post.id !== id);
          setPosts(updated);
          message.success('The blog post has been deleted.');
        } catch (err) {
          console.error(err);
          message.error('Failed to delete the post.');
        }
      },
    });
  };

  useEffect(() => {
    getData();
  }, []);

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
            onClick={() => navigate(`/blogs/update/${record.id}`)}
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
        onRefresh={getData}
        showSearch={true}
        enableSearch={true}
        emptyText="No blog posts found"
        extraHeaderContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/blogs/new')}
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
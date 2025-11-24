import React, { useEffect, useState } from 'react';
import { Space, Button, Tooltip, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';
import DataTable from 'views/events/common/DataTable';
import { useNavigate } from 'react-router-dom';

const Layouts = () => {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch theatre layouts from API
  const fetchLayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('layouts/theatre');
      // Assuming response is the data directly (based on FetchInterceptor)
      const data = Array.isArray(response) ? response : response?.data || [];
      // Add unique keys for table rows
      const layoutsWithKeys = data.map((layout, index) => ({
        ...layout,
        key: layout.id || layout._id || index
      }));
      setLayouts(layoutsWithKeys);
    } catch (err) {
      setError(err);
      console.error('Error fetching layouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`layouts/theatre/${id}`);
      fetchLayouts();
      message.success('Layout deleted successfully');
    } catch (err) {
      setError(err);
      console.error('Error deleting layout:', err);
    } finally {
      setLoading(false);
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      searchable: true,
      width: 80,
    },
    {
      title: 'Venue Name',
      dataIndex: ['venue', 'name'],
      key: 'venue_name',
      searchable: true,
      render: (text) => <span className="font-weight-bold">{text || 'N/A'}</span>,
    },
    {
      title: 'Total Row',
      dataIndex: 'total_row',
      key: 'total_row',
      width: 120,
      render: (row) => row || 0,
    },
    {
      title: 'Total Seats',
      dataIndex: 'total_seat',
      key: 'total_seat',
      width: 120,
      render: (seat) => seat || 0,
    },
    // {
    //   title: 'Status',
    //   dataIndex: 'status',
    //   key: 'status',
    //   width: 120,
    //   render: (status) => {
    //     const statusConfig = {
    //       active: { color: 'green', text: 'Active' },
    //       inactive: { color: 'red', text: 'Inactive' },
    //       draft: { color: 'orange', text: 'Draft' },
    //     };
    //     const config = statusConfig[status?.toLowerCase()] || { color: 'default', text: status || 'Unknown' };
    //     return <Tag color={config.color}>{config.text}</Tag>;
    //   },
    // },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="manage">
            <Button
              icon={<SettingOutlined />}
              size="small"
              onClick={() => navigate(`/theatre/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type='primary'
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <DataTable
      title="Theatre Layouts"
      data={layouts}
      columns={columns}
      loading={loading}
      error={error}
      showRefresh={true}
      extraHeaderContent={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/theatre/new')}>
          New Layout
        </Button>
      }
      onRefresh={fetchLayouts}
      enableSearch={true}
      showSearch={true}
      emptyText="No theatre layouts found"
    />
  );
};

export default Layouts;
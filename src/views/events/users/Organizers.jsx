import React, { useCallback, useState } from 'react';
import { Button, Card, Row, Col, Tag, message } from 'antd';
import { User, Mail, LogIn, PlusIcon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { authenticated, updateUser, logout } from '../../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { persistor } from 'store';
import PermissionChecker from 'layouts/PermissionChecker';

const Organizers = () => {
  const { 
    api: apiUrl, 
    UserPermissions, 
    authToken, 
    auth_session, 
    session_id,
    formatDateTime
  } = useMyContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);

  // Fetch organizers with React Query
  const fetchOrganizers = async () => {
    const params = new URLSearchParams();
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      params.set('start_date', dateRange.startDate);
      params.set('end_date', dateRange.endDate);
    } else {
      params.set('type', 'all');
    }
    const url = `organizers?${params.toString()}`;
    const response = await api.get(url);
    if (!response.status) {
      throw new Error('Failed to fetch organizers');
    }
    return response.data || [];
  };

  const { 
    data: organizers = [], 
    isLoading: organizersLoading, 
    error: organizersError,
    refetch: refetchOrganizers 
  } = useQuery({
    queryKey: ['organizers', { dateRange }],
    queryFn: fetchOrganizers,
    enabled: !!authToken && !!apiUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: "ifStale",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    onError: (err) => {
      setError(err.response?.data?.error || err.message || "Failed to fetch organizers");
      message.error(err.response?.data?.error || err.message || "Failed to fetch organizers");
    }
  });

  // Impersonate login mutation
  const impersonateMutation = useMutation({
    mutationFn: async (userId) => {
      if (!session_id || !auth_session) {
        throw new Error("Session expired. Please login again.");
      }
      const response = await api.post(
        `impersonate`,
        { session_id, auth_session: `${auth_session}`, user_id: userId }
      );
      if (!response.status) {
        throw new Error(response?.error || "Login failed.");
      }
      return response;
    },
    onSuccess: (data) => {
      dispatch(authenticated({
        token: data.token,
        user: data.user,
        session_id: data.session_id,
        auth_session: data.auth_session,
        isImpersonating: true,
      }));
      dispatch(updateUser(data.user));
      message.success("Logged in successfully");
      navigate("/dashboard");
    },
    onError: (err) => {
      if (err.message === "Session expired. Please login again.") {
        dispatch(logout());
        persistor.purge();
        navigate('/sign-in');
      }
      setError(err.response?.data?.error || err.message || "Unexpected error occurred");
      message.error(err.response?.data?.error || err.message || "Unexpected error occurred");
    }
  });

  const impersonateLogin = useCallback((id) => {
    impersonateMutation.mutate(id);
  }, [impersonateMutation]);

  const oneClickLogin = useCallback((id) => {
    impersonateMutation.mutate(id);
  }, [impersonateMutation]);

  const handleNavigate = () => {
    navigate('/dashboard/users/new?type=Organizer');
  };

  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates ? {
      startDate: dates[0].format('YYYY-MM-DD'),
      endDate: dates[1].format('YYYY-MM-DD')
    } : null);
  }, []);

  const handleRefresh = () => {
    refetchOrganizers();
  };

  const formatOrganizerData = (organizers) => {
    return organizers.map(organizer => ({ 
      ...organizer, 
      key: organizer.id 
    }));
  };

  const CustomTooltip = ({ text, children }) => (
    <span title={text}>{children}</span>
  );

  const baseColumns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      render: (_, __, index) => index + 1,
      searchable: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name?.localeCompare(b.name),
      searchable: true,
      render: (name) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <User size={16} className="text-primary" />
          <span>{name}</span>
        </div>
      )
    },
    {
      title: 'Contact',
      dataIndex: 'number',
      key: 'number',
      searchable: true,
      render: (number) => number || 'N/A'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      searchable: true,
      render: (email) => email ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <Mail size={16} className="text-primary" />
          <span>{email}</span>
        </div>
      ) : 'N/A'
    },
    // {
    //   title: 'Created At',
    //   dataIndex: 'created_at',
    //   key: 'created_at',
    //   sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    //   render: (date) => formatDateTime ? formatDateTime(date) : new Date(date).toLocaleDateString(),
    //   searchable: false,
    // },
  ];

  const actionColumns = [];

  actionColumns.push({
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <PermissionChecker permission="Impersonet">
          <Button
            type="primary"
            icon={<LogIn size={14} />}
            onClick={() => impersonateLogin(record.id)}
            loading={impersonateMutation.isLoading}
            disabled={impersonateMutation.isLoading || record?.status === "0" || record?.status === 0}
            size="small"
          />
        </PermissionChecker>
        <PermissionChecker permission="Update Organizer">
          <Button
            type="default"
            icon={<Settings size={14} />}
            onClick={() => navigate(`/dashboard/organizers/manage/${record.id}`)}
            size="small"
          />
        </PermissionChecker>
      </div>
    ),
  });

  const columns = [...baseColumns, ...actionColumns];

  return (
    <>
      <DataTable
        title="Organizers Management"
        data={formatOrganizerData(organizers)}
        columns={columns}
        showDateRange={true}
        showRefresh={true}
        showTotal={true}
        showAddButton={false}
        addButtonProps={null}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        enableExport={true}
        exportRoute={'export-organizers'}
        ExportPermission={UserPermissions?.includes("Export Organizers")}
        authToken={authToken}
        loading={organizersLoading || impersonateMutation.isLoading}
        error={organizersError || error}
        onRefresh={handleRefresh}
        tableProps={{
          scroll: { x: 1200 },
          size: "middle",
        }}
      >
        <PermissionChecker permission="Add User">
          <Button
            type="primary"
            icon={<PlusIcon size={16} />}
            onClick={handleNavigate}
            style={{ marginBottom: 16 }}
          >
            New Organizer
          </Button>
        </PermissionChecker>
      </DataTable>
    </>
  );
};

export default Organizers;
import React, { useCallback, useState } from 'react';
import { Button, Card, Row, Col, Tag } from 'antd';
import { User, Mail, LogIn, PlusIcon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { authenticated, updateUser, logout } from '../../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { persistor } from 'store';

const Organizers = () => {
  // Context and hooks
  const { 
    api: apiUrl, 
    successAlert, 
    UserPermissions, 
    authToken, 
    auth_session, 
    session_id,
    ErrorAlert,
    formatDateTime
  } = useMyContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  // State
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
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    cacheTime: 5 * 60 * 1000,
    onError: (err) => {
      console.error('Organizers fetch error:', err);
      setError(err.response?.data?.error || err.message || "Failed to fetch organizers");
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
      successAlert("Success", "Logged in successfully");
      navigate("/dashboard");
    },
    onError: (err) => {
      if (err.message === "Session expired. Please login again.") {
        dispatch(logout());
        persistor.purge();
        navigate('/sign-in');
      }
      setError(err.response?.data?.error || err.message || "Unexpected error occurred");
      ErrorAlert && ErrorAlert(err.response?.data?.error || err.message || "Unexpected error occurred");
    }
  });

  // Impersonation handler
  const impersonateLogin = useCallback((id) => {
    impersonateMutation.mutate(id);
  }, [impersonateMutation]);

  // One Click Login handler (from your commented code)
  const oneClickLogin = useCallback((id) => {
    impersonateMutation.mutate(id);
  }, [impersonateMutation]);

  // Navigation handler
  const handleNavigate = () => {
    navigate('/dashboard/users/new?type=Organizer');
  };

  // Handle date range change
  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates ? {
      startDate: dates[0].format('YYYY-MM-DD'),
      endDate: dates[1].format('YYYY-MM-DD')
    } : null);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    refetchOrganizers();
  };

  // Format data for table
  const formatOrganizerData = (organizers) => {
    return organizers.map(organizer => ({ 
      ...organizer, 
      key: organizer.id 
    }));
  };

  // Custom tooltip component
  const CustomTooltip = ({ text, children }) => {
    return (
      <span title={text}>
        {children}
      </span>
    );
  };

  // Base columns definition
  const baseColumns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
    //   width: 60,
      render: (_, __, index) => index + 1,
      searchable: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    //   width: '15%',
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
    //   width: '12%',
      searchable: true,
      render: (number) => number || 'N/A'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '20%',
      searchable: true,
      render: (email) => email ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <Mail size={16} className="text-primary" />
          <span>{email}</span>
        </div>
      ) : 'N/A'
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '12%',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => formatDateTime ? formatDateTime(date) : new Date(date).toLocaleDateString(),
      searchable: false,
    },
  ];

  // Add action columns based on permissions
  const actionColumns = [];

  // Add impersonate action (from your commented code)
//   if (UserPermissions?.includes("Impersonet")) {
//     actionColumns.push({
//       title: 'Login',
//       key: 'login',
//       width: '10%',
//       render: (_, record) => (
//         <Button
//           type="primary"
//           icon={<LogIn size={14} />}
//           onClick={() => oneClickLogin(record.id)}
//           loading={impersonateMutation.isLoading}
//           disabled={impersonateMutation.isLoading || record?.status === "0" || record?.status === 0}
//           size="small"
//           title="Login as Organizer"
//         />
//       ),
//     });
//   }

  // Add impersonate action (from your uncommented code)
  if (UserPermissions?.includes("Impersonet")) {
    actionColumns.push({
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <CustomTooltip text="Login as Organizer">
            <Button
              type="primary"
              icon={<LogIn size={14} />}
              onClick={() => impersonateLogin(record.id)}
              loading={impersonateMutation.isLoading}
              disabled={impersonateMutation.isLoading || record?.status === "0" || record?.status === 0}
              size="small"
            />
          </CustomTooltip>
          <CustomTooltip text="Manage Organizer">
            <Button
              type="default"
              icon={<Settings size={14} />}
              onClick={() => navigate(`/dashboard/organizers/manage/${record.id}`)}
              size="small"
            />
          </CustomTooltip>
        </div>
      ),
    });
  }

  const columns = [...baseColumns, ...actionColumns];

  return (
<>

<DataTable
  title="Organizers Management"
  data={formatOrganizerData(organizers)}
  columns={columns}
  
  // Display controls
  showDateRange={true}
  showRefresh={true}
  showTotal={true}
  showAddButton={UserPermissions?.includes("Add User")}
  
  // Add button configuration
  addButtonProps={{
    text: 'New Organizer',
    onClick: handleNavigate,
    buttonProps: {
      icon: <PlusIcon size={16} />,
    }
  }}
  
  // Date range
  dateRange={dateRange}
  onDateRangeChange={handleDateRangeChange}
  
  // Export functionality
  enableExport={true}
  exportRoute={'export-organizers'}
  ExportPermission={UserPermissions?.includes("Export Organizers")}
  authToken={authToken}
  
  // Loading states
  loading={organizersLoading || impersonateMutation.isLoading}
  error={organizersError || error}
  
  // Refresh handler
  onRefresh={handleRefresh}
  
  // Table customization
  tableProps={{
    scroll: { x: 1200 },
    size: "middle",
  }}
/>
</>
  );
};

export default Organizers;
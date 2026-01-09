import React, { useCallback, useState } from 'react';
import { Button, message, Image, Tooltip, Modal } from 'antd';
import { User, Mail, LogIn, PlusIcon, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { authenticated, updateUser, logout } from '../../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { persistor } from 'store';
import PermissionChecker from 'layouts/PermissionChecker';
import { withAccess } from '../common/withAccess';

const Organizers = () => {
  const {
    api: apiUrl,
    UserPermissions,
    authToken,
    auth_session,
    session_id,
    loader,
    userRole
  } = useMyContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);
  const [mutationLoading, setMutationLoading] = useState(false);
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
      setMutationLoading(false);
    },
    onError: (err) => {
      if (err.message === "Session expired. Please login again.") {
        dispatch(logout());
        persistor.purge();
        navigate('/sign-in');
      }
      setError(err.response?.data?.error || err.message || "Unexpected error occurred");
      message.error(err.response?.data?.error || err.message || "Unexpected error occurred");
      setMutationLoading(false);
    }
  });

  const impersonateLogin = useCallback((id) => {
    setMutationLoading(true);
    impersonateMutation.mutate(id);
  }, [impersonateMutation]);


  const handleNavigate = () => {
    navigate('/users/new?type=Organizer');
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.delete(`user-delete/${userId}`);
      console.log("Delete response:", res);
      return res.data;
    },
    onSuccess: () => {
      refetchOrganizers();
      message.success("User Deleted successfully.");
      setMutationLoading(false);
    },
    onError: (err) => {
      message.error(
        err.response?.data?.message || err.message || "An error occurred"
      );
      setMutationLoading(false);
    },
  });

  const handleDelete = useCallback((id) => {
    if (!id) return;

    Modal.confirm({
      title: 'Are you sure?',
      content: "You won't be able to revert this!",
      okText: 'Yes, delete it!',
      cancelText: 'Cancel',
      centered: true,
      confirmLoading: mutationLoading,
      onOk: () => {
        setMutationLoading(true);
        deleteUserMutation.mutate(id);
      }
    });
  }, [deleteUserMutation, mutationLoading]);

  // Loading overlay for mutations
  const renderMutationLoader = () => {
    if (mutationLoading && impersonateMutation.isPending) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{ pointerEvents: 'auto', zIndex: 10001 }}>
            <Image
              src={loader}
              alt="loader"
              className="img-fluid bg-transparent shadow-none"
              style={{ height: '100px' }}
              preview={false}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  const baseColumns = [
    {
      title: '#',
      dataIndex: 'id',
      width: '50px',
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
  ];

  const actionColumns = [];

  actionColumns.push({
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: '150px',
    align: 'center',
    render: (_, record) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <PermissionChecker permission="Impersonet">
          {/* <Tooltip title="Impersonate User"> */}
          <Button
            type="primary"
            icon={<LogIn size={14} />}
            onClick={() => impersonateLogin(record.id)}
            loading={impersonateMutation.isPending}
            disabled={mutationLoading || record?.status === "0" || record?.status === 0}
            size="small"
          />
          {/* </Tooltip> */}
        </PermissionChecker>

        <PermissionChecker permission="Update User">
          <Tooltip title="Edit User">
            <Button
              type="default"
              icon={<Settings size={14} />}
              onClick={() => navigate(`/users/edit/${record.id}`)}
              size="small"
              disabled={mutationLoading}
            />
          </Tooltip>
        </PermissionChecker>

        <PermissionChecker permission="Delete User">
          <Tooltip title="Delete User">
            <Button
              type="default"
              icon={<Trash2 size={14} />}
              onClick={() => handleDelete(record.id)}
              size="small"
              disabled={mutationLoading}
            />
          </Tooltip>
        </PermissionChecker>

      </div>
    ),
  });

  const columns = [...baseColumns, ...actionColumns];

  return (
    <>
      {renderMutationLoader()}

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
        extraHeaderContent={
          <PermissionChecker permission="Add User">
            <Tooltip title={"Add Organizer"}>
              <Button
                type="primary"
                icon={<PlusIcon size={16} />}
                onClick={handleNavigate}
              />
            </Tooltip>
          </PermissionChecker>
        }
        enableExport={true}
        exportRoute={'export-organizers'}
        ExportPermission={userRole === "Admin" || UserPermissions?.includes("Export Organizers")}
        authToken={authToken}
        loading={organizersLoading || mutationLoading}
        error={organizersError || error}
        onRefresh={handleRefresh}
        tableProps={{
          scroll: { x: 1200 },
          size: "middle",
        }}
      />
    </>
  );
};

// export default Organizers;

// using HOC to prevent other users to access this component
export default withAccess({
  allowedRoles: ["Admin"],
})(Organizers);
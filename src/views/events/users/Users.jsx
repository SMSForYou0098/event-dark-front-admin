// Users.js
import React, { useCallback, useState } from "react";
import {
  Tag,
  Button,
  Space,
  Modal,
  Row,
  Col,
  Image,
  message,
  Tooltip,
  Card,
} from "antd";
import {
  Settings,
  LogIn,
  Trash2,
  PlusIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyContext } from "../../../Context/MyContextProvider";
import DataTable from "../common/DataTable";
import api from "auth/FetchInterceptor";
import { authenticated, logout, updateUser } from "store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { persistor } from "store";
import PermissionChecker from "layouts/PermissionChecker";
import { APP_PREFIX_PATH } from "configs/AppConfig";
import usePermission from "utils/hooks/usePermission";
import { roles } from "./constants";

const Users = () => {
  const navigate = useNavigate();
  const {
    UserPermissions,
    userRole,
    formatDateTime,
    auth_session,
    session_id,
    loader,
  } = useMyContext();
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);

  // Add state for modal
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({
    visible: false,
    userId: null,
  });

  const canUpdate = usePermission("Update User");
  const canDelete = usePermission("Delete User");
  const canImpersonate = usePermission("Impersonet");

  // Fetch users data
  const fetchUsers = async () => {
    const params = new URLSearchParams();

    if (dateRange && dateRange.startDate && dateRange.endDate) {
      params.set("start_date", dateRange.startDate);
      params.set("end_date", dateRange.endDate);
    } else {
      params.set("type", "all");
    }

    const url = `users?${params.toString()}`;
    const res = await api.get(url);

    const body = res ?? {};

    if (typeof body.status !== "undefined" && !body.status) {
      throw new Error(body.message || "API returned status=false");
    }

    const users =
      (Array.isArray(body.allData) && body.allData) ||
      (Array.isArray(body.data) && body.data) ||
      (Array.isArray(body.users) && body.users) ||
      (Array.isArray(body) && body) ||
      [];

    return users;
  };

  // Use query to fetch users
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users", { dateRange }],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "ifStale",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.delete(`user-delete/${userId}`);
      console.log("Delete response:", res);
      return res.data;
    },
    onSuccess: () => {
      refetchUsers();
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

  // Impersonate login mutation
  const impersonateMutation = useMutation({
    mutationFn: async (userId) => {
      if (!session_id || !auth_session) {
        throw new Error("Session expired. Please login again.");
      }
      const response = await api.post(`impersonate`, {
        session_id,
        auth_session: `${auth_session}`,
        user_id: userId,
      });
      if (!response.status) {
        throw new Error(response?.error || "Login failed.");
      }
      return response;
    },
    onSuccess: (data) => {
      dispatch(
        authenticated({
          token: data.token,
          user: data.user,
          session_id: data.session_id,
          auth_session: data.auth_session,
          isImpersonating: true,
        })
      );
      dispatch(updateUser(data.user));
      message.success("Logged in successfully");
      navigate("/dashboard");
      setMutationLoading(false);
    },
    onError: (err) => {
      if (err.message === "Session expired. Please login again.") {
        dispatch(logout());
        persistor.purge();
        navigate("/sign-in");
      }
      message.error(
        err.response?.data?.error || err.message || "Unexpected error occurred"
      );
      setMutationLoading(false);
    },
  });

  // Action handlers
  const handleAssignCredit = useCallback((id) => {
    const route = `edit/${id}`;
    console.log('Navigating to route:', route);
    console.log('Full URL will be:', window.location.origin + window.location.pathname + '/' + route);
    navigate(route);
  }, [navigate]);

  // Update handleDelete to use Ant Design Modal
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

  // Confirm deletion handler
  const confirmDeleteUser = () => {
    setMutationLoading(true);
    deleteUserMutation.mutate(confirmDeleteModal.userId);
    setConfirmDeleteModal({ visible: false, userId: null });
  };

  // Cancel deletion handler
  const cancelDeleteUser = () => {
    setConfirmDeleteModal({ visible: false, userId: null });
  };

  const handleImpersonate = useCallback(
    async (id) => {
      setMutationLoading(true);
      impersonateMutation.mutate(id);
    },
    [impersonateMutation]
  );

  // Handle date range change
  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(
      dates
        ? {
          startDate: dates[0].format("YYYY-MM-DD"),
          endDate: dates[1].format("YYYY-MM-DD"),
        }
        : null
    );
  }, []);

  // Role selection for Organizer

  const handleRoleSelect = (roleKey) => {
    setShowRoleModal(false);
    navigate(`new?type=${roleKey}`);
  };

  const handleAddUser = () => {
    if (userRole === "Organizer") {
      setShowRoleModal(true);
    } else {
      navigate(`new`);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchUsers();
  };

  // Custom tooltip component
  const CustomTooltip = ({ text, children }) => {
    return <span title={text}>{children}</span>;
  };

  // Columns definition
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "6%",
      render: (text, record, index) => index + 1,
      searchable: false,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name?.localeCompare(b.name),
      searchable: true,
    },
    ...(UserPermissions?.includes("View Contact") || userRole === "Admin"
      ? [
        {
          title: "Contact",
          dataIndex: "contact",
          key: "contact",
          searchable: true,
          render: (cell) => {
            const contactStr = cell?.toString() || "";
            const masked =
              contactStr.length > 5 ? "**" + contactStr.slice(5) : "**";
            return <CustomTooltip text={contactStr}>{masked}</CustomTooltip>;
          },
        },
      ]
      : []),
    ...(userRole === "Admin" || UserPermissions?.includes("View Email")
      ? [
        {
          title: "Email",
          dataIndex: "email",
          key: "email",
          searchable: true,
          render: (email) => {
            if (!email) return "N/A";
            const firstChar = email.charAt(0);
            const lastChar = email.charAt(email.length - 1);
            const maskedEmail = `${firstChar}...${lastChar}`;
            return <CustomTooltip text={email}>{maskedEmail}</CustomTooltip>;
          },
        },
      ]
      : []),
    {
      title: "Authentication",
      dataIndex: "authentication",
      key: "authentication",
      render: (cell) => (parseInt(cell) === 1 ? "Password" : "OTP"),
      searchable: false,
    },
    {
      title: 'Role',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (role, record) => {
        const roleColors = {
          'User': 'red',
          'Admin': 'magenta',
          'Organizer': 'blue',
          'POS': 'green',
          'Agent': 'cyan',
          'Scanner': 'purple',
          'Support-Executive': 'orange',
          'Shop-Keeper': 'gold',
          'Box-Office-Manager': 'geekblue',
          'Sponsor': 'volcano',
          'Sub Admin': 'red',
          'Accreditation': 'lime'
        };

        const roleColor = roleColors[record.role_name] || 'default';

        return (
          <span>
            {Array.isArray(role) ? (
              role.map((roleName, index) => (
                <Tag color={roleColors[roleName] || 'default'} key={index}>
                  {roleName}
                </Tag>
              ))
            ) : (
              <Tag color={roleColor}>
                {record.role_name || 'N/A'}
              </Tag>
            )}
          </span>
        );
      }
    },
    // {
    //   title: 'Tags',
    //   render: tags => (
    //     <span>
    //       <Tag color={'geekblue'} >
    //         {'okay'}
    //       </Tag>
    //     </span>
    //   )
    // },
    ...(userRole === "Admin"
      ? [
        {
          title: "Organisation",
          dataIndex: "organisation",
          key: "organisation",
          searchable: true,
          render: (org) => org || "N/A",
        },
      ]
      : []),
    ...(userRole === "Admin" || userRole === "Organizer"
      ? [
        {
          title: "Reporting User",
          dataIndex: "reporting_user",
          key: "reporting_user",
          searchable: true,
          render: (user) => user || "N/A",
        },
      ]
      : []),
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: "12%",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (cell) => formatDateTime(cell),
      searchable: false,
    },
    // Actions column
    ...(canUpdate || canDelete || canImpersonate || userRole === "Admin"
      ? [
        {
          title: "Actions",
          key: "actions",
          fixed: "right",
          width: 150,
          render: (_, record) => {
            const isDisabled = record?.is_deleted || record?.status === "1";

            const actions = [
              {
                permission: "Update User",
                tooltip: "Manage User",
                icon: <Settings size={14} />,
                onClick: () => handleAssignCredit(record.id),
                type: "default",
              },
              {
                permission: "Delete User",
                tooltip: "Delete User",
                icon: <Trash2 size={14} />,
                onClick: () => handleDelete(record.id),
                type: "default",
                danger: true,
                loading: deleteUserMutation.isPending,
              },
              {
                permission: "Impersonet",
                tooltip: `Login as ${record.name}`,
                icon: <LogIn size={14} />,
                onClick: () => handleImpersonate(record.id),
                type: "primary",
                loading: impersonateMutation.isPending,
              }
            ];

            return (
              <div className="action-btn">
                <Space>
                  {actions.map((action, index) => (
                    <PermissionChecker key={index} permission={action.permission}>
                      <Tooltip title={action.tooltip}>
                        <Button
                          size="small"
                          type={action.type}
                          danger={action.danger}
                          icon={action.icon}
                          onClick={action.onClick}
                          disabled={isDisabled || mutationLoading}
                          loading={action.loading}
                        />
                      </Tooltip>
                    </PermissionChecker>
                  ))}
                </Space>
              </div>
            );
          }
        }
      ]
      : []),
  ];

  // Format data for table
  const formatUserData = (users) => {
    return users.map((user) => ({ ...user, key: user.id }));
  };

  // Loading overlay for mutations
  const renderMutationLoader = () => {
    if (
      mutationLoading &&
      (deleteUserMutation.isPending || impersonateMutation.isPending)
    ) {
      return (
        <div>
          <div style={{ pointerEvents: "auto", zIndex: 10001 }}>
            <Image
              src={loader}
              alt="loader"
              className="img-fluid bg-transparent shadow-none"
              style={{ height: "100px" }}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {renderMutationLoader()}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Are you sure?"
        open={confirmDeleteModal.visible}
        onOk={confirmDeleteUser}
        onCancel={cancelDeleteUser}
        okText="Yes, delete it!"
        cancelText="Cancel"
        confirmLoading={mutationLoading}
        centered
      >
        <p>You won't be able to revert this!</p>
      </Modal>

      {/* Role Selection Modal */}
      <Modal
        title="Select User Type"
        open={showRoleModal}
        onCancel={() => setShowRoleModal(false)}
        footer={null}
        width={800}
      >
        <Row gutter={[16]}>
          {roles?.map(({ label, icon, key }) => (
            <Col xs={12} lg={6} md={12} key={key}>
              <Card
                hoverable
                className="text-center"
                onClick={() => handleRoleSelect(key)}
              >
                <div className="d-flex flex-column align-items-center gap-3 py-2">
                  <div className="text-primary">
                    {icon}
                  </div>
                  <span className="fw-medium fs-6">{label}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>

      <DataTable
        title="Users Management"
        data={formatUserData(users)}
        columns={columns}
        // Display controls
        showDateRange={true}
        showRefresh={true}
        showTotal={true}
        showAddButton={false} // hide default
        addButtonProps={null}
        // Date range
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        // Export functionality
        enableExport={true}
        exportRoute={"export-users"}
        ExportPermission={UserPermissions?.includes("Export Users")}
        // Loading states
        loading={usersLoading || mutationLoading}
        error={usersError}
        // Refresh handler
        onRefresh={handleRefresh}
        extraHeaderContent={
          <PermissionChecker permission="Add User">
            <Tooltip title={"Add User"}>
              <Button
                type="primary"
                icon={<PlusIcon size={16} />}
                onClick={handleAddUser}
              />
            </Tooltip>
          </PermissionChecker>
        }
        // Table customization
        tableProps={{
          scroll: { x: 1500 },
          size: "middle",
        }}
      >
        {/* <PermissionChecker permission="Create User"> */}
        <Button
          type="primary"
          icon={<PlusIcon size={16} />}
          onClick={handleAddUser}
          style={{ marginBottom: 16 }}
        >
          New User
        </Button>
        {/* </PermissionChecker> */}
      </DataTable>
    </>
  );
};

export default Users;

// Users.js
import React, { useCallback, useState, useEffect } from "react";
import { Tag, Button, Space, Modal, Row, Col, Image } from "antd";
import {
  ShoppingCart,
  UsersRound,
  ScanLine,
  Phone,
  Store,
  Tickets,
  BadgeDollarSign,
  Sparkle,
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
import Swal from "sweetalert2";

// Format authentication status
const formatAuthentication = (auth) => {
  if (auth === 1) return <Tag color="green">Enabled</Tag>;
  if (auth === 0) return <Tag color="orange">Pending</Tag>;
  return <Tag color="default">Not Set</Tag>;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const Users = () => {
  const navigate = useNavigate();
  const {
    UserPermissions,
    userRole,
    formatDateTime,
    successAlert,
    ErrorAlert,
    authToken,
    auth_session,
    UserData,
    session_id,
    loader,
  } = useMyContext();
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);

  const canUpdate = UserPermissions?.includes("Update User");
  const canDelete = UserPermissions?.includes("Delete User");
  const canAdd = UserPermissions?.includes("Add User");
  const canImpersonate = UserPermissions?.includes("Impersonet");

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

      //   if (!res?.status) {
      //     throw new Error(res.data?.message || 'Failed to delete user');
      //   }

      return res.data;
    },
    onSuccess: () => {
      // Refetch users after successful deletion
      refetchUsers();
      successAlert("Success", "User Deleted successfully.");
      setMutationLoading(false);
    },
    onError: (err) => {
      ErrorAlert(
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

      // Remove destructuring since the interceptor already returns data directly
      const response = await api.post(`impersonate`, {
        session_id,
        auth_session: `${auth_session}`,
        user_id: userId,
      });

      // The interceptor returns response.data directly, so 'response' is already the data
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
      console.log("data", data.user);
      dispatch(updateUser(data.user));
      successAlert("Success", "Logged in successfully");
      navigate("/dashboard");
      setMutationLoading(false);
    },
    onError: (err) => {
      if (err.message === "Session expired. Please login again.") {
        dispatch(logout());
        persistor.purge();
        navigate("/sign-in");
      }
      ErrorAlert(
        err.response?.data?.error || err.message || "Unexpected error occurred"
      );
      setMutationLoading(false);
    },
  });

  // Action handlers
  const handleAssignCredit = useCallback(
    (id) => {
      navigate(`manage/${id}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!id) return;

      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        setMutationLoading(true);
        deleteUserMutation.mutate(id);
      }
    },
    [deleteUserMutation]
  );

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
  const roles = [
    { label: "POS", icon: <ShoppingCart size={16} />, key: "POS" },
    { label: "Agent", icon: <UsersRound size={16} />, key: "Agent" },
    { label: "Scanner", icon: <ScanLine size={16} />, key: "Scanner" },
    { label: "Organizer", icon: <UsersRound size={16} />, key: "Organizer" },
    {
      label: "Support Executive",
      icon: <Phone size={16} />,
      key: "Support-Executive",
    },
    { label: "Shop Keeper", icon: <Store size={16} />, key: "Shop-Keeper" },
    {
      label: "Box Office Manager",
      icon: <Tickets size={16} />,
      key: "Box-Office-Manager",
    },
    { label: "Sponsor", icon: <BadgeDollarSign size={16} />, key: "Sponsor" },
    {
      label: "Accreditation",
      icon: <Sparkle size={16} />,
      key: "Accreditation",
    },
  ];

  const handleRoleSelect = (roleKey) => {
    setShowRoleModal(false);
    navigate(`/dashboard/users/new?type=${roleKey}`);
  };

  const handleAddUser = () => {
    if (userRole === "Organizer") {
      setShowRoleModal(true);
    } else {
      navigate("new");
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
      width: 80,
      sorter: (a, b) => a.id - b.id,
      searchable: false,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "15%",
      sorter: (a, b) => a.name?.localeCompare(b.name),
      searchable: true,
    },
    ...(UserPermissions?.includes("View Contact") || userRole === "Admin"
      ? [
          {
            title: "Contact",
            dataIndex: "contact",
            key: "contact",
            width: "12%",
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
            width: "20%",
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
      width: "10%",
      render: (cell) => (parseInt(cell) === 1 ? "Password" : "OTP"),
      searchable: false,
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      width: "12%",
      filters: [
        { text: "Admin", value: "Admin" },
        { text: "User", value: "User" },
        { text: "Organizer", value: "Organizer" },
        { text: "Agent", value: "Agent" },
        { text: "POS", value: "POS" },
        { text: "Sponsor", value: "Sponsor" },
        { text: "Corporate", value: "Corporate" },
        { text: "Sub Admin", value: "Sub Admin" },
      ],
      onFilter: (value, record) => record.role_name === value,
      render: (role) => {
        const badgeClass =
          {
            Admin: "bg-info",
            Organizer: "bg-primary",
            User: "bg-warning",
            Agent: "bg-danger",
            "Support Executive": "bg-success",
          }[role] || "bg-secondary";
        return (
          <span className={`badge p-2 fw-normal ls-1 ${badgeClass} w-100`}>
            {role}
          </span>
        );
      },
      searchable: false,
    },
    ...(userRole === "Admin"
      ? [
          {
            title: "Organisation",
            dataIndex: "organisation",
            key: "organisation",
            width: "15%",
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
            width: "15%",
            searchable: true,
            render: (user) => user || "N/A",
          },
        ]
      : []),
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    //   width: "8%",
    //   render: (cell) => {
    //     const circleClass = cell === "0" ? "bg-danger" : "bg-success";
    //     const statusText = cell === "0" ? "Deactive" : "Active";
    //     return (
    //       <span
    //         className={`d-inline-block rounded-circle ${circleClass}`}
    //         style={{ width: "12px", height: "12px" }}
    //         title={statusText}
    //       />
    //     );
    //   },
    //   searchable: false,
    // },
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
    ...(canUpdate || canDelete || canImpersonate
      ? [
          {
            title: "Actions",
            key: "actions",
            width: "15%",
            render: (_, record) => {
              const isDisabled = record?.is_deleted || record?.status === "1";

              return (
                <Space>
                  {canUpdate && (
                    <Button
                      size="small"
                      icon={<Settings size={14} />}
                      onClick={() => handleAssignCredit(record.id)}
                      title="Manage User"
                      disabled={isDisabled || mutationLoading}
                    />
                  )}
                  {canDelete && (
                    <Button
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(record.id)}
                      title="Delete User"
                      disabled={isDisabled || mutationLoading}
                      loading={deleteUserMutation.isPending}
                    />
                  )}
                  {canImpersonate && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<LogIn size={14} />}
                      onClick={() => handleImpersonate(record.id)}
                      title={`Login as ${record.name}`}
                      disabled={isDisabled || mutationLoading}
                      loading={impersonateMutation.isPending}
                    />
                  )}
                </Space>
              );
            },
          },
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
            pointerEvents: "none",
          }}
        >
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

      {/* Role Selection Modal */}
      <Modal
        title="Select User Type"
        open={showRoleModal}
        onCancel={() => setShowRoleModal(false)}
        footer={null}
        width={800}
      >
        <Row gutter={[16, 16]}>
          {roles?.map(({ label, icon, key }) => (
            <Col lg={8} md={12} sm={24} key={key}>
              <Button
                className="w-100 text-start p-3 d-flex gap-3 align-items-center hover-effect"
                onClick={() => handleRoleSelect(key)}
                style={{
                  height: "auto",
                  minHeight: "80px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="btn btn-sm btn-icon bg-primary-subtle text-primary rounded-circle p-2">
                  {icon}
                </div>
                <span className="fw-medium">{label}</span>
              </Button>
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
        showAddButton={canAdd}
        // Add button configuration
        addButtonProps={{
          text: "New User",
          onClick: handleAddUser,
          buttonProps: {
            icon: <PlusIcon size={16} />,
          },
        }}
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
        // Table customization
        tableProps={{
          scroll: { x: 1500 },
          size: "middle",
        }}
      />
    </>
  );
};

export default Users;

import React, { memo, useState, useCallback, useMemo } from "react";
import { Button, message, Space, Tag, Modal, Switch, Tooltip } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyContext } from "../../../../Context/MyContextProvider";
import { Send, Ticket, AlertCircle } from "lucide-react";
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import DataTable from "../../common/DataTable";
import TicketModal from "views/events/Tickets/modals/TicketModal";
import api from "auth/FetchInterceptor";
import BookingCount from "./BookingCount";
import RefundModal from "./RefundModal";
import { resendTickets } from "../agent/utils";
import { LoadingOutlined } from '@ant-design/icons';

const OnlineBookings = memo(() => {

  const {
    UserData,
    formatDateTime,
    truncateString,
    formatDateRange,
    UserPermissions,
    userRole,
  } = useMyContext();

  const [dateRange, setDateRange] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [ticketType, setTicketType] = useState(null);
  // store id of row being processed so spinner shows only for that row
  const [loadingId, setLoadingId] = useState(null);
  const [show, setShow] = useState(false);
  const [showGatewayReport, setShowGatewayReport] = useState(false);
  const [refundBookingData, setRefundBookingData] = useState(null);
  const queryClient = useQueryClient();

  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Fetch bookings using TanStack Query
  const {
    data: bookingsData = { bookings: [], pagination: null },
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["onlineBookings", UserData?.id, dateRange, currentPage, pageSize, searchText, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Pagination params
      params.set("page", currentPage.toString());
      params.set("per_page", pageSize.toString());

      // Search param
      if (searchText) {
        params.set("search", searchText);
      }

      // Sorting params
      if (sortField && sortOrder) {
        params.set("sort_by", sortField);
        params.set("sort_order", sortOrder === "ascend" ? "asc" : "desc");
      }

      // Date range params
      if (dateRange) {
        params.set("date", `${dateRange.startDate},${dateRange.endDate}`);
      }

      const url = `bookings/online/${UserData?.id}?${params.toString()}`;
      const res = await api.get(url);

      if (res.status) {
        let data = res.bookings || [];
        const filteredBookings = data.filter(
          (booking) =>
            booking.bookings &&
            Array.isArray(booking.bookings) &&
            booking.bookings.length > 0
        );
        const normalBooking = data.filter((booking) => !booking.bookings);
        const allBookings = [...filteredBookings, ...normalBooking];

        // Only sort on frontend if no server-side sorting
        if (!sortField) {
          allBookings.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB.getTime() - dateA.getTime();
          });
        }

        // Extract pagination data from response
        const paginationData = res.pagination || {
          current_page: currentPage,
          per_page: pageSize,
          total: allBookings.length,
          last_page: 1,
        };

        return { bookings: allBookings, pagination: paginationData };
      } else {
        throw new Error(res?.message || "Failed to fetch bookings");
      }
    },
    enabled: !!UserData?.id,
    refetchOnWindowFocus: false,
  });

  // Extract bookings and pagination from query data
  const bookings = useMemo(() => bookingsData.bookings || [], [bookingsData.bookings]);
  const pagination = bookingsData.pagination;

  // Delete/Restore booking mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, isDeleted, token }) => {
      if (isDeleted) {
        return api.get(`restore/online/${token}`);
      } else {
        return api.delete(`disable/online/${token}`);
      }
    },
    onSuccess: (res, variables) => {
      if (res.status) {
        queryClient.invalidateQueries(["onlineBookings"]);
        Modal.success({
          title: variables.isDeleted ? "Ticket Enabled!" : "Ticket Disabled!",
          content: variables.isDeleted
            ? "Ticket enabled successfully."
            : "Ticket disabled successfully.",
        });
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || "Operation failed");
    },
  });

  const HandleSendTicket = useCallback(async (record) => {
    console.log(record);
    if (!record?.id) return;
    setLoadingId(record.id);
    try {
      // call resendTickets; remove setLoading param if it mutates boolean
      await resendTickets(record, 'online');
    } catch (err) {
      // handle error if needed
    } finally {
      setLoadingId(null);
    }
  }, []);

  const DeleteBooking = useCallback(
    (data) => {
      console.log(data);
      // const data = bookings?.find((item) => item?.id === id);
      if (!data) return;

      Modal.confirm({
        title: data?.is_deleted ? "Enable Ticket?" : "Disable Ticket?",
        content: data?.is_deleted
          ? "Are you sure you want to enable this ticket?"
          : "Are you sure you want to disable this ticket?",
        icon: <AlertCircle size={24} color="#faad14" />,
        okText: "Yes",
        cancelText: "No",
        onOk: () => {
          deleteMutation.mutate({
            id: data?.id,
            isDeleted: data?.is_deleted === true,
            token: data?.token || data?.order_id,
          });
        },
      });
    },
    [bookings, deleteMutation]
  );

  const showMultiAlert = useCallback(() => {
    Modal.confirm({
      title: "Select an Option",
      content: "Would you like to group the tickets or keep them individual?",
      icon: <AlertCircle size={24} color="#1890ff" />,
      okText: "Group",
      cancelText: "Individual",
      onOk: () => {
        setTicketType({ type: "combine" });
        setShow(true);
      },
      onCancel: () => {
        setTicketType({ type: "individual" });
        setShow(true);
      },
    });
  }, []);

  const showSingleAlert = useCallback(() => {
    Modal.confirm({
      title: "Select an Option",
      content: "Would you like to combine the tickets?",
      icon: <AlertCircle size={24} color="#1890ff" />,
      okText: "Combine",
      cancelText: "Cancel",
      onOk: () => {
        setTicketType({ type: "combine" });
        setShow(true);
      },
    });
  }, []);

  const GenerateTicket = useCallback(
    (data) => {
      if (data) {
        setTicketData(data);
        data?.bookings?.length > 0 ? showMultiAlert() : showSingleAlert();
      }
    },
    [showMultiAlert, showSingleAlert]
  );

  const handleCloseModal = useCallback(() => {
    setTicketData(null);
    setTicketType(null);
    setShow(false);
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((dates) => {
    setCurrentPage(1); // Reset to first page on date change
    if (dates) {
      setDateRange({
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setDateRange(null);
    }
  }, []);

  // Handle pagination change (for backend pagination)
  const handlePaginationChange = useCallback((page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  }, [pageSize]);

  // Handle search change (for backend search)
  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  // Handle sort change (for backend sorting)
  const handleSortChange = useCallback((field, order) => {
    setSortField(field || null);
    setSortOrder(order || null);
  }, []);

  // Approval mutation
  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ id, is_master, status }) => {
      // Using generic endpoint or sticking to ID-based if preferred. 
      // User asked to pass payload: { is_master, id, status }
      return api.post(`/update-approval-status`, { is_master, id, status });
    },
    onSuccess: (res, variables) => {
      if (res.status) {
        queryClient.invalidateQueries(["onlineBookings"]);
        message.success(
          variables.status === 'approved'
            ? 'Booking approved successfully!'
            : 'Booking rejected successfully!'
        );
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Approval action failed');
    },
  });

  // Handle approval action
  const handleApproval = useCallback((record, actionStatus) => {
    // Determine is_master based on if record has nested bookings
    // If record.bookings exists and has length, assume it's a master/grouped record
    const is_master = record?.bookings && record?.bookings.length > 0 ? true : false;
    const bookingId = record?.id;

    // Map actionStatus ('approved'/'rejected') to API status ('approved'/'rejected')
    const apiStatus = actionStatus === 'approved' ? 'approved' : 'rejected';

    Modal.confirm({
      title: actionStatus === 'approved' ? 'Approve Booking?' : 'Reject Booking?',
      content: actionStatus === 'approved'
        ? 'Are you sure you want to approve this booking?'
        : 'Are you sure you want to reject this booking?',
      icon: <AlertCircle size={24} color={actionStatus === 'approved' ? '#52c41a' : '#ff4d4f'} />,
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        danger: actionStatus === 'rejected',
        style: actionStatus === 'approved' ? { background: '#52c41a', borderColor: '#52c41a' } : {}
      },
      onOk: () => {
        approvalMutation.mutate({ id: bookingId, is_master, status: apiStatus });
      },
    });
  }, [approvalMutation]);


  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Event Name",
      dataIndex: "event_name",
      key: "event_name",
      align: "center",
      // searchable: true,
      render: (_, record) => {
        const eventName =
          record?.bookings?.[0]?.event_name || record?.event_name || "";

        return <span title={eventName}>{truncateString(eventName)}</span>;
      },
      sorter: (a, b) => {
        const nameA = a?.bookings?.[0]?.event_name || a?.event_name || "";
        const nameB = b?.bookings?.[0]?.event_name || b?.event_name || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "Org Name",
      dataIndex: "organizer",
      key: "organizer",
      align: "center",
      // searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.organizer || record?.organizer || "",
    },
    ...(UserPermissions?.includes("View Username")
      ? [
        {
          title: "User Name",
          dataIndex: ["user", "name"],
          key: "userName",
          align: "center",
          // searchable: true,
          render: (_, record) =>
            record?.bookings?.[0]?.user?.name || record?.user?.name || "",
        },
      ]
      : []),
    ...(UserPermissions?.includes("View Contact")
      ? [
        {
          title: "Number",
          dataIndex: "number",
          key: "number",
          align: "center",
          // searchable: true,
          render: (_, record) =>
            record?.bookings?.[0]?.number || record?.number || "",
        },
      ]
      : []),
    {
      title: "Ticket",
      dataIndex: ["ticket", "name"],
      key: "ticketName",
      align: "center",
      // searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.ticket?.name || record?.ticket?.name || "",
    },
    {
      title: "Mode",
      dataIndex: "payment_method",
      key: "payment_method",
      align: "center",
      render: (_, record) =>
        record?.bookings?.[0]?.payment_log?.mode ||
        record?.payment_log?.mode ||
        record?.payment_method ||
        "",
    },
    {
      title: "PG",
      dataIndex: "gateway",
      key: "gateway",
      align: "center",
      render: (_, record) =>
        record?.gateway || record?.bookings?.[0]?.gateway || "",
    },
    {
      title: "Approval",
      key: "approval",
      align: "center",
      render: (_, record) => {
        const approvalStatus = record?.approval_status || record?.bookings?.[0]?.approval_status;

        // Only show buttons if approval_status is "pending"
        if (approvalStatus === "pending") {
          return (
            <Space size="small">
              <Tooltip title="Approve">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApproval(record, 'approved')}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleApproval(record, 'rejected')}
                />
              </Tooltip>
            </Space>
          );
        }

        // Show status tag for non-pending statuses
        if (approvalStatus === "approved") {
          return <Tag color="success">Approved</Tag>;
        }
        if (approvalStatus === "rejected") {
          return <Tag color="error">Rejected</Tag>;
        }

        return "-";
      },
    },
    {
      title: "Tran ID",
      dataIndex: "payment_id",
      key: "payment_id",
      align: "center",
      // searchable: true,
      render: (_, record) =>
        record?.payment_id || record?.bookings?.[0]?.payment_id || "",
    },

    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (_, record) => record?.bookings?.length || 1,
    },
    {
      title: "Disc",
      dataIndex: "discount",
      key: "discount",
      align: "center",
      render: (_, record) => {
        const discount =
          record?.discount ||
          (record?.bookings && record?.bookings[0]?.discount) ||
          0;
        return `₹${discount}`;
      },
    },

    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "center",
      render: (_, record) => {
        const totalAmount =
          record?.total_amount ||
          (record?.bookings && record?.bookings[0]?.total_amount) ||
          0;
        return `₹${totalAmount}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (_, record) => {
        if (record.is_deleted) {
          return (
            <Tooltip title="Disabled">
              <Tag icon={<CloseCircleOutlined className='m-0' />} color="error" />
            </Tooltip>
          );
        }
        const status =
          record.status || (record.bookings && record.bookings[0]?.status);

        return status === "0" ? (
          <Tooltip title="Pending">
            <Tag icon={<ClockCircleOutlined className='m-0' />} color="warning" />
          </Tooltip>
        ) : (
          <Tooltip title="Scanned">
            <Tag icon={<CheckCircleOutlined className='m-0' />} color="success" />
          </Tooltip>
        );
      },
    },
    {
      title: "Booking Date",
      dataIndex: "created_at",
      key: "created_at",
      align: "center",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    ...(UserPermissions?.includes("Initiate Refund") || userRole?.toLowerCase() === 'admin'
      ? [
        {
          title: "Refund",
          key: "refund",
          align: "center",
          render: (_, record) => {
            const totalAmount = record?.total_amount || record?.bookings?.[0]?.total_amount || 0;

            // Only show refund button if total_amount is greater than 0
            if (totalAmount <= 0) {
              return '-';
            }

            const isDisabled =
              record?.is_deleted === true ||
              (record?.bookings && record?.bookings[0]?.status) === "1";

            return (
              <Button
                type="default"
                size="small"
                icon={<DollarOutlined />}
                onClick={() => setRefundBookingData(record)}
                disabled={isDisabled}
                title="Refund"
              >
                Refund
              </Button>
            );
          },
        },
      ]
      : []),
    {
      title: "Action",
      key: "action",
      align: "center",
      // fixed: 'right',
      render: (_, record) => {
        const isDisabled =
          record?.is_deleted === true ||
          (record?.bookings && record?.bookings[0]?.status) === "1";

        return (
          <Space size="small" className="p-0">
            <Button
              type="primary"
              size="small"
              // show spinner only for current record
              icon={
                loadingId === record.id ? (
                  <LoadingOutlined style={{ fontSize: 14 }} spin />
                ) : (
                  <Send size={14} />
                )
              }
              onClick={() => HandleSendTicket(record)}
              disabled={isDisabled}
              title="Resend Ticket"
            />
            <Button
              danger
              size="small"
              icon={<Ticket size={14} />}
              onClick={() => GenerateTicket(record)}
              disabled={isDisabled}
              title="Generate Ticket"
            />
            <Switch
              size="small"
              checked={!record?.is_deleted}
              onChange={() => DeleteBooking(record)}
              checkedChildren="Active"
              unCheckedChildren="Disabled"
            />
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {showGatewayReport && (
        <BookingCount data={bookings} date={dateRange} type={'online'} showGatewayAmount={true} />
      )}

      <DataTable
        title={<span style={{ fontSize: 14 }}>Online Bookings</span>}
        data={bookings}
        columns={columns}
        showDateRange={true}
        showRefresh={true}
        dateRange={dateRange}
        extraHeaderContent={
          <Space>
            <span style={{ fontSize: 14 }}>Gateway Report:</span>
            <Switch
              checked={showGatewayReport}
              onChange={(checked) => setShowGatewayReport(checked)}
              checkedChildren="Show"
              unCheckedChildren="Hide"
            />
          </Space>
        }
        onDateRangeChange={handleDateRangeChange}
        loading={isLoading || deleteMutation.isPending}
        error={isError ? error : null}
        enableSearch={true}
        showSearch={true}
        // Backend pagination props
        serverSide={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onSearch={handleSearchChange}
        onSortChange={handleSortChange}
        searchValue={searchText}
        // Export functionality
        enableExport={true}
        exportRoute="export-onlineBooking"
        ExportPermission={UserPermissions?.includes("Export Online Bookings")}
        onRefresh={refetch}
        emptyText="No bookings found"
      />

      <TicketModal
        show={show}
        handleCloseModal={handleCloseModal}
        ticketType={ticketType}
        ticketData={ticketData}
        formatDateRange={formatDateRange}
      />

      <RefundModal
        bookingData={refundBookingData}
        onClose={() => setRefundBookingData(null)}
        onRefundComplete={() => {
          setRefundBookingData(null);
          refetch();
        }}
      />
    </>
  );
});

OnlineBookings.displayName = "OnlineBookings";

// ✅ Wrap with withAccess HOC for permission guard
export default OnlineBookings;
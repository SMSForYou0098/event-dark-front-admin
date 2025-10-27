import React, { memo, useState, useCallback } from "react";
import { Button, message, Space, Tag, Modal, Table, Card, Switch } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyContext } from "../../../../Context/MyContextProvider";
import { CheckCircle, Send, Ticket, XCircle, AlertCircle } from "lucide-react";
import DataTable from "../../common/DataTable";
import TicketModal from "views/events/Tickets/modals/TicketModal";
import api from "auth/FetchInterceptor";
import { withAccess } from "../../common/withAccess";
import BookingCount from "./BookingCount";

const OnlineBookings = memo(() => {
  const {
    UserData,
    formatDateTime,
    sendTickets,
    truncateString,
    formatDateRange,
    UserPermissions,
  } = useMyContext();

  const [dateRange, setDateRange] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [ticketType, setTicketType] = useState(null);
  const [show, setShow] = useState(false);
  const [showGatewayReport, setShowGatewayReport] = useState(false);
  const queryClient = useQueryClient();

  // Fetch bookings using TanStack Query
  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["onlineBookings", UserData?.id, dateRange],
    queryFn: async () => {
      const queryParams = dateRange
        ? `?date=${dateRange.startDate},${dateRange.endDate}`
        : "";
      const url = `master-bookings/${UserData?.id}${queryParams}`;

      const res = await api.get(url);

      if (res.status) {
        let data = res.bookings;
        const filteredBookings = data.filter(
          (booking) =>
            booking.bookings &&
            Array.isArray(booking.bookings) &&
            booking.bookings.length > 0
        );
        const normalBooking = data.filter((booking) => !booking.bookings);
        const allBookings = [...filteredBookings, ...normalBooking];

        allBookings.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });

        return allBookings;
      } else {
        throw new Error(res?.message || "Failed to fetch bookings");
      }
    },
    enabled: !!UserData?.id,
    refetchOnWindowFocus: false,
  });

  // Delete/Restore booking mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, isDeleted, token }) => {
      if (isDeleted) {
        return api.get(`restore-booking/${id}/${token}`);
      } else {
        return api.delete(`delete-booking/${id}/${token}`);
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

  const HandleSendTicket = useCallback(
    (data) => {
      if (data) {
        sendTickets(data, "old", true, "Online Booking");
      }
    },
    [sendTickets]
  );

  const DeleteBooking = useCallback(
    (id) => {
      const data = bookings?.find((item) => item?.id === id);
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
            id,
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
      content: "Would you like to combine the tickets or keep them individual?",
      icon: <AlertCircle size={24} color="#1890ff" />,
      okText: "Combine",
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

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange({
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setDateRange(null);
    }
  };

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
      searchable: true,
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
      searchable: true,
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
            searchable: true,
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
            searchable: true,
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
      searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.ticket?.name || record?.ticket?.name || "",
    },
    {
      title: "Transaction ID",
      dataIndex: "payment_id",
      key: "payment_id",
      align: "center",
      searchable: true,
      render: (_, record) =>
        record?.payment_id || record?.bookings?.[0]?.payment_id || "",
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
      title: "Gateway",
      dataIndex: "gateway",
      key: "gateway",
      align: "center",
      render: (_, record) =>
        record?.gateway || record?.bookings?.[0]?.gateway || "",
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
      title: "B Amt",
      dataIndex: "base_amount",
      key: "base_amount",
      align: "center",
      render: (_, record) => {
        const baseAmount =
          (record?.bookings && record?.bookings[0]?.base_amount) ||
          record?.base_amount ||
          0;
        return `₹${baseAmount}`;
      },
    },
    {
      title: "Total",
      dataIndex: "amount",
      key: "amount",
      align: "center",
      render: (_, record) => {
        const totalAmount =
          (record?.bookings && record?.bookings[0]?.amount) ||
          record?.amount ||
          0;
        return `₹${totalAmount}`;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 180,
      render: (_, record) => {
        const isDisabled =
          record?.is_deleted === true ||
          (record?.bookings && record?.bookings[0]?.status) === "1";

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<Send size={14} />}
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
            <Button
              type={record?.is_deleted ? "primary" : "default"}
              danger={!record?.is_deleted}
              size="small"
              icon={
                record?.is_deleted ? (
                  <CheckCircle size={14} />
                ) : (
                  <XCircle size={14} />
                )
              }
              onClick={() => DeleteBooking(record.id)}
              title={record?.is_deleted ? "Enable Ticket" : "Disable Ticket"}
            />
          </Space>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (_, record) => {
        if (record.is_deleted) {
          return <Tag color="error">Disabled</Tag>;
        }
        const status =
          record.status || (record.bookings && record.bookings[0]?.status);
        return (
          <Tag color={status === "0" ? "warning" : "success"}>
            {status === "0" ? "Uncheck" : "Checked"}
          </Tag>
        );
      },
    },
    {
      title: "Purchase Date",
      dataIndex: "created_at",
      key: "created_at",
      align: "center",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
  ];

  const gtColumns = [
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
      fixed: 'left',
      width: 150,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value) => `₹${value}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      align: 'right',
      render: (value) => `₹${value}`,
    },
    {
      title: 'Bookings',
      dataIndex: 'bookings',
      key: 'bookings',
      align: 'right',
    },
    {
      title: 'Tickets',
      dataIndex: 'tickets',
      key: 'tickets',
      align: 'right',
    },
  ];

  const data = [
    {
      key: '1',
      gateway: 'InstaMojo',
      amount: 0,
      discount: 0,
      bookings: 0,
      tickets: 1,
    },
    {
      key: '2',
      gateway: 'Easebuzz',
      amount: 0,
      discount: 0,
      bookings: 0,
      tickets: 1,
    },
    {
      key: '3',
      gateway: 'Razorpay',
      amount: 0,
      discount: 0,
      bookings: 0,
      tickets: 1,
    },
    {
      key: '4',
      gateway: 'Phonepe',
      amount: 0,
      discount: 0,
      bookings: 0,
      tickets: 1,
    },
    {
      key: '5',
      gateway: 'Cashfree',
      amount: 0,
      discount: 0,
      bookings: 0,
      tickets: 1,
    },
  ];

  return (
    <>
      {showGatewayReport && (
         <BookingCount data={bookings} date={dateRange} type={'online'} showGatewayAmount={true}/>
      )}
      
      <DataTable
        title="Online Bookings"
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
    </>
  );
});

OnlineBookings.displayName = "OnlineBookings";

// ✅ Wrap with withAccess HOC for permission guard
export default withAccess({
  requiredPermissions: ["View Total Bookings"],
  mode: "all",
  redirectTo: "/dashboard",
  whenDenied: (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <h3>Access Denied</h3>
      <p>You don't have permission to view Online Bookings.</p>
    </div>
  ),
})(OnlineBookings);
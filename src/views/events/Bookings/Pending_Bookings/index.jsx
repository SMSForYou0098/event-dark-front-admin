import React, { memo, useState, useCallback, useMemo } from "react";
import { Button, Space, Modal, message } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyContext } from "../../../../Context/MyContextProvider";
import { CreditCard, AlertCircle } from "lucide-react";
import DataTable from "../../common/DataTable";
import api from "auth/FetchInterceptor";

const PendingBookings = memo(() => {
  const { UserData, formatDateTime, truncateString } = useMyContext();
  const [dateRange, setDateRange] = useState(null);
  const queryClient = useQueryClient();

  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Fetch pending bookings using TanStack Query
  const {
    data: bookingsData = { bookings: [], pagination: null },
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["pendingBookings", UserData?.id, dateRange, currentPage, pageSize, searchText, sortField, sortOrder],
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

      const url = `bookings/pending/${UserData?.id}?${params.toString()}`;
      const response = await api.get(url);

      if (response.status) {
        let data = response.bookings || [];
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
        const paginationData = response.pagination || {
          current_page: currentPage,
          per_page: pageSize,
          total: allBookings.length,
          last_page: 1,
        };

        return { bookings: allBookings, pagination: paginationData };
      } else {
        throw new Error(
          response?.message || "Failed to fetch pending bookings"
        );
      }
    },
    enabled: !!UserData?.id,
    refetchOnWindowFocus: false,
  });

  // Extract bookings and pagination from query data
  const bookings = useMemo(() => bookingsData.bookings || [], [bookingsData.bookings]);
  const pagination = bookingsData.pagination;

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ session_id }) => {
      return api.post(`booking-confirm/${session_id}`);
    },
    onSuccess: (res) => {
      if (res.status) {
        queryClient.invalidateQueries(["pendingBookings"]);
        Modal.success({
          title: "Success",
          content: "Booking confirmed successfully.",
        });
      } else {
        message.error(res?.message || "Something went wrong.");
      }
    },
    onError: (err) => {
      message.error(
        err.response?.data?.message || "Failed to confirm booking"
      );
    },
  });

  const HandlePay = useCallback(
    async (id) => {
      try {
        const booking = bookings?.find((booking) => booking?.id === id);
        const session_id = booking?.session_id;

        if (!session_id) {
          message.error("Session ID not found");
          return;
        }

        // Add confirmation dialog using Ant Design Modal
        Modal.confirm({
          title: "Confirm Payment",
          content: "Do you want to confirm payment for this booking?",
          icon: <AlertCircle size={24} color="#faad14" />,
          okText: "Yes, confirm it!",
          cancelText: "Cancel",
          okButtonProps: { danger: false },
          onOk: () => {
            confirmPaymentMutation.mutate({ session_id });
          },
        });
      } catch (error) {
        message.error("Failed to process payment confirmation");
      }
    },
    [bookings, confirmPaymentMutation]
  );

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

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "User Name",
      dataIndex: ["user", "name"],
      key: "userName",
      align: "center",
      searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.user?.name || record?.user?.name || "",
      sorter: (a, b) => {
        const nameA = a?.bookings?.[0]?.user?.name || a?.user?.name || "";
        const nameB = b?.bookings?.[0]?.user?.name || b?.user?.name || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "Transaction ID",
      dataIndex: "payment_id",
      key: "payment_id",
      align: "center",
      searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.payment_id || record?.payment_id || "",
    },
    {
      title: "Gateway",
      dataIndex: "gateway",
      key: "gateway",
      align: "center",
      searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.gateway || record?.gateway || "",
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
      title: "Status",
      dataIndex: "payment_status",
      key: "payment_status",
      align: "center",
      render: (_, record) => {
        const status =
          record?.bookings?.[0]?.payment_log?.status ||
          record?.payment_log?.status ||
          record?.payment_status ||
          "";
        return status;
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
      title: "Action",
      key: "action",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<CreditCard size={14} />}
            onClick={() => HandlePay(record.id)}
            loading={confirmPaymentMutation.isPending}
            title="Pay Now"
          >
            Pay Now
          </Button>
        </Space>
      ),
    },
    {
      title: "Number",
      dataIndex: "number",
      key: "number",
      align: "center",
      searchable: true,
      render: (_, record) =>
        record?.bookings?.[0]?.number || record?.number || "",
    },
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
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (_, record) => record?.bookings?.length || 1,
    },
    {
      title: "Total",
      dataIndex: "amount",
      key: "amount",
      align: "center",
      render: (_, record) => {
        const amount =
          (record?.bookings && record?.bookings[0]?.amount) ||
          record?.amount ||
          0;
        return `₹${amount}`;
      },
    },
  ];

  return (
    <DataTable
      title="Pending Bookings"
      data={bookings}
      columns={columns}
      showDateRange={true}
      showRefresh={true}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
      loading={isLoading || confirmPaymentMutation.isPending}
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
      exportRoute="booking/pending/export"
      ExportPermission={true}
      onRefresh={refetch}
      emptyText="No pending bookings found"
    />
  );
});

PendingBookings.displayName = "PendingBookings";
export default PendingBookings;

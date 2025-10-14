import React, { memo, useState, useCallback, useMemo } from "react";
import { 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Tooltip, 
  Modal, 
  message,
  Switch,
} from "antd";
import { 
  PrinterOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import POSPrintModal from "./POSPrintModal";
import { useMyContext } from "Context/MyContextProvider";
import DataTable from "views/events/common/DataTable";
import usePermission from "utils/hooks/usePermission";
import { useNavigate } from "react-router-dom";

const { confirm } = Modal;
const { Text } = Typography;

const PosBooking = memo(() => {
  const navigate = useNavigate();
  const { api, UserData, formatDateTime, authToken, formatDateRange } = useMyContext();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(null);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Format date range for API
  const formattedDateRange = useMemo(() => {
    if (!dateRange || dateRange.length !== 2) return '';
    return `${dayjs(dateRange[0]).format('YYYY-MM-DD')},${dayjs(dateRange[1]).format('YYYY-MM-DD')}`;
  }, [dateRange]);

  // Fetch bookings with TanStack Query
 const {
  data: bookings = [],
  isLoading,
  isFetching,
  isError,
  error,
} = useQuery({
  queryKey: ['pos-bookings', UserData?.id, formattedDateRange],
  queryFn: async () => {
    const queryParams = formattedDateRange ? `?date=${formattedDateRange}` : '';
    const url = `${api}pos-bookings/${UserData?.id}${queryParams}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.data.status) {
        // API responded with status: false — treat as error
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }

      return response.data.bookings || [];
    } catch (err) {
      // Any thrown error (network, server, etc.) will be handled by react-query
      throw err;
    }
  },
  enabled: !!UserData?.id && !!authToken,
  staleTime: 30000,
  refetchOnWindowFocus: false,
});


  // Toggle booking status mutation (delete/restore)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isDeleted }) => {
      const url = isDeleted 
        ? `${api}restore-pos-booking/${id}`
        : `${api}delete-pos-booking/${id}`;
      
      const response = isDeleted
        ? await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        : await axios.delete(url, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ['pos-bookings', UserData?.id, formattedDateRange],
        (old) => {
          if (!old) return [];
          return old.map(booking => 
            booking.id === variables.id 
              ? { ...booking, is_deleted: !variables.isDeleted }
              : booking
          );
        }
      );

      message.success(
        variables.isDeleted 
          ? 'Ticket enabled successfully' 
          : 'Ticket disabled successfully'
      );
    },
    onError: (error) => {
      console.error('Error toggling booking status:', error);
      message.error(error.response?.data?.message || 'Failed to update ticket status');
      // Refetch to ensure data consistency
      queryClient.invalidateQueries(['pos-bookings', UserData?.id, formattedDateRange]);
    },
  });

  // Handle print booking
  const handlePrintBooking = useCallback((booking) => {
    setSelectedBooking(booking);
    setShowPrintModel(true);
  }, []);

  // Handle toggle booking status
  const handleToggleStatus = useCallback((booking) => {
    const actionText = booking.is_deleted ? 'enable' : 'disable';
    
    confirm({
      title: `Are you sure you want to ${actionText} this ticket?`,
      icon: <ExclamationCircleOutlined />,
      content: `This will ${actionText} the ticket for the customer.`,
      okText: `Yes, ${actionText} it`,
      okType: booking.is_deleted ? 'primary' : 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        toggleStatusMutation.mutate({
          id: booking.id,
          isDeleted: booking.is_deleted
        });
      },
    });
  }, [toggleStatusMutation]);


  // Close print modal
  const closePrintModel = useCallback(() => {
    setShowPrintModel(false);
    setSelectedBooking(null);
  }, []);

  // Calculate print modal data
  const printModalData = useMemo(() => {
    if (!selectedBooking) return null;

    const subtotal = selectedBooking.ticket?.price * selectedBooking.quantity;
    const totalAfterDiscount = selectedBooking.amount - (-selectedBooking.discount);
    const totalTax = Math.max(0, totalAfterDiscount - subtotal)?.toFixed(2);

    return {
      event: selectedBooking.ticket?.event,
      bookingData: selectedBooking,
      subtotal,
      totalTax,
      discount: selectedBooking.discount,
      grandTotal: selectedBooking.amount,
    };
  }, [selectedBooking]);

  // Table columns
const columns = useMemo(() => [
  {
    title: '#',
    key: 'index',
    align: 'center',
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Event',
    dataIndex: ['ticket', 'event', 'name'],
    key: 'event',
    sorter: (a, b) => a.ticket?.event?.name?.localeCompare(b.ticket?.event?.name),
  },
  {
    title: 'Event Dates',
    dataIndex: ['ticket', 'event', 'date_range'],
    key: 'eventDates',
    render: (dateRange) => formatDateRange?.(dateRange) || dateRange,
  },
  {
    title: 'POS User',
    dataIndex: 'user_name',
    key: 'posUser',
    sorter: (a, b) => a.user_name?.localeCompare(b.user_name),
  },
  {
    title: 'Organizer',
    dataIndex: 'reporting_user_name',
    key: 'organizer',
    sorter: (a, b) => a.reporting_user_name?.localeCompare(b.reporting_user_name),
  },
  {
    title: 'Ticket',
    dataIndex: ['ticket', 'name'],
    key: 'ticket',
    sorter: (a, b) => a.ticket?.name?.localeCompare(b.ticket?.name),
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    align: 'center',
    sorter: (a, b) => a.quantity - b.quantity,
  },
  {
    title: 'Discount',
    dataIndex: 'discount',
    key: 'discount',
    align: 'right',
    render: (discount) => (
      <Text type="danger">₹{Number(discount || 0).toFixed(2)}</Text>
    ),
    sorter: (a, b) => (a.discount || 0) - (b.discount || 0),
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    render: (amount) => `₹${Number(amount || 0).toFixed(2)}`,
    sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    render: (status) => (
      <Tag color={status === "0" ? "warning" : "success"}>
        {status === "0" ? "Unchecked" : "Checked"}
      </Tag>
    ),
    filters: [
      { text: 'Unchecked', value: '0' },
      { text: 'Checked', value: '1' },
    ],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: 'Customer',
    dataIndex: 'name',
    key: 'customer',
    sorter: (a, b) => a.name?.localeCompare(b.name),
  },
  {
    title: 'Contact',
    dataIndex: 'number',
    key: 'contact',
  },
  {
    title: 'Purchase Date',
    dataIndex: 'created_at',
    key: 'purchaseDate',
    render: (date) => formatDateTime?.(date) || date,
    sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  },
  {
    title: 'Ticket Status',
    dataIndex: 'is_deleted',
    key: 'ticketStatus',
    align: 'center',
    width: 120,
    render: (isDeleted, record) => (
      <Switch
        checked={!isDeleted}
        onChange={() => handleToggleStatus(record)}
        checkedChildren="Active"
        unCheckedChildren="Disabled"
        loading={toggleStatusMutation.isPending}
        disabled={record.status === "1"}
      />
    ),
  },
  {
    title: 'Action',
    key: 'action',
    align: 'center',
    fixed: 'right',
    width: 80,
    render: (_, record) => {
      const isDisabled = record.is_deleted === true || record.status === "1";

      return (
        <Tooltip title="Print Ticket">
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintBooking(record)}
            disabled={isDisabled}
          />
        </Tooltip>
      );
    },
  },
], [
  formatDateRange, 
  formatDateTime, 
  handlePrintBooking, 
  handleToggleStatus, 
  toggleStatusMutation.isPending
]);
  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates);
  }, []);
  return (
    <>
      {showPrintModel && printModalData && (
        <POSPrintModal
          showPrintModel={showPrintModel}
          closePrintModel={closePrintModel}
          {...printModalData}
        />
      )}
        <DataTable
            title="Events"
            data={bookings}
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
            ExportPermission={usePermission("Export Users")}
            extraHeaderContent={
                <Tooltip title="New Event">
                    <Button
                        type="primary"
                        icon={<PlusOutlined size={16} />}
                        onClick={() => navigate('new')}
                    />
                </Tooltip>
            }
            // Loading states
            loading={isLoading}
            error={error}
            tableProps={{
                scroll: { x: 1500 },
                size: "middle",
            }}
            />
    </>
  );
});

PosBooking.displayName = "PosBooking";
export default PosBooking;
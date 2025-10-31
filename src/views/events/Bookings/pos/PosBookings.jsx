import React, { memo, useState, useCallback, useMemo } from "react";
import {
  Button,
  Tag,
  Typography,
  Tooltip,
  Modal,
  message,
  Switch,
  Table,
  Space,
  DatePicker,
  Card,
} from "antd";
import {
  PrinterOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import POSPrintModal from "./POSPrintModal";
import { useMyContext } from "Context/MyContextProvider";
import usePermission from "utils/hooks/usePermission";
import { useNavigate } from "react-router-dom";
import { CloudCog } from "lucide-react";

const { RangePicker } = DatePicker;
const { confirm } = Modal;
const { Text, Title } = Typography;

const PosBooking = memo(() => {
  const navigate = useNavigate();
  const { api, UserData, formatDateTime, authToken, formatDateRange } = useMyContext();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(null);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // Format date range for API
  const formattedDateRange = useMemo(() => {
    if (!dateRange || dateRange.length !== 2) return '';
    return `${dayjs(dateRange[0]).format('YYYY-MM-DD')},${dayjs(dateRange[1]).format('YYYY-MM-DD')}`;
  }, [dateRange]);

  // Fetch bookings with TanStack Query
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
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
          throw new Error(response.data.message || 'Failed to fetch bookings');
        }

        return response.data.bookings || [];
      } catch (err) {
        throw err;
      }
    },
    enabled: !!UserData?.id && !!authToken,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Set default expanded rows when bookings load
  // React.useEffect(() => {
  //   if (bookings && bookings.length > 0) {
  //     const keysToExpand = bookings
  //       .filter(booking => booking.related && booking.related.length > 0)
  //       .map(booking => booking.id);
  //     setExpandedRowKeys(keysToExpand);
  //   }
  // }, [bookings]);

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
      queryClient.setQueryData(
        ['pos-bookings', UserData?.id, formattedDateRange],
        (old) => {
          if (!old) return [];
          return old.map(booking => {
            if (booking.id === variables.id) {
              return { ...booking, is_deleted: !variables.isDeleted };
            }
            // Check if it's in related bookings
            if (booking.related && booking.related.length > 0) {
              return {
                ...booking,
                related: booking.related.map(rel =>
                  rel.id === variables.id
                    ? { ...rel, is_deleted: !variables.isDeleted }
                    : rel
                )
              };
            }
            return booking;
          });
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
  
    // Check if there are related bookings
    const hasRelatedBookings = selectedBooking.related && selectedBooking.related.length > 0;
  
    // If there are related bookings, combine main booking with related ones
    const allBookings = hasRelatedBookings
      ? [selectedBooking, ...selectedBooking.related]
      : [selectedBooking];
  
    // Calculate totals for all bookings
    const subtotal = allBookings.reduce((sum, booking) => {
      const baseAmount = parseFloat(booking.booking_tax?.base_amount || booking.price || 0);
      const quantity = parseInt(booking.quantity || 0);
      return sum + (baseAmount * quantity);
    }, 0);
  
    const totalDiscount = allBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.discount || 0);
    }, 0);
  
    const totalTax = allBookings.reduce((sum, booking) => {
      const tax = parseFloat(booking.booking_tax?.total_tax || 0);
      return sum + tax;
    }, 0);
  
    const totalConvenienceFee = allBookings.reduce((sum, booking) => {
      const fee = parseFloat(booking.booking_tax?.convenience_fee || 0);
      return sum + fee;
    }, 0);
  
    const grandTotal = hasRelatedBookings 
      ? parseFloat(selectedBooking.total_amount || 0)
      : parseFloat(selectedBooking.amount || 0);
  
    // Create lightweight booking data - only keep essential fields
    const lightweightBookings = allBookings?.map(booking => ({
      id: booking.id,
      token: booking.token,
      quantity: booking.quantity,
      discount: booking.discount,
      price: booking.booking_tax?.base_amount || booking.price,
      amount: booking.amount,
      tax: booking.booking_tax?.total_tax || 0,
      created_at: booking.created_at,
      ticket: {
        id: booking.ticket?.id,
        name: booking.ticket?.name,
      }
    }));

    
    return {
      event: selectedBooking.ticket?.event,
      bookingData: lightweightBookings, // Lightweight array with only essential fields
      subtotal: subtotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      convenienceFee: totalConvenienceFee.toFixed(2),
      discount: totalDiscount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  }, [selectedBooking]);

  // Define columns for nested table (related bookings)
  const expandedRowColumns = useMemo(() => [
    {
      title: 'Ticket',
      dataIndex: ['ticket', 'name'],
      key: 'ticket',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `₹${Number(price || 0).toFixed(2)}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      align: 'right',
      render: (discount) => (
        <Text type="danger">₹{Number(discount || 0).toFixed(2)}</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => `₹${Number(amount || 0).toFixed(2)}`,
    },
    // {
    //   title: 'Status',
    //   dataIndex: 'status',
    //   key: 'status',
    //   align: 'center',
    //   render: (status) => (
    //     <Tag color={status === "0" ? "warning" : "success"}>
    //       {status === "0" ? "Unchecked" : "Checked"}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: 'Ticket Status',
    //   dataIndex: 'is_deleted',
    //   key: 'ticketStatus',
    //   align: 'center',
    //   width: 120,
    //   render: (isDeleted, record) => (
    //     <Switch
    //       checked={!isDeleted}
    //       onChange={() => handleToggleStatus(record)}
    //       checkedChildren="Active"
    //       unCheckedChildren="Disabled"
    //       loading={toggleStatusMutation.isPending}
    //       disabled={record.status === "1"}
    //     />
    //   ),
    // },
    // {
    //   title: 'Action',
    //   key: 'action',
    //   align: 'center',
    //   width: 80,
    //   render: (_, record) => {
    //     const isDisabled = record.is_deleted === true || record.status === "1";

    //     return (
    //       <Tooltip title="Print Ticket">
    //         <Button
    //           size="small"
    //           icon={<PrinterOutlined />}
    //           onClick={() => handlePrintBooking(record)}
    //           disabled={isDisabled}
    //         />
    //       </Tooltip>
    //     );
    //   },
    // },
  ], []);

  // Expandable row render
  const expandedRowRender = useCallback((record) => {
    if (!record.related || record.related.length === 0) {
      return null;
    }

    return (
      <Table
        columns={expandedRowColumns}
        dataSource={record.related}
        pagination={false}
        rowKey="id"
        size="small"
        bordered
        style={{ marginLeft: 48, backgroundColor: '#fafafa' }}
      />
    );
  }, [expandedRowColumns]);

  // Handle expand row change
  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys(prevKeys => {
      if (expanded) {
        return [...prevKeys, record.id];
      } else {
        return prevKeys.filter(key => key !== record.id);
      }
    });
  }, []);

  // Main table columns
  const columns = useMemo(() => [
    {
      title: '#',
      key: 'index',
      align: 'center',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      width: 120,
      render: (token) => <Tag color="blue">{token}</Tag>,
    },
    {
      title: 'Event',
      dataIndex: ['ticket', 'event', 'name'],
      key: 'event',
      sorter: (a, b) => a.ticket?.event?.name?.localeCompare(b.ticket?.event?.name),
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
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (totalAmount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ₹{Number(totalAmount || 0).toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
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
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
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
      
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>POS Bookings</Title>
            <Tag color="blue">{bookings.length} Total</Tag>
          </Space>
          
          <Space>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
            
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
              />
            </Tooltip>
            
            <Tooltip title="New Event">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('new')}
              />
            </Tooltip>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={isLoading}
          size="middle"
          scroll={{ x: 1800 }}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.related && record.related.length > 0,
            expandRowByClick: false,
            expandedRowKeys: expandedRowKeys,
            onExpand: handleExpand,
          }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      </Card>
    </>
  );
});

PosBooking.displayName = "PosBooking";
export default PosBooking;
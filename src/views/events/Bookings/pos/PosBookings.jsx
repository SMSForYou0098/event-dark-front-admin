import React, { memo, useState, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Tag,
  Typography,
  Tooltip,
  Modal,
  message,
  Switch,
} from "antd";
import {
  PrinterOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import POSPrintModal from "./POSPrintModal";
import POSPrinterManager from "./POSPrinterManager";
import { useMyContext } from "Context/MyContextProvider";
import { useNavigate } from "react-router-dom";
import { ExpandDataTable } from "views/events/common/ExpandDataTable";
import PermissionChecker from "layouts/PermissionChecker";
import Utils from "utils";
import { PERMISSIONS } from "constants/PermissionConstant";
import usePermission from "utils/hooks/usePermission";

const { confirm } = Modal;
const { Text } = Typography;

const PosBooking = memo(() => {
  const navigate = useNavigate();
  const { api, UserData, formatDateTime, authToken, UserPermissions, userRole } = useMyContext();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(null);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const printerRef = useRef(null);

  const canViewContact = usePermission(PERMISSIONS.VIEW_CONTACT_NUMBER);
  const canExportPos = usePermission(PERMISSIONS.EXPORT_POS_REPORTS);

  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Format date range for API
  const formattedDateRange = useMemo(() => {
    if (!dateRange || dateRange.length !== 2) return '';
    return `${dayjs(dateRange[0]).format('YYYY-MM-DD')},${dayjs(dateRange[1]).format('YYYY-MM-DD')}`;
  }, [dateRange]);

  // Fetch bookings with TanStack Query
  const {
    data: bookingsData = { bookings: [], pagination: null },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pos-bookings', UserData?.id, formattedDateRange, currentPage, pageSize, searchText, sortField, sortOrder],
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
      if (formattedDateRange) {
        params.set("date", formattedDateRange);
      }

      const url = `${api}bookings/pos/${UserData?.id}?${params.toString()}`;

      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.data.status) {
          throw new Error(response.data.message || 'Failed to fetch bookings');
        }

        const bookings = response.data.bookings || [];

        // Extract pagination data from response
        const paginationData = response.data.pagination || {
          current_page: currentPage,
          per_page: pageSize,
          total: bookings.length,
          last_page: 1,
        };

        return { bookings, pagination: paginationData };
      } catch (err) {
        throw err;
      }
    },
    enabled: !!UserData?.id && !!authToken,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Extract bookings and pagination from query data
  const bookings = useMemo(() => bookingsData.bookings || [], [bookingsData.bookings]);
  const pagination = bookingsData.pagination;

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
        ? `${api}booking/pos/restore/${id}`
        : `${api}booking/pos/delete/${id}`;

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
      message.error(Utils.getErrorMessage(error, 'Failed to update ticket status'));
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
    const isSetWithBookings =
      Boolean(selectedBooking.is_set) &&
      Array.isArray(selectedBooking.bookings) &&
      selectedBooking.bookings.length > 0;

    const hasRelatedBookings =
      Array.isArray(selectedBooking.bookings) &&
      selectedBooking.bookings.length > 0;

    // Build the unified list of bookings to compute from
    const allBookings = isSetWithBookings
      ? selectedBooking.bookings
      : hasRelatedBookings
        ? [selectedBooking, ...(selectedBooking.related ?? [])]
        : [selectedBooking];

    // Totals
    const subtotal = allBookings.reduce((sum, b) => {
      const baseAmount = parseFloat(b?.price ?? 0);
      const qty = parseInt(b?.quantity ?? 0, 10);
      return sum + baseAmount * qty;
    }, 0);

    const totalDiscount = allBookings.reduce((sum, b) => {
      return sum + parseFloat(b?.discount ?? 0);
    }, 0);

    const totalTax = allBookings.reduce((sum, b) => {
      return sum + parseFloat(b?.booking_tax?.total_tax ?? 0) + Number(b?.booking_tax?.convenience_fee);
    }, 0);

    const totalConvenienceFee = allBookings.reduce((sum, b) => {
      return sum + parseFloat(b?.booking_tax?.convenience_fee ?? 0);
    }, 0);

    // Grand total logic:
    // - For sets or bookings with related items, prefer the provided total_amount on the "parent".
    // - For a single booking, fall back to its amount.
    const grandTotal = parseFloat(selectedBooking?.total_amount ?? 0)

    // Event to show: prefer parent, else first booking’s event
    const event =
      selectedBooking?.ticket?.event ??
      allBookings?.[0]?.ticket?.event ??
      null;

    // Lightweight array (one entry per booking)
    const bookingData = allBookings.map((b) => ({
      id: b.id,
      token: b.token,
      quantity: b.quantity,
      discount: b.discount,
      price: b?.booking_tax?.base_amount ?? b?.price, // keep your existing precedence
      amount: b.amount,
      tax: b?.booking_tax?.total_tax ?? 0,
      created_at: b.created_at,
      ticket: {
        id: b?.ticket?.id,
        name: b?.ticket?.name,
      },
    }));

    return {
      event,
      bookingData, // array with 1+ items (set => multiple)
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
  ], []);

  // Main table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: 'Event',
        dataIndex: ['ticket', 'event', 'name'],
        align: 'center',
        key: 'event',
        sorter: (a, b) => a.ticket?.event?.name?.localeCompare(b.ticket?.event?.name),
      },
      {
        title: 'User',
        dataIndex: 'user_name',
        key: 'posUser',
        align: 'center',
        sorter: (a, b) => a.user_name?.localeCompare(b.user_name),
      },

      {
        title: 'Tkt',
        dataIndex: ['ticket', 'name'],
        key: 'ticket',
        align: 'center',
        width: 90,
        sorter: (a, b) => a.ticket?.name?.localeCompare(b.ticket?.name),
        render: (_, record) => {
          if (record.is_set === true) {
            return <Tag color="blue">M Tkts</Tag>;
          }

          const ticketName = record?.ticket?.name || record?.bookings?.[0]?.ticket?.name || '-';
          return <span>{ticketName}</span>;
        },
      },
      {
        title: 'QTY',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80,
        align: 'center',
        sorter: (a, b) => a.quantity - b.quantity,
      },
      {
        title: 'Disc',
        dataIndex: 'discount',
        key: 'discount',
        width: 100,
        align: 'center',
        render: (discount) => (
          <Text type="danger">₹{Number(discount || 0).toFixed(2)}</Text>
        ),
        sorter: (a, b) => (a.discount || 0) - (b.discount || 0),
      },
      {
        title: 'T Amt',
        dataIndex: 'total_amount',
        key: 'total_amount',
        align: 'center',
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
        width: 80,
        render: (status) => (
          <Tag color={status === "0" ? "warning" : "success"}>
            {status === "0" ? <ClockCircleOutlined className="m-0" /> : <CheckOutlined className="m-0" />}
          </Tag>
          //   {status === "0" ? "Unchecked" : "Checked"}
          // </Tag>
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
        align: 'center',
        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      },
      {
        title: 'P Date',
        dataIndex: 'created_at',
        key: 'purchaseDate',
        align: 'center',
        render: (date) => formatDateTime?.(date) || date,
        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      },
      {
        title: 'Organizer',
        dataIndex: 'reporting_user_name',
        key: 'organizer',
        align: 'center',
        sorter: (a, b) => a.reporting_user_name?.localeCompare(b.reporting_user_name),
      },

      {
        title: 'Status',
        dataIndex: 'is_deleted',
        key: 'ticketStatus',
        align: 'center',
        fixed: 'right',
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
      {
        title: '#',
        key: 'index',
        align: 'center',
        width: 20,
        render: (_, __, index) => index + 1,
      },
    ];

    // Conditionally add Contact column if user is Admin or has 'View Contact Number' permission
    if (canViewContact) {
      baseColumns.splice(baseColumns.length - 3, 0, {
        title: 'Contact',
        dataIndex: 'number',
        key: 'contact',
        width: 120,
        align: 'center',
        fixed: 'right',
      });
    }

    return baseColumns;
  }, [
    formatDateTime,
    handlePrintBooking,
    handleToggleStatus,
    toggleStatusMutation.isPending,
    canViewContact
  ]);

  const handleDateRangeChange = useCallback((dates) => {
    setCurrentPage(1); // Reset to first page on date change
    setDateRange(dates);
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

  return (
    <>
      {/* Always render POSPrinterManager to maintain connection state */}
      <POSPrinterManager ref={printerRef} />

      {showPrintModel && printModalData && (
        <POSPrintModal
          showPrintModel={showPrintModel}
          closePrintModel={closePrintModel}
          {...printModalData}
          printerRef={printerRef}
        />
      )}

      <ExpandDataTable
        title={"POS"}
        emptyText={`No POS bookings found`}
        onRefresh={refetch}
        innerColumns={expandedRowColumns}
        columns={columns}
        data={bookings}
        enableExport={true}
        exportRoute={'/bookings/pos/export'}
        ExportPermission={canExportPos}
        type={'pos'}
        extraHeaderContent={
          <PermissionChecker permission={[PERMISSIONS.ADD_POS_BOOKING]}>
            <Tooltip title="Add Booking">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('new')}
              />
            </Tooltip>
          </PermissionChecker>
        }
        showDateRange={true}
        showRefresh={true}
        showTotal={true}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        // Backend pagination props
        serverSide={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onSearch={handleSearchChange}
        onSortChange={handleSortChange}
        searchValue={searchText}
        // Loading and error
        loading={isLoading}
        error={error}
      />

    </>
  );

});

PosBooking.displayName = "PosBooking";
export default PosBooking;
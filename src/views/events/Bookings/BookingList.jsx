import React, { memo, Fragment, useRef, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "../common/DataTable";
import { Send, Ticket, CheckCircle, XCircle, Printer, PlusIcon } from 'lucide-react';
import { Button, Tag, Image, Space, Tooltip, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useMyContext } from "Context/MyContextProvider";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PermissionChecker from "layouts/PermissionChecker";

const BookingList = memo(({ isSponser = false, isAccreditation = false, isCorporate = false, isPos = false }) => {
    const {
        api,
        UserData,
        formatDateTime,
        sendTickets,
        authToken,
        truncateString,
        isMobile,
        userRole,
        UserPermissions,
        ErrorAlert
    } = useMyContext();

    // State declarations
    const [stickerData, setStickerData] = useState({});
    const [openStickerModal, setOpenStickerModal] = useState(false);
    const [printInvoiceData, setPrintInvoiceData] = useState({});
    const [showPrintModel, setShowPrintModel] = useState(false);
    const [dateRange, setDateRange] = useState(null);
    const [ticketData, setTicketData] = useState([]);
    const [ticketType, setTicketType] = useState();
    const [show, setShow] = useState(false);
    const ticketRefs = useRef([]);
    const queryClient = useQueryClient();

    // Export route
    const exportRoute = isPos
        ? 'export-posBooking'
        : isSponser
            ? 'export-sponsorBooking'
            : isAccreditation
                ? 'export-accreditationBooking'
                : isCorporate
                    ? 'export-corporateBooking'
                    : 'export-agentBooking';

    // API URL
    const getUrl = useCallback(() => {
        if (isPos) {
            return `${api}pos-bookings/${UserData?.id}`;
        } else if (isSponser) {
            return `${api}sponsor/list/${UserData?.id}`;
        } else if (isAccreditation) {
            return `${api}accreditation/list/${UserData?.id}`;
        } else if (isCorporate) {
            return `${api}corporate-bookings/${UserData?.id}`;
        } else {
            return `${api}agents/list/${UserData?.id}`;
        }
    }, [api, UserData, isPos, isSponser, isAccreditation, isCorporate]);

    // TanStack Query for bookings
    const fetchBookings = async () => {
        let queryParams = '';
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            queryParams = `?date=${dateRange.startDate},${dateRange.endDate}`;
        }
        const url = getUrl() + queryParams;
        const res = await axios.get(url, {
            headers: {
                'Authorization': 'Bearer ' + authToken,
            }
        });
        if (!res.data.status) throw new Error(res.data?.message || 'Failed to fetch bookings');
        return res.data.bookings;
    };

    const {
        data: bookings = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['agentBookings', { isPos, isSponser, isAccreditation, isCorporate, dateRange, userId: UserData?.id }],
        queryFn: fetchBookings,
        enabled: !!authToken && !!UserData?.id,
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
        onError: (err) => ErrorAlert(err.message),
    });

    // Print modal logic
    const handlePrintReceipt = (data) => {
        setPrintInvoiceData({
            event: data?.ticket?.event,
            bookingData: {
                token: data?.token,
                created_at: data?.created_at,
                quantity: data?.quantity,
                payment_method: data?.payment_method,
                ticket: {
                    name: data?.ticket?.name,
                    price: data?.ticket?.price
                },
            },
            grandTotal: data?.amount,
            discount: data?.discount || 0,
            totalTax: data?.totalTax || 0,
            subtotal: data?.subtotal || 0,
        });
        setShowPrintModel(true);
    };

    // Delete/Restore booking logic
    const DeleteBooking = useCallback(async (id) => {
        let data = bookings?.find((item) => item?.id === id);
        if (!data) return;
        let endpoint;
        if (isPos) {
            endpoint = data.is_deleted
                ? `${api}restore-pos-booking/${id}`
                : `${api}delete-pos-booking/${id}`;
        } else if (isAccreditation) {
            endpoint = data.is_deleted
                ? `${api}accreditation-restore-booking/${data?.token || data?.order_id}`
                : `${api}accreditation-delete-booking/${data?.token || data?.order_id}`;
        } else if (isSponser) {
            endpoint = data.is_deleted
                ? `${api}sponsor-restore-booking/${data?.token || data?.order_id}`
                : `${api}sponsor-delete-booking/${data?.token || data?.order_id}`;
        } else if (isCorporate) {
            endpoint = data.is_deleted
                ? `${api}restore-corporate-booking/${data?.id || data?.order_id}`
                : `${api}delete-corporate-booking/${data?.id || data?.order_id}`;
        } else {
            endpoint = data.is_deleted
                ? `${api}agent-restore-booking/${data?.token || data?.order_id}`
                : `${api}agent-delete-booking/${data?.token || data?.order_id}`;
        }
        const request = data.is_deleted ? axios.get : axios.delete;
        try {
            const res = await request(endpoint, {
                headers: { Authorization: "Bearer " + authToken }
            });
            if (res.data.status) {
                refetch();
                Swal.fire({
                    icon: "success",
                    title: data.is_deleted ? "Ticket Enabled!" : "Ticket Disabled!",
                    text: `Ticket ${data.is_deleted ? "enabled" : "disabled"} successfully.`,
                });
            }
        } catch (err) {
            ErrorAlert(err.response?.data?.message || "Failed to update booking");
        }
    }, [bookings, api, authToken, refetch, isPos, isAccreditation, isSponser, isCorporate, ErrorAlert]);

    // Format data for table
    const formatBookingData = (bookings) => {
        return bookings.map(booking => ({
            ...booking,
            key: booking.id,
        }));
    };

    // Columns for DataTable
    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            render: (_, __, index) => index + 1,
            searchable: false,
        },
        {
            title: 'Event',
            dataIndex: isPos ? 'ticket.event.name' : 'event_name',
            key: 'event_name',
            align: 'center',
            searchable: true,
            render: (_, record) => {
                const eventName = isPos
                    ? record?.ticket?.event?.name
                    : record?.bookings?.[0]?.ticket?.event?.name || record?.ticket?.event?.name || "";
                return (
                    <Tooltip title={eventName}>
                        <span>{truncateString(eventName)}</span>
                    </Tooltip>
                );
            },
        },
        ...(userRole !== 'POS' && !isPos
            ? [{
                title: 'User',
                dataIndex: 'user_name',
                key: 'user_name',
                align: 'center',
                searchable: true,
            }]
            : []),
        {
            title: 'Organizer',
            dataIndex: isPos ? 'reporting_user_name' : 'agent_name',
            key: 'organizer',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Ticket',
            dataIndex: 'ticket.name',
            key: 'ticket_name',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            searchable: false,
        },
        {
            title: 'Disc',
            dataIndex: 'discount',
            key: 'discount',
            align: 'center',
            searchable: false,
            render: (cell) => <span className="text-danger">₹{cell}</span>,
        },
        {
            title: 'Mode',
            dataIndex: 'payment_method',
            key: 'payment_method',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Amt',
            dataIndex: 'amount',
            key: 'amount',
            align: 'center',
            searchable: false,
            render: (cell) => `₹${cell}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            searchable: false,
            render: (cell) => (
                <Tag color={cell === "0" ? "orange" : "green"}>
                    {cell === "0" ? "Uncheck" : "Checked"}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            searchable: false,
            render: (_, record) => {
                const isDisabled = record?.is_deleted === true || record?.status === "1";
                const actions = [
                    {
                        key: 'print',
                        label: 'Print Ticket',
                        icon: <Printer size={14} />,
                        onClick: () => handlePrintReceipt(record),
                        disabled: isDisabled,
                    },
                    {
                        key: 'toggle',
                        label: record?.is_deleted ? 'Enable Ticket' : 'Disable Ticket',
                        icon: record?.is_deleted ? <CheckCircle size={14} /> : <XCircle size={14} />,
                        onClick: () => DeleteBooking(record.id),
                        disabled: false,
                    }
                ];
                if (!isPos) {
                    actions.unshift({
                        key: 'resend',
                        label: 'Resend Ticket',
                        icon: <Send size={14} />,
                        onClick: () => sendTickets(record, "old", true, "Online Booking"),
                        disabled: isDisabled,
                    });
                    actions.unshift({
                        key: 'generate',
                        label: 'Generate Ticket',
                        icon: <Ticket size={14} />,
                        onClick: () => { }, // Add your generate logic here
                        disabled: isDisabled,
                    });
                }
                // For mobile, use dropdown
                if (isMobile) {
                    return (
                        <Dropdown
                            menu={{
                                items: actions.filter(action => !action.disabled).map(action => ({
                                    key: action.key,
                                    label: action.label,
                                    icon: action.icon,
                                    onClick: action.onClick,
                                }))
                            }}
                            trigger={['click']}
                        >
                            <Button type="text" icon={<MoreOutlined />} size="small" />
                        </Dropdown>
                    );
                }
                // For desktop, show buttons
                return (
                    <Space size="small">
                        {actions.map((action, index) => (
                            <Tooltip key={index} title={action.label}>
                                <Button
                                    type={action.key === 'toggle' ? (record?.is_deleted ? 'primary' : 'default') : 'default'}
                                    danger={action.key === 'toggle' && !record?.is_deleted}
                                    icon={action.icon}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    size="small"
                                />
                            </Tooltip>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Purchase Date',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            searchable: false,
            render: (date) => formatDateTime(date),
        },
    ];

    const handleDateRangeChange = (dates) => {
        setDateRange(dates ? {
            startDate: dates[0].format('YYYY-MM-DD'),
            endDate: dates[1].format('YYYY-MM-DD')
        } : null);
    };

    const exportPermission = isPos
        ? 'Export POS Bookings'
        : isAccreditation
            ? 'Export Accreditation Bookings'
            : isSponser
                ? 'Export Sponsor Bookings'
                : isCorporate
                    ? 'Export Corporate Bookings'
                    : 'Export Agent Bookings';

    return (
        <Fragment>
            <DataTable
                title={`${isPos ? 'POS' : isAccreditation ? 'Accreditation' : isSponser ? "Sponsor" : isCorporate ? 'Corporate' : "Agent"} Bookings`}
                data={formatBookingData(bookings)}
                columns={columns}
                showDateRange={true}
                showRefresh={true}
                showTotal={true}
                showAddButton={true}
                extraHeaderContent={
                    <PermissionChecker permission="New Booking">
                        <Tooltip title={"Add Booking"}>
                            <Button
                                type="primary"
                                icon={<PlusIcon size={16} />}
                                // onClick={handleBookings}
                            />
                        </Tooltip>
                    </PermissionChecker>
                }
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                loading={isLoading}
                error={error}
                enableExport={true}
                exportRoute={exportRoute}
                ExportPermission={UserPermissions?.includes(exportPermission)}
                authToken={authToken}
                onRefresh={refetch}
                tableProps={{
                    scroll: { x: 1500 },
                    size: isMobile ? "small" : "middle",
                }}
            />
        </Fragment>
    );
});

BookingList.displayName = "BookingList";
export default BookingList;
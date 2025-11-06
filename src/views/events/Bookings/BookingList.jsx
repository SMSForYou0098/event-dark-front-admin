import React, { memo, Fragment, useState, useCallback, useMemo, useRef } from "react";
import DataTable from "../common/DataTable";
import { Send, Ticket, PlusIcon } from 'lucide-react';
import { Button, Tag, Space, Tooltip, Dropdown, Switch, message, Modal, Table } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useMyContext } from "Context/MyContextProvider";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import api from 'auth/FetchInterceptor';
import TicketModal from "../Tickets/modals/TicketModal";
import { downloadTickets } from "../Tickets/ticketUtils";
import { ExpandDataTable } from "../common/ExpandDataTable";
import PermissionChecker from "layouts/PermissionChecker";

const BookingList = memo(({ type = 'agent' }) => {
    const { UserData, formatDateTime, sendTickets, truncateString, isMobile, UserPermissions } = useMyContext();

    const [dateRange, setDateRange] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [ticketData, setTicketData] = useState([]);
    const [ticketType, setTicketType] = useState();
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ticketOptionModal, setTicketOptionModal] = useState({ visible: false, hasMultiple: false });
    const ticketRefs = useRef([]);

    // Configuration based on type
    const config = useMemo(() => {
        const configs = {
            agent: {
                title: 'Agent Bookings',
                apiUrl: `${type}/list/${UserData?.id}`,
                exportRoute: 'export-agentBooking',
                exportPermission: 'Export Agent Bookings',
                deleteEndpoint: (data) => {return(data.is_deleted
                    ? `restore/${type}/${data?.is_master ? data?.bookings[0]?.master_token : data?.token || data?.order_id}`
                    : `disable/${type}/${data?.is_master ? data?.bookings[0]?.master_token : data?.token || data?.order_id}`)},
            },
            sponsor: {
                title: 'Sponsor Bookings',
                apiUrl: `sponsor/list/${UserData?.id}`,
                exportRoute: 'export-sponsorBooking',
                exportPermission: 'Export Sponsor Bookings',
                deleteEndpoint: (data) => data.is_deleted
                    ? `disable/${type}/${data?.is_master ? data?.bookings[0]?.master_token : data?.token || data?.order_id}`
                    : `disable/${type}/${data?.is_master ? data?.bookings[0]?.master_token : data?.token || data?.order_id}`,
            },
            accreditation: {
                title: 'Accreditation Bookings',
                apiUrl: `accreditation/list/${UserData?.id}`,
                exportRoute: 'export-accreditationBooking',
                exportPermission: 'Export Accreditation Bookings',
                deleteEndpoint: (data) => data.is_deleted
                    ? `accreditation-restore-booking/${data?.token || data?.order_id}`
                    : `accreditation-delete-booking/${data?.token || data?.order_id}`,
            },
            corporate: {
                title: 'Corporate Bookings',
                apiUrl: `corporate-bookings/${UserData?.id}`,
                exportRoute: 'export-corporateBooking',
                exportPermission: 'Export Corporate Bookings',
                deleteEndpoint: (data) => data.is_deleted
                    ? `restore-corporate-booking/${data?.id || data?.order_id}`
                    : `delete-corporate-booking/${data?.id || data?.order_id}`,
            },
        };

        return configs[type] || configs.agent;
    }, [type, UserData?.id]);

    // TanStack Query for bookings
    const {
        data: bookings = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['bookings', type, dateRange, UserData?.id],
        queryFn: async () => {
            let queryParams = '';
            if (dateRange && dateRange.startDate && dateRange.endDate) {
                queryParams = `?date=${dateRange.startDate},${dateRange.endDate}`;
            }
            const url = `${config.apiUrl}${queryParams}`;

            const response = await api.get(url);

            if (response.status && response.bookings) {
                return response.bookings;
            } else {
                throw new Error(response?.message || 'Failed to fetch bookings');
            }
        },
        enabled: !!UserData?.id,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Toggle booking status mutation
    const toggleBookingMutation = useMutation({
        mutationFn: async ({ id, data }) => {            
            const endpoint = config.deleteEndpoint(data);
            const request = data.is_deleted ? api.get : api.delete;

            const response = await request(endpoint);

            if (!response.status) {
                throw new Error(response.message || 'Failed to update booking');
            }

            return response;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['bookings', type]);
            message.success(
                variables.data.is_deleted
                    ? 'Ticket enabled successfully!'
                    : 'Ticket disabled successfully!'
            );
        },
        onError: (error) => {
            message.error(error.message || 'Failed to update booking');
        },
    });

    // Delete/Restore booking
    const DeleteBooking = useCallback((data) => {
        // const data = bookings?.find((item) => item?.id === id);
        if (!data) return;

        toggleBookingMutation.mutate({ id:data.id, data });
    }, [ toggleBookingMutation]);

    // Format data for table
    const formatBookingData = (bookings) => {
        return bookings.map(booking => ({
            ...booking,
            key: booking.id,
        }));
    };

    const getUserName = (record) =>
        record?.bookings?.[0]?.user?.name ||
        record?.user?.name ||
        "N/A";


    // Handle ticket option selection
    const handleTicketOption = useCallback((option) => {
        setTicketType({ type: option });
        setTicketOptionModal({ visible: false, hasMultiple: false });
        setShow(true);
    }, []);

    // Show ticket options modal
    const showTicketOptionsModal = useCallback((hasMultiple) => {
        setTicketOptionModal({ visible: true, hasMultiple });
    }, []);

    const GenerateTicket = useCallback((id) => {
        let data = bookings?.find((item) => item?.id === id);
        setTicketData(data);
        const hasMultiple = data?.bookings?.length > 0;
        showTicketOptionsModal(hasMultiple);
    }, [bookings, showTicketOptionsModal]);


    const handleDateRangeChange = useCallback((dates) => {
        setDateRange(dates ? {
            startDate: dates[0].format('YYYY-MM-DD'),
            endDate: dates[1].format('YYYY-MM-DD')
        } : null);
    }, []);

    const downloadTicket = () => {
        downloadTickets(ticketRefs, ticketType?.type, setLoading);
    }

    function handleCloseModal() {
        setTicketData([])
        setTicketType()
        setShow(false)
    }

    function handleCloseTicketOptionModal() {
        setTicketOptionModal({ visible: false, hasMultiple: false });
        setTicketData([]);
    }

    const innerColumns = [
        {
            title: "#",
            key: "index",
            align: "center",
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: "Ticket",
            key: "ticket",
            align: "center",
            render: (_, record) => {
                const ticketName = record?.ticket?.name || record?.bookings?.[0]?.ticket?.name || "-";
                return (
                    <Tooltip title={ticketName}>
                        <span>{truncateString(ticketName)}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            align: "center",
        },
        {
            title: "Amount",
            dataIndex: "total_amount",
            key: "total_amount",
            align: "center",
            render: (cell) => `₹${Number(cell).toFixed(2)}`,
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
                            <Tag icon={<CloseCircleOutlined />} color="error" />
                        </Tooltip>
                    );
                }
                const status =
                    record.status || (record.bookings && record.bookings[0]?.status);

                return status === "0" ? (
                    <Tooltip title="Pending">
                        <Tag icon={<ClockCircleOutlined />} color="warning" />
                    </Tooltip>
                ) : (
                    <Tooltip title="Scanned">
                        <Tag icon={<CheckCircleOutlined />} color="success" />
                    </Tooltip>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'is_deleted',
            key: 'ticket_status',
            align: 'center',
            width: 120,
            render: (isDeleted, record) => (
                <Switch
                    checked={!isDeleted}
                    onChange={() => DeleteBooking(record)}
                    checkedChildren="Active"
                    unCheckedChildren="Disabled"
                    loading={toggleBookingMutation.isPending}
                    disabled={record.status === "1"}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            width: isMobile ? 70 : 120,
            render: (_, record) => {
                const isDisabled = record?.is_deleted === true || record?.status === "1";

                const actions = [
                    {
                        key: 'generate',
                        label: 'Generate Ticket',
                        icon: <Ticket size={14} />,
                        onClick: () => GenerateTicket(record.id),
                        disabled: isDisabled,
                    },
                    {
                        key: 'resend',
                        label: 'Resend Ticket',
                        type: 'primary',
                        icon: <Send size={14} />,
                        onClick: () => sendTickets(record, "old", true, "Online Booking"),
                        disabled: isDisabled,
                    },
                ];

                if (isMobile) {
                    return (
                        <Dropdown
                            menu={{
                                items: actions
                                    .filter(action => !action.disabled)
                                    .map(action => ({
                                        key: action.key,
                                        label: action.label,
                                        icon: action.icon,
                                        onClick: action.onClick,
                                    })),
                            }}
                            trigger={['click']}
                        >
                            <Button type="text" icon={<MoreOutlined />} size="small" />
                        </Dropdown>
                    );
                }

                return (
                    <Space size="small">
                        {actions.map((action) => (
                            <Tooltip key={action.key} title={action.label}>
                                <Button
                                    type={action.type}
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
        // {
        //     title: "Purchase Date",
        //     dataIndex: "created_at",
        //     key: "created_at",
        //     align: "center",
        //     render: (date) =>
        //         new Date(date).toLocaleString("en-IN", {
        //             dateStyle: "medium",
        //             timeStyle: "short",
        //         }),
        // },
    ];


    // Columns for DataTable
    const columns = useMemo(() => [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Event',
            dataIndex: 'event_name',
            key: 'event_name',
            align: 'center',
            searchable: true,
            render: (_, record) => {
                const eventName = record?.bookings[0]?.ticket?.event?.name || record?.ticket?.event?.name || "";
                return (
                    <Tooltip title={eventName}>
                        <span>{truncateString(eventName)}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: "User",
            key: "user_name",
            align: "center",
            dataIndex: ["bookings", 0, "user", "name"],
            render: (_, record) => {
                const name = getUserName(record);
                return (
                    <Tooltip title={name}>
                        <span>{truncateString(name)}</span>
                    </Tooltip>
                );
            },
            sorter: (a, b) => getUserName(a).localeCompare(getUserName(b)),
        },
        {
            title: 'Organization',
            dataIndex: 'organizer',
            key: 'organizer',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Booked By',
            dataIndex: 'agent_name',
            key: 'organizer',
            align: 'center',
            searchable: true,
        },
        {
            title: "Ticket",
            key: "ticket_name",
            align: "center",
            render: (_, record) => {
                const ticketName = record?.ticket?.name || record?.bookings[0]?.ticket?.name;
                if (record.is_set === true) {
                    return <Tag color="blue">Multi Tickets</Tag>;
                }
                return (
                    <Tooltip title={ticketName}>
                        <span>{truncateString(ticketName)}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            width: 80,
        },
        {
            title: 'Disc',
            dataIndex: 'discount',
            key: 'discount',
            align: 'center',
            width: 100,
            render: (cell) => <span className="text-danger">₹{cell}</span>,
        },
        {
            title: 'Mode',
            dataIndex: 'payment_method',
            key: 'payment_method',
            align: 'center',
            searchable: true,
            width: 120,
        },
        {
            title: 'Amt',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'center',
            width: 120,
            render: (cell) => `₹${cell}`,
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
                            <Tag icon={<CloseCircleOutlined className='m-0'/>} color="error" />
                        </Tooltip>
                    );
                }
                const status =
                    record.status || (record.bookings && record.bookings[0]?.status);

                return status === "0" ? (
                    <Tooltip title="Pending">
                        <Tag icon={<ClockCircleOutlined className='m-0'/>} color="warning" />
                    </Tooltip>
                ) : (
                    <Tooltip title="Scanned">
                        <Tag icon={<CheckCircleOutlined className='m-0'/>} color="success" />
                    </Tooltip>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'is_deleted',
            key: 'ticket_status',
            align: 'center',
            width: 120,
            render: (isDeleted, record) => {
                // If it's a multi-ticket booking, don't show switch in main row
                if (record.is_set === true) {
                    return <span>-</span>;
                }

                return (
                    <Switch
                        checked={!isDeleted}
                        onChange={() => DeleteBooking(record)}
                        checkedChildren=""
                        unCheckedChildren=""
                        loading={toggleBookingMutation.isPending}
                        disabled={record.status === "1"}
                    />
                );
            },
        },
        {
            title: 'Purchase Date',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            width: 160,
            render: (date) => formatDateTime(date),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            fixed: 'right',
            width: isMobile ? 70 : 120,
            render: (_, record) => {
                // If it's a multi-ticket booking, don't show actions in main row
                if (record.is_set === true) {
                    return <span>-</span>;
                }

                const isDisabled = record?.is_deleted === true || record?.status === "1";

                const actions = [
                    {
                        key: 'generate',
                        label: 'Generate Ticket',
                        icon: <Ticket size={14} />,
                        onClick: () => GenerateTicket(record.id),
                        disabled: isDisabled,
                        permissions: 'Generate Tickets'
                    },
                    {
                        key: 'resend',
                        label: 'Resend Ticket',
                        type: 'primary',
                        icon: <Send size={14} />,
                        onClick: () => sendTickets(record, "old", true, "Online Booking"),
                        disabled: isDisabled,
                        permissions: "Resend Tickets"
                    },
                ];

                if (isMobile) {
                    return (
                        <Dropdown
                            menu={{
                                items: actions
                                    .filter(action => !action.disabled)
                                    .map(action => ({
                                        key: action.key,
                                        label: action.label,
                                        icon: action.icon,
                                        onClick: action.onClick,
                                    })),
                            }}
                            trigger={['click']}
                        >
                            <Button type="text" icon={<MoreOutlined />} size="small" />
                        </Dropdown>
                    );
                }

                return (
                    <Space size="small">
                        {actions.map((action) => (
                            <Tooltip key={action.key} title={action.label}>
                                <PermissionChecker permission={action.permissions}>
                                    <Button
                                        type={action.type}
                                        icon={action.icon}
                                        onClick={action.onClick}
                                        disabled={action.disabled}
                                        size="small"
                                    />
                                </PermissionChecker>
                            </Tooltip>
                        ))}
                    </Space>
                );
            },
        },
    ], [
        truncateString,
        toggleBookingMutation.isPending,
        formatDateTime,
        sendTickets,
        isMobile,
        DeleteBooking,
        GenerateTicket,
    ]);
    return (
        <Fragment>
            {/* Ticket Options Modal */}
            <Modal
                title={
                    <Space>
                        <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <span>Select an Option</span>
                    </Space>
                }
                open={ticketOptionModal.visible}
                onCancel={handleCloseTicketOptionModal}
                footer={null}
                width={400}
            >
                <div style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 20, fontSize: 14 }}>
                        {ticketOptionModal.hasMultiple
                            ? 'Would you like to combine the tickets or keep them individual?'
                            : 'Would you like to combine the tickets?'}
                    </p>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Button
                            type="primary"
                            block
                            onClick={() => handleTicketOption('combine')}
                            size="large"
                        >
                            Group
                        </Button>
                        {ticketOptionModal.hasMultiple && (
                            <>
                                <Button
                                    block
                                    onClick={() => handleTicketOption('individual')}
                                    size="large"
                                >
                                    Individual
                                </Button>
                                <Button
                                    block
                                    onClick={() => handleTicketOption('zip')}
                                    size="large"
                                >
                                    Zip
                                </Button>
                            </>
                        )}
                    </Space>
                </div>
            </Modal>

            {/* Ticket Display Modal */}
            <TicketModal
                show={show}
                handleCloseModal={handleCloseModal}
                ticketType={ticketType}
                ticketData={ticketData}
                ticketRefs={ticketRefs}
                loading={loading}
                isAccreditation={type === 'accreditation' ? true : false}
                showTicketDetails={false}
                downloadTicket={downloadTicket}
                isMobile={isMobile}
                formatDateRange={dateRange}
            />
            <ExpandDataTable
                title={config.title}
                emptyText={`No ${type} bookings found`}
                onRefresh={refetch}
                innerColumns={innerColumns}
                columns={columns}
                data={formatBookingData(bookings)}
                exportRoute={config.exportRoute}
                ExportPermission={UserPermissions?.includes(config.exportPermission)}
                tableProps={{
                    scroll: { x: 1500 },
                    size: isMobile ? "small" : "middle",
                }}
                extraHeaderContent={
                    <Tooltip title="Add Booking">
                        <Button
                            type="primary"
                            icon={<PlusIcon size={16} />}
                            onClick={() => navigate(`new`)}
                        />
                    </Tooltip>
                }
                showDateRange={true}
                showRefresh={true}
                showTotal={true}

                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                loading={isLoading || toggleBookingMutation.isPending}
                error={error}
                enableExport={true}
                type={type}
            />

        </Fragment>
    );
});

BookingList.displayName = "BookingList";
export default BookingList;
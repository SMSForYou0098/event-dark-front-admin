import React, { memo, Fragment, useState, useCallback, useMemo, useRef } from "react";
import { Send, Ticket, PlusIcon } from 'lucide-react';
import { Button, Tag, Space, Tooltip, Dropdown, Switch, message, Modal, Spin } from 'antd';
import { MoreOutlined, QuestionCircleOutlined, LoadingOutlined, CloseOutlined, CheckOutlined, BlockOutlined } from '@ant-design/icons';
import { useMyContext } from "Context/MyContextProvider";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import api from 'auth/FetchInterceptor';
import TicketModal from "../Tickets/modals/TicketModal";
import { downloadTickets } from "../Tickets/ticketUtils";
import { ExpandDataTable } from "../common/ExpandDataTable";
import PermissionChecker from "layouts/PermissionChecker";
import { resendTickets } from "./agent/utils";

const BookingList = memo(({ type = 'agent' }) => {
    const { UserData, formatDateTime, truncateString, isMobile, UserPermissions } = useMyContext();

    const [dateRange, setDateRange] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [ticketData, setTicketData] = useState([]);
    const [ticketType, setTicketType] = useState();
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    // id of the row currently processing resend -> shows spinner only for that row
    const [loadingId, setLoadingId] = useState(null);
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
                deleteEndpoint: (data) => {
                    return (data.is_deleted
                        ? `restore/${type}/${data?.is_master ? data?.bookings[0]?.master_token : data?.token || data?.order_id}`
                        : `disable/${type}/${data?.is_master ? data?.bookings[0]?.master_token : data?.token || data?.order_id}`)
                },
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

    const HandleSendTicket = useCallback(async (record) => {
        // use id if present otherwise fallback to set_id
        const rowId = record?.id ?? record?.set_id;
        if (!rowId) return;
        setLoadingId(rowId);
        try {
            await resendTickets(record, type);
        } catch (err) {
            // ignore / handle if needed
        } finally {
            setLoadingId(null);
        }
    }, [type]);

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

        toggleBookingMutation.mutate({ id: data.id, data });
    }, [toggleBookingMutation]);

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

    const GenerateTicket = useCallback((data) => {
        setTicketData(data);
        const hasMultiple = data?.bookings?.length > 0;
        showTicketOptionsModal(hasMultiple);
    }, [showTicketOptionsModal]);


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

    const createCommonColumns = (options = {}) => {
        const {
            showIndex = true,
            showEvent = false,
            showUser = false,
            showOrganizer = false,
            showAgent = false,
            showDiscount = false,
            showPaymentMethod = false,
            showPurchaseDate = false,
            isNested = false,
            isMobile = false,
            handlers = {},
            loading = {},
        } = options;

        const columns = [];

        // Index column
        if (showIndex) {
            columns.push({
                title: "#",
                key: "index",
                align: "center",
                width: isNested ? 20 : 60,
                render: (_, __, index) => index + 1,
            });
        }

        // Event column
        if (showEvent) {
            columns.push({
                title: 'Event',
                dataIndex: 'event_name',
                key: 'event_name',
                align: 'center',
                searchable: true,
                render: (_, record) => {
                    const eventName = record?.bookings?.[0]?.ticket?.event?.name || record?.ticket?.event?.name || "";
                    return (
                        <Tooltip title={eventName}>
                            <span>{truncateString(eventName)}</span>
                        </Tooltip>
                    );
                },
            });
        }

        // User column
        if (showUser) {
            columns.push({
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
            });
        }

        // Organizer column
        if (showOrganizer) {
            columns.push({
                title: 'Organization',
                dataIndex: 'organizer',
                key: 'organizer',
                align: 'center',
                searchable: true,
            });
        }

        // Agent column
        if (showAgent) {
            columns.push({
                title: 'Booked By',
                dataIndex: 'agent_name',
                key: 'agent_name',
                align: 'center',
                searchable: true,
            });
        }

        // Ticket column (common for both)
        columns.push({
            title: "Ticket",
            key: isNested ? "ticket" : "ticket_name",
            align: "center",
            render: (_, record) => {
                const ticketName = record?.ticket?.name || record?.bookings?.[0]?.ticket?.name || "-";

                if (!isNested && record.is_set === true) {
                    return <Tag color="blue">Multi Tickets</Tag>;
                }

                return (
                    <Tooltip title={ticketName}>
                        <span>{truncateString(ticketName)}</span>
                    </Tooltip>
                );
            },
        });

        // Quantity column (common for both)
        columns.push({
            title: isNested ? "Quantity" : "Qty",
            dataIndex: "quantity",
            key: "quantity",
            align: "center",
            width: isNested ? undefined : 80,
        });

        // Discount column
        if (showDiscount) {
            columns.push({
                title: 'Disc',
                dataIndex: 'discount',
                key: 'discount',
                align: 'center',
                width: 100,
                render: (cell) => <span className="text-danger">₹{cell}</span>,
            });
        }

        // Payment Method column
        if (showPaymentMethod) {
            columns.push({
                title: 'Mode',
                dataIndex: 'payment_method',
                key: 'payment_method',
                align: 'center',
                searchable: true,
                width: 120,
            });
        }

        // Amount column (common for both)
        columns.push({
            title: isNested ? "Amount" : "Amt",
            dataIndex: "total_amount",
            key: "total_amount",
            align: "center",
            width: isNested ? undefined : 120,
            render: (cell) => `₹${Number(cell).toFixed(2)}`,
        });

        // Status column (common for both)
        columns.push({
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: "center",
            render: (_, record) => {
                if (record.is_deleted) {
                    return (
                        <Tooltip title="Disabled">
                            <Tag color="error">
                                <BlockOutlined className='m-0' />
                            </Tag>
                        </Tooltip>
                    );
                }
                const status = record.status || record.bookings?.[0]?.status;

                return status === "0" ? (
                    <Tooltip title="Pending">
                        <Tag color="warning">
                            <CloseOutlined className='m-0' />
                        </Tag>
                    </Tooltip>
                ) : (
                    <Tooltip title="Scanned">
                        <Tag color="success">
                            <CheckOutlined className='m-0' />
                        </Tag>
                    </Tooltip>
                );
            },
        });

        // Switch Status column (common for both)
        columns.push({
            title: 'Status',
            dataIndex: 'is_deleted',
            key: 'ticket_status',
            align: 'center',
            width: 120,
            render: (isDeleted, record) => {
                // For main table, hide switch for multi-ticket bookings
                if (!isNested && record.is_set === true) {
                    return <span>-</span>;
                }

                return (
                    <Switch
                        checked={!isDeleted}
                        onChange={() => handlers.onDelete?.(record)}
                        checkedChildren={isNested ? "Active" : ""}
                        unCheckedChildren={isNested ? "Disabled" : ""}
                        loading={loading.togglePending}
                        disabled={record.status === "1"}
                    />
                );
            },
        });

        // Purchase Date column
        if (showPurchaseDate) {
            columns.push({
                title: 'Purchase Date',
                dataIndex: 'created_at',
                key: 'created_at',
                align: 'center',
                width: 160,
                render: (date) => formatDateTime(date),
                sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
            });
        }

        // Actions column (common for both)
        columns.push({
            title: 'Actions',
            key: 'actions',
            align: 'center',
            fixed: isNested ? undefined : 'right',
            width: isMobile ? 70 : 120,
            render: (_, record) => {
                const isDisabled = record?.is_deleted === true || record?.status === "1";

                const actions = [
                    {
                        key: 'generate',
                        label: 'Generate Ticket',
                        icon: <Ticket size={14} />,
                        onClick: () => handlers.onGenerate?.(record),
                        disabled: isDisabled || (!isNested && record.is_set === true),
                        permissions: 'Generate Tickets'
                    },
                    {
                        key: 'resend',
                        label: loading.currentId === (record.id ?? record.set_id) ? 'Resending...' : 'Resend Ticket',
                        type: loading.currentId === (record.id ?? record.set_id) ? 'default' : 'primary',
                        icon: loading.currentId === (record.id ?? record.set_id) ?
                            <LoadingOutlined style={{ fontSize: 14 }} spin /> :
                            <Send size={14} />,
                        onClick: () => handlers.onResend?.(record),
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
                        {actions.map((action) => {
                            const ButtonComponent = (
                                <Button
                                    type={action.type}
                                    icon={action.icon}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    size="small"
                                />
                            );

                            return (
                                <Tooltip key={action.key} title={action.label}>
                                    {!isNested && action.permissions ? (
                                        <PermissionChecker permission={action.permissions}>
                                            {ButtonComponent}
                                        </PermissionChecker>
                                    ) : (
                                        ButtonComponent
                                    )}
                                </Tooltip>
                            );
                        })}
                    </Space>
                );
            },
        });

        return columns;
    };

    const innerColumns = useMemo(() =>
        createCommonColumns({
            showIndex: true,
            isNested: true,
            isMobile,
            handlers: {
                onDelete: DeleteBooking,
                onGenerate: GenerateTicket,
                onResend: HandleSendTicket,
            },
            loading: {
                togglePending: toggleBookingMutation.isPending,
                currentId: loadingId,
            },
        }),[isMobile, DeleteBooking, GenerateTicket, HandleSendTicket, toggleBookingMutation.isPending, loadingId]);
    
        // Columns for DataTable
    const columns = useMemo(() =>
        createCommonColumns({
            showIndex: true,
            showEvent: true,
            showUser: true,
            showOrganizer: true,
            showAgent: true,
            showDiscount: true,
            showPaymentMethod: true,
            showPurchaseDate: true,
            isNested: false,
            isMobile,
            handlers: {
                onDelete: DeleteBooking,
                onGenerate: GenerateTicket,
                onResend: HandleSendTicket,
            },
            loading: {
                togglePending: toggleBookingMutation.isPending,
                currentId: loadingId,
            },
        }), [isMobile, DeleteBooking, GenerateTicket, HandleSendTicket, toggleBookingMutation.isPending, loadingId]);

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
                    <PermissionChecker permission={["Add Agent Booking", "Create POS Bookings", "Add Sponsor Booking"]} matchType="OR">
                        <Tooltip title="Add Booking">
                            <Button
                                type="primary"
                                icon={<PlusIcon size={16} />}
                                onClick={() => navigate(`new`)}
                            />
                        </Tooltip>
                    </PermissionChecker>
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
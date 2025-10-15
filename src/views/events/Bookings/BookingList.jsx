import React, { memo, Fragment, useState, useCallback, useMemo } from "react";
import DataTable from "../common/DataTable";
import { Send, Ticket, PlusIcon } from 'lucide-react';
import { Button, Tag, Space, Tooltip, Dropdown, Switch, message } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useMyContext } from "Context/MyContextProvider";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import api from 'auth/FetchInterceptor';

const BookingList = memo(({ type = 'agent' }) => {
    const { UserData, formatDateTime, sendTickets, truncateString, isMobile, UserPermissions } = useMyContext();

    const [dateRange, setDateRange] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Configuration based on type
    const config = useMemo(() => {
        const configs = {
            agent: {
                title: 'Agent Bookings',
                apiUrl: `agents/list/${UserData?.id}`,
                exportRoute: 'export-agentBooking',
                exportPermission: 'Export Agent Bookings',
                deleteEndpoint: (data) => data.is_deleted 
                    ? `agent-restore-booking/${data?.token || data?.order_id}`
                    : `agent-delete-booking/${data?.token || data?.order_id}`,
            },
            sponsor: {
                title: 'Sponsor Bookings',
                apiUrl: `sponsor/list/${UserData?.id}`,
                exportRoute: 'export-sponsorBooking',
                exportPermission: 'Export Sponsor Bookings',
                deleteEndpoint: (data) => data.is_deleted
                    ? `sponsor-restore-booking/${data?.token || data?.order_id}`
                    : `sponsor-delete-booking/${data?.token || data?.order_id}`,
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
    const DeleteBooking = useCallback((id) => {
        const data = bookings?.find((item) => item?.id === id);
        if (!data) return;

        toggleBookingMutation.mutate({ id, data });
    }, [bookings, toggleBookingMutation]);

    // Format data for table
    const formatBookingData = (bookings) => {
        return bookings.map(booking => ({
            ...booking,
            key: booking.id,
        }));
    };

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
                const eventName = record?.bookings?.[0]?.ticket?.event?.name || record?.ticket?.event?.name || "";
                return (
                    <Tooltip title={eventName}>
                        <span>{truncateString(eventName)}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'User',
            dataIndex: 'user_name',
            key: 'user_name',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Organizer',
            dataIndex: 'agent_name',
            key: 'organizer',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Ticket',
            dataIndex: ['ticket', 'name'],
            key: 'ticket_name',
            align: 'center',
            searchable: true,
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
            dataIndex: 'amount',
            key: 'amount',
            align: 'center',
            width: 120,
            render: (cell) => `₹${cell}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: 100,
            render: (cell) => (
                <Tag color={cell === "0" ? "orange" : "green"}>
                    {cell === "0" ? "Uncheck" : "Checked"}
                </Tag>
            ),
        },
        {
            title: 'Ticket Status',
            dataIndex: 'is_deleted',
            key: 'ticket_status',
            align: 'center',
            width: 120,
            render: (isDeleted, record) => (
                <Switch
                    checked={!isDeleted}
                    onChange={() => DeleteBooking(record.id)}
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
            fixed: 'right',
            width: isMobile ? 70 : 120,
            render: (_, record) => {
                const isDisabled = record?.is_deleted === true || record?.status === "1";

                const actions = [
                    {
                        key: 'generate',
                        label: 'Generate Ticket',
                        icon: <Ticket size={14} />,
                        onClick: () => {
                            // TODO: Add your generate logic here
                            message.info('Generate ticket functionality coming soon');
                        },
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
        {
            title: 'Purchase Date',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            width: 160,
            render: (date) => formatDateTime(date),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
    ], [
        truncateString,
        toggleBookingMutation.isPending,
        formatDateTime,
        sendTickets,
        isMobile,
        DeleteBooking,
    ]);

    const handleDateRangeChange = useCallback((dates) => {
        setDateRange(dates ? {
            startDate: dates[0].format('YYYY-MM-DD'),
            endDate: dates[1].format('YYYY-MM-DD')
        } : null);
    }, []);

    return (
        <Fragment>
            <DataTable
                title={config.title}
                data={formatBookingData(bookings)}
                columns={columns}
                showDateRange={true}
                showRefresh={true}
                showTotal={true}
                extraHeaderContent={
                    <Tooltip title="Add Booking">
                        <Button
                            type="primary"
                            icon={<PlusIcon size={16} />}
                            onClick={() => navigate(`new`)}
                        />
                    </Tooltip>
                }
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                loading={isLoading || toggleBookingMutation.isPending}
                error={error}
                enableExport={true}
                exportRoute={config.exportRoute}
                ExportPermission={UserPermissions?.includes(config.exportPermission)}
                onRefresh={refetch}
                emptyText={`No ${type} bookings found`}
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
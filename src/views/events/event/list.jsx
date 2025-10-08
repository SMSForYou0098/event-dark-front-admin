import { Button, Divider, Dropdown, message, Modal, Popover, Space, Tag, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import DataTable from '../common/DataTable'
import usePermission from 'utils/hooks/usePermission';
import { AppstoreOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, EyeOutlined, KeyOutlined, MergeCellsOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';

import { Link, useNavigate } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import axios from 'axios';
import { Ticket } from 'lucide-react';
import PermissionChecker from 'layouts/PermissionChecker';

const EventList = () => {
    const navigate = useNavigate();
    const { UserData, formatDateTime, api, authToken } = useMyContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalId, setModalId] = useState(null);
    const [isAreaModal, setIsAreaModal] = useState(false);
    const [show, setShow] = useState(false);
    const [events, setEvents] = useState([])
    const [dateRange, setDateRange] = useState(null)

    const GetEvents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${api}event-list/${UserData?.id}`, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });
            if (res.data.status) {
                setEvents(res.data.events);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };
    const getStatusBadge = (status) => {
        const statusMap = {
            1: { color: 'success', text: 'Ongoing' },
            2: { color: 'blue', text: 'Upcoming' },
            3: { color: 'warning', text: 'Finished' },
        };

        const { color = 'default', text = 'Unknown' } = statusMap[status] || {};

        return <Tag color={color}>{text}</Tag>;
    };
    useEffect(() => {
        GetEvents()
    }, [])

    const formatDateRange = (dateRange) => {
        if (!dateRange) return '';

        const dates = dateRange.split(',');
        if (dates.length !== 2) return dateRange; // Fallback if the format is unexpected

        const [startDate, endDate] = dates;
        return `${startDate} to ${endDate}`;
    };

    const HandleGateModal = (id, isAreaModal) => {
        setIsAreaModal(isAreaModal);
        setModalId(id);
        setShow(true);
        // Optionally, fetch gates for this event from backend here
    };

    const HandleDelete = async (id) => {
        if (id) {
            Modal.confirm({
                title: 'Are you sure?',
                icon: <ExclamationCircleOutlined />,
                content: "You won't be able to revert this!",
                okText: 'Yes, delete it!',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                    try {
                        const res = await axios.delete(`${api}delete-event/${id}`, {
                            headers: {
                                'Authorization': 'Bearer ' + authToken
                            }
                        });

                        if (res.data.status) {
                            GetEvents();
                            message.success('Your event has been deleted.');
                        }
                    } catch (err) {
                        message.error('There was an error deleting the event.');
                    }
                },
            });
        }
    }



    const handleDateRangeChange = (range) => {
        setDateRange(range);
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            // align: 'center',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Category',
            dataIndex: ['category', 'title'],
            key: 'category',
            align: 'center',
            sorter: (a, b) => a.category?.title.localeCompare(b.category?.title),
        },
        {
            title: 'Organizer',
            dataIndex: ['user', 'name'],
            key: 'organizer',
            align: 'center',
            sorter: (a, b) => a.user?.name.localeCompare(b.user?.name),
        },
        {
            title: 'Event Dates',
            dataIndex: 'date_range',
            key: 'date_range',
            align: 'center',
            render: (text, record) => formatDateRange(text, record),
            sorter: (a, b) => new Date(a.date_range) - new Date(b.date_range),
        },
        {
            title: 'Ticket Type',
            dataIndex: 'event_type',
            key: 'event_type',
            align: 'center',
            sorter: (a, b) => a.event_type.localeCompare(b.event_type),
        },
        {
            title: 'Status',
            dataIndex: 'event_status',
            key: 'event_status',
            align: 'center',
            render: (text, record) => getStatusBadge(text, record),
            sorter: (a, b) => a.event_status - b.event_status,
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            render: (text, record) => formatDateTime(text, record),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (text, row) => {
                const actions = [
                    {
                        tooltip: "View Event",
                        to: `/events/${row?.city}/${row?.user?.name}/${(row?.name)?.replace(/\s+/g, '-')}/${row.event_key}`,
                        type: "primary",
                        icon: <EyeOutlined />,
                        external: true,
                        permission: null
                    },
                    {
                        tooltip: "Edit Event",
                        to: `edit/${row?.event_key}`,
                        type: "default",
                        icon: <EditOutlined />,
                        permission: "Edit Event"
                    },
                    {
                        tooltip: "Manage Tickets",
                        to: `ticket/${row?.id}/${row?.name}`,
                        type: "default",
                        icon: <Ticket size={16} />,
                        permission: null
                    },
                    {
                        tooltip: "Delete Event",
                        onClick: () => HandleDelete(row?.id),
                        type: "primary",
                        danger: true,
                        icon: <DeleteOutlined />,
                        isButton: true,
                        permission: "Edit Event"
                    },
                    {
                        tooltip: "Manage Gates",
                        onClick: () => HandleGateModal(row?.id),
                        type: "default",
                        icon: <MergeCellsOutlined />,
                        isButton: true,
                        permission: null
                    },
                    {
                        tooltip: "Manage Access Areas",
                        onClick: () => HandleGateModal(row?.id, true),
                        type: "default",
                        icon: <KeyOutlined />,
                        isButton: true,
                        permission: null
                    }
                ];

                const filteredActions = actions.filter(action =>
                    !action.permission || PermissionHandler(action.permission)
                );

                const renderAction = (action, index) => {
                    const content = action.isButton ? (
                        <Button
                            type={action.type}
                            danger={action.danger}
                            icon={action.icon}
                            onClick={action.onClick}
                        />
                    ) : (
                        <Link to={action.to} target={action.external ? "_blank" : "_self"}>
                            <Button type={action.type} icon={action.icon} />
                        </Link>
                    );

                    return (
                        <Tooltip key={index} title={action.tooltip}>
                            {content}
                        </Tooltip>
                    );
                };

                // Split actions for desktop: first 4 inline, rest in dropdown
                const visibleActions = filteredActions.slice(0, 4);
                const moreActions = filteredActions.slice(4);

                return (
                    <>
                        {/* Mobile: All actions in dropdown */}
                        <Dropdown
                            menu={{
                                items: filteredActions.map((action, index) => {
                                    if (action.isButton) {
                                        return {
                                            key: index,
                                            label: action.tooltip,
                                            icon: action.icon,
                                            danger: action.danger,
                                            onClick: action.onClick,
                                        };
                                    } else {
                                        return {
                                            key: index,
                                            label: (
                                                <Link
                                                    to={action.to}
                                                    target={action.external ? "_blank" : "_self"}
                                                    className="text-decoration-none"
                                                >
                                                    {action.tooltip}
                                                </Link>
                                            ),
                                            icon: action.icon,
                                        };
                                    }
                                })
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                            className="d-block d-md-none"
                        >
                            <Button type="default" icon={<MoreOutlined />} />
                        </Dropdown>

                        {/* Desktop: First 4 actions inline + More dropdown */}
                        <Space size="small" className="d-none d-md-flex">
                            {visibleActions.map((action, index) => renderAction(action, index))}

                            {moreActions.length > 0 && (
                                <Dropdown
                                    menu={{
                                        items: moreActions.map((action, index) => {
                                            if (action.isButton) {
                                                return {
                                                    key: index,
                                                    label: action.tooltip,
                                                    icon: action.icon,
                                                    danger: action.danger,
                                                    onClick: action.onClick,
                                                };
                                            } else {
                                                return {
                                                    key: index,
                                                    label: (
                                                        <Link
                                                            to={action.to}
                                                            target={action.external ? "_blank" : "_self"}
                                                            className="text-decoration-none"
                                                        >
                                                            {action.tooltip}
                                                        </Link>
                                                    ),
                                                    icon: action.icon,
                                                };
                                            }
                                        })
                                    }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                >
                                    <Tooltip title="More Actions">
                                        <Button type="default" icon={<MoreOutlined />} />
                                    </Tooltip>
                                </Dropdown>
                            )}
                        </Space>
                    </>
                );
            },
        }
    ];

    const PermissionHandler = (permission) => {
        // return usePermission(permission);
        return true;
    }

    return (
        <DataTable
            title="Events"
            data={events}
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
                        onClick={navigate('create')}
                    />
                </Tooltip>
            }
            // Loading states
            loading={loading}
            error={error}
            // Refresh handler
            // Table customization
            tableProps={{
                scroll: { x: 1500 },
                size: "middle",
            }}
        />
    )
}
export default EventList

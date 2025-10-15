import React, { useState, useCallback, useMemo } from 'react';
import { Button, Dropdown, message, Modal, Space, Tag, Tooltip } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../common/DataTable';
import usePermission from 'utils/hooks/usePermission';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  KeyOutlined,
  MergeCellsOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import { Ticket } from 'lucide-react';
import api from 'auth/FetchInterceptor';

const EventList = () => {
  const navigate = useNavigate();
  const { UserData, formatDateTime, isMobile,createSlug } = useMyContext();
  const [modalId, setModalId] = useState(null);
  const [isAreaModal, setIsAreaModal] = useState(false);
  const [show, setShow] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const queryClient = useQueryClient();

  // Fetch events using TanStack Query
  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['eventList', UserData?.id],
    queryFn: async () => {
      const response = await api.get(`event-list/${UserData?.id}`);

      if (response.status && response.events) {
        return response.events;
      } else {
        throw new Error(response?.message || 'Failed to fetch events');
      }
    },
    enabled: !!UserData?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`delete-event/${id}`);
    },
    onSuccess: (res) => {
      if (res.status) {
        queryClient.invalidateQueries(['eventList']);
        message.success('Event deleted successfully');
      } else {
        message.error(res?.message || 'Failed to delete event');
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to delete event');
    },
  });

  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      1: { color: 'success', text: 'Ongoing' },
      2: { color: 'blue', text: 'Upcoming' },
      3: { color: 'warning', text: 'Finished' },
    };

    const { color = 'default', text = 'Unknown' } = statusMap[status] || {};

    return <Tag color={color}>{text}</Tag>;
  }, []);

  const formatDateRange = useCallback((dateRange) => {
    if (!dateRange) return '';

    const dates = dateRange.split(',');
    if (dates.length !== 2) return dateRange; // Fallback if the format is unexpected

    const [startDate, endDate] = dates;
    return `${startDate} to ${endDate}`;
  }, []);

  const HandleGateModal = useCallback((id, isAreaModal = false) => {
    setIsAreaModal(isAreaModal);
    setModalId(id);
    setShow(true);
  }, []);

  const HandleDelete = useCallback(
    (id, eventName) => {
      if (id) {
        Modal.confirm({
          title: 'Delete Event?',
          icon: <ExclamationCircleOutlined />,
          content: `Are you sure you want to delete "${eventName}"? This action cannot be undone!`,
          okText: 'Yes, delete it!',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => {
            deleteMutation.mutate(id);
          },
        });
      }
    },
    [deleteMutation]
  );

  const handleDateRangeChange = useCallback((dates) => {
    if (dates) {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setDateRange(null);
    }
  }, []);

  const PermissionHandler = useCallback((permission) => {
    // return usePermission(permission);
    return true;
  }, []);

  const columns = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        searchable: true,
        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      },
      {
        title: 'Category',
        dataIndex: ['category', 'title'],
        key: 'category',
        align: 'center',
        searchable: true,
        sorter: (a, b) =>
          (a.category?.title || '').localeCompare(b.category?.title || ''),
      },
      {
        title: 'Organizer',
        dataIndex: ['user', 'name'],
        key: 'organizer',
        align: 'center',
        searchable: true,
        sorter: (a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''),
      },
      {
        title: 'Event Dates',
        dataIndex: 'date_range',
        key: 'date_range',
        align: 'center',
        render: (text) => formatDateRange(text),
        sorter: (a, b) => {
          const dateA = new Date(a.date_range?.split(',')[0]);
          const dateB = new Date(b.date_range?.split(',')[0]);
          return dateA - dateB;
        },
      },
      {
        title: 'Ticket Type',
        dataIndex: 'event_type',
        key: 'event_type',
        align: 'center',
        sorter: (a, b) => (a.event_type || '').localeCompare(b.event_type || ''),
      },
      {
        title: 'Status',
        dataIndex: 'event_status',
        key: 'event_status',
        align: 'center',
        render: (text) => getStatusBadge(text),
        sorter: (a, b) => (a.event_status || 0) - (b.event_status || 0),
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        align: 'center',
        render: (text) => formatDateTime(text),
        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        ...(isMobile && { width: 70 }),
        fixed: 'right',
        render: (_, row) => {
          const actions = [
            {
              tooltip: 'View Event',
              to: `/events/${row?.city}/${row?.user?.name}/${row?.name?.replace(
                /\s+/g,
                '-'
              )}/${row.event_key}`,
              type: 'primary',
              icon: <EyeOutlined />,
              external: true,
              permission: null,
            },
            {
              tooltip: 'Edit Event',
              to: `update/${row?.event_key}`,
              type: 'default',
              icon: <EditOutlined />,
              permission: 'Edit Event',
            },
            {
              tooltip: 'Manage Tickets',
              to: `ticket/${row?.event_key}/${createSlug(row?.name)}`,
              type: 'default',
              icon: <Ticket size={16} />,
              permission: null,
            },
            {
              tooltip: 'Delete Event',
              onClick: () => HandleDelete(row?.id, row?.name),
              type: 'primary',
              danger: true,
              icon: <DeleteOutlined />,
              isButton: true,
              permission: 'Edit Event',
            },
            {
              tooltip: 'Manage Gates',
              onClick: () => HandleGateModal(row?.id),
              type: 'default',
              icon: <MergeCellsOutlined />,
              isButton: true,
              permission: null,
            },
            {
              tooltip: 'Manage Access Areas',
              onClick: () => HandleGateModal(row?.id, true),
              type: 'default',
              icon: <KeyOutlined />,
              isButton: true,
              permission: null,
            },
          ];

          const filteredActions = actions.filter(
            (action) => !action.permission || PermissionHandler(action.permission)
          );

          const renderAction = (action, index) => {
            const content = action.isButton ? (
              <Button
                type={action.type}
                danger={action.danger}
                icon={action.icon}
                onClick={action.onClick}
                loading={deleteMutation.isPending && action.danger}
              />
            ) : (
              <Link to={action.to} target={action.external ? '_blank' : '_self'}>
                <Button type={action.type} icon={action.icon} />
              </Link>
            );

            return (
              <Tooltip key={index} title={action.tooltip}>
                {content}
              </Tooltip>
            );
          };

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
                            target={action.external ? '_blank' : '_self'}
                            className="text-decoration-none"
                          >
                            {action.tooltip}
                          </Link>
                        ),
                        icon: action.icon,
                      };
                    }
                  }),
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
                                target={action.external ? '_blank' : '_self'}
                                className="text-decoration-none"
                              >
                                {action.tooltip}
                              </Link>
                            ),
                            icon: action.icon,
                          };
                        }
                      }),
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
      },
    ],
    [
      formatDateRange,
      getStatusBadge,
      formatDateTime,
      isMobile,
      HandleDelete,
      HandleGateModal,
      PermissionHandler,
      createSlug,
      deleteMutation.isPending,
    ]
  );

  return (
    <DataTable
      title="Events"
      data={events}
      columns={columns}
      showDateRange={true}
      showRefresh={true}
      showTotal={true}
      showAddButton={false}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
      enableExport={true}
      exportRoute="export-events"
      ExportPermission={usePermission('Export Events')}
      extraHeaderContent={
        <Tooltip title="New Event">
          <Button
            type="primary"
            icon={<PlusOutlined size={16} />}
            onClick={() => navigate('create')}
          />
        </Tooltip>
      }
      loading={isLoading || deleteMutation.isPending}
      error={isError ? error : null}
      onRefresh={refetch}
      tableProps={{
        scroll: { x: 1500 },
        size: 'middle',
      }}
      emptyText="No events found"
    />
  );
};

export default EventList;

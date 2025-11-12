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
  LeftOutlined,
  MoreOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import { ArchiveRestore, Ticket } from 'lucide-react';
import api from 'auth/FetchInterceptor';
import PermissionChecker from 'layouts/PermissionChecker';
import { USERSITE_URL } from 'utils/consts';

const EventList = ({ isJunk = false }) => {
  const navigate = useNavigate();
  const { UserData, formatDateTime, isMobile, createSlug } = useMyContext();
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
    queryKey: ['eventList', UserData?.id , isJunk],
    queryFn: async () => {
      const url = isJunk ? `event/junk/${UserData?.id}` : `event-list/${UserData?.id}`
      const response = await api.get(url);

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
      return api.delete(`event/delete/${id}`);
    },
    onSuccess: (res) => {
      if (res.status) {
        queryClient.invalidateQueries(['eventList']);
        refetch()
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



  const HandleDelete = useCallback(
    (id, eventName) => {
      if (id) {
        Modal.confirm({
          title: 'Delete Event?',
          icon: <ExclamationCircleOutlined />,
          content: `Are you sure you want to delete "${eventName}"? This action cannot be undone!`,
          okText: 'Yes, delete it!',
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

  const hasEditPermission = usePermission('Edit Event');
  const hasDeletePermission = usePermission('Delete Event');

  const handleViewEvent = useMemo(() => (row) => {
    const path = `${USERSITE_URL}events/${row?.venue?.city}/${createSlug(row?.user?.organisation)}/${createSlug(row?.name)}/${row?.event_key}`;
    window.open(path, '_blank');
  }, [createSlug]);


  // API function to restore event
  const restoreEvent = async (eventId) => {
    const response = await api.post(`/event/restore/${eventId}`);
    return response.data;
  };
  // API function to permanently delete event
  const permanentDeleteEvent = async (eventId) => {
    const response = await api.delete(`/event/destroy/${eventId}`);
    return response.data;
  };

  const permanentDeleteMutation = useMutation({
    mutationFn: permanentDeleteEvent,
    onSuccess: (data, variables) => {
      message.success('Event permanently deleted');
      refetch()
      // Invalidate and refetch junk events list
      queryClient.invalidateQueries({ queryKey: ['junkEvents'] });
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to delete event permanently');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreEvent,
    onSuccess: (data, variables) => {
      // message.success('Event restored successfully');
      // Invalidate and refetch events list
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['junkEvents'] });
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to restore event');
    },
  });


  const handlePermanentDelete = useCallback((row) => {
    Modal.confirm({
      title: 'Permanent Delete',
      content: (
        <div>
          <p>Are you sure you want to <strong>permanently delete</strong> "{row?.name}"?</p>
          <p className='text-warning'>
            ⚠️ This action cannot be undone!
          </p>
        </div>
      ),
      okText: 'Delete Permanently',
      cancelText: 'Cancel',
      onOk: () => {
        permanentDeleteMutation.mutate(row?.id);
      },
    });
  }, [permanentDeleteMutation]);

  const handleRestoreEvent = useCallback((row) => {
    Modal.confirm({
      title: 'Restore Event',
      content: `Are you sure you want to restore "${row?.name}"?`,
      okText: 'Restore',
      cancelText: 'Cancel',
      onOk: () => {
        restoreMutation.mutate(row?.id, {
          onSuccess: () => {
            message.success(`Event "${row?.name}" restored successfully`);
            refetch();
          },
          onError: (error) => {
            message.error(`Failed to restore event: ${error.message}`);
          },
        });
      },
    });
  }, [restoreMutation, refetch]);


  const columns = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
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
        title: 'Organisation',
        dataIndex: ['user', 'organisation'],
        key: 'organisation',
        align: 'center',
        searchable: true,
        sorter: (a, b) => (a.user?.organisation || '').localeCompare(b.user?.organisation || ''),
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
      ...(!isJunk ? [{
        title: 'Status',
        dataIndex: 'event_status',
        key: 'event_status',
        align: 'center',
        render: (text) => getStatusBadge(text),
        sorter: (a, b) => (a.event_status || 0) - (b.event_status || 0),
      }] : []),
      {
        title: isJunk ? 'Deleted At' : 'Created At',
        dataIndex: isJunk ? 'deleted_at' : 'created_at',
        key: isJunk ? 'deleted_at' : 'created_at',
        align: 'center',
        render: (text) => formatDateTime(text),
        sorter: isJunk
          ? (a, b) => new Date(a.deleted_at) - new Date(b.deleted_at)
          : (a, b) => new Date(a.created_at) - new Date(b.created_at),
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        ...(isMobile && { width: isJunk ? 100 : 60 }),
        fixed: 'right',
        render: (_, row) => {
          if (isJunk) {
            const junkActions = [
              {
                tooltip: 'Restore Event',
                isButton: true,
                onClick: () => handleRestoreEvent(row),
                type: 'default',
                loadig : restoreMutation.isPending,
                icon: <UndoOutlined />,
              },
              {
                tooltip: 'Delete Permanently',
                isButton: true,
                onClick: () => handlePermanentDelete(row),
                type: 'primary',
                loading : permanentDeleteMutation.isPending,
                danger: true,
                icon: <DeleteOutlined />,
              },
            ];

            return (
              <Space size="small">
                {junkActions.map((action, index) => (
                  <Tooltip key={index} title={action.tooltip}>
                    <Button
                      type={action.type}
                      danger={action.danger}
                      icon={action.icon}
                      onClick={action.onClick}
                      loading={action.loading}
                    />
                  </Tooltip>
                ))}
              </Space>
            );
          }
          const actions = [
            {
              tooltip: 'View Event',
              isButton: true,
              onClick: () => handleViewEvent(row),
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
              permission: hasEditPermission,
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
              permission: hasDeletePermission,
            },
            // {
            //   tooltip: 'Manage Gates',
            //   onClick: () => HandleGateModal(row?.id),
            //   type: 'default',
            //   icon: <MergeCellsOutlined />,
            //   isButton: true,
            //   permission: null,
            // },
            // {
            //   tooltip: 'Manage Access Areas',
            //   onClick: () => HandleGateModal(row?.id, true),
            //   type: 'default',
            //   icon: <KeyOutlined />,
            //   isButton: true,
            //   permission: null,
            // },
          ];

          const filteredActions = actions.filter(
            (action) => action.permission === null || action.permission === true
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
      handleRestoreEvent,
      handlePermanentDelete,
      restoreMutation,
      permanentDeleteMutation,
      isJunk,
      formatDateTime,
      isMobile,
      HandleDelete,
      handleViewEvent,
      hasDeletePermission,
      hasEditPermission,
      // HandleGateModal,
      createSlug,
      deleteMutation.isPending,
    ]
  );

  return (
    <DataTable
      title={isJunk ? 'Junk Events' : "Events"}
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
        isJunk ?
          <Tooltip title="Back To Events">
            <Button
              type="primary"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
            />
          </Tooltip>
          :
          <>
            <PermissionChecker permission="Create Event">
              <Tooltip title="New Event">
                <Button
                  type="primary"
                  icon={<PlusOutlined size={16} />}
                  onClick={() => navigate('create')}
                />
              </Tooltip>
            </PermissionChecker>
            <PermissionChecker permission="View Junk Events">
              <Tooltip title="View Deleted Event">
                <Button
                  type="primary"
                  icon={<ArchiveRestore size={16} />}
                  onClick={() => navigate('junk')}
                />
              </Tooltip>
            </PermissionChecker>
          </>
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

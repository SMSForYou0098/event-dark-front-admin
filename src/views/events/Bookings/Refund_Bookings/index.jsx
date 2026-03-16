import React, { useState, useMemo, useCallback } from 'react';
import { Button, Space, Tooltip, Input, Tag, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../../common/DataTable';
import Popconfirm from 'antd/es/popconfirm';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';
import { PERMISSIONS } from 'constants/PermissionConstant';
import usePermission from 'utils/hooks/usePermission';
import PermissionChecker from 'layouts/PermissionChecker';

const { TextArea } = Input;

// ===================== COMPONENT =====================
const RefundBookings = () => {
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [remark, setRemark] = useState('');
    const [actionType, setActionType] = useState(null);

    const canManageRefunds = usePermission(PERMISSIONS.MANAGE_REFUND_REQUEST);

    // Backend pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [searchText, setSearchText] = useState('');
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);

    const queryClient = useQueryClient();

    // API call for fetching refund requests
    const { data: refundData, isLoading } = useQuery({
        queryKey: ['refund-requests', currentPage, pageSize, searchText, sortField, sortOrder],
        queryFn: async () => {
            const params = new URLSearchParams();

            // Pagination params
            params.set('page', currentPage.toString());
            params.set('per_page', pageSize.toString());

            // Search param
            if (searchText) {
                params.set('search', searchText);
            }

            // Sorting params
            if (sortField && sortOrder) {
                params.set('sort_by', sortField);
                params.set('sort_order', sortOrder === 'ascend' ? 'asc' : 'desc');
            }

            const url = `refunds?${params.toString()}`;
            const response = await api.get(url);
            // console.log('Refunds API Response:', response);
            return response;
        },
    });

    const refundRequests = refundData?.data || [];
    const pagination = refundData?.pagination;

    // Dummy API call for updating refund status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes }) => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulate success response
            return {
                status: true,
                message: status === 'approved'
                    ? 'Refund approved successfully'
                    : 'Refund rejected successfully',
            };
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error, 'Failed to update refund status'));
        },
        onSuccess: (data) => {
            // Update local cache to reflect changes (for demo)
            queryClient.invalidateQueries(['refund-requests']);
            setRemarkModalVisible(false);
            setSelectedRecord(null);
            setRemark('');
            setActionType(null);
        },
    });

    // ========================= HANDLERS =========================
    const handleActionClick = (record, type) => {
        setSelectedRecord(record);
        setActionType(type);
        setRemarkModalVisible(true);
    };

    const handleConfirmAction = () => {
        if (!selectedRecord || !actionType) return;

        updateStatusMutation.mutate({
            id: selectedRecord.id,
            status: actionType === 'approve' ? 'approved' : 'rejected',
            notes: remark.trim() || undefined,
        });
    };

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

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // ========================= TABLE COLUMNS =========================
    const columns = useMemo(
        () => [
            {
                title: '#',
                render: (_, __, i) => i + 1,
                width: 60,
            },
            {
                title: 'Name',
                dataIndex: ['user', 'name'],
                searchable: true,
                render: (_, record) => record.user?.name || record.booking?.name || '-',
            },
            {
                title: 'Email',
                dataIndex: ['user', 'email'],
                searchable: true,
                render: (_, record) => record.user?.email || record.booking?.email || '-',
                // ellipsis: true,
            },
            {
                title: 'Event',
                dataIndex: ['booking', 'event', 'name'],
                searchable: true,
                render: (name) => name || '-',
            },
            {
                title: 'Ticket',
                dataIndex: ['booking', 'ticket', 'name'],
                render: (name) => name || '-',
            },
            {
                title: 'Amt',
                dataIndex: 'original_amount',
                render: (amount) => `₹${amount}`,
                sorter: (a, b) => a.original_amount - b.original_amount,
            },
            {
                title: 'R Amt',
                dataIndex: 'refund_amount',
                render: (amount) => <span className="text-success fw-medium">₹{amount}</span>,
                sorter: (a, b) => a.refund_amount - b.refund_amount,
            },
            {
                title: 'Diff',
                render: (_, record) => {
                    const difference = (record.original_amount || 0) - (record.refund_amount || 0);
                    return <span className="text-warning fw-medium">₹{difference}</span>;
                },
                sorter: (a, b) => {
                    const diffA = (a.original_amount || 0) - (a.refund_amount || 0);
                    const diffB = (b.original_amount || 0) - (b.refund_amount || 0);
                    return diffA - diffB;
                },
            },
            // {
            //     title: 'Net Refund',
            //     dataIndex: 'net_refund_amount',
            //     render: (amount) => <span className="text-primary fw-medium">₹{amount}</span>,
            //     sorter: (a, b) => a.net_refund_amount - b.net_refund_amount,
            // },
            // {
            //     title: 'Refund Type',
            //     dataIndex: 'refund_type',
            //     render: (type) => {
            //         const typeMap = {
            //             full: { text: 'Full', color: 'blue' },
            //             partial: { text: 'Partial', color: 'orange' },
            //         };
            //         const typeInfo = typeMap[type] || { text: type, color: 'default' };
            //         return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
            //     },
            //     filters: [
            //         { text: 'Full', value: 'full' },
            //         { text: 'Partial', value: 'partial' },
            //     ],
            //     onFilter: (value, record) => record.refund_type === value,
            // },
            {
                title: 'Status',
                dataIndex: 'refund_status',
                render: (status) => {
                    const statusMap = {
                        pending: { text: 'Pending', color: 'warning' },
                        approved: { text: 'Approved', color: 'processing' },
                        completed: { text: 'Completed', color: 'success' },
                        failed: { text: 'Failed', color: 'error' },
                        rejected: { text: 'Rejected', color: 'error' },
                    };
                    const statusInfo = statusMap[status] || { text: status, color: 'default' };
                    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                },
                filters: [
                    { text: 'Pending', value: 'pending' },
                    { text: 'Approved', value: 'approved' },
                    { text: 'Completed', value: 'completed' },
                    { text: 'Failed', value: 'failed' },
                    { text: 'Rejected', value: 'rejected' },
                ],
                onFilter: (value, record) => record.refund_status === value,
            },
            {
                title: 'Reason',
                dataIndex: 'refund_reason',
                render: (reason) => reason || '-',
                ellipsis: true,
            },
            // {
            //     title: 'Notes',
            //     dataIndex: 'notes',
            //     render: (notes) => notes || '-',
            //     ellipsis: true,
            // },
            {
                title: 'Gateway',
                dataIndex: 'gateway',
                render: (gateway) => gateway ? gateway.toUpperCase() : '-',
            },
            {
                title: 'ARN',
                dataIndex: 'refund_arn',
                render: (arn) => arn || '-',
            },
            {
                title: 'Initiated By',
                dataIndex: 'initiated_by',
                render: (initiatedBy) => initiatedBy || '-',
            },
            {
                title: 'Initiated At',
                dataIndex: 'created_at',
                render: (date) => formatDateTime(date),
                sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
            },
            // {
            //     title: 'Approved At',
            //     dataIndex: 'approved_at',
            //     render: (date) => date ? formatDateTime(date) : '-',
            //     width: 150,
            // },
            {
                title: 'Action',
                align: 'center',
                fixed: 'right',
                width: 120,
                render: (_, record) => {
                    // Show action buttons only if:
                    // 1. Event has refund policy with requires_approval = true
                    // 2. Refund status is pending
                    const requiresApproval = record.booking?.event?.refund_policy?.requires_approval;
                    const isPending = record.refund_status === 'pending';
                    const showActions = requiresApproval && isPending;

                    if (!showActions) {
                        return <span className="text-muted">-</span>;
                    }

                    return (
                        <Space>
                            <PermissionChecker permission={PERMISSIONS.MANAGE_REFUND_REQUEST}>
                                <Tooltip title="Approve">
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckOutlined />}
                                        onClick={() => handleActionClick(record, 'approve')}
                                    />
                                </Tooltip>
                                <Tooltip title="Reject">
                                    <Button
                                        danger
                                        size="small"
                                        icon={<CloseOutlined />}
                                        onClick={() => handleActionClick(record, 'reject')}
                                    />
                                </Tooltip>
                            </PermissionChecker>
                        </Space>
                    );
                },
            },
        ],
        []
    );

    // ========================= RENDER =========================
    return (
        <>
            <DataTable
                title="Refund Requests"
                data={refundRequests}
                columns={columns}
                loading={isLoading || updateStatusMutation.isPending}
                enableSearch={true}
                showSearch={true}
                emptyText="No refund requests found"
                // Backend pagination props
                serverSide={true}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                onSearch={handleSearchChange}
                onSortChange={handleSortChange}
                searchValue={searchText}
            />

            {/* Remark Modal using Popconfirm */}
            <Popconfirm
                open={remarkModalVisible}
                title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Refund Request`}
                description={
                    <div style={{ width: 300 }}>
                        <p style={{ marginBottom: 8 }}>
                            Are you sure you want to {actionType} this refund request?
                        </p>
                        {selectedRecord && (
                            <div style={{ marginBottom: 12, padding: 8, borderRadius: 4 }}>
                                <div><strong>Booking ID:</strong> {selectedRecord.booking_id}</div>
                                <div><strong>Refund Amount:</strong> ₹{selectedRecord.net_refund_amount}</div>
                                <div><strong>User:</strong> {selectedRecord.user?.name || selectedRecord.booking?.name}</div>
                                <div><strong>Event:</strong> {selectedRecord.booking?.event?.name || '-'}</div>
                            </div>
                        )}
                        <TextArea
                            placeholder="Enter notes (optional)"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            rows={3}
                            maxLength={500}
                            showCount
                        />
                    </div>
                }
                onConfirm={handleConfirmAction}
                onCancel={() => {
                    setRemarkModalVisible(false);
                    setSelectedRecord(null);
                    setRemark('');
                    setActionType(null);
                }}
                okText="Confirm"
                cancelText="Cancel"
                okButtonProps={{
                    loading: updateStatusMutation.isPending,
                }}
                placement="topRight"
            >
                <span />
            </Popconfirm>
        </>
    );
};

export default RefundBookings;

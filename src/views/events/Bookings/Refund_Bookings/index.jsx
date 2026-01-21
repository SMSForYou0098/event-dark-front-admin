import React, { useState, useMemo } from 'react';
import { Button, Space, Tooltip, Input, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../../common/DataTable';
import Popconfirm from 'antd/es/popconfirm';

const { TextArea } = Input;

// ===================== DUMMY DATA =====================
const DUMMY_REFUND_REQUESTS = [
    {
        id: 1,
        booking_id: 'BK001',
        user: { name: 'John Doe', email: 'john@example.com', number: '9876543210' },
        event_name: 'Music Concert 2026',
        ticket_name: 'VIP Pass',
        total_amount: 5000,
        refund_percentage: 80,
        refund_amount: 4000,
        status: 'pending',
        requested_at: '2026-01-18T10:30:00.000Z',
        approver: null,
        notes: 'Customer requested due to schedule conflict',
    },
    {
        id: 2,
        booking_id: 'BK002',
        user: { name: 'Jane Smith', email: 'jane@example.com', number: '9876543211' },
        event_name: 'Tech Conference',
        ticket_name: 'Early Bird',
        total_amount: 2500,
        refund_percentage: 100,
        refund_amount: 2500,
        status: 'pending',
        requested_at: '2026-01-19T14:15:00.000Z',
        approver: null,
        notes: 'Event cancelled by organizer',
    },
    {
        id: 3,
        booking_id: 'BK003',
        user: { name: 'Mike Wilson', email: 'mike@example.com', number: '9876543212' },
        event_name: 'Comedy Night',
        ticket_name: 'Standard',
        total_amount: 1500,
        refund_percentage: 50,
        refund_amount: 750,
        status: 'approved',
        requested_at: '2026-01-17T09:00:00.000Z',
        approver: { name: 'Admin User' },
        notes: 'Partial refund approved',
    },
    {
        id: 4,
        booking_id: 'BK004',
        user: { name: 'Sarah Johnson', email: 'sarah@example.com', number: '9876543213' },
        event_name: 'Art Exhibition',
        ticket_name: 'Premium',
        total_amount: 3000,
        refund_percentage: 75,
        refund_amount: 2250,
        status: 'rejected',
        requested_at: '2026-01-16T16:45:00.000Z',
        approver: { name: 'Admin User' },
        notes: 'Request made after event date',
    },
    {
        id: 5,
        booking_id: 'BK005',
        user: { name: 'David Brown', email: 'david@example.com', number: '9876543214' },
        event_name: 'Sports Tournament',
        ticket_name: 'Gold',
        total_amount: 4500,
        refund_percentage: 90,
        refund_amount: 4050,
        status: 'pending',
        requested_at: '2026-01-20T08:20:00.000Z',
        approver: null,
        notes: 'Medical emergency',
    },
];

// ===================== COMPONENT =====================
const RefundBookings = () => {
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [remark, setRemark] = useState('');
    const [actionType, setActionType] = useState(null);

    const queryClient = useQueryClient();

    // Dummy API call for fetching refund requests
    const { data: refundRequests = [], isLoading } = useQuery({
        queryKey: ['refund-requests'],
        queryFn: async () => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return DUMMY_REFUND_REQUESTS;
        },
    });

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
            },
            {
                title: 'Booking ID',
                dataIndex: 'booking_id',
                searchable: true,
            },
            {
                title: 'User Name',
                dataIndex: ['user', 'name'],
                searchable: true,
            },
            {
                title: 'Event Name',
                dataIndex: 'event_name',
                searchable: true,
            },
            {
                title: 'Ticket',
                dataIndex: 'ticket_name',
            },
            {
                title: 'Total Amount',
                dataIndex: 'total_amount',
                render: (amount) => `₹${amount}`,
                sorter: (a, b) => a.total_amount - b.total_amount,
            },
            {
                title: 'Refund %',
                dataIndex: 'refund_percentage',
                render: (percentage) => `${percentage}%`,
                sorter: (a, b) => a.refund_percentage - b.refund_percentage,
            },
            {
                title: 'Refund Amount',
                dataIndex: 'refund_amount',
                render: (amount) => <span style={{ color: '#52c41a', fontWeight: 500 }}>₹{amount}</span>,
                sorter: (a, b) => a.refund_amount - b.refund_amount,
            },
            {
                title: 'Status',
                dataIndex: 'status',
                render: (status) => {
                    const statusMap = {
                        pending: { text: 'Pending', color: 'warning' },
                        approved: { text: 'Approved', color: 'success' },
                        rejected: { text: 'Rejected', color: 'error' },
                    };
                    const statusInfo = statusMap[status] || statusMap.pending;
                    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                },
                filters: [
                    { text: 'Pending', value: 'pending' },
                    { text: 'Approved', value: 'approved' },
                    { text: 'Rejected', value: 'rejected' },
                ],
                onFilter: (value, record) => record.status === value,
            },
            {
                title: 'Notes',
                dataIndex: 'notes',
                render: (notes) => notes || '-',
                ellipsis: true,
            },
            {
                title: 'Requested At',
                dataIndex: 'requested_at',
                render: (date) => formatDateTime(date),
                sorter: (a, b) => new Date(a.requested_at) - new Date(b.requested_at),
            },
            {
                title: 'Approved By',
                dataIndex: ['approver', 'name'],
                render: (name) => name || '-',
            },
            {
                title: 'Action',
                align: 'center',
                fixed: 'right',
                render: (_, record) => {
                    const isActionTaken = record.status !== 'pending';
                    return (
                        <Space>
                            <Tooltip title={isActionTaken ? 'Action already taken' : 'Approve'}>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    onClick={() => handleActionClick(record, 'approve')}
                                    disabled={isActionTaken}
                                />
                            </Tooltip>
                            <Tooltip title={isActionTaken ? 'Action already taken' : 'Reject'}>
                                <Button
                                    danger
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => handleActionClick(record, 'reject')}
                                    disabled={isActionTaken}
                                />
                            </Tooltip>
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
                                <div><strong>Amount:</strong> ₹{selectedRecord.refund_amount}</div>
                                <div><strong>User:</strong> {selectedRecord.user?.name}</div>
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

import React, { useState, useMemo } from 'react';
import { Button, Space, Popconfirm, Tooltip, Input } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import DataTable from '../../common/DataTable';
import {
    useGetOnboardingRequests,
    useUpdateOnboardingStatus,
} from './useApproveOrganizers';

const { TextArea } = Input;

const ApproveOrganizers = () => {
    // ========================= STATE =========================
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [remark, setRemark] = useState('');
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

    // ========================= TANSTACK QUERY HOOKS =========================
    const { data: responseData, isLoading } = useGetOnboardingRequests();

    // Extract data and pagination from response
    const onboardingRequests = responseData?.data || [];
    const pagination = responseData?.pagination || null;

    const updateStatusMutation = useUpdateOnboardingStatus({
        onSuccess: () => {
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

        const status = actionType === 'approve' ? 'approved' : 'rejected';

        updateStatusMutation.mutate({
            id: selectedRecord.id,
            payload: {
                status,
                notes: remark.trim() || undefined,
            },
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
                title: 'Name',
                dataIndex: ['user', 'name'],
                sorter: (a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''),
                searchable: true,
            },
            {
                title: 'Organization',
                dataIndex: ['user', 'organisation'],
                sorter: (a, b) => (a.user?.organisation || '').localeCompare(b.user?.organisation || ''),
                searchable: true,
            },
            {
                title: 'Number',
                dataIndex: ['user', 'number'],
                searchable: true,
            },
            {
                title: 'Email',
                dataIndex: ['user', 'email'],
                searchable: true,
            },
            {
                title: 'Status',
                dataIndex: 'status',
                render: (status) => {
                    const statusMap = {
                        pending: { text: 'Pending', color: '#faad14' },
                        approved: { text: 'Approved', color: '#52c41a' },
                        rejected: { text: 'Rejected', color: '#ff4d4f' },
                    };
                    const statusInfo = statusMap[status] || statusMap.pending;
                    return (
                        <span style={{ color: statusInfo.color, fontWeight: 500 }}>
                            {statusInfo.text}
                        </span>
                    );
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
                dataIndex: ['notes'],
                render: (notes) => notes || '-',
                searchable: true,
            },
            {
                title: 'Approved By',
                dataIndex: ['approver', 'name'],
                render: (name) => name || '-',
                searchable: true,
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
                                // disabled={isActionTaken}
                                />
                            </Tooltip>
                            <Tooltip title={isActionTaken ? 'Action already taken' : 'Reject'}>
                                <Button
                                    danger
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => handleActionClick(record, 'reject')}
                                // disabled={isActionTaken}
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
                title="Approve Organizers"
                data={onboardingRequests}
                columns={columns}
                loading={isLoading}
                enableSearch={true}
                showSearch={true}
                emptyText="No onboarding requests found"
            />

            {/* Remark Modal using Popconfirm */}
            <Popconfirm
                open={remarkModalVisible}
                title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Request`}
                description={
                    <div style={{ width: 300 }}>
                        <p style={{ marginBottom: 8 }}>
                            Are you sure you want to {actionType} this request?
                        </p>
                        <TextArea
                            placeholder="Enter remark (optional)"
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
                {/* Hidden trigger - controlled by state */}
                <span />
            </Popconfirm>
        </>
    );
};

export default ApproveOrganizers;

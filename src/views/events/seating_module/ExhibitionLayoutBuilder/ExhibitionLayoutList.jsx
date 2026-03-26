import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Space, message, Tooltip, Tag, Popconfirm } from 'antd';
import { PlusOutlined, SettingOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from 'auth/FetchInterceptor';
import DataTable from 'views/events/common/DataTable';
import Utils from 'utils';

const ExhibitionLayoutList = () => {
    const navigate = useNavigate();

    const { data: layouts, isLoading, error, refetch } = useQuery({
        queryKey: ['stall-layouts'],
        queryFn: async () => {
            const res = await api.get('stall-layouts');
            // Assuming the API might be under /api/dark/ as specified by user, 
            // but FetchInterceptor might already have a base URL.
            // If the user said /api/dark/stall-layouts/theatre, and FetchInterceptor handles /api/dark,
            // then we use /stall-layouts/theatre.

            if (res?.status === false) {
                throw new Error(Utils.getErrorMessage(res, 'Failed to fetch layouts'));
            }
            return Array.isArray(res) ? res : res?.data || [];
        }
    });

    const { mutate: deleteLayout, isPending: isDeleting } = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`stall-layout/${id}`);
            if (res?.status === false) {
                throw new Error(Utils.getErrorMessage(res, 'Failed to delete layout'));
            }
            return res;
        },
        onSuccess: (res) => {
            message.success(res?.message || 'Layout deleted successfully');
            refetch();
        },
        onError: (err) => {
            message.error(Utils.getErrorMessage(err, 'Failed to delete layout'));
        }
    });

    const columns = [
        {
            title: 'Sr',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <span>#{text}</span>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="font-weight-bold">{text || 'N/A'}</span>,
        },
        {
            title: 'Event Name',
            dataIndex: ['event', 'name'],
            key: 'event_name',
            render: (text) => <Tag color="blue">{text || 'N/A'}</Tag>,
        },
        {
            title: 'Last Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date) => date ? new Date(date).toLocaleString() : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="User View">
                        <Button
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => navigate(`/exhibition-layout/${record.id}/view`)}
                        />
                    </Tooltip>
                    <Tooltip title="Manage Layout">
                        <Button
                            icon={<SettingOutlined />}
                            size="small"
                            onClick={() => navigate(`/exhibition-layout/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete this layout?"
                            description="Are you sure you want to delete this layout? This action cannot be undone."
                            onConfirm={() => deleteLayout(record.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ loading: isDeleting }}
                        >
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <DataTable
            title="Exhibition Layouts"
            data={layouts || []}
            columns={columns}
            loading={isLoading}
            error={error}
            showRefresh={true}
            onRefresh={refetch}
            enableSearch={true}
            showSearch={true}
            extraHeaderContent={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/exhibition-layout/new')}
                >
                    New Layout
                </Button>
            }
            emptyText="No exhibition layouts found"
        />
    );
};

export default ExhibitionLayoutList;

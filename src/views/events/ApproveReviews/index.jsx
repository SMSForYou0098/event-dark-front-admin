import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Select, Tag, Rate, Button, Tooltip, message, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import DataTable from '../common/DataTable';
import ReviewDetailOverlay from './ReviewDetailOverlay';
import dayjs from 'dayjs';
import { useMyContext } from "../../../Context/MyContextProvider";
import { useOrganizerEvents } from "../Settings/hooks/useBanners";

const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
];

const ApproveReviews = () => {
    const { UserData, userRole } = useMyContext();

    // Filters
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Overlay state
    const [selectedReview, setSelectedReview] = useState(null);
    const [overlayOpen, setOverlayOpen] = useState(false);

    // Fetch Events for the dropdown
    const { data: events, isLoading: eventsLoading } = useOrganizerEvents(UserData?.id, userRole);

    // Automatically select the first event when data is loaded
    useEffect(() => {
        if (events?.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].value);
        }
    }, [events, selectedEventId]);

    // Fetch reviews
    const { data: reviewsData = { data: [], pagination: null }, isLoading, error, refetch } = useQuery({
        queryKey: ['reviews', statusFilter, currentPage, pageSize, selectedEventId, searchText],
        queryFn: async () => {
            if (!selectedEventId) return { data: [], pagination: null };

            const params = new URLSearchParams();
            params.set('page', currentPage.toString());
            params.set('per_page', pageSize.toString());
            params.set('status', statusFilter);
            if (searchText) {
                params.set('search', searchText);
            }

            const res = await api.get(`reviews/pending/${selectedEventId}?${params.toString()}`);
            return res;
        },
        enabled: !!selectedEventId
    });

    const reviews = reviewsData?.data || [];
    const pagination = reviewsData?.pagination || null;

    // Moderate mutation
    const moderateMutation = useMutation({
        mutationFn: async ({ id, is_approved }) => {
            const res = await api.patch(`reviews/${id}/moderate`, { is_approved });
            return res;
        },
        onSuccess: () => {
            message.success('Review moderated successfully');
            setOverlayOpen(false);
            setSelectedReview(null);
            refetch();
        },
        onError: (err) => {
            message.error(err?.message || 'Failed to moderate review');
        },
    });

    // Handlers
    const handleEventChange = useCallback((value) => {
        setSelectedEventId(value);
        setCurrentPage(1);
    }, []);

    const handleStatusChange = useCallback((value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    }, []);

    const handleSearchChange = useCallback((value) => {
        setSearchText(value);
        setCurrentPage(1);
    }, []);

    const handlePaginationChange = useCallback((page, newPageSize) => {
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        } else {
            setCurrentPage(page);
        }
    }, [pageSize]);

    const handleViewReview = useCallback((record) => {
        setSelectedReview(record);
        setOverlayOpen(true);
    }, []);

    const handleApprove = useCallback((id) => {
        moderateMutation.mutate({ id, is_approved: true });
    }, [moderateMutation]);

    const handleReject = useCallback((id) => {
        moderateMutation.mutate({ id, is_approved: false });
    }, [moderateMutation]);

    // Columns
    const columns = useMemo(() => {
        const baseColumns = [
            {
                title: '#',
                key: 'index',
                width: 50,
                render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
            },
            {
                title: 'User',
                dataIndex: ['user', 'name'],
                key: 'user',
                render: (name) => name || 'N/A',
            },
            {
                title: 'Rating',
                dataIndex: 'rating',
                key: 'rating',
                align: 'center',
                width: 180,
                render: (rating) => <Rate disabled value={rating} style={{ fontSize: 14 }} />,
            },
            {
                title: 'Type',
                dataIndex: 'reviewable_type',
                key: 'type',
                render: (type) => {
                    const label = type?.split('\\').pop() || 'N/A';
                    return <Tag color="blue">{label}</Tag>;
                },
            },
        ];

        // Status column only shown if 'all' is selected
        if (statusFilter === 'all') {
            baseColumns.push({
                title: 'Status',
                dataIndex: 'is_approved',
                key: 'status',
                align: 'center',
                render: (approved) => (
                    <Tag color={approved ? 'green' : 'orange'}>
                        {approved ? 'Approved' : 'Pending'}
                    </Tag>
                ),
            });
        }

        baseColumns.push(
            {
                title: 'Date',
                dataIndex: 'created_at',
                key: 'created_at',
                width: 160,
                render: (date) => date ? dayjs(date).format('DD MMM YYYY') : 'N/A',
            },
            {
                title: 'Actions',
                key: 'actions',
                align: 'center',
                width: 80,
                fixed: 'right',
                render: (_, record) => (
                    <Tooltip title="View Review">
                        <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewReview(record)}
                        />
                    </Tooltip>
                ),
            }
        );

        return baseColumns;
    }, [currentPage, pageSize, statusFilter, handleViewReview]);

    // Format data with keys
    const formattedData = reviews.map((r) => ({ ...r, key: r.id }));

    return (
        <>
            <DataTable
                title="Approve Reviews"
                data={formattedData}
                columns={columns}
                serverSide={true}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                loading={isLoading}
                error={error}
                onRefresh={refetch}
                showRefresh={true}
                onSearch={handleSearchChange}
                searchValue={searchText}
                extraHeaderContent={
                    <Space wrap>
                        <Select
                            placeholder="Select Event"
                            loading={eventsLoading}
                            options={events}
                            value={selectedEventId}
                            onChange={handleEventChange}
                            style={{ width: 250 }}
                            showSearch
                            optionFilterProp="label"
                        />
                        <Select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            options={statusOptions}
                            style={{ width: 140 }}
                            placeholder="Filter Status"
                        />
                    </Space>
                }
                tableProps={{
                    scroll: { x: 800 },
                    size: 'middle',
                }}
            />

            <ReviewDetailOverlay
                open={overlayOpen}
                onClose={() => {
                    setOverlayOpen(false);
                    setSelectedReview(null);
                }}
                review={selectedReview}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={moderateMutation.isPending}
            />
        </>
    );
};

export default ApproveReviews;

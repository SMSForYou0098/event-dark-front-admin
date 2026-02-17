import React, { useEffect, useRef, useMemo } from 'react';
import { Drawer, Table, Spin, Empty, Typography } from 'antd';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from "Context/MyContextProvider";

const { Text } = Typography;

const ReassignmentHistoryDrawer = ({ bookingId, visible, onClose }) => {
    const { formatDateTime } = useMyContext();
    const loadMoreRef = useRef();

    const fetchHistory = async ({ pageParam = 1 }) => {
        const response = await apiClient.get(`dispatch/reassignments/${bookingId}?page=${pageParam}`);
        return response;
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['reassignment-history', bookingId],
        queryFn: fetchHistory,
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.pagination;
            if (!pagination) return undefined;
            const { current_page, last_page } = pagination;
            return current_page < last_page ? current_page + 1 : undefined;
        },
        enabled: visible && !!bookingId,
    });

    const history = useMemo(() => {
        return data?.pages.flatMap(page => page?.reassignments || []) || [];
    }, [data]);

    useEffect(() => {
        if (!visible || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [visible, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const columns = [
        {
            title: 'Assigned At',
            dataIndex: 'assigned_at',
            key: 'assigned_at',
            render: (date) => formatDateTime(date),
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (text) => text || '-',
        },
        {
            title: 'Assigned By',
            dataIndex: 'assigned_by_user',
            key: 'assigned_by_user',
            render: (user) => user?.name || '-'
        }
    ];

    return (
        <Drawer
            title="Reassignment History"
            open={visible}
            onClose={onClose}
            width={600}
        >
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin />
                </div>
            ) : history?.length > 0 ? (
                <>
                    <Table
                        dataSource={history}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: true }}
                    />
                    <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '10px' }}>
                        {isFetchingNextPage && <Spin size="small" />}
                        {!hasNextPage && history?.length > 0 && <Text type="secondary">No more history</Text>}
                    </div>
                </>
            ) : (
                <Empty description="No reassignment history found" />
            )}
        </Drawer>
    );
};

export default ReassignmentHistoryDrawer;

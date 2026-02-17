import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { debounce } from 'utils/debounce';
import { Card, Space, Typography, Button, Spin, Select, Descriptions, Tag, message, Badge } from 'antd';
import { CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from 'auth/FetchInterceptor';

const { Text } = Typography;

const DispatchCardSearch = ({ events, onScan, dispatchedTokens = [] }) => {
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedToken, setSelectedToken] = useState(null);
    const [searchText, setSearchText] = useState("");

    // Set default event if only one is available
    useEffect(() => {
        if (events?.length === 1) {
            setSelectedEventId(events[0].id);
        } else if (events?.length > 1 && !selectedEventId) {
            // Optional: could select first by default or wait for user
            setSelectedEventId(events[0].id);
        }
    }, [events]);

    const activeEvent = useMemo(() =>
        events.find(e => e.id === selectedEventId),
        [events, selectedEventId]);

    // Cleanup when event changes
    useEffect(() => {
        setSelectedToken(null);
        setSearchText("");
    }, [selectedEventId]);

    // Clear selection if the selected token is in the dispatched list
    useEffect(() => {
        if (selectedToken && dispatchedTokens.includes(selectedToken.token)) {
            setSelectedToken(null);
        }
    }, [dispatchedTokens, selectedToken]);

    // ─── Token Query ─────────────────────────────
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['dispatchCardTokens', selectedEventId, searchText],
        queryFn: async ({ pageParam = 1 }) => {
            if (!selectedEventId) return { data: [] };
            const res = await apiClient.post('card-tokens/detail', {
                event_id: selectedEventId,
                page: pageParam,
                per_page: 15,
                search: searchText,
                mode: 'dispatch',
            });
            return res?.data || res;
        },
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.current_page < pagination.last_page) {
                return pagination.current_page + 1;
            }
            return undefined;
        },
        enabled: !!selectedEventId,
        initialPageParam: 1,
    });

    const allTokens = useMemo(() => {
        return data?.pages.flatMap(page => page.tokens || []) || [];
    }, [data]);

    // ─── Handlers ────────────────────────────────

    const handlePopupScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleDropdownSearch = useMemo(
        () => debounce((value) => {
            setSearchText(value);
        }, 800),
        []
    );

    const handleSelectToken = (value, option) => {
        setSelectedToken(option.data);
    };

    const handleDispatch = () => {
        if (!selectedToken || !selectedEventId) return;

        // Payload for dispatch
        const payload = {
            event_id: selectedEventId,
            batch_index: selectedToken.batch_index,
            token: selectedToken.token
        };

        onScan(payload);
    };

    // ─── Render Helpers ──────────────────────────


    const formatTokenLabel = useCallback((t) => {
        const prefix = t.prefix
            ? t.prefix.replace(/_/g, ' ')
            : '';
        return prefix ? `${prefix}${t.batch_index}` : `#${t.batch_index}`;
    }, []);

    const tokenOptions = useMemo(() => {
        return allTokens
            .filter(t => !dispatchedTokens.includes(t.token))
            .map((t) => ({
                label: (
                    <Space>
                        <span>{formatTokenLabel(t)}</span>
                        {/* <Tag color={t.status === 'available' ? 'green' : 'red'}>{t.status}</Tag> */}
                    </Space>
                ),
                value: t.token,
                data: t,
            }));
    }, [allTokens, dispatchedTokens]);

    return (
        <Card size="small" className="mt-2">
            <Space direction="vertical" style={{ width: '100%' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <Text strong><CreditCardOutlined /> Dispatch via Card</Text>
                </div>

                {/* Event Selector (if multiple) */}
                {events.length > 1 && (
                    <Select
                        placeholder="Select Event"
                        value={selectedEventId}
                        onChange={setSelectedEventId}
                        style={{ width: '100%' }}
                        options={events.map(e => ({ label: e.name, value: e.id }))}
                    />
                )}

                {/* Dropdown Select */}
                <Select
                    placeholder="Select Card Token"
                    options={tokenOptions}
                    onChange={handleSelectToken}
                    loading={isLoading || isFetching}
                    showSearch
                    onSearch={handleDropdownSearch}
                    filterOption={false}
                    style={{ width: '100%' }}
                    value={selectedToken?.token}
                    onPopupScroll={handlePopupScroll}
                    notFoundContent={isLoading ? <Spin size="small" /> : null}
                />

                {/* Selected Token Info & Dispatch Action */}
                {selectedToken && (

                    <Button
                        type="primary"
                        block
                        icon={<CheckCircleOutlined />}
                        onClick={handleDispatch}
                        className="mt-2"
                    >
                        Verify & Dispatch
                    </Button>
                )}
            </Space >
        </Card >
    );
};

export default DispatchCardSearch;

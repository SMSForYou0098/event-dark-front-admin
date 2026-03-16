import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { debounce } from 'utils/debounce';
import { calculateTicketPrice } from 'utils/ticketCalculations';
import { Card, Space, Typography, Input, Button, Spin, Select, Descriptions, Tag, message, Divider, Switch } from 'antd';
import { CalendarOutlined, CreditCardOutlined, SearchOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from 'auth/FetchInterceptor';
import Utils from 'utils';

const { Text } = Typography;

const PreprintedCardStep = ({ event, tickets, setSelectedTickets, onTokenSelect, onNext, usedTokens = [] }) => {
    const { formatDateRange } = useMyContext();
    const [token, setToken] = useState('');
    const [selectedToken, setSelectedToken] = useState(null);
    const [isManual, setIsManual] = useState(false);
    const [searchText, setSearchText] = useState("");
    const lastEventId = useRef(null);

    // Use infinite query for tokens
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['cardTokens', event?.id, searchText],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await apiClient.post('card-tokens/detail', {
                event_id: event?.id,
                page: pageParam,
                per_page: 50,
                search: searchText,
                mode: 'assign'
            });
            if (res?.status === false) {
                throw new Error(Utils.getErrorMessage(res, 'Failed to load card tokens'));
            }
            return res?.data || res;
        },
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.pagination;
            if (pagination && pagination.current_page < pagination.last_page) {
                return pagination.current_page + 1;
            }
            return undefined;
        },
        enabled: !!event?.id,
        initialPageParam: 1,
    });

    const allTokens = useMemo(() => {
        return data?.pages.flatMap(page => page.tokens || []) || [];
    }, [data]);

    // Reset local selection when event changes
    useEffect(() => {
        if (event?.id && event.id !== lastEventId.current) {
            lastEventId.current = event.id;
            setSelectedToken(null);
            setSearchText("");
            onTokenSelect?.(null);
            setSelectedTickets([]);
        }
    }, [event?.id]);

    // Handle dropdown scroll — load next page near bottom
    const handlePopupScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Handle dropdown search
    const handleDropdownSearch = useMemo(
        () => debounce((value) => {
            setSearchText(value);
        }, 800),
        []
    );

    // When a token is selected, build ticket-like object and notify parent
    const handleTokenSelected = useCallback((tokenData) => {
        if (usedTokens.includes(tokenData.token)) {
            message.error("This token has already been used in this session");
            return;
        }

        setSelectedToken(tokenData);
        setToken('');
        // Notify parent of card token
        onTokenSelect?.(tokenData);
        // Build a ticket-like object from event's first ticket
        if (tickets?.length > 0 && tokenData) {
            // Find the precise ticket associated with this token
            const matchedTicket = tickets.find(t => t.id === tokenData.ticket_id);

            if (!matchedTicket) {
                message.error("Associated ticket not found for this token");
                return;
            }

            const price = parseFloat(matchedTicket.price || 0);
            const quantity = 1;

            const priceDetails = calculateTicketPrice(price, quantity, event?.tax_data);

            const ticketObj = {
                id: matchedTicket.id,
                name: matchedTicket.name,
                category: matchedTicket.category_id || event?.category, // Ensure category is passed
                ...priceDetails,

                // Card Token
                card_token: tokenData.token,
                card_token_id: tokenData.id,
            };
            setSelectedTickets([ticketObj]);
        }
    }, [tickets, event, setSelectedTickets, onTokenSelect, usedTokens]);

    // Mutation for fetching single token detail by token value
    const tokenDetailMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await apiClient.post('card-tokens/detail', { ...payload, mode: 'assign' });
            return res?.data || res;
        },
        onSuccess: (data) => {
            if (data?.token) {
                handleTokenSelected(data.token);
            }
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error, 'Token not found'));
        }
    });

    // Format prefix_index label (e.g. "Hello 2")
    const formatTokenLabel = useCallback((t) => {
        const prefix = t.prefix
            ? t.prefix.replace(/_/g, ' ')
            : '';
        return prefix ? `${prefix}${t.batch_index}` : `#${t.batch_index}`;
    }, []);

    // Dropdown options from accumulated tokens
    const tokenOptions = useMemo(() => {
        return allTokens
            .filter(t => !usedTokens.includes(t.token)) // Filter used tokens
            .filter(t => t.status !== 'claimed') // Filter claimed tokens
            .map((t) => ({
                label: formatTokenLabel(t),
                value: t.token,
                data: t,
            }));
    }, [allTokens, formatTokenLabel, usedTokens]);

    // Handle dropdown selection
    const handleSelectToken = useCallback((value, option) => {
        handleTokenSelected(option.data);
    }, [handleTokenSelected]);

    // Handle manual token search
    const handleSearch = useCallback(() => {
        if (!token.trim()) {
            message.warning('Please enter a token');
            return;
        }
        tokenDetailMutation.mutate({ token: token.trim() });
    }, [token, tokenDetailMutation]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    return (
        <Card
            bordered={false}
            title={
                <Space>
                    <CreditCardOutlined />
                    <span>{event?.name || 'Select an Event'}</span>
                </Space>
            }

            extra={
                <Space>
                    <Space>
                        <Text>{isManual ? 'SCAN QR' : 'SELECT CARD'}</Text>
                        <Switch checked={isManual} onChange={setIsManual} />
                    </Space>
                    {event?.date_range && (
                        <>
                            <Divider type="vertical" />
                            <Space>
                                <CalendarOutlined className="text-primary" />
                                <Text>{formatDateRange(event?.date_range)}</Text>
                            </Space>
                        </>
                    )}
                </Space>
            }
        >
            {/* Token Dropdown */}
            {
                !isManual && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Select Card Token
                        </Text>
                        <Select
                            placeholder="Select a token from the list"
                            options={tokenOptions}
                            onChange={handleSelectToken}
                            loading={isLoading || isFetching}
                            showSearch
                            onSearch={handleDropdownSearch}
                            filterOption={false}
                            size="large"
                            style={{ width: '100%' }}
                            value={selectedToken?.token || undefined}
                            allowClear
                            onClear={() => {
                                setSelectedToken(null);
                                setSelectedTickets([]);
                                setSearchText("");
                                onTokenSelect?.(null);
                                handleDropdownSearch.cancel(); // Cancel pending
                            }}
                            onPopupScroll={handlePopupScroll}
                            notFoundContent={(isLoading || isFetching) ? <div style={{ textAlign: 'center', padding: 8 }}><Spin size="small" /></div> : null}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    {isFetchingNextPage && (
                                        <div style={{ textAlign: 'center', padding: 8 }}>
                                            <Spin size="small" />
                                        </div>
                                    )}
                                </>
                            )}
                        />
                    </div>
                )
            }

            {/* Manual Token Input */}
            {
                isManual && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Enter Card Token
                        </Text>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="Scan or enter card token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                onKeyDown={handleKeyDown}
                                size="large"
                                allowClear
                            />
                            <Button
                                type="primary"
                                size="large"
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                loading={tokenDetailMutation.isPending}
                            >
                                Search
                            </Button>
                        </Space.Compact>
                    </div>
                )
            }

            {/* Error State */}
            {
                tokenDetailMutation.isError && (
                    <div style={{ marginTop: 16 }}>
                        <Tag color="error" style={{ padding: '8px 16px', fontSize: 14 }}>
                            {Utils.getErrorMessage(tokenDetailMutation.error, 'Token not found')}
                        </Tag>
                    </div>
                )
            }

            {/* Selected Token Detail */}
            {
                selectedToken && (
                    <div style={{ marginTop: 16 }}>
                        <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2 }}
                            labelStyle={{ fontWeight: 600 }}
                        >
                            <Descriptions.Item label="Card">
                                <Tag color="blue">
                                    {selectedToken.prefix
                                        ? `${(selectedToken.prefix.charAt(0).toUpperCase() + selectedToken.prefix.slice(1).toLowerCase()).replace(/_/g, ' ')} ${selectedToken.batch_index}`
                                        : `#${selectedToken.batch_index}`}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={selectedToken.status === 'available' ? 'green' : 'red'}>
                                    {selectedToken.status?.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>

                        </Descriptions>
                    </div>
                )
            }
        </Card >
    );
};

export default PreprintedCardStep;

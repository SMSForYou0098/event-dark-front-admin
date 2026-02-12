import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, Space, Typography, Input, Button, Spin, Select, Descriptions, Tag, message, Divider } from 'antd';
import { CalendarOutlined, CreditCardOutlined, SearchOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import { useMutation } from '@tanstack/react-query';
import apiClient from 'auth/FetchInterceptor';

const { Text } = Typography;

const PreprintedCardStep = ({ event, tickets, setSelectedTickets, onTokenSelect, onNext }) => {
    const { formatDateRange } = useMyContext();
    const [token, setToken] = useState('');
    const [selectedToken, setSelectedToken] = useState(null);

    // Infinite scroll state
    const [allTokens, setAllTokens] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [tokensLoading, setTokensLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const lastEventId = useRef(null);

    // Fetch tokens page
    const fetchTokens = useCallback(async (pageNum, reset = false) => {
        if (!event?.id) return;
        const isFirst = pageNum === 1;
        isFirst ? setTokensLoading(true) : setLoadingMore(true);

        try {
            const res = await apiClient.post('card-tokens/detail', {
                event_id: event.id,
                page: pageNum,
                per_page: 100,
            });
            const data = res?.data || res;
            const newTokens = data?.tokens || [];
            const pagination = data?.pagination;

            setAllTokens((prev) => reset ? newTokens : [...prev, ...newTokens]);
            setHasMore(pagination ? pagination.current_page < pagination.last_page : false);
        } catch (err) {
            console.error('Failed to fetch tokens:', err);
        } finally {
            setTokensLoading(false);
            setLoadingMore(false);
        }
    }, [event?.id]);

    // Reset & fetch when event changes
    useEffect(() => {
        if (event?.id && event.id !== lastEventId.current) {
            lastEventId.current = event.id;
            setAllTokens([]);
            setPage(1);
            setHasMore(true);
            setSelectedToken(null);
            fetchTokens(1, true);
        }
    }, [event?.id, fetchTokens]);

    // Handle dropdown scroll — load next page near bottom
    const handlePopupScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loadingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTokens(nextPage);
        }
    }, [hasMore, loadingMore, page, fetchTokens]);

    // When a token is selected, build ticket-like object and notify parent
    const handleTokenSelected = useCallback((tokenData) => {
        setSelectedToken(tokenData);
        setToken('');
        // Notify parent of card token
        onTokenSelect?.(tokenData);
        // Build a ticket-like object from event's first ticket
        if (tickets?.length > 0 && tokenData) {
            const firstTicket = tickets[0];
            const ticketObj = {
                id: firstTicket.id,
                name: firstTicket.name,
                price: parseFloat(firstTicket.price || 0),
                quantity: 1,
                category: firstTicket.category_id,
                baseAmount: parseFloat(firstTicket.price || 0),
                centralGST: 0,
                stateGST: 0,
                totalTax: 0,
                convenienceFee: 0,
                finalAmount: parseFloat(firstTicket.price || 0),
                discount: 0,
                discountPerUnit: 0,
                totalFinalAmount: parseFloat(firstTicket.price || 0),
                totalBaseAmount: parseFloat(firstTicket.price || 0),
                totalCentralGST: 0,
                totalStateGST: 0,
                totalTaxTotal: 0,
                totalConvenienceFee: 0,
                card_token: tokenData.token,
                card_token_id: tokenData.id,
            };
            setSelectedTickets([ticketObj]);
        }
    }, [tickets, setSelectedTickets, onTokenSelect]);

    // Mutation for fetching single token detail by token value
    const tokenDetailMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await apiClient.post('card-tokens/detail', payload);
            return res?.data || res;
        },
        onSuccess: (data) => {
            if (data?.token) {
                handleTokenSelected(data.token);
            }
        },
    });

    // Format prefix_index label (e.g. "Hello 2")
    const formatTokenLabel = useCallback((t) => {
        const prefix = t.prefix
            ? (t.prefix.charAt(0).toUpperCase() + t.prefix.slice(1).toLowerCase()).replace(/_/g, ' ')
            : '';
        return prefix ? `${prefix} ${t.batch_index}` : `#${t.batch_index}`;
    }, []);

    // Dropdown options from accumulated tokens
    const tokenOptions = useMemo(() => {
        return allTokens.map((t) => ({
            label: formatTokenLabel(t),
            value: t.token,
            data: t,
        }));
    }, [allTokens, formatTokenLabel]);

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
                event?.date_range && (
                    <Space>
                        <CalendarOutlined className="text-primary" />
                        <Text>{formatDateRange(event?.date_range)}</Text>
                    </Space>
                )
            }
        >
            {/* Token Dropdown */}
            <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Select Card Token
                </Text>
                <Select
                    placeholder="Select a token from the list"
                    options={tokenOptions}
                    onChange={handleSelectToken}
                    loading={tokensLoading}
                    showSearch
                    filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase()) ||
                        String(option?.data?.batch_index) === input.trim()
                    }
                    size="large"
                    style={{ width: '100%' }}
                    value={selectedToken?.token || undefined}
                    allowClear
                    onClear={() => {
                        setSelectedToken(null);
                        setSelectedTickets([]);
                        onTokenSelect?.(null);
                    }}
                    onPopupScroll={handlePopupScroll}
                    dropdownRender={(menu) => (
                        <>
                            {menu}
                            {loadingMore && (
                                <div style={{ textAlign: 'center', padding: 8 }}>
                                    <Spin size="small" />
                                </div>
                            )}
                        </>
                    )}
                />
            </div>

            <Divider plain style={{ margin: '12px 0' }}>or enter manually</Divider>

            {/* Manual Token Input */}
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

            {/* Error State */}
            {tokenDetailMutation.isError && (
                <div style={{ marginTop: 16 }}>
                    <Tag color="error" style={{ padding: '8px 16px', fontSize: 14 }}>
                        {tokenDetailMutation.error?.response?.data?.message ||
                            tokenDetailMutation.error?.message ||
                            'Token not found'}
                    </Tag>
                </div>
            )}

            {/* Selected Token Detail */}
            {selectedToken && (
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
                        {selectedToken.type && (
                            <Descriptions.Item label="Type">
                                <Tag color={selectedToken.type === 'online' ? 'green' : 'orange'}>
                                    {selectedToken.type?.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                        )}
                        {selectedToken.prefix && (
                            <Descriptions.Item label="Prefix">
                                {selectedToken.prefix}
                            </Descriptions.Item>
                        )}
                        {selectedToken.batch_name && (
                            <Descriptions.Item label="Batch">
                                {selectedToken.batch_name}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>
            )}
        </Card>
    );
};

export default PreprintedCardStep;

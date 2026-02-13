import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { debounce } from 'utils/debounce';
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
    const [searchText, setSearchText] = useState("");

    // Fetch tokens page
    const fetchTokens = useCallback(async (pageNum, reset = false, searchQuery = searchText) => {
        if (!event?.id) return;
        const isFirst = pageNum === 1;
        isFirst ? setTokensLoading(true) : setLoadingMore(true);

        try {
            const res = await apiClient.post('card-tokens/detail', {
                event_id: event.id,
                page: pageNum,
                per_page: 50,
                search: searchQuery,
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
    }, [event?.id, searchText]);

    // Reset & fetch when event changes
    useEffect(() => {
        if (event?.id && event.id !== lastEventId.current) {
            lastEventId.current = event.id;
            setAllTokens([]);
            setPage(1);
            setHasMore(true);
            setSelectedToken(null);
            setSearchText("");
            fetchTokens(1, true, "");
        }
    }, [event?.id, fetchTokens]);

    // Handle dropdown scroll — load next page near bottom
    const handlePopupScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loadingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTokens(nextPage, false, searchText);
        }
    }, [hasMore, loadingMore, page, fetchTokens, searchText]);

    // Handle dropdown search
    const handleDropdownSearch = useMemo(
        () => debounce((value) => {
            setSearchText(value);
            setPage(1);
            fetchTokens(1, true, value);
        }, 800),
        [fetchTokens]
    );

    // When a token is selected, build ticket-like object and notify parent
    const handleTokenSelected = useCallback((tokenData) => {
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

            // --- Calculation Logic (Matches BookingTickets.jsx) ---
            const unitBaseAmount = +(price)?.toFixed(2);

            // tax states
            const taxData = event?.tax_data;
            const convenienceFeeValue = Number(taxData?.convenience_fee || 0);
            const convenienceFeeType = taxData?.type || "flat";

            // Dynamically calculate convenience fee
            let unitConvenienceFee = 0;
            if (convenienceFeeType === "percentage") {
                unitConvenienceFee = +(unitBaseAmount * (convenienceFeeValue / 100)).toFixed(2);
            } else {
                unitConvenienceFee = +convenienceFeeValue.toFixed(2);
            }

            const unitCentralGST = +(unitConvenienceFee * 0.09)?.toFixed(2);
            const unitStateGST = +(unitConvenienceFee * 0.09)?.toFixed(2);

            // Per-unit calculations
            const unitTotalTax = +(unitCentralGST + unitStateGST)?.toFixed(2);
            const unitFinalAmount = +((price) + unitConvenienceFee + unitTotalTax).toFixed(2);

            // Totals for the selected quantity (1)
            const totalBaseAmount = +(unitBaseAmount * quantity).toFixed(2);
            const totalCentralGST = +(unitCentralGST * quantity).toFixed(2);
            const totalStateGST = +(unitStateGST * quantity).toFixed(2);
            const totalConvenienceFee = +(unitConvenienceFee * quantity).toFixed(2);
            const totalTotalTax = +(totalCentralGST + totalStateGST + totalConvenienceFee).toFixed(2);
            const totalFinalAmount = +((price * quantity) + totalTotalTax).toFixed(2);

            const ticketObj = {
                id: matchedTicket.id,
                name: matchedTicket.name,
                price: +(+price).toFixed(2),
                quantity: quantity,
                category: matchedTicket.category_id || event?.category, // Ensure category is passed

                // per-unit
                baseAmount: unitBaseAmount,
                centralGST: unitCentralGST,
                stateGST: unitStateGST,
                totalTax: unitTotalTax,
                convenienceFee: unitConvenienceFee,
                finalAmount: unitFinalAmount,

                // totals
                totalBaseAmount,
                totalCentralGST,
                totalStateGST,
                totalTaxTotal: totalTotalTax,
                totalConvenienceFee,
                totalFinalAmount,

                // Card Token
                card_token: tokenData.token,
                card_token_id: tokenData.id,
            };
            setSelectedTickets([ticketObj]);
        }
    }, [tickets, event, setSelectedTickets, onTokenSelect]);

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
                        setPage(1);
                        fetchTokens(1, true, ""); // Immediate reset
                    }}
                    onPopupScroll={handlePopupScroll}
                    notFoundContent={tokensLoading ? <div style={{ textAlign: 'center', padding: 8 }}><Spin size="small" /></div> : null}
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

                    </Descriptions>
                </div>
            )}
        </Card>
    );
};

export default PreprintedCardStep;

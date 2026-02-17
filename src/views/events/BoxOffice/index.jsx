import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Card, Col, Row, Select, Typography, Empty, Spin } from "antd";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMyContext } from "Context/MyContextProvider";
import BookingsTab from "../Bookings/BookingsTab";
import api from "auth/FetchInterceptor";
import debounce from "utils/debounce";
const { Text } = Typography;

const BoxOffice = () => {
    const { authToken, api: apiUrl } = useMyContext();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
    const selectRef = useRef(null);

    // Debounce search input
    useEffect(() => {
        const debouncedUpdate = debounce((value) => {
            setDebouncedSearchValue(value);
        }, 500);

        debouncedUpdate(searchValue);

        return () => {
            debouncedUpdate.cancel();
        };
    }, [searchValue]);

    // Fetch users with infinite scroll pagination
    const {
        data: usersData,
        isLoading: usersLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: ["box-office-users", debouncedSearchValue],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams();
            params.set("page", pageParam.toString());
            params.set("per_page", "15");
            params.set("type", "all");

            if (debouncedSearchValue) {
                params.set("search", debouncedSearchValue);
            }

            const url = `users?${params.toString()}`;
            const res = await api.get(url);

            const body = res ?? {};
            const users = (Array.isArray(body.data) && body.data) || (Array.isArray(body) && body) || [];
            const paginationData = body.pagination || {
                current_page: pageParam,
                per_page: 15,
                total: users.length,
                last_page: 1,
            };

            return {
                users,
                pagination: paginationData,
            };
        },
        getNextPageParam: (lastPage) => {
            const { current_page, last_page } = lastPage.pagination;
            return current_page < last_page ? current_page + 1 : undefined;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: debouncedSearchValue.length > 0, // Only fetch when user has typed something
    });

    // Fetch user bookings with React Query
    const {
        data: bookings = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["user-bookings", selectedUserId],
        queryFn: async () => {
            if (!selectedUserId) return [];

            const response = await axios.get(`${apiUrl}user-bookings/${selectedUserId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            return response.data.bookings || [];
        },
        enabled: !!selectedUserId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Flatten all users from all pages
    const allUsers = useMemo(() => {
        if (!usersData?.pages) return [];
        return usersData.pages.flatMap((page) => page.users);
    }, [usersData]);

    // Transform users to Ant Design Select options format
    const userOptions = useMemo(() => {
        return allUsers.map((user) => ({
            value: user.id,
            label: user.name,
            email: user.email,
            number: user.contact,
        }));
    }, [allUsers]);

    // Handle scroll in dropdown to load more
    const handlePopupScroll = useCallback(
        (e) => {
            const { target } = e;
            const scrollThreshold = 50; // Load more when 50px from bottom

            if (
                target.scrollTop + target.offsetHeight >= target.scrollHeight - scrollThreshold &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    const handleUserChange = (userId) => {
        setSelectedUserId(userId);
    };

    const handleSearch = (value) => {
        setSearchValue(value);
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={24}>
                <Card
                    title='Box Office'>
                    <Select
                        ref={selectRef}
                        showSearch
                        placeholder="Search by name, email, or mobile number"
                        size="large"
                        className="w-100"
                        options={userOptions}
                        onSearch={handleSearch}
                        onChange={handleUserChange}
                        value={selectedUserId}
                        onPopupScroll={handlePopupScroll}
                        loading={usersLoading}
                        notFoundContent={
                            usersLoading ? (
                                <div className="text-center p-3">
                                    <Spin size="small" />
                                </div>
                            ) : debouncedSearchValue.length === 0 ? (
                                <div className="text-center text-muted p-3">
                                    Start typing to search users
                                </div>
                            ) : userOptions.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="No users found"
                                />
                            ) : null
                        }
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                {isFetchingNextPage && (
                                    <div className="text-center p-2">
                                        <Spin size="small" />
                                    </div>
                                )}
                            </>
                        )}
                        allowClear
                        filterOption={(input, option) => {
                            if (!input) return true;
                            const searchLower = input.toLowerCase();
                            const label = option?.label?.toLowerCase() || "";
                            const email = option?.email?.toLowerCase() || "";
                            const number = option?.number?.toString().toLowerCase() || "";
                            return (
                                label.includes(searchLower) ||
                                email.includes(searchLower) ||
                                number.includes(searchLower)
                            );
                        }}
                    />
                    <Text type="secondary" className="d-block mt-3">
                        User can search via name, mobile number or email
                    </Text>
                </Card>
            </Col>

            {selectedUserId && (
                <Col xs={24} lg={24}>
                    <Card
                        title='Bookings'
                        extra={
                            <Text>
                                Total Bookings:{" "}
                                <Text type="secondary" strong>
                                    {bookings.length}
                                </Text>
                            </Text>
                        }
                    >
                        <Spin spinning={isLoading}>
                            {error ? (
                                <Empty description="Failed to load bookings" />
                            ) : bookings?.length > 0 ? (
                                <BookingsTab
                                    userBookings={bookings || []}
                                    loading={isLoading}
                                    showAction={false}
                                    onRefresh={refetch}
                                    isBoxOffice={true}
                                />
                            ) : (
                                <Empty description="No bookings found for this user" />
                            )}
                        </Spin>
                    </Card>
                </Col>
            )}
        </Row>
    );
};

export default BoxOffice;
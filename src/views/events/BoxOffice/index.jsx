import React, { useState, useMemo } from "react";
import { Card, Col, Row, Select, Typography, Empty, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMyContext } from "Context/MyContextProvider";
import BookingsTab from "../Bookings/BookingsTab";
const { Text } = Typography;

const BoxOffice = () => {
    const { UserList, authToken, api } = useMyContext();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchValue, setSearchValue] = useState("");

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

            const response = await axios.get(`${api}user-bookings/${selectedUserId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            return response.data.bookings || [];
        },
        enabled: !!selectedUserId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Transform UserList to Ant Design Select options format
    const userOptions = useMemo(() => {
        if (!UserList) return [];

        return UserList.map((user) => ({
            value: user.value,
            label: user.label,
            email: user.email,
            number: user.number,
        }));
    }, [UserList]);


    // Custom filter function for search
    const filterOption = (input, option) => {
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
    };
    // Filtered options based on search value
    const filteredOptions = useMemo(() => {
        if (!searchValue || searchValue.length === 0) return [];

        return userOptions.filter((option) => filterOption(searchValue, option));
    }, [userOptions, searchValue]);


    const handleUserChange = (userId) => {
        setSelectedUserId(userId);
    };

    const handleSearch = (value) => {
        setSearchValue(value);
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
                <Card
                    title='Box Office'>
                    <Select
                        showSearch
                        placeholder="Search by name, email, or mobile number"
                        size="large"
                        className="w-100"
                        options={filteredOptions}
                        onSearch={handleSearch}
                        onChange={handleUserChange}
                        value={selectedUserId}
                        notFoundContent={
                            searchValue ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="No user found"
                                />
                            ) : (
                                <div className="text-center text-muted p-3">
                                    Start typing to search users
                                </div>
                            )
                        }
                        allowClear
                        filterOption={false}
                    />
                    <Text type="secondary" className="d-block mt-3">
                        User can search via name, mobile number or email
                    </Text>
                </Card>
            </Col>

            {selectedUserId && (
                <Col xs={24} lg={12}>
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
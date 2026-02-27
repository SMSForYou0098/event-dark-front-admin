"use client";

import React, { useCallback, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Alert, Button } from "antd";
import api from "auth/FetchInterceptor";
import BookingsTab from "./BookingsTab";
import Utils from "utils";

const PER_PAGE = 10;

const fetchBookings = async (id, params) => {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    per_page: PER_PAGE.toString(),
  });

  if (params.search?.trim()) {
    queryParams.append('search', params.search.trim());
  }

  if (params.startDate) {
    queryParams.append('start_date', params.startDate);
  }

  if (params.endDate) {
    queryParams.append('end_date', params.endDate);
  }

  const res = await api.get(`/user-bookings/${id}?${queryParams.toString()}`);
  if (!res?.status) {
    throw new Error(res?.message || "Failed to fetch bookings");
  }
  return {
    bookings: res.bookings,
    pagination: res.pagination
  };
};

const UserBookings = ({ id, activeTab }) => {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["user-bookings", id, search, startDate, endDate],
    queryFn: ({ pageParam = 1 }) =>
      fetchBookings(id, { page: pageParam, search, startDate, endDate }),
    enabled: !!id && activeTab == 2,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.pagination || {};
      if (current_page && last_page && current_page < last_page) {
        return current_page + 1;
      }
      return undefined; // No more pages
    },
  });

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    setStartDate(dates?.startDate || null);
    setEndDate(dates?.endDate || null);
  }, []);

  if (isError) {
    return (
      <Alert
        message="Error Loading Bookings"
        description={Utils.getErrorMessage(error)}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={refetch}>
            Retry
          </Button>
        }
      />
    );
  }

  // Flatten all pages into a single bookings array
  const bookings = data?.pages?.flatMap((page) => page.bookings || []) || [];
  const total = data?.pages?.[0]?.pagination?.total || bookings.length;

  return (
    <BookingsTab
      userBookings={bookings}
      loading={isLoading}
      onRefresh={refetch}
      serverSide={true}
      infiniteScroll={true}
      total={total}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      onSearchChange={handleSearchChange}
      onDateRangeChange={handleDateRangeChange}
    />
  );
};

export default UserBookings;
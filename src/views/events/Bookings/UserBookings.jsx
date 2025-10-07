"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button } from "antd";
import api from "auth/FetchInterceptor";
import BookingsTab from "./BookingsTab";

const fetchBookings = async (id) => {
  const res = await api.get(`/user-bookings/${id}`);
  if (!res?.status) {
    throw new Error(res?.message || "Failed to fetch bookings");
  }
  return res.bookings;
};

const UserBookings = ({ id, activeTab }) => {
  const {
    data: bookings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-bookings", id],
    queryFn: () => fetchBookings(id),
    enabled: !!id && activeTab == 2, // only fetch if id exists and tab is active
  });

  if (isError) {
    return (
      <Alert
        message="Error Loading Bookings"
        description={error.message}
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

  return (
    <BookingsTab 
      userBookings={bookings || []}
      loading={isLoading}
      onRefresh={refetch}
    />
  );
};

export default UserBookings;
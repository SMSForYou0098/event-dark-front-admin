import React, { memo, useCallback, useMemo, useState } from "react";
import { Button, Col, Input, Modal, Row, Space, Typography, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CreditCard } from "lucide-react";
import PermissionChecker from "layouts/PermissionChecker";
import { PERMISSIONS } from "constants/PermissionConstant";
import api from "auth/FetchInterceptor";
import Utils from "utils";
import ResponsiveDrawer from "components/shared-components/ResponsiveDrawer";

const ConfirmPendingBookingButton = memo(
  ({ booking, seatingChartBooking = false }) => {
    const { Text } = Typography;
    const queryClient = useQueryClient();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [availableByTicket, setAvailableByTicket] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState({});
    const [seatSearch, setSeatSearch] = useState("");
    /** When API returns conflict payload, `remaining` = how many replacement seats to pick */
    const [replacementSeatQuota, setReplacementSeatQuota] = useState(null);

    const isMasterBooking = useMemo(
      () =>
        Boolean(
          booking?.bookings &&
          Array.isArray(booking.bookings) &&
          booking.bookings.length > 0
        ),
      [booking]
    );

    const bookingLineSeatCount = useMemo(() => {
      if (isMasterBooking) {
        return booking.bookings.length;
      }
      return 1;
    }, [booking, isMasterBooking]);

    const requiredSeatCount = useMemo(() => {
      if (replacementSeatQuota != null) {
        const n = Math.floor(Number(replacementSeatQuota));
        if (Number.isFinite(n) && n >= 1) {
          return n;
        }
      }
      return bookingLineSeatCount;
    }, [replacementSeatQuota, bookingLineSeatCount]);

    const selectedSeatCount = useMemo(
      () => Object.keys(selectedSeats).length,
      [selectedSeats]
    );

    const handleConflictSeats = useCallback((data) => {
      if (!data?.available_by_ticket || !Array.isArray(data.available_by_ticket)) {
        message.error(data?.message || "Something went wrong.");
        return;
      }

      if (data.remaining != null) {
        const n = Math.floor(Number(data.remaining));
        if (!Number.isFinite(n) || n < 1) {
          message.error(
            data?.message ||
              "No replacement seats to select. Please try again or contact support."
          );
          return;
        }
        setReplacementSeatQuota(n);
      } else {
        setReplacementSeatQuota(null);
      }

      setAvailableByTicket(data.available_by_ticket);
      setSelectedSeats({});
      setSeatSearch("");
      setIsDrawerOpen(true);
      if (data?.message) {
        message.warning(data.message);
      }
    }, []);

    const updatePendingSeatsMutation = useMutation({
      mutationFn: async ({ id, is_master, seats }) => {
        return api.post("bookings/pending/seats", { id, is_master, seats });
      },
      onError: (err) => {
        const status = err?.response?.status;
        const responseData = err?.response?.data;
        if (status === 422 && responseData?.available_by_ticket) {
          handleConflictSeats(responseData);
          return;
        }
        message.error(
          Utils.getErrorMessage(err, "Failed to update pending booking seats")
        );
      },
    });

    const confirmPaymentMutation = useMutation({
      mutationFn: async ({ id, is_master }) => {
        return api.post("booking-confirm", {
          id,
          is_master,
          seating: seatingChartBooking,
        });
      },
      onSuccess: (res) => {
        if (res.status) {
          setIsDrawerOpen(false);
          setReplacementSeatQuota(null);
          queryClient.invalidateQueries(["pendingBookings"]);
          Modal.success({
            title: "Success",
            content: "Booking confirmed successfully.",
          });
        } else if (res?.available_by_ticket) {
          handleConflictSeats(res);
        } else {
          message.error(res?.message || "Something went wrong.");
        }
      },
      onError: (err) => {
        const status = err?.response?.status;
        const responseData = err?.response?.data;
        if (status === 422 && responseData?.available_by_ticket) {
          handleConflictSeats(responseData);
          return;
        }
        message.error(Utils.getErrorMessage(err, "Failed to confirm booking"));
      },
    });

    const handlePay = useCallback(() => {
      try {
        if (!booking?.id) {
          message.error("Booking not found");
          return;
        }

        Modal.confirm({
          title: "Confirm Payment",
          content: "Do you want to confirm payment for this booking?",
          icon: <AlertCircle size={24} color="#faad14" />,
          okText: "Yes, confirm it!",
          cancelText: "Cancel",
          okButtonProps: { danger: false },
          onOk: () => {
            confirmPaymentMutation.mutate({
              id: booking.id,
              is_master: isMasterBooking,
            });
          },
        });
      } catch (error) {
        message.error(
          Utils.getErrorMessage(error, "Failed to process payment confirmation")
        );
      }
    }, [booking, confirmPaymentMutation, isMasterBooking]);

    const toggleSeat = useCallback(
      (seat) => {
        const seatId = seat?.ess_id;
        if (!seatId) return;

        setSelectedSeats((prev) => {
          if (prev[seatId]) {
            const updated = { ...prev };
            delete updated[seatId];
            return updated;
          }

          if (Object.keys(prev).length >= requiredSeatCount) {
            message.warning(`You can select only ${requiredSeatCount} seat(s).`);
            return prev;
          }

          return {
            ...prev,
            [seatId]: seat,
          };
        });
      },
      [requiredSeatCount]
    );

    const handleConfirmSelectedSeats = useCallback(async () => {
      if (!booking?.id) {
        message.error("Booking not found");
        return;
      }
      if (selectedSeatCount !== requiredSeatCount) {
        message.warning(`Please select exactly ${requiredSeatCount} seat(s).`);
        return;
      }
      const seats = Object.values(selectedSeats).map((seat) => ({
        ess_id: seat.ess_id,
        seat_name: seat.seat_name,
      }));
      try {
        const seatRes = await updatePendingSeatsMutation.mutateAsync({
          id: booking.id,
          is_master: isMasterBooking,
          seats,
        });
        if (seatRes && seatRes.status === false) {
          if (seatRes.available_by_ticket) {
            handleConflictSeats(seatRes);
          } else {
            message.error(seatRes?.message || "Failed to update seats.");
          }
          return;
        }
        confirmPaymentMutation.mutate({
          id: booking.id,
          is_master: isMasterBooking,
        });
      } catch {
        // updatePendingSeatsMutation.onError handles API errors
      }
    }, [
      booking,
      confirmPaymentMutation,
      isMasterBooking,
      requiredSeatCount,
      selectedSeatCount,
      selectedSeats,
      updatePendingSeatsMutation,
      handleConflictSeats,
    ]);

    return (
      <>
        <PermissionChecker permission={PERMISSIONS.CONFIRM_PENDING_BOOKING}>
          <Button
            type="primary"
            size="small"
            icon={<CreditCard size={15} className="mr-2" />}
            onClick={handlePay}
            className="d-flex align-items-center justify-content-center"
            loading={confirmPaymentMutation.isPending}
            title="Pay Now"
          >
            Pay Now
          </Button>
        </PermissionChecker>

        <ResponsiveDrawer
          title="Select Available Seats"
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setReplacementSeatQuota(null);
          }}
          desktopWidth={520}
          mobileHeight="90vh"
          footer={
            <Button
              type="primary"
              onClick={handleConfirmSelectedSeats}
              loading={
                confirmPaymentMutation.isPending ||
                updatePendingSeatsMutation.isPending
              }
              block
            >
              Confirm Selected Seats
            </Button>
          }
        >
          <Row>
            <Col xs={12}>
            <Text type="secondary" className="mb-0 text-nowrap">
              Selected: {selectedSeatCount}/{requiredSeatCount}
            </Text>
            </Col>
            <Col xs={12}>
            <Input
              allowClear
              placeholder="Search seat name"
              style={{ flex: 1 }}
              value={seatSearch}
              onChange={(e) => setSeatSearch(e.target.value)}
            />
            </Col>
          </Row>

          <Space direction="vertical" size="middle" className="w-100">
            {availableByTicket.map((ticket) => (
              <Space
                key={ticket.ticket_id}
                direction="vertical"
                size="small"
                className="w-100"
              >
                <Text strong>
                  {ticket.name} - ₹{ticket.price ?? 0}
                </Text>
                <Space size={[8, 8]} wrap>
                  {(ticket.seats || [])
                    .filter((seat) =>
                      !seatSearch
                        ? true
                        : seat?.seat_name
                          ?.toLowerCase()
                          .includes(seatSearch.trim().toLowerCase())
                    )
                    .map((seat) => {
                      const isSelected = Boolean(selectedSeats[seat.ess_id]);
                      return (
                        <Button
                          key={seat.ess_id}
                          size="small"
                          type={isSelected ? "primary" : "default"}
                          onClick={() => toggleSeat(seat)}
                        >
                          {seat.seat_name}
                        </Button>
                      );
                    })}
                </Space>
              </Space>
            ))}
          </Space>
        </ResponsiveDrawer>
      </>
    );
  }
);

ConfirmPendingBookingButton.displayName = "ConfirmPendingBookingButton";

export default ConfirmPendingBookingButton;

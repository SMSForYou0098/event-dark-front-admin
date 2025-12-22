import React, { useState, memo, Fragment, useEffect, useCallback, useRef } from "react";
import { Button, Row, Col, Card, Space, Typography, message, Drawer } from "antd";
import { CalendarOutlined, ArrowRightOutlined, CloseCircleOutlined, SettingOutlined } from "@ant-design/icons";
import axios from "axios";
import POSAttendeeModal from "./POSAttendeeModal";
import POSPrintModal from "./POSPrintModal";
import PosEvents from "../components/PosEvents";
import OrderCalculation from "../components/OrderCalculation";
import { useMyContext } from "Context/MyContextProvider";
import { cancelToken } from "auth/FetchInterceptor";
import BookingTickets from "../components/BookingTickets";
import StickyLayout from "utils/MobileStickyBottom.jsx/StickyLayout";
import { calcTicketTotals } from "utils/ticketCalculations";
import { BookingStats, handleDiscountChange } from "../agent/utils";
import BookingLayout from "views/events/seating_module/theatre_booking/Bookinglayout";
import SeatingModuleSummary from "../agent/components/SeatingModuleSummary";
import { ROW_GUTTER } from "constants/ThemeConstant";
import ErrorDrawer from "./components/ErrorDrawer";
import { useLockSeats } from "../agent/useAgentBookingHooks";
import EventSeatsListener from "../components/EventSeatsListener";

const { Title, Text } = Typography;

const POS = memo(() => {
  const {
    api,
    UserData,
    isMobile,
    ErrorAlert,
    authToken,
    getCurrencySymbol,
    formatDateRange,
    userRole
  } = useMyContext();

  // State management
  const [isCheckOut, setIsCheckOut] = useState(true);
  const [event, setEvent] = useState([]);
  const [seatingModule, setSeatingModule] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [bookingData, setBookingData] = useState([]);

  const [isAmusment, setIsAmusment] = useState(false);
  const [ticketCurrency, setTicketCurrency] = useState('₹');

  // disc state 
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState();
  const [disableChoice, setDisableChoice] = useState(false);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [showAttendeeModel, setShowAttendeeModel] = useState(false);
  const [method, setMethod] = useState('Cash');
  const [showErrorDrawer, setShowErrorDrawer] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ref for BookingLayout to update seat status
  const bookingLayoutRef = useRef(null);

  // Lock seats mutation hook
  const lockSeatsMutation = useLockSeats();

  const {
    grandTotal,
  } = calcTicketTotals(selectedTickets, discount);

  const StorePOSBooking = useCallback(async () => {
    setShowAttendeeModel(false);
    const validTickets = selectedTickets?.filter(ticket => ticket?.quantity > 0);

    if (validTickets[0]?.quantity === undefined) {
      ErrorAlert('Please Select A Ticket');
      return;
    }

    const requestData = {
      user_id: UserData?.id,
      number,
      name,
      tickets: validTickets,
      discount,
      amount: grandTotal,
      payment_method: method,
      seating_module: seatingModule,
    };

    try {
      const url = isAmusment
        ? `${api}amusement/booking/pos`
        : `${api}booking/pos`;

      const res = await axios.post(url, requestData, {
        headers: { 'Authorization': 'Bearer ' + authToken },
        cancelToken
      });

      if (res.data.warningCode) {
        switch (res.data.warningCode) {
          case "TICKET_LIMIT_REACHED":
            message.warning(res.data.message || "Ticket limit reached. Please reduce quantity.");
            break;

          case "TICKETS_SOLD_OUT":
            message.error(res.data.message || "Tickets are sold out.");
            break;

          default:
            message.warning(res.data.message || "Something went wrong. Please try again.");
        }

        return;
      }
      if (res.data.status) {
        // ✅ Mark seats as booked in UI (reduces API calls)
        if (seatingModule && bookingLayoutRef.current) {
          bookingLayoutRef.current.markSeatsAsBooked();
        }
        
        setShowPrintModel(true);
        setBookingData(res.data?.bookings);
      }
    } catch (err) {
      console.log(err);
      
      // ✅ Handle 409 conflict - seats no longer available
      const errorData = err?.response?.data;
      if (errorData?.meta === 409 || err?.response?.status === 409) {
        const unavailableSeatIds = errorData?.seats || [];
        if (seatingModule && bookingLayoutRef.current && unavailableSeatIds.length > 0) {
          bookingLayoutRef.current.markSeatIdsAsBooked(unavailableSeatIds);
          message.error(errorData?.message || 'Some seats are no longer available');
        } else {
          message.error(errorData?.message || 'Some seats are no longer available');
        }
      }
    }
  }, [selectedTickets, UserData?.id, number, name, discount, method, isAmusment, api, authToken, ErrorAlert, grandTotal, seatingModule]);

  // Effects
  useEffect(() => {
    if (isMobile) {
      setIsCheckOut(true);
    }
  }, [isMobile]);

  const handleDiscount = useCallback(() => {
    handleDiscountChange({
      selectedTickets,
      discountValue,
      discountType,
      setDiscount,
      setSelectedTickets,
      setDisableChoice,
      message
    });
  }, [discountValue, discountType, selectedTickets]);

  useEffect(() => {
    setDisableChoice(false);
    if (discountValue) {
      setDiscount(0);
    }
  }, [discountValue, discountType]);

  const handleButtonClick = useCallback((evnt, tkts) => {
    setEvent(evnt)
    setSeatingModule(evnt?.event_controls?.ticket_system);
  }, []);

  const closePrintModel = () => {
    setShowPrintModel(false);
    resetfields();
  };

  const resetfields = () => {
    setDiscountValue('');
    setName('');
    setNumber('');
    setDiscount(0);
    setSelectedTickets([]);
    setDisableChoice(false);
  };

  const handleClose = useCallback((skip) => {
    setShowAttendeeModel(false);
    if (skip) {
      StorePOSBooking();
    }
  }, [StorePOSBooking]);

  const handleBooking = useCallback(async () => {
    const hasValidTicket = selectedTickets.some(ticket => Number(ticket?.quantity) > 0);

    if (!hasValidTicket) {
      setErrorMessage('Please select at least one ticket');
      setShowErrorDrawer(true);

      // Auto close after 3 seconds
      setTimeout(() => {
        setShowErrorDrawer(false);
      }, 3000);
      return;
    }

    // Lock seats if seating module is enabled and seats are selected
    if (seatingModule && event?.id) {
      const seats = selectedTickets?.flatMap(ticket =>
        (ticket.seats || []).map(seat => seat.seat_id || seat.id).filter(Boolean)
      ) || [];

      if (seats.length > 0) {
        try {
          message.loading({ content: 'Locking seats...', key: 'lockSeats' });
          const payload = {
            event_id: event.id,
            seats: seats,
            user_id: UserData?.id
          };
          await lockSeatsMutation.mutateAsync(payload);
          message.success({ content: 'Seats locked successfully', key: 'lockSeats' });
        } catch (error) {
          console.error('Failed to lock seats:', error);
          message.error({ content: error?.message || 'Failed to lock seats', key: 'lockSeats' });
          return; // Don't proceed if seat locking fails
        }
      }
    }

    setShowAttendeeModel(true);
  }, [selectedTickets, seatingModule, event, lockSeatsMutation, UserData?.id]);

  // Utility function to calculate total tax + convenience fee from booking array
  const calculateTotalTax = (bookings) => {
    if (!Array.isArray(bookings)) return 0;

    return bookings.reduce((sum, booking) => {
      const tax = parseFloat(booking?.booking_tax?.total_tax ?? 0);
      const convenienceFee = parseFloat(booking?.booking_tax?.convenience_fee ?? 0);
      return sum + tax + convenienceFee;
    }, 0);
  };

  const totalTax = calculateTotalTax(bookingData)

  return (
    <Fragment>
      {/* WebSocket listener for real-time seat updates */}
      {seatingModule && event?.id && (
        <EventSeatsListener
          eventId={event.id}
          bookingLayoutRef={bookingLayoutRef}
          enabled={seatingModule}
          id={UserData?.id}
          
        />
      )}

      <POSAttendeeModal
        show={showAttendeeModel}
        handleClose={handleClose}
        setName={setName}
        name={name}
        userRole={userRole}
        setNumber={setNumber}
        number={number}
        handleSubmit={StorePOSBooking}
        setMethod={setMethod}
      />

      <POSPrintModal
        showPrintModel={showPrintModel}
        showConfig={showConfig}
        setShowConfig={setShowConfig}
        closePrintModel={closePrintModel}
        event={event}
        bookingData={bookingData}
        subtotal={'subtotal'}
        totalTax={totalTax}
        discount={discount}
        grandTotal={grandTotal}
        autoPrint={true}
      />

      <ErrorDrawer
        visible={showErrorDrawer}
        message={errorMessage}
        onClose={() => setShowErrorDrawer(false)}
      />

      <Row gutter={ROW_GUTTER}>
        <Col span={24}>
          <PosEvents handleButtonClick={handleButtonClick} />
        </Col>

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={event?.name}
            extra={event?.date_range && (
              <Space>
                {/* add setting button */}
                <Button
                  size="small"
                  className="mr-2"
                  icon={<SettingOutlined />}
                  onClick={() => setShowConfig(true)}
                />
                <CalendarOutlined className="text-primary" />
                <Text>{formatDateRange(event?.date_range)}</Text>
              </Space>
            )}
          >
            <Col xs={24} lg={24}>
              {seatingModule ? (
                <BookingLayout
                  ref={bookingLayoutRef}
                  eventId={event?.id}
                  setSelectedTkts={setSelectedTickets}
                  layoutId={event?.layout_id}
                />
              ) : (
                <BookingTickets
                  event={event}
                  selectedTickets={selectedTickets}
                  setSelectedTickets={setSelectedTickets}
                  getCurrencySymbol={getCurrencySymbol}
                  type={'pos'}
                />)}
            </Col>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <BookingStats type="pos" id={UserData?.id} />

            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <OrderCalculation
                ticketCurrency={ticketCurrency}
                discount={discount}
                selectedTickets={selectedTickets}

                //disc props
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                disableChoice={disableChoice}
                handleDiscount={handleDiscount}
              />

              <div className="d-none d-sm-block">
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  size="large"
                  block
                  onClick={handleBooking}
                >
                  Checkout
                </Button>
              </div>
              <div className="d-block d-sm-none">
                <StickyLayout
                  left={
                    <span className="p-0 m-0">
                      <Title level={5} className="p-0 m-0">Order Total</Title>
                      <Title level={3} type="primary" className="p-0 m-0">
                        {ticketCurrency}{grandTotal}
                      </Title>
                    </span>
                  }
                  right={
                    <Button
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      size="large"
                      style={{ width: '10rem' }}
                      block
                      onClick={handleBooking}
                    >
                      Checkout
                    </Button>
                  }
                />
              </div>
            </Space>
          </Card>
        </Col>
        {seatingModule && (
          <Col xs={24} lg={24}>
            <SeatingModuleSummary selectedTickets={selectedTickets} />
          </Col>
        )}
      </Row>
    </Fragment>
  );
});

POS.displayName = "POS";
export default POS;
import React, { useState, memo, Fragment, useEffect, useMemo, useCallback } from "react";
import { Button, Row, Col, Card, Space, Typography, Statistic, message } from "antd";
import { CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import axios from "axios";
import Flex from "components/shared-components/Flex";
import POSAttendeeModal from "./POSAttendeeModal";
import POSPrintModal from "./POSPrintModal";
import PosEvents from "../components/PosEvents";
import OrderCalculation from "../components/OrderCalculation";
import { useMyContext } from "Context/MyContextProvider";
import { cancelToken } from "auth/FetchInterceptor";
import BookingTickets from "../components/BookingTickets";
import StickyLayout from "utils/MobileStickyBottom.jsx/StickyLayout";
import { calcTicketTotals, distributeDiscount } from "utils/ticketCalculations";
import { BookingStats, handleDiscountChange } from "../agent/utils";

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
  const [eventID, setEventID] = useState(true);
  const [isCheckOut, setIsCheckOut] = useState(true);
  const [event, setEvent] = useState([]);
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
  // const [tickets, setTickets] = useState([]);

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
    };

    try {
      const url = isAmusment
        ? `${api}amusementBook-pos/${eventID}`
        : `${api}book-pos/${eventID}`;

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
      
                // Stop further success flow if it’s a warning/error
                //setIsBookingInProgress(false);
                return;
              }
      if (res.data.status) {
        setShowPrintModel(true);
        setBookingData(res.data?.bookings);
      }
    } catch (err) {
      console.log(err);
    }
  }, [selectedTickets, UserData?.id, number, name, discount, method, isAmusment, api, eventID, authToken, ErrorAlert, grandTotal]);

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
    // setTickets(tkts)
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

  const handleBooking = useCallback(() => {
    // console.log(selectedTickets)
    const hasValidTicket = selectedTickets.some(ticket => Number(ticket?.quantity) > 0);

    if (!hasValidTicket) {
      message.error('Please select at least one ticket');
    } else {
      setShowAttendeeModel(true);
    }
  }, [selectedTickets]);


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
        closePrintModel={closePrintModel}
        event={event}
        bookingData={bookingData}
        subtotal={'subtotal'}
        totalTax={totalTax}
        discount={discount}
        grandTotal={grandTotal}
      />



      <Row gutter={[16, 16]}>
        <Col span={24}>
          <PosEvents handleButtonClick={handleButtonClick} />
        </Col>

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={event?.name}
            extra={event?.date_range && (
              <Space>
                <CalendarOutlined className="text-primary" />
                <Text>{formatDateRange(event?.date_range)}</Text>
              </Space>
            )}
          >
            <BookingTickets
              event={event}
              selectedTickets={selectedTickets}
              setSelectedTickets={setSelectedTickets}
              getCurrencySymbol={getCurrencySymbol}
              type={'pos'}
            />
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
      </Row>
    </Fragment>
  );
});

POS.displayName = "POS";
export default POS;
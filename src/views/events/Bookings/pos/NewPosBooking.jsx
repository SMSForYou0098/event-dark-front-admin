import React, { useState, memo, Fragment, useEffect, useMemo, useCallback } from "react";
import { Button, Row, Col, Card,Space, Typography, Statistic, message } from "antd";
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
import { BookingStats } from "../agent/utils";

const { Title, Text } = Typography;

const POS = memo(() => {
  const {
    api,
    UserData,
    isMobile,
    ErrorAlert,
    authToken,
    getCurrencySymbol,
    formatDateRange
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

      if (res.data.status) {
        setShowPrintModel(true);
        setBookingData(res.data?.bookings);
      }
    } catch (err) {
      console.log(err);
    }
  }, [selectedTickets, UserData?.id, number, name, discount, method, isAmusment, api, eventID, authToken, ErrorAlert ,grandTotal]);

  // Effects
  useEffect(() => {
    if (isMobile) {
      setIsCheckOut(true);
    }
  }, [isMobile]);

  const handleDiscount = useCallback(() => {
    const { subtotal } = calcTicketTotals(selectedTickets);
  
    if (!discountValue || discountValue <= 0) {
      setDiscount(0);
      setDisableChoice(false);
      message.info('Discount removed');
      return;
    }
  
    const subtotalValue = parseFloat(subtotal);
    let calculatedDiscount = 0;
  
    if (discountType === 'percentage') {
      if (discountValue > 100) {
        message.error('Percentage cannot be more than 100%');
        return;
      }
      calculatedDiscount = (subtotalValue * discountValue) / 100;
    } else {
      if (discountValue > subtotalValue) {
        message.error('Discount cannot be more than subtotal');
        return;
      }
      calculatedDiscount = Number(discountValue);
    }
  
    const finalDiscount = +calculatedDiscount.toFixed(2);
    // ✅ Apply the discount to tickets before updating totals
    const updatedTickets = distributeDiscount(selectedTickets, finalDiscount);
  
    setSelectedTickets(updatedTickets); // important step
    setDiscount(finalDiscount);
    setDisableChoice(true);
  
    message.success('Discount applied successfully');
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


  

  return (
    <Fragment>
      <POSAttendeeModal
        show={showAttendeeModel}
        handleClose={handleClose}
        setName={setName}
        name={name}
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
        totalTax={'totalTax'}
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
                      style={{width:'10rem'}}
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
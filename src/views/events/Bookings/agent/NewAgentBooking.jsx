import axios from 'axios';
import { useMyContext } from 'Context/MyContextProvider';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { cancelToken } from "auth/FetchInterceptor";
import { Button, Card, Col, message, Row, Space, Statistic, Typography } from 'antd';
import PosEvents from '../components/PosEvents';
import BookingTickets from '../components/BookingTickets';
import Flex from 'components/shared-components/Flex';
import OrderCalculation from '../components/OrderCalculation';
import DiscoutFIeldGroup from '../components/DiscoutFIeldGroup';
import StickyLayout from 'utils/MobileStickyBottom.jsx/StickyLayout';
import { SearchOutlined, CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;
const NewAgentBooking = memo(() => {
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
  const [bookingHistory, setBookingHistory] = useState([]);
  const [subtotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [ticketCurrency, setTicketCurrency] = useState('₹');
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [centralGST, setCentralGST] = useState(0);
  const [stateGST, setStateGST] = useState(0);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [disableChoice, setDisableChoice] = useState(false);
  const [ticketSummary, setTicketSummary] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState();
  const [bookings, setBookings] = useState([]);
  const [isAmusment, setIsAmusment] = useState(false);

  const [showPrintModel, setShowPrintModel] = useState(false);
  const [showAttendeeModel, setShowAttendeeModel] = useState(false);
  const [method, setMethod] = useState('Cash');
  const [tickets, setTickets] = useState([]);
  // Memoized calculations
  const bookingStats = useMemo(() => ({
    total: bookings?.allbookings?.length ?? 0,
    amount: (parseInt(bookings?.amount) ?? 0).toFixed(2),
    discount: (parseInt(bookings?.discount) ?? 0).toFixed(2)
  }), [bookings]);

  // API calls with useCallback
  const GetBookings = useCallback(async () => {
    try {
      const url = `${api}pos-bookings/${UserData?.id}`;
      const res = await axios.get(url, {
        headers: { 'Authorization': 'Bearer ' + authToken }
      });
      if (res.data.status) {
        setBookings(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  }, [api, UserData?.id, authToken]);



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
        GetBookings();
      }
    } catch (err) {
      console.log(err);
    }
  }, [selectedTickets, UserData?.id, number, name, discount, grandTotal, method, isAmusment, api, eventID, authToken, ErrorAlert, GetBookings]);

  // Effects
  useEffect(() => {
    if (isMobile) {
      setIsCheckOut(true);
    }
  }, [isMobile]);

  useEffect(() => {
    GetBookings();
  }, [GetBookings]);



  useEffect(() => {
    if (selectedTickets?.length > 0) {
      // Sum values across all selected tickets
      const totalBaseAmount = selectedTickets.reduce(
        (acc, ticket) => acc + (ticket.baseAmount * ticket.quantity),
        0
      );

      const totalCentralGST = selectedTickets.reduce(
        (acc, ticket) => acc + (ticket.centralGST * ticket.quantity),
        0
      );

      const totalStateGST = selectedTickets.reduce(
        (acc, ticket) => acc + (ticket.stateGST * ticket.quantity),
        0
      );

      const totalTax = totalCentralGST + totalStateGST;
      const totalFinalAmount = selectedTickets.reduce(
        (acc, ticket) => acc + ticket.finalAmount,
        0
      );

      // Update state
      setBaseAmount(+totalBaseAmount.toFixed(2));
      setCentralGST(+totalCentralGST.toFixed(2));
      setStateGST(+totalStateGST.toFixed(2));
      setTotalTax(+totalTax.toFixed(2));

      // Grand total = totalFinalAmount - discount
      const grandTotal = totalFinalAmount - discount;
      setGrandTotal(+grandTotal.toFixed(2));
    } else {
      // Reset all
      setBaseAmount(0);
      setCentralGST(0);
      setStateGST(0);
      setTotalTax(0);
      setGrandTotal(0);
    }
  }, [selectedTickets, discount]);


  const handleDiscount = useCallback(() => {
    if (discountValue) {
      let disc = 0;
      if (discountType === 'fixed') {
        setDiscount(discountValue);
      } else if (discountType === 'percentage') {
        disc = subtotal * discountValue / 100;
        setDiscount(disc);
      }
      setDisableChoice(true);
      setGrandTotal(grandTotal - disc);
    }
  }, [discountValue, discountType, subtotal, grandTotal]);

  useEffect(() => {
    setDisableChoice(false);
    if (discountValue) {
      setDiscount(0);
    }
  }, [discountValue, discountType]);

  useEffect(() => {
    if (bookingHistory.length > 0) {
      const ticketMap = bookingHistory.reduce((acc, booking) => {
        const ticket = event.tickets?.find(item => item.id === booking.ticket_id);
        if (ticket) {
          if (!acc[ticket.name]) {
            acc[ticket.name] = { ...ticket, quantity: 0 };
          }
          acc[ticket.name].quantity += 1;
        }
        return acc;
      }, {});
      setTicketSummary(Object.values(ticketMap));
    }
  }, [bookingHistory, event?.tickets]);

  const handleButtonClick = useCallback((evnt, tkts) => {
    setEvent(evnt)
    console.log(event)
    setTickets(tkts)
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



  const stats = [
    {
      title: "Bookings",
      value: bookingStats.total,
    },
    {
      title: "Amount",
      value: bookingStats.amount,
      prefix: "₹",
      valueStyle: { color: "var(--primary-color)" },
    },
    {
      title: "Discount",
      value: bookingStats.discount,
      prefix: "₹",
      valueStyle: { color: "#1890ff" },
    },
  ];

  return (
    <Fragment>
      {/* <POSAttendeeModal
        show={showAttendeeModel}
        handleClose={handleClose}
        setName={setName}
        name={name}
        setNumber={setNumber}
        number={number}
        handleSubmit={StorePOSBooking}
        setMethod={setMethod}
      /> */}
      {/* use normal attendee modal */}

      {/* <POSPrintModal
        showPrintModel={showPrintModel}
        closePrintModel={closePrintModel}
        event={event}
        bookingData={bookingData}
        subtotal={subtotal}
        totalTax={totalTax}
        discount={discount}
        grandTotal={grandTotal}
      /> */}
      {/* use ticket modal instead of print modal */}


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
              setSubTotal={setSubTotal}
              setBaseAmount={setBaseAmount}
              setCentralGST={setCentralGST}
              setStateGST={setStateGST}
              setTotalTax={setTotalTax}
              event={event}
              selectedTickets={selectedTickets}
              setSelectedTickets={setSelectedTickets}
              setGrandTotal={setGrandTotal}
              getCurrencySymbol={getCurrencySymbol}
            />
          </Card>
        </Col>


        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <Flex justify="space-around" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
              {stats.map((item, index) => (
                <Statistic
                  key={index}
                  title={item.title}
                  value={item.value}
                  prefix={item.prefix}
                  valueStyle={{ ...item.valueStyle, fontSize: '14px' , fontWeight : 'bold' }}
                />
              ))}

            </Flex>

            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <OrderCalculation
                ticketCurrency={ticketCurrency}
                subtotal={subtotal}
                discount={discount}
                baseAmount={baseAmount}
                centralGST={centralGST}
                totalTax={totalTax}
              />

              <DiscoutFIeldGroup
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                disableChoice={disableChoice}
                handleDiscount={handleDiscount}
              />

              <Flex justifyContent="space-between" align="center">
                <Title level={5} style={{ margin: 0 }}>Order Total</Title>
                <Title level={3} type="primary" style={{ margin: 0 }}>
                  {ticketCurrency}{grandTotal}
                </Title>
              </Flex>
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

export default NewAgentBooking


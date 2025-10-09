import React, { useState, memo, Fragment, useEffect, useMemo, useCallback } from "react";
import { Button, Row, Col, Table, Card, Input, Collapse, Space, Typography, Statistic } from "antd";
import { SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import axios from "axios";
import Flex from "components/shared-components/Flex";
import CommonPricingComp from "../components/CommonPricingComp";
import POSAttendeeModal from "./POSAttendeeModal";
import POSPrintModal from "./POSPrintModal";
import Counter from "utils/QuantityCounter";
import PosEvents from "../components/PosEvents";
import OrderCalculation from "../components/OrderCalculation";
import DiscoutFIeldGroup from "../components/DiscoutFIeldGroup";
import { useMyContext } from "Context/MyContextProvider";
import { cancelToken } from "auth/FetchInterceptor";
import BookingTickets from "../components/BookingTickets";

const { Title, Text } = Typography;
const { Panel } = Collapse;
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
  const [selectedTicketID, setSelectedTicketID] = useState(null);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState();
  const [resetCounterTrigger, setRsetCounterTrigger] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [isAmusment, setIsAmusment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [showAttendeeModel, setShowAttendeeModel] = useState(false);
  const [method, setMethod] = useState('Cash');
  const [activeKey, setActiveKey] = useState(['1']);

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
    const validTickets = selectedTickets.filter(ticket => ticket?.quantity > 0);

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
    if (subtotal) {
      setCentralGST(baseAmount * 9 / 100);
      setStateGST(baseAmount * 9 / 100);
      setTotalTax((centralGST + stateGST + baseAmount)?.toFixed(2));
    }

    if (((subtotal + totalTax) - discount) > 0) {
      const total = (subtotal + +totalTax) - discount;
      setGrandTotal(total?.toFixed(2));
    }
  }, [subtotal, totalTax, discount, baseAmount, centralGST, stateGST]);

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

  const handleButtonClick = useCallback((tickets) => {
    console.log(tickets)
    setRsetCounterTrigger(prev => prev + 1);
    setActiveKey([]);
  }, []);

  const closePrintModel = useCallback(() => {
    setShowPrintModel(false);
    resetfields();
  }, []);

  const resetfields = useCallback(() => {
    setDiscountValue('');
    setName('');
    setNumber('');
    setDiscount(0);
    setSelectedTickets([]);
    setDisableChoice(false);
  }, []);

  const handleClose = useCallback((skip) => {
    setShowAttendeeModel(false);
    if (skip) {
      StorePOSBooking();
    }
  }, [StorePOSBooking]);

  const handleBooking = useCallback(async () => {
    const validTickets = selectedTickets.filter(ticket => ticket?.quantity > 0);
    if (validTickets[0]?.quantity === undefined) {
      ErrorAlert('Please Select A Ticket');
    } else {
      setShowAttendeeModel(true);
    }
  }, [selectedTickets, ErrorAlert]);


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
        subtotal={subtotal}
        totalTax={totalTax}
        discount={discount}
        grandTotal={grandTotal}
      />

      {isMobile && isCheckOut && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            zIndex: 99,
            bottom: 0,
            width: '100%',
            background: '#fff',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Flex>
            <Button
              type="default"
              size="large"
              block
              style={{
                borderRadius: 0,
                height: 56,
                background: '#faad14',
                color: '#fff',
                border: 'none'
              }}
            >
              <strong>Amount: </strong>{ticketCurrency}{grandTotal}
            </Button>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleBooking}
              style={{ borderRadius: 0, height: 56 }}
            >
              Checkout
            </Button>
          </Flex>
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Collapse
              activeKey={activeKey}
              onChange={setActiveKey}
              ghost
            >
              <Panel header="Events" key="1">
                <Input
                  size="large"
                  className="mb-3"
                  placeholder="Search Your Event..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
                <PosEvents
                  searchTerm={searchTerm}
                  handleButtonClick={handleButtonClick}
                />
              </Panel>
            </Collapse>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Title level={5} style={{ margin: 0 }}>{event?.name}</Title>
                {event?.date_range && (
                  <Space>
                    <CalendarOutlined />
                    <Text>{formatDateRange(event?.date_range)}</Text>
                  </Space>
                )}
              </Flex>
            }
          >
            <BookingTickets
              setSubTotal={setSubTotal}
              setBaseAmount={setBaseAmount}
              setCentralGST={setCentralGST}
              setStateGST={setStateGST}
              setTotalTax={setTotalTax}
              event={event}
              setGrandTotal={setGrandTotal}
              getCurrencySymbol={getCurrencySymbol}
            />
          </Card>
        </Col>


        <Col xs={24} lg={8}>
          <Card>
            <Flex justify="space-around" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
              <Statistic
                title="Bookings"
                value={bookingStats.total}
                valueStyle={{ color: '#666' }}
              />
              <Statistic
                title="Amount"
                value={bookingStats.amount}
                prefix="₹"
                valueStyle={{ color: '#ff4d4f' }}
              />
              <Statistic
                title="Discount"
                value={bookingStats.discount}
                prefix="₹"
                valueStyle={{ color: '#1890ff' }}
              />
            </Flex>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
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

              <Flex justify="space-between" align="center">
                <Title level={5} style={{ margin: 0 }}>Order Total</Title>
                <Title level={4} type="primary" style={{ margin: 0 }}>
                  {ticketCurrency}{grandTotal}
                </Title>
              </Flex>

              {!isMobile && (
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleBooking}
                >
                  Checkout
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
});

POS.displayName = "POS";
export default POS;
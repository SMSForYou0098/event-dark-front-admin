import { useMyContext } from 'Context/MyContextProvider';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, message, Row, Space, Statistic, Typography } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import PosEvents from '../components/PosEvents';
import BookingTickets from '../components/BookingTickets';
import Flex from 'components/shared-components/Flex';
import OrderCalculation from '../components/OrderCalculation';
import DiscoutFIeldGroup from '../components/DiscoutFIeldGroup';
import StickyLayout from 'utils/MobileStickyBottom.jsx/StickyLayout';
import { ArrowRightOutlined, CalendarOutlined, UserAddOutlined, TeamOutlined } from "@ant-design/icons";
import AttendeesField from './AttendeesField';
import AttendeeSuggestion from './AttendeeSuggestion';
import SelectedAttendees from './SelectedAttendees';

const { Title, Text } = Typography;

const NewAgentBooking = memo(() => {
  const {
    UserData,
    isMobile,
    getCurrencySymbol,
    fetchCategoryData,
    formatDateRange
  } = useMyContext();

  // State management
  const [eventID, setEventID] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
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
  const [isAttendeeRequire, setIsAttendeeRequire] = useState(false);
  const [categoryFields, setCategoryFields] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [showAttendeeFieldModal, setShowAttendeeFieldModal] = useState(false);
  const [editingAttendeeIndex, setEditingAttendeeIndex] = useState(null);
  const [editingAttendeeData, setEditingAttendeeData] = useState({});
  const [showAttendeeSuggestion, setShowAttendeeSuggestion] = useState(false);
  const [isCorporate, setIsCorporate] = useState(false);
  const [isAgent, setIsAgent] = useState(true); // Set based on your logic

  // Memoized calculations
  const bookingStats = useMemo(() => ({
    total: bookings?.allbookings?.length ?? 0,
    amount: (parseInt(bookings?.amount) ?? 0).toFixed(2),
    discount: (parseInt(bookings?.discount) ?? 0).toFixed(2)
  }), [bookings]);

  // Fetch existing attendees query
  const { data: existingAttendees = [], refetch: refetchAttendees } = useQuery({
    queryKey: ['user-attendees', UserData?.id, categoryId, isCorporate, isAgent],
    queryFn: async () => {
      if (!isAttendeeRequire || !categoryId || !UserData?.id) {
        return [];
      }

      const endpoint = isCorporate
        ? `corporate-attendee/${UserData.id}/${categoryId}`
        : `user-attendee/${UserData.id}/${categoryId}?isAgent=${isAgent}`;

      const response = await api.get(endpoint);

      if (response.status && Array.isArray(response.attendees)) {
        return response.attendees;
      }
      return [];
    },
    enabled: isAttendeeRequire && !!categoryId && !!UserData?.id,
  });

  // TanStack Query mutation for booking
  const bookingMutation = useMutation({
    mutationFn: async (requestData) => {
      const endpoint = isAmusment
        ? `amusementBook-pos/${eventID}`
        : `book-pos/${eventID}`;

      const response = await api.post(endpoint, requestData);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to create booking');
      }

      return response;
    },
    onSuccess: (res) => {
      if (res.status && res.bookings) {
        setShowPrintModel(true);
        setBookingData(res.bookings);
        message.success('Booking created successfully!');
        resetfields();
      } else {
        message.error(res?.message || 'Failed to create booking');
      }
    },
    onError: (error) => {
      console.error('Booking error:', error);
      message.error(error.response?.data?.message || 'Failed to create booking');
    },
  });

  const StorePOSBooking = useCallback(async () => {
    setShowAttendeeModel(false);
    
    const validTickets = selectedTickets?.filter(ticket => ticket?.quantity > 0);

    if (!validTickets || validTickets.length === 0 || validTickets[0]?.quantity === undefined) {
      message.error('Please select at least one ticket');
      return;
    }

    // Check if attendees are required and if they are added
    if (isAttendeeRequire && attendees.length === 0) {
      message.error('Please add attendee details');
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
      ...(isAttendeeRequire && { attendees }), // Add attendees if required
    };

    bookingMutation.mutate(requestData);
  }, [
    selectedTickets,
    UserData?.id,
    number,
    name,
    discount,
    grandTotal,
    method,
    isAttendeeRequire,
    attendees,
    bookingMutation
  ]);

  // Handle attendee save
  const handleAttendeeSave = useCallback((attendeeData, editingIndex) => {
    if (editingIndex !== null) {
      // Update existing attendee
      setAttendees(prev => {
        const updated = [...prev];
        updated[editingIndex] = attendeeData;
        return updated;
      });
      message.success('Attendee updated successfully');
    } else {
      // Add new attendee
      setAttendees(prev => [...prev, attendeeData]);
      message.success('Attendee added successfully');
    }
    
    setShowAttendeeFieldModal(false);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
  }, []);

  // Handle select attendee from suggestions
  const handleSelectAttendee = useCallback((attendee) => {
    const isAlreadySelected = attendees.some(a => a.id === attendee.id);
    
    if (isAlreadySelected) {
      message.warning('This attendee is already selected');
      return;
    }

    setAttendees(prev => [...prev, attendee]);
    message.success('Attendee added successfully');
  }, [attendees]);

  // Handle remove attendee
  const handleRemoveAttendee = useCallback((index) => {
    setAttendees(prev => prev.filter((_, i) => i !== index));
    message.success('Attendee removed');
  }, []);

  // Handle edit attendee
  const handleEditAttendee = useCallback((index) => {
    setEditingAttendeeIndex(index);
    setEditingAttendeeData(attendees[index]);
    setShowAttendeeFieldModal(true);
  }, [attendees]);

  // Handle attendee modal open
  const handleOpenAttendeeModal = useCallback(() => {
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setShowAttendeeFieldModal(true);
  }, []);

  // Handle attendee modal close
  const handleCloseAttendeeModal = useCallback(() => {
    setShowAttendeeFieldModal(false);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
  }, []);

  // Handle show attendee suggestions
  const handleShowSuggestions = useCallback(() => {
    if (existingAttendees.length === 0) {
      message.info('No existing attendees found');
      return;
    }
    setShowAttendeeSuggestion(true);
  }, [existingAttendees]);

  // Effects
  useEffect(() => {
    if (isMobile) {
      setIsCheckOut(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (selectedTickets?.length > 0) {
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

      setBaseAmount(+totalBaseAmount.toFixed(2));
      setCentralGST(+totalCentralGST.toFixed(2));
      setStateGST(+totalStateGST.toFixed(2));
      setTotalTax(+totalTax.toFixed(2));

      const grandTotal = totalFinalAmount - discount;
      setGrandTotal(+grandTotal.toFixed(2));
    } else {
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

  const handleButtonClick = useCallback(async(evnt, tkts) => {
    setEvent(evnt);
    setEventID(evnt?.id);
    setTickets(tkts);
    setAttendees([]); // Reset attendees when event changes
    setCategoryId(evnt?.category);
    
    const response = await fetchCategoryData(evnt?.category);
    
    if(response.status){
      const attendeeRequired = response?.categoryData?.attendy_required === 1;
      setIsAttendeeRequire(attendeeRequired);

      if(attendeeRequired){
        setCategoryFields(response?.customFieldsData || []);
      } else {
        setCategoryFields([]);
      }
    }
    
    setIsAmusment(evnt?.event_type === 'amusement');
  }, [fetchCategoryData]);

  const closePrintModel = () => {
    setShowPrintModel(false);
  };

  const resetfields = () => {
    setDiscountValue('');
    setName('');
    setNumber('');
    setDiscount(0);
    setSelectedTickets([]);
    setDisableChoice(false);
    setAttendees([]);
  };

  const handleClose = useCallback((skip) => {
    setShowAttendeeModel(false);
    if (skip) {
      StorePOSBooking();
    }
  }, [StorePOSBooking]);

  const handleBooking = useCallback(() => {
    const hasValidTicket = selectedTickets.some(ticket => Number(ticket?.quantity) > 0);

    if (!hasValidTicket) {
      message.error('Please select at least one ticket');
      return;
    }

    if (isAttendeeRequire && attendees.length === 0) {
      message.warning('Please add attendee details before checkout');
      return;
    }

    setShowAttendeeModel(true);
  }, [selectedTickets, isAttendeeRequire, attendees]);

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
      {/* Attendee Field Modal */}
      {isAttendeeRequire && (
        <>
          <AttendeesField
            showModal={showAttendeeFieldModal}
            handleCloseModal={handleCloseAttendeeModal}
            apiData={categoryFields}
            onSave={handleAttendeeSave}
            initialData={editingAttendeeData}
            editingIndex={editingAttendeeIndex}
          />

          <AttendeeSuggestion
            showModal={showAttendeeSuggestion}
            handleCloseModal={() => setShowAttendeeSuggestion(false)}
            attendees={existingAttendees}
            onSelectAttendee={handleSelectAttendee}
            selectedAttendeeIds={attendees.map(a => a.id)}
          />
        </>
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <PosEvents handleButtonClick={handleButtonClick} />
        </Col>

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={event?.name || 'Select an Event'}
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
                  valueStyle={{ ...item.valueStyle, fontSize: '14px', fontWeight: 'bold' }}
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

              {/* Attendee Management - Only show if required */}
              {isAttendeeRequire && (
                <>
                  <Space.Compact block>
                    <Button
                      type="dashed"
                      icon={<UserAddOutlined />}
                      onClick={handleOpenAttendeeModal}
                      disabled={!eventID}
                      block
                    >
                      Add New Attendee
                    </Button>
                    <Button
                      type="default"
                      icon={<TeamOutlined />}
                      onClick={handleShowSuggestions}
                      disabled={!eventID || existingAttendees.length === 0}
                    >
                      Select
                    </Button>
                  </Space.Compact>

                  {attendees.length > 0 && (
                    <SelectedAttendees
                      attendees={attendees}
                      onRemove={handleRemoveAttendee}
                      onEdit={handleEditAttendee}
                      categoryFields={categoryFields}
                    />
                  )}
                </>
              )}

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
                  loading={bookingMutation.isPending}
                  disabled={!eventID || selectedTickets.length === 0}
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
                      loading={bookingMutation.isPending}
                      disabled={!eventID || selectedTickets.length === 0}
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

NewAgentBooking.displayName = 'NewAgentBooking';
export default NewAgentBooking;


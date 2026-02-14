import { useMyContext } from 'Context/MyContextProvider';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Col, message, Row, Modal, Alert } from 'antd';
import PosEvents from '../components/PosEvents';
import AgentBookingModal from './AgentBookingModal';
import { handleDiscountChange, processImageFile } from './utils';

// Import step components
import StepIndicator from './components/StepIndicator';
import TicketSelectionStep from './components/TicketSelectionStep';
import PreprintedCardStep from './components/PreprintedCardStep';
import AttendeeManagementStep from './components/AttendeeManagementStep';
import OrderSummary from './components/OrderSummary';

// Import custom hooks
import {
  useUserAttendees,
  useCheckEmail,
  useCreateUser,
  useUpdateUser,
  useCorporateBooking,
  useAgentBooking,
  useLockSeats,
  useCategoryDetail,
  useEventFields,
} from './useAgentBookingHooks';
import BookingSummary from './components/BookingSummary';
import { calcTicketTotals, distributeDiscount, getSubtotal } from 'utils/ticketCalculations';
import BookingLayout from 'views/events/seating_module/theatre_booking/Bookinglayout';
import SeatingModuleSummary from './components/SeatingModuleSummary';
import EventSeatsListener from '../components/EventSeatsListener';

const NewAgentBooking = memo(({ type }) => {
  const {
    UserData,
    isMobile,
    authToken,
    userRole,
    getCurrencySymbol,
    formatDateRange,
  } = useMyContext();

  // State management
  const [eventID, setEventID] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [event, setEvent] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [ticketCurrency, setTicketCurrency] = useState('₹');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [disableChoice, setDisableChoice] = useState(false);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState();
  const [isAmusment, setIsAmusment] = useState(false);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [method, setMethod] = useState('UPI');
  const [tickets, setTickets] = useState([]);
  const [isAttendeeRequire, setIsAttendeeRequire] = useState(false);
  const [seatingModule, setSeatingModule] = useState(false);
  const [categoryFields, setCategoryFields] = useState([]);
  const [savedAttendeeIds, setSavedAttendeeIds] = useState({});
  const [isCorporate, setIsCorporate] = useState(false);
  const [isAgent, setIsAgent] = useState(true);
  const [stickerData, setStickerData] = useState(null);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);
  const [openStickerModal, setOpenStickerModal] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [doc, setDoc] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  // const [masterBookings, setMasterBookings] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingResponse, setBookingResponse] = useState(null);
  const [ticketAttendees, setTicketAttendees] = useState({});
  const [selectedCardToken, setSelectedCardToken] = useState(null);

  const [usedTokens, setUsedTokens] = useState([]);
  const [bookingError, setBookingError] = useState(null);

  // Queries
  const { data: categoryDataResponse } = useCategoryDetail(categoryId, { enabled: !!categoryId });
  const { data: eventFields } = useEventFields(eventID, {
    enabled: !!eventID && !!event?.event_controls?.attendee_required && !categoryDataResponse?.categoryData?.attendy_required
  });

  // Effect to update attendee requirements and fields
  useEffect(() => {
    if (!categoryId) return;

    if (categoryDataResponse?.status) {
      const categoryAttendeeRequired = categoryDataResponse?.categoryData?.attendy_required === true;
      const eventAttendeeRequired = event?.event_controls?.attendee_required === true;

      if (categoryAttendeeRequired) {
        setIsAttendeeRequire(true);
        setCategoryFields(categoryDataResponse?.customFieldsData || []);
      } else if (eventAttendeeRequired) {
        setIsAttendeeRequire(true);
        setCategoryFields(eventFields || []);
      } else {
        setIsAttendeeRequire(false);
        setCategoryFields([]);
      }
    }
  }, [categoryDataResponse, eventFields, event]);

  // Ref for BookingLayout to update seat status
  const bookingLayoutRef = useRef(null);

  // Custom hooks
  const { data: existingAttendees = [], refetch: refetchAttendees } = useUserAttendees({
    userId: UserData?.id,
    categoryId,
    isCorporate,
    isAgent,
    enabled: isAttendeeRequire && !!categoryId && !!UserData?.id,
  });

  const checkEmailMutation = useCheckEmail();
  const createUserMutation = useCreateUser({
    onSuccess: (response) => {
      if (response.status && response.user) {
        setCreatedUser(response.user);
        message.success('User created successfully!');
      }
    },
    onError: (error) => {
      console.error('Create user error:', error);
      message.error(error.message || 'Failed to create user');
    },
  });

  /*
  const updateUserMutation = useUpdateUser({
    // onSuccess: (response) => {
    //   if (response.status && response.user) {
    //     message.success('User updated successfully!');
    //   }
    // },
    onError: (error) => {
      console.error('Update user error:', error);
      message.error(error.message || 'Failed to update user');
    },
  });
  */

  const corporateBookingMutation = useCorporateBooking({
    onSuccess: (response) => {
      if (response.status && response.bookings) {
        message.success('Ticket purchased successfully!');
        const { bookings } = response;
        const corporateUser = bookings.corporate_user;
        const data = bookings;

        setSelectedTickets(null);
        setStickerData({ ...corporateUser });
        setPrintInvoiceData({
          event: data?.ticket?.event,
          bookingData: {
            token: data?.token,
            created_at: data?.created_at,
            quantity: data?.quantity,
            payment_method: data?.payment_method,
            ticket: {
              name: data?.ticket?.name,
              price: data?.ticket?.price,
            },
          },
          grandTotal: data?.amount,
          discount: data?.discount || 0,
          totalTax: data?.totalTax || 0,
          subtotal: data?.subtotal || 0,
        });

        setOpenStickerModal(true);
        setIsConfirmed(true);
        setShowPrintModel(true);
      }
    },
    onError: (error) => {
      console.error('Corporate booking error:', error);
      message.error(error.message || 'Failed to process corporate ticket purchase');
    },
  });

  const agentBookingMutation = useAgentBooking();
  const lockSeatsMutation = useLockSeats();

  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const lastBookingAttemptRef = useRef(0);
  const COOLDOWN_PERIOD = 2000; // 2 seconds cooldown

  const handleBookingAfterUser = useCallback(async (user, attendeeIdsByTicket = {}) => {
    // ✅ Check if booking is already in progress
    if (isBookingInProgress) {
      message.warning('Booking is already in progress, please wait...');
      return;
    }

    setBookingError(null);

    // ✅ Check cooldown period
    const now = Date.now();
    const timeSinceLastAttempt = now - lastBookingAttemptRef.current;
    if (timeSinceLastAttempt < COOLDOWN_PERIOD) {
      const remainingSeconds = Math.ceil((COOLDOWN_PERIOD - timeSinceLastAttempt) / 1000);
      message.warning(`Please wait ${remainingSeconds} second(s) before trying again`);
      return;
    }

    // ✅ Validate user exists
    if (!user || !user.id) {
      console.error('❌ No user provided to handleBookingAfterUser');
      message.error('User information is missing');
      return;
    }

    const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);

    if (!hasValidTicket) {
      message.error('Please select at least one ticket');
      return;
    }

    // ✅ Set booking in progress and update last attempt time
    setIsBookingInProgress(true);
    lastBookingAttemptRef.current = now;

    // ✅ Build tickets array with attendee IDs
    const ticketsPayload = selectedTickets.map(ticket => {
      const ticketId = ticket.id.toString();
      const attendeeIds = attendeeIdsByTicket[ticketId] || attendeeIdsByTicket[ticket.id] || [];

      return {
        id: ticket.id,
        seats: ticket.seats,
        category: ticket.category,
        quantity: ticket.quantity,
        price: ticket.price,
        baseAmount: ticket.baseAmount,
        centralGST: ticket.centralGST,
        stateGST: ticket.stateGST,
        totalTax: ticket.totalTax,
        convenienceFee: ticket.convenienceFee,
        finalAmount: ticket.finalAmount,
        discount: ticket.discount,
        discountPerUnit: ticket.discountPerUnit,
        attendee_ids: attendeeIds,
        totalFinalAmount: ticket.totalFinalAmount,
        totalBaseAmount: ticket.totalBaseAmount,
        totalCentralGST: ticket.totalCentralGST,
        totalStateGST: ticket.totalStateGST,
        totalTaxTotal: ticket.totalTaxTotal,
        totalConvenienceFee: ticket.totalConvenienceFee,
      };
    });

    const bookingPayload = {
      agent_id: UserData?.id,
      user_id: user?.id,
      number: user?.number || number,
      email: user?.email || email,
      name: user?.name || name,
      payment_method: method,
      type: event?.event_type || 'daily',
      tickets: ticketsPayload,
      seating_module: seatingModule,
      ...(selectedCardToken ? { card_token: selectedCardToken.token, card_token_id: selectedCardToken.id } : {}),
    };
    // console.log(bookingPayload)
    // return
    const url = isAmusment ? `amusement-agent-book-ticket/${eventID}` : `booking/${type}/${eventID}`;

    // ✅ Call booking API ONLY ONCE
    agentBookingMutation.mutate({
      url,
      payload: bookingPayload
    }, {
      onSuccess: (response) => {
        // Handle warnings from backend
        if (response.warningCode) {
          switch (response.warningCode) {
            case "TICKET_LIMIT_REACHED":
              message.warning(response.message || "Ticket limit reached. Please reduce quantity.");
              break;

            case "TICKETS_SOLD_OUT":
              message.error(response.message || "Tickets are sold out.");
              break;

            default:
              message.warning(response.message || "Something went wrong. Please try again.");
          }

          // Stop further success flow if it’s a warning/error
          setIsBookingInProgress(false);
          return;
        }
        if (response.status) {
          message.success(response.message || 'Booking created successfully!');

          // ✅ Mark seats as booked in UI (reduces API calls)
          if (seatingModule && bookingLayoutRef.current) {
            bookingLayoutRef.current.markSeatsAsBooked();
          }

          setBookingResponse(response.bookings || null);
          if (selectedCardToken) {
            setUsedTokens(prev => [...prev, selectedCardToken.token]);
          }
          setSavedAttendeeIds({});
          setSelectedTickets([]);
          setTicketAttendees({});
          setSelectedCardToken(null);
          setCurrentStep(currentStep + 1);
          setIsConfirmed(true);
        }

        // ✅ Reset booking state after a short delay
        setTimeout(() => {
          setIsBookingInProgress(false);
        }, 1000);
      },
      onError: (error) => {
        console.error('❌ Booking error:', error);

        // ✅ Handle 409 conflict - seats no longer available
        if (error?.meta === 409 || error?.response?.status === 409 || error?.status === 409) {
          const unavailableSeatIds = error?.seats || error?.response?.data?.seats || [];
          if (seatingModule && bookingLayoutRef.current && unavailableSeatIds.length > 0) {
            bookingLayoutRef.current.markSeatIdsAsBooked(unavailableSeatIds);
            const errMsg = error?.response?.data?.message || 'Some seats are no longer available';
            message.error(errMsg);
            setBookingError(errMsg);
          } else {
            const errMsg = error?.response?.data?.message || error.message || 'Some seats are no longer available';
            message.error(errMsg);
            setBookingError(errMsg);
          }
        } else {
          const errMsg = error?.response?.data?.message || error.message || 'Booking failed';
          message.error(errMsg);
          setBookingError(errMsg);
        }

        // ✅ Reset booking state on error
        setTimeout(() => {
          setIsBookingInProgress(false);
        }, 1000);
      }
    });
  }, [isBookingInProgress, type, selectedTickets, UserData, number, email, name, method, event, isAmusment, eventID, agentBookingMutation, currentStep, seatingModule, selectedCardToken]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitAttemptRef = useRef(0);
  const SUBMIT_COOLDOWN = 2000; // 2 seconds cooldown

  const handleUserSubmit = useCallback(async () => {
    // ✅ Check if submission is already in progress
    if (isSubmitting) {
      message.warning('Submission is already in progress, please wait...');
      return;
    }

    // ✅ Check cooldown period
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSubmitAttemptRef.current;
    if (timeSinceLastAttempt < SUBMIT_COOLDOWN) {
      const remainingSeconds = Math.ceil((SUBMIT_COOLDOWN - timeSinceLastAttempt) / 1000);
      message.warning(`Please wait ${remainingSeconds} second(s) before trying again`);
      return;
    }

    if (!name) {
      message.error("Name is required");
      return;
    }

    if (!number) {
      message.error("Mobile number is required");
      return;
    }

    // ✅ Validate attendees
    if (isAttendeeRequire) {
      const validation = attendeeStepRef.current?.validateAttendees?.();
      if (!validation?.valid) {
        message.error(validation?.message || 'Please complete attendees');
        return;
      }
    }

    // ✅ Set submission in progress and update last attempt time
    setIsSubmitting(true);
    lastSubmitAttemptRef.current = now;

    try {
      const checkResult = await checkEmailMutation.mutateAsync({
        email,
        number
      });

      let user = null;

      if (checkResult?.exists) {
        if (checkResult.is_email_and_mobile_different_users) {
          message.error('This number & email is already registered');
          setIsSubmitting(false);
          return;
        } else {
          if (checkResult?.mobile_exists) {
            const formData = new FormData();
            if (companyName) formData.append('company_name', companyName);
            if (photo) {
              const processedPhoto = photo instanceof File ? await processImageFile(photo) : photo;
              formData.append('photo', processedPhoto);
            }
            if (doc) {
              const processedDoc = doc instanceof File ? await processImageFile(doc) : doc;
              formData.append('doc', processedDoc);
            }
            if (designation) formData.append('designation', designation);
            formData.append('user_id', checkResult.user.id);

            /*
            await updateUserMutation.mutateAsync({
              userId: checkResult.user.id,
              formData
            });
            */

            user = checkResult.user;
            setCreatedUser(user);
          } else if (checkResult?.email_exists) {
            message.error('This email is already registered');
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        // New user creation
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('number', number);
        formData.append('password', number);
        formData.append('reporting_user', UserData?.id);

        if (companyName) formData.append('company_name', companyName);
        if (designation) formData.append('designation', designation);
        if (photo) {
          const processedPhoto = await processImageFile(photo);
          formData.append('photo', processedPhoto);
        }
        if (doc) {
          const processedDoc = await processImageFile(doc);
          formData.append('doc', processedDoc);
        }

        const result = await createUserMutation.mutateAsync(formData);
        if (result.user) {
          user = result.user;
          setCreatedUser(user);
        }
      }

      // ✅ Only proceed if user exists
      if (!user) {
        message.error('Failed to create or retrieve user');
        setIsSubmitting(false);
        return;
      }

      const ticketAttendeesData = attendeeStepRef.current?.getAttendeeIdsByTicket?.();
      const attendeeIdsByTicket = {};

      if (ticketAttendeesData) {
        Object.entries(ticketAttendeesData).forEach(([ticketId, attendees]) => {
          if (Array.isArray(attendees)) {
            // ✅ If it's already an array of IDs (numbers)
            const ids = attendees.filter(id => {
              const isValid = typeof id === 'number' && id > 0;
              return isValid;
            });

            attendeeIdsByTicket[ticketId] = ids;
          } else {
            console.warn(`Ticket ${ticketId} has invalid attendees format:`, attendees);
            attendeeIdsByTicket[ticketId] = [];
          }
        });
      } else {
        console.warn('No attendee data returned from getAttendeeIdsByTicket');
      }

      // ✅ Validate that we have attendee IDs if required
      if (isAttendeeRequire) {
        const hasAttendeesForAllTickets = selectedTickets.every(ticket => {
          const ticketId = ticket.id.toString();
          const attendeeIds = attendeeIdsByTicket[ticketId] || attendeeIdsByTicket[ticket.id] || [];
          return attendeeIds.length > 0;
        });

        if (!hasAttendeesForAllTickets) {
          message.error('Please add attendees for all tickets');
          console.error('Missing attendees for some tickets:', {
            attendeeIdsByTicket,
            selectedTickets: selectedTickets.map(t => ({ id: t.id, category: t.category }))
          });
          setIsSubmitting(false);
          return;
        }
      }

      // ✅ SINGLE CALL - Create booking with attendee IDs
      await handleBookingAfterUser(user, attendeeIdsByTicket);

      // ✅ Reset submission state after successful booking
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);

    } catch (err) {
      console.error('Error in handleUserSubmit:', err);
      message.error(err.message || "An error occurred, please try again.");

      // ✅ Reset submission state on error
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  }, [isSubmitting, name, number, email, companyName, designation, photo, doc, UserData, isAttendeeRequire, selectedTickets, checkEmailMutation, createUserMutation, handleBookingAfterUser]);

  const isLoading =
    corporateBookingMutation.isPending ||
    agentBookingMutation.isPending ||
    // masterBookingMutation.isPending ||
    createUserMutation.isPending ||
    createUserMutation.isPending; // || updateUserMutation.isPending;


  const attendeeStepRef = useRef(null);
  const handleButtonClick = useCallback(async (evnt, tkts) => {
    setEvent(evnt);
    setEventID(evnt?.id);
    setTickets(tkts);
    setSeatingModule(evnt?.event_controls?.ticket_system);
    setCategoryId(evnt?.category);
    setCurrentStep(0); // Reset to step 0
    setSelectedCardToken(null);
    setIsAmusment(evnt?.event_type === 'amusement');
  }, []);

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

  const goToNextStep = useCallback(async () => {
    if (currentStep === 0) {
      const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);
      if (!hasValidTicket) {
        message.error('Please select at least one ticket');
        return;
      }

      // Lock seats if seating module is enabled and seats are selected
      if (seatingModule && eventID) {
        const seats = selectedTickets?.flatMap(ticket =>
          (ticket.seats || []).map(seat => seat.seat_id || seat.id).filter(Boolean)
        ) || [];

        if (seats.length > 0) {
          try {
            message.loading({ content: 'Locking seats...', key: 'lockSeats' });
            const payload = {
              event_id: eventID,
              seats: seats
            };
            await lockSeatsMutation.mutateAsync({ ...payload, user_id: UserData?.id });
            message.success({ content: 'Seats locked successfully', key: 'lockSeats' });
          } catch (error) {
            console.error('Failed to lock seats:', error);
            message.error({ content: error?.message || 'Failed to lock seats', key: 'lockSeats' });
            return; // Don't proceed if seat locking fails
          }
        }
      }

      if (isAttendeeRequire) {
        setCurrentStep(1);
      } else {
        setShowPrintModel(true);
      }
    } else if (currentStep === 1) {
      if (isAttendeeRequire) {
        const validation = attendeeStepRef.current?.validateAttendees?.();
        if (!validation?.valid) {
          message.error(validation?.message || 'Please complete attendees');
          return;
        }
      }
      setShowPrintModel(true);
    }
  }, [currentStep, selectedTickets, isAttendeeRequire, seatingModule, eventID, lockSeatsMutation]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedTickets([]);
      setTicketAttendees({});
    }
  }, [currentStep]);

  // Check if token is claimed
  const isTokenClaimed = useMemo(() => {
    return selectedCardToken?.status === 'claimed';
  }, [selectedCardToken]);

  // ✅ Also update handleBooking to not interfere
  const handleBooking = useCallback(() => {
    // This should only be called from the final checkout step
    const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);

    if (!hasValidTicket) {
      message.error('Please select at least one ticket');
      return;
    }

    // Show checkout modal (user details form)
    setShowPrintModel(true);
  }, [selectedTickets]);

  // ✅ Lock seats API call
  const handleLockSeats = useCallback(async () => {
    // Extract seat IDs from selected tickets (just the seat_id values)
    const seats = selectedTickets?.flatMap(ticket =>
      (ticket.seats || []).map(seat => seat.seat_id)
    ) || [];

    if (seats.length === 0) {
      // No seats to lock (non-seating module tickets)
      return { success: true };
    }

    try {
      const response = await lockSeatsMutation.mutateAsync({
        event_id: eventID,
        seats: seats
      });
      return { success: true, response };
    } catch (error) {
      console.error('Failed to lock seats:', error);
      message.error(error?.message || 'Failed to lock seats');
      return { success: false, error };
    }
  }, [selectedTickets, lockSeatsMutation, eventID]);

  //console.log(UserData?.id);

  return (
    <Fragment>
      {/* WebSocket listener for real-time seat updates */}
      {seatingModule && eventID && (
        <EventSeatsListener
          eventId={eventID}
          bookingLayoutRef={bookingLayoutRef}
          enabled={seatingModule}
          id={UserData?.id}
        />
      )}

      <AgentBookingModal
        showPrintModel={showPrintModel}
        handleClose={() => {
          setShowPrintModel(false);
          setBookingError(null);
        }}
        confirm={isConfirmed}
        setConfirmed={setIsConfirmed}
        disabled={isLoading}
        loading={isLoading}
        setName={setName}
        name={name}
        setNumber={setNumber}
        number={number}
        email={email}
        setEmail={setEmail}
        handleSubmit={handleUserSubmit}
        setMethod={setMethod}
        method={method}
        setPhoto={setPhoto}
        photo={photo}
        setDoc={setDoc}
        doc={doc}
        setCompanyName={setCompanyName}
        companyName={companyName}
        designation={designation}
        setDesignation={setDesignation}
        event={event}
        selectedTickets={selectedTickets}
        bookingError={bookingError}
      />



      <Row gutter={[16]}>
        {currentStep === 0 &&
          <Col span={24}>
            <PosEvents type={type} handleButtonClick={handleButtonClick} />
          </Col>
        }
        {eventID && (
          <>
            {/* Step Indicator */}
            <Col span={24}>
              <StepIndicator currentStep={currentStep} isAttendeeRequire={isAttendeeRequire} />
            </Col>

            {/* Step 0: Ticket Selection */}
            {currentStep === 0 && (
              <>
                {seatingModule ? (
                  <Col xs={24} lg={16}>
                    <BookingLayout
                      ref={bookingLayoutRef}
                      eventId={event?.id}
                      setSelectedTkts={setSelectedTickets}
                      layoutId={event?.layout_id}
                      onNext={goToNextStep}
                    />
                  </Col>
                ) : event?.event_controls?.use_preprinted_cards ? (
                  <Col xs={24} lg={16}>
                    {
                      userRole === 'Agent' ?
                        <PreprintedCardStep
                          event={event}
                          tickets={tickets}
                          selectedTickets={selectedTickets}
                          setSelectedTickets={setSelectedTickets}
                          onTokenSelect={setSelectedCardToken}
                          onNext={goToNextStep}
                          usedTokens={usedTokens}
                        />
                        : <Alert type="warning" message="Access denied. Only agents are permitted to perform this action" />
                    }
                  </Col>
                ) : (
                  <Col xs={24} lg={16}>
                    <TicketSelectionStep
                      event={event}
                      selectedTickets={selectedTickets}
                      setSelectedTickets={setSelectedTickets}
                      getCurrencySymbol={getCurrencySymbol}
                      formatDateRange={formatDateRange}
                      onNext={goToNextStep}
                    />
                  </Col>
                )}
              </>
            )}


            {/* Step 1: Attendee Management */}
            {currentStep === 1 && isAttendeeRequire && (
              <Col xs={24} lg={16}>
                <AttendeeManagementStep
                  ref={attendeeStepRef}
                  selectedTickets={selectedTickets}
                  categoryFields={categoryFields}
                  existingAttendees={existingAttendees}
                  eventID={eventID}
                  onBack={goToPreviousStep}
                  ticketAttendees={ticketAttendees}
                  setTicketAttendees={setTicketAttendees}
                />
              </Col>
            )}

            {/* Right Sidebar - Order Summary */}
            {
              currentStep <= (isAttendeeRequire ? 1 : 0) ?
                <>
                  <Col xs={24} lg={8}>
                    <OrderSummary
                      userId={UserData?.id}
                      authToken={authToken}
                      ticketCurrency={ticketCurrency}
                      discountType={discountType}
                      setDiscountType={setDiscountType}
                      discountValue={discountValue}
                      setDiscountValue={setDiscountValue}
                      disableChoice={disableChoice}
                      handleDiscount={handleDiscount}
                      currentStep={currentStep}
                      isAttendeeRequire={isAttendeeRequire}
                      selectedTickets={selectedTickets}
                      isLoading={isLoading || lockSeatsMutation.isPending}
                      onNext={goToNextStep} // ✅ Pass navigation function
                      onCheckout={handleBooking} // ✅ Only used for final checkout
                      onLockSeats={handleLockSeats} // ✅ Pass lock seats function
                      isMobile={isMobile}
                      discount={discount}
                      disabled={isTokenClaimed}
                    />
                  </Col>
                </>
                :
                <>
                  <Col xs={24}>
                    <BookingSummary response={bookingResponse} setResponse={setBookingResponse} setCurrentStep={setCurrentStep} />
                  </Col>
                </>
            }
            {seatingModule && (
              <Col xs={24} lg={24}>
                <SeatingModuleSummary selectedTickets={selectedTickets} />
              </Col>
            )}
          </>
        )}
      </Row>
    </Fragment>
  );
});

NewAgentBooking.displayName = 'NewAgentBooking';
export default NewAgentBooking;


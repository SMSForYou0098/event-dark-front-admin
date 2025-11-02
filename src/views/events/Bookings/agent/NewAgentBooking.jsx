import { useMyContext } from 'Context/MyContextProvider';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Col, message, Row, Modal } from 'antd';
import PosEvents from '../components/PosEvents';
import AgentBookingModal from './AgentBookingModal';
import { processImageFile } from './utils';

// Import step components
import StepIndicator from './components/StepIndicator';
import TicketSelectionStep from './components/TicketSelectionStep';
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
} from './useAgentBookingHooks';
import BookingSummary from './components/BookingSummary';
import { calcTicketTotals, getSubtotal } from 'utils/ticketCalculations';

const NewAgentBooking = memo(({ type }) => {
  const {
    UserData,
    isMobile,
    authToken,
    getCurrencySymbol,
    formatDateRange,
    fetchCategoryData,
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
  const [categoryFields, setCategoryFields] = useState([]);
  const [savedAttendeeIds, setSavedAttendeeIds] = useState({}); // ✅ NEW: Store saved attendee IDs by ticket
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


  const handleBookingAfterUser = useCallback(async (user, attendeeIdsByTicket = {}) => {

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

    // ✅ Build tickets array with attendee IDs
    const ticketsPayload = selectedTickets.map(ticket => {
      const ticketId = ticket.id.toString();
      const attendeeIds = attendeeIdsByTicket[ticketId] || attendeeIdsByTicket[ticket.id] || [];


      return {
        id: ticket.id,
        category: ticket.category,
        quantity: ticket.quantity,
        price: ticket.price,
        baseAmount: ticket.baseAmount,
        centralGST: ticket.centralGST,
        stateGST: ticket.stateGST,
        totalTax: ticket.totalTax,
        convenienceFee: ticket.convenienceFee,
        finalAmount: ticket.finalAmount,
        attendee_ids: attendeeIds, // ✅ Should contain [14, 15] based on your console
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
      tickets: ticketsPayload
    };

    const url = isAmusment ? `amusement-agent-book-ticket/${eventID}` : `booking/${type}/${eventID}`;

    // ✅ Call booking API ONLY ONCE
    agentBookingMutation.mutate({
      url,
      payload: bookingPayload
    }, {
      onSuccess: (response) => {
        if (response.status) {
          message.success(response.message || 'Booking created successfully!');
          setBookingResponse(response.bookings || null);
          setSavedAttendeeIds({});
          setSelectedTickets([]);
          setTicketAttendees({})
          setCurrentStep(currentStep + 1);
          setIsConfirmed(true);
        }
        // setCurrentStep(currentStep + 1);
      },
      onError: (error) => {
        console.error('❌ Booking error:', error);
        message.error(error.message || 'Booking failed');
        // setCurrentStep(currentStep + 1);
      }
    });
  }, [type, selectedTickets, UserData, number, email, name, method, event, isAmusment, eventID, agentBookingMutation, currentStep]);

  const handleUserSubmit = useCallback(async () => {
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

    try {
      const checkResult = await checkEmailMutation.mutateAsync({
        email,
        number
      });

      let user = null;

      if (checkResult?.exists) {
        if (checkResult.is_email_and_mobile_different_users) {
          message.error('This number & email is already registered');
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

            await updateUserMutation.mutateAsync({
              userId: checkResult.user.id,
              formData
            });

            user = checkResult.user;
            setCreatedUser(user);
          } else if (checkResult?.email_exists) {
            message.error('This email is already registered');
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
          return;
        }
      }

      // ✅ SINGLE CALL - Create booking with attendee IDs
      await handleBookingAfterUser(user, attendeeIdsByTicket);

    } catch (err) {
      console.error('Error in handleUserSubmit:', err);
      message.error(err.message || "An error occurred, please try again.");
    }
  }, [
    name,
    number,
    email,
    companyName,
    designation,
    photo,
    doc,
    UserData,
    isAttendeeRequire,
    selectedTickets,
    checkEmailMutation,
    createUserMutation,
    updateUserMutation,
    handleBookingAfterUser
  ]);

  const isLoading =
    corporateBookingMutation.isPending ||
    agentBookingMutation.isPending ||
    // masterBookingMutation.isPending ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;


  const attendeeStepRef = useRef(null);
  const handleButtonClick = useCallback(async (evnt, tkts) => {
    setEvent(evnt);
    setEventID(evnt?.id);
    setTickets(tkts);
    setCategoryId(evnt?.category);
    setCurrentStep(0); // Reset to step 0

    const response = await fetchCategoryData(evnt?.category);

    if (response.status) {
      const attendeeRequired = response?.categoryData?.attendy_required === 1;
      setIsAttendeeRequire(attendeeRequired);

      if (attendeeRequired) {
        setCategoryFields(response?.customFieldsData || []);
      } else {
        setCategoryFields([]);
      }
    }

    setIsAmusment(evnt?.event_type === 'amusement');
  }, [fetchCategoryData]);

  const handleDiscount = useCallback(() => {
    // If discount is blank or 0, revert to original amounts
    if (!discountValue || discountValue <= 0) {
      setDiscount(0);
      setDisableChoice(false); // Re-enable the button when discount is removed
      message.info('Discount removed');
      return;
    }

    const { subtotal } = calcTicketTotals(selectedTickets);
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
    setDiscount(finalDiscount);
    setDisableChoice(true); // Disable after first apply

    message.success('Discount applied successfully');
  }, [discountValue, discountType, selectedTickets]);

  // ✅ Updated goToNextStep with proper validation
  const goToNextStep = useCallback(() => {
    if (currentStep === 0) {
      const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);
      if (!hasValidTicket) {
        message.error('Please select at least one ticket');
        return;
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
  }, [currentStep, selectedTickets, isAttendeeRequire]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedTickets([]);
      setTicketAttendees({});
    }
  }, [currentStep]);

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

  //console.log(UserData?.id);

  return (
    <Fragment>
      <AgentBookingModal
        showPrintModel={showPrintModel}
        handleClose={() => setShowPrintModel(false)}
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
              <Col xs={24} lg={16}>
                <TicketSelectionStep
                  event={event}
                  selectedTickets={selectedTickets}
                  setSelectedTickets={setSelectedTickets}
                  getCurrencySymbol={getCurrencySymbol}
                  formatDateRange={formatDateRange}
                  onNext={goToNextStep} // ✅ Pass navigation function
                />
              </Col>
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
                    isLoading={isLoading}
                    onNext={goToNextStep} // ✅ Pass navigation function
                    onCheckout={handleBooking} // ✅ Only used for final checkout
                    isMobile={isMobile}
                    discount={discount}
                  />
                </Col>
                : <Col xs={24}>

                  <BookingSummary response={bookingResponse} setResponse={setBookingResponse} setCurrentStep={setCurrentStep} />
                </Col>
            }
          </>
        )}
      </Row>
    </Fragment>
  );
});

NewAgentBooking.displayName = 'NewAgentBooking';
export default NewAgentBooking;


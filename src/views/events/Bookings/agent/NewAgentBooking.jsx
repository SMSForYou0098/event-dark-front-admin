import { useMyContext } from 'Context/MyContextProvider';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, message, Row, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import PosEvents from '../components/PosEvents';
import AttendeesField from './AttendeesField';
import AttendeeSuggestion from './AttendeeSuggestion';
import AgentBookingModal from './AgentBookingModal';
import { processImageFile, sanitizeData, sanitizeInput } from './utils';

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
  useStoreAttendees,
  useCorporateBooking,
  useAgentBooking,
  useMasterBooking,
  buildAttendeesFormData,
} from './useAgentBookingHooks';

const { confirm: showConfirm } = Modal;


const NewAgentBooking = memo(() => {
  const {
    UserData,
    isMobile,
    getCurrencySymbol,
    formatDateRange,
    sendTickets,
    fetchCategoryData,
    formateTemplateTime,
  } = useMyContext();

  // State management
  const [eventID, setEventID] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [event, setEvent] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
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
  const [email, setEmail] = useState('');
  const [disableChoice, setDisableChoice] = useState(false);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState();
  const [bookings, setBookings] = useState([]);
  const [isAmusment, setIsAmusment] = useState(false);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const [method, setMethod] = useState('UPI');
  const [tickets, setTickets] = useState([]);
  const [isAttendeeRequire, setIsAttendeeRequire] = useState(false);
  const [categoryFields, setCategoryFields] = useState([]);
  const [ticketAttendees, setTicketAttendees] = useState({}); // Local attendees (before saving)
  const [savedAttendeeIds, setSavedAttendeeIds] = useState({}); // ✅ NEW: Store saved attendee IDs by ticket
  const [currentTicketId, setCurrentTicketId] = useState(null);
  const [showAttendeeFieldModal, setShowAttendeeFieldModal] = useState(false);
  const [editingAttendeeIndex, setEditingAttendeeIndex] = useState(null);
  const [editingAttendeeData, setEditingAttendeeData] = useState({});
  const [showAttendeeSuggestion, setShowAttendeeSuggestion] = useState(false);
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
  const [normalBookings, setNormalBookings] = useState([]);
  const [masterBookings, setMasterBookings] = useState([]);
  const [mainBookings, setMainBookings] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Computed values
  const allAttendees = useMemo(() => {
    return Object.values(ticketAttendees).flat();
  }, [ticketAttendees]);

  const bookingStats = useMemo(
    () => ({
      total: bookings?.allbookings?.length ?? 0,
      amount: (parseInt(bookings?.amount) ?? 0).toFixed(2),
      discount: (parseInt(bookings?.discount) ?? 0).toFixed(2),
    }),
    [bookings]
  );

  const stats = [
    {
      title: 'Bookings',
      value: bookingStats.total,
    },
    {
      title: 'Amount',
      value: bookingStats.amount,
      prefix: '₹',
      valueStyle: { color: 'var(--primary-color)' },
    },
    {
      title: 'Discount',
      value: bookingStats.discount,
      prefix: '₹',
      valueStyle: { color: '#1890ff' },
    },
  ];

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
    onSuccess: (response) => {
      if (response.status && response.user) {
        message.success('User updated successfully!');
      }
    },
    onError: (error) => {
      console.error('Update user error:', error);
      message.error(error.message || 'Failed to update user');
    },
  });

  // ✅ Update storeAttendeesMutation to save attendee IDs
  const storeAttendeesMutation = useStoreAttendees({
    onSuccess: (response) => {
      if (response.status && response.data) {
        
        // ✅ Map saved attendees to their ticket IDs
        const attendeeIdsByTicket = {};
        
        // response.data is array of saved attendees with their IDs
        response.data.forEach((savedAttendee) => {
          // Find which ticket this attendee belongs to
          Object.entries(ticketAttendees).forEach(([ticketId, attendees]) => {
            const matchingAttendee = attendees.find(att => 
              att.Mo === savedAttendee.Mo || att.Name === savedAttendee.Name
            );
            
            if (matchingAttendee) {
              if (!attendeeIdsByTicket[ticketId]) {
                attendeeIdsByTicket[ticketId] = [];
              }
              attendeeIdsByTicket[ticketId].push(savedAttendee.id);
            }
          });
        });

        setSavedAttendeeIds(attendeeIdsByTicket);
        
        message.success('Attendees saved successfully!');
        
        // ✅ Don't show print modal yet, wait for booking
        if (isCorporate) {
          handleCorporateBooking(response.data);
        } else {
          setShowPrintModel(true);
        }
      }
    },
    onError: (error) => {
      console.error('Store attendees error:', error);
      message.error(error.message || 'Failed to store attendees');
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

  const agentBookingMutation = useAgentBooking({
    onSuccess: (response) => {
      if (response.status && response.bookings) {
        const bookings = response.bookings;
        setNormalBookings((prev) => [...prev, ...bookings]);

        message.success('Booking created successfully!');
        setIsConfirmed(true);

        if (bookings.length > 1) {
          handleMasterBooking(bookings, response.session_id);
        } else {
          setShowPrintModel(true);
        }
      }
    },
    onError: (error) => {
      console.error('Booking error:', error);
      message.error(error.message || error.server?.error || 'Failed to create booking');
    },
  });

  const masterBookingMutation = useMasterBooking({
    onSuccess: (response) => {
      if (response.status && response.booking) {
        const master = response.booking;
        setMasterBookings((prev) => [...prev, master]);
        setShowPrintModel(true);
        message.success('Master booking created successfully!');
      }
    },
    onError: (error) => {
      console.error('Master booking error:', error);
      message.error(error.message || 'Failed to create master booking');
    },
  });

  // Handlers
  const handleCorporateBooking = useCallback((savedAttendees) => {
    const attendee = savedAttendees[0];
    const ticket = selectedTickets[0];

    const payload = {
      user_id: UserData.id,
      number: attendee?.Mo?.toString() || '',
      name: attendee?.Name || '',
      attendee_id: attendee.id || '',
      tickets: [
        {
          category: ticket.category,
          quantity: ticket.quantity,
          price: ticket.price,
          id: ticket.id,
        },
      ],
      discount: 0,
      amount: (ticket.price * ticket.quantity).toFixed(2),
    };

    corporateBookingMutation.mutate(payload);
  }, [UserData, selectedTickets, corporateBookingMutation]);

  const handleMasterBooking = useCallback((bookings, sessionId) => {
    const bookingIds = bookings.map(booking => booking?.id);
    const masterUrl = `agent-master-booking/${createdUser?.id}`;

    const payload = {
      agent_id: UserData?.id,
      user_id: createdUser?.id,
      amount: grandTotal,
      payment_method: method,
      session_id: sessionId || null,
      bookingIds
    };

    masterBookingMutation.mutate({ url: masterUrl, payload });
  }, [createdUser, UserData, grandTotal, method, masterBookingMutation]);

  const getAttendeeCountForTicket = useCallback((ticketId) => {
    return ticketAttendees[ticketId]?.length || 0;
  }, [ticketAttendees]);

  const getRequiredAttendeeCountForTicket = useCallback((ticketId) => {
    const ticket = selectedTickets.find(t => t.id === ticketId);
    return ticket ? Number(ticket.quantity) : 0;
  }, [selectedTickets]);

  const validateTicketAttendees = useCallback(() => {
    for (const ticket of selectedTickets) {
      if (Number(ticket.quantity) > 0) {
        const requiredCount = Number(ticket.quantity);
        const currentCount = getAttendeeCountForTicket(ticket.id);

        if (currentCount !== requiredCount) {
          return {
            valid: false,
            message: `Ticket "${ticket.category || ticket.name || 'Unknown'}" requires ${requiredCount} attendee(s), but only ${currentCount} added`
          };
        }
      }
    }
    return { valid: true };
  }, [selectedTickets, getAttendeeCountForTicket]);

  const handleSaveAttendees = useCallback(() => {
    const validation = validateTicketAttendees();

    if (!validation.valid) {
      message.error(validation.message);
      return;
    }

    const totalAttendees = allAttendees.length;

    if (totalAttendees === 0) {
      message.warning('Please add at least one attendee');
      return;
    }

    showConfirm({
      title: 'Are you sure?',
      icon: <ExclamationCircleOutlined />,
      content: "You won't be able to revert this!",
      okText: 'Yes, Save it!',
      cancelText: 'No, cancel!',
      onOk: () => {
        const sanitizedAttendees = sanitizeData(allAttendees);

        // Check for duplicates
        const phoneSet = new Set();
        for (let i = 0; i < sanitizedAttendees.length; i++) {
          const phone = sanitizedAttendees[i]?.Mo?.toString().trim();
          if (phone && phoneSet.has(phone)) {
            message.error(`Duplicate phone number found in attendee #${i + 1}`);
            return;
          }
          if (phone) {
            phoneSet.add(phone);
          }
        }

        // ✅ Use helper to build FormData
        const formData = buildAttendeesFormData({
          attendees: sanitizedAttendees,
          userMeta: {
            user_id: UserData?.id,
            user_name: sanitizeInput(UserData?.name),
            event_name: sanitizeInput(event?.name),
            isAgentBooking: true
          },
          fieldGroupName: isCorporate ? 'corporateUser' : 'attendees'
        });

        storeAttendeesMutation.mutate({ formData, isCorporate });
      },
    });
  }, [allAttendees, validateTicketAttendees, isCorporate, UserData, event, storeAttendeesMutation]);

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
      const ticketId = ticket.id.toString(); // ✅ Ensure string for comparison
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
        attendee_ids: attendeeIds // ✅ Should contain IDs like [6, 7]
      };
    });

    const bookingPayload = {
      agent_id: UserData?.id,
      user_id: user?.id, // ✅ Make sure user_id is always included
      number: user?.number || number,
      email: user?.email || email,
      name: user?.name || name,
      payment_method: method,
      base_amount: subtotal,
      amount: grandTotal,
      discount: discount,
      type: event?.event_type || 'daily',
      tickets: ticketsPayload
    };

    const url = isAmusment ? `amusement-agent-book-ticket/${eventID}` : `booking/agent/${eventID}`;

    // ✅ Call booking API ONLY ONCE
    agentBookingMutation.mutate({ 
      url, 
      payload: bookingPayload
    }, {
      onSuccess: (response) => {
        message.success('Booking created successfully!');
        
        // Reset form
        setTicketAttendees({});
        setSavedAttendeeIds({});
        setSelectedTickets([]);
        // Don't set showPrintModel here, let the mutation success handler do it
      },
      onError: (error) => {
        console.error('❌ Booking error:', error);
        message.error(error.message || 'Booking failed');
      }
    });
  }, [
    selectedTickets,
    UserData, 
    number,
    email,
    name,
    method, 
    subtotal, 
    grandTotal, 
    discount, 
    event,
    isAmusment,
    eventID,
    agentBookingMutation
  ]);
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
      const validation = validateTicketAttendees();
      if (!validation.valid) {
        message.error(validation.message);
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

            user = checkResult.user; // ✅ Set user here
            setCreatedUser(user);
            // ❌ REMOVE: handleBookingAfterUser(checkResult.user); // This was causing first call without attendees
          } else if (checkResult?.email_exists) {
            message.error('This email is already registered');
            return; // ✅ Add return to prevent further execution
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
          user = result.user; // ✅ Set user here
          setCreatedUser(user);
          // ❌ REMOVE: handleBookingAfterUser(result.user); // This was also causing issues
        }
      }

      // ✅ Only proceed if user exists
      if (!user) {
        message.error('Failed to create or retrieve user');
        return;
      }

      // ✅ Collect attendee IDs (all attendees already have IDs from AttendeesField API call)

      const attendeeIdsByTicket = {};

      Object.entries(ticketAttendees).forEach(([ticketId, attendees]) => {
        
        const ids = attendees
          .map(att => {
            return att.id;
          })
          .filter(id => id !== undefined && id !== null);

        attendeeIdsByTicket[ticketId] = ids;
      });


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
    ticketAttendees,
    validateTicketAttendees,
    checkEmailMutation, 
    createUserMutation, 
    updateUserMutation,
    handleBookingAfterUser // ✅ Keep this dependency
  ]);



  const getTicketPrice = (category) => {
    let ticket = event?.tickets?.find((item) => item.name === category);
    return ticket?.price;
  };

  const handleSendMail = async (data) => {
    if (data?.length > 0) {
      const Booking = data?.map((item) => {
        const number = item?.number ?? item?.bookings?.[0]?.number ?? 'Unknown';
        const email = item?.email ?? item?.bookings?.[0]?.email ?? 'Unknown';
        const thumbnail = item?.ticket?.event?.thumbnail ?? item?.bookings?.[0]?.ticket?.event?.thumbnail ?? 'https://smsforyou.biz/ticketcopy.jpg';
        const name = item?.user?.name ?? item?.bookings?.[0]?.user?.name ?? 'Guest';
        const qty = item?.bookings?.length ?? 1;
        const category = item?.ticket?.name ?? item?.bookings?.[0]?.ticket?.name ?? 'General';
        const eventName = item?.ticket?.event?.name ?? item?.bookings?.[0]?.ticket?.event?.name ?? 'Event';
        const eventDate = item?.ticket?.event?.date_range ?? item?.bookings?.[0]?.ticket?.event?.date_range ?? 'TBD';
        const eventTime = item?.ticket?.event?.start_time ?? item?.bookings?.[0]?.ticket?.event?.start_time ?? 'TBD';
        const address = item?.ticket?.event?.address ?? item?.bookings?.[0]?.ticket?.event?.address ?? 'No Address Provided';
        const location = address.replace(/,/g, '|');
        const DateTime = formateTemplateTime(eventDate, eventTime);

        return {
          email,
          number,
          thumbnail,
          category,
          qty,
          name,
          price: (getTicketPrice(category) * qty)?.toFixed(2),
          eventName,
          eventDate,
          eventTime,
          DateTime,
          address,
          location,
          convenience_fee: totalTax,
          total: grandTotal
        };
      });

      if (Booking?.length > 0) {
        let template = isAmusment ? 'Amusement Booking' : 'Booking Confirmation';
        sendTickets(Booking, 'new', false, template);
      }
    }
  };

  const isLoading = storeAttendeesMutation.isPending ||
    corporateBookingMutation.isPending ||
    agentBookingMutation.isPending ||
    masterBookingMutation.isPending ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;

  useEffect(() => {
    if (selectedTickets?.length > 0) {
      const totalSubtotal = selectedTickets.reduce((acc, ticket) => {
        const ticketPrice = Number(ticket?.price) || 0;
        const ticketQuantity = Number(ticket?.quantity) || 0;
        return acc + (ticketPrice * ticketQuantity);
      }, 0);

      setSubTotal(+totalSubtotal.toFixed(2));
    } else {
      setSubTotal(0);
    }
  }, [selectedTickets]);

  useEffect(() => {
    if (selectedTickets?.length > 0) {
      // here is console of selected tickets [
//     {
//       "id": 2,
//       "category": "dummy",
//       "quantity": 1,
//       "price": 20,
//       "baseAmount": 20,
//       "centralGST": 1.8,
//       "stateGST": 1.8,
//       "totalTax": 3.6,
//       "convenienceFee": 0.2,
//       "finalAmount": 23.8
//   },
//   {
//       "id": 3,
//       "category": "34",
//       "quantity": 1,
//       "price": 34,
//       "baseAmount": 34,
//       "centralGST": 3.06,
//       "stateGST": 3.06,
//       "totalTax": 6.12,
//       "convenienceFee": 0.34,
//       "finalAmount": 40.46
//   }
// ]  update the calculation of the total amount
      console.log(selectedTickets);
      //here i think we need to add the convenience fee to the total amount
      const totalConvenienceFee = selectedTickets.reduce((acc, ticket) => acc + (ticket.convenienceFee * ticket.quantity), 0);
      const totalBaseAmount = selectedTickets.reduce((acc, ticket) => acc + (ticket.baseAmount * ticket.quantity), 0);
      const totalCentralGST = selectedTickets.reduce((acc, ticket) => acc + (ticket.centralGST * ticket.quantity), 0);
      const totalStateGST = selectedTickets.reduce((acc, ticket) => acc + (ticket.stateGST * ticket.quantity), 0);
      const totalTax = totalCentralGST + totalStateGST;
      const totalAmount = subtotal + totalTax + totalConvenienceFee;

      setBaseAmount(+totalBaseAmount.toFixed(2));
      setCentralGST(+totalCentralGST.toFixed(2));
      setStateGST(+totalStateGST.toFixed(2));
      setTotalTax(+totalTax.toFixed(2));

      const grandTotal = totalAmount - discount;
      setGrandTotal(+grandTotal.toFixed(2));
    } else {
      setBaseAmount(0);
      setCentralGST(0);
      setStateGST(0);
      setTotalTax(0);
      setGrandTotal(0);
    }
  }, [selectedTickets, discount, subtotal]);

  useEffect(() => {
    const validTicketIds = selectedTickets
      .filter(t => Number(t.quantity) > 0)
      .map(t => t.id);

    const newTicketAttendees = {};
    validTicketIds.forEach(ticketId => {
      if (ticketAttendees[ticketId]) {
        const ticket = selectedTickets.find(t => t.id === ticketId);
        const maxCount = Number(ticket.quantity);
        newTicketAttendees[ticketId] = ticketAttendees[ticketId].slice(0, maxCount);
      }
    });

    setTicketAttendees(newTicketAttendees);
  }, [selectedTickets]);

  useEffect(() => {
    if (masterBookings.length > 0 || normalBookings.length > 0) {
      const masterBookingIds = masterBookings.flatMap((data) => data?.booking_id);
      const filteredNormalBookings = normalBookings.filter(
        (booking) => !masterBookingIds.includes(booking?.id)
      );
      const combinedBookings = [...masterBookings, ...filteredNormalBookings];
      setMainBookings(combinedBookings);
    }
  }, [masterBookings, normalBookings]);

  useEffect(() => {
    if (mainBookings?.length > 0) {
      handleSendMail(mainBookings);
    }
  }, [mainBookings]);


  const handleButtonClick = useCallback(async (evnt, tkts) => {
    setEvent(evnt);
    setEventID(evnt?.id);
    setTickets(tkts);
    setTicketAttendees({});
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



  // ✅ Add missing handleOpenAttendeeModal function
  const handleOpenAttendeeModal = useCallback((ticketId) => {
    setCurrentTicketId(ticketId);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setShowAttendeeFieldModal(true);
  }, []);

  const handleCloseAttendeeModal = useCallback(() => {
    setShowAttendeeFieldModal(false);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setCurrentTicketId(null);
  }, []);

  // ✅ Get all selected attendee IDs across all tickets
  const getAllSelectedAttendeeIds = useCallback(() => {
    const allIds = [];
    Object.values(ticketAttendees).forEach(attendees => {
      attendees.forEach(att => {
        if (att.id) {
          allIds.push(att.id);
        }
      });
    });
    return allIds;
  }, [ticketAttendees]);

  const handleAttendeeSave = useCallback((attendeeData, editingIndex) => {
    const currentTicketAttendees = ticketAttendees[currentTicketId] || [];
    
    if (editingIndex !== null) {
      // ✅ Update existing attendee
      const updatedAttendees = [...currentTicketAttendees];
      updatedAttendees[editingIndex] = {
        ...attendeeData,
        ...(attendeeData.id && { id: attendeeData.id }), // Keep existing ID if present
        isNew: !attendeeData.id, // ✅ Mark as new if no ID
        isEdited: true
      };
      
      setTicketAttendees(prev => ({
        ...prev,
        [currentTicketId]: updatedAttendees
      }));
      
      message.success('Attendee updated successfully');
    } else {
      // ✅ Add new attendee (no id, needs to be saved)
      const requiredCount = getRequiredAttendeeCountForTicket(currentTicketId);
      
      if (currentTicketAttendees.length >= requiredCount) {
        message.warning(`Maximum ${requiredCount} attendees allowed for this ticket`);
        return;
      }

      setTicketAttendees(prev => ({
        ...prev,
        [currentTicketId]: [...currentTicketAttendees, {
          ...attendeeData,
          isNew: true, // ✅ Mark as new (needs to be saved)
          needsSaving: true // ✅ Flag for API call
        }]
      }));
      
      message.success('Attendee added successfully');
    }
    
    handleCloseAttendeeModal();
  }, [currentTicketId, ticketAttendees, getRequiredAttendeeCountForTicket, handleCloseAttendeeModal]);

  const handleSelectAttendee = useCallback((attendee) => {
    const currentTicketAttendees = ticketAttendees[currentTicketId] || [];
    const requiredCount = getRequiredAttendeeCountForTicket(currentTicketId);

    if (currentTicketAttendees.length >= requiredCount) {
      message.warning(`Maximum ${requiredCount} attendees allowed for this ticket`);
      return;
    }

    // ✅ Check if attendee is already used in ANY ticket
    const allSelectedIds = getAllSelectedAttendeeIds();
    if (allSelectedIds.includes(attendee.id)) {
      message.warning('This attendee is already added to another ticket');
      return;
    }

    // ✅ Add existing attendee (already has ID, no need to save)
    setTicketAttendees(prev => ({
      ...prev,
      [currentTicketId]: [...currentTicketAttendees, {
        id: attendee.id, // ✅ Already has ID
        Name: attendee.Name,
        Mo: attendee.Mo,
        Photo: attendee.Photo,
        Company_Name: attendee.Company_Name,
        isExisting: true, // ✅ Mark as existing
        needsSaving: false // ✅ No need to save
      }]
    }));

    message.success('Attendee added successfully');
    setShowAttendeeSuggestion(false);
  }, [currentTicketId, ticketAttendees, getRequiredAttendeeCountForTicket, getAllSelectedAttendeeIds]);

  // ✅ Pass all selected IDs to AttendeeSuggestion modal
  const handleShowSuggestions = useCallback((ticketId) => {
    setCurrentTicketId(ticketId);
    setShowAttendeeSuggestion(true);
  }, []);

  const handleRemoveAttendee = useCallback((ticketId, index) => {
    const currentTicketAttendees = ticketAttendees[ticketId] || [];
    const updated = currentTicketAttendees.filter((_, i) => i !== index);

    setTicketAttendees(prev => ({
      ...prev,
      [ticketId]: updated
    }));

    message.success('Attendee removed');
  }, [ticketAttendees]);

  const handleEditAttendee = useCallback((ticketId, index) => {
    const currentTicketAttendees = ticketAttendees[ticketId] || [];
    setCurrentTicketId(ticketId);
    setEditingAttendeeIndex(index);
    setEditingAttendeeData(currentTicketAttendees[index]);
    setShowAttendeeFieldModal(true);
  }, [ticketAttendees]);

  const handleDiscount = useCallback(() => {
    if (!discountValue || discountValue <= 0) {
      message.warning('Please enter a valid discount value');
      return;
    }

    let calculatedDiscount = 0;

    if (discountType === 'percentage') {
      if (discountValue > 100) {
        message.error('Percentage cannot be more than 100%');
        return;
      }
      calculatedDiscount = (subtotal * discountValue) / 100;
    } else {
      if (discountValue > subtotal) {
        message.error('Discount cannot be more than subtotal');
        return;
      }
      calculatedDiscount = discountValue;
    }

    setDiscount(+calculatedDiscount.toFixed(2));
    setDisableChoice(true);
    message.success('Discount applied successfully');
  }, [discountValue, discountType, subtotal]);

  // ✅ Updated goToNextStep with proper validation
  const goToNextStep = useCallback(() => {
    if (currentStep === 0) {
      // ✅ Step 0 → Step 1: Validate tickets are selected
      const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);
      
      if (!hasValidTicket) {
        message.error('Please select at least one ticket');
        return;
      }

      // ✅ Move to next step based on attendee requirement
      if (isAttendeeRequire) {
        setCurrentStep(1); // Go to attendee management
      } else {
        // No attendees required, show checkout modal directly
        setShowPrintModel(true);
      }
    } else if (currentStep === 1) {
      // ✅ Step 1 → Step 2: Validate attendees
      if (isAttendeeRequire) {
        const validation = validateTicketAttendees();
        if (!validation.valid) {
          message.error(validation.message);
          return;
        }
      }
      
      // Show checkout modal
      setShowPrintModel(true);
    }
  }, [currentStep, selectedTickets, isAttendeeRequire, validateTicketAttendees]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  return (
    <Fragment>
      <AgentBookingModal
        showPrintModel={showPrintModel}
        handleClose={() => setShowPrintModel(false)}
        confirm={isConfirmed}
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
            handleCloseModal={() => {
              setShowAttendeeSuggestion(false);
              setCurrentTicketId(null);
            }}
            attendees={existingAttendees}
            onSelectAttendee={handleSelectAttendee}
            selectedAttendeeIds={getAllSelectedAttendeeIds()} // ✅ Pass ALL selected IDs
          />
        </>
      )}

      <Row gutter={[16]}>
        <Col span={24}>
          <PosEvents handleButtonClick={handleButtonClick} />
        </Col>

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
                  setSubTotal={setSubTotal}
                  setBaseAmount={setBaseAmount}
                  setCentralGST={setCentralGST}
                  setStateGST={setStateGST}
                  setTotalTax={setTotalTax}
                  setGrandTotal={setGrandTotal}
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
                  selectedTickets={selectedTickets}
                  ticketAttendees={ticketAttendees}
                  categoryFields={categoryFields}
                  existingAttendees={existingAttendees}
                  eventID={eventID}
                  getAttendeeCountForTicket={getAttendeeCountForTicket}
                  handleOpenAttendeeModal={handleOpenAttendeeModal}
                  handleShowSuggestions={handleShowSuggestions}
                  handleRemoveAttendee={handleRemoveAttendee}
                  handleEditAttendee={handleEditAttendee}
                  onNext={goToNextStep} // ✅ Pass navigation function
                  onBack={goToPreviousStep}
                />
              </Col>
            )}

            {/* Right Sidebar - Order Summary */}
            <Col xs={24} lg={8}>
              <OrderSummary
                stats={stats}
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
                subtotal={subtotal}
                discount={discount}
                baseAmount={baseAmount}
                centralGST={centralGST}
                totalTax={totalTax}
                grandTotal={grandTotal}
              />
            </Col>
          </>
        )}
      </Row>
    </Fragment>
  );
});

NewAgentBooking.displayName = 'NewAgentBooking';
export default NewAgentBooking;


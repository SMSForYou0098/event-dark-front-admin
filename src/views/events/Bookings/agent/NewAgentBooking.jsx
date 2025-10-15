import { useMyContext } from 'Context/MyContextProvider';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, message, Row, Space, Statistic, Typography, Modal, Divider } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import PosEvents from '../components/PosEvents';
import BookingTickets from '../components/BookingTickets';
import Flex from 'components/shared-components/Flex';
import OrderCalculation from '../components/OrderCalculation';
import DiscoutFIeldGroup from '../components/DiscoutFIeldGroup';
import StickyLayout from 'utils/MobileStickyBottom.jsx/StickyLayout';
import { ArrowRightOutlined, CalendarOutlined, UserAddOutlined, TeamOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import AttendeesField from './AttendeesField';
import AttendeeSuggestion from './AttendeeSuggestion';
import SelectedAttendees from './SelectedAttendees';
import AgentBookingModal from './AgentBookingModal';
import { processImageFile, sanitizeData, sanitizeInput } from './utils';

const { Title, Text } = Typography;
const { confirm: showConfirm } = Modal;

// Utility function to sanitize input


const NewAgentBooking = memo(() => {
  const {
    UserData,
    isMobile,
    getCurrencySymbol,
    fetchCategoryData,
    formatDateRange,
    sendTickets,
    formateTemplateTime
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

  // ✅ NEW: Ticket-based attendee management
  const [ticketAttendees, setTicketAttendees] = useState({});
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
  const [currentStep, setCurrentStep] = useState(0); // Add step state

  // ✅ Computed: Get all attendees as flat array
  const allAttendees = useMemo(() => {
    return Object.values(ticketAttendees).flat();
  }, [ticketAttendees]);

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

  // Mutation for checking email
  const checkEmailMutation = useMutation({
    mutationFn: async ({ email, number }) => {
      const response = await api.post('chek-email', {
        email,
        number
      });
      return response;
    }
  });

  // Mutation for creating user
  const createUserMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('create-user', formData);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to create user');
      }

      return response;
    },
    onSuccess: (response) => {
      if (response.status && response.user) {
        setCreatedUser(response.user);
        message.success('User created successfully!');
      }
    },
    onError: (error) => {
      console.error('Create user error:', error);
      message.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, formData }) => {
      const response = await api.post(`update-user/${userId}`, formData);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to update user');
      }

      return response;
    }
  });

  // Mutation for storing attendees
  const storeAttendeesMutation = useMutation({
    mutationFn: async (formData) => {
      const endpoint = isCorporate ? 'corporate-user-store' : 'attndy-store';

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await api.post(endpoint, formData, config);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to store attendees');
      }

      return response;
    },
    onSuccess: (response) => {
      if (response.status && response.data) {
        message.success('Attendees saved successfully!');

        if (isCorporate) {
          handleCorporateBooking(response.data);
        } else {
          setShowPrintModel(true);
        }
      }
    },
    onError: (error) => {
      console.error('Store attendees error:', error);
      message.error(error.response?.data?.message || 'Failed to store attendees');
    },
  });

  // Mutation for corporate booking
  const corporateBookingMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('corporate-pos/true', payload);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to create corporate booking');
      }

      return response;
    },
    onSuccess: (response) => {
      if (response.status && response.bookings) {
        message.success('Ticket purchased successfully!');

        const { bookings } = response;
        const corporateUser = bookings.corporate_user;
        const data = bookings;

        setSelectedTickets(null);

        setStickerData({
          ...corporateUser
        });

        setPrintInvoiceData({
          event: data?.ticket?.event,
          bookingData: {
            token: data?.token,
            created_at: data?.created_at,
            quantity: data?.quantity,
            payment_method: data?.payment_method,
            ticket: {
              name: data?.ticket?.name,
              price: data?.ticket?.price
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
      message.error(error.response?.data?.message || 'Failed to process corporate ticket purchase');
    },
  });

  // Mutation for agent booking
  const agentBookingMutation = useMutation({
    mutationFn: async ({ url, formData }) => {
      const response = await api.post(url, formData);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to create booking');
      }

      return response;
    },
    onSuccess: (response) => {
      if (response.status && response.bookings) {
        setBookingHistory(response.bookings);
        const bookings = response.bookings;
        setNormalBookings(prev => [...prev, ...bookings]);

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
      message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to create booking');
    },
  });

  // Mutation for master booking
  const masterBookingMutation = useMutation({
    mutationFn: async ({ url, payload }) => {
      const response = await api.post(url, payload);

      if (!response.status) {
        throw new Error(response?.message || 'Failed to create master booking');
      }

      return response;
    },
    onSuccess: (response) => {
      if (response.status && response.booking) {
        const master = response.booking;
        setMasterBookings(prev => [...prev, master]);
        setShowPrintModel(true);
        message.success('Master booking created successfully!');
      }
    },
    onError: (error) => {
      console.error('Master booking error:', error);
      message.error(error.response?.data?.message || 'Failed to create master booking');
    }
  });

  // Handle corporate booking after attendees are saved
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

  // Handle master booking
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

  // ✅ NEW: Get attendee count for specific ticket
  const getAttendeeCountForTicket = useCallback((ticketId) => {
    return ticketAttendees[ticketId]?.length || 0;
  }, [ticketAttendees]);

  // ✅ NEW: Get required attendee count for ticket
  const getRequiredAttendeeCountForTicket = useCallback((ticketId) => {
    const ticket = selectedTickets.find(t => t.id === ticketId);
    return ticket ? Number(ticket.quantity) : 0;
  }, [selectedTickets]);

  // ✅ NEW: Validate all tickets have required attendees
  const validateTicketAttendees = useCallback(() => {
    for (const ticket of selectedTickets) {
      if (Number(ticket.quantity) > 0) {
        const requiredCount = Number(ticket.quantity);
        const currentCount = getAttendeeCountForTicket(ticket.id);

        if (currentCount !== requiredCount) {
          return {
            valid: false,
            message: `Ticket "${ticket.name}" requires ${requiredCount} attendee(s), but only ${currentCount} added`
          };
        }
      }
    }
    return { valid: true };
  }, [selectedTickets, getAttendeeCountForTicket]);

  // ✅ UPDATED: Handle save attendees with ticket validation
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
        // ✅ Sanitize attendee data (removes system fields)
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

        // Create FormData
        const formData = new FormData();
        const fieldGroupName = isCorporate ? 'corporateUser' : 'attendees';

        sanitizedAttendees.forEach((attendee, index) => {
          Object.keys(attendee).forEach((fieldKey) => {
            const fieldValue = attendee[fieldKey];

            // Handle file fields
            if (typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
              const arr = fieldValue.split(',');
              const mime = arr[0].match(/:(.*?);/)[1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: mime });
              const file = new File([blob], `${fieldKey}_${index}.${mime.split('/')[1]}`, { type: mime });
              formData.append(`${fieldGroupName}[${index}][${fieldKey}]`, file);
            } else if (fieldValue instanceof File) {
              formData.append(`${fieldGroupName}[${index}][${fieldKey}]`, fieldValue);
            } else {
              formData.append(`${fieldGroupName}[${index}][${fieldKey}]`, sanitizeInput(fieldValue));
            }
          });
        });

        // Append metadata
        formData.append('user_id', UserData?.id);
        formData.append('user_name', sanitizeInput(UserData?.name));
        formData.append('event_name', sanitizeInput(event?.name));
        formData.append('isAgentBooking', true);

        storeAttendeesMutation.mutate(formData);
      },
    });
  }, [allAttendees, validateTicketAttendees, isCorporate, UserData, event, storeAttendeesMutation]);

  // Handle user submission from modal
  const handleUserSubmit = useCallback(async () => {
    if (!name) {
      message.error("Name is required");
      return;
    }

    if (!number) {
      message.error("Mobile number is required");
      return;
    }

    try {
      const checkResult = await checkEmailMutation.mutateAsync({
        email,
        number
      });

      if (checkResult?.exists) {
        if (checkResult.is_email_and_mobile_different_users) {
          message.error('This number & email is already registered');
          return false;
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

            setCreatedUser(checkResult.user);
            handleBookingAfterUser(checkResult.user);
          } else if (checkResult?.email_exists) {
            message.error('This email is already registered');
          }
        }
      } else {
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
          setCreatedUser(result.user);
          handleBookingAfterUser(result.user);
        }
      }
    } catch (err) {
      console.error(err);
      message.error("An error occurred, please try again.");
    }
  }, [name, number, email, companyName, designation, photo, doc, UserData, checkEmailMutation, createUserMutation, updateUserMutation]);

  // Handle booking after user is created/updated
  const handleBookingAfterUser = useCallback((user) => {
    const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);

    if (!hasValidTicket) {
      message.error('Please select at least one ticket');
      return;
    }

    const url = isAmusment ? `amusement-agent-book-ticket/${eventID}` : `agent-book-ticket/${eventID}`;

    const formData = new FormData();

    // ✅ Add attendees with clean data
    allAttendees?.forEach((attendee, index) => {
      // Clean attendee object
      const cleanAttendee = {};
      Object.keys(attendee).forEach(key => {
        if (!['id', 'created_at', 'updated_at', 'deleted_at', 'status',
          'booking_id', 'user_id', 'agent_id', 'token', 'ticketId'].includes(key)) {
          cleanAttendee[key] = attendee[key];
        }
      });

      Object.entries(cleanAttendee).forEach(([fieldKey, fieldValue]) => {
        formData.append(`attendees[${index}][${fieldKey}]`, fieldValue);
      });
    });

    const requestData = {
      agent_id: UserData?.id,
      user_id: user?.id,
      number: user?.number,
      email: user?.email,
      base_amount: subtotal,
      type: event?.event_type,
      name: user?.name,
      payment_method: method,
      amount: grandTotal,
      discount: discount,
    };

    Object.entries(requestData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    selectedTickets?.forEach((ticket, index) => {
      Object.entries(ticket).forEach(([ticketKey, ticketValue]) => {
        formData.append(`tickets[${index}][${ticketKey}]`, ticketValue);
      });
    });

    agentBookingMutation.mutate({ url, formData });
  }, [selectedTickets, UserData, subtotal, event, method, grandTotal, discount, allAttendees, isAmusment, eventID, agentBookingMutation]);

  // Handle send email
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

  const getTicketPrice = (category) => {
    let ticket = event?.tickets?.find((item) => item.name === category);
    return ticket?.price;
  };

    const isLoading = storeAttendeesMutation.isPending ||
    corporateBookingMutation.isPending ||
    agentBookingMutation.isPending ||
    masterBookingMutation.isPending ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;

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

  // ✅ UPDATED: Handle attendee save with ticket association
  const handleAttendeeSave = useCallback((attendeeData, editingIndex) => {
    if (!currentTicketId) {
      message.error('Please select a ticket first');
      return;
    }

    const currentTicketAttendees = ticketAttendees[currentTicketId] || [];
    const requiredCount = getRequiredAttendeeCountForTicket(currentTicketId);

    if (editingIndex !== null) {
      // Update existing attendee
      const updated = [...currentTicketAttendees];
      updated[editingIndex] = {
        ...attendeeData,
        ticketId: currentTicketId
      };
      setTicketAttendees(prev => ({
        ...prev,
        [currentTicketId]: updated
      }));
      message.success('Attendee updated successfully');
    } else {
      // Check if we can add more attendees
      if (currentTicketAttendees.length >= requiredCount) {
        message.warning(`Maximum ${requiredCount} attendee(s) allowed for this ticket`);
        return;
      }

      // Add new attendee
      const newAttendee = {
        ...attendeeData,
        ticketId: currentTicketId
      };
      setTicketAttendees(prev => ({
        ...prev,
        [currentTicketId]: [...currentTicketAttendees, newAttendee]
      }));
      message.success('Attendee added successfully');
    }

    setShowAttendeeFieldModal(false);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setCurrentTicketId(null);
  }, [currentTicketId, ticketAttendees, getRequiredAttendeeCountForTicket]);

  // ✅ UPDATED: Handle select attendee from suggestions with ticket association
  const handleSelectAttendee = useCallback((attendee) => {
    if (!currentTicketId) {
      message.error('Please select a ticket first');
      return;
    }

    const currentTicketAttendees = ticketAttendees[currentTicketId] || [];
    const requiredCount = getRequiredAttendeeCountForTicket(currentTicketId);

    if (currentTicketAttendees.length >= requiredCount) {
      message.warning(`Maximum ${requiredCount} attendee(s) allowed for this ticket`);
      return;
    }

    const isAlreadySelected = currentTicketAttendees.some(a => a.id === attendee.id);

    if (isAlreadySelected) {
      message.warning('This attendee is already selected for this ticket');
      return;
    }

    const newAttendee = {
      ...attendee,
      ticketId: currentTicketId
    };

    setTicketAttendees(prev => ({
      ...prev,
      [currentTicketId]: [...currentTicketAttendees, newAttendee]
    }));

    message.success('Attendee added successfully');
  }, [currentTicketId, ticketAttendees, getRequiredAttendeeCountForTicket]);

  // ✅ UPDATED: Handle remove attendee with ticket association
  const handleRemoveAttendee = useCallback((ticketId, index) => {
    const currentTicketAttendees = ticketAttendees[ticketId] || [];
    const updated = currentTicketAttendees.filter((_, i) => i !== index);

    setTicketAttendees(prev => ({
      ...prev,
      [ticketId]: updated
    }));

    message.success('Attendee removed');
  }, [ticketAttendees]);

  // ✅ UPDATED: Handle edit attendee with ticket association
  const handleEditAttendee = useCallback((ticketId, index) => {
    const currentTicketAttendees = ticketAttendees[ticketId] || [];
    setCurrentTicketId(ticketId);
    setEditingAttendeeIndex(index);
    setEditingAttendeeData(currentTicketAttendees[index]);
    setShowAttendeeFieldModal(true);
  }, [ticketAttendees]);

  // ✅ UPDATED: Handle attendee modal open
  const handleOpenAttendeeModal = useCallback((ticketId) => {
    setCurrentTicketId(ticketId);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setShowAttendeeFieldModal(true);
  }, []);

  // Handle attendee modal close
  const handleCloseAttendeeModal = useCallback(() => {
    setShowAttendeeFieldModal(false);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setCurrentTicketId(null);
  }, []);

  // ✅ UPDATED: Handle show attendee suggestions
  const handleShowSuggestions = useCallback((ticketId) => {
    if (existingAttendees.length === 0) {
      message.info('No existing attendees found');
      return;
    }
    setCurrentTicketId(ticketId);
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
      const totalBaseAmount = selectedTickets.reduce(
        (acc, ticket) => acc + ((ticket.baseAmount || 0) * (ticket.quantity || 0)),
        0
      );

      const totalCentralGST = selectedTickets.reduce(
        (acc, ticket) => acc + ((ticket.centralGST || 0) * (ticket.quantity || 0)),
        0
      );

      const totalStateGST = selectedTickets.reduce(
        (acc, ticket) => acc + ((ticket.stateGST || 0) * (ticket.quantity || 0)),
        0
      );

      const totalTax = totalCentralGST + totalStateGST;
      const totalAmount = subtotal + totalTax;

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

  // ✅ NEW: Reset attendees when tickets change
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

  const handleDiscount = useCallback(() => {
    if (discountValue && subtotal > 0) {
      let disc = 0;
      if (discountType === 'fixed') {
        disc = Number(discountValue);
        setDiscount(disc);
      } else if (discountType === 'percentage') {
        disc = (subtotal * Number(discountValue)) / 100;
        setDiscount(+disc.toFixed(2));
      }
      setDisableChoice(true);
    }
  }, [discountValue, discountType, subtotal]);

  const handleBooking = useCallback(() => {
    if (currentStep === 0) {
      // Step 0: Ticket Selection
      const hasValidTicket = selectedTickets?.some(ticket => Number(ticket?.quantity) > 0);

      if (!hasValidTicket || selectedTickets.length === 0) {
        message.error('Please select at least one ticket');
        return;
      }

      if (isAttendeeRequire) {
        setCurrentStep(1); // Go to attendee step
      } else {
        setShowPrintModel(true); // Directly open checkout
      }
    } else if (currentStep === 1) {
      // Step 1: Attendee Management
      const validation = validateTicketAttendees();

      if (!validation.valid) {
        message.warning(validation.message);
        return;
      }

      handleSaveAttendees();
    }
  }, [currentStep, selectedTickets, isAttendeeRequire, validateTicketAttendees, handleSaveAttendees]);

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

  // Replace the row section (around line 1034-1090) with:
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
        number={number}
        setNumber={setNumber}
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
            selectedAttendeeIds={currentTicketId ? (ticketAttendees[currentTicketId] || []).map(a => a.id) : []}
          />
        </>
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <PosEvents handleButtonClick={handleButtonClick} />
        </Col>

        {eventID && (
          <>
            {/* Step Indicator */}
            <Col span={24}>
              <Card size="small">
                <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
                  <Space>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: currentStep >= 0 ? 'var(--primary-color)' : '#d9d9d9',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      1
                    </div>
                    <Text strong={currentStep === 0}>Select Tickets</Text>
                  </Space>

                  <ArrowRightOutlined style={{ color: '#d9d9d9' }} />

                  {isAttendeeRequire && (
                    <>
                      <Space>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: currentStep >= 1 ? 'var(--primary-color)' : 'var(--secondary-color)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}
                        >
                          2
                        </div>
                        <Text strong={currentStep === 1}>Add Attendees</Text>
                      </Space>

                      <ArrowRightOutlined style={{ color: '#d9d9d9' }} />
                    </>
                  )}

                  <Space>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: currentStep >= 1 ? 'var(--primary-color)' : 'var(--secondary-color)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      {isAttendeeRequire ? 3 : 2}
                    </div>
                    <Text>Checkout</Text>
                  </Space>
                </Space>
              </Card>
            </Col>

            {/* Step 0: Ticket Selection */}
            {currentStep === 0 && (
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
            )}

            {/* Step 1: Attendee Management */}
            {currentStep === 1 && isAttendeeRequire && (
              <Col xs={24} lg={16}>
                <Card
                  bordered={false}
                  title="Attendee Details"
                  extra={
                    <Button
                      type="link"
                      onClick={() => setCurrentStep(0)}
                    >
                      Back to Tickets
                    </Button>
                  }
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {selectedTickets.map((ticket) => {
                      if (Number(ticket.quantity) === 0) return null;

                      const requiredCount = Number(ticket.quantity);
                      const currentCount = getAttendeeCountForTicket(ticket.id);
                      const currentTicketAttendees = ticketAttendees[ticket.id] || [];
                      const isComplete = currentCount === requiredCount;

                      return (
                        <Card
                          key={ticket.id}
                          size="small"
                          type={isComplete ? "default" : "inner"}
                        >
                          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                            <Space>
                              <Text strong>{ticket.name}</Text>
                              <Text type={isComplete ? "success" : "danger"}>
                                ({currentCount}/{requiredCount})
                              </Text>
                            </Space>
                            <Space.Compact>
                              <Button
                                size="small"
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={() => handleOpenAttendeeModal(ticket.id)}
                                disabled={currentCount >= requiredCount}
                              >
                                Add
                              </Button>
                              <Button
                                size="small"
                                icon={<TeamOutlined />}
                                onClick={() => handleShowSuggestions(ticket.id)}
                                disabled={!eventID || existingAttendees.length === 0 || currentCount >= requiredCount}
                              >
                                Select
                              </Button>
                            </Space.Compact>
                          </Flex>

                          {currentTicketAttendees.length > 0 && (
                            <SelectedAttendees
                              attendees={currentTicketAttendees}
                              onRemove={(index) => handleRemoveAttendee(ticket.id, index)}
                              onEdit={(index) => handleEditAttendee(ticket.id, index)}
                              categoryFields={categoryFields}
                            />
                          )}
                        </Card>
                      );
                    })}
                  </Space>
                </Card>
              </Col>
            )}

            {/* Right Sidebar - Order Summary */}
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
                      loading={isLoading}
                      disabled={selectedTickets.length === 0}
                    >
                      {currentStep === 0 
                        ? (isAttendeeRequire ? 'Next: Add Attendees' : 'Checkout')
                        : 'Save & Continue'
                      }
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
                          loading={isLoading}
                          disabled={selectedTickets.length === 0}
                        >
                          {currentStep === 0 ? 'Next' : 'Save'}
                        </Button>
                      }
                    />
                  </div>
                </Space>
              </Card>
            </Col>
          </>
        )}
      </Row>
    </Fragment>
  );
});

NewAgentBooking.displayName = 'NewAgentBooking';
export default NewAgentBooking;


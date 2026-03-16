import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import {
  calculateTotalAmount,
  getTicketCategoryCounts,
  canSelectSeat,
  isMaxSeatsReached,
  validateBookingData
} from './Bookingutils';

/**
 * Custom hook for managing booking state and logic
 * @param {Object} options - Configuration options
 * @param {Object} options.event - Event object with tax_data
 * @returns {Object} - Booking state and methods
 */
const useBooking = (options = {}) => {
  const {
    maxSeats = 10,
    holdDuration = 600, // 10 minutes in seconds
    autoHoldTimeout = true,
    event = null // Event data with tax_data
  } = options;

  // State
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [sections, setSections] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(holdDuration);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const handleClearSelectionRef = useRef(null);

  // Total selected seat count (tickets can have quantity > 1)
  const totalSelectedSeats = selectedSeats.reduce((sum, t) => sum + (t.quantity || 0), 0);

  // Timer effect for seat hold (uses ref to avoid stale handleClearSelection)
  useEffect(() => {
    if (!autoHoldTimeout) return;

    let interval;

    if (totalSelectedSeats > 0 && isTimerActive) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleClearSelectionRef.current?.();
            message.warning('Time expired! Please select seats again.');
            setIsTimerActive(false);
            return holdDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (totalSelectedSeats === 0) {
      setTimeRemaining(holdDuration);
      setIsTimerActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [totalSelectedSeats, isTimerActive, autoHoldTimeout, holdDuration]);

  // Start timer when first seat is selected
  useEffect(() => {
    if (totalSelectedSeats === 1 && !isTimerActive && autoHoldTimeout) {
      setIsTimerActive(true);
    }
  }, [totalSelectedSeats, isTimerActive, autoHoldTimeout]);

  /**
   * Update seat status in sections (defined early for handleSeatClick)
   */
  const updateSeatStatus = useCallback((sectionId, rowId, seatId, status) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              rows: section.rows.map(row =>
                row.id === rowId
                  ? {
                      ...row,
                      seats: row.seats.map(seat =>
                        seat.id === seatId ? { ...seat, status } : seat
                      )
                    }
                  : row
              )
            }
          : section
      )
    );
  }, []);

  // Create a message key for seat selection updates
  const SEAT_MESSAGE_KEY = 'seat-selection-message';

  const handleSeatClick = useCallback((seat, sectionId, rowId) => {
    // Check if seat can be selected
    const validation = canSelectSeat(seat);
    if (!validation.valid) {
      message.warning(validation.reason);
      return;
    }

    setSelectedSeats(prevSelectedSeats => {
      const ticketId = seat.ticket?.id;

      // Find if this ticket already exists in selection
      const existingTicketIndex = prevSelectedSeats.findIndex(t => t.id === ticketId);

      // Check if this specific seat is already selected
      const isSeatAlreadySelected = prevSelectedSeats.some(ticket =>
        ticket.seats?.some(s => s.seat_id === seat.id)
      );

      // Calculate current total seats
      const currentTotalSeats = prevSelectedSeats.reduce((sum, t) => sum + (t.quantity || 0), 0);

      if (isSeatAlreadySelected) {
        // Deselect seat - find the ticket and remove this seat from its seats array
        const newSelectedSeats = prevSelectedSeats.map(ticket => {
          if (ticket.seats?.some(s => s.seat_id === seat.id)) {
            // Remove this seat from the seats array
            const updatedSeats = ticket.seats.filter(s => s.seat_id !== seat.id);

            // If no more seats, return null to filter out later
            if (updatedSeats.length === 0) {
              updateSeatStatus(sectionId, rowId, seat.id, 'available');
              return null;
            }

            // Recalculate totals based on new quantity
            const newQuantity = updatedSeats.length;
            updateSeatStatus(sectionId, rowId, seat.id, 'available');

            return {
              ...ticket,
              quantity: newQuantity,
              seats: updatedSeats,
              totalBaseAmount: +Math.max(0, ticket.baseAmount * newQuantity).toFixed(2),
              totalCentralGST: +Math.max(0, ticket.centralGST * newQuantity).toFixed(2),
              totalStateGST: +Math.max(0, ticket.stateGST * newQuantity).toFixed(2),
              totalTaxTotal: +Math.max(0, ticket.totalTax * newQuantity).toFixed(2),
              totalConvenienceFee: +Math.max(0, ticket.convenienceFee * newQuantity).toFixed(2),
              totalFinalAmount: +Math.max(0, ticket.finalAmount * newQuantity).toFixed(2),
            };
          }
          return ticket;
        }).filter(Boolean);

        // Calculate new total after removal
        const newTotalSeats = currentTotalSeats - 1;

        // Show updated message with seat count
        showSeatSelectionMessage(newTotalSeats);

        return newSelectedSeats;
      } else {
        // Check max seats limit
        if (isMaxSeatsReached(currentTotalSeats, maxSeats)) {
          message.warning({
            content: `Maximum ${maxSeats} seats allowed`,
            key: 'max-seats-warning'
          });
          return prevSelectedSeats;
        }

        // Get section and row info
        const section = sections.find(s => s.id === sectionId);
        const row = section?.rows.find(r => r.id === rowId);

        if (!section || !row) {
          message.error('Invalid section or row');
          return prevSelectedSeats;
        }

        // Get ticket price and calculate taxes
        const basePrice = parseFloat(seat.ticket?.price || 0);
        const unitBaseAmount = +(basePrice).toFixed(2);

        // Get tax data from event
        const taxData = event?.tax_data;
        const convenienceFeeValue = Number(taxData?.convenience_fee || 0);
        const convenienceFeeType = taxData?.type || "flat";

        // Calculate convenience fee per seat
        let unitConvenienceFee = 0;
        if (convenienceFeeType === "percentage") {
          unitConvenienceFee = +(unitBaseAmount * (convenienceFeeValue / 100)).toFixed(2);
        } else {
          unitConvenienceFee = +convenienceFeeValue.toFixed(2);
        }

        // Calculate GST on convenience fee
        const unitCentralGST = +(unitConvenienceFee * 0.09).toFixed(2);
        const unitStateGST = +(unitConvenienceFee * 0.09).toFixed(2);
        const unitTotalTax = +(unitCentralGST + unitStateGST).toFixed(2);
        const unitFinalAmount = +(unitBaseAmount + unitConvenienceFee + unitTotalTax).toFixed(2);

        // Create seat info
        const seatInfo = {
          seat_id: seat.id,
          seat_name: `${row.title}${seat.number}`,
          ticket_id: ticketId,
          section_id: sectionId,
          row_id: rowId,
          sectionName: section.name,
          rowTitle: row.title,
          number: seat.number
        };

        let newSelectedSeats;

        if (existingTicketIndex !== -1) {
          // Ticket already exists - add seat to its seats array
          const existingTicket = prevSelectedSeats[existingTicketIndex];
          const newQuantity = existingTicket.quantity + 1;
          const updatedSeats = [...existingTicket.seats, seatInfo];

          const updatedTicket = {
            ...existingTicket,
            quantity: newQuantity,
            seats: updatedSeats,
            totalBaseAmount: +Math.max(0, existingTicket.baseAmount * newQuantity).toFixed(2),
            totalCentralGST: +Math.max(0, existingTicket.centralGST * newQuantity).toFixed(2),
            totalStateGST: +Math.max(0, existingTicket.stateGST * newQuantity).toFixed(2),
            totalTaxTotal: +Math.max(0, existingTicket.totalTax * newQuantity).toFixed(2),
            totalConvenienceFee: +Math.max(0, existingTicket.convenienceFee * newQuantity).toFixed(2),
            totalFinalAmount: +Math.max(0, existingTicket.finalAmount * newQuantity).toFixed(2),
          };

          newSelectedSeats = [...prevSelectedSeats];
          newSelectedSeats[existingTicketIndex] = updatedTicket;
        } else {
          // New ticket - create new object
          const newTicket = {
            id: ticketId,
            category: seat.ticket?.name || 'General',
            ticket_id: ticketId,
            ticket: seat.ticket,
            quantity: 1,
            seats: [seatInfo],
            price: unitBaseAmount,
            baseAmount: unitBaseAmount,
            centralGST: unitCentralGST,
            stateGST: unitStateGST,
            totalTax: unitTotalTax,
            convenienceFee: unitConvenienceFee,
            finalAmount: unitFinalAmount,
            totalBaseAmount: unitBaseAmount,
            totalCentralGST: unitCentralGST,
            totalStateGST: unitStateGST,
            totalTaxTotal: unitTotalTax,
            totalConvenienceFee: unitConvenienceFee,
            totalFinalAmount: unitFinalAmount,
          };
          newSelectedSeats = [...prevSelectedSeats, newTicket];
        }

        updateSeatStatus(sectionId, rowId, seat.id, 'selected');

        // Show updated message with new seat count
        const newTotalSeats = currentTotalSeats + 1;
        showSeatSelectionMessage(newTotalSeats);

        return newSelectedSeats;
      }
    });
  }, [sections, maxSeats, event, updateSeatStatus]);

  /**
   * Shows a single updating message for seat selection
   * Uses the same key to update existing message instead of creating new ones
   */
  const showSeatSelectionMessage = (totalSeats) => {
    if (totalSeats === 0) {
      // Destroy the message when no seats selected
      message.destroy(SEAT_MESSAGE_KEY);
      return;
    }

    const seatText = totalSeats === 1 ? 'seat' : 'seats';

    message.success({
      content: `${totalSeats} ${seatText} selected`,
      key: SEAT_MESSAGE_KEY,
      duration: 2, // Auto-close after 2 seconds of inactivity
    });
  };

  /**
   * Remove specific seat from selection
   */
  const handleRemoveSeat = useCallback((seatId, sectionId, rowId) => {
    setSelectedSeats(prev => {
      const updated = prev.map(ticket => {
        const updatedSeats = ticket.seats?.filter(
          s => !(s.seat_id === seatId && s.section_id === sectionId && s.row_id === rowId)
        ) ?? [];
        if (updatedSeats.length === 0) return null;
        if (updatedSeats.length === ticket.seats?.length) return ticket;
        const newQuantity = updatedSeats.length;
        return {
          ...ticket,
          quantity: newQuantity,
          seats: updatedSeats,
          totalBaseAmount: +Math.max(0, ticket.baseAmount * newQuantity).toFixed(2),
          totalCentralGST: +Math.max(0, ticket.centralGST * newQuantity).toFixed(2),
          totalStateGST: +Math.max(0, ticket.stateGST * newQuantity).toFixed(2),
          totalTaxTotal: +Math.max(0, ticket.totalTax * newQuantity).toFixed(2),
          totalConvenienceFee: +Math.max(0, ticket.convenienceFee * newQuantity).toFixed(2),
          totalFinalAmount: +Math.max(0, ticket.finalAmount * newQuantity).toFixed(2),
        };
      }).filter(Boolean);
      return updated;
    });
    updateSeatStatus(sectionId, rowId, seatId, 'available');

    message.success('Seat removed');
  }, [updateSeatStatus]);

  /**
   * Clear all selected seats
   */
  const handleClearSelection = useCallback(() => {
    selectedSeats.forEach(ticket => {
      ticket.seats?.forEach(seat => {
        updateSeatStatus(seat.section_id, seat.row_id, seat.seat_id, 'available');
      });
    });
    setSelectedSeats([]);
    setTimeRemaining(holdDuration);
    setIsTimerActive(false);

    message.info('Selection cleared');
  }, [selectedSeats, updateSeatStatus, holdDuration]);

  handleClearSelectionRef.current = handleClearSelection;

  /**
   * Get total amount
   */
  const getTotalAmount = useCallback(() => {
    return calculateTotalAmount(selectedSeats);
  }, [selectedSeats]);

  /**
   * Get ticket category counts
   */
  const getTicketCounts = useCallback(() => {
    return getTicketCategoryCounts(selectedSeats);
  }, [selectedSeats]);

  /**
   * Validate booking before submission
   */
  const validateBooking = useCallback((customerData) => {
    const bookingData = {
      ...customerData,
      seats: selectedSeats,
      totalAmount: getTotalAmount()
    };

    return validateBookingData(bookingData);
  }, [selectedSeats, getTotalAmount]);

  /**
   * Mark selected seats as booked (after successful booking)
   */
  const markSeatsAsBooked = useCallback(() => {
    selectedSeats.forEach(ticket => {
      ticket.seats?.forEach(seat => {
        updateSeatStatus(seat.section_id, seat.row_id, seat.seat_id, 'booked');
      });
    });
    setSelectedSeats([]);
    setTimeRemaining(holdDuration);
    setIsTimerActive(false);
  }, [selectedSeats, updateSeatStatus, holdDuration]);

  /**
   * Reset timer
   */
  const resetTimer = useCallback(() => {
    setTimeRemaining(holdDuration);
    if (selectedSeats.length > 0) {
      setIsTimerActive(true);
    }
  }, [holdDuration, selectedSeats.length]);

  /**
   * Extend timer (if user needs more time)
   */
  const extendTimer = useCallback((additionalSeconds = 300) => {
    setTimeRemaining(prev => prev + additionalSeconds);
    message.success(`Timer extended by ${Math.floor(additionalSeconds / 60)} minutes`);
  }, []);

  /**
   * Check if a specific seat is selected
   */
  const isSeatSelected = useCallback((seatId) => {
    return selectedSeats.some(ticket =>
      ticket.seats?.some(s => s.seat_id === seatId)
    );
  }, [selectedSeats]);

  /**
   * Get selected seats count (total number of seats, not tickets)
   */
  const getSelectedSeatsCount = useCallback(() => {
    return selectedSeats.reduce((sum, t) => sum + (t.quantity || 0), 0);
  }, [selectedSeats]);

  /**
   * Check if max seats reached
   */
  const isMaxLimitReached = useCallback(() => {
    const totalSeats = selectedSeats.reduce((sum, t) => sum + (t.quantity || 0), 0);
    return isMaxSeatsReached(totalSeats, maxSeats);
  }, [selectedSeats, maxSeats]);

  /**
   * Update seat status by seat IDs - marks specific seats as booked/unavailable
   * Used when API returns 409 conflict with seat IDs that are no longer available
   * @param {Array} seatIds - Array of seat IDs to mark as booked
   * @param {string} status - Status to set (default: 'booked')
   */
  const updateSeatsByIds = useCallback((seatIds, status = 'booked') => {
    if (!Array.isArray(seatIds) || seatIds.length === 0) return;

    // Ensure all seatIds are strings for comparison
    const seatIdsStr = seatIds.map(id => String(id).trim());
    
    setSections(prevSections =>
      prevSections.map(section => ({
        ...section,
        rows: section.rows.map(row => ({
          ...row,
          seats: row.seats.map(seat => {
            const seatIdStr = String(seat.id).trim();
            if (seatIdsStr.includes(seatIdStr)) {
              return { ...seat, status };
            }
            return seat;
          })
        }))
      }))
    );

    // Also remove these seats from selected seats if they were selected
    setSelectedSeats(prevSelectedSeats => {
      return prevSelectedSeats.map(ticket => {
        const updatedSeats = ticket.seats?.filter(s => !seatIdsStr.includes(String(s.seat_id).trim())) || [];
        
        if (updatedSeats.length === 0) {
          return null;
        }

        const newQuantity = updatedSeats.length;
        return {
          ...ticket,
          quantity: newQuantity,
          seats: updatedSeats,
          totalBaseAmount: +Math.max(0, ticket.baseAmount * newQuantity).toFixed(2),
          totalCentralGST: +Math.max(0, ticket.centralGST * newQuantity).toFixed(2),
          totalStateGST: +Math.max(0, ticket.stateGST * newQuantity).toFixed(2),
          totalTaxTotal: +Math.max(0, ticket.totalTax * newQuantity).toFixed(2),
          totalConvenienceFee: +Math.max(0, ticket.convenienceFee * newQuantity).toFixed(2),
          totalFinalAmount: +Math.max(0, ticket.finalAmount * newQuantity).toFixed(2),
        };
      }).filter(Boolean);
    });
  }, []);

  /**
   * Mark all currently selected seats as booked (after successful booking)
   * Clears selection and resets timer
   */
  const markSelectedSeatsAsBooked = useCallback(() => {
    // Get all seat IDs from selected tickets
    const allSeatIds = selectedSeats.flatMap(ticket => 
      ticket.seats?.map(s => s.seat_id) || []
    );

    if (allSeatIds.length > 0) {
      updateSeatsByIds(allSeatIds, 'booked');
    }

    setSelectedSeats([]);
    setTimeRemaining(holdDuration);
    setIsTimerActive(false);
  }, [selectedSeats, updateSeatsByIds, holdDuration]);

  return {
    // State
    selectedSeats,
    sections,
    timeRemaining,
    isTimerActive,

    // Setters
    setSections,
    setSelectedSeats,

    // Methods
    handleSeatClick,
    handleRemoveSeat,
    handleClearSelection,
    getTotalAmount,
    getTicketCounts,
    validateBooking,
    markSeatsAsBooked,
    markSelectedSeatsAsBooked,
    updateSeatsByIds,
    resetTimer,
    extendTimer,
    isSeatSelected,
    getSelectedSeatsCount,
    isMaxLimitReached,

    // Configuration
    maxSeats,
    holdDuration
  };
};

export default useBooking;
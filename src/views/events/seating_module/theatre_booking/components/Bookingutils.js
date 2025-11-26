/**
 * Booking Utilities
 * Helper functions for ticket booking calculations and validations
 */

/**
 * Calculate total amount from selected seats/tickets
 * Works with both normal booking (quantity-based) and seating booking (seat-based)
 * @param {Array} selectedSeats - Array of selected seat/ticket objects with pricing information
 * @returns {number} - Total final amount including all taxes and fees
 */
export const calculateTotalAmount = (selectedSeats) => {
  return selectedSeats.reduce((total, item) => {
    // Use totalFinalAmount which includes base price + convenience fee + GST
    const itemTotal = parseFloat(item.totalFinalAmount || 0);
    return total + itemTotal;
  }, 0);
};

/**
 * Get ticket category counts and totals
 * @param {Array} selectedSeats - Array of selected seat objects
 * @returns {Object} - Object with ticket category counts and prices
 */
export const getTicketCategoryCounts = (selectedSeats) => {
  const counts = {};
  
  selectedSeats.forEach(seat => {
    if (seat.ticket) {
      const ticketName = seat.ticket.name;
      const ticketId = seat.ticket.id;
      
      if (!counts[ticketName]) {
        counts[ticketName] = {
          ticketId: ticketId,
          count: 0,
          price: parseFloat(seat.ticket.price || 0),
          total: 0
        };
      }
      
      counts[ticketName].count += 1;
      counts[ticketName].total = counts[ticketName].count * counts[ticketName].price;
    }
  });
  
  return counts;
};

/**
 * Group selected seats by section
 * @param {Array} selectedSeats - Array of selected seat objects
 * @returns {Object} - Object grouped by section ID
 */
export const groupSeatsBySection = (selectedSeats) => {
  const grouped = {};
  
  selectedSeats.forEach(seat => {
    if (!grouped[seat.sectionId]) {
      grouped[seat.sectionId] = {
        sectionName: seat.sectionName,
        seats: []
      };
    }
    grouped[seat.sectionId].seats.push(seat);
  });
  
  return grouped;
};

/**
 * Group selected seats by row
 * @param {Array} selectedSeats - Array of selected seat objects
 * @returns {Object} - Object grouped by row ID
 */
export const groupSeatsByRow = (selectedSeats) => {
  const grouped = {};
  
  selectedSeats.forEach(seat => {
    const key = `${seat.sectionId}-${seat.rowId}`;
    if (!grouped[key]) {
      grouped[key] = {
        sectionName: seat.sectionName,
        rowTitle: seat.rowTitle,
        seats: []
      };
    }
    grouped[key].seats.push(seat);
  });
  
  return grouped;
};

/**
 * Validate if a seat can be selected
 * @param {Object} seat - Seat object
 * @returns {Object} - {valid: boolean, reason: string}
 */
export const canSelectSeat = (seat) => {
  if (!seat.ticket) {
    return { valid: false, reason: 'No ticket assigned to this seat' };
  }
  
  if (seat.status === 'booked') {
    return { valid: false, reason: 'This seat is already booked' };
  }
  
  if (seat.status === 'disabled') {
    return { valid: false, reason: 'This seat is not available' };
  }
  
  return { valid: true, reason: '' };
};

/**
 * Check if maximum seat selection limit is reached
 * @param {number} currentCount - Current selected seat count
 * @param {number} maxLimit - Maximum allowed seats (default: 10)
 * @returns {boolean}
 */
export const isMaxSeatsReached = (currentCount, maxLimit = 10) => {
  return currentCount >= maxLimit;
};

/**
 * Format seat information for display
 * @param {Object} seat - Seat object
 * @returns {string} - Formatted seat string
 */
export const formatSeatInfo = (seat) => {
  return `${seat.sectionName} - Row ${seat.rowTitle}, Seat ${seat.number}`;
};

/**
 * Calculate booking fee
 * @param {number} subtotal - Subtotal amount
 * @param {number} feePercentage - Fee percentage (default: 0)
 * @returns {number}
 */
export const calculateBookingFee = (subtotal, feePercentage = 0) => {
  return (subtotal * feePercentage) / 100;
};

/**
 * Calculate taxes
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxPercentage - Tax percentage (default: 0)
 * @returns {number}
 */
export const calculateTax = (subtotal, taxPercentage = 0) => {
  return (subtotal * taxPercentage) / 100;
};

/**
 * Get final total
 * @param {number} subtotal 
 * @param {number} bookingFee 
 * @param {number} tax 
 * @returns {number}
 */
export const getFinalTotal = (subtotal, bookingFee = 0, tax = 0) => {
  return subtotal + bookingFee + tax;
};

/**
 * Get seat color based on ticket category
 */
export const getSeatColorByCategory = (seat, isSelected = false) => {
  if (seat.status === 'booked') return '#666666';
  if (seat.status === 'disabled') return '#333333';
  if (isSelected || seat.status === 'selected') return '#52c41a';
  
  if (seat.ticket) {
    const ticketName = seat.ticket.name?.toLowerCase() || '';
    
    const colorMap = {
      vip: '#FFD700',
      premium: '#FF6B35',
      standard: '#4ECDC4',
      economy: '#95E1D3',
      balcony: '#A8E6CF',
      gold: '#FFA500',
      silver: '#C0C0C0',
      platinum: '#E5E4E2'
    };
    
    for (const [key, color] of Object.entries(colorMap)) {
      if (ticketName.includes(key)) {
        return color;
      }
    }
  }
  
  return '#1890ff';
};

/**
 * Validate booking data
 */
export const validateBookingData = (bookingData) => {
  const errors = [];
  
  if (!bookingData.customerName?.trim()) {
    errors.push('Customer name is required');
  }
  
  if (!bookingData.customerEmail || !isValidEmail(bookingData.customerEmail)) {
    errors.push('Valid email is required');
  }
  
  if (!bookingData.customerPhone?.trim()) {
    errors.push('Phone number is required');
  }
  
  if (!bookingData.seats?.length) {
    errors.push('At least one seat must be selected');
  }
  
  if (!bookingData.eventId) {
    errors.push('Event ID is required');
  }
  
  if (!bookingData.layoutId) {
    errors.push('Layout ID is required');
  }
  
  return { valid: errors.length === 0, errors };
};

/** Validate email format */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/** Format price */
export const formatPrice = (amount, currency = '₹') => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Get seat statistics
 */
export const getSeatStatistics = (sections) => {
  let total = 0;
  let available = 0;
  let booked = 0;
  let disabled = 0;
  let selected = 0;
  
  sections.forEach(section => {
    section.rows?.forEach(row => {
      row.seats?.forEach(seat => {
        total++;
        if (seat.status === 'available') available++;
        else if (seat.status === 'booked') booked++;
        else if (seat.status === 'disabled') disabled++;
        else if (seat.status === 'selected') selected++;
      });
    });
  });
  
  return {
    total,
    available,
    booked,
    disabled,
    selected,
    availablePercentage: total ? ((available / total) * 100).toFixed(1) : 0,
    bookedPercentage: total ? ((booked / total) * 100).toFixed(1) : 0
  };
};

/**
 * Sort selected seats
 */
export const sortSelectedSeats = (selectedSeats) => {
  return [...selectedSeats].sort((a, b) => {
    if (a.sectionName !== b.sectionName) {
      return a.sectionName.localeCompare(b.sectionName);
    }
    if (a.rowTitle !== b.rowTitle) {
      return a.rowTitle.localeCompare(b.rowTitle);
    }
    return a.number - b.number;
  });
};

/* --------------------- FIX: NAMED VARIABLE FOR DEFAULT EXPORT -------------------- */

const bookingUtils = {
  calculateTotalAmount,
  getTicketCategoryCounts,
  groupSeatsBySection,
  groupSeatsByRow,
  canSelectSeat,
  isMaxSeatsReached,
  formatSeatInfo,
  calculateBookingFee,
  calculateTax,
  getFinalTotal,
  getSeatColorByCategory,
  validateBookingData,
  formatPrice,
  getSeatStatistics,
  sortSelectedSeats
};

export default bookingUtils;

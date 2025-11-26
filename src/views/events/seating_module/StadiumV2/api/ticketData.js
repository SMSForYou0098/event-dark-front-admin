/**
 * Ticket & Event Data Structure
 * 
 * This is the contract for ticket assignment system.
 * Backend dev: Build APIs that return data in this format.
 */

// ============================================
// DUMMY EVENTS
// ============================================

export const DUMMY_EVENTS = [
  {
    id: 'event-001',
    name: 'India vs Australia - T20 World Cup',
    date: '2024-03-15',
    venue: 'National Cricket Stadium',
    status: 'upcoming',
  },
  {
    id: 'event-002',
    name: 'IPL Final 2024',
    date: '2024-05-26',
    venue: 'National Cricket Stadium',
    status: 'upcoming',
  },
  {
    id: 'event-003',
    name: 'India vs England - Test Match Day 1',
    date: '2024-04-10',
    venue: 'National Cricket Stadium',
    status: 'upcoming',
  },
];

// ============================================
// DUMMY TICKETS (per event)
// ============================================

export const DUMMY_TICKETS = {
  'event-001': [
    { id: 'tkt-001-gen', name: 'General', price: 500, color: '#52c41a', icon: 'circle' },
    { id: 'tkt-001-pre', name: 'Premium', price: 1500, color: '#faad14', icon: 'circle' },
    { id: 'tkt-001-vip', name: 'VIP', price: 3000, color: '#f5222d', icon: 'star' },
    { id: 'tkt-001-cor', name: 'Corporate Box', price: 10000, color: '#722ed1', icon: 'diamond' },
    { id: 'tkt-001-stu', name: 'Student', price: 300, color: '#13c2c2', icon: 'circle' },
  ],
  'event-002': [
    { id: 'tkt-002-gen', name: 'General', price: 800, color: '#52c41a', icon: 'circle' },
    { id: 'tkt-002-pre', name: 'Premium', price: 2500, color: '#faad14', icon: 'circle' },
    { id: 'tkt-002-vip', name: 'VIP', price: 5000, color: '#f5222d', icon: 'star' },
    { id: 'tkt-002-cor', name: 'Corporate Box', price: 15000, color: '#722ed1', icon: 'diamond' },
  ],
  'event-003': [
    { id: 'tkt-003-gen', name: 'General', price: 400, color: '#52c41a', icon: 'circle' },
    { id: 'tkt-003-pre', name: 'Premium', price: 1200, color: '#faad14', icon: 'circle' },
    { id: 'tkt-003-vip', name: 'VIP', price: 2500, color: '#f5222d', icon: 'star' },
  ],
};

// ============================================
// SEAT ICONS
// ============================================

export const SEAT_ICONS = {
  circle: {
    name: 'Circle',
    draw: (ctx, x, y, size, fill, stroke) => {
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
  },
  square: {
    name: 'Square',
    draw: (ctx, x, y, size, fill, stroke) => {
      const half = size / 2;
      ctx.fillStyle = fill;
      ctx.fillRect(x - half, y - half, size, size);
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - half, y - half, size, size);
      }
    },
  },
  star: {
    name: 'Star (VIP)',
    draw: (ctx, x, y, size, fill, stroke) => {
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(x, y - outerRadius);
      
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
        rot += step;
      }
      
      ctx.lineTo(x, y - outerRadius);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
  },
  diamond: {
    name: 'Diamond (Premium)',
    draw: (ctx, x, y, size, fill, stroke) => {
      const half = size / 2;
      ctx.beginPath();
      ctx.moveTo(x, y - half);
      ctx.lineTo(x + half, y);
      ctx.lineTo(x, y + half);
      ctx.lineTo(x - half, y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
  },
  wheelchair: {
    name: 'Wheelchair Accessible',
    draw: (ctx, x, y, size, fill, stroke) => {
      // Draw a simple wheelchair icon
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#1890ff';
      ctx.fill();
      // White symbol
      ctx.fillStyle = '#fff';
      ctx.font = `${size * 0.7}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♿', x, y);
    },
  },
};

// ============================================
// SEAT STATUS
// ============================================

export const SEAT_STATUS = {
  available: { color: null, label: 'Available' }, // Uses ticket color
  booked: { color: '#555', label: 'Booked' },
  blocked: { color: '#333', label: 'Blocked' },
  selected: { color: '#1890ff', label: 'Selected' },
  locked: { color: '#faad14', label: 'Locked (by another user)' },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get tickets for an event
 */
export const getTicketsForEvent = (eventId) => {
  return DUMMY_TICKETS[eventId] || [];
};

/**
 * Get ticket by ID
 */
export const getTicketById = (eventId, ticketId) => {
  const tickets = DUMMY_TICKETS[eventId] || [];
  return tickets.find(t => t.id === ticketId) || null;
};

/**
 * Get seat color based on ticket and status
 */
export const getSeatColor = (seat, eventId) => {
  if (seat.status === 'booked') return SEAT_STATUS.booked.color;
  if (seat.status === 'blocked') return SEAT_STATUS.blocked.color;
  if (seat.status === 'selected') return SEAT_STATUS.selected.color;
  if (seat.status === 'locked') return SEAT_STATUS.locked.color;
  
  // Available - use ticket color
  if (seat.ticketId) {
    const ticket = getTicketById(eventId, seat.ticketId);
    if (ticket) return ticket.color;
  }
  
  return '#52c41a'; // Default green for available
};

/**
 * Get seat icon based on ticket
 */
export const getSeatIcon = (seat, eventId) => {
  if (seat.icon) return seat.icon;
  
  if (seat.ticketId) {
    const ticket = getTicketById(eventId, seat.ticketId);
    if (ticket?.icon) return ticket.icon;
  }
  
  return 'circle';
};

/**
 * Generate seats for a row
 * 
 * Works with both:
 * - New schema: row.seatCount (number)
 * - Legacy: row.seats (number or array)
 */
export const generateSeatsForRow = (row, section, tier, stand, eventId) => {
  const seats = [];
  
  // Handle different formats
  // New schema: row.seatCount
  // Legacy: row.seats (could be number or array)
  let seatCount = row?.seatCount || 0;
  
  // If row.seats exists and is an array with items, use its length
  if (Array.isArray(row?.seats) && row.seats.length > 0) {
    seatCount = row.seats.length;
  } else if (typeof row?.seats === 'number' && row.seats > 0) {
    seatCount = row.seats;
  }
  
  // Debug log
  console.log('generateSeatsForRow:', { 
    rowLabel: row?.label, 
    rowSeatCount: row?.seatCount,
    rowSeatsArray: row?.seats?.length,
    finalSeatCount: seatCount 
  });
  
  if (seatCount === 0) {
    console.warn('generateSeatsForRow: seatCount is 0 for row', row?.label);
    return seats;
  }
  
  // Check blocked status
  const isBlocked = 
    row?.status === 'blocked' || 
    section?.status === 'blocked' || 
    tier?.status === 'blocked' || 
    stand?.status === 'blocked';
  
  // Generate unique ID parts
  const standCode = stand?.code || stand?.id || 'S';
  const tierCode = tier?.code || tier?.id || 'T';
  const sectionCode = section?.code || section?.id || 'SEC';
  const rowLabel = row?.label || 'R';
  
  for (let i = 0; i < seatCount; i++) {
    seats.push({
      id: `${standCode}-${tierCode}-${sectionCode}-${rowLabel}-${i + 1}`,
      number: i + 1,
      rowLabel: row?.label,
      rowId: row?.id,
      sectionId: section?.id,
      sectionName: section?.name,
      tierId: tier?.id,
      tierName: tier?.name,
      standId: stand?.id,
      standName: stand?.name,
      ticketId: row?.ticketId || section?.ticketId || tier?.ticketId || stand?.ticketId || null,
      status: isBlocked ? 'blocked' : 'available',
      icon: row?.icon || section?.icon || tier?.icon || stand?.icon || 'circle',
    });
  }
  
  console.log('generateSeatsForRow: Generated', seats.length, 'seats for row', rowLabel);
  
  return seats;
};


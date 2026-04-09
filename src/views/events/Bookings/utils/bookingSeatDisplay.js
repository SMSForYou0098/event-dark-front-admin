/**
 * Human-readable seat list from API `event_seat_status` (and similar) shapes.
 */

export function formatEventSeatStatusList(eventSeatStatus) {
  if (!eventSeatStatus || !Array.isArray(eventSeatStatus) || eventSeatStatus.length === 0) {
    return '';
  }

  const seatsBySection = eventSeatStatus.reduce((acc, seat) => {
    if (!seat || typeof seat !== 'object') return acc;
    const sectionName = seat.section?.name || 'Unknown Section';
    if (!acc[sectionName]) acc[sectionName] = [];
    const name = seat.seat_name || seat.label || seat.seat_label;
    if (name) acc[sectionName].push(String(name));
    return acc;
  }, {});

  const sections = Object.keys(seatsBySection);
  if (sections.length === 0) return '';
  if (sections.length === 1) {
    return seatsBySection[sections[0]].join(', ');
  }
  return sections
    .map((sectionName) => `${sectionName}: ${seatsBySection[sectionName].join(', ')}`)
    .join(' | ');
}

function seatsFromBookingLike(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const fromStatus = formatEventSeatStatusList(obj.event_seat_status);
  if (fromStatus) return fromStatus;
  if (obj.seat_name) return String(obj.seat_name);
  if (obj.seat_label) return String(obj.seat_label);
  return '';
}

/**
 * One row in admin booking tables (master, child, POS, refund wrapper, etc.)
 */
export function getBookingSeatNumbersDisplay(record) {
  if (!record || typeof record !== 'object') return '—';

  const direct = seatsFromBookingLike(record);
  if (direct) return direct;

  if (Array.isArray(record.bookings) && record.bookings.length > 0) {
    const parts = record.bookings.map((b) => seatsFromBookingLike(b)).filter(Boolean);
    if (parts.length) return parts.join(', ');
  }

  if (record.booking) {
    const nested = seatsFromBookingLike(record.booking);
    if (nested) return nested;
  }

  return '—';
}

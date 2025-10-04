/**
 * Checks if an event has already started based on its date_range and entry_time
 * 
 * @param {Object} event - The event object containing date_range and entry_time
 * @return {Boolean} - Returns true if the event has started, false otherwise
 */
export const hasEventStarted = (event) => {
  if (!event) return false;

  // Get date range (could be "2025-05-27,2025-06-30" or just "2025-05-27")
  const dateRange = event.date_range;
  
  // Get entry time (format: "12:00")
  const entryTime = event.entry_time || "00:00"; // Default to midnight if no entry time
  
  if (!dateRange) return false;
  
  // Parse the date range - it could be a single date or a range
  const dateRangeParts = typeof dateRange === 'string' 
    ? dateRange.split(',') 
    : Array.isArray(dateRange) ? dateRange : [];
  
  // Get the first date (event start date)
  const firstDateStr = dateRangeParts[0];
  
  if (!firstDateStr) return false;
  
  // Parse entry time
  const [hours, minutes] = entryTime.split(':').map(num => parseInt(num, 10));
  
  // Create date object for event start with time
  const eventStart = new Date(firstDateStr);
  eventStart.setHours(hours || 0);
  eventStart.setMinutes(minutes || 0);
  
  // Current time
  const now = new Date();
  
  // Return comparison result
  return now >= eventStart;
};

/**
 * Gets the event object from a booking record, handling different data structures
 * 
 * @param {Object} booking - The booking data which might have different structures
 * @return {Object|null} - The event object or null if not found
 */
export const getEventFromBooking = (booking) => {
  if (!booking) return null;
  
  // Try to get event from different possible locations in the booking object
  return booking.ticket?.event || 
         (booking.bookings && booking.bookings[0]?.ticket?.event) || 
         null;
};
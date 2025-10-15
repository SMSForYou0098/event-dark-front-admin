

export const sanitizeInput = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

// Utility function to sanitize attendee data
export const sanitizeData = (attendees) => {
  return attendees.map(attendee => {
    const sanitized = {};
    Object.keys(attendee).forEach(key => {
      // ✅ Exclude system fields
      if (!['id', 'created_at', 'updated_at', 'deleted_at', 'status', 
            'booking_id', 'user_id', 'agent_id', 'token', 'ticketId', 
            'missingFields', 'index'].includes(key)) {
        sanitized[key] = sanitizeInput(attendee[key]);
      }
    });
    return sanitized;
  });
};

// Process image file to base64
export const processImageFile = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.readAsDataURL(file);
  });
};
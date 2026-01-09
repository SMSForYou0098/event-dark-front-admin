import { message, Statistic } from "antd";
import api from "auth/FetchInterceptor";
import Flex from "components/shared-components/Flex";
import { useCallback, useEffect, useMemo, useState } from "react";
import { calcTicketTotals, distributeDiscount } from "utils/ticketCalculations";


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


export const BookingStats = ({ type, id }) => {
  const [bookings, setBookings] = useState({
    bookings: 0,
    amount: 0,
    discount: 0
  });

  const bookingStats = useMemo(() => ({
    bookings: bookings?.bookings,
    amount: (parseInt(bookings?.amount) ?? 0).toFixed(2),
    discount: (parseInt(bookings?.discount) ?? 0).toFixed(2)
  }), [bookings]);

  const stats = [
    {
      title: "Bookings",
      value: bookingStats.bookings || 0,
    },
    {
      title: "Discount",
      value: bookingStats.discount,
      prefix: "₹",
      valueStyle: { color: "#1890ff" },
    },
    {
      title: "Amount",
      value: bookingStats.amount,
      prefix: "₹",
      valueStyle: { color: "var(--primary-color)" },
    },
  ];

  return (
    <div className="d-flex justify-content-between mb-3">
      {stats.map((item, index) => (
        <Statistic
          key={index}
          title={item.title}
          value={item.value}
          prefix={item.prefix}
          valueStyle={{ ...item.valueStyle, fontSize: '14px', fontWeight: 'bold' }}
        />
      ))}

    </div>
  )
}

export const handleDiscountChange = ({
  selectedTickets,
  discountValue,
  discountType,
  setDiscount,
  setSelectedTickets,
  setDisableChoice,
  message
}) => {
  const { subtotal } = calcTicketTotals(selectedTickets);

  if (!discountValue || discountValue <= 0) {
    setDiscount(0);
    setSelectedTickets(selectedTickets.map(ticket => ({
      ...ticket,
      discount: 0,
      discountPerUnit: 0,
      baseAmount: ticket.price,
      totalBaseAmount: ticket.price * ticket.quantity,
      finalAmount: ticket.price + ticket.centralGST + ticket.stateGST + ticket.convenienceFee,
      totalFinalAmount: (ticket.price + ticket.centralGST + ticket.stateGST + ticket.convenienceFee) * ticket.quantity
    })));
    setDisableChoice(false);
    message.info('Discount removed');
    return;
  }

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
  const updatedTickets = distributeDiscount(selectedTickets, finalDiscount);

  setSelectedTickets(updatedTickets);
  setDiscount(finalDiscount);
  setDisableChoice(true);

  message.success('Discount applied successfully');
};

export const resendTickets = async (record, type, setLoading = null) => {
  try {

    if (setLoading) setLoading(true);

    const endpoint = 'resend-ticket';

    // Prepare request payload
    const payload = {
      table_name: type,
      is_master: record?.is_master || false,
      set_id: record?.is_set ? record?.set_id : false,
      order_id: record?.is_master
        ? record?.order_id
        : record?.token || record?.order_id || '',
    };

    const response = await api.post(endpoint, payload);

    if (response.status) {

      return { success: true, data: response };
    } else {
      throw new Error(response?.message || 'Failed to resend tickets');
    }
  } catch (error) {
    message.error(error.message || 'Failed to resend tickets');
    return { success: false, error: error.message };
  } finally {
    if (setLoading) setLoading(false);
  }
};
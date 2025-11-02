import { Statistic } from "antd";
import api from "auth/FetchInterceptor";
import Flex from "components/shared-components/Flex";
import { useCallback, useEffect, useMemo, useState } from "react";


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


export const BookingStats = ({type , id }) => {
  const [bookings, setBookings] = useState({
    bookings: 0,
    amount: 0,
    discount: 0
  });

    // API calls with useCallback
    const GetBookings = useCallback(async () => {
      try {
        // const url = `${api}booking-stats/pos/${UserData?.id}`;
        const url = `booking-stats/${type}/${id}`;
        const res = await api.get(url);
        if (res.status) {
          setBookings(res);
        }
      } catch (err) {
        console.log(err);
      }
    }, [type, id]);


    useEffect(() => {
      GetBookings();
    }, [GetBookings]);


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

  return (
    <Flex justify="space-around" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
    {stats.map((item, index) => (
      <Statistic
        key={index}
        title={item.title}
        value={item.value}
        prefix={item.prefix}
        valueStyle={{ ...item.valueStyle, fontSize: '14px' , fontWeight : 'bold' }}
      />
    ))}

  </Flex>
  )
}
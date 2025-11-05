import { useState, useEffect } from 'react';
import axios from 'axios';

export const useAgentPOSDashboard = (api, userId, authToken , type) => {
  const [sale, setSale] = useState({
    agents: 0,
    pos: 0,
    agentsToday: 0,
    posToday: 0,
    bookings: { today: 0, total: 0 },
    tickets: { today: 0, total: 0 },
    cash: { today: 0, total: 0 },
    upi: { today: 0, total: 0 },
    nb: { today: 0, total: 0 },
  });

  const [weeklySales, setWeeklySales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getSaleCounts = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await axios.get(`${api}org/${type}/${userId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.data.status) {
          setWeeklySales(res.data?.salesDataNew || []);
          setSale({
            agents: res.data.agentBooking || 0,
            agentsToday: res.data.agentToday || 0,
            pos: res.data.posAmount || 0,
            posToday: res.data.posTodayAmount || 0,
            bookings: { 
              today: res.data.todayTotalBookings || 0, 
              total: res.data.totalBookings || 0 
            },
            tickets: { 
              today: res.data.todayTotalTickets || 0, 
              total: res.data.totalTickets || 0 
            },
            cash: res.data.cashSales || { today: 0, total: 0 },
            upi: res.data.upiSales || { today: 0, total: 0 },
            nb: res.data.netBankingSales || { today: 0, total: 0 },
          });
        }
      } catch (err) {
        console.error("Sale Fetch Error:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    getSaleCounts();
  }, [api, userId, authToken]);

  return { sale, weeklySales, isLoading, error };
};
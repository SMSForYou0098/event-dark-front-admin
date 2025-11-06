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
        const res = await axios.get(`${api}dashboard/org/${type}/${userId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.data.status) {
          // setWeeklySales(res.data?.salesDataNew || []);
          setSale(res.data?.data);
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
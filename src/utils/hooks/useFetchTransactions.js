import { useQuery } from "@tanstack/react-query";
import api from "auth/FetchInterceptor";

const useFetchTransactions = ( id, options = {}) => {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: async () => {
      const response = await api.get(`/user-transactions/${id}`);
      return response.data || [];
    },
    enabled: !!id, // Only fetch if id exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

export default useFetchTransactions;

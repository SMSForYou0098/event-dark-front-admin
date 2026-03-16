import { useQuery } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";

const useTicketInventory = (selectedEventId, selectedTicketId, type = "") => {
    return useQuery({
        queryKey: ["ticket-card-inventory", selectedEventId, selectedTicketId],
        queryFn: async () => {
            if (!selectedEventId || !selectedTicketId) return null;

            const res = await apiClient.post("card-tokens/ticket-card-inventory", {
                event_id: selectedEventId,
                ticket_id: selectedTicketId,
                type,
            });

            return res?.data || res;
        },
        enabled: !!selectedEventId && !!selectedTicketId,

        // 🔥 disable caching
        staleTime: 0,
        gcTime: 0,

        // 🔄 always refetch
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });
};

export default useTicketInventory;

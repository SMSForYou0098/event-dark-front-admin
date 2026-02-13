import { useQuery } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";

const useTicketInventory = (selectedEventId, selectedTicketId, type = "") => {
    return useQuery({
        queryKey: ["ticket-card-inventory", selectedEventId, selectedTicketId],
        queryFn: async () => {
            // Return null or empty if IDs are missing to avoid unnecessary calls if enabled check fails
            if (!selectedEventId || !selectedTicketId) return null;

            const res = await apiClient.post("card-tokens/ticket-card-inventory", {
                event_id: selectedEventId,
                ticket_id: selectedTicketId,
                type: type
            });
            return res?.data || res;
        },
        enabled: !!selectedEventId && !!selectedTicketId,
        staleTime: 60 * 1000,
    });
};

export default useTicketInventory;

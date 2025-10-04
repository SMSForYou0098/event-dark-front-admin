import React from "react";
import { Button, Tooltip } from "antd";
import { Send } from "lucide-react";
// import { hasEventStarted, getEventFromBooking } from "./eventUtils";

const TicketActions = ({ onSendTickets, item, isEventStarted }) => {
  const handleSendClick = () => {
    if (!isEventStarted) {
      onSendTickets(item);
    }
  };

  if (isEventStarted) {
    return (
      <Tooltip title="This event has already started. Tickets can no longer be sent.">
        <Button
          type="default"
          icon={<Send size={16} />}
          disabled
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          Send Tickets
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Send tickets">
      <Button
        type="default"
        icon={<Send size={16} />}
        onClick={() => handleSendClick(item)}
        style={{ display: "flex", alignItems: "center", gap: 4 }}
      >
        Send Tickets
      </Button>
    </Tooltip>
  );
};

export default TicketActions;

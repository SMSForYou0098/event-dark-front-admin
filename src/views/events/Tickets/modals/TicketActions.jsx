import React from "react";
import { Button, Tooltip } from "antd";
import { Send } from "lucide-react";
import { useMyContext } from "Context/MyContextProvider";
// import { hasEventStarted, getEventFromBooking } from "./eventUtils";

const TicketActions = ({ onSendTickets, item, isEventStarted, block = false, userId }) => {
  const { UserData } = useMyContext();

  // Support both master booking objects (with bookings array) and single booking objects
  const eventControls =
    item?.bookings?.[0]?.event?.event_controls || item?.event?.event_controls;
  const isTransferEnabled =
    eventControls &&
    (eventControls.ticket_transfer === true ||
      eventControls.ticket_transfer === 1 ||
      eventControls.ticket_transfer === "1");

  // If ticket transfer is disabled for this event, don't render the action at all
  if (!isTransferEnabled) {
    return null;
  }

  const handleSendClick = () => {
    if (!isEventStarted) {
      onSendTickets(item);
    }
  };

  if (isEventStarted && UserData?.id === userId) {
    return (
      <Tooltip title="This event has already started. Tickets can no longer be sent.">
        <Button
          type="default"
          icon={<Send size={16} />}
          disabled
          block={block}
          style={{ display: "flex", alignItems: "center", gap: 4, width: block ? "100%" : "auto" }}
        >
          Transfer Tickets
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
    {
      UserData?.id === Number(userId) && (
        <Tooltip title="Send tickets">
          <Button
            type="default"
            icon={<Send size={16} />}
            onClick={() => handleSendClick(item)}
            block={block}
            style={{ display: "flex", alignItems: "center", gap: 4, width: block ? "100%" : "auto" }}
          >
            Transfer Tickets
          </Button>
        </Tooltip>
      )
    }
    </>
  );
};

export default TicketActions;

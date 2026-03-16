import React, { useMemo } from "react";
import { Select } from "antd";
import { useOrganizerEvents } from "views/events/Settings/hooks/useBanners";

/**
 * Shared Event + Ticket dropdowns used by Attendees, CardReport, etc.
 * Uses useOrganizerEvents; parent controls selectedEvent and selectedTicketId.
 * Set showTicketDropdown={false} to render only the event dropdown (e.g. OrganizerReport).
 */
const EventTicketDropdowns = ({
  organizerId,
  role,
  selectedEvent,
  selectedTicketId,
  onEventChange,
  onTicketChange,
  eventSelectStyle = { width: "15rem" },
  ticketSelectStyle = { width: "12rem", marginLeft: 8 },
  eventPlaceholder = "Select Event",
  ticketPlaceholder = "Ticket",
  showTicketDropdown = true,
  disabled = false,
}) => {
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
    organizerId,
    role
  );

  const ticketOptions = useMemo(() => {
    const list = selectedEvent?.tickets || [];
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map((t) => ({
      value: t.id,
      label: t.name ?? `Ticket #${t.id}`,
    }));
  }, [selectedEvent?.tickets]);

  const handleSelectEvent = (value) => {
    const sel = events.find((e) => e.value === value) || null;
    onEventChange?.(sel);
  };

  return (
    <>
      <Select
        style={eventSelectStyle}
        placeholder={eventPlaceholder}
        value={selectedEvent?.value}
        onChange={handleSelectEvent}
        loading={eventsLoading}
        allowClear
        showSearch
        optionFilterProp="label"
        disabled={disabled}
        options={events.map((ev) => ({
          value: ev.value,
          label: ev.label,
        }))}
      />
      {showTicketDropdown && selectedEvent?.value && (
        <Select
          style={ticketSelectStyle}
          placeholder={ticketPlaceholder}
          value={selectedTicketId ?? ""}
          onChange={(v) => onTicketChange?.(v || null)}
          allowClear
          showSearch
          optionFilterProp="label"
          options={ticketOptions}
        />
      )}
    </>
  );
};

export default EventTicketDropdowns;

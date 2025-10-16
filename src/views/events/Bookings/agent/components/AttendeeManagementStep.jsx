import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Button, Card, message, Space, Tag } from 'antd';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import SelectedAttendees from '../SelectedAttendees';
import AttendeesField from '../AttendeesField';
import AttendeeSuggestion from '../AttendeeSuggestion';
const AttendeeManagementStep = forwardRef(({
  selectedTickets,
  categoryFields,
  existingAttendees,
  eventID,
  onBack
}, ref) => {
  const [showAttendeeFieldModal, setShowAttendeeFieldModal] = useState(false);
  const [editingAttendeeIndex, setEditingAttendeeIndex] = useState(null);
  const [editingAttendeeData, setEditingAttendeeData] = useState({});
  const [currentTicketId, setCurrentTicketId] = useState(null);
  const [showAttendeeSuggestion, setShowAttendeeSuggestion] = useState(false);
  const [ticketAttendees, setTicketAttendees] = useState({});
  const [savedAttendeeIds, setSavedAttendeeIds] = useState([])

  // ✅ Get all selected attendee IDs across all tickets
  const getAllSelectedAttendeeIds = useCallback(() => {
    const allIds = [];
    Object.values(ticketAttendees).forEach(attendees => {
      attendees.forEach(att => {
        if (att.id) {
          allIds.push(att.id);
        }
      });
    });
    return allIds;
  }, [ticketAttendees]);

  const getRequiredAttendeeCountForTicket = useCallback((ticketId) => {
    const ticket = selectedTickets.find(t => t.id === ticketId);
    return ticket ? Number(ticket.quantity) : 0;
  }, [selectedTickets]);

  const handleCloseAttendeeModal = useCallback(() => {
    setShowAttendeeFieldModal(false);
    setEditingAttendeeIndex(null);
    setEditingAttendeeData({});
    setCurrentTicketId(null);
  }, []);


   // Add this memo near other memos/callbacks
   const attendeeToTicketMap = useMemo(() => {
    const map = {};
    Object.entries(ticketAttendees).forEach(([tId, attendees]) => {
      const ticket = selectedTickets.find(t => t.id === (isNaN(tId) ? tId : Number(tId)));
      const ticketName = ticket?.category || ticket?.name || `Ticket ${tId}`;
      const ticketIdVal = ticket?.id ?? (isNaN(tId) ? tId : Number(tId));
      attendees.forEach(a => {
        if (a?.id) {
          map[a.id] = { ticketId: ticketIdVal, ticketName };
        }
      });
    });
    return map;
  }, [ticketAttendees, selectedTickets]);

   // Replace the entire handler with this toggle version
   const handleSelectAttendee = useCallback((attendee) => {
    const currentTicketAttendees = ticketAttendees[currentTicketId] || [];
    const requiredCount = getRequiredAttendeeCountForTicket(currentTicketId);

    if (currentTicketAttendees.length >= requiredCount) {
      message.warning(`Maximum ${requiredCount} attendees allowed for this ticket`);
      return;
    }

    // Prevent duplicate across any ticket
    const allSelectedIds = getAllSelectedAttendeeIds();
    if (allSelectedIds.includes(attendee.id)) {
      message.warning('This attendee is already added to another ticket');
      return;
    }

    // Add existing attendee (already has ID)
    const updated = [
      ...currentTicketAttendees,
      {
        id: attendee.id,
        Name: attendee.Name,
        Mo: attendee.Mo,
        Photo: attendee.Photo,
        Company_Name: attendee.Company_Name,
        isExisting: true,
        needsSaving: false,
      },
    ];

    setTicketAttendees(prev => ({
      ...prev,
      [currentTicketId]: updated,
    }));

    // Auto-close when filled up
    const newCount = updated.length;
    if (newCount >= requiredCount) {
      setShowAttendeeSuggestion(false);
      setCurrentTicketId(null);
    }
  }, [
    currentTicketId,
    ticketAttendees,
    getRequiredAttendeeCountForTicket,
    getAllSelectedAttendeeIds,
    setTicketAttendees,
    setShowAttendeeSuggestion,
    setCurrentTicketId
  ]);

  const handleAttendeeSave = useCallback((attendeeData, editingIndex) => {
    const currentTicketAttendees = ticketAttendees[currentTicketId] || [];

    if (editingIndex !== null) {
      // ✅ Update existing attendee
      const updatedAttendees = [...currentTicketAttendees];
      updatedAttendees[editingIndex] = {
        ...attendeeData,
        ...(attendeeData.id && { id: attendeeData.id }), // Keep existing ID if present
        isNew: !attendeeData.id, // ✅ Mark as new if no ID
        isEdited: true
      };

      setTicketAttendees(prev => ({
        ...prev,
        [currentTicketId]: updatedAttendees
      }));

      message.success('Attendee updated successfully');
    } else {
      // ✅ Add new attendee (no id, needs to be saved)
      const requiredCount = getRequiredAttendeeCountForTicket(currentTicketId);

      if (currentTicketAttendees.length >= requiredCount) {
        message.warning(`Maximum ${requiredCount} attendees allowed for this ticket`);
        return;
      }

      setTicketAttendees(prev => ({
        ...prev,
        [currentTicketId]: [...currentTicketAttendees, {
          ...attendeeData,
          isNew: true, // ✅ Mark as new (needs to be saved)
          needsSaving: true // ✅ Flag for API call
        }]
      }));

      message.success('Attendee added successfully');
    }

    handleCloseAttendeeModal();
  }, [currentTicketId, ticketAttendees, getRequiredAttendeeCountForTicket, handleCloseAttendeeModal]);

    // ✅ Pass all selected IDs to AttendeeSuggestion modal
    const handleShowSuggestions = useCallback((ticketId) => {
      setCurrentTicketId(ticketId);
      setShowAttendeeSuggestion(true);
    }, []);
  
    const handleRemoveAttendee = useCallback((ticketId, index) => {
      const currentTicketAttendees = ticketAttendees[ticketId] || [];
      const updated = currentTicketAttendees.filter((_, i) => i !== index);
  
      setTicketAttendees(prev => ({
        ...prev,
        [ticketId]: updated
      }));
  
      message.success('Attendee removed');
    }, [ticketAttendees]);
  
    const handleEditAttendee = useCallback((ticketId, index) => {
      const currentTicketAttendees = ticketAttendees[ticketId] || [];
      setCurrentTicketId(ticketId);
      setEditingAttendeeIndex(index);
      setEditingAttendeeData(currentTicketAttendees[index]);
      setShowAttendeeFieldModal(true);
    }, [ticketAttendees]);

    const handleOpenAttendeeModal = useCallback((ticketId) => {
      setCurrentTicketId(ticketId);
      setEditingAttendeeIndex(null);
      setEditingAttendeeData({});
      setShowAttendeeFieldModal(true);
    }, []);

    const getAttendeeCountForTicket = useCallback((ticketId) => {
      return ticketAttendees[ticketId]?.length || 0;
    }, [ticketAttendees]);

    const validateAttendees = useCallback(() => {
      for (const ticket of selectedTickets) {
        if (Number(ticket.quantity) > 0) {
          const requiredCount = Number(ticket.quantity);
          const currentCount = (ticketAttendees[ticket.id]?.length || 0);
          if (currentCount !== requiredCount) {
            return {
              valid: false,
              message: `Ticket "${ticket.category || ticket.name || 'Unknown'}" requires ${requiredCount} attendee(s), but only ${currentCount} added`
            };
          }
        }
      }
      return { valid: true };
    }, [selectedTickets, ticketAttendees]);

  // ids by ticket exposed to parent
  const getAttendeeIdsByTicket = useCallback(() => {
    const attendeeIdsByTicket = {};
    Object.entries(ticketAttendees).forEach(([ticketId, attendees]) => {
      const ids = attendees
        .map(a => a?.id)
        .filter(id => id !== undefined && id !== null);
      attendeeIdsByTicket[ticketId] = ids;
    });
    return attendeeIdsByTicket;
  }, [ticketAttendees]);

  useImperativeHandle(ref, () => ({
    validateAttendees,
    getAttendeeIdsByTicket,
  }));
  
  return (
    <>
      <AttendeesField
        showModal={showAttendeeFieldModal}
        handleCloseModal={handleCloseAttendeeModal}
        apiData={categoryFields}
        onSave={handleAttendeeSave}
        initialData={editingAttendeeData}
        editingIndex={editingAttendeeIndex}
      />

      <AttendeeSuggestion
        showModal={showAttendeeSuggestion}
        handleOpenAttendeeModal={handleOpenAttendeeModal}
        handleCloseModal={() => {
          setShowAttendeeSuggestion(false);
          setCurrentTicketId(null);
        }}
        attendees={existingAttendees}
        onSelectAttendee={handleSelectAttendee}
        currentTicketId={currentTicketId}
        currentTicketSelectedIds={(ticketAttendees[currentTicketId] || [])
          .map(a => a.id)
          .filter(id => id !== undefined && id !== null)}
        attendeeToTicketMap={attendeeToTicketMap}
      />
      <Card
        bordered={false}
        title="Attendee Details"
        extra={
          <Button type="link" onClick={onBack}>
            Back to Tickets
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {selectedTickets?.map((ticket) => {
            if (Number(ticket.quantity) === 0) return null;

            const requiredCount = Number(ticket.quantity);
            const currentCount = getAttendeeCountForTicket(ticket.id);
            const currentTicketAttendees = ticketAttendees[ticket.id] || [];
            const isComplete = currentCount === requiredCount;

            return (
              <Card
                key={ticket.id}
                size="small"
                title={`Select Attendee For ${ticket?.category}`}
                extra={
                  <>
                    <Tag color={isComplete ? 'green' : 'red'}>
                      ({currentCount}/{requiredCount})
                    </Tag>
                    {currentCount !== requiredCount && (
                      <Space.Compact>
                        <Button
                          size="small"
                          type="primary"
                          icon={<UserAddOutlined />}
                          onClick={() => handleOpenAttendeeModal(ticket.id)}
                          disabled={currentCount >= requiredCount}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          icon={<TeamOutlined />}
                          onClick={() => handleShowSuggestions(ticket.id)}
                          // disabled={eventID}
                        >
                          Select
                        </Button>
                      </Space.Compact>
                    )}

                  </>
                }
              >
                {currentTicketAttendees.length > 0 && (
                  <SelectedAttendees
                    attendees={currentTicketAttendees}
                    onRemove={(index) => handleRemoveAttendee(ticket.id, index)}
                    onEdit={(index) => handleEditAttendee(ticket.id, index)}
                    categoryFields={categoryFields}
                  />
                )}
              </Card>
            );
          })}
        </Space>
      </Card>
    </>
  );
});

export default AttendeeManagementStep;
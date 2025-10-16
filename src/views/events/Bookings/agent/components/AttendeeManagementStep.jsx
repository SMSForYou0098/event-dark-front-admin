import React, { useEffect } from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import SelectedAttendees from '../SelectedAttendees';

const { Text } = Typography;

const AttendeeManagementStep = ({
  selectedTickets,
  ticketAttendees,
  categoryFields,
  existingAttendees,
  eventID,
  getAttendeeCountForTicket,
  handleOpenAttendeeModal,
  handleShowSuggestions,
  handleRemoveAttendee,
  handleEditAttendee,
  onBack,
}) => {

  return (
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
                        disabled={
                          !eventID ||
                          existingAttendees.length === 0 ||
                          currentCount >= requiredCount
                        }
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
  );
};

export default AttendeeManagementStep;
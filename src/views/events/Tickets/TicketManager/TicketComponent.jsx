import React from 'react';
import { useParams } from 'react-router-dom';
import TicketManager from './TicketManager';

const TicketComponent = () => {
  const { id, name } = useParams();
  return (
    <TicketManager eventId={id} eventName={name} showEventName={true} />
  );
};

export default TicketComponent;

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from 'antd';
import TicketManager from './TicketManager';

const TicketComponent = () => {
  const { id, name } = useParams();
  return (
    <Card bordered={false}>
      <TicketManager eventId={id} eventName={name} showEventName={true} />
    </Card>
  );
};

export default TicketComponent;

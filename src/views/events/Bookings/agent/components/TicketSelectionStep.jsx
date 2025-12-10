import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import BookingTickets from '../../components/BookingTickets';
import { useMyContext } from 'Context/MyContextProvider';

const { Text } = Typography;

const TicketSelectionStep = ({
  event,
  selectedTickets,
  setSelectedTickets,
  getCurrencySymbol,
  onNext
}) => {
  const { formatDateRange } = useMyContext();
  return (
    <Card
      bordered={false}
      title={event?.name || 'Select an Event'}
      extra={
        event?.date_range && (
          <Space>
            <CalendarOutlined className="text-primary" />
            <Text>{formatDateRange(event?.date_range)}</Text>
          </Space>
        )
      }
    >
      <BookingTickets
        event={event}
        selectedTickets={selectedTickets}
        setSelectedTickets={setSelectedTickets} y
        getCurrencySymbol={getCurrencySymbol}
        type={'agent'}
      />
    </Card>
  );
};

export default TicketSelectionStep;
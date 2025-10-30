import { Empty, Space, Table, Typography } from 'antd';
import React, { useCallback, useEffect } from 'react'
import CommonPricingComp from './CommonPricingComp';
import Counter from 'utils/QuantityCounter';
import { useMyContext } from 'Context/MyContextProvider';
import { CloudCog } from 'lucide-react';
const { Text } = Typography;

const BookingTickets = ({ event, getCurrencySymbol, setSelectedTickets, selectedTickets }) => {
  // Reset selected tickets when event changes
  const { isMobile } = useMyContext()
  useEffect(() => {
    setSelectedTickets([]);
  }, [event?.id]); // Reset when event ID changes

  const columns = [
    {
      title: 'Ticket Details',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {text}
            {(record.sold_out === 'true' || record.donation === 'true') && (
              <Text type="danger" style={{ marginLeft: 8 }}>
                {record.sold_out === 'true' ? 'Booking Closed' : 'Booking Not Started Yet'}
              </Text>
            )}
          </Text>
          <Space>
            <Text>Price:</Text>
            <CommonPricingComp
              currency={record?.currency}
              price={record?.price}
              isSale={record?.sale}
              salePrice={record?.sale_price}
            />
          </Space>
        </Space>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: isMobile ? 200 : 250,
      render: (_, record) => {
        const selectedTicket = selectedTickets?.find(t => t?.id === record?.id);
        return (
          <Counter
            key={`${event?.id}-${record.id}`} // Add key to force remount on event change
            getTicketCount={getTicketCount}
            category={record.name}
            price={record?.sale === 1 ? Number(record?.sale_price) : Number(record?.price)}
            limit={10}
            ticketID={record.id}
            initialValue={selectedTicket?.quantity || 0}
          />
        );
      },
    },
    // 👉 Conditionally include "Total" column
    ...(!isMobile ? [{
      title: 'Total',
      key: 'total',
      align: 'right',
      width: 150,
      render: (_, record) => {
        const selectedTicket = selectedTickets?.find(t => t?.id === record?.id);
        const quantity = selectedTicket?.quantity || 0;

        if (quantity === 0) {
          return '-';
        }

        const price = record?.sale === 1 ? record?.sale_price : record?.price;
        const total = price * quantity;
        return `${getCurrencySymbol(record?.currency)}${total}`;
      },
    }] : [])
  ];


  const getTicketCount = useCallback((quantity, category, price, id) => {
    setSelectedTickets(prevTickets => {
      const existingIndex = prevTickets.findIndex(ticket => ticket.id === id);

      // Per-unit calculations (adjust the formulae as per your tax policy)
      const unitBaseAmount = +(price)?.toFixed(2);
      const unitCentralGST = +(unitBaseAmount * 0.09)?.toFixed(2);
      const unitStateGST = +(unitBaseAmount * 0.09)?.toFixed(2);
      const unitConvenienceFee = +(unitBaseAmount * 0.01)?.toFixed(2);
      const unitTotalTax = +(unitCentralGST + unitStateGST)?.toFixed(2);
      const unitFinalAmount = +((price) + unitConvenienceFee + unitTotalTax).toFixed(2);

      // Totals for the selected quantity
      const totalBaseAmount = +(unitBaseAmount * quantity).toFixed(2);
      const totalCentralGST = +(unitCentralGST * quantity).toFixed(2);
      const totalStateGST = +(unitStateGST * quantity).toFixed(2);
      const totalConvenienceFee = +(unitConvenienceFee * quantity).toFixed(2);
      const totalTotalTax = +(totalCentralGST + totalStateGST + totalConvenienceFee).toFixed(2);
      const totalFinalAmount = +((price * quantity) + totalTotalTax).toFixed(2);

      const ticketData = {
        id,
        category,
        quantity,
        price: +(+price).toFixed(2),

        // per-unit
        baseAmount: unitBaseAmount,
        centralGST: unitCentralGST,
        stateGST: unitStateGST,
        totalTax: unitTotalTax,
        convenienceFee: unitConvenienceFee,
        finalAmount: unitFinalAmount,

        // totals
        totalBaseAmount,
        totalCentralGST,
        totalStateGST,
        totalTaxTotal: totalTotalTax,
        totalConvenienceFee,
        totalFinalAmount,
      };

      // Remove if quantity is 0
      if (quantity === 0) {
        return existingIndex !== -1
          ? prevTickets.filter((_, index) => index !== existingIndex)
          : prevTickets;
      }

      // Update existing ticket
      if (existingIndex !== -1) {
        const updatedTickets = [...prevTickets];
        updatedTickets[existingIndex] = ticketData;
        return updatedTickets;
      }

      // Add new ticket
      return [...prevTickets, ticketData];
    });
  }, [setSelectedTickets]);


  if (!event || event?.length === 0) {
    return (
      <Empty description="Please select an event first to view tickets." />
    );
  }

  return (
    <div>
      <Table
        dataSource={event?.tickets}
        columns={columns}
        pagination={false}
        rowKey="id"
        locale={{ emptyText: 'No Tickets Available' }}
        rowClassName={(record) =>
          (record.sold_out === 'true' || record.donation === 'true') ? 'opacity-50' : ''
        }
        onRow={(record) => ({
          style: {
            pointerEvents: (record.sold_out === 'true' || record.donation === 'true') ? 'none' : 'auto'
          }
        })}
      />
    </div>
  )
}

export default BookingTickets
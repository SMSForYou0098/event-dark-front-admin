import { Space, Table, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react'
import CommonPricingComp from './CommonPricingComp';
import Counter from 'utils/QuantityCounter';
const { Text } = Typography;

const BookingTickets = ({setSubTotal,setBaseAmount,setCentralGST,setStateGST,setTotalTax,event,setGrandTotal,getCurrencySymbol}) => {

  const [tickets, setTickets] = useState([]);
   const [selectedTickets, setSelectedTickets] = useState([]);
      // Table columns
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
      width: 200,
      render: (_, record) => (
        <Counter
          getTicketCount={getTicketCount}
          category={record.name}
          price={record?.sale === 1 ? record?.sale_price : record?.price}
          limit={10}
          ticketID={record.id}
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      align: 'right',
      width: 150,
      render: (_, record) => {
        const selectedTicket = selectedTickets.find(t => t.category === record.name);
        const price = record?.sale === 1 ? record?.sale_price : record?.price;
        const total = selectedTicket ? price * selectedTicket.quantity : 0;
        return total > 0 ? `${getCurrencySymbol(record?.currency)}${total}` : '-';
      },
    },
  ];
  const getTicketCount = useCallback((quantity, category, price, id) => {
    setSelectedTickets(prevTickets => {
      const existingIndex = prevTickets.findIndex(ticket => ticket.category === category);
      if (existingIndex !== -1) {
        const updatedTickets = [...prevTickets];
        updatedTickets[existingIndex].quantity = quantity;
        return updatedTickets;
      }
      return [...prevTickets, { category, quantity, price, id }];
    });
  }, []);



    useEffect(() => {
      const isAnyTicketSelected = selectedTickets?.some(ticket => ticket?.quantity > 0);
      if (isAnyTicketSelected) {
        const total = selectedTickets.reduce((acc, ticket) => {
          const price = ticket?.sale === 'true' ? ticket?.sale_price : ticket?.price;
          return acc + (price * ticket.quantity);
        }, 0);
        setSubTotal(total);
  
        const firstSelectedTicket = selectedTickets.find(ticket => ticket?.quantity > 0);
        setTickets(tickets?.filter(item => item?.id === firstSelectedTicket?.id));
      } else {
        setSubTotal(0);
        setBaseAmount(0);
        setCentralGST(0);
        setStateGST(0);
        setTotalTax(0);
        setGrandTotal(0);
        setTickets(event?.tickets);
      }
    }, [selectedTickets, tickets, event?.tickets]);
  return (
    <div>
         <Table
              dataSource={tickets}
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

import { Empty, Space, Table, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react'
import CommonPricingComp from './CommonPricingComp';
import Counter from 'utils/QuantityCounter';
import { ClockCircleOutlined, RiseOutlined, StopOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';

const { Text } = Typography;

const BookingTickets = ({ event, getCurrencySymbol, setSelectedTickets, selectedTickets, type }) => {
  const { isMobile } = useMyContext();

  // Reset selected tickets when event changes
  useEffect(() => {
    setSelectedTickets([]);
  }, [event?.id, setSelectedTickets]);

  // Normalizer for mixed-type boolean-ish fields
  const toBool = (val) => val === 1 || val === '1' || val === true || val === 'true';

  // Helper: isInactive when status is 0 or '0'
  const isInactive = (rec) => rec?.status === 0 || rec?.status === '0';

  // - Otherwise include
  const filteredTickets = useMemo(() => {
    if (!event?.tickets) return [];
    return event.tickets.filter((rec) => {
      // if not inactive, show it
      if (!isInactive(rec)) return true;

      // if inactive, only allow display when type allowed:
      if (type === 'agent' && toBool(rec?.allow_agent)) return true;
      if (type === 'pos' && toBool(rec?.allow_pos)) return true;

      // otherwise filter out (don't show)
      return false;
    });
  }, [event?.tickets, type]);

  const getTicketCount = useCallback((quantity, category, price, id) => {
    setSelectedTickets(prevTickets => {
      const existingIndex = prevTickets.findIndex(ticket => ticket.id === id);
      const unitBaseAmount = +(price)?.toFixed(2);

      // tax states
      const taxData = event?.tax_data;
      const convenienceFeeValue = Number(taxData?.convenience_fee || 0);
      const convenienceFeeType = taxData?.type || "flat";

      // Dynamically calculate convenience fee
      let unitConvenienceFee = 0;
      if (convenienceFeeType === "percentage") {
        unitConvenienceFee = +(unitBaseAmount * (convenienceFeeValue / 100)).toFixed(2);
      } else {
        unitConvenienceFee = +convenienceFeeValue.toFixed(2);
      }

      const unitCentralGST = +(unitConvenienceFee * 0.09)?.toFixed(2);
      const unitStateGST = +(unitConvenienceFee * 0.09)?.toFixed(2);

      // Per-unit calculations
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
  }, [setSelectedTickets, event?.tax_data]);

  if (!event || event?.length === 0) {
    return (
      <Empty description="Please select an event first to view tickets." />
    );
  }

  // per-row helper used for styling / pointer-events (keeps existing sold_out logic)
  const rowIsDisabled = (record) => {
    const soldOut = toBool(record?.sold_out);
    const isAgentNotAllowed = soldOut && type === 'agent' && !toBool(record?.allow_agent);
    const isPosNotAllowed = soldOut && type === 'pos' && !toBool(record?.allow_pos);
    return isAgentNotAllowed || isPosNotAllowed || record?.booking_not_open;
  };


  const columns = [
    {
      title: 'Ticket Details',
      dataIndex: 'name',
      width: isMobile ? 250 : 400,
      key: 'name',
      render: (text, record) => {
        const isBookingBlocked = rowIsDisabled(record);
        console.log('record', record);
        let bookingStatus = null;
        if (rowIsDisabled(record)) {
          if (record?.booking_not_open) {
            bookingStatus = {
              label: 'Booking Not Open',
              icon: <ClockCircleOutlined />,
              color: 'orange'
            };
          }
          else {
            bookingStatus = {
              label: 'Booking Closed',
              icon: <StopOutlined />,
              color: 'red'
            };
          }
        }

        return (
          <Space direction="vertical" size={0}>
            <Space>
              <Text strong>{text}</Text>
            </Space>

            <Space>
              <Text>Price:</Text>
              <CommonPricingComp
                currency={record?.currency}
                price={record?.price}
                isSale={record?.sale}
                salePrice={record?.sale_price}
                bookingBlocked={isBookingBlocked}
              />
            </Space>
            {record?.fast_filling && (
              <Tag icon={<RiseOutlined />} color="green" className='mt-1 p-0 px-2' style={{ lineHeight: 2 }}>
                Fast Filling
              </Tag>
            )}
            {bookingStatus && (
              <Tag icon={bookingStatus.icon} color={bookingStatus.color} className='mt-1 p-0 px-2' style={{ lineHeight: 2 }}>
                {bookingStatus.label}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: isMobile ? 200 : 250,
      align: isMobile ? 'right' : 'center',
      render: (_, record) => {
        const selectedTicket = selectedTickets?.find(t => t?.id === record?.id);
        return (
          <Counter
            key={`${event?.id}-${record.id}`} // Add key to force remount on event change
            getTicketCount={getTicketCount}
            category={record.name}
            price={record?.sale ? Number(record?.sale_price) : Number(record?.price)}
            limit={10}
            ticketID={record.id}
            initialValue={selectedTicket?.quantity || 0}
            isDisable={rowIsDisabled(record)}
          />
        );
      },
    },
    // Conditionally include "Total" column (desktop only)
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

        const price = record?.sale ? record?.sale_price : record?.price;
        const total = price * quantity;
        return `₹ ${total}`;
      },
    }] : [])
  ];

  return (
    <div className=''>
      <Table
        dataSource={filteredTickets}
        columns={columns}
        pagination={false}
        rowKey="id"
        locale={{ emptyText: 'No Tickets Available' }}
        rowClassName={(record) => (rowIsDisabled(record) ? 'disabled-row' : '')}
        onRow={(record) => ({
          style: {
            pointerEvents: rowIsDisabled(record) ? 'none' : 'auto',

          },
        })}
      />
    </div>
  )
}

export default BookingTickets;

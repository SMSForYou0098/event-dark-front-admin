import React from 'react';
import { Tag } from 'antd';
import { formatCurrency } from './reportHelpers';
import { CHART_COLORS_ANTD } from 'utils/consts';

const capitalizeBookingType = (value) => {
  if (!value) return '-';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ticketColumns = [
  {
    title: 'Ticket Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Event ID',
    dataIndex: 'event_id',
    key: 'event_id',
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (value) => formatCurrency(value),
  },
];

export const paymentGatewayColumns = [
  {
    title: 'Gateway',
    dataIndex: 'gateway',
    key: 'gateway',
    // render: (value) => value || '-',
     render: (value, record, index) => {
      const truncated = value?.length > 6 ? value.slice(0, 6) + '..' : value;
      return <Tag color={CHART_COLORS_ANTD[index % CHART_COLORS_ANTD.length]}>{capitalizeBookingType(truncated)}</Tag>;
    },
  },
  {
    title: 'Bookings',
    dataIndex: 'booking_count',
    key: 'booking_count',
    render: (value) => value ?? 0,
  },
  {
    title: 'Total Tickets',
    dataIndex: 'total_tickets',
    key: 'total_tickets',
    render: (value) => value ?? 0,
  },
  {
    title: 'Amount',
    dataIndex: 'total_amount',
    key: 'total_amount',
    render: (value) => formatCurrency(value),
  },
];

export const bookingTypeColumns = [
  {
    title: 'Type',
    dataIndex: 'booking_type',
    key: 'booking_type',
    width: 140,
    fixed : 'left',
    render: (value, record, index) => {
      const truncated = value?.length > 6 ? value.slice(0, 6) + '..' : value;
      return <Tag color={CHART_COLORS_ANTD[index % CHART_COLORS_ANTD.length]}>{capitalizeBookingType(truncated)}</Tag>;
    },
  },
  {
    title: 'Bookings',
    dataIndex: 'booking_count',
    key: 'booking_count',
  },
  {
    title: 'Tickets',
    dataIndex: 'total_quantity',
    key: 'total_quantity',
  },
  {
    title: 'Scans',
    dataIndex: 'total_scans',
    key: 'total_scans',
    render: (value) => value ?? 0,
  },
  {
    title: 'Discount',
    dataIndex: 'total_discount',
    key: 'total_discount',
    render: (value) => formatCurrency(value),
  },
  {
    title: 'Amount',
    dataIndex: 'total_amount',
    key: 'total_amount',
    render: (value) => formatCurrency(value),
  },
];

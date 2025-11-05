import {
    UserOutlined,
    TeamOutlined,
    ShoppingOutlined,
    ShopOutlined,
    IdcardOutlined,
    TrophyOutlined,
    ScanOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    LineChartOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { Ticket } from 'lucide-react';


// Agent/POS specific stats
export const getAgentPOSSalesStats = (data = {}, userRole) => {
    const isAgent = userRole === 'Agent' || userRole === 'Sponsor' || userRole === 'Accreditation';
    const amount = isAgent ? data.agents : data.pos;
    const todayAmount = isAgent ? data.agentsToday : data.posToday;

    return [
        {
            title: 'Total Sales',
            value: amount || 0,
            icon: <DollarOutlined />,
            color: '#1890ff'
        },
        {
            title: 'Today Total',
            value: todayAmount || 0,
            icon: <DollarOutlined />,
            color: '#52c41a'
        }
    ];
};

export const getBookingTicketStats = (data = {}) => [
    {
      title: 'Total Booking',
      value: data.bookings?.total || 0,
      icon: <ShoppingOutlined />,
      color: '#1890ff'
    },
    {
      title: 'Today Booking',
      value: data.bookings?.today || 0,
      icon: <CalendarOutlined />,
      color: '#52c41a'
    },
    {
      title: 'Total Tickets',
      value: data.tickets?.total || 0,
      icon: <Ticket />,
      color: '#722ed1'
    },
    {
      title: 'Today Tickets',
      value: data.tickets?.today || 0,
      icon: <Ticket />,
      color: '#fa8c16'
    }
  ];

export const getPOSPaymentStats = (data = {}) => [
    {
        title: 'Total Cash',
        value: data.cash?.total || 0,
        today: data.cash?.today || 0
    },
    {
        title: 'Total UPI',
        value: data.upi?.total || 0,
        today: data.upi?.today || 0
    },
    {
        title: 'Total Card',
        value: data.nb?.total || 0,
        today: data.nb?.today || 0
    },
];

//end pos/agent stats

export const getAgentPaymentStats = (data = {}) => [
    {
        title: 'Total Cash',
        value: data.cash?.total || 0,
        today: data.cash?.today || 0
    },
    {
        title: 'Total UPI',
        value: data.upi?.total || 0,
        today: data.upi?.today || 0
    },
    {
        title: 'Total Net Banking',
        value: data.nb?.total || 0,
        today: data.nb?.today || 0
    },
];

export const getEventStats = (data = {}) => [
    {
        title: 'Ongoing',
        value: data.ongoing || 0,
        icon: <SyncOutlined />,
        color: '#1890ff',
    },
    {
        title: 'Upcoming',
        value: data.upcoming || 0,
        icon: <ClockCircleOutlined />,
        color: '#52c41a',
    },
    {
        title: 'Successful',
        value: data.successful || 0,
        icon: <CheckCircleOutlined />,
        color: '#fa8c16',
    }
];

export const getBookingStats = (data = {}) => [
    {
        title: 'Online Bookings',
        value: data.onlineBookings || 0,
        icon: <ShoppingOutlined />,
        color: '#1890ff',
    },
    {
        title: 'Online Tickets',
        value: data.onlineBookingsTicket || 0,
        icon: <LineChartOutlined />,
        color: '#52c41a',
    },
    {
        title: 'Offline Bookings',
        value: data.offlineBookings || 0,
        icon: <ShopOutlined />,
        color: '#722ed1',
    },
    {
        title: 'Offline Tickets',
        value: data.offlineBookingsTicket || 0,
        icon: <LineChartOutlined />,
        color: '#fa8c16',
    }
];

export const getUserStats = (data = {}) => [
    {
        title: 'Total Users',
        value: data.userCount || 0,
        icon: <UserOutlined />,
        color: '#1890ff'
    },
    {
        title: 'Agents',
        value: data.agentCount || 0,
        icon: <IdcardOutlined />,
        color: '#52c41a'
    },
    {
        title: 'Sponsors',
        value: data.sponsorCount || 0,
        icon: <TrophyOutlined />,
        color: '#faad14'
    },
    {
        title: 'POS',
        value: data.posCount || 0,
        icon: <ShopOutlined />,
        color: '#722ed1'
    },
    {
        title: 'Organizers',
        value: data.organizerCount || 0,
        icon: <TeamOutlined />,
        color: '#eb2f96'
    },
    {
        title: 'Scanners',
        value: data.scannerCount || 0,
        icon: <ScanOutlined />,
        color: '#13c2c2'
    }
];

export const getRevenueStats = (data = {}) => [
    {
        title: 'Online Amount',
        value: data.onlineAmount || 0,
        color: '#52c41a'
    },
    {
        title: 'POS Amount',
        value: data.posAmount || 0,
        color: '#1890ff'
    },
    {
        title: 'Agent Amount',
        value: data.agentAmount || 0,
        color: '#fa8c16'
    },
    {
        title: 'Sponsor Amount',
        value: data.sponsorAmount || 0,
        color: '#eb2f96'
    },
    {
        title: 'Total Offline Amount',
        value: data.offlineAmount || 0,
        color: '#722ed1'
    },
];

export const getDiscountData = (data = {}) => [
    { type: 'Online Discount', amount: data.onlineDiscount || 0 },
    { type: 'POS Discount', amount: data.posDiscount || 0 },
    { type: 'Sponsor Discount', amount: data.sponsorDiscount || 0 },
    { type: 'Agent Discount', amount: data.agentDiscount || 0 },
    { type: 'Offline Discount', amount: data.offlineDiscount || 0 }
];

export const getCncData = (data = {}) => [
    { type: 'Agent CNC', amount: data.agentCNC || 0 },
    { type: 'Online CNC', amount: data.onlineCNC || 0 },
    { type: 'Offline CNC', amount: data.offlineCNC || 0 },
    { type: 'POS CNC', amount: data.posCNC || 0 }
];

export const getGatewayData = (pgData) => {
    if (!pgData) return [];

    return Object.entries(pgData).map(([key, value]) => ({
        key,
        gateway: key.charAt(0).toUpperCase() + key.slice(1),
        active: value.active,
        today_total: value.today_total,
        all_total: value.all_total,
    }));
};

export const getGatewayColumns = (formatCurrency) => [
    {
        title: 'Payment Gateway',
        dataIndex: 'gateway',
        key: 'gateway',
        render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
        title: 'Status',
        dataIndex: 'active',
        key: 'active',
        render: (active) => (
            <span style={{ color: active ? '#52c41a' : '#ff4d4f' }}>
                {active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                {' '}
                {active ? 'Active' : 'Inactive'}
            </span>
        ),
    },
    {
        title: 'Today Collection',
        dataIndex: 'today_total',
        key: 'today_total',
        render: (amount) => formatCurrency(amount),
    },
    {
        title: 'Overall Collection',
        dataIndex: 'all_total',
        key: 'all_total',
        render: (amount) => formatCurrency(amount),
    },
];
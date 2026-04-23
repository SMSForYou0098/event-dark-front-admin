import React from 'react';
import { Card, Col, Row, Typography, Carousel, Avatar } from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { useMyContext } from 'Context/MyContextProvider';
import {
  ShoppingOutlined,
  DollarOutlined,
  ScanOutlined,
  GiftOutlined,
  PercentageOutlined,
  CreditCardOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil';
import { Ticket, Users } from 'lucide-react';
import { PERMISSIONS } from 'constants/PermissionConstant';
import usePermission from 'utils/hooks/usePermission';

const { Text } = Typography;

const ReportSummaryCards = ({ reportData, forceDesktopLayout = false }) => {
  const { isMobile } = useMyContext();
  const canViewPayout = usePermission(PERMISSIONS?.VIEW_GLOBAL_REPORT_PAYOUT);
  const shouldUseMobileLayout = isMobile && !forceDesktopLayout;

  const summary = reportData?.summary || {};
  const scanData = summary?.scan_data || {};
  const cards = [
    {
      title: 'Total Bookings',
      dataKey: 'total_bookings',
      color: '#1890ff',
      icon: <ShoppingOutlined />,
      items: [
        { label: 'Online', value: Number(summary?.total_bookings?.online || 0) },
        { label: 'Offline', value: Number(summary?.total_bookings?.offline || 0) },
      ],
    },
    {
      title: 'Total Tickets',
      dataKey: 'total_quantity',
      color: '#52c41a',
      icon: <Ticket />,
      items: [
        { label: 'Online', value: Number(summary?.total_quantity?.online || 0) },
        { label: 'Offline', value: Number(summary?.total_quantity?.offline || 0) },
      ],
    },
    {
      title: 'Total Amount',
      dataKey: 'total_amount',
      prefix: '₹',
      precision: 2,
      color: '#faad14',
      icon: <DollarOutlined />,
      items: [
        { label: 'Online', value: Number(summary?.total_amount?.online || 0) },
        { label: 'Offline', value: Number(summary?.total_amount?.offline || 0) },
      ],
    },
    {
      title: 'Total Scans',
      dataKey: 'total_scan',
      color: '#eb2f96',
      icon: <ScanOutlined />,
      items: [
        { label: 'Online', value: Number(scanData?.online || 0) },
        { label: 'Offline', value: Number((scanData?.offline || 0) + (scanData?.pos || 0)) },
      ],
    },
    {
      title: 'Total Discount',
      dataKey: 'total_discount',
      prefix: '₹',
      precision: 2,
      color: '#f5222d',
      icon: <GiftOutlined />,
      items: [
        { label: 'Online', value: Number(summary?.total_discount?.online || 0) },
        { label: 'Offline', value: Number(summary?.total_discount?.offline || 0) },
      ],
    },
    {
      title: 'System Users',
      dataKey: 'inner_users',
      color: '#1890ff',
      icon: <Users />,
      items: [
        { label: 'AG', value: summary?.inner_users?.Agent || 0 },
        { label: 'POS', value: summary?.inner_users?.POS || 0 },
        { label: 'SCN', value: summary?.inner_users?.Scanner || 0 },
        { label: 'SP', value: summary?.inner_users?.Sponsor || 0 },
      ]?.filter(item => Number(item.value) > 0),
    },
    ...(canViewPayout ? [
    {
      title: 'Total Commission',
      dataKey: 'total_commission',
      prefix: '₹',
      precision: 2,
      color: '#722ed1',
      icon: <PercentageOutlined />,
      items: [
        { label: 'Online', value: Number(summary?.total_commission?.online || 0) },
        { label: 'Offline', value: Number(summary?.total_commission?.offline || 0) },
      ],
    },
    {
      title: 'Total Convenience Fee',
      dataKey: 'total_convenience_fee',
      prefix: '₹',
      precision: 2,
      color: '#13c2c2',
      icon: <CreditCardOutlined />,
      items: [
        { label: 'Online', value: Number(summary?.total_convenience_fee?.online || 0) },
        { label: 'Offline', value: Number(summary?.total_convenience_fee?.offline || 0) },
      ],
    },
    {
      title: 'Total Payout',
      dataKey: 'total_payout',
      prefix: '₹',
      precision: 2,
      color: '#52c41a',
      icon: <WalletOutlined />,
      isCalculated: true,
      items: [
        { 
          label: 'Online', 
          value: Number(summary?.total_amount?.online || 0) - (Number(summary?.total_commission?.total || 0) * 1.18)
        },
        { 
          label: 'Offline', 
          value: Number(summary?.total_amount?.offline || 0) - (Number(summary?.total_commission?.total || 0) * 1.18)
        },
      ],
    },
    ] : []),
  ];

  const cardComponent = (card) => {
    const hasMultipleValues = card.items.length > 1;
    
    // Calculate main value with special handling for commission (add 18%) and payout
    let mainValue = Number(summary?.[card.dataKey]?.total || 0);
    if (card.dataKey === 'total_commission') {
      mainValue = mainValue * 1.18; // Add 18% to commission
    } else if (card.dataKey === 'total_payout') {
      // Total Payout = Online Amount Only - (Total Commission * 1.18)
      mainValue = Number(summary?.total_amount?.online || 0) - (Number(summary?.total_commission?.total || 0) * 1.18);
    }

    return (
      <Card size="small" title={card.title}
        extra={
          <Avatar
            size={40}
            shape='circle'
            icon={card.icon}
            style={{
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: getBackgroundWithOpacity(card.color, 0.15)
            }}
          />
        }
      >

        {/* Main value */}
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: '28px', fontWeight: '600' }}>
            {card.prefix || ''}
            {mainValue.toFixed(card.precision || 0)}
          </Text>
        </div>

        {/* Breakdown items - horizontal layout */}
        {hasMultipleValues ? (
          <Flex justifyContent="space-between" alignItems="center" gap={12}>
            {card.items.map((item) => {
              let itemValue = item.value;
              if (card.dataKey === 'total_commission') {
                itemValue = itemValue * 1.18; // Add 18% to commission breakdown
              }
              return (
                <Flex key={item.label} alignItems="center" gap={6} style={{ flex: 1 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4d4f', flexShrink: 0 }} />
                  <Text style={{ fontSize: '11px', margin: '0' }}>
                    {item.label === 'Online' ? 'ON' : item.label === 'Offline' ? 'OFF' : item.label}: {card.prefix || ''}{Number(itemValue).toFixed(card.precision || 0)}
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        ) : (
          card.items.map((item) => {
            let itemValue = item.value;
            if (card.dataKey === 'total_commission') {
              itemValue = itemValue * 1.18; // Add 18% to commission breakdown
            }
            return (
              <Flex key={item.label} alignItems="center" gap={6}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
                <Text style={{ fontSize: '11px', margin: '0' }}>
                  {item.label === 'Online' ? 'ON' : item.label === 'Offline' ? 'OFF' : item.label}: {card.prefix || ''}{Number(itemValue).toFixed(card.precision || 0)}
                </Text>
              </Flex>
            );
          })
        )}
      </Card>
    );
  };

  if (shouldUseMobileLayout) {
    return (
      <Carousel autoplay infinite dots={{ className: 'mt-3' }} style={{ width: '100%' }}>
        {cards.map((card) => (
          <div key={card.title} style={{ padding: '0 8px' }}>
            {cardComponent(card)}
          </div>
        ))}
      </Carousel>
    );
  }

  return (
    <Row gutter={[ROW_GUTTER]}>
      {cards.map((card) => (
        <Col
          key={card.title}
          {...(forceDesktopLayout
            ? { span: 4 }
            : { xs: 24, sm: 12, md: 8, lg: 4, xl: 4 })}
        >
          {cardComponent(card)}
        </Col>
      ))}
    </Row>
  );
};

export default ReportSummaryCards;

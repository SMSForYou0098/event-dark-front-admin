import React from 'react';
import { Card, Col, Row, Typography, Carousel, Avatar } from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { useMyContext } from 'Context/MyContextProvider';
import {
  ShoppingOutlined,
  FileOutlined,
  DollarOutlined,
  ScanOutlined,
  GiftOutlined,
  PercentageOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil';
import { Ticket } from 'lucide-react';

const { Text } = Typography;

const ReportSummaryCards = ({ reportData }) => {
  const { isMobile } = useMyContext();

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
  ];

  const cardComponent = (card) => {
    const hasMultipleValues = card.items.length > 1;

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
            {Number(summary?.[card.dataKey]?.total || 0).toFixed(card.precision || 0)}
          </Text>
        </div>

        {/* Breakdown items - horizontal layout */}
        {hasMultipleValues ? (
          <Flex justifyContent="space-between" alignItems="center" gap={12}>
            {card.items.map((item) => (
              <Flex key={item.label} alignItems="center" gap={6} style={{ flex: 1 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4d4f', flexShrink: 0 }} />
                <Text style={{ fontSize: '11px', margin: '0' }}>
                  {item.label === 'Online' ? 'ON' : 'OFF'}: {card.prefix || ''}{Number(item.value).toFixed(card.precision || 0)}
                </Text>
              </Flex>
            ))}
          </Flex>
        ) : (
          card.items.map((item) => (
            <Flex key={item.label} alignItems="center" gap={6}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
              <Text style={{ fontSize: '11px', margin: '0' }}>
                {item.label === 'Online' ? 'ON' : 'OFF'}: {card.prefix || ''}{Number(item.value).toFixed(card.precision || 0)}
              </Text>
            </Flex>
          ))
        )}
      </Card>
    );
  };

  if (isMobile) {
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
    <Row gutter={[ROW_GUTTER, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={24} sm={12} md={8} lg={6} xl={6}>
          {cardComponent(card)}
        </Col>
      ))}
    </Row>
  );
};

export default ReportSummaryCards;

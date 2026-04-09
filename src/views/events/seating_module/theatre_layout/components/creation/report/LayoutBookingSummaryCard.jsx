import React, { useEffect, useMemo } from 'react';
import { Card, Col, Divider, Row, Statistic, Typography, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const LayoutBookingSummaryCard = ({ eventKey }) => {
  const {
    data: summaryResponse,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['layout-booking-summary', eventKey],
    queryFn: async () => {
      const response = await api.get(`event/layout-booking-summary/${eventKey}`);
      return response?.data || response;
    },
    enabled: !!eventKey,
  });

  useEffect(() => {
    if (!isError) return;
    message.error(Utils.getErrorMessage(error, 'Failed to load layout booking summary'));
  }, [isError, error]);

  const stats = useMemo(() => {
    const payload = summaryResponse?.layout_booking_summary || {};
    const channels = payload?.booking_channels || {};

    return {
      totalSeats: payload?.total_seats ?? 0,
      bookedSeats: payload?.booked_seats ?? 0,
      availableSeats: payload?.available_seats ?? 0,
      blockedSeats: payload?.blocked_seats ?? 0,
      online: channels?.online ?? 0,
      offline: channels?.offline ?? 0,
      pos: channels?.pos ?? 0,
    };
  }, [summaryResponse]);

  return (
    <Card title="Layout Booking Report" size="small" loading={isPending}>
      <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 12 }}>
        Event Key: {eventKey || '-'}
      </div>
      {isError && (
        <Typography.Text type="danger" style={{ marginBottom: 8, display: 'block' }}>
          Failed to load summary data.
        </Typography.Text>
      )}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Seat Summary</div>
      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Statistic title="Total Seats" value={stats.totalSeats} />
        </Col>
        <Col span={12}>
          <Statistic title="Booked Seats" value={stats.bookedSeats} />
        </Col>
        <Col span={12}>
          <Statistic title="Available Seats" value={stats.availableSeats} />
        </Col>
        <Col span={12}>
          <Statistic title="Blocked Seats" value={stats.blockedSeats} />
        </Col>
      </Row>
      <Divider style={{ margin: '14px 0' }} />
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Booking Channels</div>
      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Statistic title="Online" value={stats.online} />
        </Col>
        <Col span={12}>
          <Statistic title="Offline" value={stats.offline} />
        </Col>
        <Col span={12}>
          <Statistic title="POS" value={stats.pos} />
        </Col>
      </Row>
    </Card>
  );
};

export default LayoutBookingSummaryCard;

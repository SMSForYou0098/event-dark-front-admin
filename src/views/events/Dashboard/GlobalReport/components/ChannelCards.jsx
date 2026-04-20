import React from 'react';
import { Card, Col, Row } from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { formatCurrency } from '../utils/reportHelpers';

const ChannelCards = ({ reportData, showOnlineCard, showOfflineCard, channelCardMdSpan }) => {
  return (
    <Row gutter={[ROW_GUTTER]} className="mt-1">
      {showOnlineCard && (
        <Col xs={24} md={channelCardMdSpan}>
          <Card size="small" title="Online">
            <Row gutter={[12, 12]}>
              <Col span={12}><strong>Bookings:</strong> {reportData?.online?.booking_count || 0}</Col>
              <Col span={12}><strong>Amount:</strong> {formatCurrency(reportData?.online?.total_amount)}</Col>
              <Col span={12}><strong>Quantity:</strong> {reportData?.online?.total_quantity || 0}</Col>
              <Col span={12}><strong>Discount:</strong> {formatCurrency(reportData?.online?.total_discount)}</Col>
            </Row>
          </Card>
        </Col>
      )}

      {showOfflineCard && (
        <Col xs={24} md={channelCardMdSpan}>
          <Card size="small" title="Offline">
            <Row gutter={[12, 12]}>
              <Col span={12}><strong>Bookings:</strong> {reportData?.offline?.totals?.booking_count || 0}</Col>
              <Col span={12}><strong>Amount:</strong> {formatCurrency(reportData?.offline?.totals?.total_amount)}</Col>
              <Col span={12}><strong>Quantity:</strong> {reportData?.offline?.totals?.total_quantity || 0}</Col>
              <Col span={12}><strong>Discount:</strong> {formatCurrency(reportData?.offline?.totals?.total_discount)}</Col>
            </Row>
            <div className="mt-3"><strong>POS Bookings:</strong> {reportData?.offline?.pos?.booking_count || 0}</div>
            <div><strong>POS Amount:</strong> {formatCurrency(reportData?.offline?.pos?.total_amount)}</div>
          </Card>
        </Col>
      )}
    </Row>
  );
};

export default ChannelCards;

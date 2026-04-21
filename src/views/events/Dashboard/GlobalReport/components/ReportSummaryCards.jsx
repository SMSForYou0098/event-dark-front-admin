import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { Text } = Typography;
const INLINE_BREAKDOWN_FONT_SIZE = 12;

const InlineBreakdownRow = ({ items }) => {
  const visibleItems = (items || []).filter(Boolean).slice(0, 3);
  const columnCount = visibleItems.length >= 3 ? 3 : 2;
  const colProps =
    columnCount === 3
      ? { xs: 12, sm: 12, md: 12, lg: 8 }
      : { xs: 12, sm: 12, md: 12, lg: 12 };

  return (
    <Row gutter={[8, 4]} className="mt-1">
      {visibleItems.map((item) => (
        <Col key={item.label} {...colProps}>
          <div className="d-flex align-items-center">
            <Text
              type="secondary"
              style={{ fontSize: INLINE_BREAKDOWN_FONT_SIZE, whiteSpace: 'nowrap' }}
            >
              {item.label}:
            </Text>
            <Text
              className="ml-1"
              style={{ fontSize: INLINE_BREAKDOWN_FONT_SIZE, whiteSpace: 'nowrap' }}
            >
              {item.value}
            </Text>
          </div>
        </Col>
      ))}
    </Row>
  );
};

const ReportSummaryCards = ({ reportData, isSingleEventSelected = false }) => {
  const summary = reportData?.summary || {};
  const scanData = summary?.scan_data || {};

  return (
    <Row gutter={[ROW_GUTTER, 16]}>
      <Col xs={24} sm={12} md={8} lg={isSingleEventSelected ? 5 : 8}>
        <Card size="small" className="h-100">
          <Statistic title="Total Bookings" value={Number(summary?.total_bookings?.total || 0)} />
          <InlineBreakdownRow
            items={[
              { label: 'Online', value: Number(summary?.total_bookings?.online || 0) },
              { label: 'Offline', value: Number(summary?.total_bookings?.offline || 0) },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={isSingleEventSelected ? 5 : 8}>
        <Card size="small" className="h-100">
          <Statistic title="Total Tickets" value={Number(summary?.total_quantity?.total || 0)} />
          <InlineBreakdownRow
            items={[
              { label: 'Online', value: Number(summary?.total_quantity?.online || 0) },
              { label: 'Offline', value: Number(summary?.total_quantity?.offline || 0) },
            ]}
          />
        </Card>
      </Col>
       <Col xs={24} sm={12} md={8} lg={isSingleEventSelected ? 5 : 8}>
        <Card size="small" className="h-100">
          <Statistic
            title="Total Amount"
            value={Number(summary?.total_amount?.total || 0)}
            precision={2}
            prefix="₹"
          />
          <InlineBreakdownRow
            items={[
              { label: 'Online', value: Number(summary?.total_amount?.online || 0) },
              { label: 'Offline', value: Number(summary?.total_amount?.offline || 0) },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={isSingleEventSelected ? 4 : 8}>
        <Card size="small" className="h-100">
          <Statistic title="Total Scans" value={Number(summary?.total_scan?.total || 0)} />
          <InlineBreakdownRow
            items={[
              { label: 'Online', value: Number(scanData?.online || 0) },
              { label: 'Offline', value: Number((scanData?.offline || 0) + (scanData?.pos || 0)) },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={isSingleEventSelected ? 5 : 8}>
        <Card size="small" className="h-100">
          <Statistic
            title="Total Discount"
            value={Number(summary?.total_discount?.total || 0)}
            precision={2}
            prefix="₹"
          />
          <InlineBreakdownRow
            items={[
              { label: 'Online', value: Number(summary?.total_discount?.online || 0) },
              { label: 'Offline', value: Number(summary?.total_discount?.offline || 0) },
            ]}
          />
        </Card>
      </Col>
      
    </Row>
  );
};

export default ReportSummaryCards;

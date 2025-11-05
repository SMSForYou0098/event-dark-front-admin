import React from 'react';
import { Card, Row, Col, Tag } from 'antd';
import CountUp from 'react-countup';

const PaymentStatsCard = ({ title, value, today }) => (
  <Col xs={24} sm={12} lg={8}>
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card bordered hoverable>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontWeight: 500, color: "#333" }}>{title}</span>
            <Tag color="blue">Total</Tag>
          </div>
          <h2 style={{ marginBottom: 0 }}>
            ₹<CountUp start={0} end={value || 0} duration={3} separator="," />
          </h2>
          <small>Available to pay out.</small>
        </Card>
      </Col>

      <Col span={24}>
        <Card bordered hoverable>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontWeight: 500, color: "#333" }}>
              Today {title.split(" ").pop()}
            </span>
            <Tag color="blue">Today</Tag>
          </div>
          <h2 style={{ marginBottom: 0 }}>
            ₹<CountUp start={0} end={today || 0} duration={3} separator="," />
          </h2>
          <small>Transactions today</small>
        </Card>
      </Col>
    </Row>
  </Col>
);

export default PaymentStatsCard;
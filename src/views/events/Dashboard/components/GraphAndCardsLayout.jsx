import React from 'react';
import { Row, Col, Card } from 'antd';
import Chart from 'react-apexcharts';
import DataCard from '../Admin/DataCard';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import PaymentStatsCard from './PaymentStatsCard';
import { getAgentPaymentStats, getPOSPaymentStats } from './dashboardConfig';

const GraphAndCardsLayout = ({
  graphTitle,
  graphValue,
  chartOptions,
  chartSeries,
  convChartOptions,
  convChartSeries,
  convGraphTitle,
  cards1,
  cards2,
  isAgent,
  sale,
}) => {
    const paymentStats = isAgent 
    ? getAgentPaymentStats(sale) 
    : getPOSPaymentStats(sale);
  return (
    <>
      {/* Graph Section */}
      <Col xs={24} lg={12}>
        <Card
          title={graphTitle}
          bordered={false}
          extra={
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
              ₹{graphValue?.toLocaleString('en-IN') || 0}
            </h3>
          }
        >
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={280}
          />
        </Card>
        <Card
          title={convGraphTitle}
          bordered={false}
          extra={
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
              ₹{graphValue?.toLocaleString('en-IN') || 0}
            </h3>
          }
        >
          <Chart
            options={convChartOptions}
            series={convChartSeries}
            type="bar"
            height={280}
          />
        </Card>
      </Col>

      {/* Cards Section 1 */}
      <Col xs={24} lg={12}>
        <Row gutter={[ROW_GUTTER]}>
          <Col xs={24} lg={24}>
            <Row gutter={[16, 16]}>
              {cards1?.map((card, index) => (
                <Col xs={24} sm={12} key={`card1-${index}`}>
                  <DataCard data={card} value={card.value} />
                </Col>
              ))}
              {cards2?.map((card, index) => (
                <Col xs={24} sm={12} md={6} key={`card2-${index}`}>
                  <DataCard data={card} value={card.value} />
                </Col>
              ))}
              {paymentStats.map((card, i) => (
                <PaymentStatsCard key={i} {...card} />
              ))}
            </Row>
          </Col>
        </Row>
      </Col>
    </>
  );
};

export default GraphAndCardsLayout;
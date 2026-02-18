import React from 'react';
import { Card, Typography, Row, Col, Tag } from 'antd';
// previously used table arrows removed
import CountUp from 'react-countup';
import { Users } from 'lucide-react';

const { Title, Text } = Typography;

const GatewayWiseSales = ({ gatewayData = [], channelData = [], formatCurrency, showToday = true }) => {


    // Calculate totals for gateway data
    const gatewayTotals = gatewayData.reduce((acc, item) => {
        acc.todayCount += item.today.count;
        acc.todayAmount += item.today.amount;
        acc.yesterdayCount += item.yesterday.count;
        acc.yesterdayAmount += item.yesterday.amount;
        acc.totalCount += item.total.count;
        acc.totalAmount += item.total.amount;
        return acc;
    }, { todayCount: 0, todayAmount: 0, yesterdayCount: 0, yesterdayAmount: 0, totalCount: 0, totalAmount: 0 });

    // Channel totals are available if needed; currently not rendered in UI

    // We now render data as SalesCard grid; totals calculated above are used for the summary card

    return (
        <Row gutter={[16, 16]}>
            {/* Payment Gateway Summary rendered as cards */}
            <Col xs={24}>
                <div style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 16 }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Title level={5} style={{ margin: 0 }}>Payment Gateway Wise Sales</Title>
                    </div>
                    <Row gutter={[16, 16]}>
                        {gatewayData && gatewayData.length > 0 ? (
                            gatewayData.map((g) => (
                                <React.Fragment key={g.label}>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                                        <SalesCard
                                            title={g.label}
                                            value={g.today?.amount || 0}
                                            subtitle={`${g.today?.count || 0} bookings today`}
                                            badgeLabel="Today"
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                                        <SalesCard
                                            title={g.label}
                                            value={g.yesterday?.amount || 0}
                                            subtitle={`${g.yesterday?.count || 0} bookings yesterday`}
                                            badgeLabel="Yesterday"
                                        />
                                    </Col>
                                </React.Fragment>
                            ))
                        ) : (
                            <Col xs={24}><Text type="secondary">No gateway data available</Text></Col>
                        )}

                        {/* Total cards for Today & Yesterday */}
                        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                            <SalesCard
                                title="Total"
                                value={gatewayTotals.todayAmount}
                                subtitle={`${gatewayTotals.todayCount} bookings today`}
                                badgeLabel="Today"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                            <SalesCard
                                title="Total"
                                value={gatewayTotals.yesterdayAmount}
                                subtitle={`${gatewayTotals.yesterdayCount} bookings yesterday`}
                                badgeLabel="Yesterday"
                            />
                        </Col>
                    </Row>
                </div>
            </Col>

            {/* Channel Summary rendered as cards */}
            <Col xs={24}>
                <div style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 16, }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Title level={5} style={{ margin: 0 }}>Channel Wise Sales</Title>
                    </div>
                    <Row gutter={[16, 16]}>
                        {channelData && channelData.length > 0 ? (
                            channelData.map((c) => (
                                <React.Fragment key={c.label}>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                                        <SalesCard
                                            title={c.label}
                                            value={c.today?.amount || 0}
                                            subtitle={`${c.today?.count || 0} bookings today`}
                                            badgeLabel="Today"
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                                        <SalesCard
                                            title={c.label}
                                            value={c.yesterday?.amount || 0}
                                            subtitle={`${c.yesterday?.count || 0} bookings yesterday`}
                                            badgeLabel="Yesterday"
                                        />
                                    </Col>
                                </React.Fragment>
                            ))
                        ) : (
                            <Col xs={24}><Text type="secondary">No channel data available</Text></Col>
                        )}

                        {/* Total cards for Today & Yesterday */}
                        {/* <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                            <SalesCard
                                title="Total"
                                value={channelTotals.todayAmount}
                                subtitle={`${channelTotals.todayCount} bookings today`}
                                badgeLabel="Today"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                            <SalesCard
                                title="Total"
                                value={channelTotals.yesterdayAmount}
                                subtitle={`${channelTotals.yesterdayCount} bookings yesterday`}
                                badgeLabel="Yesterday"
                            />
                        </Col> */}
                    </Row>
                </div>
            </Col>
        </Row>
    );
};

const SalesCard = ({ title, value, subtitle, badgeLabel, symbol }) => {
    return (
        <Card >
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                {badgeLabel && <Tag color='cyan'>{badgeLabel}</Tag>}
            </div>

            <div className="d-flex align-items-center" style={{ gap: symbol === 'user' ? 4 : 0 }}>
                {symbol === 'user' ? (
                    <Users size={16} color="grey" />
                ) : (
                    <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>₹</span>
                )}
                <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                    <CountUp start={0} end={Number(value) || 0} duration={1.5} useEasing separator="," />
                </span>
            </div>

            {subtitle && <div className='text-warning' >{subtitle}</div>}
        </Card>
    );
};

export default GatewayWiseSales;
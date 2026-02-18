import React from 'react';
import { Row, Col, Typography, Carousel } from 'antd';
import DataCard from '../Admin/DataCard';

const { Title } = Typography;

const StatSection = ({
    title,
    stats,
    colConfig = {
        xs: 24,
        sm: 12,
        md: 8,
        lg: 6,
        xl: 4,
        style: { flex: '1 1 20%', maxWidth: window.innerWidth <= 768 ? '100%' : '20%' }
    },
    extraHeader,
    containerCol = { xs: 24, md: 24 },
    isMobile = false
}) => {
    const renderCard = (stat, index) => (
        <DataCard data={stat} value={stat.value} key={`card-${index}`} />
    );

    const renderContent = () => {
        if (isMobile) {
            return (
                <Col span={24}>
                    <Carousel dots swipeToSlide draggable>
                        {stats.map((stat, index) => (
                            <div key={`carousel-${index}`} style={{ padding: '0 8px' }}>
                                {renderCard(stat, index)}
                            </div>
                        ))}
                    </Carousel>
                </Col>
            );
        }

        return stats.map((stat, index) => (
            <Col {...colConfig} key={`col-${index}`}>
                {renderCard(stat, index)}
            </Col>
        ));
    };

    return (
        <Col {...containerCol}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Title
                        level={4}
                        className={extraHeader ? 'd-flex justify-content-between mb-3' : 'mt-0 mb-3'}
                    >
                        {title}
                        {extraHeader}
                    </Title>
                </Col>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {renderContent()}
                    </Row>
                </Col>
            </Row>
        </Col>
    );
};

export default StatSection;
import React, { useEffect, useRef, useState } from 'react';
import { Typography, Empty, Carousel, Row, Col, Collapse } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

const EventCards = ({ data = [] }) => {
  const carouselRef = useRef(null);
  const [cardsPerSlide, setCardsPerSlide] = useState(4);

  const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

  const sampleData = [
    {
      name: 'VADODARA MARATHON - SAAREE RUN',
      tickets: [{ name: 'RUN TICKET', count: 54, total_amount: 0 }]
    },
    {
      name: 'Neon Midnight Party',
      tickets: [{ name: 'SILVER', count: 2, total_amount: 798 }]
    },
    {
      name: 'Dr Kumar Vishwas Live',
      tickets: [                      
        { name: 'SILVER', count: 13, total_amount: 13000 },
        { name: 'GOLD', count: 2, total_amount: 3000 },
        { name: 'PLATINUM', count: 8, total_amount: 15000 }
      ]
    }
  ];

  const displayData = Array.isArray(data) && data.length > 0 ? data : sampleData;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1400) setCardsPerSlide(4);
      else if (window.innerWidth >= 992) setCardsPerSlide(3);
      else if (window.innerWidth >= 768) setCardsPerSlide(2);
      else setCardsPerSlide(1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!displayData || displayData.length === 0) {
    return <Empty description="No event data available" />;
  }

  // split into slides
  const slides = [];
  for (let i = 0; i < displayData.length; i += cardsPerSlide) {
    slides.push(displayData.slice(i, i + cardsPerSlide));
  }

  const TicketTable = ({ tickets }) => {
    const filtered = (tickets || []).filter(t => Number(t?.count) > 0);
    if (filtered.length === 0) return <Empty description="No tickets sold" />;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', }}>
          <Text style={{ fontSize: 12,  fontWeight: 600 }}>Ticket</Text>
          <Text style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Qty</Text>
          <Text style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>Amount</Text>
        </div>
        {filtered.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', padding: '10px 12px', borderBottom: i < filtered.length - 1 ? '1px solid #f6f6f6' : 'none', alignItems: 'center' }}>
            <Text>{t.name}</Text>
            <Text style={{ textAlign: 'center' }}>{t.count}</Text>
            <Text style={{ textAlign: 'right' }}>{formatCurrency(t.total_amount)}</Text>
          </div>
        ))}
      </div>
    );
  };

  const NavigationButton = ({ direction, onClick }) => (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        [direction === 'left' ? 'left' : 'right']: 12,
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: '#b51515',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      {direction === 'left' ? <LeftOutlined /> : <RightOutlined />}
    </button>
  );

  return (
    <div style={{ position: 'relative', padding: 16 }}>
      {slides.length > 1 && (
        <>
          <NavigationButton direction="left" onClick={() => carouselRef.current?.prev()} />
          <NavigationButton direction="right" onClick={() => carouselRef.current?.next()} />
        </>
      )}

      <Carousel ref={carouselRef} dots={false} infinite={slides.length > 1} slidesToShow={1} slidesToScroll={1}>
        {slides.map((slide, sIdx) => (
          <div key={sIdx}>
            <Row gutter={[16, 16]} style={{ padding: '8px 4px' }}>
              {slide.map((event, eIdx) => (
                <Col key={eIdx} xs={24} sm={12} md={12} lg={24 / cardsPerSlide}>
                  <Collapse bordered={false} expandIconPosition="end" className="event-accordion">
                    <Collapse.Panel
                      key={event.name || eIdx}
                      header={<Text style={{ fontSize: 14, fontWeight: 600 }} ellipsis={{ tooltip: event?.name }}>{event?.name}</Text>}
                      extra={null}
                    >
                      <TicketTable tickets={event?.tickets || []} />
                    </Collapse.Panel>
                  </Collapse>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Carousel>

      
    </div>
  );
};

export default EventCards;

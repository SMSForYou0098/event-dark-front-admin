import React, { useEffect, useRef, useState } from 'react';
import { Typography, Empty, Carousel, Row, Col, Collapse, Card } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { PRIMARY } from 'utils/consts';

const { Text } = Typography;

const EventCards = ({ data = [] }) => {
  const carouselRef = useRef(null);
  const [cardsPerSlide, setCardsPerSlide] = useState(4);

  const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;


  const displayData = Array.isArray(data) && data.length > 0 ? data : [];

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

  const hasCarouselArrows = slides.length > 1;
  const shouldAddArrowGap = hasCarouselArrows && (cardsPerSlide === 4 || cardsPerSlide === 1);
  const carouselSideGap = shouldAddArrowGap ? 64 : 0;

  const TicketTable = ({ tickets }) => {
    const filtered = (tickets || []).filter(t => Number(t?.count) > 0);
    if (filtered.length === 0) return <Empty description="No tickets sold" />;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', padding: '8px 12px', borderBottom: '1px solid #f0f0f0', }}>
          <Text style={{ fontSize: 12, fontWeight: 600 }}>Ticket</Text>
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
        backgroundColor: PRIMARY,
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
    <div style={{
      position: 'relative',
      padding: '16px 0',
    }}>
      {hasCarouselArrows && (
        <>
          <NavigationButton direction="left" onClick={() => carouselRef.current?.prev()} />
          <NavigationButton direction="right" onClick={() => carouselRef.current?.next()} />
        </>
      )}

      <div style={{ marginLeft: carouselSideGap, marginRight: carouselSideGap }}>
        <Carousel ref={carouselRef} dots={false} infinite={hasCarouselArrows} slidesToShow={1} slidesToScroll={1}>
          {slides.map((slide, sIdx) => (
            <div key={sIdx}>
              <Row gutter={[16, 16]}>
                {slide.map((event, eIdx) => (
                  <Col key={eIdx} xs={24} sm={12} md={12} lg={24 / cardsPerSlide}>
                    <Card className='p-0 m-0' bodyStyle={{ padding: '0px 10px' }}>
                      <Collapse bordered={false} expandIconPosition="end" className="event-accordion">
                        <Collapse.Panel
                          key={event?.name || eIdx}
                          header={
                            <Text
                              style={{ margin: 0, fontWeight: 600 }}
                              ellipsis={{ tooltip: event?.name }}
                            >
                              {event?.name}
                            </Text>
                          }
                          extra={null}
                        >
                          <TicketTable tickets={event?.tickets || []} />
                        </Collapse.Panel>
                      </Collapse>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Carousel>
      </div>


    </div>
  );
};

export default EventCards;

import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Button, Space, Tag, Divider, Alert, Statistic } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import StadiumCanvasViewer from '../StadiumCanvasViewer';
import { useMyContext } from 'Context/MyContextProvider';

const { Title, Text, Paragraph } = Typography;

// Generate a large stadium for performance testing
const generateLargeStadium = (standCount = 8, tiersPerStand = 3, sectionsPerTier = 4, rowsPerSection = 15, seatsPerRow = 25) => {
  const stands = [];
  
  for (let s = 0; s < standCount; s++) {
    const tiers = [];
    
    for (let t = 0; t < tiersPerStand; t++) {
      const sections = [];
      
      for (let sec = 0; sec < sectionsPerTier; sec++) {
        const rows = [];
        
        for (let r = 0; r < rowsPerSection; r++) {
          const seatList = [];
          const actualSeats = seatsPerRow + Math.floor(r * 1.5); // Rows get wider
          
          for (let seat = 0; seat < actualSeats; seat++) {
            seatList.push({
              id: `stand-${s}-tier-${t}-sec-${sec}-row-${r}-seat-${seat}`,
              number: seat + 1,
              price: 500 + (tiersPerStand - t) * 200 + (standCount - s) * 50,
              status: Math.random() > 0.15 ? 'available' : (Math.random() > 0.5 ? 'booked' : 'blocked'),
              isBooked: Math.random() < 0.1,
            });
          }
          
          rows.push({
            id: `stand-${s}-tier-${t}-sec-${sec}-row-${r}`,
            label: `Row ${String.fromCharCode(65 + r)}`,
            seats: actualSeats,
            seatList,
            price: 500 + (tiersPerStand - t) * 200,
          });
        }
        
        sections.push({
          id: `stand-${s}-tier-${t}-sec-${sec}`,
          name: `Section ${sec + 1}`,
          rows,
        });
      }
      
      tiers.push({
        id: `stand-${s}-tier-${t}`,
        name: `Tier ${t + 1}`,
        sections,
        price: 500 + (tiersPerStand - t) * 200,
      });
    }
    
    stands.push({
      id: `stand-${s}`,
      name: `Stand ${String.fromCharCode(65 + s)}`,
      visualWeight: 1 + (s % 3) * 0.3,
      tiers,
    });
  }
  
  return stands;
};

// Preset configurations
const PRESETS = {
  small: { stands: 4, tiers: 2, sections: 2, rows: 8, seats: 15, label: 'Small Venue (~2,000 seats)' },
  medium: { stands: 6, tiers: 3, sections: 3, rows: 12, seats: 20, label: 'Medium Stadium (~13,000 seats)' },
  large: { stands: 8, tiers: 3, sections: 4, rows: 15, seats: 25, label: 'Large Stadium (~36,000 seats)' },
  massive: { stands: 12, tiers: 4, sections: 5, rows: 20, seats: 30, label: 'International Stadium (~72,000 seats)' },
};

const CanvasStadiumDemo = () => {
  const { isMobile, successAlert } = useMyContext();
  const [selectedPreset, setSelectedPreset] = useState('medium');
  const [bookedSeats, setBookedSeats] = useState([]);
  
  const preset = PRESETS[selectedPreset];
  
  const stadiumData = useMemo(() => 
    generateLargeStadium(preset.stands, preset.tiers, preset.sections, preset.rows, preset.seats),
    [preset]
  );
  
  // Calculate total seats
  const totalSeats = useMemo(() => {
    let count = 0;
    stadiumData.forEach(stand => {
      stand.tiers?.forEach(tier => {
        tier.sections?.forEach(section => {
          section.rows?.forEach(row => {
            count += row.seatList?.length || row.seats || 0;
          });
        });
      });
    });
    return count;
  }, [stadiumData]);
  
  const handleBookingSubmit = (seats) => {
    setBookedSeats(seats);
    successAlert('Booking Confirmed!', `Successfully booked ${seats.length} seats for ₹${seats.reduce((sum, s) => sum + (s.price || 0), 0).toFixed(2)}`);
  };
  
  return (
    <div style={{ marginTop: '5.5rem', padding: isMobile ? 12 : 24 }}>
      {/* Header */}
      <div className="mb-4">
        <Space align="center" style={{ marginBottom: 8 }}>
          <ThunderboltOutlined style={{ fontSize: 28, color: '#faad14' }} />
          <Title level={2} style={{ margin: 0, color: '#fff' }}>
            Canvas-Based Stadium Viewer
          </Title>
          <Tag color="gold">Performance Demo</Tag>
        </Space>
        <Paragraph style={{ color: '#94a3b8', maxWidth: 800 }}>
          This demo showcases the Canvas-based rendering engine capable of handling 
          large stadiums with 50,000+ seats. Select a preset below to test different 
          venue sizes.
        </Paragraph>
      </div>
      
      {/* Preset Selection */}
      <Card 
        className="mb-4"
        style={{ background: 'var(--component-bg)', borderColor: 'var(--border-secondary)' }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between" style={{ gap: 16 }}>
          <div>
            <Text strong style={{ color: '#fff', fontSize: 16 }}>Select Venue Size</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {Object.entries(PRESETS).map(([key, value]) => (
                  <Button
                    key={key}
                    type={selectedPreset === key ? 'primary' : 'default'}
                    onClick={() => setSelectedPreset(key)}
                    icon={key === 'massive' ? <RocketOutlined /> : null}
                  >
                    {value.label}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
          
          <div className="d-flex" style={{ gap: 24 }}>
            <Statistic 
              title={<Text style={{ color: '#94a3b8' }}>Total Seats</Text>}
              value={totalSeats.toLocaleString()}
              valueStyle={{ color: '#4CAF50', fontWeight: 700 }}
              prefix={<BarChartOutlined />}
            />
            <Statistic 
              title={<Text style={{ color: '#94a3b8' }}>Stands</Text>}
              value={preset.stands}
              valueStyle={{ color: '#2196F3' }}
            />
            <Statistic 
              title={<Text style={{ color: '#94a3b8' }}>Tiers/Stand</Text>}
              value={preset.tiers}
              valueStyle={{ color: '#FF9800' }}
            />
          </div>
        </div>
      </Card>
      
      {/* Performance Info */}
      {selectedPreset === 'massive' && (
        <Alert
          message="Performance Test Mode"
          description="You're viewing a stadium with 70,000+ seats. The Canvas renderer handles this smoothly without DOM overhead. Try zooming and panning!"
          type="info"
          showIcon
          icon={<RocketOutlined />}
          className="mb-4"
          style={{ background: 'rgba(33, 150, 243, 0.1)', borderColor: 'rgba(33, 150, 243, 0.3)' }}
        />
      )}
      
      {/* Main Viewer */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={18}>
          <Card 
            style={{ 
              background: 'var(--component-bg)', 
              borderColor: 'var(--border-secondary)',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <StadiumCanvasViewer
              standsData={stadiumData}
              handleSubmit={handleBookingSubmit}
              height={isMobile ? 500 : 700}
              isUser={true}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={6}>
          {/* Info Panel */}
          <Card 
            title={<Text style={{ color: '#fff' }}>How It Works</Text>}
            style={{ background: 'var(--component-bg)', borderColor: 'var(--border-secondary)' }}
            className="mb-3"
          >
            <Space direction="vertical" size="middle">
              <div>
                <CheckCircleOutlined style={{ color: '#4CAF50', marginRight: 8 }} />
                <Text style={{ color: '#e5e7eb' }}>Click any stand to drill down</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#4CAF50', marginRight: 8 }} />
                <Text style={{ color: '#e5e7eb' }}>Select tier → section → seats</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#4CAF50', marginRight: 8 }} />
                <Text style={{ color: '#e5e7eb' }}>Canvas renders 1000s of seats</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#4CAF50', marginRight: 8 }} />
                <Text style={{ color: '#e5e7eb' }}>Zoom & pan for navigation</Text>
              </div>
            </Space>
          </Card>
          
          {/* Booked Seats */}
          {bookedSeats.length > 0 && (
            <Card 
              title={<Text style={{ color: '#fff' }}>Last Booking</Text>}
              style={{ background: 'var(--component-bg)', borderColor: 'var(--border-secondary)' }}
            >
              <Space direction="vertical" className="w-100">
                <div className="d-flex justify-content-between">
                  <Text style={{ color: '#94a3b8' }}>Seats:</Text>
                  <Text strong style={{ color: '#fff' }}>{bookedSeats.length}</Text>
                </div>
                <div className="d-flex justify-content-between">
                  <Text style={{ color: '#94a3b8' }}>Total:</Text>
                  <Text strong style={{ color: '#4CAF50' }}>
                    ₹{bookedSeats.reduce((sum, s) => sum + (s.price || 0), 0).toFixed(2)}
                  </Text>
                </div>
                <Divider style={{ margin: '12px 0', borderColor: 'var(--border-secondary)' }} />
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {bookedSeats.slice(0, 10).map(seat => (
                    <Tag key={seat.id} style={{ marginBottom: 4 }}>
                      {seat.rowLabel} - Seat {seat.number}
                    </Tag>
                  ))}
                  {bookedSeats.length > 10 && (
                    <Text type="secondary">+{bookedSeats.length - 10} more...</Text>
                  )}
                </div>
              </Space>
            </Card>
          )}
          
          {/* Technical Info */}
          <Card 
            title={<Text style={{ color: '#fff' }}>Technical Details</Text>}
            style={{ background: 'var(--component-bg)', borderColor: 'var(--border-secondary)', marginTop: 16 }}
            size="small"
          >
            <Space direction="vertical" size="small" className="w-100">
              <div className="d-flex justify-content-between">
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>Renderer:</Text>
                <Tag color="blue" style={{ margin: 0 }}>HTML5 Canvas</Tag>
              </div>
              <div className="d-flex justify-content-between">
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>Seat Elements:</Text>
                <Text style={{ color: '#fff', fontSize: 12 }}>{totalSeats.toLocaleString()}</Text>
              </div>
              <div className="d-flex justify-content-between">
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>DOM Nodes:</Text>
                <Text style={{ color: '#4CAF50', fontSize: 12 }}>~50 (vs {totalSeats.toLocaleString()} SVG)</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CanvasStadiumDemo;


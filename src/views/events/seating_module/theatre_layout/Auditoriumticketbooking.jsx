import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image as KonvaImage } from 'react-konva';
import {
  ShoppingCartOutlined,
  CloseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  BorderOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { Button, Card, Tag, Space, Modal, Descriptions, message } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { MdOutlineChair, MdOutlineTableBar } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { FaChair } from 'react-icons/fa';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';
import { PRIMARY } from 'utils/consts';
import './Auditoriumticketbooking.css';
import api from 'auth/FetchInterceptor';

// Icon Image Component - Same as admin canvas
const IconImage = ({ iconName, x, y, size = 20 }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!iconName) return;

    const iconMap = {
      'FaChair': FaChair,
      'MdOutlineChair': MdOutlineChair,
      'PiArmchairLight': PiArmchairLight,
      'PiChair': PiChair,
      'PiOfficeChair': PiOfficeChair,
      'LuSofa': LuSofa,
      'TbSofa': TbSofa,
      'GiRoundTable': GiRoundTable,
      'SiTablecheck': SiTablecheck,
      'MdOutlineTableBar': MdOutlineTableBar
    };

    const IconComponent = iconMap[iconName];
    if (!IconComponent) return;

    const svgString = renderToStaticMarkup(
      <IconComponent size={size} color="#FFFFFF" />
    );

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [iconName, size]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      listening={false}
    />
  );
};

const AuditoriumTicketBooking = ({ layoutId, eventDetails }) => {
  // State Management
  const [stage, setStage] = useState(null);
  const [sections, setSections] = useState([]);
  const [ticketCategories, setTicketCategories] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const stageRef = useRef();
  const layerRef = useRef();

  // Load Layout
  useEffect(() => {
    loadLayout();
  }, [layoutId]);

  const loadLayout = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/auditorium/layout/${2}`);
      const data = response.data;

      setStage(data.stage);
      setSections(data.sections || []);
      setTicketCategories(data.ticketCategories || []);
      message.success('Layout loaded successfully!');
    } catch (error) {
      console.error('Error loading layout:', error);
      message.error(`Failed to load layout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Seat Click for Selection
  const handleSeatClick = (seat, sectionId, rowId) => {
    // Don't allow selection of unavailable seats
    if (seat.status === 'disabled' || seat.status === 'reserved' || seat.status === 'blocked') {
      message.warning('This seat is not available for booking');
      return;
    }

    const seatIdentifier = `${sectionId}-${rowId}-${seat.id}`;
    const isSelected = selectedSeats.some(s => s.identifier === seatIdentifier);

    if (isSelected) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(s => s.identifier !== seatIdentifier));
      message.info(`Seat ${seat.label} removed from selection`);
    } else {
      // Select seat
      const section = sections.find(s => s.id === sectionId);
      const row = section?.rows.find(r => r.id === rowId);
      const category = ticketCategories.find(c => c.id === seat.ticketCategory);

      setSelectedSeats([...selectedSeats, {
        identifier: seatIdentifier,
        sectionId,
        rowId,
        seatId: seat.id,
        label: seat.label,
        sectionName: section?.name,
        rowTitle: row?.title,
        category: category?.name,
        price: category?.price,
        color: category?.color
      }]);
      message.success(`Seat ${seat.label} added to selection`);
    }
  };



  // Calculate Total Price
  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  };

  // Calculate Convenience Fee (5%)
  const getConvenienceFee = () => {
    return Math.round(getTotalPrice() * 0.05);
  };

  // Handle Zoom
  const handleZoom = (zoomIn) => {
    const scaleBy = 1.1;
    const newScale = zoomIn ? canvasScale * scaleBy : canvasScale / scaleBy;
    setCanvasScale(Math.max(0.5, Math.min(newScale, 3)));
  };

  // Handle Wheel Zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stageInst = e.target.getStage();
    const oldScale = stageInst.scaleX();
    const pointer = stageInst.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stageInst.x()) / oldScale,
      y: (pointer.y - stageInst.y()) / oldScale
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.5, Math.min(newScale, 3));

    setCanvasScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    stageInst.position(newPos);
    setStagePosition(newPos);
    stageInst.batchDraw();
  };

  // Clear All Selections
  const clearSelections = () => {
    setSelectedSeats([]);
    message.info('Selection cleared');
  };

  // Handle Booking Confirmation
  const handleBookingConfirm = async () => {
    setIsProcessing(true);

    const bookingPayload = {
      eventId: eventDetails?.id,
      layoutId: layoutId,
      seats: selectedSeats,
      totalAmount: getTotalPrice() + getConvenienceFee(),
      bookingDetails: {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        bookingDate: new Date().toISOString()
      }
    };

    try {
      // Make API call here
      // const response = await api.post('/bookings', bookingPayload);
      console.log('Booking payload:', bookingPayload);

      message.success('Booking confirmed successfully!');

      // Update seat statuses to 'reserved'
      updateSeatsStatus(selectedSeats, 'reserved');

      // Clear selections
      setSelectedSeats([]);
      setIsBookingModalVisible(false);

      // Show booking confirmation
      Modal.success({
        title: 'Booking Confirmed!',
        content: (
          <div>
            <p><strong>Booking ID:</strong> BK{Date.now()}</p>
            <p><strong>Total Amount:</strong> ₹{getTotalPrice() + getConvenienceFee()}</p>
            <p><strong>Seats:</strong> {selectedSeats.map(s => s.label).join(', ')}</p>
          </div>
        )
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      message.error(`Failed to create booking: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update seat statuses after booking
  const updateSeatsStatus = (seats, newStatus) => {
    setSections(prevSections => {
      return prevSections.map(section => ({
        ...section,
        rows: section.rows.map(row => ({
          ...row,
          seats: row.seats.map(seat => {
            const isBooked = seats.some(s => s.seatId === seat.id);
            return isBooked ? { ...seat, status: newStatus } : seat;
          })
        }))
      }));
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: '#1a1a1a', height: '100vh', color: '#fff' }}>
        <h3>Loading seating layout...</h3>
      </div>
    );
  }

  if (!stage || sections.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: '#1a1a1a', height: '100vh', color: '#fff' }}>
        <h3>No seating layout found</h3>
      </div>
    );
  }

  return (
    <div className="auditorium-booking">
      {/* Top Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          {eventDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2>{eventDetails.name}</h2>
              <Space>
                <Tag color="blue">{eventDetails.date}</Tag>
                <Tag color="green">{eventDetails.time}</Tag>
                <Tag color="purple">{eventDetails.venue}</Tag>
              </Space>
            </div>
          ) : (
            <h2>Select Your Seats</h2>
          )}
        </div>

        <div className="toolbar-right">
          <Button
            icon={<ZoomInOutlined />}
            onClick={() => handleZoom(true)}
          />
          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => handleZoom(false)}
          />
          <Button
            onClick={() => setShowGrid(!showGrid)}
            icon={<BorderOutlined />}
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>
        </div>
      </div>

      <div className="booking-content">
        {/* Center Canvas - Using Admin Canvas Structure */}
        <div className="canvas-container">
          <Stage
            ref={stageRef}
            width={window.innerWidth - 450}
            height={window.innerHeight - 200}
            draggable={true}
            scaleX={canvasScale}
            scaleY={canvasScale}
            onWheel={handleWheel}
            onDragEnd={(e) => {
              const pos = e.target.position();
              setStagePosition(pos);
            }}
          >
            <Layer ref={layerRef}>
              {/* Grid */}
              {showGrid && (
                <>
                  {Array.from({ length: 50 }).map((_, i) => (
                    <React.Fragment key={`grid-${i}`}>
                      <Line
                        points={[i * 50, 0, i * 50, 3000]}
                        stroke="#E0E0E0"
                        strokeWidth={1}
                        listening={false}
                      />
                      <Line
                        points={[0, i * 50, 3000, i * 50]}
                        stroke="#E0E0E0"
                        strokeWidth={1}
                        listening={false}
                      />
                    </React.Fragment>
                  ))}
                </>
              )}

              {/* Stage/Screen - Non-draggable for booking */}
              <Group x={stage.x} y={stage.y}>
                <Rect
                  width={stage.width}
                  height={stage.height}
                  fill="#333"
                  stroke="#000"
                  strokeWidth={2}
                />
                <Text
                  width={stage.width}
                  y={stage.height / 2 - 10}
                  text={stage.name || 'SCREEN'}
                  fontSize={18}
                  fill="#FFF"
                  align="center"
                />
              </Group>

              {/* Sections - Non-draggable for booking */}
              {sections.map(section => (
                <Group
                  key={section.id}
                  x={section.x}
                  y={section.y}
                >
                  <Rect
                    width={section.width}
                    height={section.height}
                    fill="rgba(200, 200, 200, 0.2)"
                    stroke="#999"
                    strokeWidth={1}
                    dash={[5, 5]}
                  />
                  <Text
                    x={10}
                    y={10}
                    text={section.name}
                    fontSize={16}
                    fill="#FFFFFF"
                    fontStyle="bold"
                  />

                  {/* Rows and Seats */}
                  {section.rows.map(row => (
                    <Group key={row.id}>
                      <Text
                        x={10}
                        y={row.seats[0]?.y - 5}
                        text={row.title}
                        fontSize={14}
                        fill="#FFFFFF"
                        fontStyle="bold"
                        listening={false}
                      />

                      {row.seats.map(seat => {
                        const seatIdentifier = `${section.id}-${row.id}-${seat.id}`;
                        const isSelected = selectedSeats.some(s => s.identifier === seatIdentifier);

                        return (
                          <Group key={seat.id}>
                            {/* Seat Background Rectangle */}
                            <Rect
                              x={seat.x - seat.radius}
                              y={seat.y - seat.radius}
                              width={seat.radius * 2}
                              height={seat.radius * 2}
                              fill={isSelected ? PRIMARY : 'transparent'}
                              stroke={isSelected ? PRIMARY : '#999'}
                              strokeWidth={isSelected ? 2 : 1}
                              cornerRadius={4}
                              onMouseEnter={(e) => {
                                const container = e.target.getStage().container();
                                container.style.cursor = seat.status === 'available' ? 'pointer' : 'not-allowed';
                              }}
                              onMouseLeave={(e) => {
                                const container = e.target.getStage().container();
                                container.style.cursor = 'default';
                              }}
                              onClick={(e) => {
                                e.cancelBubble = true;
                                handleSeatClick(seat, section.id, row.id);
                              }}
                            />

                            {/* Seat Icon or Number */}
                            {seat.icon ? (
                              <IconImage
                                iconName={seat.icon}
                                x={seat.x}
                                y={seat.y}
                                size={seat.radius * 1.2}
                              />
                            ) : (
                              <Text
                                x={seat.x - seat.radius}
                                y={seat.y - 4}
                                width={seat.radius * 2}
                                text={seat.number.toString()}
                                fontSize={10}
                                fill="#FFFFFF"
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                              />
                            )}

                            {/* Disabled Status Cross */}
                            {seat.status === 'disabled' && (
                              <Line
                                points={[
                                  seat.x - seat.radius * 0.7,
                                  seat.y - seat.radius * 0.7,
                                  seat.x + seat.radius * 0.7,
                                  seat.y + seat.radius * 0.7
                                ]}
                                stroke="#F44336"
                                strokeWidth={2}
                                listening={false}
                              />
                            )}
                          </Group>
                        );
                      })}
                    </Group>
                  ))}
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Right Panel - Booking Summary */}
        <div className="booking-panel">
          <Card title="Booking Summary" style={{ height: '100%' }}>
            <div className="booking-summary">
              <div className="selected-seats">
                <h4>Selected Seats ({selectedSeats.length})</h4>
                {selectedSeats.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
                    Click on available seats to select
                  </p>
                ) : (
                  <div className="seats-list">
                    {selectedSeats.map((seat, index) => (
                      <div key={seat.identifier} className="seat-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{seat.label}</strong>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {seat.sectionName} • {seat.category}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 'bold' }}>₹{seat.price}</span>
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() => {
                                setSelectedSeats(selectedSeats.filter((_, i) => i !== index));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="booking-total">
                <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Subtotal:</span>
                    <strong>₹{getTotalPrice()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Convenience Fee (5%):</span>
                    <strong>₹{getConvenienceFee()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
                    <span>Total:</span>
                    <span>₹{getTotalPrice() + getConvenienceFee()}</span>
                  </div>
                </div>
              </div>

              <div className="booking-actions">
                <Button
                  type="primary"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setIsBookingModalVisible(true)}
                  disabled={selectedSeats.length === 0}
                  size="large"
                >
                  Proceed to Book
                </Button>
                <Button
                  type="default"
                  block
                  onClick={clearSelections}
                  disabled={selectedSeats.length === 0}
                  style={{ marginTop: 8 }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="legend" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee' }}>
              <h4>Legend</h4>
              <Space direction="vertical" size={4}>
                <Space>
                  <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: PRIMARY }} />
                  <span style={{ fontSize: 12 }}>Selected</span>
                </Space>
                {ticketCategories.map(cat => (
                  <Space key={cat.id}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: cat.color }} />
                    <span style={{ fontSize: 12 }}>{cat.name} - ₹{cat.price}</span>
                  </Space>
                ))}
                <Space>
                  <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#FF9800' }} />
                  <span style={{ fontSize: 12 }}>Reserved</span>
                </Space>
                <Space>
                  <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#9E9E9E' }} />
                  <span style={{ fontSize: 12 }}>Unavailable</span>
                </Space>
              </Space>
            </div>
          </Card>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        title="Confirm Your Booking"
        open={isBookingModalVisible}
        onCancel={() => setIsBookingModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsBookingModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<CheckCircleFilled />}
            loading={isProcessing}
            onClick={handleBookingConfirm}
          >
            Confirm Booking
          </Button>
        ]}
        width={600}
      >
        <Descriptions bordered column={1}>
          {eventDetails && (
            <>
              <Descriptions.Item label="Event">{eventDetails.name}</Descriptions.Item>
              <Descriptions.Item label="Date & Time">{eventDetails.date} • {eventDetails.time}</Descriptions.Item>
              <Descriptions.Item label="Venue">{eventDetails.venue}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="Selected Seats">
            {selectedSeats.map(seat => seat.label).join(', ')}
          </Descriptions.Item>
          <Descriptions.Item label="Number of Tickets">{selectedSeats.length}</Descriptions.Item>
          <Descriptions.Item label="Subtotal">₹{getTotalPrice()}</Descriptions.Item>
          <Descriptions.Item label="Convenience Fee">₹{getConvenienceFee()}</Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <strong style={{ fontSize: 18, color: '#52c41a' }}>
              ₹{getTotalPrice() + getConvenienceFee()}
            </strong>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16, padding: 12, background: '#f0f7ff', borderRadius: 4 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
            <strong>Note:</strong> Your seats will be held for 10 minutes. Please complete payment within this time.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AuditoriumTicketBooking;
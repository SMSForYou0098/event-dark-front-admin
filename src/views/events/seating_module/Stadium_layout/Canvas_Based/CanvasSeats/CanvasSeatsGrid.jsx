import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Button, Space, Typography, Tag, Tooltip } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Constants
const SEAT_SIZE = 28;
const SEAT_GAP = 6;
const ROW_GAP = 10;
const PADDING = 40;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

// Seat status colors
const SEAT_COLORS = {
  available: { fill: '#1a1a2e', stroke: '#4CAF50', icon: '#4CAF50' },
  selected: { fill: '#4CAF50', stroke: '#66BB6A', icon: '#fff' },
  booked: { fill: '#ef4444', stroke: '#dc2626', icon: '#fff' },
  blocked: { fill: '#374151', stroke: '#4b5563', icon: '#6b7280' },
};

// Generate seat data from section config
const generateSeats = (section, stand, tier) => {
  const rows = section?.rows || [];
  const seats = [];
  
  rows.forEach((row, rowIndex) => {
    const seatCount = row?.seatList?.length || row?.seats || 0;
    const rowLabel = row?.label || `Row ${rowIndex + 1}`;
    const basePrice = row?.price ?? tier?.price ?? stand?.price ?? 0;
    const seatIcon = row?.seatIcon || section?.seatIcon || tier?.seatIcon || stand?.seatIcon || 'circle';
    
    for (let seatIndex = 0; seatIndex < seatCount; seatIndex++) {
      const existingSeat = row?.seatList?.[seatIndex];
      const seatId = existingSeat?.id || 
        `${stand?.id || 'stand'}-${tier?.id || 'tier'}-${section?.id || 'section'}-${row?.id || rowIndex}-seat-${seatIndex + 1}`;
      
      seats.push({
        id: seatId,
        row: rowIndex,
        rowLabel,
        col: seatIndex,
        number: existingSeat?.number || seatIndex + 1,
        price: existingSeat?.price ?? basePrice,
        status: row?.isBlocked ? 'blocked' : (existingSeat?.status || 'available'),
        isBooked: existingSeat?.isBooked || false,
        seatIcon,
        standName: stand?.name,
        tierName: tier?.name,
        sectionName: section?.name,
      });
    }
  });
  
  return seats;
};

// Calculate layout dimensions
const calculateLayout = (seats) => {
  if (!seats.length) return { width: 0, height: 0, rowWidths: [], maxCols: 0 };
  
  const rowMap = new Map();
  seats.forEach(seat => {
    if (!rowMap.has(seat.row)) {
      rowMap.set(seat.row, { count: 0, label: seat.rowLabel });
    }
    rowMap.get(seat.row).count = Math.max(rowMap.get(seat.row).count, seat.col + 1);
  });
  
  const rowWidths = [];
  let maxCols = 0;
  
  rowMap.forEach((data, row) => {
    rowWidths[row] = data.count;
    maxCols = Math.max(maxCols, data.count);
  });
  
  const totalRows = rowMap.size;
  const width = maxCols * (SEAT_SIZE + SEAT_GAP) + PADDING * 2;
  const height = totalRows * (SEAT_SIZE + ROW_GAP) + PADDING * 2;
  
  return { width, height, rowWidths, maxCols, totalRows };
};

// Draw a single seat on canvas
const drawSeat = (ctx, seat, x, y, isSelected, isHovered, zoom) => {
  const status = seat.isBooked ? 'booked' : (isSelected ? 'selected' : seat.status);
  const colors = SEAT_COLORS[status] || SEAT_COLORS.available;
  const size = SEAT_SIZE * zoom;
  const radius = size / 2;
  
  ctx.save();
  
  // Shadow for hovered/selected
  if (isHovered || isSelected) {
    ctx.shadowColor = colors.stroke;
    ctx.shadowBlur = isHovered ? 12 : 8;
  }
  
  // Draw seat background
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = colors.fill;
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = isHovered ? 3 : 2;
  ctx.stroke();
  
  // Draw checkmark icon for available/selected seats
  ctx.fillStyle = colors.icon;
  ctx.font = `${Math.round(size * 0.45)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (status === 'blocked') {
    ctx.fillText('🔒', x + radius, y + radius);
  } else if (status === 'booked') {
    ctx.fillText('✕', x + radius, y + radius);
  } else {
    ctx.fillText('✓', x + radius, y + radius);
  }
  
  ctx.restore();
};

// Draw row label
const drawRowLabel = (ctx, label, x, y, zoom) => {
  ctx.save();
  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold ${Math.round(12 * zoom)}px Inter, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x - 10 * zoom, y + (SEAT_SIZE * zoom) / 2);
  ctx.restore();
};

const CanvasSeatsGrid = ({
  selectedSection,
  tier,
  stand,
  selectedSeats = [],
  setSelectedSeats,
  isMobile = false,
  onSeatClick,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  
  // Generate seats data
  const seats = useMemo(() => 
    generateSeats(selectedSection, stand, tier),
    [selectedSection, stand, tier]
  );
  
  // Calculate layout
  const layout = useMemo(() => calculateLayout(seats), [seats]);
  
  // Selected seat IDs for quick lookup
  const selectedIds = useMemo(() => 
    new Set(selectedSeats.map(s => s.id)),
    [selectedSeats]
  );
  
  // Stats
  const stats = useMemo(() => {
    const available = seats.filter(s => s.status === 'available' && !s.isBooked).length;
    const booked = seats.filter(s => s.isBooked || s.status === 'booked').length;
    const blocked = seats.filter(s => s.status === 'blocked').length;
    return { available, booked, blocked, total: seats.length };
  }, [seats]);
  
  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  // Get seat at position
  const getSeatAtPosition = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    // Find which seat was clicked
    for (const seat of seats) {
      const rowY = PADDING + seat.row * (SEAT_SIZE + ROW_GAP);
      const rowWidth = layout.rowWidths[seat.row] || 0;
      const rowOffset = (layout.maxCols - rowWidth) * (SEAT_SIZE + SEAT_GAP) / 2;
      const seatX = PADDING + rowOffset + seat.col * (SEAT_SIZE + SEAT_GAP);
      
      const centerX = seatX + SEAT_SIZE / 2;
      const centerY = rowY + SEAT_SIZE / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distance <= SEAT_SIZE / 2) {
        return seat;
      }
    }
    
    return null;
  }, [seats, layout, pan, zoom]);
  
  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    canvas.style.width = `${containerSize.width}px`;
    canvas.style.height = `${containerSize.height}px`;
    ctx.scale(dpr, dpr);
    
    // Clear and fill background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, containerSize.width, containerSize.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw stage/screen indicator at top
    const stageWidth = Math.min(layout.width - PADDING * 2, 300);
    const stageX = (layout.width - stageWidth) / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(stageX, 10, stageWidth, 20);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE / FIELD', layout.width / 2, 24);
    
    // Group seats by row for efficient drawing
    const rowGroups = new Map();
    seats.forEach(seat => {
      if (!rowGroups.has(seat.row)) {
        rowGroups.set(seat.row, []);
      }
      rowGroups.get(seat.row).push(seat);
    });
    
    // Draw seats row by row
    rowGroups.forEach((rowSeats, rowIndex) => {
      const rowY = PADDING + rowIndex * (SEAT_SIZE + ROW_GAP);
      const rowWidth = layout.rowWidths[rowIndex] || 0;
      const rowOffset = (layout.maxCols - rowWidth) * (SEAT_SIZE + SEAT_GAP) / 2;
      
      // Draw row label
      if (rowSeats[0]) {
        drawRowLabel(ctx, rowSeats[0].rowLabel, PADDING + rowOffset, rowY, 1);
      }
      
      // Draw seats
      rowSeats.forEach(seat => {
        const seatX = PADDING + rowOffset + seat.col * (SEAT_SIZE + SEAT_GAP);
        const isSelected = selectedIds.has(seat.id);
        const isHovered = hoveredSeat?.id === seat.id;
        drawSeat(ctx, seat, seatX, rowY, isSelected, isHovered, 1);
      });
    });
    
    ctx.restore();
  }, [seats, layout, containerSize, pan, zoom, selectedIds, hoveredSeat]);
  
  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }
    
    const seat = getSeatAtPosition(e.clientX, e.clientY);
    setHoveredSeat(seat);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = seat && seat.status !== 'blocked' && !seat.isBooked 
        ? 'pointer' 
        : isDragging ? 'grabbing' : 'grab';
    }
  }, [isDragging, dragStart, getSeatAtPosition]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      const seat = getSeatAtPosition(e.clientX, e.clientY);
      if (seat) {
        // Seat click
        if (seat.status !== 'blocked' && !seat.isBooked) {
          const isSelected = selectedIds.has(seat.id);
          if (isSelected) {
            setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
          } else {
            setSelectedSeats(prev => [...prev, seat]);
          }
          onSeatClick?.(seat);
        }
      } else {
        // Start panning
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  }, [getSeatAtPosition, selectedIds, setSelectedSeats, onSeatClick, pan]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);
  
  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const seat = getSeatAtPosition(touch.clientX, touch.clientY);
      if (!seat) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    }
  }, [getSeatAtPosition, pan]);
  
  const handleTouchMove = useCallback((e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);
  
  const handleTouchEnd = useCallback((e) => {
    if (e.changedTouches.length === 1 && !isDragging) {
      const touch = e.changedTouches[0];
      const seat = getSeatAtPosition(touch.clientX, touch.clientY);
      if (seat && seat.status !== 'blocked' && !seat.isBooked) {
        const isSelected = selectedIds.has(seat.id);
        if (isSelected) {
          setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
        } else {
          setSelectedSeats(prev => [...prev, seat]);
        }
      }
    }
    setIsDragging(false);
  }, [getSeatAtPosition, selectedIds, setSelectedSeats, isDragging]);
  
  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + 0.25));
  const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  // Add event listeners
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);
  
  if (!seats.length) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center"
        style={{ 
          height: 400, 
          background: '#0a0a1a',
          borderRadius: 12,
          color: '#94a3b8',
        }}
      >
        <Text type="secondary">No seats configured for this section</Text>
      </div>
    );
  }
  
  return (
    <div className="d-flex flex-column" style={{ gap: 16 }}>
      {/* Header with stats */}
      <div 
        className="d-flex justify-content-between align-items-center flex-wrap p-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          gap: 12,
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: 8 }}>
          <Text strong style={{ color: '#fff', fontSize: 16 }}>
            {selectedSection?.name || 'Section'}
          </Text>
        </div>
        
        <Space wrap size="small">
          <Tag icon={<CheckCircleOutlined />} color="success">
            Available: {stats.available}
          </Tag>
          <Tag icon={<CloseCircleOutlined />} color="error">
            Booked: {stats.booked}
          </Tag>
          <Tag icon={<LockOutlined />} color="default">
            Blocked: {stats.blocked}
          </Tag>
          <Tag color="processing">
            Total: {stats.total}
          </Tag>
        </Space>
        
        {/* Zoom controls */}
        <Space size="small">
          <Tooltip title="Zoom Out">
            <Button 
              type="text" 
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
            />
          </Tooltip>
          <Tag style={{ margin: 0, minWidth: 55, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Tag>
          <Tooltip title="Zoom In">
            <Button 
              type="text" 
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
            />
          </Tooltip>
          <Tooltip title="Reset View">
            <Button 
              type="text" 
              icon={<ExpandOutlined />}
              onClick={handleReset}
              style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
            />
          </Tooltip>
        </Space>
      </div>
      
      {/* Canvas container */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? 350 : 450,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #0a0a1a 0%, #1a1a2e 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseLeave={() => setHoveredSeat(null)}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ display: 'block' }}
        />
        
        {/* Hovered seat tooltip */}
        {hoveredSeat && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'rgba(0,0,0,0.9)',
              borderRadius: 8,
              padding: '10px 14px',
              border: `2px solid ${SEAT_COLORS[hoveredSeat.status]?.stroke || '#4CAF50'}`,
              backdropFilter: 'blur(8px)',
              zIndex: 10,
            }}
          >
            <Space direction="vertical" size={4}>
              <Text strong style={{ color: '#fff' }}>
                {hoveredSeat.rowLabel} - Seat {hoveredSeat.number}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                Price: ₹{hoveredSeat.price}
              </Text>
              <Text style={{ 
                color: SEAT_COLORS[hoveredSeat.status]?.stroke,
                fontSize: 12,
                textTransform: 'capitalize',
              }}>
                {hoveredSeat.isBooked ? 'Booked' : hoveredSeat.status}
              </Text>
            </Space>
          </div>
        )}
        
        {/* Instructions */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          Scroll to zoom • Drag to pan • Click to select
        </div>
      </div>
      
      {/* Selection summary */}
      {selectedSeats.length > 0 && (
        <div 
          className="d-flex justify-content-between align-items-center p-3"
          style={{
            background: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(76, 175, 80, 0.3)',
          }}
        >
          <Text style={{ color: '#fff' }}>
            <Text strong style={{ color: '#4CAF50' }}>{selectedSeats.length}</Text> seat(s) selected
          </Text>
          <Text strong style={{ color: '#4CAF50', fontSize: 18 }}>
            ₹{selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0).toFixed(2)}
          </Text>
        </div>
      )}
    </div>
  );
};

export default CanvasSeatsGrid;


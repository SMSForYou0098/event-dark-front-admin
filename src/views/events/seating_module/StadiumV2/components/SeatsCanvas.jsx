import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Tag, Space, Button, Typography, Tooltip, theme } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  ReloadOutlined, 
  DragOutlined, 
  CheckCircleFilled,
  InfoCircleOutlined
} from '@ant-design/icons';
import { SEAT_ICONS, getSeatColor, getSeatIcon } from '../api/ticketData';

const { Text, Title } = Typography;
const { useToken } = theme;

const SeatsCanvas = ({
  section,
  tier,
  stand,
  eventId,
  selectedSeats = [],
  onSeatClick,
  onSelectionChange,
  isAdmin = false,
  width = 800,
  height = 600, // Increased default height for better view
}) => {
  const canvasRef = useRef(null);
  const { token } = useToken(); // Use Ant Design tokens for consistency
  
  // State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  
  // Touch state for mobile
  const touchStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0, scale: 1, distance: 0 });
  const [isTouching, setIsTouching] = useState(false);

  // --- DATA GENERATION (Kept mostly same, added visual tweaks) ---
  const effectiveSection = useMemo(() => {
    if (section?.rows?.length > 0) return section;
    return {
      ...section,
      rows: [
        { id: 'test-row-A', label: 'A', seatCount: 18, geometry: { curve: 6 } },
        { id: 'test-row-B', label: 'B', seatCount: 20, geometry: { curve: 6.5 } },
        { id: 'test-row-C', label: 'C', seatCount: 22, geometry: { curve: 7 } },
        { id: 'test-row-D', label: 'D', seatCount: 24, geometry: { curve: 7.5 } },
        { id: 'test-row-E', label: 'E', seatCount: 26, geometry: { curve: 8 } },
      ],
    };
  }, [section]);

  const seatsData = useMemo(() => {
    const rows = effectiveSection?.rows || [];
    if (!rows.length) return { seats: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 }, rowLabels: [] };

    const seats = [];
    const seatSize = 20; // Slightly smaller for cleaner look
    const seatGap = 6;
    const rowGap = 12;
    const stageHeight = 100;
    const startY = stageHeight + 60;
    const centerX = width / 2;
    let currentY = startY;

    rows.forEach((row, rowIndex) => {
      const seatCount = row.seatCount || row.seats?.length || 0;
      if (seatCount === 0) return;

      const rowWidth = seatCount * (seatSize + seatGap);
      const startX = centerX - rowWidth / 2;
      const curveAmount = row.geometry?.curve || 3;
      
      const isBlocked = row.status === 'blocked' || effectiveSection?.status === 'blocked';
      
      for (let i = 0; i < seatCount; i++) {
        const progress = seatCount > 1 ? i / (seatCount - 1) : 0.5;
        const curveOffset = Math.sin(progress * Math.PI) * curveAmount * 3; // Increased curve for visual effect
        
        const x = startX + i * (seatSize + seatGap) + seatSize / 2;
        const y = currentY + curveOffset;
        
        // ID Generation
        const seatId = `${effectiveSection?.id || 'SEC'}-${row.label || 'R'}-${i + 1}`;
        const isSelected = selectedSeats.some(s => s.id === seatId);
        
        seats.push({
          id: seatId,
          number: i + 1,
          rowLabel: row.label,
          sectionName: effectiveSection?.name || 'General',
          ticketId: row.ticketId || effectiveSection?.ticketId || 'STD',
          x, y,
          size: seatSize,
          status: isSelected ? 'selected' : (isBlocked ? 'blocked' : 'available'),
        });
      }
      currentY += seatSize + rowGap;
    });

    return {
      seats,
      rowLabels: rows.map((r, i) => ({ label: r.label, y: startY + i * (seatSize + rowGap) })),
    };
  }, [effectiveSection, selectedSeats, width]);

  // --- DRAWING LOGIC (Enhanced) ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Cinematic Background
    const gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    gradient.addColorStop(0, '#1f1f33'); // Lighter center
    gradient.addColorStop(1, '#0b0b14'); // Dark corners
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);

    // Apply Zoom/Pan
    ctx.save();
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // 2. Draw Stage/Field (with Glow)
    const stageWidth = width * 0.5;
    const stageX = (width - stageWidth) / 2;
    
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(24, 144, 255, 0.3)';
    
    const stageGradient = ctx.createLinearGradient(stageX, 0, stageX, 80);
    stageGradient.addColorStop(0, '#10239e');
    stageGradient.addColorStop(1, '#061178');
    
    ctx.fillStyle = stageGradient;
    ctx.beginPath();
    ctx.roundRect(stageX, 20, stageWidth, 60, [0, 0, 30, 30]); // Rounded bottom
    ctx.fill();
    
    ctx.shadowBlur = 0; // Reset glow for text
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FIELD / STAGE', width / 2, 55);

    // 3. Draw Seats
    seatsData.seats.forEach(seat => {
      const isHovered = hoveredSeat?.id === seat.id;
      const isSelected = seat.status === 'selected';
      
      // Determine base color
      let fillColor = '#303040'; // Default available (dark grey-blue)
      let strokeColor = 'rgba(255,255,255,0.1)';
      let shadowColor = 'transparent';
      let shadowBlur = 0;

      if (seat.status === 'booked') fillColor = '#434343';
      else if (seat.status === 'blocked') fillColor = '#5c2525';
      else if (isSelected) {
        fillColor = '#1890ff';
        strokeColor = '#fff';
        shadowColor = 'rgba(24, 144, 255, 0.6)';
        shadowBlur = 15;
      } 
      else if (seat.ticketId) {
        // Use ticket color logic here
        fillColor = getSeatColor(seat, eventId); // Assuming this returns a hex
      }

      if (isHovered && seat.status === 'available') {
        fillColor = '#40a9ff';
        strokeColor = '#fff';
        shadowBlur = 10;
        shadowColor = 'rgba(64, 169, 255, 0.4)';
      }

      // Draw Seat (Circle with depth)
      const renderSize = isHovered ? seat.size * 1.3 : seat.size;
      
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      
      ctx.beginPath();
      ctx.arc(seat.x, seat.y, renderSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      
      // Inner stroke for detail
      if (!isSelected && !isHovered) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
      }

      // 4. Seat Number (Only visible when zoomed in)
      if (scale > 1.4 || isSelected || isHovered) {
        ctx.fillStyle = '#fff';
        ctx.font = `600 ${Math.max(8, 9 * scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(String(seat.number), seat.x, seat.y);
      }
    });

    // 5. Row Labels
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    seatsData.rowLabels.forEach(({ label, y }) => {
       // Draw label on left side
       ctx.fillText(label, width / 2 - (width * 0.4), y + 4);
    });

    // 6. Selection Box
    if (isSelecting && selectionStart && selectionEnd) {
      ctx.fillStyle = 'rgba(24, 144, 255, 0.2)';
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;
      const rectX = Math.min(selectionStart.x, selectionEnd.x);
      const rectY = Math.min(selectionStart.y, selectionEnd.y);
      const rectW = Math.abs(selectionEnd.x - selectionStart.x);
      const rectH = Math.abs(selectionEnd.y - selectionStart.y);
      
      ctx.fillRect(rectX, rectY, rectW, rectH);
      ctx.strokeRect(rectX, rectY, rectW, rectH);
    }

    ctx.restore();
  }, [seatsData, hoveredSeat, scale, offset, width, height, isSelecting, selectionStart, selectionEnd]);

  // --- HANDLERS (Same Logic, just optimized hooks) ---
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - width / 2 - offset.x) / scale + width / 2,
      y: (clientY - rect.top - height / 2 - offset.y) / scale + height / 2,
    };
  }, [width, height, scale, offset]);

  const findSeatAtPosition = useCallback((x, y) => {
    // Simple spatial check (can be optimized with QuadTree for 50k+ seats)
    return seatsData.seats.find(seat => {
      const dx = x - seat.x;
      const dy = y - seat.y;
      return (dx * dx + dy * dy) <= (seat.size/2 * seat.size/2); // Squared distance check is faster
    });
  }, [seatsData.seats]);

  const handleMouseDown = useCallback((e) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const seat = findSeatAtPosition(x, y);

    if (seat || e.shiftKey) {
       // Selection Mode
       if (e.shiftKey) {
         setIsSelecting(true);
         setSelectionStart({ x, y });
         setSelectionEnd({ x, y });
       }
    } else {
      // Pan Mode
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
      document.body.style.cursor = 'grabbing';
    }
  }, [screenToCanvas, findSeatAtPosition, offset]);

  const handleMouseMove = useCallback((e) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      setOffset({
        x: dragStartRef.current.offsetX + (e.clientX - dragStartRef.current.x),
        y: dragStartRef.current.offsetY + (e.clientY - dragStartRef.current.y),
      });
      return;
    }

    if (isSelecting) {
      setSelectionEnd({ x, y });
      return;
    }

    const seat = findSeatAtPosition(x, y);
    setHoveredSeat(seat);
    if(canvasRef.current) canvasRef.current.style.cursor = seat ? 'pointer' : 'default';

  }, [isDragging, isSelecting, screenToCanvas, findSeatAtPosition]);

const handleMouseUp = useCallback((e) => {
    document.body.style.cursor = 'default';
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (isSelecting && selectionStart && selectionEnd) {
      // ... (Selection box logic remains the same) ...
      // (Keep your existing selection box logic here)
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);

      const selectedInRect = seatsData.seats.filter(s => 
        s.x >= x1 && s.x <= x2 && s.y >= y1 && s.y <= y2 && s.status === 'available'
      );
      
      const newIds = selectedInRect.map(s => s.id);
      const uniqueCurrent = selectedSeats.filter(s => !newIds.includes(s.id));
      const toAdd = selectedInRect.filter(s => !selectedSeats.some(cur => cur.id === s.id));
      
      onSelectionChange([...uniqueCurrent, ...toAdd]);
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    // --- FIX IS HERE ---
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const seat = findSeatAtPosition(x, y);

    // We must allow clicking if status is 'available' OR 'selected'
    // Alternatively, we just check that it is NOT 'booked' or 'blocked'
    if (seat && seat.status !== 'booked' && seat.status !== 'blocked') {
        const isSelected = selectedSeats.some(s => s.id === seat.id);
        
        if (isSelected) {
            // Deselect: Remove from array
            onSelectionChange(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            // Select: Add to array
            onSelectionChange([...selectedSeats, seat]);
        }
        
        if (onSeatClick) onSeatClick(seat);
    }
  }, [isDragging, isSelecting, selectionStart, selectionEnd, seatsData.seats, selectedSeats, onSelectionChange, onSeatClick, screenToCanvas, findSeatAtPosition]);
  const handleWheel = useCallback((e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(4, Math.max(0.5, s * delta)));
  }, []);

  // --- TOUCH HANDLERS FOR MOBILE ---
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single touch - could be pan or tap
      const touch = touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
        scale: scale,
        distance: 0,
        isTap: true,
        tapTime: Date.now(),
      };
      setIsTouching(true);
    } else if (touches.length === 2) {
      // Two finger - pinch to zoom
      const distance = getTouchDistance(touches);
      touchStartRef.current = {
        ...touchStartRef.current,
        distance,
        scale: scale,
        isTap: false,
      };
    }
  }, [offset, scale]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1 && isTouching) {
      // Single finger pan
      const touch = touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      
      // If moved more than 10px, it's not a tap
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchStartRef.current.isTap = false;
      }
      
      setOffset({
        x: touchStartRef.current.offsetX + dx,
        y: touchStartRef.current.offsetY + dy,
      });
    } else if (touches.length === 2) {
      // Pinch to zoom
      const newDistance = getTouchDistance(touches);
      const startDistance = touchStartRef.current.distance;
      
      if (startDistance > 0) {
        const scaleChange = newDistance / startDistance;
        const newScale = Math.min(4, Math.max(0.5, touchStartRef.current.scale * scaleChange));
        setScale(newScale);
      }
      touchStartRef.current.isTap = false;
    }
  }, [isTouching]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    
    // Check if it was a tap (short duration, minimal movement)
    const wasTap = touchStartRef.current.isTap && 
                   (Date.now() - touchStartRef.current.tapTime) < 300;
    
    if (wasTap && touch) {
      // Handle as a tap/click on seat
      const { x, y } = screenToCanvas(touch.clientX, touch.clientY);
      const seat = findSeatAtPosition(x, y);
      
      if (seat && seat.status !== 'booked' && seat.status !== 'blocked') {
        const isSelected = selectedSeats.some(s => s.id === seat.id);
        
        if (isSelected) {
          onSelectionChange(selectedSeats.filter(s => s.id !== seat.id));
        } else {
          onSelectionChange([...selectedSeats, seat]);
        }
        
        if (onSeatClick) onSeatClick(seat);
      }
    }
    
    setIsTouching(false);
  }, [screenToCanvas, findSeatAtPosition, selectedSeats, onSelectionChange, onSeatClick]);

  // --- EFFECTS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    draw();
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [width, height, draw, handleWheel]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => ({
    available: seatsData.seats.filter(s => s.status === 'available').length,
    selected: selectedSeats.length,
    total: seatsData.seats.length
  }), [seatsData.seats, selectedSeats]);

  // --- Responsive detection ---
  const isMobile = width <= 500;

  // --- STYLES ---
  const glassPanelStyle = {
    background: 'rgba(20, 20, 30, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: isMobile ? '8px' : '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: width, 
      height: height, 
      borderRadius: isMobile ? '8px' : '16px', 
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      touchAction: 'none',
    }}>
      
      {/* 1. Header / HUD */}
      <div style={{
        position: 'absolute',
        top: isMobile ? 8 : 16,
        left: isMobile ? 8 : 16,
        right: isMobile ? 8 : 16,
        height: isMobile ? 48 : 60,
        ...glassPanelStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        zIndex: 10
      }}>
        <div style={{ overflow: 'hidden' }}>
          <Text style={{ 
            color: '#fff', 
            fontSize: isMobile ? 13 : 16, 
            fontWeight: 600, 
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isMobile ? 120 : 200,
          }}>
            {section?.name || 'Section View'} 
          </Text>
          {!isMobile && (
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
               {tier?.name || 'Standard Tier'} • {stand?.name || 'North Stand'}
            </Text>
          )}
        </div>

        <Space size={isMobile ? 8 : 16}>
           <div style={{ textAlign: 'center' }}>
               <div style={{ color: '#52c41a', fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>{stats.available}</div>
               <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 8 : 10, textTransform: 'uppercase' }}>Avail</div>
           </div>
           <div style={{ width: 1, height: isMobile ? 20 : 24, background: 'rgba(255,255,255,0.1)' }} />
           <div style={{ textAlign: 'center' }}>
               <div style={{ color: stats.selected > 0 ? '#1890ff' : '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>{stats.selected}</div>
               <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 8 : 10, textTransform: 'uppercase' }}>Sel</div>
           </div>
           {stats.selected > 0 && !isMobile && (
             <Button type="primary" size="small" shape="round" style={{ marginLeft: 8 }}>
               Proceed
             </Button>
           )}
        </Space>
      </div>

      {/* 2. Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setHoveredSeat(null); setIsDragging(false); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ display: 'block', cursor: 'grab', touchAction: 'none' }}
      />

      {/* 3. Floating Toolbar (Zoom) */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? 60 : 24,
        right: isMobile ? 8 : 24,
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        gap: isMobile ? 4 : 8,
        padding: isMobile ? 4 : 8,
        ...glassPanelStyle,
        borderRadius: isMobile ? 20 : 24,
        zIndex: 10
      }}>
        <Tooltip title={isMobile ? '' : 'Zoom In'} placement="left">
            <Button 
                type="text" 
                size={isMobile ? 'small' : 'middle'}
                icon={<ZoomInOutlined style={{ fontSize: isMobile ? 14 : 18, color: '#fff' }} />} 
                onClick={() => setScale(s => Math.min(4, s * 1.2))}
            />
        </Tooltip>
        <Tooltip title={isMobile ? '' : 'Reset View'} placement="left">
            <Button 
                type="text" 
                size={isMobile ? 'small' : 'middle'}
                icon={<ReloadOutlined style={{ fontSize: isMobile ? 14 : 18, color: '#fff' }} />} 
                onClick={() => { setScale(1); setOffset({x:0, y:0}); }}
            />
        </Tooltip>
        <Tooltip title={isMobile ? '' : 'Zoom Out'} placement="left">
            <Button 
                type="text" 
                size={isMobile ? 'small' : 'middle'}
                icon={<ZoomOutOutlined style={{ fontSize: isMobile ? 14 : 18, color: '#fff' }} />} 
                onClick={() => setScale(s => Math.max(0.5, s * 0.8))}
            />
        </Tooltip>
      </div>

      {/* 4. Floating Legend / Guide */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? 8 : 24,
        left: isMobile ? 8 : 24,
        padding: isMobile ? '6px 10px' : '8px 16px',
        ...glassPanelStyle,
        display: 'flex',
        gap: isMobile ? 8 : 16,
        alignItems: 'center',
        flexWrap: 'wrap',
        zIndex: 10,
        maxWidth: isMobile ? 'calc(100% - 100px)' : 'auto',
      }}>
        <Space size={4}>
            <div style={{ width: isMobile ? 8 : 12, height: isMobile ? 8 : 12, borderRadius: '50%', background: '#303040', border: '1px solid rgba(255,255,255,0.3)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 10 : 12 }}>Empty</Text>
        </Space>
        <Space size={4}>
            <div style={{ width: isMobile ? 8 : 12, height: isMobile ? 8 : 12, borderRadius: '50%', background: '#1890ff', boxShadow: '0 0 8px #1890ff' }} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 10 : 12 }}>Selected</Text>
        </Space>
        {!isMobile && (
          <>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                <DragOutlined /> Drag to Pan
            </Text>
          </>
        )}
      </div>

      {/* Mobile: Proceed button at bottom */}
      {isMobile && stats.selected > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 100,
          zIndex: 10,
        }}>
          <Button type="primary" size="small" shape="round">
            Proceed ({stats.selected})
          </Button>
        </div>
      )}

      {/* 5. Advanced Tooltip (HUD Style) - only on non-mobile */}
      {hoveredSeat && !isMobile && (
        <div style={{
          position: 'fixed',
          left: mousePos.x + 20,
          top: mousePos.y - 20,
          ...glassPanelStyle,
          background: 'rgba(10, 10, 15, 0.95)',
          padding: 0,
          pointerEvents: 'none',
          zIndex: 1000,
          minWidth: 180,
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Tooltip Header */}
          <div style={{ 
              padding: '10px 14px', 
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
          }}>
              <Text style={{ color: '#fff', fontWeight: 600 }}>
                  Row {hoveredSeat.rowLabel}
              </Text>
              <Tag color="blue" style={{ margin: 0, border: 'none' }}>Seat {hoveredSeat.number}</Tag>
          </div>
          
          {/* Tooltip Body */}
          <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Price Tier</Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>{hoveredSeat.ticketId}</Text>
              </div>
              
              {hoveredSeat.status === 'available' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52c41a', fontSize: 12, marginTop: 8 }}>
                      <CheckCircleFilled /> Available
                  </div>
              ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff4d4f', fontSize: 12, marginTop: 8 }}>
                      <InfoCircleOutlined /> {hoveredSeat.status.charAt(0).toUpperCase() + hoveredSeat.status.slice(1)}
                  </div>
              )}
          </div>
        </div>
      )}
      
      {/* CSS Animation for Tooltip */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SeatsCanvas;
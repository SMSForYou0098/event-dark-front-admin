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
import { SEAT_ICONS, getSeatColor, getSeatIcon, getTicketById } from '../api/ticketData';

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

  // --- DATA GENERATION ---
  const effectiveSection = useMemo(() => {
    if (section?.rows?.length > 0) return section;
    
    // Demo data with section-level EXIT tunnel
    return {
      ...section,
      name: 'Section A',
      // Section-level aisles with new schema
      aisles: [
        { 
          id: 'exit-1', 
          afterSeat: 10,        // Aisle appears after seat 10
          width: 80, 
          type: 'exit',
          label: 'EXIT',
          startRowIndex: 0,     // Start from row A (index 0)
          endRowIndex: 5,       // End at row F (index 5) - partial tunnel
        },
      ],
      rows: [
        { id: 'row-A', label: 'A', seatCount: 24, geometry: { curve: 3 } },
        { id: 'row-B', label: 'B', seatCount: 24, geometry: { curve: 3.5 } },
        { id: 'row-C', label: 'C', seatCount: 24, geometry: { curve: 4 } },
        { id: 'row-D', label: 'D', seatCount: 24, geometry: { curve: 4.5 } },
        { id: 'row-E', label: 'E', seatCount: 24, geometry: { curve: 5 } },
        { id: 'row-F', label: 'F', seatCount: 24, geometry: { curve: 5.5 } },
        { id: 'row-G', label: 'G', seatCount: 24, geometry: { curve: 6 } },
        { id: 'row-H', label: 'H', seatCount: 24, geometry: { curve: 6.5 } },
      ],
    };
  }, [section]);

  // Get section aisles (new schema: afterSeat, startRowIndex, endRowIndex)
  const sectionAisles = useMemo(() => {
    return effectiveSection?.aisles || [];
  }, [effectiveSection]);

  const seatsData = useMemo(() => {
    const rows = effectiveSection?.rows || [];
    if (!rows.length) return { seats: [], tunnels: [], rowLabels: [], rowAisles: [] };

    const seats = [];
    const rowLabels = [];
    const rowAisles = []; // Aisles from row.blocks
    const seatSize = 22;
    const seatGap = 5;
    const rowGap = 30;
    const stageHeight = 100;
    const startY = stageHeight + 70;
    const centerX = width / 2;
    let currentY = startY;

    // If stand or tier is blocked, all seats are blocked
    const isParentBlocked = stand?.status === 'blocked' || tier?.status === 'blocked' || effectiveSection?.status === 'blocked';

    // Get icon from hierarchy (row → section → tier → stand)
    const getIcon = (row) => {
      return row.icon || effectiveSection?.icon || tier?.icon || stand?.icon || 'circle';
    };

    // Pre-calculate tunnel zones (fixed positions based on canvas center)
    // Each tunnel is positioned relative to the CENTER of the canvas
    const tunnelZones = sectionAisles.map(aisle => {
      const aisleWidth = aisle.width || 80;
      // Calculate tunnel center X based on afterSeat
      // Assume average seat width = seatSize + seatGap
      const avgSeatWidth = seatSize + seatGap;
      // Offset from center: negative = left, positive = right
      // afterSeat determines how many seats are on the left of the tunnel
      // For center tunnel with afterSeat=10 and ~20 total seats, it's roughly centered
      return {
        ...aisle,
        width: aisleWidth,
        halfWidth: aisleWidth / 2,
        startRowIndex: aisle.startRowIndex ?? 0,
        endRowIndex: aisle.endRowIndex ?? rows.length - 1,
      };
    });

    // Track tunnel Y bounds
    const tunnelBounds = {};
    tunnelZones.forEach(tz => {
      tunnelBounds[tz.id] = { minY: Infinity, maxY: -Infinity, x: 0 };
    });

    const seatUnit = seatSize + seatGap;

    // PRE-CALCULATE: Fixed tunnel position at canvas center
    // Tunnel center will be at centerX, creating symmetric layout
    const tunnelCenterFixed = centerX;
    
    // Find the BASE seat count for tunnel rows (the row with minimum seats that has tunnel)
    // This becomes our reference - extra seats in larger rows are split evenly on both sides
    let baseTunnelSeatCount = Infinity;
    rows.forEach((row, rowIndex) => {
      const hasTunnel = tunnelZones.some(tz => 
        rowIndex >= tz.startRowIndex && rowIndex <= tz.endRowIndex
      );
      if (hasTunnel) {
        const count = row.seatCount || row.seats?.length || 0;
        if (count > 0 && count < baseTunnelSeatCount) {
          baseTunnelSeatCount = count;
        }
      }
    });
    if (baseTunnelSeatCount === Infinity) baseTunnelSeatCount = 20; // fallback

    rows.forEach((row, rowIndex) => {
      const curveAmount = row.geometry?.curve || 3;
      const isBlocked = isParentBlocked || row.status === 'blocked';
      const seatIcon = getIcon(row);
      
      // Check if row has blocks (advanced mode from RowEditPanel)
      const hasBlocks = row.blocks && row.blocks.length > 0;
      
      // Calculate seat count
      let seatCount;
      if (hasBlocks) {
        seatCount = row.blocks
          .filter(b => b.type === 'seats')
          .reduce((sum, b) => sum + (b.seats || 0), 0);
      } else {
        seatCount = row.seatCount || row.seats?.length || 0;
      }
      
      if (seatCount === 0 && !hasBlocks) {
        currentY += seatSize + rowGap;
        return;
      }

      // Find which tunnels apply to this row
      const activeTunnels = tunnelZones.filter(tz => 
        rowIndex >= tz.startRowIndex && rowIndex <= tz.endRowIndex
      );

      let seatNumber = 0;

      if (activeTunnels.length > 0 && !hasBlocks) {
        // TUNNEL ROW: Create SYMMETRIC trapezium around tunnel
        const tunnel = activeTunnels[0];
        const tunnelWidth = tunnel.width || 80;
        const baseAfterSeat = tunnel.afterSeat || 0;
        
        // Calculate how many EXTRA seats this row has compared to base
        const extraSeats = seatCount - baseTunnelSeatCount;
        
        // Split extra seats evenly: half go to left, half go to right
        const extraLeft = Math.floor(extraSeats / 2);
        const extraRight = extraSeats - extraLeft; // Remainder goes to right
        
        // Actual seat counts for this row
        const seatsOnLeft = baseAfterSeat + extraLeft;
        const seatsOnRight = (baseTunnelSeatCount - baseAfterSeat) + extraRight;
        
        // Tunnel position: centered at tunnelCenterFixed
        const tunnelLeftX = tunnelCenterFixed - tunnelWidth / 2;
        const tunnelRightX = tunnelCenterFixed + tunnelWidth / 2;
        
        // LEFT SIDE: seats grow outward (right-aligned to tunnel)
        const leftSideWidth = seatsOnLeft * seatUnit;
        const leftStartX = tunnelLeftX - leftSideWidth;
        
        // RIGHT SIDE: seats grow outward (left-aligned from tunnel)
        const rightStartX = tunnelRightX;
        
        // Row label position (leftmost)
        rowLabels.push({ label: row.label, y: currentY, x: leftStartX - 25 });
        
        // Place LEFT SIDE seats
        let currentX = leftStartX;
        for (let i = 0; i < seatsOnLeft; i++) {
          seatNumber++;
          
          const progress = seatsOnLeft > 1 ? i / (seatsOnLeft - 1) : 0.5;
          const curveOffset = Math.sin(progress * Math.PI) * curveAmount;
          
          const x = currentX + seatSize / 2;
          const y = currentY + curveOffset;
          
          const seatId = `${effectiveSection?.id || 'SEC'}-${row.label || 'R'}-${seatNumber}`;
          const isSelected = selectedSeats.some(s => s.id === seatId);
          
          const seatTicketId = row.ticketId || effectiveSection?.ticketId || tier?.ticketId || stand?.ticketId || null;
          const seatEventId = row.eventId || effectiveSection?.eventId || tier?.eventId || stand?.eventId || eventId || null;
          
          seats.push({
            id: seatId,
            number: seatNumber,
            rowLabel: row.label,
            sectionName: effectiveSection?.name || 'General',
            ticketId: seatTicketId,
            eventId: seatEventId,
            icon: seatIcon,
            x, y,
            size: seatSize,
            status: isSelected ? 'selected' : (isBlocked ? 'blocked' : 'available'),
          });
          
          currentX += seatUnit;
        }
        
        // Update tunnel bounds
        if (tunnelBounds[tunnel.id]) {
          tunnelBounds[tunnel.id].minY = Math.min(tunnelBounds[tunnel.id].minY, currentY - 5);
          tunnelBounds[tunnel.id].maxY = Math.max(tunnelBounds[tunnel.id].maxY, currentY + seatSize + 5);
          tunnelBounds[tunnel.id].x = tunnelCenterFixed;
        }
        
        // Place RIGHT SIDE seats
        currentX = rightStartX;
        for (let i = 0; i < seatsOnRight; i++) {
          seatNumber++;
          
          const progress = seatsOnRight > 1 ? i / (seatsOnRight - 1) : 0.5;
          const curveOffset = Math.sin(progress * Math.PI) * curveAmount;
          
          const x = currentX + seatSize / 2;
          const y = currentY + curveOffset;
          
          const seatId = `${effectiveSection?.id || 'SEC'}-${row.label || 'R'}-${seatNumber}`;
          const isSelected = selectedSeats.some(s => s.id === seatId);
          
          const seatTicketId = row.ticketId || effectiveSection?.ticketId || tier?.ticketId || stand?.ticketId || null;
          const seatEventId = row.eventId || effectiveSection?.eventId || tier?.eventId || stand?.eventId || eventId || null;
          
          seats.push({
            id: seatId,
            number: seatNumber,
            rowLabel: row.label,
            sectionName: effectiveSection?.name || 'General',
            ticketId: seatTicketId,
            eventId: seatEventId,
            icon: seatIcon,
            x, y,
            size: seatSize,
            status: isSelected ? 'selected' : (isBlocked ? 'blocked' : 'available'),
          });
          
          currentX += seatUnit;
        }
      } else if (hasBlocks) {
        // BLOCKS MODE: center based on total width
        const thisRowWidth = row.blocks.reduce((sum, block) => {
          if (block.type === 'seats') return sum + (block.seats || 0) * seatUnit;
          if (block.type === 'aisle') return sum + (block.width || 60);
          return sum;
        }, 0);
        const rowStartX = centerX - thisRowWidth / 2;
        
        rowLabels.push({ label: row.label, y: currentY, x: rowStartX - 25 });
        
        let currentX = rowStartX;
        row.blocks.forEach((block) => {
          if (block.type === 'seats') {
            for (let i = 0; i < (block.seats || 0); i++) {
              seatNumber++;
              
              const blockProgress = block.seats > 1 ? i / (block.seats - 1) : 0.5;
              const curveOffset = Math.sin(blockProgress * Math.PI) * curveAmount * 0.5;
              
              const x = currentX + seatSize / 2;
              const y = currentY + curveOffset;
              
              const seatId = `${effectiveSection?.id || 'SEC'}-${row.label || 'R'}-${seatNumber}`;
              const isSelected = selectedSeats.some(s => s.id === seatId);
              
              const seatTicketId = row.ticketId || effectiveSection?.ticketId || tier?.ticketId || stand?.ticketId || null;
              const seatEventId = row.eventId || effectiveSection?.eventId || tier?.eventId || stand?.eventId || eventId || null;
              
              seats.push({
                id: seatId,
                number: seatNumber,
                rowLabel: row.label,
                sectionName: effectiveSection?.name || 'General',
                ticketId: seatTicketId,
                eventId: seatEventId,
                icon: seatIcon,
                x, y,
                size: seatSize,
                status: isSelected ? 'selected' : (isBlocked ? 'blocked' : 'available'),
              });
              
              currentX += seatUnit;
            }
          } else if (block.type === 'aisle') {
            const aisleWidth = block.width || 60;
            rowAisles.push({
              x: currentX + aisleWidth / 2,
              y: currentY,
              width: aisleWidth,
              height: seatSize,
              label: block.label || '',
              rowLabel: row.label,
            });
            currentX += aisleWidth;
          }
        });
      } else {
        // NO TUNNEL, NO BLOCKS: center based on own width (trapezium effect)
        const thisRowWidth = seatCount * seatUnit;
        const rowStartX = centerX - thisRowWidth / 2;
        
        rowLabels.push({ label: row.label, y: currentY, x: rowStartX - 25 });
        
        let currentX = rowStartX;
        for (let i = 0; i < seatCount; i++) {
          seatNumber++;
          
          const progress = seatCount > 1 ? i / (seatCount - 1) : 0.5;
          const curveOffset = Math.sin(progress * Math.PI) * curveAmount * 2;
          
          const x = currentX + seatSize / 2;
          const y = currentY + curveOffset;
          
          const seatId = `${effectiveSection?.id || 'SEC'}-${row.label || 'R'}-${seatNumber}`;
          const isSelected = selectedSeats.some(s => s.id === seatId);
          
          const seatTicketId = row.ticketId || effectiveSection?.ticketId || tier?.ticketId || stand?.ticketId || null;
          const seatEventId = row.eventId || effectiveSection?.eventId || tier?.eventId || stand?.eventId || eventId || null;
          
          seats.push({
            id: seatId,
            number: seatNumber,
            rowLabel: row.label,
            sectionName: effectiveSection?.name || 'General',
            ticketId: seatTicketId,
            eventId: seatEventId,
            icon: seatIcon,
            x, y,
            size: seatSize,
            status: isSelected ? 'selected' : (isBlocked ? 'blocked' : 'available'),
          });
          
          currentX += seatUnit;
        }
      }
      
      currentY += seatSize + rowGap;
    });

    // Build tunnel data
    const tunnels = tunnelZones.map(tz => {
      const bounds = tunnelBounds[tz.id];
      if (bounds && bounds.minY !== Infinity && bounds.x !== 0) {
        return {
          ...tz,
          x: bounds.x,
          startY: bounds.minY - 10,
          endY: bounds.maxY + 10,
        };
      }
      return null;
    }).filter(Boolean);

    return { seats, tunnels, rowLabels, rowAisles };
  }, [effectiveSection, selectedSeats, width, stand, tier, eventId, sectionAisles]);

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

    // 3. Draw EXIT Tunnels FIRST (so seats appear on top of tunnel edges)
    if (seatsData.tunnels && seatsData.tunnels.length > 0) {
      seatsData.tunnels.forEach(tunnel => {
        const tunnelX = tunnel.x - tunnel.halfWidth;
        const tunnelWidth = tunnel.width;
        const tunnelHeight = tunnel.endY - tunnel.startY;

        // Main tunnel background
        const tunnelGradient = ctx.createLinearGradient(tunnelX, tunnel.startY, tunnelX + tunnelWidth, tunnel.startY);
        tunnelGradient.addColorStop(0, 'rgba(20, 20, 30, 0.95)');
        tunnelGradient.addColorStop(0.3, 'rgba(30, 30, 40, 0.9)');
        tunnelGradient.addColorStop(0.7, 'rgba(30, 30, 40, 0.9)');
        tunnelGradient.addColorStop(1, 'rgba(20, 20, 30, 0.95)');
        
        ctx.fillStyle = tunnelGradient;
        ctx.beginPath();
        ctx.roundRect(tunnelX, tunnel.startY, tunnelWidth, tunnelHeight, 6);
        ctx.fill();

        // Inner shadow
        const innerGradient = ctx.createLinearGradient(tunnelX, tunnel.startY, tunnelX, tunnel.endY);
        innerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        innerGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.2)');
        innerGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
        innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.roundRect(tunnelX + 5, tunnel.startY + 5, tunnelWidth - 10, tunnelHeight - 10, 4);
        ctx.fill();

        // Stairs pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        const stepGap = 12;
        for (let sy = tunnel.startY + 20; sy < tunnel.endY - 10; sy += stepGap) {
          ctx.beginPath();
          ctx.moveTo(tunnelX + 8, sy);
          ctx.lineTo(tunnelX + tunnelWidth - 8, sy);
          ctx.stroke();
        }

        // Side railings
        ctx.strokeStyle = 'rgba(150, 150, 160, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tunnelX + 4, tunnel.startY + 10);
        ctx.lineTo(tunnelX + 4, tunnel.endY - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tunnelX + tunnelWidth - 4, tunnel.startY + 10);
        ctx.lineTo(tunnelX + tunnelWidth - 4, tunnel.endY - 10);
        ctx.stroke();

        // Border
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tunnelX, tunnel.startY, tunnelWidth, tunnelHeight, 6);
        ctx.stroke();

        // Sign at top
        if (tunnel.label) {
          const signWidth = tunnel.label.length * 8 + 20;
          const signX = tunnel.x - signWidth / 2;
          const signY = tunnel.startY - 22;
          
          ctx.fillStyle = tunnel.type === 'exit' ? '#389e0d' : 
                          tunnel.type === 'stairs' ? '#d48806' : '#096dd9';
          ctx.beginPath();
          ctx.roundRect(signX, signY, signWidth, 18, 3);
          ctx.fill();
          
          ctx.strokeStyle = tunnel.type === 'exit' ? '#52c41a' : 
                            tunnel.type === 'stairs' ? '#faad14' : '#1890ff';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tunnel.label, tunnel.x, signY + 9);
        }

        // Arrow at bottom
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        const arrowY = tunnel.endY - 20;
        ctx.moveTo(tunnel.x, arrowY + 12);
        ctx.lineTo(tunnel.x - 8, arrowY);
        ctx.lineTo(tunnel.x + 8, arrowY);
        ctx.closePath();
        ctx.fill();
      });
    }

    // 4. Draw Seats (on top of tunnels)
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

      // Draw Seat using the appropriate icon shape
      const renderSize = isHovered ? seat.size * 1.15 : seat.size;
      
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      
      // Get the icon draw function
      const iconKey = seat.icon || 'circle';
      const iconDef = SEAT_ICONS[iconKey] || SEAT_ICONS.circle;
      
      // Draw the seat using the icon's draw function
      iconDef.draw(ctx, seat.x, seat.y, renderSize, fillColor, strokeColor);
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // 4. Seat Number - ALWAYS show, properly sized inside the seat
      // Calculate font size based on seat size (not scale) so it fits inside
      const fontSize = Math.max(8, Math.min(renderSize * 0.45, 12));
      ctx.fillStyle = isSelected || isHovered ? '#fff' : 'rgba(255,255,255,0.8)';
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(seat.number), seat.x, seat.y);
    });

    // 5. Row Labels
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    seatsData.rowLabels.forEach(({ label, x, y }) => {
       // Draw label on left side with background pill
       const labelX = x - 10;
       
       // Background pill
       ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
       ctx.beginPath();
       ctx.roundRect(labelX - 12, y - 10, 24, 20, 10);
       ctx.fill();
       
       // Label text
       ctx.fillStyle = 'rgba(255,255,255,0.7)';
       ctx.fillText(label, labelX, y);
    });

    // 6. Draw Row-level Aisles (from row.blocks)
    if (seatsData.rowAisles && seatsData.rowAisles.length > 0) {
      seatsData.rowAisles.forEach(aisle => {
        const aisleX = aisle.x - aisle.width / 2;
        const aisleY = aisle.y - 2;
        const aisleHeight = aisle.height + 4;
        
        // Aisle background - dark gap
        const aisleGradient = ctx.createLinearGradient(aisleX, aisleY, aisleX + aisle.width, aisleY);
        aisleGradient.addColorStop(0, 'rgba(15, 15, 25, 0.9)');
        aisleGradient.addColorStop(0.5, 'rgba(25, 25, 35, 0.85)');
        aisleGradient.addColorStop(1, 'rgba(15, 15, 25, 0.9)');
        
        ctx.fillStyle = aisleGradient;
        ctx.beginPath();
        ctx.roundRect(aisleX, aisleY, aisle.width, aisleHeight, 4);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Aisle label if provided
        if (aisle.label) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(aisle.label, aisle.x, aisle.y + aisle.height / 2);
        }
      });
    }

    // 8. Selection Box
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
              {/* Show ticket info only if assigned */}
              {hoveredSeat.ticketId && hoveredSeat.eventId && (() => {
                const ticket = getTicketById(hoveredSeat.eventId, hoveredSeat.ticketId);
                if (ticket) {
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Ticket</Text>
                        <Text style={{ color: ticket.color || '#fff', fontSize: 12, fontWeight: 500 }}>{ticket.name}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Price</Text>
                        <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>₹{ticket.price?.toLocaleString()}</Text>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
              
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
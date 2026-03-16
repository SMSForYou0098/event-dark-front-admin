/**
 * StadiumCanvas - Canvas Renderer for Hierarchical Stadium Layout
 * 
 * Schema: Stadium → Stands → Tiers → Sections → Rows → Seats
 * 
 * Features:
 * - Renders stands with multiple tiers
 * - Drill-down: Stand → Tier → Section → Seats
 * - Zoom and pan support
 * - Hover effects with tooltips
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Tag } from 'antd';
import {
  calculateStadiumLayout,
  drawArc,
  drawText,
  drawField,
  polarToCartesian,
  lightenColor,
} from '../utils/stadiumRenderer';
import { getTicketById } from '../api/ticketData';

const StadiumCanvas = ({
  stadium,
  width = 600,
  height = 600,
  onStandClick,
  onTierClick,
  onSectionClick,
  viewLevel = 'stands', // 'stands' | 'tiers' | 'sections'
  selectedStand = null,
  selectedTier = null,
  showLabels = true,
  interactive = true,
}) => {
  const canvasRef = useRef(null);
  const drawRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [clickedItem, setClickedItem] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  
  // Responsive detection
  const isMobile = width <= 500;

  // Calculate layout from stadium data
  const layout = useMemo(() => {
    if (!stadium?.stands?.length) return null;
    return calculateStadiumLayout(stadium, { width, height });
  }, [stadium, width, height]);

  // Extract field type for draw function
  const fieldType = useMemo(() => stadium?.geometry?.field?.type || 'cricket', [stadium?.geometry?.field?.type]);

  // Get items to render based on view level - optimized with early returns
  // If parent is blocked, all children inherit blocked status
  // When viewing sections, recalculate geometry to spread them across more canvas space
  const visibleItems = useMemo(() => {
    if (!layout || !layout.stands?.length) return [];

    if (viewLevel === 'stands') {
      return layout.stands.map(s => ({ ...s, type: 'stand' }));
    }

    if (viewLevel === 'tiers' && selectedStand?.id) {
      const stand = layout.stands.find(s => s.id === selectedStand.id);
      if (!stand?.tiers?.length) return [];
      // If stand is blocked, all tiers are blocked
      const isStandBlocked = stand.status === 'blocked';
      return stand.tiers.map(t => ({ 
        ...t, 
        type: 'tier', 
        parentStand: stand,
        status: isStandBlocked ? 'blocked' : t.status 
      }));
    }

    if (viewLevel === 'sections' && selectedTier?.id && selectedStand?.id) {
      const stand = layout.stands.find(s => s.id === selectedStand.id);
      if (!stand) return [];
      const tier = stand.tiers?.find(t => t.id === selectedTier.id);
      if (!tier?.sections?.length) return [];
      
      // If stand or tier is blocked, all sections are blocked
      const isParentBlocked = stand.status === 'blocked' || tier.status === 'blocked';
      
      // Recalculate section geometry to spread across a larger arc (fan view)
      const totalSections = tier.sections.length;
      const cx = layout.cx;
      const cy = height - 50; // Move center point down for fan effect
      
      // Use larger arc spread for better visibility
      const spreadAngle = Math.min(Math.PI * 0.8, Math.PI * 0.4 + (totalSections * 0.02)); // Dynamic spread based on section count
      const startAngle = -Math.PI / 2 - spreadAngle / 2;
      
      // Calculate radii for fan layout
      const innerRadius = 80;
      const outerRadius = Math.min(width, height) * 0.55;
      
      const sectionGap = 0.015; // Gap between sections in radians
      const availableAngle = spreadAngle - (sectionGap * (totalSections - 1));
      const sectionAngle = availableAngle / totalSections;
      
      return tier.sections.map((section, idx) => {
        const secStartAngle = startAngle + (idx * (sectionAngle + sectionGap));
        const secEndAngle = secStartAngle + sectionAngle;
        const midAngle = (secStartAngle + secEndAngle) / 2;
        
        return {
          ...section,
          type: 'section',
          parentTier: tier,
          parentStand: stand,
          status: isParentBlocked ? 'blocked' : section.status,
          // Override geometry for fan layout
          startAngle: secStartAngle,
          endAngle: secEndAngle,
          midAngle,
          innerRadius,
          outerRadius,
          cx,
          cy,
        };
      });
    }

    return [];
  }, [layout, viewLevel, selectedStand?.id, selectedTier?.id, width, height]);

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Background
    const bgGradient = ctx.createRadialGradient(
      layout.cx, layout.cy, 0,
      layout.cx, layout.cy, layout.maxRadius + 50
    );
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw field only for stands and tiers view (not sections fan view)
    if (viewLevel !== 'sections') {
      drawField(ctx, {
        cx: layout.cx,
        cy: layout.cy,
        radius: layout.fieldRadius,
        type: fieldType,
      });
    } else {
      // Draw stage/screen indicator for sections fan view
      const stageCx = width / 2;
      const stageCy = height - 50;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(stageCx, stageCy + 20, 60, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Stage label
      ctx.fillStyle = '#4ade80';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STAGE / FIELD', stageCx, stageCy + 20);
    }

    // Draw visible items
    visibleItems.forEach(item => {
      const isHovered = hoveredItem?.id === item.id;
      // Item is blocked if explicitly set to 'blocked'
      const isBlocked = item.status === 'blocked';

      // Get color
      let baseColor = item.style?.color || '#3b82f6';
      if (item.type === 'tier' && item.style?.color) {
        baseColor = item.style.color;
      }
      // Use section's parent tier color if available
      if (item.type === 'section' && item.parentTier?.style?.color) {
        baseColor = item.parentTier.style.color;
      }
      
      const fillColor = isBlocked
        ? 'rgba(100, 100, 100, 0.5)'
        : isHovered
          ? lightenColor(baseColor, 0.15)
          : baseColor;

      // Use item's cx/cy if available (for sections fan view), otherwise use layout center
      const centerX = item.cx ?? layout.cx;
      const centerY = item.cy ?? layout.cy;

      // Draw arc
      drawArc(ctx, {
        cx: centerX,
        cy: centerY,
        innerRadius: item.innerRadius,
        outerRadius: item.outerRadius,
        startAngle: item.startAngle,
        endAngle: item.endAngle,
        fill: fillColor,
        stroke: isHovered ? '#fff' : 'rgba(255,255,255,0.15)',
        lineWidth: isHovered ? 2 : 1,
      });

      // Draw label
      if (showLabels) {
        const labelRadius = (item.innerRadius + item.outerRadius) / 2;
        const labelPos = polarToCartesian(centerX, centerY, labelRadius, item.midAngle);

        // Calculate if label fits
        const arcLength = (item.endAngle - item.startAngle) * labelRadius;
        const fontSize = Math.min(13, Math.max(9, arcLength / 5));

        if (arcLength > 25) {
          let labelText = item.name || item.code || '';
          const maxChars = Math.floor(arcLength / (fontSize * 0.55));
          if (labelText.length > maxChars) {
            labelText = labelText.slice(0, maxChars - 1) + '…';
          }

          drawText(ctx, labelText, {
            x: labelPos.x,
            y: labelPos.y,
            fontSize,
            color: isBlocked ? '#888' : '#fff',
          });

          // Show tier count for stands, section count for tiers
          if (item.type === 'stand' && item.tiers?.length) {
            drawText(ctx, `${item.tiers.length} tiers`, {
              x: labelPos.x,
              y: labelPos.y + fontSize + 2,
              fontSize: fontSize - 2,
              color: 'rgba(255,255,255,0.5)',
            });
          }
          if (item.type === 'tier' && item.sections?.length) {
            drawText(ctx, `${item.sections.length} sections`, {
              x: labelPos.x,
              y: labelPos.y + fontSize + 2,
              fontSize: fontSize - 2,
              color: 'rgba(255,255,255,0.5)',
            });
          }
          // Only show price if ticket is actually assigned
          if (item.type === 'tier' && item.ticketId && item.eventId) {
            const ticket = getTicketById(item.eventId, item.ticketId);
            if (ticket?.price) {
              drawText(ctx, `₹${ticket.price.toLocaleString()}`, {
                x: labelPos.x,
                y: labelPos.y + fontSize * 2 + 4,
                fontSize: fontSize - 1,
                color: '#4ade80',
              });
            }
          }
        }
      }
    });

    // Center label - position differently for sections fan view
    if (viewLevel !== 'sections') {
      const levelLabel = viewLevel === 'stands'
        ? 'Click a stand'
        : selectedStand?.name || 'Tiers';

      drawText(ctx, levelLabel, {
        x: layout.cx,
        y: layout.cy + layout.fieldRadius + 18,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
      });
    } else {
      // For sections view, show tier name at top
      drawText(ctx, selectedTier?.name || 'Sections', {
        x: width / 2,
        y: 25,
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
      });
      
      // Show section count
      const sectionCount = visibleItems.length;
      drawText(ctx, `${sectionCount} Sections - Click to view seats`, {
        x: width / 2,
        y: 45,
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
      });
    }

    ctx.restore();
  }, [layout, visibleItems, hoveredItem, scale, offset, width, height, showLabels, viewLevel, selectedStand, selectedTier, fieldType]);

  // Store draw function in ref
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  // Setup canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, [width, height]);

  // Draw when relevant data changes - use requestAnimationFrame for smooth rendering
  useEffect(() => {
    if (!layout || !drawRef.current) return;
    
    const rafId = requestAnimationFrame(() => {
      if (drawRef.current) {
        drawRef.current();
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [layout, visibleItems, hoveredItem, scale, offset, showLabels, viewLevel, selectedStand, selectedTier]);

  // Transform coordinates
  const transformCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    const x = (rawX - width / 2 - offset.x) / scale + width / 2;
    const y = (rawY - height / 2 - offset.y) / scale + height / 2;

    return { x, y };
  }, [width, height, scale, offset]);

  // Find item at position
  const findItem = useCallback((x, y) => {
    if (!layout) return null;

    for (const item of visibleItems) {
      // Use item's own center point if available (for sections fan view)
      const centerX = item.cx ?? layout.cx;
      const centerY = item.cy ?? layout.cy;
      
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < item.innerRadius || distance > item.outerRadius) continue;

      let angle = Math.atan2(dy, dx);
      const TWO_PI = Math.PI * 2;
      while (angle < 0) angle += TWO_PI;
      while (angle >= TWO_PI) angle -= TWO_PI;

      let start = item.startAngle;
      let end = item.endAngle;
      while (start < 0) start += TWO_PI;
      while (end < 0) end += TWO_PI;
      while (start >= TWO_PI) start -= TWO_PI;
      while (end >= TWO_PI) end -= TWO_PI;

      const inAngle = start <= end
        ? (angle >= start && angle <= end)
        : (angle >= start || angle <= end);

      if (inAngle) return item;
    }
    return null;
  }, [layout, visibleItems]);

  // Mouse handlers
  const handleMouseMove = useCallback((e) => {
    if (!interactive) return;

    const { x, y } = transformCoords(e.clientX, e.clientY);
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setOffset({
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      });
      return;
    }

    const item = findItem(x, y);
    setHoveredItem(item);

    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = item ? 'pointer' : 'grab';
  }, [interactive, isDragging, transformCoords, findItem]);

  const handleMouseDown = useCallback((e) => {
    if (!interactive) return;

    const { x, y } = transformCoords(e.clientX, e.clientY);
    const item = findItem(x, y);

    if (item) {
      setClickedItem(item);
    } else {
      setClickedItem(null);
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = 'grabbing';
    }
  }, [interactive, transformCoords, findItem, offset]);

  const handleMouseUp = useCallback((e) => {
    if (isDragging) {
      setIsDragging(false);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = 'grab';
      setClickedItem(null);
      return;
    }

    if (!interactive) return;

    const { x, y } = transformCoords(e.clientX, e.clientY);
    const item = findItem(x, y);

    if (item && clickedItem && item.id === clickedItem.id) {
      if (item.type === 'stand' && onStandClick) {
        // console.log('StadiumCanvas: Stand clicked', item.name, 'tiers:', item.tiers?.length);
        onStandClick(item);
      } else if (item.type === 'tier' && onTierClick) {
        // console.log('StadiumCanvas: Tier clicked', item.name, 'sections:', item.sections?.length);
        onTierClick(item, item.parentStand);
      } else if (item.type === 'section' && onSectionClick) {
        // console.log('StadiumCanvas: Section clicked', item.name, 'rows:', item.rows?.length, 'item:', item);
        onSectionClick(item, item.parentTier, item.parentStand);
      }
    }

    setClickedItem(null);
  }, [interactive, isDragging, clickedItem, transformCoords, findItem, onStandClick, onTierClick, onSectionClick]);

  const handleWheel = useCallback((e) => {
    if (!interactive) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    setOffset(prev => ({
      x: prev.x - mouseX * (delta - 1),
      y: prev.y - mouseY * (delta - 1),
    }));
    setScale(newScale);
  }, [interactive, scale, width, height]);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div style={{ 
      position: 'relative', 
      width, 
      height, 
      borderRadius: isMobile ? 8 : 12, 
      overflow: 'hidden', 
      background: '#0f0f1a',
      touchAction: 'none',
    }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setHoveredItem(null); setIsDragging(false); }}
        onWheel={handleWheel}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
          }
        }}
        onTouchEnd={(e) => {
          if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
          }
        }}
        style={{ display: 'block', touchAction: 'none' }}
      />

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', 
        bottom: isMobile ? 8 : 16, 
        right: isMobile ? 8 : 16,
        display: 'flex', 
        flexDirection: isMobile ? 'row' : 'column', 
        gap: 4,
        background: 'rgba(0,0,0,0.6)', 
        borderRadius: 8, 
        padding: 4,
      }}>
        <button onClick={() => setScale(s => Math.min(3, s * 1.2))} style={{
          ...zoomBtnStyle,
          width: isMobile ? 28 : 32,
          height: isMobile ? 28 : 32,
          fontSize: isMobile ? 16 : 18,
        }}>+</button>
        <button onClick={resetView} style={{ 
          ...zoomBtnStyle, 
          width: isMobile ? 28 : 32,
          height: isMobile ? 28 : 32,
          fontSize: isMobile ? 9 : 10 
        }}>⟲</button>
        <button onClick={() => setScale(s => Math.max(0.5, s * 0.8))} style={{
          ...zoomBtnStyle,
          width: isMobile ? 28 : 32,
          height: isMobile ? 28 : 32,
          fontSize: isMobile ? 16 : 18,
        }}>−</button>
      </div>

      {/* Zoom indicator */}
      <Tag style={{ 
        position: 'absolute', 
        bottom: isMobile ? 8 : 16, 
        left: isMobile ? 8 : 16, 
        background: 'rgba(0,0,0,0.6)', 
        border: 'none', 
        color: '#fff',
        fontSize: isMobile ? 10 : 12,
        padding: isMobile ? '2px 6px' : '4px 8px',
      }}>
        {Math.round(scale * 100)}%
      </Tag>

      {/* Tooltip - only on non-mobile (no hover on touch) */}
      {hoveredItem && !isDragging && !isMobile && (
        <div style={{
          position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 10,
          background: 'rgba(20, 20, 35, 0.98)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 13,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 1000, minWidth: 180,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            {hoveredItem.name}
          </div>
          {hoveredItem.type === 'stand' && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Tiers:</span>
                <span style={{ color: '#60a5fa' }}>{hoveredItem.tiers?.length || 0}</span>
              </div>
              {hoveredItem.geometry && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Start Angle:</span>
                    <span style={{ color: '#a78bfa' }}>{hoveredItem.geometry.startAngle?.toFixed(1) || 0}°</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>End Angle:</span>
                    <span style={{ color: '#a78bfa' }}>{hoveredItem.geometry.endAngle?.toFixed(1) || 0}°</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Arc Span:</span>
                    <span style={{ color: '#f59e0b' }}>{((hoveredItem.geometry.endAngle || 0) - (hoveredItem.geometry.startAngle || 0)).toFixed(1)}°</span>
                  </div>
                  {hoveredItem.geometry.visualWeight && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Weight:</span>
                      <span style={{ color: '#10b981' }}>{hoveredItem.geometry.visualWeight}</span>
                    </div>
                  )}
                </>
              )}
              <div style={{ marginTop: 8, color: '#1890ff', textAlign: 'center' }}>Click to view tiers →</div>
            </div>
          )}
          {hoveredItem.type === 'tier' && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Level:</span>
                <span style={{ color: '#60a5fa' }}>{(hoveredItem.level || 0) + 1}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Sections:</span>
                <span style={{ color: '#60a5fa' }}>{hoveredItem.sections?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Total Seats:</span>
                <span style={{ color: '#a78bfa' }}>{hoveredItem.sections?.reduce((sum, s) => sum + (s.rows?.reduce((rs, r) => rs + (r.seatCount || 0), 0) || 0), 0) || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Ticket:</span>
                {hoveredItem.ticketId ? (
                  <span style={{ color: '#4ade80' }}>₹{hoveredItem.basePrice}</span>
                ) : (
                  <span style={{ color: '#f87171' }}>Not assigned</span>
                )}
              </div>
              <div style={{ marginTop: 8, color: '#1890ff', textAlign: 'center' }}>Click to view sections →</div>
            </div>
          )}
          {hoveredItem.type === 'section' && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Code:</span>
                <span style={{ color: '#60a5fa' }}>{hoveredItem.code || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Rows:</span>
                <span style={{ color: '#a78bfa' }}>{hoveredItem.rows?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Total Seats:</span>
                <span style={{ color: '#10b981' }}>{hoveredItem.rows?.reduce((sum, r) => sum + (r.seatCount || 0), 0) || 0}</span>
              </div>
              <div style={{ marginTop: 8, color: '#1890ff', textAlign: 'center' }}>Click to view seats →</div>
            </div>
          )}
        </div>
      )}

      {/* Mobile: Tap instructions */}
      {isMobile && viewLevel === 'stands' && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'rgba(255,255,255,0.7)',
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}>
          Tap a stand to view tiers
        </div>
      )}
    </div>
  );
};

const zoomBtnStyle = {
  width: 32, height: 32, border: 'none',
  background: 'rgba(255,255,255,0.1)', color: '#fff',
  borderRadius: 4, cursor: 'pointer', fontSize: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default React.memo(StadiumCanvas, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.stadium === nextProps.stadium &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.viewLevel === nextProps.viewLevel &&
    prevProps.selectedStand?.id === nextProps.selectedStand?.id &&
    prevProps.selectedTier?.id === nextProps.selectedTier?.id &&
    prevProps.showLabels === nextProps.showLabels &&
    prevProps.interactive === nextProps.interactive
  );
});

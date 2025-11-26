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
  findItemAtPosition,
  drawArc,
  drawText,
  drawField,
  polarToCartesian,
  lightenColor,
  withAlpha,
} from '../utils/stadiumRenderer';

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

  // Get items to render based on view level
  const visibleItems = useMemo(() => {
    if (!layout) return [];

    if (viewLevel === 'stands') {
      return layout.stands.map(s => ({ ...s, type: 'stand' }));
    }

    if (viewLevel === 'tiers' && selectedStand) {
      const stand = layout.stands.find(s => s.id === selectedStand.id);
      if (!stand) return [];
      return stand.tiers.map(t => ({ ...t, type: 'tier', parentStand: stand }));
    }

    if (viewLevel === 'sections' && selectedTier) {
      const stand = layout.stands.find(s => s.id === selectedStand?.id);
      const tier = stand?.tiers.find(t => t.id === selectedTier.id);
      if (!tier) return [];
      return tier.sections.map(s => ({ ...s, type: 'section', parentTier: tier, parentStand: stand }));
    }

    return [];
  }, [layout, viewLevel, selectedStand, selectedTier]);

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

    // Draw field
    drawField(ctx, {
      cx: layout.cx,
      cy: layout.cy,
      radius: layout.fieldRadius,
      type: stadium.geometry?.field?.type || 'cricket',
    });

    // Draw visible items
    visibleItems.forEach(item => {
      const isHovered = hoveredItem?.id === item.id;
      const isBlocked = item.status === 'blocked';

      // Get color
      let baseColor = item.style?.color || '#3b82f6';
      if (item.type === 'tier' && item.style?.color) {
        baseColor = item.style.color;
      }
      
      const fillColor = isBlocked
        ? 'rgba(100, 100, 100, 0.5)'
        : isHovered
          ? lightenColor(baseColor, 0.15)
          : baseColor;

      // Draw arc
      drawArc(ctx, {
        cx: layout.cx,
        cy: layout.cy,
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
        const labelPos = polarToCartesian(layout.cx, layout.cy, labelRadius, item.midAngle);

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
          if (item.type === 'tier' && item.basePrice) {
            drawText(ctx, `₹${item.basePrice}`, {
              x: labelPos.x,
              y: labelPos.y + fontSize * 2 + 4,
              fontSize: fontSize - 1,
              color: 'rgba(255,255,255,0.6)',
            });
          }
        }
      }
    });

    // Center label
    const levelLabel = viewLevel === 'stands'
      ? 'Click a stand'
      : viewLevel === 'tiers'
        ? selectedStand?.name || 'Tiers'
        : selectedTier?.name || 'Sections';

    drawText(ctx, levelLabel, {
      x: layout.cx,
      y: layout.cy + layout.fieldRadius + 18,
      fontSize: 11,
      color: 'rgba(255,255,255,0.4)',
    });

    ctx.restore();
  }, [layout, visibleItems, hoveredItem, scale, offset, width, height, showLabels, viewLevel, selectedStand, selectedTier, stadium]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    draw();
  }, [width, height, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

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
      const dx = x - layout.cx;
      const dy = y - layout.cy;
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
        console.log('StadiumCanvas: Stand clicked', item.name, 'tiers:', item.tiers?.length);
        onStandClick(item);
      } else if (item.type === 'tier' && onTierClick) {
        console.log('StadiumCanvas: Tier clicked', item.name, 'sections:', item.sections?.length);
        onTierClick(item, item.parentStand);
      } else if (item.type === 'section' && onSectionClick) {
        console.log('StadiumCanvas: Section clicked', item.name, 'rows:', item.rows?.length, 'item:', item);
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
          background: 'rgba(20, 20, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 1000, minWidth: 150,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoveredItem.name}</div>
          {hoveredItem.type === 'stand' && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {hoveredItem.tiers?.length || 0} tier(s)<br />
              <span style={{ color: '#1890ff' }}>Click to view tiers</span>
            </div>
          )}
          {hoveredItem.type === 'tier' && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {hoveredItem.sections?.length || 0} section(s)<br />
              {hoveredItem.basePrice && `₹${hoveredItem.basePrice}`}<br />
              <span style={{ color: '#1890ff' }}>Click to view sections</span>
            </div>
          )}
          {hoveredItem.type === 'section' && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {hoveredItem.rows?.length || 0} row(s)<br />
              <span style={{ color: '#1890ff' }}>Click to view seats</span>
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

export default StadiumCanvas;

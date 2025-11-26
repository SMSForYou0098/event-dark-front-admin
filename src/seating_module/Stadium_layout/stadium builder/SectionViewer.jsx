import React, { useState, useRef, useCallback, useEffect } from 'react';
import { areAllSeatsBooked, describeArc, polarToCartesian } from "./helperFuntion";
import { Button, Tooltip, Typography, Space, Tag } from "antd";
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  ExpandOutlined,
  LockOutlined,
  CheckCircleOutlined 
} from "@ant-design/icons";
import { useMyContext } from 'Context/MyContextProvider';

const { Text } = Typography;

const SectionViewer = ({ sections, onSelectSection, isUser, className = "" }) => {
  const { isMobile } = useMyContext?.() || { isMobile: false };
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSection, setHoveredSection] = useState(null);
  
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // SVG dimensions
  const cx = 250;
  const cy = 250;
  const viewBoxSize = 500;
  
  // Arc configuration - more spread out for better visibility
  const arcSpan = 180; // Wider arc span
  const startAngleOffset = -arcSpan / 2;
  const totalSections = sections?.length || 0;
  const anglePerSegment = totalSections > 0 ? arcSpan / totalSections : 0;
  const gapAngle = 2; // Gap between sections

  // Radius configuration
  const innerRadius = 90;
  const outerRadius = 180;
  const centerCircleRadius = 70;

  // Color palette - vibrant but harmonious
  const sectionColors = [
    { bg: '#4CAF50', hover: '#66BB6A', text: '#fff' },
    { bg: '#2196F3', hover: '#42A5F5', text: '#fff' },
    { bg: '#FF9800', hover: '#FFB74D', text: '#fff' },
    { bg: '#9C27B0', hover: '#BA68C8', text: '#fff' },
    { bg: '#00BCD4', hover: '#4DD0E1', text: '#fff' },
    { bg: '#E91E63', hover: '#F06292', text: '#fff' },
    { bg: '#673AB7', hover: '#9575CD', text: '#fff' },
    { bg: '#009688', hover: '#4DB6AC', text: '#fff' },
  ];

  const getColor = (index) => sectionColors[index % sectionColors.length];

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  }, [position]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseUp]);

  if (totalSections === 0) {
    return (
      <div className={`${className} d-flex align-items-center justify-content-center`} 
           style={{ minHeight: 300 }}>
        <Text type="secondary">No sections available</Text>
      </div>
    );
  }

  const renderSections = () => {
    const elements = [];

    sections.forEach((section, index) => {
      const effectiveGap = gapAngle / 2;
      const startAngle = startAngleOffset + index * anglePerSegment + effectiveGap;
      const endAngle = startAngle + anglePerSegment - gapAngle;
      const isSectionBooked = areAllSeatsBooked(section);
      const isBlocked = section.isBlocked;
      const isDisabled = isBlocked || isSectionBooked;
      const isHovered = hoveredSection === index;

      const colors = getColor(index);
      let fillColor = colors.bg;
      
      if (isBlocked) {
        fillColor = '#6c757d';
      } else if (isSectionBooked) {
        fillColor = '#343a40';
      } else if (isHovered) {
        fillColor = colors.hover;
      }

      // Section arc
      elements.push(
        <path
          key={`section-${index}`}
          d={describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
          fill={fillColor}
          stroke={isHovered && !isDisabled ? '#fff' : 'rgba(255,255,255,0.3)'}
          strokeWidth={isHovered && !isDisabled ? 2.5 : 1}
          onClick={() => !isDisabled && isUser && onSelectSection(section)}
          onMouseEnter={() => !isDisabled && setHoveredSection(index)}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isBlocked ? 0.5 : 1,
            transition: 'all 0.2s ease-out',
            filter: isHovered && !isDisabled ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
            transform: isHovered && !isDisabled ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      );

      // Section label
      const middleAngle = (startAngle + endAngle) / 2;
      const labelRadius = (innerRadius + outerRadius) / 2;
      const labelPos = polarToCartesian(cx, cy, labelRadius, middleAngle);

      // Status icon position
      const iconRadius = labelRadius + 18;
      const iconPos = polarToCartesian(cx, cy, iconRadius, middleAngle);

      elements.push(
        <g key={`section-group-${index}`}>
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isMobile ? 11 : 14}
            fontWeight="700"
            fill={colors.text}
            style={{ 
              pointerEvents: 'none',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              letterSpacing: '0.5px'
            }}
          >
            {section.name || `Section ${index + 1}`}
          </text>
          {isBlocked && (
            <g transform={`translate(${iconPos.x - 8}, ${iconPos.y - 8})`}>
              <circle cx="8" cy="8" r="10" fill="rgba(0,0,0,0.6)" />
              <text x="8" y="12" textAnchor="middle" fontSize="12" fill="#fff">🔒</text>
            </g>
          )}
          {isSectionBooked && !isBlocked && (
            <g transform={`translate(${iconPos.x - 8}, ${iconPos.y - 8})`}>
              <circle cx="8" cy="8" r="10" fill="rgba(0,0,0,0.6)" />
              <text x="8" y="12" textAnchor="middle" fontSize="12" fill="#fff">✓</text>
            </g>
          )}
        </g>
      );
    });

    return elements;
  };

  return (
    <div 
      ref={containerRef}
      className={`${className} position-relative`}
      style={{ 
        width: '100%',
        height: isMobile ? '400px' : '500px',
        overflow: 'hidden',
        borderRadius: 12,
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Zoom Controls */}
      <div 
        className="position-absolute d-flex flex-column gap-2"
        style={{ 
          top: 12, 
          right: 12, 
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 8,
          padding: 8,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Tooltip title="Zoom In" placement="left">
          <Button 
            type="text" 
            icon={<ZoomInOutlined style={{ color: '#fff' }} />}
            onClick={handleZoomIn}
            size="small"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
        </Tooltip>
        <Tooltip title="Zoom Out" placement="left">
          <Button 
            type="text" 
            icon={<ZoomOutOutlined style={{ color: '#fff' }} />}
            onClick={handleZoomOut}
            size="small"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
        </Tooltip>
        <Tooltip title="Reset View" placement="left">
          <Button 
            type="text" 
            icon={<ExpandOutlined style={{ color: '#fff' }} />}
            onClick={handleReset}
            size="small"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
        </Tooltip>
      </div>

      {/* Zoom Level Indicator */}
      <div 
        className="position-absolute"
        style={{ 
          bottom: 12, 
          right: 12, 
          zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 6,
          padding: '4px 10px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12 }}>{Math.round(scale * 100)}%</Text>
      </div>

      {/* Legend */}
      <div 
        className="position-absolute d-flex flex-wrap gap-2"
        style={{ 
          top: 12, 
          left: 12, 
          zIndex: 10,
          maxWidth: isMobile ? '60%' : '40%',
        }}
      >
        <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
          <CheckCircleOutlined /> Available
        </Tag>
        <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
          <LockOutlined /> Blocked
        </Tag>
      </div>

      {/* SVG Container */}
      <div
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Decorative rings */}
          <circle 
            cx={cx} 
            cy={cy} 
            r={outerRadius + 15} 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="1"
          />
          <circle 
            cx={cx} 
            cy={cy} 
            r={innerRadius - 10} 
            fill="none" 
            stroke="rgba(255,255,255,0.08)" 
            strokeWidth="1"
          />

          {/* Center field/stage */}
          <defs>
            <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2e7d32" />
              <stop offset="100%" stopColor="#1b5e20" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle
            cx={cx}
            cy={cy}
            r={centerCircleRadius}
            fill="url(#centerGradient)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Center text */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="600"
            fill="rgba(255,255,255,0.8)"
            style={{ letterSpacing: '1px' }}
          >
            STAGE
          </text>

          {/* Render sections */}
          <g>{renderSections()}</g>
        </svg>
      </div>

      {/* Hovered Section Info */}
      {hoveredSection !== null && sections[hoveredSection] && (
        <div 
          className="position-absolute"
          style={{ 
            bottom: 12, 
            left: 12, 
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 8,
            padding: '8px 14px',
            backdropFilter: 'blur(8px)',
            border: `2px solid ${getColor(hoveredSection).bg}`,
          }}
        >
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: '#fff', fontSize: 14 }}>
              {sections[hoveredSection].name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {sections[hoveredSection].rows?.length || 0} rows • Click to select
            </Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default SectionViewer;

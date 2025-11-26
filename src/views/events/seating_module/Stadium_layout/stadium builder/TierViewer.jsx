import React, { useState, useRef, useCallback, useEffect } from "react";
import { describeArc, polarToCartesian } from "./helperFuntion";
import { Button, Tooltip, Typography, Space, Tag } from "antd";
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  ExpandOutlined,
  LockOutlined,
  AppstoreOutlined 
} from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";

const { Text } = Typography;

const TierViewer = ({ tiers, onSelectTier, isUser, className = "" }) => {
  const { isMobile } = useMyContext?.() || { isMobile: false };
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTier, setHoveredTier] = useState(null);
  
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // SVG dimensions
  const cx = 250;
  const cy = 280; // Shifted down slightly for better visual balance
  const viewBoxSize = 500;
  
  // Arc configuration
  const arcSpan = 160;
  const startAngle = -arcSpan / 2;
  const endAngle = arcSpan / 2;
  const tierThickness = 45;
  const tierGap = 4;
  const innerRadiusStart = 80;
  const centerCircleRadius = 60;

  // Color palette - gradient-like tiers
  const tierColors = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', solid: '#667eea', hover: '#8b9cf5' },
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', solid: '#f093fb', hover: '#f5a8c6' },
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', solid: '#4facfe', hover: '#7fc4ff' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', solid: '#43e97b', hover: '#6ef09a' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', solid: '#fa709a', hover: '#fb9ab8' },
    { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', solid: '#a8edea', hover: '#c5f3f0' },
  ];

  const getColor = (index) => tierColors[index % tierColors.length];

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

  if (!tiers || tiers.length === 0) {
    return (
      <div className={`${className} d-flex align-items-center justify-content-center`} 
           style={{ minHeight: 300 }}>
        <Text type="secondary">No tiers available</Text>
      </div>
    );
  }

  const renderTiers = () => {
    const elements = [];

    tiers.forEach((tier, index) => {
      const innerRadius = innerRadiusStart + index * (tierThickness + tierGap);
      const outerRadius = innerRadius + tierThickness;
      const isBlocked = tier.isBlocked;
      const isHovered = hoveredTier === index;

      const colors = getColor(index);

      // Create gradient definition for this tier
      const gradientId = `tierGradient-${index}`;

      elements.push(
        <defs key={`defs-${index}`}>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isBlocked ? '#6c757d' : colors.solid} />
            <stop offset="100%" stopColor={isBlocked ? '#495057' : colors.hover} />
          </linearGradient>
        </defs>
      );

      // Tier arc
      elements.push(
        <path
          key={`tier-${index}`}
          d={describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
          fill={`url(#${gradientId})`}
          stroke={isHovered && !isBlocked ? '#fff' : 'rgba(255,255,255,0.2)'}
          strokeWidth={isHovered && !isBlocked ? 3 : 1.5}
          onClick={() => !isBlocked && isUser && onSelectTier(tier)}
          onMouseEnter={() => !isBlocked && setHoveredTier(index)}
          onMouseLeave={() => setHoveredTier(null)}
          style={{
            cursor: isBlocked ? 'not-allowed' : 'pointer',
            opacity: isBlocked ? 0.5 : 0.95,
            transition: 'all 0.25s ease-out',
            filter: isHovered && !isBlocked 
              ? 'brightness(1.15) drop-shadow(0 6px 12px rgba(0,0,0,0.4))' 
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            transform: isHovered && !isBlocked ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      );

      // Tier label
      const labelAngle = 0; // Center of the arc
      const labelRadius = (innerRadius + outerRadius) / 2;
      const labelPos = polarToCartesian(cx, cy, labelRadius, labelAngle);

      // Sections count badge position
      const badgeAngle = arcSpan / 4;
      const badgePos = polarToCartesian(cx, cy, labelRadius, badgeAngle);

      elements.push(
        <g key={`tier-group-${index}`}>
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isMobile ? 13 : 16}
            fontWeight="800"
            fill="#fff"
            style={{ 
              pointerEvents: 'none',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.5px'
            }}
          >
            {tier.name || `Tier ${index + 1}`}
          </text>
          
          {/* Sections count */}
          {tier.sections && tier.sections.length > 0 && (
            <g transform={`translate(${badgePos.x - 12}, ${badgePos.y - 10})`}>
              <rect 
                x="0" y="0" 
                width="24" height="20" 
                rx="4" 
                fill="rgba(0,0,0,0.5)"
              />
              <text 
                x="12" y="14" 
                textAnchor="middle" 
                fontSize="10" 
                fontWeight="600"
                fill="#fff"
              >
                {tier.sections.length}
              </text>
            </g>
          )}

          {isBlocked && (
            <g transform={`translate(${labelPos.x + 30}, ${labelPos.y - 10})`}>
              <circle cx="0" cy="0" r="12" fill="rgba(0,0,0,0.6)" />
              <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#fff">🔒</text>
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
        <Tag color="processing" style={{ margin: 0, fontSize: 11 }}>
          <AppstoreOutlined /> {tiers.length} Tiers
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
          {/* Background decorative elements */}
          <defs>
            <radialGradient id="centerFieldGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2e7d32" />
              <stop offset="70%" stopColor="#1b5e20" />
              <stop offset="100%" stopColor="#145214" />
            </radialGradient>
            <filter id="tierGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Decorative outer ring */}
          <circle 
            cx={cx} 
            cy={cy} 
            r={innerRadiusStart + tiers.length * (tierThickness + tierGap) + 20} 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="2"
            strokeDasharray="8 4"
          />

          {/* Center field/stage */}
          <circle
            cx={cx}
            cy={cy}
            r={centerCircleRadius}
            fill="url(#centerFieldGradient)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            filter="url(#tierGlow)"
          />
          
          {/* Center field markings */}
          <circle
            cx={cx}
            cy={cy}
            r={centerCircleRadius * 0.6}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* Center text */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="700"
            fill="rgba(255,255,255,0.9)"
            style={{ letterSpacing: '2px' }}
          >
            FIELD
          </text>

          {/* Render tiers */}
          <g>{renderTiers()}</g>
        </svg>
      </div>

      {/* Hovered Tier Info */}
      {hoveredTier !== null && tiers[hoveredTier] && (
        <div 
          className="position-absolute"
          style={{ 
            bottom: 12, 
            left: 12, 
            zIndex: 10,
            background: 'rgba(0,0,0,0.85)',
            borderRadius: 8,
            padding: '10px 16px',
            backdropFilter: 'blur(8px)',
            border: `2px solid ${getColor(hoveredTier).solid}`,
            minWidth: 150,
          }}
        >
          <Space direction="vertical" size={4}>
            <Text strong style={{ color: '#fff', fontSize: 15 }}>
              {tiers[hoveredTier].name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {tiers[hoveredTier].sections?.length || 0} sections
            </Text>
            <Text style={{ color: getColor(hoveredTier).solid, fontSize: 11 }}>
              Click to view sections →
            </Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default TierViewer;

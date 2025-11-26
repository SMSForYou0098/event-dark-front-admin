import React, { useState, useRef, useCallback, useEffect } from "react";
import SeatsGrid from "./SeatsGrid";
import TierViewer from "./TierViewer";
import SectionViewer from "./SectionViewer";
import StandsViewer from "./StandsViewer";
import { Badge, Button, Space, Typography, Tooltip, Segmented, Tag } from "antd";
import SelectedSeatsModal from "./SelectedSeatsModal";
import {
  EyeOutlined,
  BankOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";

const { Title, Text } = Typography;

const StadiumSvgViewer = ({ standsData, isUser = true, handleSubmit, enableDrilldown = false }) => {
  const { isMobile } = useMyContext();
  
  // View state
  const [hoveredStand, setHoveredStand] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [viewMode, setViewMode] = useState("stands");
  const [showModal, setShowModal] = useState(false);
  const [detailView, setDetailView] = useState("stands");
  const [showSeatsModal, setSeatsShowModal] = useState(false);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const svgContainerRef = useRef(null);

  const canInteract = isUser || enableDrilldown;

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
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

  // Touch handlers for mobile
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

  const renderModalContent = () => {
    switch (viewMode) {
      case "tiers":
        return (
          <div className="p-3 p-md-4">
            <div className="text-center mb-4">
              <Space direction="vertical" align="center" size="small">
                <Tag 
                  icon={<BankOutlined />} 
                  color="blue"
                  style={{ fontSize: 14, padding: '4px 12px' }}
                >
                  {selectedStand?.name}
                </Tag>
                <Text type="secondary">Select a tier to view sections</Text>
              </Space>
            </div>
            <TierViewer
              tiers={selectedStand?.tiers || []}
              onSelectTier={(tier) => {
                setSelectedTier(tier);
                setViewMode("sections");
              }}
              isUser={canInteract}
            />
          </div>
        );

      case "sections":
        return (
          <div className="p-3 p-md-4">
            <div className="text-center mb-4">
              <Space wrap size="small" className="justify-content-center">
                <Tag icon={<BankOutlined />} color="blue" style={{ fontSize: 13 }}>
                  {selectedStand?.name}
                </Tag>
                <Tag icon={<AppstoreOutlined />} color="cyan" style={{ fontSize: 13 }}>
                  {selectedTier?.name}
                </Tag>
              </Space>
              <div className="mt-2">
                <Text type="secondary">Select a section to view seats</Text>
              </div>
            </div>
            <SectionViewer
              sections={selectedTier?.sections || []}
              onSelectSection={(section) => {
                setSelectedSection(section);
                setViewMode("seats");
              }}
              isUser={canInteract}
            />
          </div>
        );

      case "seats":
        return (
          <div className="p-3 p-md-4">
            <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} justify-content-between align-items-center mb-4`} style={{ gap: '0.75rem' }}>
              {/* Breadcrumb Tags */}
              <Space wrap size="small">
                <Tag icon={<BankOutlined />} color="blue">{selectedStand?.name}</Tag>
                <Tag icon={<AppstoreOutlined />} color="cyan">{selectedTier?.name}</Tag>
                <Tag icon={<LayoutOutlined />} color="gold">{selectedSection?.name}</Tag>
              </Space>
              {/* View Selected Button */}
              <Button
                type="default"
                size={isMobile ? "small" : "middle"}
                icon={<EyeOutlined />}
                onClick={() => setSeatsShowModal(!showSeatsModal)}
                style={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                }}
              >
                View Selected ({selectedSeats.length})
              </Button>
            </div>
            {/* Seats Grid */}
            <SeatsGrid
              selectedSection={selectedSection}
              tier={selectedTier}
              stand={selectedStand}
              selectedSeats={selectedSeats}
              setSelectedSeats={setSelectedSeats}
              isMobile={isMobile}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooterButtons = () => {
    const buttonSize = isMobile ? "middle" : "large";

    switch (viewMode) {
      case "tiers":
        return (
          <Button
            type="primary"
            size={buttonSize}
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              setViewMode("stands");
              setShowModal(false);
            }}
          >
            Back to Stadium
          </Button>
        );
      case "sections":
        return (
          <Button
            type="primary"
            size={buttonSize}
            icon={<ArrowLeftOutlined />}
            onClick={() => setViewMode("tiers")}
          >
            Back to Tiers
          </Button>
        );
      case "seats":
        return (
          <>
            {isUser && selectedSeats?.length > 0 && (
              <div className="w-100 text-center mb-3">
                <Text className="text-white">
                  <Text strong style={{ color: 'var(--primary-color)' }}>{selectedSeats?.length}</Text> seat(s) selected • Total:{' '}
                  <Text strong style={{ color: 'var(--success-color)' }}>
                    ₹{selectedSeats?.reduce((sum, seat) => sum + parseFloat(seat.price || 0), 0).toFixed(2)}
                  </Text>
                </Text>
              </div>
            )}
            <div className="w-100 d-flex justify-content-between align-items-center" style={{ gap: '0.75rem' }}>
              <Button
                type="primary"
                size={buttonSize}
                icon={<ArrowLeftOutlined />}
                onClick={() => setViewMode("sections")}
              >
                Back to Sections
              </Button>
              {isUser && typeof handleSubmit === 'function' && (
                <Button
                  type="primary"
                  size={buttonSize}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleSubmit(selectedSeats);
                    setShowModal(false);
                    setSelectedSeats([]);
                  }}
                  style={{ 
                    backgroundColor: 'var(--success-color)', 
                    borderColor: 'var(--success-color)' 
                  }}
                  disabled={!selectedSeats?.length}
                >
                  Confirm Booking
                </Button>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleMouseEnter = (standName, e) => {
    setHoveredStand(standName);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredStand(null);
  };

  const viewOptions = [
    { label: 'Stands', value: 'stands' },
    { label: 'Tiers', value: 'tiers' },
    { label: 'Sections', value: 'sections' },
  ];

  return (
    <>
      <div 
        ref={containerRef}
        className="position-relative d-flex flex-column" 
        style={{ 
          height: isMobile ? "500px" : "700px",
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top Controls Bar */}
        <div 
          className="d-flex justify-content-between align-items-center flex-wrap p-3"
          style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            gap: '0.75rem',
          }}
        >
          {/* View Mode Selector */}
          <Segmented
            options={viewOptions}
            value={detailView}
            onChange={setDetailView}
            size={isMobile ? "small" : "middle"}
          />

          {/* Zoom Controls */}
          <Space size="small">
            <Tooltip title="Zoom Out">
              <Button 
                type="text" 
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
                size="small"
                style={{ color: '#fff' }}
              />
            </Tooltip>
            <Tag style={{ margin: 0, minWidth: 50, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Tag>
            <Tooltip title="Zoom In">
              <Button 
                type="text" 
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
                size="small"
                style={{ color: '#fff' }}
              />
            </Tooltip>
            <Tooltip title="Reset View">
              <Button 
                type="text" 
                icon={<ExpandOutlined />}
                onClick={handleReset}
                size="small"
                style={{ color: '#fff' }}
              />
            </Tooltip>
          </Space>
        </div>

        {/* Main SVG Container */}
        <div 
          ref={svgContainerRef}
          className="flex-grow-1 position-relative" 
          style={{ 
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
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
              viewBox="0 0 500 500"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                </pattern>
                <radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2e7d32" />
                  <stop offset="70%" stopColor="#1b5e20" />
                  <stop offset="100%" stopColor="#145214" />
                </radialGradient>
                <filter id="fieldGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <rect width="500" height="500" fill="url(#grid)" />
              
              {/* Center field */}
              <circle 
                cx="250" 
                cy="250" 
                r="60" 
                fill="url(#fieldGradient)" 
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                filter="url(#fieldGlow)"
              />
              <circle 
                cx="250" 
                cy="250" 
                r="35" 
                fill="none" 
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
              <text
                x="250"
                y="250"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="rgba(255,255,255,0.7)"
                style={{ letterSpacing: '2px' }}
              >
                FIELD
              </text>

              {/* Stands */}
              <StandsViewer
                standsData={standsData}
                isUser={canInteract}
                onSelectStand={(stand) => {
                  setSelectedStand(stand);
                  setViewMode("tiers");
                  setShowModal(true);
                }}
                onSelectSection={(section, stand, tier) => {
                  setSelectedSection(section);
                  setSelectedTier(tier);
                  setSelectedStand(stand);
                  setViewMode("seats");
                  setShowModal(true);
                }}
                onSelectTier={(tier, stand) => {
                  setSelectedTier(tier);
                  setSelectedStand(stand);
                  setViewMode("sections");
                  setShowModal(true);
                }}
                viewDetail={detailView}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            </svg>
          </div>

          {/* Tooltip */}
          {hoveredStand && (
            <div 
              className="position-fixed"
              style={{
                left: `${tooltipPosition.x + 15}px`,
                top: `${tooltipPosition.y + 15}px`,
                background: 'rgba(0,0,0,0.85)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                pointerEvents: 'none',
                zIndex: 9999,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {hoveredStand}
            </div>
          )}
        </div>

        {/* Info Bar */}
        <div 
          className="d-flex justify-content-between align-items-center px-3 py-2"
          style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            {standsData?.length || 0} stands • Click to explore
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            Scroll to zoom • Drag to pan
          </Text>
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div 
            className="position-absolute d-flex flex-column"
            style={{
              inset: 0,
              zIndex: 1050,
              background: 'linear-gradient(145deg, #0a0a1a 0%, #1a1a2e 100%)',
              borderRadius: 16,
            }}
          >
            {/* Modal Header */}
            <div 
              className="d-flex justify-content-between align-items-center px-4 py-3"
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Title level={5} className="m-0" style={{ color: '#fff' }}>
                {viewMode === 'tiers' && 'Select Tier'}
                {viewMode === 'sections' && 'Select Section'}
                {viewMode === 'seats' && 'Select Seats'}
              </Title>
              <Button
                type="text"
                icon={<CloseOutlined style={{ color: '#fff' }} />}
                onClick={() => setShowModal(false)}
              />
            </div>

            {/* Modal Body */}
            <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
              {renderModalContent()}
            </div>

            {/* Modal Footer */}
            <div 
              className="px-4 py-3"
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {renderFooterButtons()}
            </div>
          </div>
        )}
      </div>

      <SelectedSeatsModal
        isMobile={isMobile}
        selectedSeats={selectedSeats}
        setSelectedSeats={setSelectedSeats}
        show={showSeatsModal}
        onHide={() => setSeatsShowModal(false)}
      />
    </>
  );
};

export default StadiumSvgViewer;

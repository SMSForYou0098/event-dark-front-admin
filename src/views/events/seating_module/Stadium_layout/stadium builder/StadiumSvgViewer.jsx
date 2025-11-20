import React, { useState } from "react";
import SeatsGrid from "./SeatsGrid";
import TierViewer from "./TierViewer";
import SectionViewer from "./SectionViewer";
import { describeArc, polarToCartesian } from "./helperFuntion";
import StandsViewer from "./StandsViewer";
import { Badge, Button, Space, Typography } from "antd";
import SelectedSeatsModal from "./SelectedSeatsModal";
import {
  EyeOutlined,
  BankOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";

const { Title, Text } = Typography;

const StadiumSvgViewer = ({
  standsData,
  isUser = true,
  handleSubmit,
  enableDrilldown = false,
}) => {
  const { isMobile } = useMyContext();
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

  const canInteract = isUser || enableDrilldown;

  const renderModalContent = () => {
    switch (viewMode) {
      case "tiers":
        return (
          <div className="bg-dark border border-secondary rounded p-3 p-md-4 text-center">
            <Space direction="vertical" align="center" size="middle" className="w-100">
              <Title level={4} className="m-0 d-flex align-items-center justify-content-center">
                <BankOutlined className="mr-2 text-primary" />
                <span className="text-white">{selectedStand?.name}</span>
              </Title>
              <Text className="text-muted">Select a tier to view sections</Text>
              <TierViewer
                tiers={selectedStand?.tiers || []}
                onSelectTier={(tier) => {
                  setSelectedTier(tier);
                  setViewMode("sections");
                }}
                isUser={canInteract}
                className="mt-4"
              />
            </Space>
          </div>
        );

      case "sections":
        return (
          <div className="bg-dark border border-secondary rounded p-3 p-md-4 text-center">
            <Space direction="vertical" align="center" size="middle" className="w-100">
              <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} align-items-center justify-content-center`} style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <Space align="center">
                  <BankOutlined className="text-primary" style={{ fontSize: 20 }} />
                  <Text strong className="text-white" style={{ fontSize: 16 }}>{selectedStand?.name}</Text>
                </Space>
                <Space align="center">
                  <AppstoreOutlined className="text-info" style={{ fontSize: 20, color: '#17c0eb' }} />
                  <Text strong style={{ fontSize: 16, color: '#17c0eb' }}>{selectedTier?.name}</Text>
                </Space>
              </div>
              <Text className="text-muted">Select a section to view seats</Text>
              <SectionViewer
                sections={selectedTier?.sections || []}
                onSelectSection={(section) => {
                  setSelectedSection(section);
                  setViewMode("seats");
                }}
                isUser={canInteract}
                className="mt-4"
              />
            </Space>
          </div>
        );

      case "seats":
        return (
          <div className={`p-${isMobile ? 3 : 4}`}>
            <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} justify-content-between align-items-center mb-4`} style={{ gap: '0.75rem' }}>
              {/* Badges */}
              <div className="d-flex flex-wrap justify-content-center" style={{ gap: '0.5rem' }}>
                <Badge
                  count={
                    <Space size={4} className="px-3 py-1">
                      <BankOutlined />
                      <span>{selectedStand?.name}</span>
                    </Space>
                  }
                  style={{
                    backgroundColor: 'rgba(181, 21, 21, 0.1)',
                    color: 'var(--primary-color)',
                    border: '1px solid var(--primary-color)',
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 16,
                  }}
                />
                <Badge
                  count={
                    <Space size={4} className="px-3 py-1">
                      <AppstoreOutlined />
                      <span>{selectedTier?.name}</span>
                    </Space>
                  }
                  style={{
                    backgroundColor: 'rgba(4, 209, 130, 0.1)',
                    color: 'var(--success-color)',
                    border: '1px solid var(--success-color)',
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 16,
                  }}
                />
                <Badge
                  count={
                    <Space size={4} className="px-3 py-1">
                      <LayoutOutlined />
                      <span>{selectedSection?.name}</span>
                    </Space>
                  }
                  style={{
                    backgroundColor: 'rgba(255, 197, 66, 0.12)',
                    color: 'var(--warning-color)',
                    border: '1px solid var(--warning-color)',
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 16,
                  }}
                />
              </div>
              {/* View Button */}
              <Button
                type="default"
                size={isMobile ? "middle" : "large"}
                icon={<EyeOutlined />}
                onClick={() => setSeatsShowModal(!showSeatsModal)}
                className="font-weight-semibold"
                style={{
                  borderWidth: 2,
                  backgroundColor: 'rgba(181, 21, 21, 0.1)',
                  color: 'var(--primary-color)',
                  borderColor: 'var(--primary-color)',
                }}
              >
                View Selected
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
            className="bg-primary"
          >
            Stands
          </Button>
        );
      case "sections":
        return (
          <Button
            type="primary"
            size={buttonSize}
            icon={<ArrowLeftOutlined />}
            onClick={() => setViewMode("tiers")}
            className="bg-primary"
          >
            Tiers
          </Button>
        );
      case "seats":
        return (
          <>
            {isUser && selectedSeats?.length > 0 && (
              <div className="w-100 d-flex justify-content-center align-items-center">
                <Text className="text-white">
                  Selected <Text strong className="text-white">{selectedSeats?.length}</Text> seat(s), Total Price:{' '}
                  <Text strong className="text-success">
                    ₹
                    {selectedSeats
                      ?.reduce((sum, seat) => sum + parseFloat(seat.price || 0), 0)
                      .toFixed(2)}
                  </Text>
                </Text>
              </div>
            )}
            <div className="w-100 d-flex flex-row justify-content-between align-items-center" style={{ gap: '0.75rem' }}>
              <Button
                type="primary"
                size={buttonSize}
                icon={<ArrowLeftOutlined />}
                onClick={() => setViewMode("sections")}
                className="bg-primary"
              >
                Sections
              </Button>
              {isUser && (
                <Button
                  type="primary"
                  size={buttonSize}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    console.log("Booked Tickets", selectedSeats);
                    setShowModal(false);
                    setSelectedSeats([]);
                    handleSubmit?.(selectedSeats);
                  }}
                  className="bg-success"
                  style={{ backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                  disabled={!selectedSeats?.length}
                >
                  Confirm
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

  return (
    <>
      <div className="position-relative border border-secondary rounded overflow-hidden d-flex flex-column" 
           style={{ 
             height: "800px",
             background: "var(--component-bg)"
           }}>
        {/* View Mode Controls */}
        <div className="position-absolute d-flex shadow-sm rounded p-2"
             style={{
               top: 12,
               right: 12,
               zIndex: 20,
               gap: 10,
               backgroundColor: "rgba(252,252,252,0.03)",
               border: '1px solid var(--border-secondary)'
             }}>
          <Button
            type={detailView === "stands" ? "primary" : "info"}
            size="small"
            onClick={() => setDetailView("stands")}
            className={`font-weight-semibold`}
            style={{ minWidth: 90 }}
          >
            Stands Only
          </Button>
          <Button
            type={detailView === "tiers" ? "primary" : "info"}
            size="small"
            onClick={() => setDetailView("tiers")}
            className={`font-weight-semibold `}
            style={{ minWidth: 110 }}
          >
            Stands + Tiers
          </Button>
          <Button
            type={detailView === "sections" ? "primary" : "info"}
            size="small"
            onClick={() => setDetailView("sections")}
            className={`font-weight-semibold`}
            style={{ minWidth: 105 }}
          >
            Full Detail
          </Button>
        </div>

        {/* The main pan/zoom viewer fills remaining space */}
        <div className="flex-grow-1 position-relative" style={{ minHeight: 0 }}>
          <svg
            viewBox="0 0 500 500"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ backgroundColor: "#000" }}
          >
            <circle cx="250" cy="250" r="60" fill="var(--success-color)" stroke="#ddd" />
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
                setViewMode("sections");
                setShowModal(true);
                setSelectedStand(stand);
              }}
              onSelectTier={(tier, stand) => {
                setSelectedTier(tier);
                setViewMode("sections");
                setShowModal(true);
                setSelectedStand(stand);
              }}
              viewDetail={detailView}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          </svg>

          {/* Modal Content Overlay */}
          {showModal && (
            <div className="position-absolute bg-dark border border-3 border-dark d-flex flex-column rounded shadow-lg"
                 style={{
                   inset: 0,
                   zIndex: 1050,
                   backgroundColor: 'var(--body-bg)',
                   borderColor: 'var(--border-secondary) !important'
                 }}>
              {/* Sticky Header */}
              <div className={`d-flex justify-content-between align-items-center border-bottom position-sticky ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}
                   style={{
                     top: 0,
                     zIndex: 1,
                     backgroundColor: 'var(--component-bg)',
                     borderBottomLeftRadius: 0,
                     borderBottomRightRadius: 0,
                     borderColor: 'var(--border-secondary)'
                   }}>
                <Title level={5} className={`m-0 text-white ${isMobile ? 'font-size-base' : 'font-size-lg'}`}>
                  Book Tickets
                </Title>
                <Button
                  type="text"
                  icon={<CloseOutlined className="text-white" />}
                  onClick={() => setShowModal(false)}
                  className="ml-2"
                />
              </div>

              {/* Modal scrollable body */}
              <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
                {renderModalContent()}
              </div>

              {/* Sticky Footer */}
              <div className="border-top position-sticky d-flex flex-wrap justify-content-between align-items-center rounded-bottom p-3 shadow-sm"
                   style={{
                     bottom: 0,
                     gap: '1rem',
                     backgroundColor: 'var(--component-bg)',
                     borderTopColor: 'var(--border-secondary)'
                   }}>
                {renderFooterButtons()}
              </div>
            </div>
          )}

          {/* Tooltip (fixed, never overflows parent) */}
          {hoveredStand && (
            <div className="position-fixed border rounded shadow-sm font-weight-semibold"
                 style={{
                   left: `${tooltipPosition.x}px`,
                   top: `${tooltipPosition.y}px`,
                   backgroundColor: "var(--component-bg)",
                   color: "var(--text-white)",
                   borderColor: 'var(--border-secondary)',
                   padding: "6px 13px",
                   fontSize: 14,
                   pointerEvents: "none",
                   zIndex: 9999,
                   transform: "translate(10px, 10px)",
                 }}>
              {hoveredStand}
            </div>
          )}
        </div>
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

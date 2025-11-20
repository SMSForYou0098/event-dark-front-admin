import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Space, Typography, Card, Tag } from "antd";
import SelectedSeatsDrawer from "./SelectedSeatsModal";
import { getSeatIcon } from "./SeatIconOptions";
import styles from './Seats.module.css';

const { Title } = Typography;

const SeatsZoomGrid = ({
  selectedSection,
  selectedSeats,
  stand,
  tier,
  setSelectedSeats,
  isMobile,
}) => {
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [scrollCoords, setScrollCoords] = useState({ left: 0, top: 0 });
  const [showSeatsModal, setSeatsShowModal] = useState(false);

  const fallbackSeatPrice =
    selectedSection?.price ??
    tier?.price ??
    stand?.price ??
    (selectedSection?.rows?.[0]?.price || 0);

  const sectionRows = useMemo(() => {
    return (selectedSection?.rows || []).map((row, rowIndex) => {
      if (Array.isArray(row?.seatList) && row.seatList.length) {
        return row;
      }

      const seatsCount = Number(row?.seats) || 0;
      // Create truly unique seat IDs using stand, tier, section, and row info
      const uniquePrefix = `${stand?.id || stand?.name || 'stand'}-${tier?.id || tier?.name || 'tier'}-${selectedSection?.id || selectedSection?.name || 'section'}-${row?.id || row?.label || `row-${rowIndex}`}`;
      const seatList = Array.from({ length: seatsCount }, (_, idx) => ({
        id: `${uniquePrefix}-seat-${idx + 1}`,
        number: idx + 1,
        price: row?.price ?? fallbackSeatPrice,
        status: 'available',
        isBooked: false,
      }));

      return {
        ...row,
        seatList,
      };
    });
  }, [selectedSection, fallbackSeatPrice, stand, tier]);

  // Calculate seat statistics
  let availableSeats = 0;
  let bookedSeats = 0;
  const baseZoom = 1.1;
  const basePaddingRem = 3;
  const zoomFactor = zoomLevel / baseZoom;
  const dynamicPadding = `${basePaddingRem * zoomFactor}rem`;

  sectionRows.forEach((row) => {
    if (!row.isBlocked) {
      row.seatList.forEach((seat) => {
        if (seat.isBooked) bookedSeats++;
        else availableSeats++;
      });
    }
  });

  const totalSeats = sectionRows.reduce(
    (total, row) => total + row.seatList.length,
    0
  );

  // Dragging handlers
  const handleDragStart = useCallback((e) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    setStartCoords({ x: clientX, y: clientY });
    setScrollCoords({
      left: scrollContainerRef.current.scrollLeft,
      top: scrollContainerRef.current.scrollTop,
    });
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const dx = (clientX - startCoords.x) * 1.5;
    const dy = (clientY - startCoords.y) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollCoords.left - dx;
    scrollContainerRef.current.scrollTop = scrollCoords.top - dy;
  }, [isDragging, scrollCoords, startCoords]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  // Event listeners
  useEffect(() => {
    if (isMobile) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("mousedown", handleDragStart);
    container.addEventListener("mousemove", handleDragMove);
    container.addEventListener("mouseup", handleDragEnd);
    container.addEventListener("mouseleave", handleDragEnd);
    container.addEventListener("touchstart", handleDragStart, { passive: false });
    container.addEventListener("touchmove", handleDragMove, { passive: false });
    container.addEventListener("touchend", handleDragEnd);

    return () => {
      container.removeEventListener("mousedown", handleDragStart);
      container.removeEventListener("mousemove", handleDragMove);
      container.removeEventListener("mouseup", handleDragEnd);
      container.removeEventListener("mouseleave", handleDragEnd);
      container.removeEventListener("touchstart", handleDragStart);
      container.removeEventListener("touchmove", handleDragMove);
      container.removeEventListener("touchend", handleDragEnd);
    };
  }, [isMobile, handleDragStart, handleDragMove, handleDragEnd]);

  // Zoom and seat selection functions
  const zoomToSeat = (rowIndex, seatIndex) => {
    if (!containerRef.current || !selectedSection?.rows?.[rowIndex]) return;
    const targetZoom = 1;
    setZoomLevel(targetZoom);

    setTimeout(() => {
      const container = containerRef.current;
      const scrollContainer = container.parentElement?.parentElement;
      if (!scrollContainer) return;

      const maxSeats = Math.max(
        ...sectionRows.map((row) => row.seatList?.length || 0),
        0
      );
      const seatsInRow = sectionRows[rowIndex].seatList?.length || 0;
      const rowGap = Math.floor((maxSeats - seatsInRow) / 2);

      const seatSize = 30;
      const gapSize = 5;
      const seatX = (rowGap + seatIndex) * (seatSize + gapSize);
      const seatY = rowIndex * (seatSize + gapSize);

      const containerWidth = scrollContainer.clientWidth;
      const containerHeight = scrollContainer.clientHeight;

      const scrollLeft =
        seatX * targetZoom - containerWidth / 2 + (seatSize * targetZoom) / 2;
      const scrollTop =
        seatY * targetZoom - containerHeight / 2 + (seatSize * targetZoom) / 2;

      const maxScrollLeft = container.scrollWidth * targetZoom - containerWidth;
      const maxScrollTop = container.scrollHeight * targetZoom - containerHeight;

      scrollContainer.scrollTo({
        left: Math.max(0, Math.min(scrollLeft, maxScrollLeft)),
        top: Math.max(0, Math.min(scrollTop, maxScrollTop)),
        behavior: "smooth",
      });
    }, 50);
  };

  const handleSeatClick = (seat, status, rowIndex, seatIndex, rowLabel) => {
    if (status === "booked") return;
    const seatWithLabel = {
      ...seat,
      rowLabel,
      section: {name:selectedSection.name, id:selectedSection.id},
      stand:{name:stand?.name, id:stand?.id},
      tier:{name:tier?.name,id:tier?.id},
    };

    setSelectedSeats((prevSelected) => {
      const isAlreadySelected = prevSelected.some((s) => s.id === seatWithLabel.id);
      return isAlreadySelected
        ? prevSelected.filter((s) => s.id !== seatWithLabel.id)
        : [...prevSelected, seatWithLabel];
    });

    if (!isMobile) zoomToSeat(rowIndex, seatIndex);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  const handleWheelZoom = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(0.25, Math.min(prev + delta, 4)));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (isMobile) setZoomLevel(1);
    if (container) {
      container.addEventListener("wheel", handleWheelZoom, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheelZoom);
      }
    };
  }, [isMobile]);

  if (!selectedSection?.rows?.length) return null;

  const gapSize = `clamp(4px, 1vw, 6px)`;
  const maxSeats = Math.max(
    ...sectionRows.map((row) => row.seats || row.seatList.length)
  );

  return (
    <div className={styles.seatsGridContainer}>
      {/* Header Section */}
      <Card 
        style={{ 
          marginBottom: 16,
          padding: isMobile ? 8 : 16,
          borderRadius: 8
        }}
      >
        <Title 
          level={5} 
          style={{ 
            textAlign: 'center', 
            marginBottom: 16,
            color: '#faad14'
          }}
        >
          {selectedSection.name}
        </Title>

        {/* Stats + Zoom Controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Seat Stats - Enhanced with Tag */}
          <Space size={8} wrap>
            <Tag 
              icon={<CheckCircleOutlined />} 
              color="success" 
              style={{ 
                padding: isMobile ? '4px 12px' : '6px 16px',
                fontSize: isMobile ? 12 : 14,
                fontWeight: 500,
                borderRadius: 6,
              }}
            >
              Available: {availableSeats}
            </Tag>

            <Tag 
              icon={<CloseCircleOutlined />} 
              color="error" 
              style={{ 
                padding: isMobile ? '4px 12px' : '6px 16px',
                fontSize: isMobile ? 12 : 14,
                fontWeight: 500,
                borderRadius: 6,
              }}
            >
              Booked: {bookedSeats}
            </Tag>

            <Tag 
              icon={<TeamOutlined />} 
              color="default" 
              style={{ 
                padding: isMobile ? '4px 12px' : '6px 16px',
                fontSize: isMobile ? 12 : 14,
                fontWeight: 500,
                borderRadius: 6,
                backgroundColor: '#595959',
                color: '#fff',
                borderColor: '#595959',
              }}
            >
              Total: {totalSeats}
            </Tag>
          </Space>

          {/* Zoom Controls */}
          <Space size={isMobile ? 4 : 8}>
            <Button
              type="primary"
              shape="circle"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              size={isMobile ? "small" : "middle"}
              title="Zoom In"
            />
            <Button
              type="primary"
              shape="circle"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              size={isMobile ? "small" : "middle"}
              title="Zoom Out"
            />
            <Button
              type="default"
              shape="circle"
              icon={<ReloadOutlined />}
              onClick={handleResetZoom}
              size={isMobile ? "small" : "middle"}
              title="Reset Zoom"
            />
            <div style={{
              color: '#1890ff',
              fontWeight: 600,
              textAlign: 'center',
              minWidth: isMobile ? 32 : 40,
              fontSize: isMobile ? 12 : 14
            }}>
              {Math.round(zoomLevel * 100)}%
            </div>
          </Space>
        </div>
      </Card>

      {/* Seats Grid */}
      <div
        ref={scrollContainerRef}
        className={`${styles.seatsScrollContainer} ${isDragging ? styles.seatsScrollContainerDragging : ""}`}
      >
        <div className={styles.seatsTransformWrapper}>
          <div
            ref={containerRef}
            className={styles.seatsGrid}
            style={{
              gap: gapSize,
              transform: `scale(${zoomLevel})`,
              padding: `${dynamicPadding} 0 0 0` 
            }}
          >
            {sectionRows.map((row, rowIndex) => {
              const seatsInRow = row.seats || row.seatList.length;
              const rowGap = Math.floor((maxSeats - seatsInRow) / 2);
              
              return (
                <div key={`row-${row.id}`} className={styles.seatRow}>
                  {/* Left Padding */}
                  {Array.from({ length: rowGap }).map((_, i) => (
                    <div key={`gap-start-${i}`} className={styles.seatGap}/>
                  ))}

                  {/* Actual Seats */}
                  {row.seatList.map((seat) => {
                    const seatId = seat.id;
                    const isSelected = selectedSeats.some((s) => s.id === seat.id);
                    const isBooked = seat.isBooked;
                    const isHovered = hoveredSeatId === seatId;
                    const isDisabled = isBooked || row.isBlocked;

                    return (
                      <div
                        key={seatId}
                        className={`${styles.seat} ${isBooked ? styles.seatBooked : ""} ${isSelected ? styles.seatSelected : ""} ${isDisabled ? styles.seatDisabled : ""}`}
                        title={`${row.label}, Seat ${seat.number}`}
                        onClick={() =>
                          !isDisabled &&
                          handleSeatClick(
                            seat,
                            isBooked ? "booked" : seat.status,
                            rowIndex,
                            row.seatList.findIndex((s) => s.id === seat.id),
                            row.label
                          )
                        }
                        onMouseEnter={() => !isDisabled && setHoveredSeatId(seatId)}
                        onMouseLeave={() => !isDisabled && setHoveredSeatId(null)}
                      >
                        {(() => {
                          if (isBooked) {
                            return <CloseCircleOutlined className={styles.seatIcon} style={{ fontSize: 20 }} />;
                          }
                          if (isSelected) {
                            return <CheckCircleOutlined className={styles.seatIcon} style={{ fontSize: 20 }} />;
                          }
                          // Use custom icon from seat, row, or default to Circle
                          const iconType = seat.seatIcon || row.seatIcon || 'circle';
                          const SeatIconComponent = getSeatIcon(iconType);
                          return <SeatIconComponent className={styles.seatIcon} style={{ fontSize: 20 }} />;
                        })()}

                        {isHovered && (
                          <div className={styles.seatTooltip}>
                            {row.label}, Seat {seat.number}
                            <br />
                            {seat?.status} - ₹{seat?.price}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Right Padding */}
                  {Array.from({ length: rowGap }).map((_, i) => (
                    <div key={`gap-end-${i}`} className={styles.seatGap}/>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Seats Drawer */}
      <SelectedSeatsDrawer
        show={showSeatsModal}
        onHide={() => setSeatsShowModal(false)}
        selectedSeats={selectedSeats}
        setSelectedSeats={setSelectedSeats}
        isMobile={isMobile}
      />
    </div>
  );
};

export default SeatsZoomGrid;
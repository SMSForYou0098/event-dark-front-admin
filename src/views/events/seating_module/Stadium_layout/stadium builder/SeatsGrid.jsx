import React, { useState, useRef, useEffect } from "react";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Badge, Button, Space, Typography, Card } from "antd";
import { Circle } from "lucide-react";
import SelectedSeatsDrawer from "./SelectedSeatsModal";
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
  const zoomControlsRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [scrollCoords, setScrollCoords] = useState({ left: 0, top: 0 });
  const [showSeatsModal, setSeatsShowModal] = useState(false);

  // Calculate seat statistics
  let availableSeats = 0;
  let bookedSeats = 0;
  let blockedRowSeats = 0;
  const baseZoom = 1.1;
  const basePaddingRem = 3;
  const zoomFactor = zoomLevel / baseZoom;
  const dynamicPadding = `${basePaddingRem * zoomFactor}rem`;

  selectedSection.rows.forEach((row) => {
    const seatsInRow = row.seatList.length;
    if (row.isBlocked) {
      blockedRowSeats += seatsInRow;
    } else {
      row.seatList.forEach((seat) => {
        if (seat.isBooked) bookedSeats++;
        else availableSeats++;
      });
    }
  });

  const totalSeats = selectedSection.rows.reduce(
    (total, row) => total + row.seatList.length,
    0
  );

  // Dragging handlers
  const handleDragStart = (e) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    setStartCoords({ x: clientX, y: clientY });
    setScrollCoords({
      left: scrollContainerRef.current.scrollLeft,
      top: scrollContainerRef.current.scrollTop,
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const dx = (clientX - startCoords.x) * 1.5;
    const dy = (clientY - startCoords.y) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollCoords.left - dx;
    scrollContainerRef.current.scrollTop = scrollCoords.top - dy;
  };

  const handleDragEnd = () => setIsDragging(false);

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
  }, [isDragging, startCoords, scrollCoords]);

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
        ...selectedSection.rows.map((row) => row.seatList?.length || 0)
      );
      const seatsInRow = selectedSection.rows[rowIndex].seatList?.length || 0;
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

  const seatSize = `clamp(24px, 4vw, 32px)`;
  const gapSize = `clamp(4px, 1vw, 6px)`;
  const maxSeats = Math.max(
    ...selectedSection.rows.map((row) => row.seats || row.seatList.length)
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
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 8 : 16,
          overflowX: 'auto',
          paddingBottom: 8
        }}>
          {/* Seat Stats */}
          <Space size={isMobile ? 4 : 8} wrap={false}>
            <Badge 
              count={
                <Space size={4} style={{ padding: isMobile ? '2px 8px' : '4px 12px' }}>
                  <CheckCircleOutlined style={{ fontSize: isMobile ? 12 : 16 }} />
                  <span style={{ fontSize: isMobile ? 11 : 14 }}>Available: {availableSeats}</span>
                </Space>
              }
              style={{ 
                backgroundColor: '#52c41a',
                fontSize: isMobile ? 11 : 14
              }}
            />

            <Badge 
              count={
                <Space size={4} style={{ padding: isMobile ? '2px 8px' : '4px 12px' }}>
                  <CloseCircleOutlined style={{ fontSize: isMobile ? 12 : 16 }} />
                  <span style={{ fontSize: isMobile ? 11 : 14 }}>Booked: {bookedSeats}</span>
                </Space>
              }
              style={{ 
                backgroundColor: '#ff4d4f',
                fontSize: isMobile ? 11 : 14
              }}
            />

            <Badge 
              count={
                <span style={{ 
                  padding: isMobile ? '2px 8px' : '4px 12px',
                  fontSize: isMobile ? 11 : 14
                }}>
                  Total: {totalSeats}
                </span>
              }
              style={{ 
                backgroundColor: '#8c8c8c',
                fontSize: isMobile ? 11 : 14
              }}
            />
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
            {selectedSection.rows.map((row, rowIndex) => {
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
                        {isBooked ? (
                          <CloseCircleOutlined className={styles.seatIcon} style={{ fontSize: 20 }} />
                        ) : isSelected ? (
                          <CheckCircleOutlined className={styles.seatIcon} style={{ fontSize: 20 }} />
                        ) : (
                          <Circle size="20" className={styles.seatIcon} />
                        )}

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
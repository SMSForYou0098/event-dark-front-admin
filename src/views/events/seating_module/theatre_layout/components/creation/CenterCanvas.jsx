import React, { useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server';
import { Stage, Layer, Rect, Text, Group, Line, Transformer, Image as KonvaImage, Path } from 'react-konva';
import { PRIMARY } from 'utils/consts';
import { MdOutlineChair, MdOutlineTableBar } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { FaChair } from 'react-icons/fa';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil';

const SEAT_STATUS_STYLES = {
  reserved: {
    background: 'rgb(152, 124, 39)',
    border: '2px solid rgb(152, 124, 39)',
    color: '#FFFFFF',
    cursor: 'not-allowed',
  },
  disabled: {
    background: '#1f2937',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    cursor: 'not-allowed',
  },
};

const parseBorderStyle = (border) => {
  const match = border?.match?.(/(\d+(?:\.\d+)?)px\s+solid\s+(.+)/i);
  if (!match) return { width: 1, color: '#FFFFFF' };
  return {
    width: parseFloat(match[1]) || 1,
    color: match[2] || '#FFFFFF',
  };
};


// Draggable Stage Component
const DraggableStage = ({ stage, isSelected, onSelect, onDragEnd, onTransformEnd, setIsDraggingElement, isInteractive = true }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected]);

  return (
    <>
      <Group
        ref={shapeRef}
        draggable={isInteractive}
        x={stage.x}
        y={stage.y}
        listening={isInteractive}
        onClick={isInteractive ? onSelect : undefined}
        onTap={isInteractive ? onSelect : undefined}
        onDragStart={(e) => {
          e.cancelBubble = true;
          setIsDraggingElement(true);
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          setIsDraggingElement(false);
          onDragEnd({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          onTransformEnd({
            x: node.x(),
            y: node.y(),
            width: Math.max(200, stage.width * scaleX),
            height: Math.max(5, stage.height * scaleY)
          });

          // Reset scale after transform
          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        {stage.shape === 'curved' ? (
          // Curved stage using Path (like a curved cinema screen)
          <Path
            data={`
              M 0 0
              Q ${stage.width / 2} ${stage.height * (stage.curve || 0.15)} ${stage.width} 0
              L ${stage.width} ${stage.height}
              Q ${stage.width / 2} ${stage.height * (1 - (stage.curve || 0.15))} 0 ${stage.height}
              Z
            `}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: stage.height }}
            fillLinearGradientColorStops={[1, "#b51515", 0, "#0d0d0d"]}
            strokeWidth={isSelected ? 2 : 1}
          />
        ) : (
          // Straight stage
          <Rect
            width={stage.width}
            height={stage.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: stage.height }}
            fillLinearGradientColorStops={[1, "#b51515", 0, "#0d0d0d"]}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={5}
          />
        )}
        <Text
          width={stage.width}
          y={stage.height + 5}
          text={stage.name || 'SCREEN'}
          fontSize={18}
          fill="#FFF"
          align="center"
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          borderStroke={PRIMARY}
          anchorStroke={PRIMARY}
          anchorFill={PRIMARY}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 200 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['middle-left', 'middle-right', 'top-center', 'bottom-center']}
          rotateEnabled={false}
        />
      )}
    </>
  );
};

// Helper function to calculate minimum section size based on content
const calculateMinSectionSize = (section) => {
  if (!section.rows || section.rows.length === 0) {
    return { minWidth: 200, minHeight: 150 };
  }

  // Calculate minimum width based on maximum seats in any row
  const maxSeatsInRow = Math.max(...section.rows.map(row => row.seats?.length || 0));
  const leftPadding = 50;
  const rightPadding = 20;
  const minSeatSize = 8; // Minimum size per seat (including spacing)
  const minWidth = Math.max(200, leftPadding + rightPadding + (maxSeatsInRow * minSeatSize));

  // Calculate minimum height based on number of rows and spacing
  const topPadding = 50;
  const bottomPadding = 30;
  const maxSpacing = Math.max(...section.rows.map(row => row.spacing || 40));
  const numRows = section.rows.length;
  const minHeight = Math.max(150, topPadding + bottomPadding + ((numRows - 1) * Math.min(maxSpacing, 35)) + 30);

  return { minWidth, minHeight };
};

// Draggable Section Component
const DraggableSection = ({ section, isSelected, isMultiSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd, children, setIsDraggingElement, isInteractive = true }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && !isMultiSelected) {
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, isMultiSelected]);

  const highlighted = isSelected || isMultiSelected;

  return (
    <>
      <Group
        id={`section-${section.id}`}
        ref={shapeRef}
        draggable={isInteractive}
        x={section.x}
        y={section.y}
        onClick={isInteractive ? onSelect : undefined}
        onTap={isInteractive ? onSelect : undefined}
        onDragStart={(e) => {
          e.cancelBubble = true;
          setIsDraggingElement(true);
          const node = shapeRef.current ?? e.target;
          onDragStart?.(e, node);
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
          const node = shapeRef.current ?? e.target;
          onDragMove?.(e, node);
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          setIsDraggingElement(false);
          const node = shapeRef.current ?? e.target;
          onDragEnd({
            x: node.x(),
            y: node.y()
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          onTransformEnd({
            x: node.x(),
            y: node.y(),
            width: Math.max(200, section.width * scaleX),
            height: Math.max(150, section.height * scaleY)
          });

          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        <Rect
          width={section.width}
          height={section.height}
          fill="transparent"
          stroke={highlighted ? PRIMARY : '#999'}
          strokeWidth={isMultiSelected ? 1.5 : 0.5}
          dash={isMultiSelected ? [8, 4] : [5, 5]}
          cornerRadius={5}
        />
        <Text
          x={0}
          y={10}
          width={section.width}
          text={section.name}
          fontSize={16}
          fill="#FFFFFF"
          fontStyle="bold"
          align="center"
        />
        {children}
      </Group>
      {isSelected && !isMultiSelected && (
        <Transformer
          ref={trRef}
          borderStroke={PRIMARY}
          anchorStroke={PRIMARY}
          anchorFill={PRIMARY}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            const { minWidth, minHeight } = calculateMinSectionSize(section);
            if (Math.abs(newBox.width) < minWidth || Math.abs(newBox.height) < minHeight) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
        />
      )}
    </>
  );
};

// Icon Image Component - Converts React Icon to Konva Image
const IconImage = ({ iconName, x, y, size = 20, opacity = 1 }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!iconName) return;

    const iconMap = {
      'FaChair': FaChair,
      'MdOutlineChair': MdOutlineChair,
      'PiArmchairLight': PiArmchairLight,
      'PiChair': PiChair,
      'PiOfficeChair': PiOfficeChair,
      'LuSofa': LuSofa,
      'TbSofa': TbSofa,
      'GiRoundTable': GiRoundTable,
      'SiTablecheck': SiTablecheck,
      'MdOutlineTableBar': MdOutlineTableBar
    };

    const IconComponent = iconMap[iconName];
    if (!IconComponent) return;

    // Render icon to SVG string
    const svgString = renderToStaticMarkup(
      <IconComponent size={size} color="#FFFFFF" />
    );

    // Create blob and load as image
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [iconName, size]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      opacity={opacity}
      listening={false}
    />
  );
};

const CenterCanvas = (props) => {
  const { stageRef, canvasScale, showGrid, stage, setStage, sections, setSections, updateSection, selectedType, selectedElement, setSelectedElement, setSelectedType, handleCanvasClick, handleWheel, setStagePosition, isAssignMode, selectedSectionIds, setSelectedSectionIds, selectedSeatIds = [], setSelectedSeatIds, isReportMode = false, canEdit = true } = props;

  const layerRef = useRef();
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const dragStartPositions = useRef({});
  const multiDragRaf = useRef(null);
  const pendingMultiDrag = useRef(null);

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={window.innerWidth - 700}
        height={window.innerHeight - 100}
        draggable={!isDraggingElement}
        scaleX={canvasScale}
        scaleY={canvasScale}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          const pos = e.target.position();
          setStagePosition(pos);
        }}
      >
        <Layer ref={layerRef}>
          {/* Grid */}
          {showGrid && (
            <>
              {Array.from({ length: 50 }).map((_, i) => (
                <React.Fragment key={`grid-${i}`}>
                  <Line
                    points={[i * 50, 0, i * 50, 3000]}
                    stroke="#E0E0E0"
                    strokeWidth={1}
                    listening={false}
                  />
                  <Line
                    points={[0, i * 50, 3000, i * 50]}
                    stroke="#E0E0E0"
                    strokeWidth={1}
                    listening={false}
                  />
                </React.Fragment>
              ))}
            </>
          )}

          {/* Stage/Screen */}
          <DraggableStage
            stage={stage}
            isSelected={selectedType === 'stage' && selectedElement?.position === stage.position}
            setIsDraggingElement={setIsDraggingElement}
            isInteractive={!isReportMode && canEdit}
            onSelect={() => {
              setSelectedElement(stage);
              setSelectedType('stage');
              setSelectedSectionIds([]);
              setSelectedSeatIds([]);
            }}
            onDragEnd={(pos) => {
              const updatedStage = {
                ...stage,
                x: parseFloat(pos.x) || 0,
                y: parseFloat(pos.y) || 0
              };
              console.log(updatedStage)
              setStage(updatedStage);
              if (selectedType === 'stage') setSelectedElement(updatedStage);
            }}
            onTransformEnd={(transform) => {
              const updatedStage = {
                ...stage,
                x: parseFloat(transform.x) || 0,
                y: parseFloat(transform.y) || 0,
                width: parseFloat(transform.width) || 200,
                height: parseFloat(transform.height) || 50
              };
              setStage(updatedStage);
              if (selectedType === 'stage') setSelectedElement(updatedStage);
            }}
          />

          {/* Sections */}
          {sections.map(section => {
            const isSingleSelected = selectedElement?.id === section.id && selectedType === 'section';
            const isMultiSelected = selectedSectionIds.includes(section.id);
            return (
              <DraggableSection
                key={section.id}
                section={section}
                isSelected={isSingleSelected}
                isMultiSelected={isMultiSelected}
                isInteractive={!isReportMode && canEdit}
                setIsDraggingElement={setIsDraggingElement}
                onSelect={(e) => {
                  if (isReportMode) return;
                  // Without canEdit, section selection is blocked — user must click individual seats
                  if (!canEdit) return;
                  const evt = e?.evt || e;
                  if (evt?.shiftKey) {
                    setSelectedSeatIds([]);
                    setSelectedSectionIds(prev =>
                      prev.includes(section.id)
                        ? prev.filter(id => id !== section.id)
                        : [...prev, section.id]
                    );
                    return;
                  }
                  setSelectedSeatIds([]);
                  setSelectedSectionIds([]);
                  setSelectedElement(section);
                  setSelectedType('section');
                }}
                onDragStart={(e, dragNode) => {
                  if (isReportMode) return;
                  if (isMultiSelected && selectedSectionIds.length > 1) {
                    const node = dragNode ?? e.target;
                    const startX = node.x();
                    const startY = node.y();
                    const positions = {};
                    selectedSectionIds.forEach(id => {
                      const s = sections.find(sec => sec.id === id);
                      if (s) positions[id] = { x: s.x, y: s.y };
                    });
                    positions.__origin = { x: startX, y: startY };
                    dragStartPositions.current = positions;
                  }
                }}
                onDragMove={(e, dragNode) => {
                  if (isReportMode) return;
                  if (!(isMultiSelected && selectedSectionIds.length > 1)) return;
                  const origin = dragStartPositions.current.__origin;
                  if (!origin) return;
                  const node = dragNode ?? e.target;
                  pendingMultiDrag.current = { draggedId: section.id, x: node.x(), y: node.y() };
                  if (multiDragRaf.current != null) return;
                  multiDragRaf.current = requestAnimationFrame(() => {
                    multiDragRaf.current = null;
                    const p = pendingMultiDrag.current;
                    const o = dragStartPositions.current.__origin;
                    if (!p || !o) return;
                    const dx = p.x - o.x;
                    const dy = p.y - o.y;
                    setSections(prev => prev.map(s => {
                      if (!selectedSectionIds.includes(s.id)) return s;
                      if (s.id === p.draggedId) return { ...s, x: p.x, y: p.y };
                      const startPos = dragStartPositions.current[s.id];
                      if (!startPos) return s;
                      return { ...s, x: startPos.x + dx, y: startPos.y + dy };
                    }));
                  });
                }}
                onDragEnd={(pos) => {
                  if (isReportMode) return;
                  if (multiDragRaf.current != null) {
                    cancelAnimationFrame(multiDragRaf.current);
                    multiDragRaf.current = null;
                  }
                  pendingMultiDrag.current = null;
                  if (isMultiSelected && selectedSectionIds.length > 1) {
                    const origin = dragStartPositions.current.__origin;
                    if (origin) {
                      const dx = pos.x - origin.x;
                      const dy = pos.y - origin.y;
                      const startById = { ...dragStartPositions.current };
                      delete startById.__origin;
                      setSections(prev => prev.map(s => {
                        if (!selectedSectionIds.includes(s.id)) return s;
                        if (s.id === section.id) return { ...s, x: pos.x, y: pos.y };
                        const startPos = startById[s.id];
                        if (!startPos) return s;
                        return { ...s, x: startPos.x + dx, y: startPos.y + dy };
                      }));
                      if (selectedType === 'section' && selectedElement?.id && selectedSectionIds.includes(selectedElement.id)) {
                        const sid = selectedElement.id;
                        if (sid === section.id) {
                          setSelectedElement(prev => (prev ? { ...prev, x: pos.x, y: pos.y } : prev));
                        } else {
                          const sp = startById[sid];
                          if (sp) {
                            setSelectedElement(prev => (prev ? { ...prev, x: sp.x + dx, y: sp.y + dy } : prev));
                          }
                        }
                      }
                    }
                    dragStartPositions.current = {};
                    return;
                  }
                  updateSection(section.id, pos);
                  if (selectedElement?.id === section.id && selectedType === 'section') {
                    setSelectedElement({ ...section, ...pos });
                  }
                }}
                onTransformEnd={(transform) => {
                  if (isReportMode) return;
                  updateSection(section.id, transform);
                  if (selectedElement?.id === section.id && selectedType === 'section') {
                    setSelectedElement({ ...section, ...transform });
                  }
                }}
              >

                {/* Standing Section - No rows/seats, just ticket info */}
                {section.type === 'Standing' && (
                  <Group>
                    <Rect
                      x={4}
                      y={34}
                      width={Math.max(section.width - 8, 0)}
                      height={Math.max(section.height - 38, 0)}
                      fill="rgba(181, 21, 21, 0.15)"
                      cornerRadius={8}
                    />
                    <Text
                      x={4}
                      y={section.height / 2 - 20}
                      width={Math.max(section.width - 8, 0)}
                      text={`🎫 STANDING AREA`}
                      fontSize={16}
                      fill="#FFFFFF"
                      fontStyle="bold"
                      align="center"
                    />

                  </Group>
                )}

                {/* Rows and Seats (non-standing sections) */}
                {section.type !== 'Standing' && section.rows.map(row => {
                  // Safety check for row seats
                  if (!row.seats || row.seats.length === 0) return null;

                  const firstSeatY = row.seats[0]?.y ?? 50;
                  const isRowSelected = selectedType === 'row' && selectedElement?.id === row.id;
                  // Right title: start 10px after last seat's right edge (mirrors left title's 10px gap)
                  const lastSeat = row.seats[row.seats.length - 1];
                  const lastSeatRightEdge = lastSeat ? (lastSeat.x || 0) + (lastSeat.radius || 12) : 0;
                  const rightTitleX = lastSeatRightEdge + 10;
                  const rightTitleWidth = Math.max(20, section.width - 5 - rightTitleX);

                  let minX = 0, minY = 0, maxX = 0, maxY = 0;
                  if (isRowSelected) {
                    minX = Math.min(0, ...row.seats.map(s => (s.x || 0) - (s.radius || 12)));
                    minY = Math.min((firstSeatY), ...row.seats.map(s => (s.y || 0) - (s.radius || 12)));
                    maxX = Math.max(30, ...row.seats.map(s => (s.x || 0) + (s.radius || 12)));
                    maxY = Math.max((firstSeatY + 15), ...row.seats.map(s => (s.y || 0) + (s.radius || 12)));
                  }

                  return (
                    <Group key={row.id}>
                      {isRowSelected && (
                        <Rect
                          x={minX}
                          y={minY}
                          width={(maxX - minX)}
                          height={(maxY - minY)}
                          fill={PRIMARY}
                          stroke={PRIMARY}
                          strokeWidth={1}
                          opacity={0.2}
                          cornerRadius={8}
                          listening={false}
                        />
                      )}
                      <Text
                        x={10}
                        y={firstSeatY - 5}
                        text={row.title}
                        fontSize={14}
                        fill="#FFFFFF"
                        fontStyle="bold"
                        listening={false}
                      />
                      <Text
                        x={rightTitleX}
                        y={firstSeatY - 5}
                        width={rightTitleWidth}
                        text={row.title}
                        fontSize={14}
                        fill="#FFFFFF"
                        fontStyle="bold"
                        align="left"
                        listening={false}
                      />

                      {row.seats.map(seat => {
                        // Safety checks for seat properties
                        if (!seat || typeof seat.x !== 'number' || typeof seat.y !== 'number' || typeof seat.radius !== 'number') {
                          console.warn('Invalid seat data:', seat);
                          return null;
                        }

                        // Handle blank seats (gaps) differently
                        if (seat.type === 'blank') {
                          return (
                            <Group key={seat.id}>
                              <Rect
                                x={seat.x - seat.radius}
                                y={seat.y - seat.radius}
                                width={seat.radius * 2}
                                height={seat.radius * 2}
                                fill="transparent"
                                stroke="#666"
                                strokeWidth={1}
                                dash={[3, 3]}
                                cornerRadius={4}
                                onMouseEnter={(e) => {
                                  const container = e.target.getStage().container();
                                  container.style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                  const container = e.target.getStage().container();
                                  container.style.cursor = 'default';
                                }}
                                onClick={(e) => {
                                  if (isReportMode) return;
                                  e.cancelBubble = true;
                                  setSelectedSectionIds([]);
                                  setSelectedSeatIds([seat.id]);
                                  setSelectedElement({ ...seat, sectionId: section.id, rowId: row.id });
                                  setSelectedType('seat');
                                }}
                                opacity={0.3}
                              />
                            </Group>
                          );
                        }

                        // In assign mode, seats are selectable for status corrections.
                        const isUnavailable = isAssignMode && seat.status !== 'available';
                        const isDisabled = seat.status === 'disabled';
                        const canSelectSeat = true;
                        const seatOpacity = isUnavailable ? 0.3 : 1;
                        const resolvedSeatColor = seat.seatColor || row.seatColor || section.seatColor || PRIMARY;
                        const statusStyle = SEAT_STATUS_STYLES[seat.status];
                        const parsedStatusBorder = statusStyle ? parseBorderStyle(statusStyle.border) : null;
                        const seatFillColor = statusStyle
                          ? statusStyle.background
                          : getBackgroundWithOpacity(resolvedSeatColor, 0.2);
                        const isSeatSelected = selectedType === 'seat' && selectedSeatIds.includes(seat.id);
                        const selectedSeatFillColor = statusStyle
                          ? statusStyle.background
                          : getBackgroundWithOpacity(resolvedSeatColor, 0.45);
                        const seatStrokeColor = statusStyle ? parsedStatusBorder.color : resolvedSeatColor;
                        const seatStrokeWidth = statusStyle ? parsedStatusBorder.width : (isSeatSelected ? 2 : 1);
                        const seatLabelColor = statusStyle?.color || '#FFFFFF';

                        return (
                          <Group key={seat.id} opacity={seatOpacity}>
                            <Rect
                              x={seat.x - seat.radius}
                              y={seat.y - seat.radius}
                              width={seat.radius * 2}
                              height={seat.radius * 2}
                              fill={isSeatSelected ? selectedSeatFillColor : seatFillColor}
                              stroke={seatStrokeColor}
                              strokeWidth={seatStrokeWidth}
                              cornerRadius={4}
                              onMouseEnter={(e) => {
                                const container = e.target.getStage().container();
                                container.style.cursor = statusStyle?.cursor || 'pointer';
                              }}
                              onMouseLeave={(e) => {
                                const container = e.target.getStage().container();
                                container.style.cursor = 'default';
                              }}
                              onClick={(e) => {
                                if (isReportMode) return;
                                e.cancelBubble = true;
                                if (!canSelectSeat) return;
                                setSelectedSectionIds([]);
                                const isMultiSelectGesture = e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey;
                                if (isMultiSelectGesture) {
                                  const currentlySelected = selectedSeatIds.includes(seat.id);
                                  const nextSeatIds = currentlySelected
                                    ? selectedSeatIds.filter((id) => id !== seat.id)
                                    : [...selectedSeatIds, seat.id];

                                  if (nextSeatIds.length === 0) {
                                    setSelectedSeatIds([]);
                                    setSelectedElement(null);
                                    setSelectedType(null);
                                    return;
                                  }

                                  setSelectedSeatIds(nextSeatIds);
                                  setSelectedElement({ ...seat, sectionId: section.id, rowId: row.id });
                                  setSelectedType('seat');
                                  return;
                                }
                                setSelectedSeatIds([seat.id]);
                                setSelectedElement({ ...seat, sectionId: section.id, rowId: row.id });
                                setSelectedType('seat');
                              }}
                            />
                            {seat.icon ? (
                              <IconImage
                                iconName={seat.icon}
                                x={seat.x}
                                y={seat.y}
                                size={seat.radius * 1.2}
                                opacity={1} // Icon inherits group opacity
                              />
                            ) : (
                              <Text
                                x={seat.x - seat.radius}
                                y={seat.y - 4}
                                width={seat.radius * 2}
                                text={seat.number.toString()}
                                fontSize={10}
                                fill={seatLabelColor}
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                              />
                            )}
                            {isDisabled && (
                              <Line
                                points={[
                                  seat.x - seat.radius * 0.7,
                                  seat.y - seat.radius * 0.7,
                                  seat.x + seat.radius * 0.7,
                                  seat.y + seat.radius * 0.7
                                ]}
                                stroke="#F44336"
                                strokeWidth={2}
                                listening={false}
                              />
                            )}
                          </Group>
                        );
                      })}
                    </Group>
                  );
                })}
              </DraggableSection>
            );
          })}
        </Layer>
      </Stage>
    </div>
  )
}

export default CenterCanvas
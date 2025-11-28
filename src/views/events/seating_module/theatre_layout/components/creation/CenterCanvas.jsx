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


// Draggable Stage Component
const DraggableStage = ({ stage, isSelected, onSelect, onDragEnd, onTransformEnd, setIsDraggingElement }) => {
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
        draggable
        x={stage.x}
        y={stage.y}
        onClick={onSelect}
        onTap={onSelect}
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
            height: Math.max(30, stage.height * scaleY)
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
            if (Math.abs(newBox.width) < 200 || Math.abs(newBox.height) < 30) {
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
const DraggableSection = ({ section, isSelected, onSelect, onDragEnd, onTransformEnd, children, setIsDraggingElement }) => {
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
        draggable
        x={section.x}
        y={section.y}
        onClick={onSelect}
        onTap={onSelect}
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
            width: Math.max(200, section.width * scaleX),
            height: Math.max(150, section.height * scaleY)
          });

          // Reset scale after transform
          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        <Rect
          width={section.width}
          height={section.height}
          fill="transparent"
          stroke={isSelected ? PRIMARY : '#999'}
          strokeWidth={0.5}
          dash={[5, 5]}
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
      {isSelected && (
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
  const { stageRef, canvasScale, showGrid, stage, setStage, sections, updateSection, selectedType, selectedElement, setSelectedElement, setSelectedType, handleCanvasClick, handleWheel, setStagePosition, isAssignMode } = props;


  const layerRef = useRef();
  const [isDraggingElement, setIsDraggingElement] = useState(false);

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
            isSelected={!isAssignMode && selectedType === 'stage' && selectedElement?.position === stage.position}
            setIsDraggingElement={setIsDraggingElement}
            onSelect={() => {
              if (!isAssignMode) {
                setSelectedElement(stage);
                setSelectedType('stage');
              }
            }}
            onDragEnd={(pos) => {
              if (!isAssignMode) {
                const updatedStage = {
                  ...stage,
                  x: parseFloat(pos.x) || 0,
                  y: parseFloat(pos.y) || 0
                };
                console.log(updatedStage)
                setStage(updatedStage);
                if (selectedType === 'stage') setSelectedElement(updatedStage);
              }
            }}
            onTransformEnd={(transform) => {
              if (!isAssignMode) {
                const updatedStage = {
                  ...stage,
                  x: parseFloat(transform.x) || 0,
                  y: parseFloat(transform.y) || 0,
                  width: parseFloat(transform.width) || 200,
                  height: parseFloat(transform.height) || 30
                };
                setStage(updatedStage);
                if (selectedType === 'stage') setSelectedElement(updatedStage);
              }
            }}
          />

          {/* Sections */}
          {sections.map(section => (
            <DraggableSection
              key={section.id}
              section={section}
              isSelected={!isAssignMode && selectedElement?.id === section.id && selectedType === 'section'}
              setIsDraggingElement={setIsDraggingElement}
              onSelect={() => {
                if (!isAssignMode) {
                  setSelectedElement(section);
                  setSelectedType('section');
                }
              }}
              onDragEnd={(pos) => {
                if (!isAssignMode) {
                  const updatedSection = { ...section, ...pos };
                  updateSection(section.id, pos);
                  if (selectedElement?.id === section.id && selectedType === 'section') {
                    setSelectedElement(updatedSection);
                  }
                }
              }}
              onTransformEnd={(transform) => {
                if (!isAssignMode) {
                  // Update section with transform data - this will trigger gap preservation in updateSection
                  updateSection(section.id, transform);

                  // Update selected element to reflect new dimensions
                  if (selectedElement?.id === section.id && selectedType === 'section') {
                    const updatedSection = { ...section, ...transform };
                    setSelectedElement(updatedSection);
                  }
                }
              }}
            >

              {/* Rows and Seats */}
              {section.rows.map(row => {
                // Safety check for row seats
                if (!row.seats || row.seats.length === 0) return null;

                const firstSeatY = row.seats[0]?.y ?? 50;

                return (
                  <Group key={row.id}>
                    <Text
                      x={10}
                      y={firstSeatY - 5}
                      text={row.title}
                      fontSize={14}
                      fill="#FFFFFF"
                      fontStyle="bold"
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
                              listening={false}
                              opacity={0.3}
                            />
                          </Group>
                        );
                      }

                      // Determine opacity based on seat status
                      const isDisabled = seat.status === 'disabled';
                      const seatOpacity = isDisabled ? 0.3 : 1;

                      return (
                        <Group key={seat.id} opacity={seatOpacity}>
                          <Rect
                            x={seat.x - seat.radius}
                            y={seat.y - seat.radius}
                            width={seat.radius * 2}
                            height={seat.radius * 2}
                            fill={selectedElement?.id === seat.id && selectedType === 'seat' ? '#b51515' : 'transparent'}
                            stroke={selectedElement?.id === seat.id && selectedType === 'seat' ? '#b51515' : PRIMARY}
                            strokeWidth={selectedElement?.id === seat.id && selectedType === 'seat' ? 2 : 1}
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
                              e.cancelBubble = true;
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
                              fill="#FFFFFF"
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
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export default CenterCanvas
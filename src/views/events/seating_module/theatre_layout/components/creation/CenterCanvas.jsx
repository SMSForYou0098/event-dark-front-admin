import React, { useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server';
import { Stage, Layer, Rect, Text, Group, Line, Transformer, Image as KonvaImage } from 'react-konva';
import { PRIMARY } from 'utils/consts';
import { MdOutlineChair, MdOutlineTableBar } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { FaChair } from 'react-icons/fa';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';


// Draggable Stage Component
const DraggableStage = ({ stage, isSelected, onSelect, onDragEnd, onTransformEnd }) => {
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
        onDragEnd={(e) => {
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
        <Rect
          width={stage.width}
          height={stage.height}
          fill="#333"
          stroke={isSelected ? PRIMARY : '#000'}
          strokeWidth={isSelected ? 2 : 1}
        />
        <Text
          width={stage.width}
          y={stage.height / 2 - 10}
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
          enabledAnchors={['middle-left', 'middle-right']}
          rotateEnabled={false}
        />
      )}
    </>
  );
};

// Draggable Section Component
const DraggableSection = ({ section, isSelected, onSelect, onDragEnd, onTransformEnd, children }) => {
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
        onDragEnd={(e) => {
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
          fill="rgba(200, 200, 200, 0.2)"
          stroke={isSelected ? PRIMARY : '#999'}
          strokeWidth={isSelected ? 2 : 1}
          dash={[5, 5]}
        />
        <Text
          x={10}
          y={10}
          text={section.name}
          fontSize={16}
          fill="#FFFFFF"
          fontStyle="bold"
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
            if (Math.abs(newBox.width) < 200 || Math.abs(newBox.height) < 150) {
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
  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={window.innerWidth - 700}
        height={window.innerHeight - 100}
        draggable={true}
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
            onSelect={() => {
              if (!isAssignMode) {
                setSelectedElement(stage);
                setSelectedType('stage');
              }
            }}
            onDragEnd={(pos) => {
              if (!isAssignMode) {
                const updatedStage = { ...stage, ...pos };
                setStage(updatedStage);
                if (selectedType === 'stage') setSelectedElement(updatedStage);
              }
            }}
            onTransformEnd={(transform) => {
              if (!isAssignMode) {
                const updatedStage = { ...stage, ...transform };
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
                  if (selectedElement?.id === section.id && selectedType === 'section') setSelectedElement(updatedSection);
                }
              }}
              onTransformEnd={(transform) => {
                if (!isAssignMode) {
                  const updatedSection = { ...section, ...transform };
                  updateSection(section.id, transform);
                  if (selectedElement?.id === section.id && selectedType === 'section') setSelectedElement(updatedSection);
                }
              }}
            >
              {/* Rows and Seats */}
              {section.rows.map(row => (
                <Group key={row.id}>
                  <Text
                    x={10}
                    y={row.seats[0]?.y - 5}
                    text={row.title}
                    fontSize={14}
                    fill="#FFFFFF"
                    fontStyle="bold"
                    listening={false}
                  />

                  {row.seats.map(seat => {
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
                          stroke={selectedElement?.id === seat.id && selectedType === 'seat' ? '#b51515' : '#999'}
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
              ))}
            </DraggableSection>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export default CenterCanvas
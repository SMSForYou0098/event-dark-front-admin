import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Path, Line } from 'react-konva';
import { renderToStaticMarkup } from 'react-dom/server';
import { Image as KonvaImage } from 'react-konva';
import { MdOutlineChair } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { FaChair } from 'react-icons/fa';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';
import { PRIMARY } from 'utils/consts';

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
        };

        const IconComponent = iconMap[iconName];
        if (!IconComponent) return;

        const svgString = renderToStaticMarkup(
            <IconComponent size={size} color="#FFFFFF" />
        );
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const img = new window.Image();
        img.onload = () => {
            setImage(img);
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

// Get seat color based on status - Using PRIMARY color for consistency
const getSeatColor = (seat, isSelected) => {
    // Seats without tickets should be disabled
    if (!seat.ticket) return '#333333'; // Dark gray for no ticket

    if (seat.status === 'booked') return '#666666'; // Gray for booked
    if (seat.status === 'disabled') return '#333333'; // Dark gray for disabled
    if (isSelected || seat.status === 'selected') return '#52c41a'; // Green for selected

    // Use PRIMARY color for available seats (consistent with organizer side)
    return PRIMARY; // Your primary blue color
};

// Stage Component
const StageComponent = ({ stage }) => {
    if (!stage) return null;

    return (
        <Group x={stage.x} y={stage.y}>
            {stage.shape === 'curved' ? (
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
                    fillLinearGradientColorStops={[1, '#b51515', 0, '#0d0d0d']}
                    strokeWidth={1}
                />
            ) : (
                <Rect
                    width={stage.width}
                    height={stage.height}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{ x: 0, y: stage.height }}
                    fillLinearGradientColorStops={[1, '#b51515', 0, '#0d0d0d']}
                    strokeWidth={1}
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
    );
};

// Section Component
const SectionComponent = ({ section, selectedSeats, onSeatClick }) => {
    return (
        <Group x={section.x} y={section.y}>
            {/* Section Border */}
            <Rect
                width={section.width}
                height={section.height}
                fill="transparent"
                stroke="#999"
                strokeWidth={0.5}
                dash={[5, 5]}
                cornerRadius={5}
            />

            {/* Section Name */}
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

            {/* Rows and Seats */}
            {section.rows.map(row => {
                if (!row.seats || row.seats.length === 0) return null;

                const firstSeatY = row.seats[0]?.y ?? 50;

                return (
                    <Group key={row.id}>
                        {/* Row Label */}
                        <Text
                            x={10}
                            y={firstSeatY - 5}
                            text={row.title}
                            fontSize={14}
                            fill="#FFFFFF"
                            fontStyle="bold"
                            listening={false}
                        />

                        {/* Seats */}
                        {row.seats.map(seat => {
                            if (!seat || typeof seat.x !== 'number' || typeof seat.y !== 'number') {
                                return null;
                            }

                            const isSelected = selectedSeats.some(s => s.id === seat.id);
                            const hasTicket = !!seat.ticket;
                            const isDisabled = seat.status === 'disabled' || !hasTicket; // Disable if no ticket
                            const isBooked = seat.status === 'booked';
                            const isClickable = !isDisabled && !isBooked;
                            const seatColor = getSeatColor(seat, isSelected);
                            const seatOpacity = isDisabled ? 0.3 : 1;

                            return (
                                <Group key={seat.id} opacity={seatOpacity}>
                                    {/* Seat Background */}
                                    <Rect
                                        x={seat.x - seat.radius}
                                        y={seat.y - seat.radius}
                                        width={seat.radius * 2}
                                        height={seat.radius * 2}
                                        fill={seatColor}
                                        stroke={isSelected ? '#fff' : seatColor}
                                        strokeWidth={isSelected ? 2 : 1}
                                        cornerRadius={4}
                                        shadowColor={isSelected ? '#52c41a' : 'transparent'}
                                        shadowBlur={isSelected ? 10 : 0}
                                        shadowOpacity={isSelected ? 0.8 : 0}
                                        onMouseEnter={(e) => {
                                            if (isClickable) {
                                                const container = e.target.getStage().container();
                                                container.style.cursor = 'pointer';
                                                // Add hover effect
                                                e.target.strokeWidth(2);
                                                e.target.stroke('#fff');
                                                e.target.getLayer().batchDraw();
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (isClickable) {
                                                const container = e.target.getStage().container();
                                                container.style.cursor = 'default';
                                                // Remove hover effect
                                                if (!isSelected) {
                                                    e.target.strokeWidth(1);
                                                    e.target.stroke(seatColor);
                                                    e.target.getLayer().batchDraw();
                                                }
                                            }
                                        }}
                                        onClick={(e) => {
                                            if (isClickable) {
                                                e.cancelBubble = true;
                                                onSeatClick(seat, section.id, row.id);
                                            }
                                        }}
                                    />

                                    {/* Seat Icon or Number */}
                                    {seat.icon ? (
                                        <IconImage
                                            iconName={seat.icon}
                                            x={seat.x}
                                            y={seat.y}
                                            size={seat.radius * 1.2}
                                            opacity={1}
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

                                    {/* Booked Indicator (X mark) */}
                                    {isBooked && (
                                        <Text
                                            x={seat.x - seat.radius}
                                            y={seat.y - seat.radius}
                                            width={seat.radius * 2}
                                            height={seat.radius * 2}
                                            text="✕"
                                            fontSize={seat.radius * 1.5}
                                            fill="#F44336"
                                            align="center"
                                            verticalAlign="middle"
                                            listening={false}
                                        />
                                    )}

                                    {/* Disabled Indicator (diagonal line) */}
                                    {isDisabled && !isBooked && (
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
        </Group>
    );
};

// Calculate layout bounds to center it
const getLayoutBounds = (stage, sections) => {
    if (!stage || !sections || sections.length === 0) {
        return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
    }

    let minX = stage.x;
    let minY = stage.y;
    let maxX = stage.x + stage.width;
    let maxY = stage.y + stage.height;

    sections.forEach(section => {
        const sectionMinX = section.x;
        const sectionMinY = section.y;
        const sectionMaxX = section.x + section.width;
        const sectionMaxY = section.y + section.height;

        minX = Math.min(minX, sectionMinX);
        minY = Math.min(minY, sectionMinY);
        maxX = Math.max(maxX, sectionMaxX);
        maxY = Math.max(maxY, sectionMaxY);
    });

    return { minX, minY, maxX, maxY };
};

const BookingSeatCanvas = ({
    stageRef,
    canvasScale,
    stage,
    sections,
    selectedSeats,
    onSeatClick,
    handleWheel,
    setStagePosition
}) => {
    const layerRef = useRef();
    const [isDragging, setIsDragging] = useState(false);
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

    // Center the layout horizontally and position at top when component mounts
    useEffect(() => {
        if (!stageRef.current || !stage || sections.length === 0) return;

        const stageInstance = stageRef.current;
        const canvasWidth = stageInstance.width();

        // Calculate layout bounds
        const bounds = getLayoutBounds(stage, sections);
        const layoutWidth = bounds.maxX - bounds.minX;

        // Calculate horizontal center position
        const centerX = (canvasWidth - layoutWidth) / 2 - bounds.minX;

        // Position at top with minimal padding (not vertically centered)
        const topPadding = 50; // Small padding from top
        const topY = topPadding - bounds.minY;

        // Set initial position - centered horizontally, positioned at top
        const newPosition = { x: centerX, y: topY };
        setInitialPosition(newPosition);
        stageInstance.position(newPosition);
        setStagePosition(newPosition);
        stageInstance.batchDraw();
    }, [stage, sections, stageRef, setStagePosition]);

    return (
        <div className="booking-canvas-container overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
            <Stage
                ref={stageRef}
                width={window.innerWidth * 0.7}
                height={window.innerHeight - 200}
                draggable={true}
                scaleX={canvasScale}
                scaleY={canvasScale}
                onWheel={handleWheel}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e) => {
                    setIsDragging(false);
                    const pos = e.target.position();
                    setStagePosition(pos);
                }}
            >
                <Layer ref={layerRef}>
                    {/* Stage/Screen */}
                    <StageComponent stage={stage} />

                    {/* Sections */}
                    {sections.map(section => (
                        <SectionComponent
                            key={section.id}
                            section={section}
                            selectedSeats={selectedSeats}
                            onSeatClick={onSeatClick}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default BookingSeatCanvas;
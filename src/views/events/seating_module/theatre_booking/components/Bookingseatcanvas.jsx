import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect, Text, Group, Path, Line } from 'react-konva';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { PRIMARY, SECONDARY } from 'utils/consts';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaChair, FaClock } from 'react-icons/fa';
import { MdOutlineChair, MdOutlineTableBar } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';
import { PlusOutlined, MinusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Popover, Typography } from 'antd';

const THEME = {
    // Primary brand color
    primary: PRIMARY,
    primaryLight: '#ff3333',
    primaryDark: '#8a1010',

    // Background colors
    canvasBg: SECONDARY,
    screenGradientStart: '#0a0a0a',
    screenGradientMid: '#1a0505',
    screenGradientEnd: '#0d0d0d',

    // Text colors
    textPrimary: '#ffffff',
    textSecondary: '#e5e5e5',
    textMuted: '#9ca3af',

    // Seat status colors
    seatAvailable: PRIMARY,
    seatSelected: PRIMARY,
    seatBooked: 'rgb(255 255 255 / 6%)',
    seatDisabled: '#1f2937',
    seatNoTicket: '#111827',

    // UI elements
    buttonBg: 'rgba(181, 21, 21, 0.9)',
    buttonShadow: 'rgba(181, 21, 21, 0.4)',
    buttonSecondaryBg: 'rgba(30, 30, 30, 0.9)',
    hintBg: 'rgba(20, 5, 5, 0.9)',
    hintBorder: 'rgba(181, 21, 21, 0.5)',
    legendBg: SECONDARY,

    // Effects
    errorColor: '#ef4444',
};

const IS_MOBILE = typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const PIXEL_RATIO = typeof window !== 'undefined' ?
    Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 2 : 3) : 1;

// Disable Konva warnings in production
Konva.showWarnings = false;
const iconImageCache = new Map();
const iconLoadingPromises = new Map();

const ICON_MAP = {
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

const createIconImage = (iconName, size, color = '#FFFFFF') => {
    const cacheKey = `${iconName}-${size}-${color}`;

    if (iconImageCache.has(cacheKey)) {
        return Promise.resolve(iconImageCache.get(cacheKey));
    }

    if (iconLoadingPromises.has(cacheKey)) {
        return iconLoadingPromises.get(cacheKey);
    }

    const promise = new Promise((resolve) => {
        try {
            const IconComponent = ICON_MAP[iconName];

            if (!IconComponent) {
                const DefaultIcon = ICON_MAP['FaChair'];
                const svgString = renderToStaticMarkup(
                    <DefaultIcon size={size} color={color} />
                );

                const img = new window.Image();
                img.onload = () => {
                    iconImageCache.set(cacheKey, img);
                    iconLoadingPromises.delete(cacheKey);
                    resolve(img);
                };
                img.onerror = () => {
                    iconLoadingPromises.delete(cacheKey);
                    resolve(null);
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
                return;
            }

            const svgString = renderToStaticMarkup(
                <IconComponent size={size} color={color} />
            );

            const img = new window.Image();
            img.onload = () => {
                iconImageCache.set(cacheKey, img);
                iconLoadingPromises.delete(cacheKey);
                resolve(img);
            };
            img.onerror = () => {
                iconLoadingPromises.delete(cacheKey);
                resolve(null);
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
        } catch (error) {
            console.error('Error creating icon image:', error);
            iconLoadingPromises.delete(cacheKey);
            resolve(null);
        }
    });

    iconLoadingPromises.set(cacheKey, promise);
    return promise;
};

const SEAT_COLORS = {
    available: THEME.seatAvailable,
    selected: THEME.seatSelected,
    booked: THEME.seatBooked,
    disabled: THEME.seatDisabled,
    noTicket: THEME.seatNoTicket,
};

const getSeatColor = (seat, isSelected) => {
    if (!seat.ticket) return SEAT_COLORS.noTicket;
    if (seat.status === 'booked') return SEAT_COLORS.booked;
    if (seat.status === 'disabled') return SEAT_COLORS.disabled;
    if (seat.status === 'hold' || seat.status === 'locked') return '#B51515'; // Orange color for hold/locked
    if (isSelected || seat.status === 'selected') return SEAT_COLORS.selected;
    return SEAT_COLORS.available;
};

const Seat = memo(({
    seat,
    isSelected,
    onClick,
    onHover,
    onLeave,
    sectionId,
    rowId,
    rowTitle
}) => {
    const [iconImage, setIconImage] = useState(null);
    const [clockIconImage, setClockIconImage] = useState(null);

    const hasTicket = !!seat.ticket;
    const isDisabled = seat.status === 'disabled' || !hasTicket;
    const isBooked = seat.status === 'booked';
    const isHold = seat.status === 'hold';
    const isLocked = seat.status === 'locked';
    // Allow clicking on available or selected seats (for deselection)
    // Disable if booked, hold, or locked
    const isClickable = !isDisabled && !isBooked && !isHold && !isLocked;
    const seatColor = getSeatColor(seat, isSelected);
    const seatOpacity = isDisabled ? 0.3 : 1;

    useEffect(() => {
        if (seat.icon) {
            // Use the icon name directly (e.g., 'FaChair', 'LuSofa', etc.)
            createIconImage(seat.icon, Math.floor(seat.radius * 1.2)).then(img => {
                if (img) setIconImage(img);
            });
        }
    }, [seat.icon, seat.radius]);

    // Create clock icon for hold/locked status
    useEffect(() => {
        if (isHold || isLocked) {
            const svgString = renderToStaticMarkup(
                <FaClock size={Math.floor(seat.radius * 1.2)} color="#B51515" />
            );
            const img = new window.Image();
            img.onload = () => setClockIconImage(img);
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        } else {
            setClockIconImage(null);
        }
    }, [isHold, isLocked, seat.radius]);

    const handleInteraction = useCallback((e) => {
        if (isClickable) {
            e.cancelBubble = true;
            onClick(seat, sectionId, rowId);
        }
    }, [isClickable, onClick, seat, sectionId, rowId]);

    const x = seat.x;
    const y = seat.y;
    const radius = seat.radius;

    // Handle blank seats (gaps) - render with dotted outline, non-interactive
    if (seat.type === 'blank') {
        return (
            <Group x={x} y={y}>
                <Rect
                    x={-radius}
                    y={-radius}
                    width={radius * 2}
                    height={radius * 2}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={1}
                    dash={[3, 3]}
                    cornerRadius={4}
                    listening={false}
                    opacity={0.3}
                    perfectDrawEnabled={false}
                />
            </Group>
        );
    }

    // Determine fill and stroke based on seat status
    const isAvailable = hasTicket && seat.status !== 'booked' && seat.status !== 'disabled' && !isSelected;
    const seatFill = isAvailable ? 'transparent' : seatColor;
    const seatStroke = isAvailable || isSelected ? SEAT_COLORS.available : 'transparent';
    const strokeWidth = isAvailable || isSelected ? 1 : 0;

    return (
        <Group x={x} y={y} opacity={seatOpacity}>
            <Rect
                x={-radius}
                y={-radius}
                width={radius * 2}
                height={radius * 2}
                fill={seatFill}
                cornerRadius={4}
                stroke={seatStroke}
                strokeWidth={strokeWidth}
                shadowColor={isSelected ? SEAT_COLORS.selected : 'transparent'}
                shadowBlur={isSelected ? 8 : 0}
                shadowOpacity={0.6}
                onClick={handleInteraction}
                onTap={handleInteraction}
                listening={isClickable}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                hitStrokeWidth={IS_MOBILE ? 12 : 4}

                onMouseEnter={(e) => {
                    const container = e.target.getStage().container();
                    if (isClickable) {
                        container.style.cursor = 'pointer';
                    } else if (isDisabled || isBooked || isHold || isLocked) {
                        container.style.cursor = 'not-allowed';
                    }

                    // Trigger hover with seat data and pointer position
                    if (onHover) {
                        // We need client coordinates for the fixed tooltip
                        // e.evt is the native event
                        onHover(seat, rowTitle, e.evt.clientX, e.evt.clientY);
                    }
                }}

                onMouseLeave={(e) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'default';
                    if (onLeave) onLeave();
                }}
            />


            {!isBooked && !isHold && !isLocked && (
                iconImage ? (
                    <KonvaImage
                        image={iconImage}
                        x={-radius * 0.6}
                        y={-radius * 0.6}
                        width={radius * 1.2}
                        height={radius * 1.2}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                ) : (
                    <Text
                        x={-radius}
                        y={-radius}
                        width={radius * 2}
                        height={radius * 2}
                        text={String(seat.number)}
                        fontSize={Math.max(9, Math.min(11, radius * 0.8))}
                        fill={THEME.textPrimary}
                        align="center"
                        verticalAlign="middle"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                )
            )}

            {isBooked && (
                <Text
                    x={-radius}
                    y={-radius * 0.8}
                    width={radius * 2}
                    height={radius * 2}
                    text="✕"
                    fontSize={radius * 1.2}
                    fill={THEME.errorColor}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                    perfectDrawEnabled={false}
                />
            )}

            {(isHold || isLocked) && clockIconImage && (
                <KonvaImage
                    image={clockIconImage}
                    x={-radius * 0.6}
                    y={-radius * 0.6}
                    width={radius * 1.2}
                    height={radius * 1.2}
                    listening={false}
                    perfectDrawEnabled={false}
                />
            )}

            {isDisabled && !isBooked && !isHold && !isLocked && (
                <Line
                    points={[-radius * 0.5, -radius * 0.5, radius * 0.5, radius * 0.5]}
                    stroke={THEME.errorColor}
                    strokeWidth={1.5}
                    listening={false}
                    perfectDrawEnabled={false}
                />
            )}
        </Group>
    );
}, (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected &&
        prevProps.seat.status === nextProps.seat.status &&
        prevProps.seat.x === nextProps.seat.x &&
        prevProps.seat.y === nextProps.seat.y;
});

Seat.displayName = 'Seat';

const Row = memo(({ row, selectedSeatIds, onSeatClick, onSeatHover, onSeatLeave, sectionId }) => {
    if (!row.seats || row.seats.length === 0) return null;

    const firstSeatY = row.seats[0]?.y ?? 50;

    return (
        <Group>
            <Text
                x={10}
                y={firstSeatY - 5}
                text={row.title}
                fontSize={13}
                fill={THEME.textSecondary}
                fontStyle="600"
                listening={false}
                perfectDrawEnabled={false}
            />

            {row.seats.map(seat => {
                if (!seat || typeof seat.x !== 'number' || typeof seat.y !== 'number') {
                    return null;
                }

                return (
                    <Seat
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatIds.has(seat.id)}
                        onClick={onSeatClick}
                        onHover={onSeatHover}
                        onLeave={onSeatLeave}
                        sectionId={sectionId}
                        rowId={row.id}
                        rowTitle={row.title}
                    />
                );
            })}
        </Group>
    );
}, (prevProps, nextProps) => {
    // Check if selected seats changed
    const prevHasSelected = prevProps.row.seats.some(s => prevProps.selectedSeatIds.has(s.id));
    const nextHasSelected = nextProps.row.seats.some(s => nextProps.selectedSeatIds.has(s.id));

    if (prevHasSelected !== nextHasSelected) return false;
    if (!prevHasSelected && !nextHasSelected) {
        // Even if no selected seats, check if any seat status changed
        const statusChanged = prevProps.row.seats.some((prevSeat, index) => {
            const nextSeat = nextProps.row.seats[index];
            return !nextSeat || prevSeat.status !== nextSeat.status;
        });
        return !statusChanged; // Return true if no changes (skip re-render)
    }

    // Check both selection and status changes
    return prevProps.row.seats.every((prevSeat, index) => {
        const nextSeat = nextProps.row.seats[index];
        if (!nextSeat) return false;
        return prevProps.selectedSeatIds.has(prevSeat.id) === nextProps.selectedSeatIds.has(nextSeat.id) &&
               prevSeat.status === nextSeat.status;
    });
});

Row.displayName = 'Row';

const Section = memo(({ section, selectedSeatIds, onSeatClick, onSeatHover, onSeatLeave }) => {
    return (
        <Group x={section.x} y={section.y}>
            <Text
                x={0}
                y={12}
                width={section.width}
                text={section.name}
                fontSize={14}
                fill={THEME.textPrimary}
                fontStyle="bold"
                align="center"
                listening={false}
                perfectDrawEnabled={false}
            />

            {section.rows.map(row => (
                <Row
                    key={row.id}
                    row={row}
                    selectedSeatIds={selectedSeatIds}
                    onSeatClick={onSeatClick}
                    onSeatHover={onSeatHover}
                    onSeatLeave={onSeatLeave}
                    sectionId={section.id}
                />
            ))}
        </Group>
    );
}, (prevProps, nextProps) => {
    // If section reference changed, always re-render (new data)
    if (prevProps.section !== nextProps.section) return false;
    
    // If section is same reference, check if selection changed
    if (prevProps.selectedSeatIds !== nextProps.selectedSeatIds) {
        // Check if any seat selection actually changed
        for (const row of prevProps.section.rows || []) {
            for (const seat of row.seats || []) {
            if (prevProps.selectedSeatIds.has(seat.id) !== nextProps.selectedSeatIds.has(seat.id)) {
                    return false; // Selection changed, re-render
            }
        }
    }
    }
    
    // Note: We can't detect seat status changes if section reference is same
    // But since we create new objects in setSections, reference should change
    // If status changes, section reference will be different, so we return false above
    return true;
});

Section.displayName = 'Section';

const StageScreen = memo(({ stage }) => {
    if (!stage) return null;

    const isStraight = stage.shape === 'straight';

    // Curve intensity - how much the line curves
    const curveIntensity = stage.curve || 0.12;
    const curveHeight = isStraight ? 0 : stage.width * curveIntensity;

    return (
        <Group x={stage.x} y={stage.y}>
            {/* Conditional curved or straight screen line */}
            {isStraight ? (
                <Line
                    points={[0, 0, stage.width, 0]}
                    stroke={THEME.primary}
                    strokeWidth={3}
                    lineCap="round"
                    listening={false}
                    perfectDrawEnabled={false}
                    shadowColor={THEME.primary}
                    shadowBlur={12}
                    shadowOpacity={0.7}
                />
            ) : (
                <Path
                    data={`
                        M 0 ${curveHeight}
                        Q ${stage.width / 2} 0 ${stage.width} ${curveHeight}
                    `}
                    stroke={THEME.primary}
                    strokeWidth={3}
                    fill="transparent"
                    lineCap="round"
                    listening={false}
                    perfectDrawEnabled={false}
                    shadowColor={THEME.primary}
                    shadowBlur={12}
                    shadowOpacity={0.7}
                />
            )}

            {/* SCREEN Label */}
            <Text
                width={stage.width}
                y={curveHeight + 15}
                text={stage.name || 'SCREEN'}
                fontSize={14}
                fill={THEME.textSecondary}
                fontStyle="500"
                align="center"
                letterSpacing={4}
                listening={false}
                perfectDrawEnabled={false}
            />
        </Group>
    );
});

StageScreen.displayName = 'StageScreen';


const getLayoutBounds = (stage, sections) => {
    if (!stage || !sections || sections.length === 0) {
        return { minX: 0, minY: 0, maxX: 1000, maxY: 600, width: 1000, height: 600 };
    }

    let minX = stage.x;
    let minY = stage.y;
    let maxX = stage.x + stage.width;
    let maxY = stage.y + stage.height;

    sections.forEach(section => {
        minX = Math.min(minX, section.x);
        minY = Math.min(minY, section.y);
        maxX = Math.max(maxX, section.x + section.width);
        maxY = Math.max(maxY, section.y + section.height);
    });

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
};

const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getCenter = (p1, p2) => {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
};

const BookingSeatCanvas = ({
    stageRef: externalStageRef,
    canvasScale: externalScale,
    stage,
    sections,
    selectedSeats,
    onSeatClick,
    handleWheel: externalHandleWheel,
    setStagePosition: externalSetStagePosition,
    primaryColor = PRIMARY
}) => {
    const internalStageRef = useRef(null);
    const stageRef = externalStageRef || internalStageRef;
    const containerRef = useRef(null);

    const lastCenter = useRef(null);
    const lastDist = useRef(0);
    const dragStopped = useRef(false);
    const hasInitialized = useRef(false);
    const lastTapTime = useRef(0);

    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(externalScale || 1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isReady, setIsReady] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [hoveredSeat, setHoveredSeat] = useState(null);

    // Update primary color
    useEffect(() => {
        SEAT_COLORS.available = primaryColor;
    }, [primaryColor]);

    // Hide hint after 3 seconds
    useEffect(() => {
        if (IS_MOBILE && isReady) {
            const timer = setTimeout(() => setShowHint(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isReady]);

    // Selected seat IDs for O(1) lookup
    // Extract all seat_id values from the nested seats arrays
    const selectedSeatIds = useMemo(() => {
        const seatIds = new Set();
        selectedSeats.forEach(ticket => {
            if (ticket.seats && Array.isArray(ticket.seats)) {
                ticket.seats.forEach(seat => {
                    seatIds.add(seat.seat_id);
                });
            }
        });
        return seatIds;
    }, [selectedSeats]);

    // Memoized seat click handler
    const handleSeatClick = useCallback((seat, sectionId, rowId) => {
        onSeatClick(seat, sectionId, rowId);
    }, [onSeatClick]);

    // Hover handlers
    const handleSeatHover = useCallback((seat, rowTitle, x, y) => {
        let relativeX = x;
        let relativeY = y;

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            relativeX = x - rect.left;
            relativeY = y - rect.top;
        }

        setHoveredSeat({
            seat,
            rowTitle,
            x: relativeX,
            y: relativeY
        });
    }, []);

    const handleSeatLeave = useCallback(() => {
        setHoveredSeat(null);
    }, []);

    // Responsive dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width || window.innerWidth,
                    height: rect.height || window.innerHeight - 200
                });
            } else {
                setDimensions({
                    width: IS_MOBILE ? window.innerWidth : window.innerWidth * 0.7,
                    height: window.innerHeight - 200
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Calculate initial view
    const getInitialView = useCallback(() => {
        const bounds = getLayoutBounds(stage, sections);
        const padding = IS_MOBILE ? 40 : 80;

        const scaleX = (dimensions.width - padding * 2) / bounds.width;
        const scaleY = (dimensions.height - padding * 2) / bounds.height;
        const fitScale = Math.min(scaleX, scaleY, IS_MOBILE ? 0.8 : 1);

        // Center horizontally
        // The content center in original coordinates is at (minX + width/2)
        // After scaling, we want this center to be at canvas center (dimensions.width / 2)
        const contentCenterX = bounds.minX + bounds.width / 2;
        const centerX = dimensions.width / 2 - contentCenterX * fitScale;

        // Position at top with padding
        const centerY = padding - bounds.minY * fitScale;

        return { scale: fitScale, position: { x: centerX, y: centerY } };
    }, [stage, sections, dimensions]);

    // Reset initialization when stage or dimensions change
    useEffect(() => {
        hasInitialized.current = false;
    }, [stage, dimensions]);

    // Initial centering and scale
    useEffect(() => {
        if (!stageRef.current || !stage || sections.length === 0) return;

        // Only run initial setup once per stage/dimension change, prevent zoom reset when selecting seats
        if (hasInitialized.current) return;

        const { scale: fitScale, position: initialPos } = getInitialView();

        setScale(fitScale);
        setPosition(initialPos);

        if (externalSetStagePosition) {
            externalSetStagePosition(initialPos);
        }

        setIsReady(true);
        hasInitialized.current = true;
    }, [stage, sections, dimensions, stageRef, externalSetStagePosition, getInitialView]);

    // Mouse wheel zoom
    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();

        const scaleBy = 1.08;
        const stageInstance = stageRef.current;
        if (!stageInstance) return;

        const oldScale = scale;
        const pointer = stageInstance.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - position.x) / oldScale,
            y: (pointer.y - position.y) / oldScale,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.5, Math.min(3, newScale));

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };

        setScale(clampedScale);
        setPosition(newPos);

        if (externalHandleWheel) {
            externalHandleWheel(e);
        }
    }, [scale, position, stageRef, externalHandleWheel]);

    // ========================================================================
    // KONVA MULTI-TOUCH HANDLERS
    // ========================================================================
    const handleTouchStart = useCallback((e) => {
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        // Double tap detection
        if (e.evt.touches.length === 1) {
            const currentTime = Date.now();
            if (currentTime - lastTapTime.current < 300) {
                // Double tap - reset view
                const { scale: fitScale, position: initialPos } = getInitialView();
                setScale(fitScale);
                setPosition(initialPos);
            }
            lastTapTime.current = currentTime;
        }

        if (touch1 && touch2) {
            // Stop dragging when pinching
            const stageInstance = stageRef.current;
            if (stageInstance) {
                stageInstance.stopDrag();
                dragStopped.current = true;
            }

            const p1 = { x: touch1.clientX, y: touch1.clientY };
            const p2 = { x: touch2.clientX, y: touch2.clientY };

            lastCenter.current = getCenter(p1, p2);
            lastDist.current = getDistance(p1, p2);
        }
    }, [stageRef, getInitialView]);

    const handleTouchMove = useCallback((e) => {
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        if (touch1 && touch2) {
            e.evt.preventDefault();

            const stageInstance = stageRef.current;
            if (!stageInstance) return;

            // Stop drag if not already stopped
            if (!dragStopped.current) {
                stageInstance.stopDrag();
                dragStopped.current = true;
            }

            const p1 = { x: touch1.clientX, y: touch1.clientY };
            const p2 = { x: touch2.clientX, y: touch2.clientY };

            const newCenter = getCenter(p1, p2);
            const newDist = getDistance(p1, p2);

            if (!lastCenter.current || lastDist.current === 0) {
                lastCenter.current = newCenter;
                lastDist.current = newDist;
                return;
            }

            // Calculate scale change
            const scaleRatio = newDist / lastDist.current;
            const newScale = Math.max(0.5, Math.min(3, scale * scaleRatio));

            // Get container offset
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();

            // Convert center to stage coordinates
            const pointX = newCenter.x - rect.left;
            const pointY = newCenter.y - rect.top;

            // Calculate position to zoom towards center
            const mousePointTo = {
                x: (pointX - position.x) / scale,
                y: (pointY - position.y) / scale,
            };

            // Calculate pan delta
            const dx = newCenter.x - lastCenter.current.x;
            const dy = newCenter.y - lastCenter.current.y;

            // New position combines zoom and pan
            const newPos = {
                x: pointX - mousePointTo.x * newScale + dx,
                y: pointY - mousePointTo.y * newScale + dy,
            };

            setScale(newScale);
            setPosition(newPos);

            lastCenter.current = newCenter;
            lastDist.current = newDist;
        }
    }, [scale, position, stageRef]);

    const handleTouchEnd = useCallback(() => {
        lastCenter.current = null;
        lastDist.current = 0;
        dragStopped.current = false;
    }, []);

    // Drag end handler
    const handleDragEnd = useCallback((e) => {
        const pos = e.target.position();
        setPosition(pos);

        if (externalSetStagePosition) {
            externalSetStagePosition(pos);
        }
    }, [externalSetStagePosition]);

    // Zoom button handlers
    const handleZoomIn = useCallback(() => {
        const newScale = Math.min(3, scale * 1.3);
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        const mousePointTo = {
            x: (centerX - position.x) / scale,
            y: (centerY - position.y) / scale,
        };

        setScale(newScale);
        setPosition({
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        });
    }, [scale, position, dimensions]);

    const handleZoomOut = useCallback(() => {
        const newScale = Math.max(0.5, scale / 1.3);
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        const mousePointTo = {
            x: (centerX - position.x) / scale,
            y: (centerY - position.y) / scale,
        };

        setScale(newScale);
        setPosition({
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        });
    }, [scale, position, dimensions]);

    const handleResetView = useCallback(() => {
        const { scale: fitScale, position: initialPos } = getInitialView();
        setScale(fitScale);
        setPosition(initialPos);
    }, [getInitialView]);

    return (
        <div
            ref={containerRef}
            className="booking-canvas-container"
            style={{
                cursor: "grab",
                width: '100%',
                height: '100%',
                minHeight: dimensions.height,
                backgroundColor: THEME.canvasBg,
                overflow: 'hidden',
                touchAction: 'none',
                position: 'relative',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
            }}
        >
            {/* Loading state */}
            {!isReady && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: THEME.textPrimary,
                    fontSize: 14,
                    zIndex: 5
                }}>
                    Loading seats...
                </div>
            )}

            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable={true}
                onWheel={handleWheel}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    opacity: isReady ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
                pixelRatio={PIXEL_RATIO}
            >
                <Layer>
                    <StageScreen stage={stage} />

                    {sections.map(section => (
                        <Section
                            key={section.id}
                            section={section}
                            selectedSeatIds={selectedSeatIds}
                            onSeatClick={handleSeatClick}
                            onSeatHover={handleSeatHover}
                            onSeatLeave={handleSeatLeave}
                        />
                    ))}
                </Layer>
            </Stage>

            {/* Legend - Fixed position bottom left */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                display: 'flex',
                flexDirection: 'row',
                gap: 16,
                padding: '12px 16px',
                backgroundColor: THEME.legendBg,
                borderRadius: 8,
                zIndex: 10,
            }}>
                {[
                    { color: SEAT_COLORS.available, label: 'Available' },
                    { color: SEAT_COLORS.selected, label: 'Selected' },
                    { color: SEAT_COLORS.booked, label: 'Booked' },
                ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 14,
                            height: 14,
                            backgroundColor: item.color,
                            borderRadius: 3,
                        }} />
                        <span style={{ color: THEME.textPrimary, fontSize: 12 }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Zoom controls - Top right */}
            <div
                style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    zIndex: 10,
                }}
            >
                <Button
                    type="primary"
                    shape="circle"
                    icon={<PlusOutlined />}
                    onClick={handleZoomIn}
                    size={'small'}
                />

                <Button
                    type="primary"
                    shape="circle"
                    icon={<MinusOutlined />}
                    onClick={handleZoomOut}
                    size={'small'}
                />

                <Button
                    shape="circle"
                    icon={<ReloadOutlined />}
                    onClick={handleResetView}
                    size={'small'}
                />
            </div>

            {/* Pinch hint for mobile */}
            {IS_MOBILE && showHint && isReady && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: THEME.hintBg,
                        color: THEME.textPrimary,
                        padding: '10px 20px',
                        borderRadius: 24,
                        fontSize: 13,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        zIndex: 5,
                        animation: 'fadeInOut 4s forwards',
                        border: `1px solid ${THEME.hintBorder}`,
                    }}
                >
                    <span style={{ fontSize: 18 }}>👆👆</span>
                    Pinch to zoom • Double tap to reset
                </div>
            )}

            {/* Seat Tooltip */}
            {hoveredSeat && (
                <Popover
                    open={true}
                    content={
                        <div>
                            <Typography.Text strong>
                                {hoveredSeat.rowTitle}{hoveredSeat.seat.number}
                            </Typography.Text>

                            {hoveredSeat.seat.ticket && (
                                <>
                                    <br />
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {hoveredSeat.seat.ticket.name}
                                    </Typography.Text>
                                    <br />
                                    <Typography.Text strong style={{ color: THEME.primary }}>
                                        ₹{hoveredSeat.seat.ticket.price}
                                    </Typography.Text>
                                </>
                            )}
                        </div>
                    }
                    destroyTooltipOnHide
                >
                    <div
                        style={{
                            position: "absolute",
                            top: hoveredSeat.y - 10,
                            left: hoveredSeat.x,
                            width: 1,
                            height: 1,
                            pointerEvents: "none",
                        }}
                    />
                </Popover>
            )}

            <style>{`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default memo(BookingSeatCanvas);
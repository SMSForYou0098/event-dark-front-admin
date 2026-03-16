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
import { PlusOutlined, MinusOutlined, ReloadOutlined, LayoutOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from 'antd';
import { motion } from 'framer-motion';

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

    // Overlay
    overlayBg: 'rgba(0, 0, 0, 0.65)',
    overlayBlur: 'blur(6px)',

    // Effects
    errorColor: '#ef4444',
};

const OVERLAY_STYLE = {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    borderRadius: 8,
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
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth={1}
                    dash={[3, 3]}
                    cornerRadius={4}
                    listening={false}
                    opacity={0.4}
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
    primaryColor = PRIMARY,
    layoutId
}) => {
    const internalStageRef = useRef(null);
    const stageRef = externalStageRef || internalStageRef;
    const containerRef = useRef(null);

    const lastCenter = useRef(null);
    const lastDist = useRef(0);
    const dragStopped = useRef(false);
    const hasInitialized = useRef(false);
    const lastTapTime = useRef(0);
    const animFrameRef = useRef(null);
    const hoverTimerRef = useRef(null);
    const leaveTimerRef = useRef(null);
    const saveTimerRef = useRef(null);

    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(externalScale || 1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isReady, setIsReady] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [hoveredSeat, setHoveredSeat] = useState(null);

    // Refs to keep scale/position in sync for animation closures
    const scaleRef = useRef(scale);
    const positionRef = useRef(position);
    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { positionRef.current = position; }, [position]);

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

    // Prevent page scroll when wheeling over canvas
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const preventScroll = (e) => e.preventDefault();
        container.addEventListener('wheel', preventScroll, { passive: false });
        return () => container.removeEventListener('wheel', preventScroll, { passive: false });
    }, []);

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    // ──── Smooth animated zoom/pan ────
    const animateTo = useCallback((targetScale, targetPosition, duration = 280) => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const startScale = scaleRef.current;
        const startPos = { ...positionRef.current };
        const startTime = performance.now();

        const step = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

            const s = startScale + (targetScale - startScale) * ease;
            const p = {
                x: startPos.x + (targetPosition.x - startPos.x) * ease,
                y: startPos.y + (targetPosition.y - startPos.y) * ease,
            };

            scaleRef.current = s;
            positionRef.current = p;
            setScale(s);
            setPosition(p);

            if (t < 1) {
                animFrameRef.current = requestAnimationFrame(step);
            } else {
                animFrameRef.current = null;
            }
        };

        animFrameRef.current = requestAnimationFrame(step);
    }, []);

    // ──── Save view to sessionStorage (debounced) ────
    const saveView = useCallback((s, p) => {
        if (!layoutId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                sessionStorage.setItem(
                    `seatingView_layout_${layoutId}`,
                    JSON.stringify({ scale: s, position: p })
                );
            } catch (e) { /* quota exceeded – ignore */ }
        }, 500);
    }, [layoutId]);

    // Persist on every zoom/pan change
    useEffect(() => {
        if (isReady) saveView(scale, position);
    }, [scale, position, isReady, saveView]);

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

    // Memoized seat click handler with auto-center
    const handleSeatClick = useCallback((seat, sectionId, rowId) => {
        onSeatClick(seat, sectionId, rowId);

        // Auto-center on the clicked seat
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        const seatAbsX = section.x + seat.x;
        const seatAbsY = section.y + seat.y;

        const ZOOM_THRESHOLD = 0.75;
        const TARGET_ZOOM = 1.15;
        const cur = scaleRef.current;

        const targetScale = cur < ZOOM_THRESHOLD ? TARGET_ZOOM : cur;
        const targetPos = {
            x: dimensions.width / 2 - seatAbsX * targetScale,
            y: dimensions.height / 2 - seatAbsY * targetScale,
        };

        animateTo(targetScale, targetPos);
    }, [onSeatClick, sections, dimensions, animateTo]);

    // Hover handlers with 400ms delay & stay-on-tooltip
    const handleSeatHover = useCallback((seat, rowTitle, x, y) => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);

        hoverTimerRef.current = setTimeout(() => {
            let relativeX = x;
            let relativeY = y;
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                relativeX = x - rect.left;
                relativeY = y - rect.top;
            }
            setHoveredSeat({ seat, rowTitle, x: relativeX, y: relativeY });
        }, 400);
    }, []);

    const handleSeatLeave = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        leaveTimerRef.current = setTimeout(() => setHoveredSeat(null), 150);
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

    // Initial centering and scale (with sessionStorage + deep link support)
    useEffect(() => {
        if (!stageRef.current || !stage) return;
        if (hasInitialized.current) return;

        // Empty layout – mark ready and bail
        if (sections.length === 0) {
            setIsReady(true);
            hasInitialized.current = true;
            return;
        }

        let initialScale = null;
        let initialPos = null;

        // 1. Try deep link URL params (?section=...&row=...)
        try {
            const params = new URLSearchParams(window.location.search);
            const sectionParam = params.get('section');
            const rowParam = params.get('row');
            if (sectionParam) {
                let targetSection = sections.find(s => String(s.id) === sectionParam);
                if (!targetSection) {
                    const idx = parseInt(sectionParam, 10);
                    if (!isNaN(idx) && idx >= 0 && idx < sections.length) targetSection = sections[idx];
                }
                if (targetSection) {
                    const pad = 40;
                    let targetRow = null;
                    if (rowParam) targetRow = targetSection.rows?.find(r => r.title === rowParam);

                    if (targetRow && targetRow.seats?.length) {
                        let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
                        targetRow.seats.forEach(s => {
                            mnX = Math.min(mnX, targetSection.x + s.x - s.radius);
                            mxX = Math.max(mxX, targetSection.x + s.x + s.radius);
                            mnY = Math.min(mnY, targetSection.y + s.y - s.radius);
                            mxY = Math.max(mxY, targetSection.y + s.y + s.radius);
                        });
                        const rw = mxX - mnX, rh = mxY - mnY;
                        initialScale = Math.min((dimensions.width - pad * 2) / rw, (dimensions.height - pad * 2) / rh, 2);
                        initialPos = {
                            x: dimensions.width / 2 - (mnX + rw / 2) * initialScale,
                            y: dimensions.height / 2 - (mnY + rh / 2) * initialScale,
                        };
                    } else {
                        initialScale = Math.min(
                            (dimensions.width - pad * 2) / targetSection.width,
                            (dimensions.height - pad * 2) / targetSection.height,
                            1.5
                        );
                        initialPos = {
                            x: dimensions.width / 2 - (targetSection.x + targetSection.width / 2) * initialScale,
                            y: dimensions.height / 2 - (targetSection.y + targetSection.height / 2) * initialScale,
                        };
                    }
                }
            }
        } catch (_) { /* ignore */ }

        // 2. Try sessionStorage
        if (initialScale === null && layoutId) {
            try {
                const saved = sessionStorage.getItem(`seatingView_layout_${layoutId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.scale && parsed.position) {
                        initialScale = parsed.scale;
                        initialPos = parsed.position;
                    }
                }
            } catch (_) { /* ignore */ }
        }

        // 3. Default fit (top-aligned)
        if (initialScale === null) {
            const view = getInitialView();
            initialScale = view.scale;
            initialPos = view.position;
        }

        setScale(initialScale);
        setPosition(initialPos);
        scaleRef.current = initialScale;
        positionRef.current = initialPos;

        if (externalSetStagePosition) externalSetStagePosition(initialPos);

        setIsReady(true);
        hasInitialized.current = true;
    }, [stage, sections, dimensions, stageRef, externalSetStagePosition, getInitialView, layoutId]);

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

    // Zoom button handlers (animated)
    const handleZoomIn = useCallback(() => {
        const newScale = Math.min(3, scaleRef.current * 1.3);
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;
        const mpt = {
            x: (cx - positionRef.current.x) / scaleRef.current,
            y: (cy - positionRef.current.y) / scaleRef.current,
        };
        animateTo(newScale, { x: cx - mpt.x * newScale, y: cy - mpt.y * newScale });
    }, [dimensions, animateTo]);

    const handleZoomOut = useCallback(() => {
        const newScale = Math.max(0.5, scaleRef.current / 1.3);
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;
        const mpt = {
            x: (cx - positionRef.current.x) / scaleRef.current,
            y: (cy - positionRef.current.y) / scaleRef.current,
        };
        animateTo(newScale, { x: cx - mpt.x * newScale, y: cy - mpt.y * newScale });
    }, [dimensions, animateTo]);

    const handleResetView = useCallback(() => {
        const { scale: fitScale, position: initialPos } = getInitialView();
        animateTo(fitScale, initialPos);
    }, [getInitialView, animateTo]);

    // ──── Zoom-to-section ────
    const handleZoomToSection = useCallback((sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;
        const pad = 40;
        const sx = (dimensions.width - pad * 2) / section.width;
        const sy = (dimensions.height - pad * 2) / section.height;
        const fitScale = Math.min(sx, sy, 1.5);
        animateTo(fitScale, {
            x: dimensions.width / 2 - (section.x + section.width / 2) * fitScale,
            y: dimensions.height / 2 - (section.y + section.height / 2) * fitScale,
        });
    }, [sections, dimensions, animateTo]);

    // ──── Viewport culling ────
    const visibleSections = useMemo(() => {
        if (!sections.length) return [];
        const pad = 300; // generous padding in canvas coords
        const vl = -position.x / scale - pad;
        const vt = -position.y / scale - pad;
        const vr = (dimensions.width - position.x) / scale + pad;
        const vb = (dimensions.height - position.y) / scale + pad;
        return sections.filter(s =>
            s.x + s.width > vl && s.x < vr && s.y + s.height > vt && s.y < vb
        );
    }, [sections, position.x, position.y, scale, dimensions.width, dimensions.height]);

    // Status label helper for tooltip
    const getSeatStatusLabel = useCallback((seat) => {
        if (selectedSeatIds.has(seat.id)) return 'Selected';
        if (seat.status === 'booked') return 'Booked';
        if (seat.status === 'hold' || seat.status === 'locked') return 'Locked';
        if (seat.status === 'disabled') return 'Disabled';
        return 'Available';
    }, [selectedSeatIds]);

    const getSeatStatusColor = useCallback((seat) => {
        if (selectedSeatIds.has(seat.id)) return THEME.textMuted;
        if (seat.status === 'booked' || seat.status === 'hold' || seat.status === 'locked' || seat.status === 'disabled') return THEME.textMuted;
        return '#22c55e'; // green for available
    }, [selectedSeatIds]);

    return (
        <motion.div
            ref={containerRef}
            className="booking-canvas-container"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
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
            {/* ── Empty layout state ── */}
            {isReady && sections.length === 0 && (
                <div
                    className="d-flex flex-column align-items-center justify-content-center"
                    style={{ position: 'absolute', inset: 0, zIndex: 5 }}
                >
                    <LayoutOutlined style={{ fontSize: 52, color: THEME.textMuted, marginBottom: 16 }} />
                    <div style={{ color: THEME.textSecondary, fontSize: 16, fontWeight: 600 }}>
                        No seating layout
                    </div>
                    <div style={{ color: THEME.textMuted, fontSize: 13, marginTop: 4 }}>
                        Layout not loaded or no sections available
                    </div>
                </div>
            )}

            {/* ── Loading state ── */}
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

            {/* ── Canvas ── */}
            {sections.length > 0 && (
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

                        {/* Viewport-culled sections */}
                        {visibleSections.map(section => (
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
            )}

            {/* ── Zoom controls – top right, with blur ── */}
            {isReady && sections.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        padding: 6,
                        ...OVERLAY_STYLE,
                        zIndex: 10,
                    }}
                >
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={handleZoomIn}
                        size="small"
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<MinusOutlined />}
                        onClick={handleZoomOut}
                        size="small"
                    />
                    <Button
                        shape="circle"
                        icon={<ReloadOutlined />}
                        onClick={handleResetView}
                        size="small"
                    />
                </motion.div>
            )}

            {/* ── Bottom bar: legend + section chips ── */}
            {isReady && sections.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    style={{
                        position: 'absolute',
                        bottom: 16,
                        ...(IS_MOBILE
                            ? { left: 12 }
                            : { left: '50%', transform: 'translateX(-50%)' }),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: '10px 14px',
                        ...OVERLAY_STYLE,
                        zIndex: 10,
                        maxWidth: 'calc(100% - 24px)',
                    }}
                >
                    {/* Legend row */}
                    <div className="d-flex" style={{ gap: 14 }}>
                        {[
                            { color: SEAT_COLORS.available, label: 'Available', border: true },
                            { color: SEAT_COLORS.selected, label: 'Selected' },
                            { color: SEAT_COLORS.booked, label: 'Booked' },
                        ].map((item) => (
                            <div key={item.label} className="d-flex align-items-center" style={{ gap: 6 }}>
                                <div style={{
                                    width: 14,
                                    height: 14,
                                    backgroundColor: item.border ? 'transparent' : item.color,
                                    border: item.border ? `1.5px solid ${item.color}` : 'none',
                                    borderRadius: 3,
                                }} />
                                <span style={{ color: THEME.textPrimary, fontSize: 12 }}>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Section chips (only when 2+ sections) */}
                    {sections.length >= 2 && (
                        <div className="d-flex flex-wrap" style={{ gap: 6 }}>
                            <span style={{ color: THEME.textMuted, fontSize: 11, lineHeight: '24px', marginRight: 2 }}>
                                Go to:
                            </span>
                            {sections.map(sec => (
                                <Tag
                                    key={sec.id}
                                    onClick={() => handleZoomToSection(sec.id)}
                                    style={{
                                        cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        color: THEME.textPrimary,
                                        fontSize: 11,
                                        borderRadius: 12,
                                        margin: 0,
                                    }}
                                >
                                    {sec.name}
                                </Tag>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Mobile pinch hint ── */}
            {IS_MOBILE && showHint && isReady && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: sections.length >= 2 ? 120 : 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        ...OVERLAY_STYLE,
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
                    Pinch to zoom &bull; Double tap to reset
                </div>
            )}

            {/* ── Seat tooltip on hover ── */}
            {hoveredSeat && (
                <div
                    onMouseEnter={() => { if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current); }}
                    onMouseLeave={() => setHoveredSeat(null)}
                    style={{
                        position: 'absolute',
                        top: hoveredSeat.y - 90,
                        left: hoveredSeat.x,
                        transform: 'translateX(-50%)',
                        ...OVERLAY_STYLE,
                        padding: '10px 14px',
                        zIndex: 20,
                        pointerEvents: 'auto',
                        minWidth: 110,
                        color: THEME.textPrimary,
                    }}
                >
                    <Typography.Text strong style={{ color: THEME.textPrimary, fontSize: 13 }}>
                        {hoveredSeat.rowTitle}{hoveredSeat.seat.number}
                    </Typography.Text>

                    {hoveredSeat.seat.ticket && (
                        <>
                            <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 2 }}>
                                {hoveredSeat.seat.ticket.name}
                            </div>
                            <div style={{ color: THEME.primary, fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                                &#8377;{hoveredSeat.seat.ticket.price}
                            </div>
                            <div style={{
                                fontSize: 11,
                                marginTop: 2,
                                fontWeight: 600,
                                color: getSeatStatusColor(hoveredSeat.seat),
                                textTransform: 'capitalize',
                            }}>
                                {getSeatStatusLabel(hoveredSeat.seat)}
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </motion.div>
    );
};

export default memo(BookingSeatCanvas);
import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
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
import { getBackgroundWithOpacity } from 'views/events/common/CustomUtil';

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

const SEAT_STYLES = {
    booked: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.4)',
        cursor: 'not-allowed',
    },
    reserved: {
        background: 'rgb(152, 124, 39)',
        border: '2px solid rgb(152, 124, 39)',
        color: '#000',
        cursor: 'not-allowed',
    },
    disabled: {
        background: '#1f2937',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.3)',
        cursor: 'not-allowed',
    },
    noTicket: {
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.25)',
        cursor: 'not-allowed',
    },
};

const parseSeatBorder = (borderValue) => {
    if (!borderValue) return { stroke: 'transparent', strokeWidth: 0 };
    const match = String(borderValue).match(/(\d+(?:\.\d+)?)px\s+solid\s+(.+)/i);
    if (!match) return { stroke: 'transparent', strokeWidth: 0 };
    return {
        strokeWidth: parseFloat(match[1]) || 0,
        stroke: match[2] || 'transparent',
    };
};

/** Row title + seat number (e.g. A1, Z12, AA1) — no extra separator */
const formatSeatDisplayLabel = (rowTitle, seatNumber) => {
    const t = rowTitle != null ? String(rowTitle).trim() : '';
    const n = seatNumber != null && seatNumber !== '' ? String(seatNumber) : '';
    return t ? `${t}${n}` : n;
};

/** Straight stage line at y=0; label placed below — keep in sync with StageScreen */
const BOOKING_STAGE_SCREEN_LABEL_Y = 12;
const BOOKING_STAGE_SCREEN_NAME_SIZE = 14;
/** Pixels below stage.y occupied by line + label + glow slack (booking uses straight only) */
const getBookingStageStraightFootprintPx = () =>
    BOOKING_STAGE_SCREEN_LABEL_Y + Math.ceil(BOOKING_STAGE_SCREEN_NAME_SIZE * 1.35) + 12;
/** Minimum gap between bottom of stage block and top of section / seats */
const BOOKING_STAGE_SECTION_GAP = 18;
/** Desired extra clear space between neighboring seats (display-only) */
const BOOKING_SEAT_CLEAR_GAP = 6;
/** Display-only seat size boost (radius) */
const BOOKING_SEAT_SIZE_BOOST = 2;

const applySeatHorizontalGapBoost = (sections) => {
    if (!sections?.length) return sections;

    return sections.map((section) => {
        if (section.type === 'Standing' || !section.rows?.length) return section;

        return {
            ...section,
            rows: section.rows.map((row) => {
                if (!row?.seats?.length) return row;

                const sortableSeats = row.seats
                    .map((seat, index) => ({ seat, index }))
                    .filter(({ seat }) => seat && typeof seat.x === 'number')
                    .sort((a, b) => a.seat.x - b.seat.x);

                if (sortableSeats.length <= 1) return row;

                let minCurrentGap = Infinity;
                let maxDisplayRadius = 0;
                for (let i = 0; i < sortableSeats.length; i++) {
                    const seat = sortableSeats[i].seat;
                    const displayRadius = (parseFloat(seat.radius) || 12) + BOOKING_SEAT_SIZE_BOOST;
                    maxDisplayRadius = Math.max(maxDisplayRadius, displayRadius);
                    if (i > 0) {
                        const prevX = sortableSeats[i - 1].seat.x;
                        minCurrentGap = Math.min(minCurrentGap, seat.x - prevX);
                    }
                }

                const targetMinGap = maxDisplayRadius * 2 + BOOKING_SEAT_CLEAR_GAP;
                const neededGapBoost = minCurrentGap < Infinity
                    ? Math.max(0, targetMinGap - minCurrentGap)
                    : 0;

                const middle = (sortableSeats.length - 1) / 2;
                const updatedSeats = [...row.seats];

                sortableSeats.forEach((entry, sortedIndex) => {
                    const offset = (sortedIndex - middle) * neededGapBoost;
                    updatedSeats[entry.index] = {
                        ...entry.seat,
                        x: entry.seat.x + offset,
                    };
                });

                return { ...row, seats: updatedSeats };
            }),
        };
    });
};

/** Push sections down so stage + SCREEN label never overlaps first row / titles (API may overlap) */
const applyStageSectionVerticalClearance = (stage, sections) => {
    if (!stage || !sections?.length) return sections;

    const footprint = getBookingStageStraightFootprintPx();
    const stageStrictBottom = stage.y + footprint;
    const apiH = parseFloat(stage.height);
    const stageBottom = Math.max(stageStrictBottom, stage.y + (Number.isFinite(apiH) ? apiH : 0));

    let minContentTop = Infinity;

    for (const sec of sections) {
        if (sec.type === 'Standing') {
            minContentTop = Math.min(minContentTop, sec.y);
            continue;
        }
        const rows = sec.rows || [];
        let secTop = sec.y + (rows.length ? 12 : 0);
        for (const row of rows) {
            for (const s of row.seats || []) {
                if (!s || typeof s.y !== 'number') continue;
                const r = parseFloat(s.radius) || 12;
                secTop = Math.min(secTop, sec.y + s.y - r);
            }
        }
        minContentTop = Math.min(minContentTop, secTop);
    }

    if (minContentTop === Infinity) return sections;

    const delta = stageBottom + BOOKING_STAGE_SECTION_GAP - minContentTop;
    if (delta <= 0) return sections;

    return sections.map(sec => ({ ...sec, y: sec.y + delta }));
};

const buildBookingDisplaySections = (sections, stage) =>
    // Keep booking geometry aligned with creation module coordinates.
    // Only apply slight seat-gap expansion + stage-to-section clearance.
    applyStageSectionVerticalClearance(stage, applySeatHorizontalGapBoost(sections ?? []));

const getSeatColor = (seat, isSelected, resolvedSeatColor) => {
    if (!seat.ticket) return SEAT_COLORS.noTicket;
    if (seat.status === 'booked') return SEAT_COLORS.booked;
    if (seat.status === 'disabled') return SEAT_COLORS.disabled;
    if (seat.status === 'hold' || seat.status === 'locked' || seat.status === 'reserved') return '#B51515';
    if (isSelected || seat.status === 'selected') return resolvedSeatColor;
    return resolvedSeatColor;
};

const Seat = memo(({
    seat,
    isSelected,
    onClick,
    onHover,
    onLeave,
    sectionId,
    rowId,
    rowTitle,
    rowSeatColor,
    sectionSeatColor
}) => {
    const [iconImage, setIconImage] = useState(null);
    const [clockIconImage, setClockIconImage] = useState(null);

    const hasTicket = !!seat.ticket;
    const isDisabled = seat.status === 'disabled' || !hasTicket;
    const isBooked = seat.status === 'booked';
    const isHold = seat.status === 'hold';
    const isLocked = seat.status === 'locked';
    const isReserved = seat.status === 'reserved';
    // Allow clicking on available or selected seats (for deselection)
    // Disable if booked, hold, or locked
    const isClickable = !isDisabled && !isBooked && !isHold && !isLocked && !isReserved;
    const resolvedSeatColor = seat.seatColor || seat.color || rowSeatColor || sectionSeatColor || SEAT_COLORS.available;
    const seatColor = getSeatColor(seat, isSelected, resolvedSeatColor);
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
    const seatLabel = formatSeatDisplayLabel(rowTitle, seat.number);
    const labelLen = seatLabel.length;
    const baseRadius = (parseFloat(seat.radius) || 12) + BOOKING_SEAT_SIZE_BOOST;
    // Keep seats slightly larger for longer labels (e.g., AA2 / AA12) to prevent text clipping.
    const radius =
        labelLen >= 5 ? baseRadius + 3 :
            labelLen >= 4 ? baseRadius + 2 :
                labelLen >= 3 ? baseRadius + 1 : baseRadius;
    const seatLabelFontSize = 7;

    // Handle blank seats (gaps) - keep them fully invisible in booking
    if (seat.type === 'blank') {
        return null;
    }

    // Determine fill and stroke based on seat status
    const isInteractiveSeat = hasTicket && !isBooked && !isDisabled && !isHold && !isLocked && !isReserved;
    const styleKey = !hasTicket ? 'noTicket' : (isBooked ? 'booked' : ((isHold || isLocked || isReserved) ? 'reserved' : (isDisabled ? 'disabled' : null)));
    const statusStyle = styleKey ? SEAT_STYLES[styleKey] : null;
    const parsedStatusBorder = statusStyle ? parseSeatBorder(statusStyle.border) : null;
    const seatFill = isInteractiveSeat
        ? (isSelected ? seatColor : getBackgroundWithOpacity(seatColor, 0.2))
        : (statusStyle?.background || seatColor);
    const seatStroke = isInteractiveSeat ? seatColor : (parsedStatusBorder?.stroke || 'transparent');
    const strokeWidth = isInteractiveSeat ? (isSelected ? 2 : 1) : (parsedStatusBorder?.strokeWidth || 0);
    const seatTextColor = isSelected ? THEME.textPrimary : (isInteractiveSeat ? seatColor : (statusStyle?.color || THEME.textPrimary));

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
                listening={true}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                hitStrokeWidth={IS_MOBILE ? 14 : 6}

                onMouseEnter={(e) => {
                    const container = e.target.getStage().container();
                    if (isClickable) {
                        container.style.cursor = 'pointer';
                    } else if (isDisabled || isBooked || isHold || isLocked || isReserved) {
                        container.style.cursor = statusStyle?.cursor || 'not-allowed';
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
                <>
                    {iconImage && (
                        <KonvaImage
                            image={iconImage}
                            x={-radius * 0.6}
                            y={-radius * 0.6}
                            width={radius * 1.2}
                            height={radius * 1.2}
                            listening={false}
                            perfectDrawEnabled={false}
                            opacity={0.35}
                        />
                    )}
                    <Text
                        x={-radius}
                        y={-radius}
                        width={radius * 2}
                        height={radius * 2}
                        text={seatLabel}
                        fontSize={seatLabelFontSize}
                        fill={seatTextColor}
                        align="center"
                        verticalAlign="middle"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                </>
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

            {isDisabled && !isBooked && !isHold && !isLocked && !isReserved && (
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
        prevProps.seat.y === nextProps.seat.y &&
        prevProps.rowTitle === nextProps.rowTitle &&
        prevProps.seat.number === nextProps.seat.number;
});

Seat.displayName = 'Seat';

const Row = memo(({ row, selectedSeatIds, onSeatClick, onSeatHover, onSeatLeave, sectionId, sectionSeatColor }) => {
    if (!row.seats || row.seats.length === 0) return null;

    return (
        <Group>
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
                        rowSeatColor={row.seatColor || row.color || null}
                        sectionSeatColor={sectionSeatColor}
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
        const changed = prevProps.row.seats.some((prevSeat, index) => {
            const nextSeat = nextProps.row.seats[index];
            return !nextSeat ||
                prevSeat.status !== nextSeat.status ||
                prevSeat.x !== nextSeat.x ||
                prevSeat.y !== nextSeat.y ||
                prevSeat.radius !== nextSeat.radius;
        });
        return !changed;
    }

    return prevProps.row.seats.every((prevSeat, index) => {
        const nextSeat = nextProps.row.seats[index];
        if (!nextSeat) return false;
        return prevProps.selectedSeatIds.has(prevSeat.id) === nextProps.selectedSeatIds.has(nextSeat.id) &&
            prevSeat.status === nextSeat.status &&
            prevSeat.x === nextSeat.x &&
            prevSeat.y === nextSeat.y &&
            prevSeat.radius === nextSeat.radius;
    });
});

Row.displayName = 'Row';

const Section = memo(({ section, selectedSeatIds, selectedSeats, onSeatClick, onStandingSectionClick, onSeatHover, onSeatLeave }) => {
    let selectedCount = 0;
    if (section.type === 'Standing') {
        const ticketId = section.ticket?.id;
        if (ticketId && selectedSeats) {
            const existingTicket = selectedSeats.find(t => t.id === ticketId);
            selectedCount = existingTicket?.standingQuantities?.[section.id] || 0;
        }
    }
    const isStandingSelected = selectedCount > 0;

    return (
        <Group x={section.x} y={section.y}>
            {section.type === 'Standing' ? (
                <Group
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (onStandingSectionClick) onStandingSectionClick(section);
                    }}
                    onTap={(e) => {
                        e.cancelBubble = true;
                        if (onStandingSectionClick) onStandingSectionClick(section);
                    }}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                    }}
                >
                    <Rect
                        x={4}
                        y={34}
                        width={Math.max(section.width - 8, 0)}
                        height={Math.max(section.height - 38, 0)}
                        fill={isStandingSelected ? "rgba(181, 21, 21, 0.4)" : "rgba(181, 21, 21, 0.15)"}
                        cornerRadius={8}
                    />
                    <Text
                        x={4}
                        y={section.height / 2 - 14}
                        width={Math.max(section.width - 8, 0)}
                        text={isStandingSelected ? `🎫 ${selectedCount} SELECTED` : `🎫 STANDING AREA`}
                        fontSize={16}
                        fill={THEME.textPrimary}
                        fontStyle="bold"
                        align="center"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                    <Text
                        x={4}
                        y={section.height / 2 + 10}
                        width={Math.max(section.width - 8, 0)}
                        text={section.name}
                        fontSize={13}
                        fill={THEME.textPrimary}
                        fontStyle="bold"
                        align="center"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                    {/* standing area capacity count */}
                    {/* <Text
                        x={4}
                        y={section.height / 2 + 28}
                        width={Math.max(section.width - 8, 0)}
                        text={`${section.remainingCapacity ?? 0}/${section.capacity ?? 0}`}
                        fontSize={11}
                        fill={THEME.textSecondary}
                        align="center"
                        listening={false}
                        perfectDrawEnabled={false}
                    /> */}
                </Group>
            ) : (
                <>
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
                            sectionSeatColor={section.seatColor || section.color || null}
                        />
                    ))}
                </>
            )}
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

    if (prevProps.selectedSeats !== nextProps.selectedSeats) {
        if (nextProps.section.type === 'Standing') return false;
    }

    // Note: We can't detect seat status changes if section reference is same
    // But since we create new objects in setSections, reference should change
    // If status changes, section reference will be different, so we return false above
    return true;
});

Section.displayName = 'Section';

const StageScreen = memo(({ stage }) => {
    if (!stage) return null;

    // Booking canvas always uses a straight screen (saves vertical space vs curved API layout)
    return (
        <Group x={stage.x} y={stage.y}>
            <Line
                points={[0, 0, stage.width, 0]}
                stroke={THEME.primary}
                strokeWidth={3}
                lineCap="round"
                listening={false}
                perfectDrawEnabled={false}
                shadowColor={THEME.primary}
                shadowBlur={10}
                shadowOpacity={0.65}
            />
            <Text
                width={stage.width}
                y={BOOKING_STAGE_SCREEN_LABEL_Y}
                text={stage.name || 'SCREEN'}
                fontSize={BOOKING_STAGE_SCREEN_NAME_SIZE}
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

        section.rows?.forEach(row => {
            row.seats?.forEach(seat => {
                if (!seat || typeof seat.x !== 'number' || typeof seat.y !== 'number') return;
                const r = parseFloat(seat.radius) || 12;
                const ax = section.x + seat.x;
                const ay = section.y + seat.y;
                minX = Math.min(minX, ax - r);
                maxX = Math.max(maxX, ax + r);
                minY = Math.min(minY, ay - r);
                maxY = Math.max(maxY, ay + r);
            });
        });
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
    onStandingSectionClick,
    handleWheel: externalHandleWheel,
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

    /** Relaxed spacing + larger hit targets for dense layouts (display-only; IDs unchanged) */
    const displaySections = useMemo(
        () => buildBookingDisplaySections(sections, stage),
        [sections, stage]
    );

    // Memoized seat click handler with auto-center
    const handleSeatClick = useCallback((seat, sectionId, rowId) => {
        onSeatClick(seat, sectionId, rowId);

        // Auto-center on the clicked seat
        const section = displaySections.find(s => s.id === sectionId);
        if (!section) return;

        const seatAbsX = section.x + seat.x;
        const seatAbsY = section.y + seat.y;

        const ZOOM_THRESHOLD = 0.75;
        const TARGET_ZOOM = 2; // Zoom in more when coming from full zoom-out
        const cur = scaleRef.current;

        const targetScale = cur < ZOOM_THRESHOLD ? TARGET_ZOOM : cur;
        const targetPos = {
            // Shift anchor slightly right (0.58 vs 0.5) so seat doesn't appear left-heavy
            x: dimensions.width * 0.58 - seatAbsX * targetScale,
            y: dimensions.height / 2 - seatAbsY * targetScale,
        };

        animateTo(targetScale, targetPos);
    }, [onSeatClick, displaySections, dimensions, animateTo]);

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
        const bounds = getLayoutBounds(stage, displaySections);
        const padding = IS_MOBILE ? 40 : 40;

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
    }, [stage, displaySections, dimensions]);

    // Reset initialization when stage, dimensions, or layout geometry change
    useEffect(() => {
        hasInitialized.current = false;
    }, [stage, dimensions, sections]);

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
                let targetSection = displaySections.find(s => String(s.id) === sectionParam);
                if (!targetSection) {
                    const idx = parseInt(sectionParam, 10);
                    if (!isNaN(idx) && idx >= 0 && idx < displaySections.length) targetSection = displaySections[idx];
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
        setIsReady(true);
        hasInitialized.current = true;
    }, [stage, sections, displaySections, dimensions, stageRef, getInitialView, layoutId]);

    // Mouse wheel zoom
    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();

        const scaleBy = 1.08;
        const stageInstance = stageRef.current;
        if (!stageInstance) return;

        // Read from refs — avoids stale closures and skips extra React re-renders mid-gesture
        const oldScale = scaleRef.current;
        const curPos = positionRef.current;
        const pointer = stageInstance.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - curPos.x) / oldScale,
            y: (pointer.y - curPos.y) / oldScale,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.5, Math.min(3, newScale));

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };

        // Update refs immediately (no re-render lag) and state for final commit
        scaleRef.current = clampedScale;
        positionRef.current = newPos;
        setScale(clampedScale);
        setPosition(newPos);

        if (externalHandleWheel) {
            externalHandleWheel(e);
        }
    }, [stageRef, externalHandleWheel]);

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
    }, []);

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
        const section = displaySections.find(s => s.id === sectionId);
        if (!section) return;
        const pad = 40;
        const sx = (dimensions.width - pad * 2) / section.width;
        const sy = (dimensions.height - pad * 2) / section.height;
        const fitScale = Math.min(sx, sy, 1.5);
        animateTo(fitScale, {
            x: dimensions.width / 2 - (section.x + section.width / 2) * fitScale,
            y: dimensions.height / 2 - (section.y + section.height / 2) * fitScale,
        });
    }, [displaySections, dimensions, animateTo]);

    // ──── Viewport culling ────
    const visibleSections = useMemo(() => {
        if (!displaySections.length) return [];
        const pad = 300; // generous padding in canvas coords
        const vl = -position.x / scale - pad;
        const vt = -position.y / scale - pad;
        const vr = (dimensions.width - position.x) / scale + pad;
        const vb = (dimensions.height - position.y) / scale + pad;
        return displaySections.filter(s =>
            s.x + s.width > vl && s.x < vr && s.y + s.height > vt && s.y < vb
        );
    }, [displaySections, position.x, position.y, scale, dimensions.width, dimensions.height]);

    // Status label helper for tooltip
    const getSeatStatusLabel = useCallback((seat) => {
        if (selectedSeatIds.has(seat.id)) return 'Selected';
        if (seat.status === 'booked') return 'Booked';
        if (seat.status === 'hold' || seat.status === 'locked') return 'Locked';
        if (seat.status === 'reserved') return 'Reserved';
        if (seat.status === 'disabled') return 'Disabled';
        return 'Available';
    }, [selectedSeatIds]);

    const getSeatStatusColor = useCallback((seat) => {
        if (selectedSeatIds.has(seat.id)) return '#22c55e';           // green — selected
        if (seat.status === 'booked') return '#ef4444';                // red — booked
        if (seat.status === 'hold' || seat.status === 'locked') return '#f97316'; // amber — locked
        if (seat.status === 'reserved') return '#f59e0b';              // orange — reserved
        if (seat.status === 'disabled') return THEME.textMuted;        // grey — disabled
        return '#22c55e'; // green — available
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
                // backgroundColor: THEME.canvasBg,
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
                                selectedSeats={selectedSeats}
                                onSeatClick={handleSeatClick}
                                onStandingSectionClick={onStandingSectionClick}
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
            {/* {isReady && sections.length > 0 && (
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
            )} */}

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
                        top: hoveredSeat.y - 100,
                        left: hoveredSeat.x,
                        transform: 'translateX(-50%)',
                        ...OVERLAY_STYLE,
                        padding: '10px 16px',
                        zIndex: 20,
                        pointerEvents: 'auto',
                        minWidth: 130,
                        color: THEME.textPrimary,
                    }}
                >
                    <Typography.Text strong style={{ color: THEME.textPrimary, fontSize: 15 }}>
                        {formatSeatDisplayLabel(hoveredSeat.rowTitle, hoveredSeat.seat?.number)}
                    </Typography.Text>

                    {hoveredSeat.seat.ticket && (
                        <>
                            <div style={{ color: THEME.textMuted, fontSize: 13, marginTop: 3 }}>
                                {hoveredSeat.seat.ticket.name}
                            </div>
                            <div style={{ color: THEME.primary, fontWeight: 600, fontSize: 15, marginTop: 3 }}>
                                &#8377;{hoveredSeat.seat.ticket.price}
                            </div>
                            <div style={{
                                fontSize: 13,
                                marginTop: 3,
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
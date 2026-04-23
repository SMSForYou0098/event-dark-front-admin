// AuditoriumLayoutDesigner.jsx - UPDATED WITH TICKET ASSIGNMENT API
import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PlusOutlined, ZoomInOutlined, ZoomOutOutlined, BorderOutlined, SaveOutlined, ArrowLeftOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, message, Row, Tooltip } from 'antd';
import api from 'auth/FetchInterceptor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import LeftBar from './components/creation/LeftBar';
import CenterCanvas from './components/creation/CenterCanvas';
import RightPanel from './components/creation/RightPanel';
import LayoutBookingSummaryCard from './components/creation/report/LayoutBookingSummaryCard';
import Loader from 'utils/Loader';
import Utils from 'utils';
import { VanueList } from 'views/events/event/components/CONSTANTS';
import PermissionChecker from 'layouts/PermissionChecker';
import { PERMISSIONS } from 'constants/PermissionConstant';
import { useMyContext } from 'Context/MyContextProvider';
import { PRIMARY } from 'utils/consts';

// Helper functions to sanitize numeric values from API (strings to numbers)
const sanitizeStageNumbers = (stageData) => ({
  ...stageData,
  x: parseFloat(stageData.x) || 0,
  y: parseFloat(stageData.y) || 0,
  width: parseFloat(stageData.width) || 800,
  height: parseFloat(stageData.height) || 50
});

const sanitizeSeat = (seat) => {
  const ticketId = seat.ticketCategory || seat.ticket?.id || seat.ticketId || null;
  const isBlankSeat = seat.type === 'blank';
  return {
    ...seat,
    number: parseInt(seat.number) || 0,
    x: parseFloat(seat.x) || 0,
    y: parseFloat(seat.y) || 0,
    radius: parseFloat(seat.radius) || 12,
    seatColor: seat.seatColor || seat.color || null,
    ticketCategory: isBlankSeat ? null : (ticketId ? String(ticketId) : null),
    status: isBlankSeat ? 'unavailable' : (seat.status || 'available'),
  };
};

const sanitizeRow = (row) => {
  const ticketId = row.ticketCategory || row.ticket?.id || row.ticketId || null;
  return {
    ...row,
    numberOfSeats: parseInt(row.numberOfSeats) || 0,
    curve: parseFloat(row.curve) || 0,
    spacing: parseFloat(row.spacing) || 40,
    alignment: row.alignment || 'center',
    seatColor: row.seatColor || row.color || null,
    ticketCategory: ticketId ? String(ticketId) : null,
    seats: row.seats?.map(sanitizeSeat) || []
  };
};

const sanitizeSection = (section) => {
  const ticketId = section.ticketCategory || section.ticket?.id || section.ticketId || null;
  return {
    ...section,
    x: parseFloat(section.x) || 0,
    y: parseFloat(section.y) || 0,
    width: parseFloat(section.width) || 600,
    height: parseFloat(section.height) || 250,
    capacity: parseInt(section.capacity) || (section.type === 'Standing' ? 100 : 0),
    seatColor: section.seatColor || section.color || null,
    ticketCategory: ticketId ? String(ticketId) : null,
    rows: section.type === 'Standing' ? [] : (section.rows?.map(sanitizeRow) || [])
  };
};

const THEATRE_LAYOUT_EXPORT_VERSION = 1;

const DEFAULT_STAGE_STATE = {
  position: 'top',
  shape: 'curved',
  width: 800,
  height: 50,
  x: 100,
  y: 50,
  name: 'SCREEN',
  curve: 0.95
};

const safeFilenameFromTitle = (title) => {
  const base = String(title || 'layout').trim().replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_') || 'layout';
  return `${base}.json`;
};

/** Accept our export or a wrapped `{ data: { sections, ... } }` object. */
const pickImportPayload = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (Array.isArray(raw.sections)) return raw;
  if (raw.data && typeof raw.data === 'object' && Array.isArray(raw.data.sections)) return raw.data;
  return null;
};

/** Structure-only: keeps geometry, labels, row/seat icons; removes all ticket assignment data. */
const stripTicketAssignmentsForExport = (sections) => {
  const cloned = JSON.parse(JSON.stringify(sections || []));
  return cloned.map((section) => {
    const s = { ...section, ticketCategory: null };
    delete s.ticket;
    if ('ticketId' in s) s.ticketId = null;
    s.rows = (s.rows || []).map((row) => {
      const r = { ...row, ticketCategory: null, customTicket: false };
      delete r.ticket;
      if ('ticketId' in r) r.ticketId = null;
      r.seats = (r.seats || []).map((seat) => {
        const st = { ...seat, ticketCategory: null, customTicket: false };
        delete st.ticket;
        if ('ticketId' in st) st.ticketId = null;
        return st;
      });
      return r;
    });
    return s;
  });
};

const AuditoriumLayoutDesigner = () => {
  const { id: layoutId, eventId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAssignQuery = searchParams.get('isAssign') === 'true';
  const isReportMode = location.pathname.startsWith('/report/');

  // Determine mode: if eventId exists, we're in ticket assignment mode
  const isAssignMode = !!eventId;

  const navigate = useNavigate();

  const { UserPermissions, userRole } = useMyContext();
  const userRoles = Array.isArray(userRole) ? userRole : userRole ? [userRole] : [];
  const isAdmin = userRoles.map(r => String(r).toLowerCase()).includes('admin');
  const userPermissionsList = Array.isArray(UserPermissions) ? UserPermissions : UserPermissions ? [UserPermissions] : [];
  const hasManageSectionPermission = isAdmin || userPermissionsList.map(p => String(p).toLowerCase()).includes(String(PERMISSIONS.MANAGE_SEATING_LAYOUT_SECTIONS).toLowerCase());

  // State Management
  const [stage, setStage] = useState({
    position: 'top',
    shape: 'curved',
    width: 800,
    height: 50,
    x: 100,
    y: 50,
    name: 'SCREEN',
    curve: 0.95 // Curve depth as percentage (0-1)
  });

  const [sections, setSections] = useState([]);
  const [ticketCategories, setTicketCategories] = useState([]);

  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [nextSectionId, setNextSectionId] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [vanueId, setVanueId] = useState(null);

  const queryClient = useQueryClient();

  // Mutation for saving layout or assignments
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const { isAssignMode, assignPayload, layoutPayload, layoutId } = payload;

      if (isAssignMode) {
        const response = await api.post(`event/layout/${eventId}`, assignPayload);
        return { response, type: 'assignment' };
      } else {
        let response;
        if (layoutId) {
          // Update existing layout
          response = await api.post(`/auditorium/layout/${layoutId}`, layoutPayload);
        } else {
          // Create new layout
          response = await api.post('/auditorium/layout/save', layoutPayload);
        }
        return { response, type: 'layout', isUpdate: !!layoutId };
      }
    },
    onSuccess: (data) => {
      const { response, type, isUpdate } = data;
      if (response.status) {
        message.success(response.message || (type === 'assignment'
          ? 'Tickets assigned successfully!'
          : (isUpdate ? 'Layout updated successfully!' : 'Layout saved successfully!')));

        if (type === 'assignment') {
          queryClient.invalidateQueries(['eventLayout', eventId]);
        } else {
          queryClient.invalidateQueries(['layoutList']);
          if (!isUpdate) {
            navigate(-1);
          }
        }
      } else {
        message.error(Utils.getErrorMessage(response, 'Save failed'));
      }
    },
    onError: (error) => {
      message.error(Utils.getErrorMessage(error, 'Something went wrong during save'));
    }
  });


  // Fetch layout data if editing
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchLayout = async () => {
      if (!layoutId) return;

      setIsLoading(true);

      try {
        const fetchUrl = (isAssignQuery || isReportMode)
          ? `layout/theatre/event/${eventId}`
          : `layout/theatre/template/${layoutId}`;

        const response = await api.get(fetchUrl, {
          signal: abortController.signal
        });

        if (!isMounted) return;

        const layoutData = response?.data?.data || response?.data || response;

        setLayoutName(layoutData.name || '');
        setVanueId(layoutData?.venue_id)
        if (layoutData.stage) {
          setStage(sanitizeStageNumbers(layoutData.stage));
        }

        if (layoutData.sections && Array.isArray(layoutData.sections)) {
          setSections(layoutData.sections.map(sanitizeSection));
          setNextSectionId(layoutData.sections.length + 1);
        }

        // Also set ticket categories if they are present in the layout response
        if (layoutData.ticketCategories) {
          setTicketCategories(layoutData.ticketCategories.map(cat => ({ ...cat, id: String(cat.id) })));
        }

        // message.success('Layout loaded successfully');
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (!isMounted) return;

        console.error('Error fetching layout:', error);
        message.error('Failed to load layout');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLayout();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [layoutId, eventId, isAssignQuery, isReportMode]);

  // Fetch ticket assignments if in assignment mode
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchTicketAssignments = async () => {
      if (!eventId || !layoutId || sections.length === 0) return;

      try {
        const response = await api.get(`event/layout/${eventId}`, {
          signal: abortController.signal
        });

        if (!isMounted) return;

        const assignmentsData = response?.data || response;

        if (assignmentsData && Array.isArray(assignmentsData)) {
          // Map assignments to seats
          setSections(prevSections =>
            prevSections.map(section => ({
              ...section,
              rows: section.rows.map(row => ({
                ...row,
                seats: row.seats.map(seat => {
                  if (seat.type === 'blank') return seat;
                  const assignment = assignmentsData.find(a => String(a.seatId) === String(seat.id));
                  if (assignment?.status === 'available') {
                    return {
                      ...seat,
                      ticketCategory: String(assignment.ticketId),
                      customTicket: true // Mark as custom since it was pre-assigned
                    };
                  }
                  return seat;
                })
              }))
            }))
          );
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (!isMounted) return;
        console.error('Error fetching ticket assignments:', error);
        // Don't show error if assignments don't exist yet
        if (error.response?.status !== 404) {
          message.warning('No previous ticket assignments found');
        }
      }
    };

    fetchTicketAssignments();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [eventId, layoutId, sections.length]); // Only run after sections are loaded

  // Fetch tickets if in assignment mode
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchTickets = async () => {
      if (!eventId) return;

      try {
        const response = await api.get(`event-ticket/${eventId}`, {
          signal: abortController.signal
        });

        if (!isMounted) return;

        const ticketsData = response?.data?.tickets || response?.data || response?.tickets || response;
        if (Array.isArray(ticketsData)) {
          setTicketCategories(ticketsData.map(cat => ({ ...cat, id: String(cat.id) })));
        }
        // message.success(`Loaded ${ticketsData.length} ticket categories`);
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (!isMounted) return;

        console.error('Error fetching tickets:', error);
        message.error('Failed to load tickets');
      }
    };

    fetchTickets();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [eventId]);

  useEffect(() => {
    // IMPORTANT: Wait for ticket categories to load before sanitizing
    // Otherwise, all assigned tickets will be cleared (set to null) because they aren't in the valid set yet
    if (sections.length === 0 || !ticketCategories || ticketCategories.length === 0) return;

    const validTicketIds = new Set(ticketCategories?.map(t => String(t.id)) || []);

    const sanitizedSections = sections.map(section => {
      const sectionTicketId = section.ticketCategory || section.ticket?.id || section.ticketId;

      return {
        ...section,
        capacity: parseInt(section.capacity) || (section.type === 'Standing' ? 100 : 0),
        // Section level ticket (for Standing sections)
        ticketCategory: sectionTicketId && validTicketIds.has(String(sectionTicketId))
          ? String(sectionTicketId)
          : null,
        rows: section.rows?.map(row => {
          const rowTicketId = row.ticketCategory || row.ticket?.id || row.ticketId;

          return {
            ...row,
            // Keep ticket only if it's valid, otherwise set to null
            ticketCategory: rowTicketId && validTicketIds.has(String(rowTicketId))
              ? String(rowTicketId)
              : null,
            seats: row.seats?.map(seat => {
              const seatTicketId = seat.ticketCategory || seat.ticket?.id || seat.ticketId;

              return {
                ...seat,
                ticketCategory: seat.type === 'blank'
                  ? null
                  : (seatTicketId && validTicketIds.has(String(seatTicketId)))
                    ? String(seatTicketId)
                    : null
              };
            }) || []
          };
        }) || []
      };
    });

    // Only update if there are actual changes
    const hasChanges = JSON.stringify(sections) !== JSON.stringify(sanitizedSections);
    if (hasChanges) {
      setSections(sanitizedSections);
    }
  }, [ticketCategories, sections]);

  // Update selectedElement when sections change (to reflect sanitized data)
  useEffect(() => {
    if (!selectedElement || !selectedType) return;

    // Keep selected element in sync with latest sections data
    if (selectedType === 'section') {
      const updatedSection = sections.find(s => s.id === selectedElement.id);
      if (updatedSection && JSON.stringify(updatedSection) !== JSON.stringify(selectedElement)) {
        setSelectedElement(updatedSection);
      }
    } else if (selectedType === 'row') {
      const section = sections.find(s => s.id === selectedElement.sectionId);
      const updatedRow = section?.rows.find(r => r.id === selectedElement.id);
      const nextSelectedRow = updatedRow ? { ...updatedRow, sectionId: section.id } : null;
      if (nextSelectedRow && JSON.stringify(nextSelectedRow) !== JSON.stringify(selectedElement)) {
        setSelectedElement({ ...updatedRow, sectionId: section.id });
      }
    } else if (selectedType === 'seat') {
      const section = sections.find(s => s.id === selectedElement.sectionId);
      const row = section?.rows.find(r => r.id === selectedElement.rowId);
      const updatedSeat = row?.seats.find(s => s.id === selectedElement.id);
      const nextSelectedSeat = updatedSeat ? { ...updatedSeat, sectionId: section.id, rowId: row.id } : null;
      if (nextSelectedSeat && JSON.stringify(nextSelectedSeat) !== JSON.stringify(selectedElement)) {
        setSelectedElement({ ...updatedSeat, sectionId: section.id, rowId: row.id });
      }
    }
  }, [sections, selectedElement, selectedType]); // Sync selection after sections updates only

  useEffect(() => {
    if (selectedSeatIds.length === 0) return;
    const availableSeatIds = new Set(
      sections.flatMap((section) => section.rows?.flatMap((row) => row.seats?.map((seat) => seat.id) || []) || [])
    );
    setSelectedSeatIds((prev) => prev.filter((seatId) => availableSeatIds.has(seatId)));
  }, [sections, selectedSeatIds.length]);

  // Generate unique IDs
  const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const stageRef = useRef();
  const layoutImportInputRef = useRef(null);
  // Generate row title (A, B, C, ..., Z, AA, AB, ...)
  const generateRowTitle = (rowNumber) => {
    let title = '';
    let num = rowNumber;
    while (num > 0) {
      const remainder = (num - 1) % 26;
      title = String.fromCharCode(65 + remainder) + title;
      num = Math.floor((num - 1) / 26);
    }
    return title;
  };



  // Add Section - FIXED: Better positioning
  const addSection = () => {
    if (isReportMode) return;
    // Calculate Y position based on stage position
    const baseY = stage.y + stage.height + 50;
    const sectionY = baseY + (sections.length * 280);

    const newSection = {
      id: generateId('section'),
      name: `Section ${nextSectionId}`,
      type: 'Regular',
      seatColor: PRIMARY,
      x: 100,
      y: sectionY,
      width: 600,
      height: 250,
      rows: [],
      subSections: [],
      ticketCategory: null
    };

    setSections([...sections, newSection]);
    setNextSectionId(nextSectionId + 1);
    setSelectedElement(newSection);
    setSelectedType('section');

    // Auto-scroll to the new section
    setTimeout(() => {
      if (stageRef.current) {
        const stageInstance = stageRef.current;
        const newY = -sectionY * canvasScale + 200;
        stageInstance.position({ x: stagePosition.x, y: newY });
        setStagePosition({ x: stagePosition.x, y: newY });
        stageInstance.batchDraw();
      }
    }, 100);
  };

  // Ensure section frame always encloses visible rows/seats.
  const ensureSectionFitsContent = (section) => {
    if (section.type === 'Standing' || !section.rows?.length) return section;

    let maxSeatBottom = 80; // keeps some room even for small/default sections
    section.rows.forEach((row) => {
      row.seats?.forEach((seat) => {
        const seatBottom = (seat.y || 0) + (seat.radius || 12);
        if (seatBottom > maxSeatBottom) maxSeatBottom = seatBottom;
      });
    });

    const requiredHeight = Math.max(150, maxSeatBottom + 30); // bottom padding
    if (requiredHeight <= section.height) return section;

    return {
      ...section,
      height: requiredHeight
    };
  };

  // Add Row to Section
  const addRowToSection = (sectionId) => {
    if (isReportMode) return;
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        // Don't add rows to standing sections
        if (section.type === 'Standing') return section;
        const rowNumber = section.rows.length + 1;
        const newRow = {
          id: generateId('row'),
          title: generateRowTitle(rowNumber),
          numberOfSeats: 10,
          ticketCategory: null,
          seatColor: section.seatColor || PRIMARY,
          shape: 'straight',
          curve: 0,
          spacing: 40,
          alignment: 'center',
          defaultIcon: null, // NEW: Track row-level default icon
          seats: []
        };

        newRow.seats = generateSeatsForRow(newRow, section, section.rows.length);

        const rowsWithNewRow = [...section.rows, newRow];
        const sectionWithUpdatedRows = { ...section, rows: rowsWithNewRow };
        const normalizedRows = rowsWithNewRow.map((row, idx) => ({
          ...row,
          seats: recalculateSeatPositions(row.seats, sectionWithUpdatedRows, idx, row)
        }));

        const nextSection = {
          ...section,
          rows: normalizedRows
        };
        return ensureSectionFitsContent(nextSection);
      }
      return section;
    }));
  };

  // Generate Seats for Row
  const generateSeatsForRow = (row, section, rowIndex) => {
    const seats = [];
    const leftPadding = 50;
    const rightPadding = 20;
    const totalWidth = section.width - leftPadding - rightPadding;
    const rowSeatCount = Math.max(1, row.numberOfSeats || 1);
    const maxSeatSlotsInSection = Math.max(
      rowSeatCount,
      ...((section.rows || [])
        .filter(r => r.id !== row.id)
        .map(r => Math.max(1, r.seats?.length || r.numberOfSeats || 1)))
    );

    const maxSeatRadius = Math.min(
      (totalWidth / maxSeatSlotsInSection) * 0.4,
      12
    );
    const seatRadius = Math.max(4, maxSeatRadius);

    const seatSpacing = totalWidth / maxSeatSlotsInSection;
    const rowContentWidth = seatSpacing * rowSeatCount;
    const alignment = row.alignment || 'center';
    const contentStartX = leftPadding;
    const startX = alignment === 'start'
      ? contentStartX
      : alignment === 'end'
        ? contentStartX + (totalWidth - rowContentWidth)
        : contentStartX + ((totalWidth - rowContentWidth) / 2);
    const centerX = startX + (rowContentWidth / 2);

    for (let i = 0; i < rowSeatCount; i++) {
      const seatNumber = i + 1;
      let x, y;

      if (row.shape === 'straight') {
        x = startX + (seatSpacing * i) + (seatSpacing / 2);
        y = 50 + (rowIndex * row.spacing);
      } else if (row.shape === 'curved-convex') {
        const angleDenominator = Math.max(rowSeatCount - 1, 1);
        const angle = (i / angleDenominator) * Math.PI - Math.PI / 2;
        const radius = rowContentWidth / 2;
        x = centerX + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) - Math.sin(angle) * (row.curve || 50);
      } else if (row.shape === 'curved-concave') {
        const angleDenominator = Math.max(rowSeatCount - 1, 1);
        const angle = (i / angleDenominator) * Math.PI - Math.PI / 2;
        const radius = rowContentWidth / 2;
        x = centerX + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) + Math.sin(angle) * (row.curve || 50);
      }

      seats.push({
        id: generateId('seat'),
        number: seatNumber,
        label: `${row.title}${seatNumber}`,
        x,
        y,
        type: 'regular', // NEW: Seat type - 'regular' or 'blank'
        ticketCategory: null,
        status: 'available',
        radius: seatRadius,
        icon: row.defaultIcon || null, // NEW: Inherit row's default icon
        customIcon: false, // NEW: Track if seat has custom icon
        customTicket: false, // NEW: Track if seat has custom ticket assignment
        seatColor: row.seatColor || section.seatColor || PRIMARY,
        customSeatColor: false
      });
    }

    return seats;
  };

  // Recalculate seat positions after adding/removing gaps
  const recalculateSeatPositions = (seats, section, rowIndex, row) => {
    const leftPadding = 50;
    const rightPadding = 20;
    const totalWidth = section.width - leftPadding - rightPadding;

    // Calculate spacing including blank seats
    const totalSeats = Math.max(1, seats.length);
    const maxSeatSlotsInSection = Math.max(
      totalSeats,
      ...((section.rows || [])
        .filter(r => r.id !== row.id)
        .map(r => Math.max(1, r.seats?.length || r.numberOfSeats || 1)))
    );
    const seatSpacing = totalWidth / maxSeatSlotsInSection;
    const rowContentWidth = seatSpacing * totalSeats;
    const alignment = row.alignment || 'center';
    const contentStartX = leftPadding;
    const startX = alignment === 'start'
      ? contentStartX
      : alignment === 'end'
        ? contentStartX + (totalWidth - rowContentWidth)
        : contentStartX + ((totalWidth - rowContentWidth) / 2);
    const centerX = startX + (rowContentWidth / 2);

    return seats.map((seat, index) => {
      let x, y;

      if (row.shape === 'straight') {
        x = startX + (seatSpacing * index) + (seatSpacing / 2);
        y = 50 + (rowIndex * row.spacing);
      } else if (row.shape === 'curved-convex') {
        const angleDenominator = Math.max(totalSeats - 1, 1);
        const angle = (index / angleDenominator) * Math.PI - Math.PI / 2;
        const radius = rowContentWidth / 2;
        x = centerX + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) - Math.sin(angle) * (row.curve || 50);
      } else if (row.shape === 'curved-concave') {
        const angleDenominator = Math.max(totalSeats - 1, 1);
        const angle = (index / angleDenominator) * Math.PI - Math.PI / 2;
        const radius = rowContentWidth / 2;
        x = centerX + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) + Math.sin(angle) * (row.curve || 50);
      }

      return {
        ...seat,
        x,
        y
      };
    });
  };

  // Add blank seat after specified seat number
  const addBlankSeatToRow = (sectionId, rowId, afterSeatNumber, applyToAllRows, numberOfGaps = 1) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.map((row, rowIndex) => {
            // Apply to current row or all rows if checkbox is checked
            if (row.id === rowId || applyToAllRows) {
              const newSeats = [...row.seats];

              // Find the index of the seat after which to insert the gap
              const insertIndex = newSeats.findIndex(s => s.number === afterSeatNumber && s.type === 'regular');

              if (insertIndex === -1) {
                console.warn(`Seat number ${afterSeatNumber} not found in row`);
                return row;
              }

              const seatRadius = newSeats[insertIndex]?.radius || 12;

              // Create multiple blank seats
              const blankSeats = [];
              for (let i = 0; i < numberOfGaps; i++) {
                blankSeats.push({
                  id: generateId('seat'),
                  number: afterSeatNumber + 0.1 + (i * 0.1), // Use incremental decimals to maintain order
                  label: '',
                  type: 'blank',
                  x: 0, // Will be recalculated
                  y: 0, // Will be recalculated
                  radius: seatRadius,
                  ticketCategory: null,
                  status: 'unavailable',
                  icon: null,
                  customIcon: false,
                  customTicket: false
                });
              }

              // Insert all blank seats after the specified seat
              newSeats.splice(insertIndex + 1, 0, ...blankSeats);

              // Recalculate positions for all seats
              const updatedSeats = recalculateSeatPositions(newSeats, section, rowIndex, row);

              return {
                ...row,
                seats: updatedSeats
              };
            }
            return row;
          })
        };
      }
      return section;
    }));
  };

  // Remove all gaps from specified row(s)
  const removeAllGapsFromRow = (sectionId, rowId, applyToAllRows) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.map((row, rowIndex) => {
            if (row.id === rowId || applyToAllRows) {
              const regularSeats = row.seats.filter(seat => seat.type !== 'blank');
              return {
                ...row,
                seats: recalculateSeatPositions(regularSeats, section, rowIndex, row)
              };
            }
            return row;
          })
        };
      }
      return section;
    }));
  };

  // Remove a single gap seat from a row
  const removeSingleGapFromRow = (sectionId, rowId, gapSeatId) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.map((row, rowIndex) => {
            if (row.id === rowId) {
              const nextSeats = row.seats.filter(
                seat => !(seat.id === gapSeatId && seat.type === 'blank')
              );
              return {
                ...row,
                seats: recalculateSeatPositions(nextSeats, section, rowIndex, row)
              };
            }
            return row;
          })
        };
      }
      return section;
    }));

    if (selectedType === 'seat' && selectedElement?.id === gapSeatId) {
      setSelectedElement(null);
      setSelectedType(null);
    }
  };

  // Apply row alignment to all rows in a section
  const applyAlignmentToSectionRows = (sectionId, alignment) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;

      const rowsWithAlignment = section.rows.map(row => ({
        ...row,
        alignment
      }));
      const sectionWithUpdatedRows = { ...section, rows: rowsWithAlignment };
      const normalizedRows = rowsWithAlignment.map((row, rowIndex) => ({
        ...row,
        seats: recalculateSeatPositions(row.seats, sectionWithUpdatedRows, rowIndex, row)
      }));

      return {
        ...section,
        rows: normalizedRows
      };
    }));
  };


  // Update Section
  const updateSection = (sectionId, updates) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedSection = { ...section, ...updates };

        // If type changed to Standing, clear rows
        if (updates.type === 'Standing' && section.type !== 'Standing') {
          // Preserve current regular rows so switching back can restore them.
          updatedSection.previousRows = section.rows || [];
          updatedSection.rows = [];
        } else if (updates.type && updates.type !== 'Standing' && section.type === 'Standing') {
          // Restore previously preserved rows when switching back from Standing.
          updatedSection.rows = section.previousRows || [];
          if ('previousRows' in updatedSection) {
            delete updatedSection.previousRows;
          }
        }

        // Regenerate seats if width or height changed significantly
        if ((updates.width && Math.abs(updates.width - section.width) > 10) ||
          (updates.height && Math.abs(updates.height - section.height) > 10)) {
          updatedSection.rows = section.rows.map((row, index) => {
            // Extract gap information: { afterSeatNumber: gapCount }
            const gapInfo = {};

            // Find all gap groups and count consecutive blanks
            for (let idx = 0; idx < row.seats.length; idx++) {
              const seat = row.seats[idx];

              // Start of a gap group (first blank after a regular seat)
              if (seat.type === 'blank' && idx > 0) {
                const prevSeat = row.seats[idx - 1];

                if (prevSeat.type === 'regular') {
                  // Count all consecutive blanks starting from this position
                  let gapCount = 0;
                  let checkIdx = idx;

                  while (checkIdx < row.seats.length && row.seats[checkIdx].type === 'blank') {
                    gapCount++;
                    checkIdx++;
                  }

                  // Store the count for this position
                  gapInfo[prevSeat.number] = gapCount;
                }
              }
            }

            // Generate new seats
            let newSeats = generateSeatsForRow(row, updatedSection, index);

            // Re-insert gaps at the same positions with correct counts
            Object.entries(gapInfo).forEach(([afterSeatNumberStr, gapCount]) => {
              const afterSeatNumber = parseInt(afterSeatNumberStr);
              const insertIndex = newSeats.findIndex(s => s.number === afterSeatNumber && s.type === 'regular');

              if (insertIndex !== -1) {
                const seatRadius = newSeats[insertIndex]?.radius || 12;

                // Create multiple blank seats to match the original gap count
                const blankSeats = [];
                for (let i = 0; i < gapCount; i++) {
                  blankSeats.push({
                    id: generateId('seat'),
                    number: afterSeatNumber + 0.1 + (i * 0.1),
                    label: '',
                    type: 'blank',
                    x: 0,
                    y: 0,
                    radius: seatRadius,
                    ticketCategory: null,
                    status: 'unavailable',
                    icon: null,
                    customIcon: false,
                    customTicket: false
                  });
                }

                // Insert all blank seats after the specified seat
                newSeats.splice(insertIndex + 1, 0, ...blankSeats);
              }
            });

            // Recalculate positions
            newSeats = recalculateSeatPositions(newSeats, updatedSection, index, row);

            return {
              ...row,
              seats: newSeats
            };
          });
        }

        return updatedSection;
      }
      return section;
    }));
  };

  // Update Row
  const updateRow = (sectionId, rowId, updates) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedRows = section.rows.map((row, index) => {
          if (row.id === rowId) {
            let normalizedUpdates = { ...updates };

            if (updates.numberOfSeats !== undefined && updates.numberOfSeats !== null) {
              const regularSeats = row.seats.filter(seat => seat.type !== 'blank');
              const lockedSeatsCount = regularSeats.filter(seat => seat.status !== 'available').length;
              const minAllowedSeats = Math.max(1, lockedSeatsCount);
              const requestedSeats = parseInt(updates.numberOfSeats, 10);

              if (!Number.isNaN(requestedSeats) && requestedSeats < minAllowedSeats) {
                normalizedUpdates.numberOfSeats = minAllowedSeats;
                message.warning(`You can reduce seats only up to available seats. Minimum allowed is ${minAllowedSeats}.`);
              }
            }

            const updatedRow = { ...row, ...normalizedUpdates };
            const hasTitleChanged =
              normalizedUpdates.title !== undefined && normalizedUpdates.title !== row.title;

            if (hasTitleChanged) {
              updatedRow.seats = row.seats.map((seat) => {
                if (seat.type === 'blank') return seat;

                const oldDefaultLabel = `${row.title}${seat.number}`;
                const seatLabel = seat.label ?? '';
                const shouldAutoRename = seatLabel === '' || seatLabel === oldDefaultLabel;

                if (!shouldAutoRename) return seat;

                return {
                  ...seat,
                  label: `${normalizedUpdates.title}${seat.number}`
                };
              });
            }

            const needsSeatRegeneration =
              normalizedUpdates.numberOfSeats !== undefined || normalizedUpdates.shape !== undefined;

            if (needsSeatRegeneration) {
              const gapInfo = {};

              for (let idx = 0; idx < row.seats.length; idx++) {
                const seat = row.seats[idx];

                if (seat.type === 'blank' && idx > 0) {
                  const prevSeat = row.seats[idx - 1];

                  if (prevSeat.type === 'regular') {
                    let gapCount = 0;
                    let checkIdx = idx;

                    while (checkIdx < row.seats.length && row.seats[checkIdx].type === 'blank') {
                      gapCount++;
                      checkIdx++;
                    }

                    gapInfo[prevSeat.number] = gapCount;
                  }
                }
              }

              let newSeats = generateSeatsForRow(updatedRow, section, index);

              Object.entries(gapInfo).forEach(([afterSeatNumberStr, gapCount]) => {
                const afterSeatNumber = parseInt(afterSeatNumberStr, 10);
                const insertIndex = newSeats.findIndex(
                  s => s.number === afterSeatNumber && s.type === 'regular'
                );

                if (insertIndex !== -1) {
                  const seatRadius = newSeats[insertIndex]?.radius || 12;
                  const blankSeats = [];
                  for (let i = 0; i < gapCount; i++) {
                    blankSeats.push({
                      id: generateId('seat'),
                      number: afterSeatNumber + 0.1 + (i * 0.1),
                      label: '',
                      type: 'blank',
                      x: 0,
                      y: 0,
                      radius: seatRadius,
                      ticketCategory: null,
                      status: 'unavailable',
                      icon: null,
                      customIcon: false,
                      customTicket: false
                    });
                  }
                  newSeats.splice(insertIndex + 1, 0, ...blankSeats);
                }
              });

              updatedRow.seats = newSeats;
            } else if (updates.spacing !== undefined || updates.curve !== undefined) {
              updatedRow.seats = recalculateSeatPositions(
                row.seats,
                section,
                index,
                updatedRow
              );
            }

            return updatedRow;
          }
          return row;
        });

        const sectionWithUpdatedRows = { ...section, rows: updatedRows };
        const normalizedRows = updatedRows.map((row, index) => ({
          ...row,
          seats: recalculateSeatPositions(row.seats, sectionWithUpdatedRows, index, row)
        }));

        const nextSection = {
          ...section,
          rows: normalizedRows
        };
        return ensureSectionFitsContent(nextSection);
      }
      return section;
    }));
  };

  // Update Seat
  const updateSeat = (sectionId, rowId, seatId, updates) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.map(row => {
            if (row.id === rowId) {
              return {
                ...row,
                seats: row.seats.map(seat =>
                  seat.id === seatId ? { ...seat, ...updates } : seat
                )
              };
            }
            return row;
          })
        };
      }
      return section;
    }));
  };

  const updateMultipleSeats = (seatIds, updates) => {
    if (!seatIds?.length) return;
    const seatIdSet = new Set(seatIds);
    setSections((prevSections) => prevSections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        seats: row.seats.map((seat) => (
          seatIdSet.has(seat.id) ? { ...seat, ...updates } : seat
        ))
      }))
    })));
  };

  // Delete Section
  const deleteSection = (sectionId) => {
    setSections(sections.filter(s => s.id !== sectionId));
    setSelectedElement(null);
    setSelectedType(null);
    setSelectedSeatIds([]);
  };

  // Duplicate Row (inserts copy directly below the source row)
  const duplicateRow = (sectionId, rowId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || section.type === 'Standing') return;

    const rowIndex = section.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;

    const sourceRow = section.rows[rowIndex];
    const newTitle = `${sourceRow.title}(C)`;

    const duplicatedRow = {
      ...sourceRow,
      id: generateId('row'),
      title: newTitle,
      seats: sourceRow.seats.map(seat => {
        const nextSeat = { ...seat, id: generateId('seat') };
        if (seat.type === 'blank') return nextSeat;

        const oldDefaultLabel = `${sourceRow.title}${seat.number}`;
        const seatLabel = seat.label ?? '';
        const shouldAutoRename = seatLabel === '' || seatLabel === oldDefaultLabel;
        if (shouldAutoRename) {
          nextSeat.label = `${newTitle}${seat.number}`;
        }
        return nextSeat;
      })
    };

    const newRows = [
      ...section.rows.slice(0, rowIndex + 1),
      duplicatedRow,
      ...section.rows.slice(rowIndex + 1)
    ];
    const sectionWithNewRows = { ...section, rows: newRows };
    const normalizedRows = newRows.map((row, index) => ({
      ...row,
      seats: recalculateSeatPositions(row.seats, sectionWithNewRows, index, row)
    }));
    const newDuplicateRow = normalizedRows[rowIndex + 1];

    setSections(sections.map(s =>
      s.id === sectionId
        ? ensureSectionFitsContent({ ...s, rows: normalizedRows })
        : s
    ));

    setSelectedElement({ ...newDuplicateRow, sectionId });
    setSelectedType('row');
  };

  // Duplicate Section
  const duplicateSection = (sectionId) => {
    const sectionToDuplicate = sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;

    const duplicatedSection = {
      ...sectionToDuplicate,
      id: generateId('section'),
      name: `${sectionToDuplicate.name} (Copy)`,
      x: sectionToDuplicate.x + 50,
      y: sectionToDuplicate.y + 50,
      rows: sectionToDuplicate.rows.map(row => ({
        ...row,
        id: generateId('row'),
        seats: row.seats.map(seat => ({
          ...seat,
          id: generateId('seat')
        }))
      }))
    };

    setSections([...sections, duplicatedSection]);
    setNextSectionId(nextSectionId + 1);
    setSelectedElement(duplicatedSection);
    setSelectedType('section');

    setTimeout(() => {
      if (stageRef.current) {
        const stageInstance = stageRef.current;
        const newY = -duplicatedSection.y * canvasScale + 200;
        stageInstance.position({ x: stagePosition.x, y: newY });
        setStagePosition({ x: stagePosition.x, y: newY });
        stageInstance.batchDraw();
      }
    }, 100);
  };

  // Delete Row
  const deleteRow = (sectionId, rowId) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        // Filter out the deleted row
        const filteredRows = section.rows.filter(r => r.id !== rowId);

        // Recalculate seat positions for all remaining rows with new indices
        const updatedRows = filteredRows.map((row, newIndex) => {
          // Preserve gap information before regenerating seats
          const gapInfo = {};

          // Extract gap positions from current seats
          for (let idx = 0; idx < row.seats.length; idx++) {
            const seat = row.seats[idx];
            if (seat.type === 'blank' && idx > 0) {
              const prevSeat = row.seats[idx - 1];
              if (prevSeat.type === 'regular') {
                let gapCount = 0;
                let checkIdx = idx;
                while (checkIdx < row.seats.length && row.seats[checkIdx].type === 'blank') {
                  gapCount++;
                  checkIdx++;
                }
                gapInfo[prevSeat.number] = gapCount;
              }
            }
          }

          // Generate new seats with updated row index
          let newSeats = generateSeatsForRow(row, section, newIndex);

          // Re-insert gaps at the same positions
          Object.entries(gapInfo).forEach(([afterSeatNumberStr, gapCount]) => {
            const afterSeatNumber = parseInt(afterSeatNumberStr);
            const insertIndex = newSeats.findIndex(s => s.number === afterSeatNumber && s.type === 'regular');

            if (insertIndex !== -1) {
              const seatRadius = newSeats[insertIndex]?.radius || 12;
              const blankSeats = [];
              for (let i = 0; i < gapCount; i++) {
                blankSeats.push({
                  id: generateId('seat'),
                  number: afterSeatNumber + 0.1 + (i * 0.1),
                  label: '',
                  type: 'blank',
                  x: 0,
                  y: 0,
                  radius: seatRadius,
                  ticketCategory: null,
                  status: 'unavailable',
                  icon: null,
                  customIcon: false,
                  customTicket: false
                });
              }
              newSeats.splice(insertIndex + 1, 0, ...blankSeats);
            }
          });

          // Recalculate positions with new row index
          newSeats = recalculateSeatPositions(newSeats, section, newIndex, row);

          return {
            ...row,
            seats: newSeats
          };
        });

        return {
          ...section,
          rows: updatedRows
        };
      }
      return section;
    }));
  };

  // Move Row in Section
  const moveRow = (sectionId, sourceRowId, targetRowId) => {
    setSections((prevSections) => prevSections.map(section => {
      if (section.id !== sectionId) {
        return section;
      }

      const sourceIndex = section.rows.findIndex((row) => row.id === sourceRowId);
      const targetIndex = section.rows.findIndex((row) => row.id === targetRowId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return section;
      }

      const reorderedRows = [...section.rows];
      const [movedRow] = reorderedRows.splice(sourceIndex, 1);
      reorderedRows.splice(targetIndex, 0, movedRow);

      const sectionWithReorderedRows = { ...section, rows: reorderedRows };
      const updatedRows = reorderedRows.map((row, index) => ({
        ...row,
        seats: recalculateSeatPositions(row.seats, sectionWithReorderedRows, index, row)
      }));

      return ensureSectionFitsContent({
        ...section,
        rows: updatedRows
      });
    }));

    if (selectedType === 'row' && selectedElement?.sectionId === sectionId && selectedElement?.id === sourceRowId) {
      setSelectedElement({ ...selectedElement, sectionId });
    }
  };

  // NEW: Function to extract ticket assignments from sections (including status)
  const extractTicketAssignments = () => {
    const assignments = [];

    sections.forEach(section => {
      // Handle standing sections — tickets only, no seats
      if (section.type === 'Standing') {
        if (section.ticketCategory) {
          assignments.push({
            sectionId: section.id,
            ticketId: section.ticketCategory,
            type: 'standing',
            capacity: section.capacity || 0,
            status: 'available'
          });
        }
        return;
      }

      section.rows.forEach(row => {
        row.seats.forEach(seat => {
          // Never send visual gap placeholders as ticket assignments
          if (seat.type !== 'blank' && seat.ticketCategory) {
            assignments.push({
              seatId: seat.id,
              sectionId: section.id,
              ticketId: seat.ticketCategory,
              status: seat.status || 'available' // Include seat status
            });
          }
        });
      });
    });

    return assignments;
  };

  const exportLayoutJson = () => {
    const payload = {
      theatreLayoutExportVersion: THEATRE_LAYOUT_EXPORT_VERSION,
      stage: JSON.parse(JSON.stringify(stage)),
      sections: stripTicketAssignmentsForExport(sections)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilenameFromTitle(layoutName);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success('Layout exported');
  };

  const applyImportedLayout = (parsed) => {
    const picked = pickImportPayload(parsed);
    if (!picked) {
      message.error('Invalid layout file: expected an object with a sections array');
      return;
    }
    const nextStage = picked.stage ? sanitizeStageNumbers(picked.stage) : { ...DEFAULT_STAGE_STATE };
    const nextSections = stripTicketAssignmentsForExport(picked.sections || []).map(sanitizeSection);
    setStage(nextStage);
    setSections(nextSections);
    setTicketCategories([]);
    setNextSectionId(Math.max(1, nextSections.length + 1));
    setSelectedElement(null);
    setSelectedType(null);
    setSelectedSectionIds([]);
    message.success('Layout imported (structure only, no ticket assignments). Set layout name and venue, then save.');
  };

  const onLayoutImportFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ''));
        applyImportedLayout(data);
      } catch {
        message.error('Could not read layout file (invalid JSON)');
      }
    };
    reader.onerror = () => message.error('Failed to read file');
    reader.readAsText(file);
  };

  const buildSectionsPayloadForSave = (sourceSections) => {
    return (sourceSections || []).map((section) => ({
      ...section,
      ticketId: section.ticketCategory || null,
      color: section.seatColor || section.color || PRIMARY,
      rows: (section.rows || []).map((row) => ({
        ...row,
        ticketId: row.ticketCategory || null,
        color: row.seatColor || row.color || section.seatColor || PRIMARY,
        seats: (row.seats || []).map((seat) => ({
          ...seat,
          ticketId: seat.ticketCategory || null,
          color: seat.seatColor || seat.color || row.seatColor || section.seatColor || PRIMARY
        }))
      }))
    }));
  };

  // Save Layout to Backend (UPDATED WITH ASSIGNMENT MODE)
  const saveLayout = () => {
    if (isReportMode) return;
    if (isAssignMode) {
      // ASSIGNMENT MODE: Save ticket assignments
      const ticketAssignments = extractTicketAssignments();
      const sectionsForAssign = sections.map(section => ({
        ...section,
        rows: section.rows?.map(row => ({
          ...row,
          seats: row.seats?.map(seat =>
            seat.type === 'blank'
              ? {
                ...seat,
                ticketCategory: null,
                customTicket: false
              }
              : seat
          ) || []
        })) || []
      }));
      const sectionsPayload = buildSectionsPayloadForSave(sectionsForAssign);

      // const assignPayload = {
      //   layoutId: layoutId,
      //   eventId: eventId,
      //   ticketAssignments: ticketAssignments
      // };

      const assignPayload = {
        layoutId: layoutId,
        eventId: eventId,
        ticketAssignments: ticketAssignments,
        name: layoutName || `Layout ${new Date().toISOString()}`,
        stage,
        venue_id: vanueId,
        sections: sectionsPayload,
        ticketCategories,
        metadata: {
          updatedAt: new Date().toISOString(),
          totalSections: sections.length,
          totalSeats: sections.reduce((total, section) =>
            total + (section.type === 'Standing'
              ? 1 // Represent standing as 1 unit in total count if quantity is handled by ticket
              : section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0))
            , 0),
          totalRows: sections.reduce((total, section) => total + (section.type === 'Standing' ? 0 : section.rows.length), 0),
          totalStandingTickets: 0 // No longer tracked at layout level
        }
      };

      saveMutation.mutate({ isAssignMode: true, assignPayload });
    } else {
      if (!vanueId || String(vanueId).trim() === '') {
        message.error("Please Select Venue for the layout");
        return;
      }
      if (!layoutName || String(layoutName).trim() === '') {
        message.error("Please Enter Layout Name");
        return;
      }

      // LAYOUT CREATION/EDIT MODE: Save layout structure
      const sectionsPayload = buildSectionsPayloadForSave(sections);
      const layoutPayload = {
        name: layoutName || `Layout ${new Date().toISOString()}`,
        stage,
        venue_id: vanueId,
        sections: sectionsPayload,
        ticketCategories,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalSections: sections.length,
          totalSeats: sections.reduce((total, section) =>
            total + (section.type === 'Standing'
              ? 1 // Represent standing as 1 unit in total count if quantity is handled by ticket
              : section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0))
            , 0),
          totalRows: sections.reduce((total, section) => total + (section.type === 'Standing' ? 0 : section.rows.length), 0),
          totalStandingTickets: 0 // No longer tracked at layout level
        }
      };

      saveMutation.mutate({ isAssignMode: false, layoutPayload, layoutId });
    }
  };

  // Handle Canvas Click
  const handleCanvasClick = (e) => {
    if (isReportMode) return;
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElement(null);
      setSelectedType(null);
      setSelectedSectionIds([]);
      setSelectedSeatIds([]);
    }
  };

  // Handle Zoom
  const handleZoom = (zoomIn) => {
    const scaleBy = 1.1;
    const newScale = zoomIn ? canvasScale * scaleBy : canvasScale / scaleBy;
    setCanvasScale(Math.max(0.5, Math.min(newScale, 3)));
  };

  // Handle Wheel Zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stageInst = e.target.getStage();
    const oldScale = stageInst.scaleX();
    const pointer = stageInst.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stageInst.x()) / oldScale,
      y: (pointer.y - stageInst.y()) / oldScale
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.5, Math.min(newScale, 3));

    setCanvasScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    stageInst.position(newPos);
    setStagePosition(newPos);
    stageInst.batchDraw();
  };

  if (isLoading) {
    return (
      <Card>
        <Loader />
      </Card>
    );
  }
  const onVanueChange = (data) => {
    setVanueId(data)
  }

  return (
    <Card className="auditorium-designer"
      bodyStyle={{ paddingTop: 10 }}
    // title={isReportMode
    //   ? `Layout Report: ${layoutName}`
    //   : isAssignMode
    //     ? `Assign Tickets: ${layoutName}`
    //     : layoutId
    //       ? `Edit Layout: ${layoutName}`
    //       : "New Auditorium Layout"}
    >

      {isReportMode ? (
        <Row align="middle" gutter={10} wrap={false} className='mb-4'>
          <Col>
            <Tooltip title="Zoom in">
              <Button icon={<ZoomInOutlined />} onClick={() => handleZoom(true)} />
            </Tooltip>
          </Col>
          <Col>
            <Tooltip title="Zoom out">
              <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom(false)} />
            </Tooltip>
          </Col>
          <Col>
            <Tooltip title="Back">
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              />
            </Tooltip>
          </Col>
        </Row>
      ) : (
        <Row align="middle" justify="center" gutter={10} wrap={false} className='mb-4'>
          <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Back">
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              />
            </Tooltip>
          </Col>
          <Col span={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* add field to write name for layout */}
            <Input
              placeholder="Layout Name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
            />
          </Col>
          <VanueList
            hideLable={true}
            noMargin={true}
            onChange={onVanueChange}
            value={vanueId}
            span={4}
            showDetail={false}
          />
          <PermissionChecker permission={PERMISSIONS.UPDATE_SEATING_LAYOUT_SECTIONS}>
            <Col span={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addSection}
              // disabled={isAssignMode} // Removed restriction
              >
                Section
              </Button>
            </Col>

          </PermissionChecker>
          <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Show/hide grid">
              <Button
                icon={<BorderOutlined />}
                onClick={() => setShowGrid(!showGrid)}
              />
            </Tooltip>
          </Col>

          <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Zoom in">
              <Button icon={<ZoomInOutlined />} onClick={() => handleZoom(true)} />
            </Tooltip>
          </Col>
          <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Zoom out">
              <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom(false)} />
            </Tooltip>
          </Col>
          <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Export layout JSON: geometry, icons, labels only — no ticket categories or seat assignments">
              <Button icon={<DownloadOutlined />} onClick={exportLayoutJson} />
            </Tooltip>
          </Col>
          <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <input
              ref={layoutImportInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={onLayoutImportFileChange}
            />
            <Tooltip title="Import layout from JSON">
              <Button
                icon={<UploadOutlined />}
                onClick={() => layoutImportInputRef.current?.click()}
              />
            </Tooltip>
          </Col>
          <Col span={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              onClick={saveLayout}
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
            >
              {isAssignMode ? "Save" : layoutId ? "Update" : "Save"}
            </Button>
          </Col>


        </Row>
      )}
      <Row>
        {isReportMode ? (
          <Col lg={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <LayoutBookingSummaryCard eventKey={eventId} />
            </div>
          </Col>
        ) : (
          <PermissionChecker permission={PERMISSIONS.MANAGE_SEATING_LAYOUT_SECTIONS}>
            <Col lg={4}>
              {/* Left Panel */}
              <LeftBar
                sections={sections}
                selectedType={selectedType}
                setSelectedElement={setSelectedElement}
                stage={stage}
                setSelectedType={setSelectedType}
                duplicateSection={duplicateSection}
                duplicateRow={duplicateRow}
                deleteSection={deleteSection}
                selectedElement={selectedElement}
                deleteRow={deleteRow}
                addRowToSection={addRowToSection}
                moveRow={moveRow}
                isAssignMode={isAssignMode}
                setSelectedSeatIds={setSelectedSeatIds}
              />
            </Col>
          </PermissionChecker>
        )}
        {/* Center Canvas */}
        <Col lg={isReportMode ? 16 : hasManageSectionPermission ? 16 : 20}>
          <CenterCanvas
            stageRef={stageRef}
            canvasScale={canvasScale}
            showGrid={showGrid}
            stage={stage}
            setStage={setStage}
            sections={sections}
            setSections={setSections}
            updateSection={updateSection}
            selectedType={selectedType}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            setSelectedType={setSelectedType}
            handleCanvasClick={handleCanvasClick}
            handleWheel={handleWheel}
            setStagePosition={setStagePosition}
            isAssignMode={isAssignMode}
            isReportMode={isReportMode}
            selectedSectionIds={selectedSectionIds}
            setSelectedSectionIds={setSelectedSectionIds}
            selectedSeatIds={selectedSeatIds}
            setSelectedSeatIds={setSelectedSeatIds}
          />
        </Col>
        {!isReportMode && (
          <Col lg={4}>
            <RightPanel
              selectedType={selectedType}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              updateSection={updateSection}
              setSections={setSections}
              sections={sections}
              stage={stage}
              setStage={setStage}
              updateRow={updateRow}
              updateSeat={updateSeat}
              addRowToSection={addRowToSection}
              ticketCategories={ticketCategories}
              isAssignMode={isAssignMode}
              addBlankSeatToRow={addBlankSeatToRow}
              removeAllGapsFromRow={removeAllGapsFromRow}
              removeSingleGapFromRow={removeSingleGapFromRow}
              applyAlignmentToSectionRows={applyAlignmentToSectionRows}
              selectedSeatIds={selectedSeatIds}
              updateMultipleSeats={updateMultipleSeats}
            />
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default AuditoriumLayoutDesigner;
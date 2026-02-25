// AuditoriumLayoutDesigner.jsx - UPDATED WITH TICKET ASSIGNMENT API
import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusOutlined, ZoomInOutlined, ZoomOutOutlined, BorderOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, message, Row, Tooltip } from 'antd';
import api from 'auth/FetchInterceptor';
import LeftBar from './components/creation/LeftBar';
import CenterCanvas from './components/creation/CenterCanvas';
import RightPanel from './components/creation/RightPanel';
import Loader from 'utils/Loader';
import { VanueList } from 'views/events/event/components/CONSTANTS';

// Helper functions to sanitize numeric values from API (strings to numbers)
const sanitizeStageNumbers = (stageData) => ({
  ...stageData,
  x: parseFloat(stageData.x) || 0,
  y: parseFloat(stageData.y) || 0,
  width: parseFloat(stageData.width) || 800,
  height: parseFloat(stageData.height) || 50
});

const sanitizeSeat = (seat) => ({
  ...seat,
  number: parseInt(seat.number) || 0,
  x: parseFloat(seat.x) || 0,
  y: parseFloat(seat.y) || 0,
  radius: parseFloat(seat.radius) || 12
});

const sanitizeRow = (row) => ({
  ...row,
  numberOfSeats: parseInt(row.numberOfSeats) || 0,
  curve: parseFloat(row.curve) || 0,
  spacing: parseFloat(row.spacing) || 40,
  seats: row.seats?.map(sanitizeSeat) || []
});

const sanitizeSection = (section) => ({
  ...section,
  x: parseFloat(section.x) || 0,
  y: parseFloat(section.y) || 0,
  width: parseFloat(section.width) || 600,
  height: parseFloat(section.height) || 250,
  rows: section.rows?.map(sanitizeRow) || []
});

const AuditoriumLayoutDesigner = () => {
  const { id: layoutId, eventId } = useParams();

  // Determine mode: if eventId exists, we're in ticket assignment mode
  const isAssignMode = !!eventId;

  const navigate = useNavigate();

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
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [nextSectionId, setNextSectionId] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [vanueId, setVanueId] = useState(null);


  // Fetch layout data if editing
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchLayout = async () => {
      if (!layoutId) return;

      setIsLoading(true);

      try {
        const response = await api.get(`layout/theatre/${layoutId}`, {
          signal: abortController.signal
        });

        if (!isMounted) return;

        const layoutData = response?.data || response;

        setLayoutName(layoutData.name || '');
        setVanueId(layoutData?.venue_id)
        if (layoutData.stage) {
          setStage(sanitizeStageNumbers(layoutData.stage));
        }

        if (layoutData.sections && Array.isArray(layoutData.sections)) {
          setSections(layoutData.sections.map(sanitizeSection));
          setNextSectionId(layoutData.sections.length + 1);
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
  }, [layoutId]);

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
                  const assignment = assignmentsData.find(a => a.seatId === seat.id);
                  if (assignment) {
                    return {
                      ...seat,
                      ticketCategory: assignment.ticketId,
                      status: assignment.status || seat.status,
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

        const ticketsData = response?.tickets || response;
        setTicketCategories(ticketsData);
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

  // Sanitize sections when ticketCategories change (removes invalid ticket IDs)
  useEffect(() => {
    if (sections.length === 0) return;

    const validTicketIds = new Set(ticketCategories?.map(t => t.id) || []);

    const sanitizedSections = sections.map(section => ({
      ...section,
      rows: section.rows?.map(row => ({
        ...row,
        // Keep ticket only if it's valid, otherwise set to null
        ticketCategory: row.ticketCategory && validTicketIds.has(row.ticketCategory)
          ? row.ticketCategory
          : null,
        seats: row.seats?.map(seat => ({
          ...seat,
          ticketCategory: seat.ticketCategory && validTicketIds.has(seat.ticketCategory)
            ? seat.ticketCategory
            : null
        })) || []
      })) || []
    }));

    // Only update if there are actual changes
    const hasChanges = JSON.stringify(sections) !== JSON.stringify(sanitizedSections);
    if (hasChanges) {
      setSections(sanitizedSections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketCategories]); // Run when ticket categories change (intentionally not including 'sections' to avoid infinite loop)

  // Update selectedElement when sections change (to reflect sanitized data)
  useEffect(() => {
    if (!selectedElement || !selectedType) return;

    // Find the updated element in the sanitized sections
    if (selectedType === 'section') {
      const updatedSection = sections.find(s => s.id === selectedElement.id);
      if (updatedSection) {
        // Only update if ticket category was sanitized (changed from invalid to null)
        if (selectedElement.ticketCategory && !updatedSection.ticketCategory) {
          setSelectedElement(updatedSection);
        }
      }
    } else if (selectedType === 'row') {
      const section = sections.find(s => s.id === selectedElement.sectionId);
      const updatedRow = section?.rows.find(r => r.id === selectedElement.id);
      if (updatedRow) {
        // Only update if ticket category was sanitized (changed from invalid to null)
        const oldTicket = selectedElement.ticketCategory;
        const newTicket = updatedRow.ticketCategory;

        // Update only if sanitization occurred (had invalid ticket, now null)
        if (oldTicket && oldTicket !== newTicket && newTicket === null) {
          setSelectedElement({ ...updatedRow, sectionId: section.id });
        }
      }
    } else if (selectedType === 'seat') {
      const section = sections.find(s => s.id === selectedElement.sectionId);
      const row = section?.rows.find(r => r.id === selectedElement.rowId);
      const updatedSeat = row?.seats.find(s => s.id === selectedElement.id);
      if (updatedSeat) {
        // Only update if ticket category was sanitized (changed from invalid to null)
        const oldTicket = selectedElement.ticketCategory;
        const newTicket = updatedSeat.ticketCategory;

        // Update only if sanitization occurred (had invalid ticket, now null)
        if (oldTicket && oldTicket !== newTicket && newTicket === null) {
          setSelectedElement({ ...updatedSeat, sectionId: section.id, rowId: row.id });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]); // Run when sections change (to update selectedElement with sanitized data)

  // Generate unique IDs
  const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const stageRef = useRef();
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
    // Calculate Y position based on stage position
    const baseY = stage.y + stage.height + 50;
    const sectionY = baseY + (sections.length * 280);

    const newSection = {
      id: generateId('section'),
      name: `Section ${nextSectionId}`,
      type: 'Regular',
      x: 100,
      y: sectionY,
      width: 600,
      height: 250,
      rows: [],
      subSections: []
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

  // Add Row to Section
  const addRowToSection = (sectionId) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const rowNumber = section.rows.length + 1;
        const newRow = {
          id: generateId('row'),
          title: generateRowTitle(rowNumber),
          numberOfSeats: 10,
          ticketCategory: ticketCategories?.length > 0 ? ticketCategories[0].id : null,
          shape: 'straight',
          curve: 0,
          spacing: 40,
          defaultIcon: null, // NEW: Track row-level default icon
          seats: []
        };

        newRow.seats = generateSeatsForRow(newRow, section, section.rows.length);

        return {
          ...section,
          rows: [...section.rows, newRow]
        };
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

    const maxSeatRadius = Math.min(
      (totalWidth / row.numberOfSeats) * 0.4,
      12
    );
    const seatRadius = Math.max(4, maxSeatRadius);

    const seatSpacing = totalWidth / row.numberOfSeats;

    for (let i = 0; i < row.numberOfSeats; i++) {
      const seatNumber = i + 1;
      let x, y;

      if (row.shape === 'straight') {
        x = leftPadding + (seatSpacing * i) + (seatSpacing / 2);
        y = 50 + (rowIndex * row.spacing);
      } else if (row.shape === 'curved-convex') {
        const angle = (i / (row.numberOfSeats - 1)) * Math.PI - Math.PI / 2;
        const radius = totalWidth / 2;
        x = section.width / 2 + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) - Math.sin(angle) * (row.curve || 50);
      } else if (row.shape === 'curved-concave') {
        const angle = (i / (row.numberOfSeats - 1)) * Math.PI - Math.PI / 2;
        const radius = totalWidth / 2;
        x = section.width / 2 + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) + Math.sin(angle) * (row.curve || 50);
      }

      seats.push({
        id: generateId('seat'),
        number: seatNumber,
        label: `${row.title}${seatNumber}`,
        x,
        y,
        type: 'regular', // NEW: Seat type - 'regular' or 'blank'
        ticketCategory: row.ticketCategory,
        status: 'available',
        radius: seatRadius,
        icon: row.defaultIcon || null, // NEW: Inherit row's default icon
        customIcon: false, // NEW: Track if seat has custom icon
        customTicket: false // NEW: Track if seat has custom ticket assignment
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
    const totalSeats = seats.length;
    const seatSpacing = totalWidth / totalSeats;

    return seats.map((seat, index) => {
      let x, y;

      if (row.shape === 'straight') {
        x = leftPadding + (seatSpacing * index) + (seatSpacing / 2);
        y = 50 + (rowIndex * row.spacing);
      } else if (row.shape === 'curved-convex') {
        const angle = (index / (totalSeats - 1)) * Math.PI - Math.PI / 2;
        const radius = totalWidth / 2;
        x = section.width / 2 + Math.cos(angle) * radius;
        y = 50 + (rowIndex * row.spacing) - Math.sin(angle) * (row.curve || 50);
      } else if (row.shape === 'curved-concave') {
        const angle = (index / (totalSeats - 1)) * Math.PI - Math.PI / 2;
        const radius = totalWidth / 2;
        x = section.width / 2 + Math.cos(angle) * radius;
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

  // Get gap pattern from a row (for applying to other rows)
  const getGapPattern = (row) => {
    const gaps = [];
    row.seats.forEach((seat, index) => {
      if (seat.type === 'blank' && index > 0) {
        const previousSeat = row.seats[index - 1];
        if (previousSeat.type !== 'blank') {
          gaps.push(previousSeat.number);
        }
      }
    });
    return gaps;
  };

  // Update Section
  const updateSection = (sectionId, updates) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedSection = { ...section, ...updates };

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
        return {
          ...section,
          rows: section.rows.map((row, index) => {
            if (row.id === rowId) {
              const updatedRow = { ...row, ...updates };
              if (updates.numberOfSeats || updates.shape || updates.spacing || updates.curve) {
                updatedRow.seats = generateSeatsForRow(updatedRow, section, index);
              }
              return updatedRow;
            }
            return row;
          })
        };
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

  // Delete Section
  const deleteSection = (sectionId) => {
    setSections(sections.filter(s => s.id !== sectionId));
    setSelectedElement(null);
    setSelectedType(null);
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

  // NEW: Function to extract ticket assignments from sections (including status)
  const extractTicketAssignments = () => {
    const assignments = [];

    sections.forEach(section => {
      section.rows.forEach(row => {
        row.seats.forEach(seat => {
          if (seat.ticketCategory) {
            assignments.push({
              seatId: seat.id,
              ticketId: seat.ticketCategory,
              status: seat.status || 'available' // Include seat status
            });
          }
        });
      });
    });

    return assignments;
  };

  // Save Layout to Backend (UPDATED WITH ASSIGNMENT MODE)
  const saveLayout = async () => {
    setIsSaving(true);

    try {
      if (isAssignMode) {
        // ASSIGNMENT MODE: Save ticket assignments
        const ticketAssignments = extractTicketAssignments();

        const assignPayload = {
          layoutId: layoutId,
          eventId: eventId,
          ticketAssignments: ticketAssignments
        };

        const response = await api.post(`event/layout/${eventId}`, assignPayload);

        message.success(`Successfully assigned tickets to ${ticketAssignments.length} seats!`);
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
        const payload = {
          name: layoutName || `Layout ${new Date().toISOString()}`,
          stage,
          venue_id: vanueId,
          sections,
          ticketCategories,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalSections: sections.length,
            totalSeats: sections.reduce((total, section) =>
              total + section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0)
              , 0),
            totalRows: sections.reduce((total, section) => total + section.rows.length, 0)
          }
        };

        let response;
        if (layoutId) {
          // Update existing layout
          response = await api.post(`/auditorium/layout/${layoutId}`, payload);
        } else {
          // Create new layout
          response = await api.post('/auditorium/layout/save', payload);
        }

        message.success(layoutId ? 'Layout updated successfully!' : 'Layout saved successfully!');
        // console.log('Saved layout response:', response);
      }

    } catch (error) {
      console.error('Save error:', error);
      message.error(
        isAssignMode
          ? 'Failed to save ticket assignments'
          : `Failed to ${layoutId ? 'update' : 'save'} layout`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Canvas Click
  const handleCanvasClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElement(null);
      setSelectedType(null);
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
    <Card className="auditorium-designer" bodyStyle={{ paddingTop: 10 }}>
      <Row align="middle" gutter={10} wrap={false} className='mb-4'>
        <Col span={9}>
          <h5>
            {isAssignMode
              ? `Assign Tickets to Layout: ${layoutName}`
              : layoutId
                ? `Edit Layout: ${layoutName}`
                : "New Auditorium Layout"}
          </h5>
        </Col>
        <Col span={4}>
          {/* add field to write name for layout */}
          <Input
            placeholder="Layout Name"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
          />
        </Col>
        {!isAssignMode &&
          <VanueList
            hideLable={true}
            noMargin={true}
            onChange={onVanueChange}
            value={vanueId}
            span={4}
            showDetail={false}
          />
        }
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSection}
            disabled={isAssignMode}
          >
            Add Section
          </Button>
        </Col>

        <Col>
          <Button
            icon={<BorderOutlined />}
            onClick={() => setShowGrid(!showGrid)}
          />
        </Col>

        <Col>
          <Button icon={<ZoomInOutlined />} onClick={() => handleZoom(true)} />
        </Col>

        <Col>
          <Button icon={<ZoomOutOutlined />} onClick={() => handleZoom(false)} />
        </Col>

        <Col>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            onClick={saveLayout}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            {isAssignMode ? "Save" : layoutId ? "Update" : "Save"}
          </Button>
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


      <Row>
        <Col lg={4}>
          {/* Left Panel */}
          <LeftBar
            sections={sections}
            selectedType={selectedType}
            setSelectedElement={setSelectedElement}
            stage={stage}
            setSelectedType={setSelectedType}
            duplicateSection={duplicateSection}
            deleteSection={deleteSection}
            selectedElement={selectedElement}
            deleteRow={deleteRow}
            addRowToSection={addRowToSection}
            isAssignMode={isAssignMode}
          />

        </Col>
        {/* Center Canvas */}
        <Col lg={16}>
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
          />
        </Col>
        {/* Right Panel - Editor */}
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
          />
        </Col>
      </Row>
    </Card>
  );
};

export default AuditoriumLayoutDesigner;
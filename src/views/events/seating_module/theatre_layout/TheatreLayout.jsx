import React, { useState, useRef, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { Button, Tag, Space, Divider, Card, Typography, Row, Col, Alert } from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  ShoppingCartOutlined,
  DollarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import Toolbar from './Toolbar';
import ScreenArea from './ScreenArea';
import SeatingArea from './SeatingArea';
import PropertiesPanel from './PropertiesPanel';

const { Title, Text } = Typography;

const TheatreLayout = ({ isEdit = false, data }) => {
  const SCALE_FACTOR = 20;
  const INITIAL_SCREEN_WIDTH = 12 * SCALE_FACTOR;
  const INITIAL_SCREEN_HEIGHT = 6 * SCALE_FACTOR;
  
  const [theatre, setTheatre] = useState(data || {
    theatreName: "CineMax",
    location: "Downtown",
    halls: [
      {
        hallId: "hall_1",
        hallName: "Hall 1",
        screen: {
          screenId: "screen_1",
          type: "IMAX",
          width: INITIAL_SCREEN_WIDTH,
          height: INITIAL_SCREEN_HEIGHT,
          position: { x: 100, y: 50 }
        },
        sections: [
          {
            sectionId: "section_1",
            name: "Front",
            shape: "rect", 
            position: { x: 100, y: 200 },
            width: 400,
            height: 300,
            rows: [
              {
                rowId: "row_A",
                label: "A",
                seatCount: 10,
                seats: Array(10).fill().map((_, i) => ({
                  seatId: `A${i+1}`,
                  number: i+1,
                  type: "standard",
                  status: i === 1 ? "booked" : "available",
                  price: 150
                }))
              }
            ],
            defaultPrice: 150
          }
        ]
      }
    ]
  });

  const [selectedElement, setSelectedElement] = useState(null);
  const [currentHallIndex, setCurrentHallIndex] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const containerRef = useRef(null);

  const currentHall = theatre.halls[currentHallIndex];

  // Hall Management Functions
  const handleAddHall = useCallback(() => {
    if (!isEdit) return;
    
    const newHallNumber = theatre.halls.length + 1;
    const newHall = {
      hallId: `hall_${uuidv4()}`,
      hallName: `Hall ${newHallNumber}`,
      screen: {
        screenId: `screen_${uuidv4()}`,
        type: "Standard",
        width: INITIAL_SCREEN_WIDTH,
        height: INITIAL_SCREEN_HEIGHT,
        position: { x: 100, y: 50 }
      },
      sections: []
    };

    setTheatre(prev => ({
      ...prev,
      halls: [...prev.halls, newHall]
    }));

    setCurrentHallIndex(theatre.halls.length);
    setSelectedElement({ 
      type: 'hall', 
      id: newHall.hallId
    });
  }, [isEdit, theatre.halls.length, INITIAL_SCREEN_WIDTH, INITIAL_SCREEN_HEIGHT]);

  const handleDeleteHall = useCallback((hallId) => {
    if (!isEdit || theatre.halls.length <= 1) return;

    setTheatre(prev => ({
      ...prev,
      halls: prev.halls.filter(hall => hall.hallId !== hallId)
    }));

    setCurrentHallIndex(0);
    setSelectedElement(null);
  }, [isEdit, theatre.halls.length]);

  // Edit Mode Functions
  const handleAddSection = useCallback((shape) => {
    if (!isEdit) return;
    
    const newSection = {
      sectionId: `section_${uuidv4()}`,
      name: shape === 'rect' ? 'New Section' : 'New Balcony',
      shape,
      position: { x: 200, y: 300 },
      width: 300,
      height: 200,
      rows: [],
      defaultPrice: shape === 'rect' ? 150 : 250
    };

    setTheatre(prev => ({
      ...prev,
      halls: prev.halls.map((hall, index) => 
        index === currentHallIndex ? {
          ...hall,
          sections: [...hall.sections, newSection]
        } : hall
      )
    }));

    setSelectedElement({ 
      type: 'section', 
      id: newSection.sectionId,
      hallIndex: currentHallIndex
    });
  }, [currentHallIndex, isEdit]);

  const handleDeleteSection = useCallback((sectionId) => {
    if (!isEdit) return;

    setTheatre(prev => ({
      ...prev,
      halls: prev.halls.map((hall, index) => 
        index === currentHallIndex ? {
          ...hall,
          sections: hall.sections.filter(section => section.sectionId !== sectionId)
        } : hall
      )
    }));

    setSelectedElement(null);
  }, [currentHallIndex, isEdit]);

  const handleAddRow = useCallback((sectionId) => {
    if (!isEdit) return;

    setTheatre(prev => {
      const currentSection = prev.halls[currentHallIndex].sections
        .find(s => s.sectionId === sectionId);
      
      const nextRowLetter = String.fromCharCode(65 + (currentSection?.rows.length || 0));
      const newRowId = `row_${nextRowLetter}`;
      
      return {
        ...prev,
        halls: prev.halls.map((hall, index) => 
          index === currentHallIndex ? {
            ...hall,
            sections: hall.sections.map(section => 
              section.sectionId === sectionId ? {
                ...section,
                rows: [
                  ...section.rows,
                  {
                    rowId: newRowId,
                    label: nextRowLetter,
                    seatCount: 10,
                    seats: Array(10).fill().map((_, i) => ({
                      seatId: `${nextRowLetter}${i+1}`,
                      number: i+1,
                      type: "standard",
                      status: "available",
                      price: section.defaultPrice
                    }))
                  }
                ]
              } : section
            )
          } : hall
        )
      };
    });
  }, [currentHallIndex, isEdit]);

  const handleDeleteRow = useCallback((sectionId, rowId) => {
    if (!isEdit) return;

    setTheatre(prev => ({
      ...prev,
      halls: prev.halls.map((hall, index) => 
        index === currentHallIndex ? {
          ...hall,
          sections: hall.sections.map(section => 
            section.sectionId === sectionId ? {
              ...section,
              rows: section.rows.filter(row => row.rowId !== rowId)
            } : section
          )
        } : hall
      )
    }));

    setSelectedElement(null);
  }, [currentHallIndex, isEdit]);

  const handleScreenUpdate = useCallback((updates) => {
    if (!isEdit) return;

    setTheatre(prev => ({
      ...prev,
      halls: prev.halls.map((hall, index) => 
        index === currentHallIndex ? {
          ...hall,
          screen: { ...hall.screen, ...updates }
        } : hall
      )
    }));
  }, [currentHallIndex, isEdit]);

  const handleSectionUpdate = useCallback((sectionId, updates) => {
    if (!isEdit) return;

    setTheatre(prev => ({
      ...prev,
      halls: prev.halls.map((hall, index) => 
        index === currentHallIndex ? {
          ...hall,
          sections: hall.sections.map(section => 
            section.sectionId === sectionId ? { ...section, ...updates } : section
          )
        } : hall
      )
    }));
  }, [currentHallIndex, isEdit]);

  // View Mode Functions
  const handleSeatClick = useCallback((sectionId, rowId, seatId) => {
    if (isEdit) {
      setSelectedElement({
        type: 'seat',
        id: { sectionId, rowId, seatId },
        hallIndex: currentHallIndex
      });
    } else {
      setTheatre(prev => {
        const updatedHalls = prev.halls.map((hall, index) => {
          if (index === currentHallIndex) {
            const updatedSections = hall.sections.map(section => {
              if (section.sectionId === sectionId) {
                const updatedRows = section.rows.map(row => {
                  if (row.rowId === rowId) {
                    const updatedSeats = row.seats.map(seat => {
                      if (seat.seatId === seatId) {
                        const isSelected = selectedSeats.some(s => 
                          s.sectionId === sectionId && 
                          s.rowId === rowId && 
                          s.seatId === seatId
                        );
                        
                        if (isSelected) {
                          setSelectedSeats(prevSeats => 
                            prevSeats.filter(s => 
                              !(s.sectionId === sectionId && s.rowId === rowId && s.seatId === seatId)
                            )
                          );
                          return { ...seat, status: "available" };
                        } else {
                          setSelectedSeats(prevSeats => [
                            ...prevSeats,
                            { sectionId, rowId, seatId, price: seat.price }
                          ]);
                          return { ...seat, status: "reserved" };
                        }
                      }
                      return seat;
                    });
                    return { ...row, seats: updatedSeats };
                  }
                  return row;
                });
                return { ...section, rows: updatedRows };
              }
              return section;
            });
            return { ...hall, sections: updatedSections };
          }
          return hall;
        });
        return { ...prev, halls: updatedHalls };
      });
    }
  }, [currentHallIndex, isEdit, selectedSeats]);

  const handleBookSeats = useCallback(() => {
    if (isEdit || selectedSeats.length === 0) return;

    setTheatre(prev => {
      const updatedHalls = prev.halls.map((hall, index) => {
        if (index === currentHallIndex) {
          const updatedSections = hall.sections.map(section => {
            const updatedRows = section.rows.map(row => {
              const updatedSeats = row.seats.map(seat => {
                const isBooked = selectedSeats.some(s => 
                  s.sectionId === section.sectionId && 
                  s.rowId === row.rowId && 
                  s.seatId === seat.seatId
                );
                if (isBooked) {
                  return { ...seat, status: "booked" };
                }
                return seat;
              });
              return { ...row, seats: updatedSeats };
            });
            return { ...section, rows: updatedRows };
          });
          return { ...hall, sections: updatedSections };
        }
        return hall;
      });
      return { ...prev, halls: updatedHalls };
    });

    console.log('Booking seats:', selectedSeats);
    setSelectedSeats([]);
  }, [currentHallIndex, isEdit, selectedSeats]);

  const handlePropertyChange = useCallback((elementType, elementId, updates) => {
    if (!isEdit) return;

    if (elementType === 'theatre') {
      setTheatre(prev => ({ ...prev, ...updates }));
    } else if (elementType === 'hall') {
      setTheatre(prev => ({
        ...prev,
        halls: prev.halls.map(hall => 
          hall.hallId === elementId ? { ...hall, ...updates } : hall
        )
      }));
    } else if (elementType === 'screen') {
      handleScreenUpdate(updates);
    } else if (elementType === 'section') {
      handleSectionUpdate(elementId, updates);
    } else if (elementType === 'row') {
      const { sectionId, rowId } = elementId;
      setTheatre(prev => ({
        ...prev,
        halls: prev.halls.map((hall, index) => 
          index === currentHallIndex ? {
            ...hall,
            sections: hall.sections.map(section => 
              section.sectionId === sectionId ? {
                ...section,
                rows: section.rows.map(row => 
                  row.rowId === rowId ? { ...row, ...updates } : row
                )
              } : section
            )
          } : hall
        )
      }));
    } else if (elementType === 'seat') {
      const { sectionId, rowId, seatId } = elementId;
      setTheatre(prev => ({
        ...prev,
        halls: prev.halls.map((hall, index) => 
          index === currentHallIndex ? {
            ...hall,
            sections: hall.sections.map(section => 
              section.sectionId === sectionId ? {
                ...section,
                rows: section.rows.map(row => 
                  row.rowId === rowId ? {
                    ...row,
                    seats: row.seats.map(seat => 
                      seat.seatId === seatId ? { ...seat, ...updates } : seat
                    )
                  } : row
                )
              } : section
            )
          } : hall
        )
      }));
    }
  }, [handleScreenUpdate, handleSectionUpdate, isEdit, currentHallIndex]);

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="d-flex flex-column vh-100 w-100" style={{ backgroundColor: 'var(--body-bg)' }}>
        {isEdit && (
          <Toolbar 
            onAddSection={handleAddSection}
            onAddHall={handleAddHall}
            onDeleteHall={() => handleDeleteHall(currentHall.hallId)}
            onSave={() => console.log('Save layout:', theatre)}
            halls={theatre.halls}
            currentHallIndex={currentHallIndex}
            onHallChange={setCurrentHallIndex}
            canDeleteHall={theatre.halls.length > 1}
          />
        )}

        {!isEdit && selectedSeats.length > 0 && (
          <Card
            size="small"
            className="m-0"
            style={{
              backgroundColor: 'var(--component-bg)',
              borderColor: 'var(--border-secondary)',
              borderRadius: 0,
              borderLeft: 0,
              borderRight: 0,
              borderTop: 0,
            }}
          >
            <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: '1rem' }}>
              <Space size="middle" wrap>
                <Tag 
                  icon={<TeamOutlined />}
                  color="processing"
                  style={{ 
                    fontSize: 14,
                    padding: '6px 14px',
                    borderRadius: 12,
                    fontWeight: 500,
                    border: 'none'
                  }}
                >
                  {selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''} Selected
                </Tag>
                <Tag 
                  icon={<DollarOutlined />}
                  color="success"
                  style={{ 
                    fontSize: 14,
                    padding: '6px 14px',
                    borderRadius: 12,
                    fontWeight: 500,
                    border: 'none'
                  }}
                >
                  Total: ${totalAmount}
                </Tag>
              </Space>
              <Button 
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={handleBookSeats}
                size="large"
                className="bg-primary border-0 font-weight-semibold"
                style={{
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(181, 21, 21, 0.3)',
                }}
              >
                Book Selected Seats
              </Button>
            </div>
          </Card>
        )}

        <Row className="flex-grow-1 m-0 overflow-hidden">
          <Col 
            xs={24}
            md={isEdit ? 18 : 24} 
            className="p-0 position-relative" 
            ref={containerRef}
          >
            <div 
              className="position-relative w-100 h-100 overflow-auto" 
              style={{ 
                backgroundColor: 'var(--body-bg)',
                backgroundImage: 'radial-gradient(circle, var(--border-secondary) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              <ScreenArea 
                screen={currentHall.screen}
                onUpdate={handleScreenUpdate}
                isSelected={selectedElement?.type === 'screen'}
                onClick={() => isEdit && setSelectedElement({ 
                  type: 'screen', 
                  id: currentHall.screen.screenId,
                  hallIndex: currentHallIndex
                })}
                isEdit={isEdit}
              />
              
              <SeatingArea 
                sections={currentHall.sections}
                onSectionUpdate={handleSectionUpdate}
                onSeatClick={handleSeatClick}
                onRowClick={(sectionId, rowId) => isEdit && setSelectedElement({
                  type: 'row',
                  id: { sectionId, rowId },
                  hallIndex: currentHallIndex
                })}
                selectedElement={selectedElement}
                containerRef={containerRef}
                currentHallIndex={currentHallIndex}
                setSelectedElement={setSelectedElement}
                isEdit={isEdit}
                currentHall={currentHall}
              />
            </div>
          </Col>
          
          {isEdit && (
            <Col 
              xs={24}
              md={6} 
              className="p-0"
              style={{
                borderLeft: '1px solid var(--border-secondary)',
                backgroundColor: 'var(--component-bg)'
              }}
            >
              <PropertiesPanel 
                selectedElement={selectedElement}
                theatre={theatre}
                currentHallIndex={currentHallIndex}
                onPropertyChange={handlePropertyChange}
                onDeleteSection={handleDeleteSection}
                onDeleteRow={handleDeleteRow}
                onAddRow={handleAddRow}
              />
            </Col>
          )}
        </Row>
      </div>
    </DndProvider>
  );
};

export default TheatreLayout;
import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import Seat from './Seat';
import { Card } from 'react-bootstrap';

const Section = ({
  section, 
  onUpdate, 
  onSeatClick, 
  onRowClick, 
  isSelected, 
  containerRef,
  currentHallIndex,
  setSelectedElement,
  selectedElement,
  isEdit
}) => {
  const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'SECTION',
    item: { 
      type: 'SECTION',
      id: section.sectionId,
      left: section.position.x,
      top: section.position.y 
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEdit
  });

  drag(ref);

  const handleSectionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isEdit) {
      console.log('Section clicked:', section.sectionId); // Debug log
      setSelectedElement({ 
        type: 'section', 
        id: section.sectionId,
        hallIndex: currentHallIndex
      });
    }
  };

  const handleRowClick = (e, rowId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isEdit) {
      console.log('Row clicked:', rowId); // Debug log
      setSelectedElement({
        type: 'row',
        id: { sectionId: section.sectionId, rowId },
        hallIndex: currentHallIndex
      });
    }
  };

  const handleSeatClick = (e, sectionId, rowId, seatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isEdit) {
      console.log('Seat clicked in edit mode:', seatId); // Debug log
      setSelectedElement({
        type: 'seat',
        id: { sectionId, rowId, seatId },
        hallIndex: currentHallIndex
      });
    } else {
      // Call the original seat click handler for booking
      onSeatClick(sectionId, rowId, seatId);
    }
  };

  const handleResize = (e) => {
    if (!isEdit) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = section.width || 300;
    const startHeight = section.height || 200;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      onUpdate({
        width: Math.max(50, startWidth + dx),
        height: Math.max(50, startHeight + dy)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Card
      ref={ref}
      className={`position-absolute ${isSelected ? 'border-primary border-3' : 'border-secondary'} ${isDragging ? 'opacity-50' : ''}`}
      style={{
        left: `${section.position.x}px`,
        top: `${section.position.y}px`,
        width: `${section.width || 300}px`,
        height: `${section.height || 200}px`,
        cursor: isEdit ? 'move' : 'default',
        zIndex: isSelected ? 10 : 5,
        overflow: 'hidden',
        backgroundColor: section.shape === 'arc' ? 'rgba(200,230,255,0.2)' : 'rgba(255,230,200,0.2)'
      }}
      onClick={handleSectionClick}
    >
      <Card.Header className="py-1 px-2 bg-light text-dark">
        <small className="fw-bold">{section.name}</small>
        <small className="text-muted ms-2">({section.rows?.length || 0} rows)</small>
      </Card.Header>
      <Card.Body className="p-1 overflow-auto">
        {section.rows.map((row, rowIndex) => (
          <div 
            key={row.rowId} 
            className={`d-flex justify-content-center mb-1 ${
              isEdit ? 'position-relative' : ''
            } ${
              selectedElement?.type === 'row' && 
              selectedElement?.id.rowId === row.rowId && 
              selectedElement?.id.sectionId === section.sectionId 
                ? 'bg-primary bg-opacity-25 rounded' 
                : ''
            }`}
            onClick={(e) => handleRowClick(e, row.rowId)}
            style={{
        cursor: isEdit ? 'pointer' : 'default',
        padding: isEdit ? '2px' : '0',
        backgroundColor: isEdit && isHovered ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
          >
            {isEdit && (
              <div 
                className="position-absolute start-0 top-50 translate-middle-y"
                style={{ left: '-15px', fontSize: '10px', color: '#666' }}
              >
                {row.label}
              </div>
            )}
            {row.seats.map((seat) => (
              <Seat
                key={`${section.sectionId}-${row.rowId}-${seat.seatId}`}
                seat={seat}
                onClick={(e) => handleSeatClick(e, section.sectionId, row.rowId, seat.seatId)}
                isSelected={
                  selectedElement?.type === 'seat' && 
                  selectedElement?.id.sectionId === section.sectionId &&
                  selectedElement?.id.rowId === row.rowId &&
                  selectedElement?.id.seatId === seat.seatId
                }
                isEdit={isEdit}
              />
            ))}
          </div>
        ))}
        
        {section.rows.length === 0 && (
          <div className="text-center text-muted py-3">
            <small>No rows added yet</small>
          </div>
        )}
      </Card.Body>
      
      {isSelected && isEdit && (
        <div 
          className="position-absolute bg-primary rounded-circle"
          style={{
            width: '15px',
            height: '15px',
            right: '-7px',
            bottom: '-7px',
            cursor: 'nwse-resize'
          }}
          onMouseDown={handleResize}
          title="Resize"
        />
      )}
    </Card>
  );
};

export default Section;
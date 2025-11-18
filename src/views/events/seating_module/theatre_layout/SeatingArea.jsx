import React from 'react';
import Section from './Section';
import { useDrop } from 'react-dnd';

const SeatingArea = ({ 
  sections, 
  onSectionUpdate, 
  onSeatClick, 
  onRowClick, 
  selectedElement, 
  containerRef,
  currentHallIndex,
  currentHall,
  setSelectedElement,
  isEdit
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'SECTION',
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);
      
      onSectionUpdate(item.id, { position: { x: left, y: top } });
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  });

  // In SeatingArea.jsx
  const handleAreaClick = (e) => {
    if (e.target === e.currentTarget && isEdit) {
      console.log('Seating area clicked - selecting current hall');
      setSelectedElement({
        type: 'hall',
        id: currentHall.hallId,
        hallIndex: currentHallIndex
      });
    }
  }; 

  return (
    <div 
      ref={drop}
      className={`seating-area ${isOver ? 'drop-active' : ''}`}
      style={{ position: 'relative', height: '100%', minHeight: '600px' }}
      onClick={handleAreaClick}
    >
      {sections.map(section => (
        <Section
          key={section.sectionId}
          section={section}
          onUpdate={(updates) => onSectionUpdate(section.sectionId, updates)}
          onSeatClick={onSeatClick}
          onRowClick={onRowClick}
          isSelected={selectedElement?.type === 'section' && selectedElement?.id === section.sectionId}
          containerRef={containerRef}
          currentHallIndex={currentHallIndex}
          setSelectedElement={setSelectedElement}
          selectedElement={selectedElement}
          isEdit={isEdit}
        />
      ))}
      
      {sections.length === 0 && isEdit && (
        <div className="position-absolute top-50 start-50 translate-middle text-center text-muted">
          <div className="fs-5">No sections added yet</div>
          <small>Use the toolbar to add sections</small>
        </div>
      )}
    </div>
  );
};

export default SeatingArea;
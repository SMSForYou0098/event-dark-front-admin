// src/views/modules/Event/Events/TheaterLayout/BalconyArea.jsx
import React from 'react';
import Section from './Section';
import { useDrop } from 'react-dnd';

const BalconyArea = ({ sections, onSectionUpdate, onSeatClick, selectedElement, containerRef }) => {
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

  return (
    <div 
      ref={drop}
      className={`balcony-area ${isOver ? 'drop-active' : ''}`}
    >
      {sections.map(section => (
        <Section
          key={section.id}
          section={section}
          onUpdate={onSectionUpdate}
          onSeatClick={onSeatClick}
          isSelected={selectedElement?.type === 'section' && selectedElement?.id === section.id}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
};

export default BalconyArea;
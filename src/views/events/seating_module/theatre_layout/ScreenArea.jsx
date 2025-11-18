import React from 'react';
import { Card } from 'react-bootstrap';

const ScreenArea = ({ screen, onUpdate, isSelected, onClick, isEdit }) => {
  const MIN_SCREEN_SIZE = 50;
  const SCALE_FACTOR = 20;

  const handleMoveStart = (e) => {
    if (!isEdit) return;
    
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = screen.position.x;
    const startTop = screen.position.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      onUpdate({
        position: {
          x: startLeft + dx,
          y: startTop + dy,
        },
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e) => {
    if (!isEdit) return;
    
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = screen.width;
    const startHeight = screen.height;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      onUpdate({
        width: Math.max(MIN_SCREEN_SIZE, startWidth + dx),
        height: Math.max(MIN_SCREEN_SIZE, startHeight + dy)
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
      className={`position-absolute ${isSelected ? 'border-primary border-3' : 'border-secondary'}`}
      style={{
        width: `${screen.width}px`,
        height: `${screen.height}px`,
        left: `${screen.position.x}px`,
        top: `${screen.position.y}px`,
        cursor: isEdit ? (isSelected ? 'grab' : 'pointer') : 'default',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        userSelect: 'none',
      }}
      onClick={isEdit ? onClick : undefined}
      onMouseDown={isEdit && isSelected ? handleMoveStart : undefined}
    >
      <Card.Body className="d-flex flex-column justify-content-center align-items-center text-white p-2">
        <Card.Title className="mb-0 fs-6">{screen.type}</Card.Title>
        <small>{(screen.width / SCALE_FACTOR).toFixed(1)}m × {(screen.height / SCALE_FACTOR).toFixed(1)}m</small>
      </Card.Body>

      {isSelected && isEdit && (
        <div
          className="position-absolute bg-primary rounded-circle"
          style={{
            width: '18px',
            height: '18px',
            right: '-9px',
            bottom: '-9px',
            cursor: 'nwse-resize',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleResizeStart(e);
          }}
          title="Resize"
        />
      )}
    </Card>
  );
};

export default ScreenArea;
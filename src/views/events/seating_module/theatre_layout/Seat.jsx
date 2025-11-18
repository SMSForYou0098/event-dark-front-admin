import React from 'react';
import { Button } from 'react-bootstrap';

const seatTypeClasses = {
  standard: 'btn-outline-secondary',
  premium: 'btn-warning',
  box: 'btn-purple',
  wheelchair: 'btn-info',
  vip: 'btn-danger'
};

const seatStatusClasses = {
  available: '',
  booked: 'btn-dark text-white',
  reserved: 'btn-danger',
  sold: 'btn-secondary disabled',
  disabled: 'btn-light disabled'
};

const Seat = ({ seat, onClick, isSelected, isEdit }) => {
  const isClickable = isEdit || (!isEdit && seat.status === 'available');
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isClickable && onClick) {
      onClick(e);
    }
  };
  
  return (
    <Button
      size="sm"
      className={`m-1 ${seatTypeClasses[seat.type]} ${seatStatusClasses[seat.status]} ${
        isSelected ? 'border-2 border-primary shadow' : ''
      }`}
      style={{ 
        width: '30px', 
        height: '30px', 
        padding: 0,
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative'
      }}
      onClick={handleClick}
      disabled={!isClickable}
      title={isEdit ? `Seat ${seat.number} - ${seat.type} - $${seat.price}` : undefined}
    >
      <small>{seat.number}</small>
      {isEdit && isSelected && (
        <div
          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
          style={{ fontSize: '8px', padding: '2px 4px' }}
        >
          ✓
        </div>
      )}
    </Button>
  );
};

export default Seat;
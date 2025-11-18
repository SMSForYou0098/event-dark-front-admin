import React, { useState, useEffect } from 'react';
import { Card, Form, Tab, Tabs, Button, Alert } from 'react-bootstrap';

const PropertiesPanel = ({ selectedElement, theatre, currentHallIndex, onPropertyChange, onDeleteSection, onDeleteRow, onAddRow }) => {
  const [localState, setLocalState] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    if (!selectedElement) {
      setLocalState({});
      return;
    }

    console.log('selected elements', selectedElement);
    
    const currentHall = theatre.halls[currentHallIndex];
    
    switch (selectedElement.type) {
      case 'hall':
        setLocalState(currentHall);
        setActiveTab('hall');
        break;
        
      case 'screen':
        setLocalState(currentHall.screen);
        setActiveTab('screen');
        break;
        
      case 'section':
        const section = currentHall.sections.find(s => s.sectionId === selectedElement.id);
        if (section) {
          setLocalState(section);
          setActiveTab('section');
        }
        break;
        
      case 'row':
        const rowSection = currentHall.sections.find(s => s.sectionId === selectedElement.id.sectionId);
        if (rowSection) {
          const row = rowSection.rows.find(r => r.rowId === selectedElement.id.rowId);
          setLocalState({
            ...row,
            sectionName: rowSection.name
          });
          setActiveTab('row');
        }
        break;
        
      case 'seat':
        const seatSection = currentHall.sections.find(s => s.sectionId === selectedElement.id.sectionId);
        if (seatSection) {
          const row = seatSection.rows.find(r => r.rowId === selectedElement.id.rowId);
          const seat = row?.seats.find(s => s.seatId === selectedElement.id.seatId);
          setLocalState({
            ...seat,
            sectionName: seatSection.name,
            rowLabel: row?.label
          });
          setActiveTab('seat');
        }
        break;
        
      default:
        setLocalState(theatre);
        setActiveTab('theatre');
    }
  }, [selectedElement, theatre, currentHallIndex]);

  const handleDeleteSection = () => {
    if (selectedElement?.type === 'section') {
      onDeleteSection(selectedElement.id);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteRow = () => {
    if (selectedElement?.type === 'row') {
      onDeleteRow(selectedElement.id.sectionId, selectedElement.id.rowId);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddRowToSection = () => {
    if (selectedElement?.type === 'section') {
      onAddRow(selectedElement.id);
    }
  };

  if (!selectedElement) {
    return (
      <Card className="h-100 rounded-0">
        <Card.Body className="d-flex justify-content-center align-items-center">
          <div className="text-muted">No element selected</div>
        </Card.Body>
      </Card>
    );
  }

  const renderTheatreTab = () => (
    <Tab eventKey="theatre" title="Theatre">
      <Form className="p-3">
        <Form.Group className="mb-3">
          <Form.Label>Theatre Name</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.theatreName} 
            onChange={(e) => onPropertyChange('theatre', null, { theatreName: e.target.value })}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Location</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.location} 
            onChange={(e) => onPropertyChange('theatre', null, { location: e.target.value })}
          />
        </Form.Group>
      </Form>
    </Tab>
  );

  const renderHallTab = () => (
    <Tab eventKey="hall" title="Hall">
      <Form className="p-3">
        <Form.Group className="mb-3">
          <Form.Label>Hall Name</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.hallName} 
            onChange={(e) => onPropertyChange('hall', localState.hallId, { hallName: e.target.value })}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Number of Sections</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.sections?.length || 0} 
            readOnly
          />
        </Form.Group>
      </Form>
    </Tab>
  );

  const renderScreenTab = () => (
    <Tab eventKey="screen" title="Screen">
      <Form className="p-3">
        <Form.Group className="mb-3">
          <Form.Label>Screen Type</Form.Label>
          <Form.Control
            type="text"
            value={localState.type}
            onChange={(e) =>
              onPropertyChange('screen', null, { type: e.target.value })
            }
            placeholder="Enter screen type"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Width</Form.Label>
          <Form.Control 
            type="number" 
            value={localState.width} 
            onChange={(e) => onPropertyChange('screen', null, { width: parseFloat(e.target.value) })}
            min="1"
            step="0.1"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Height</Form.Label>
          <Form.Control 
            type="number" 
            value={localState.height} 
            onChange={(e) => onPropertyChange('screen', null, { height: parseFloat(e.target.value) })}
            min="1"
            step="0.1"
          />
        </Form.Group>
      </Form>
    </Tab>
  );

  const renderSectionTab = () => (
    <Tab eventKey="section" title="Section">
      <Form className="p-3">
        <Form.Group className="mb-3">
          <Form.Label>Section Name</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.name} 
            onChange={(e) => onPropertyChange('section', localState.sectionId, { name: e.target.value })}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Shape</Form.Label>
          <Form.Select 
            value={localState.shape} 
            onChange={(e) => onPropertyChange('section', localState.sectionId, { shape: e.target.value })}
          >
            <option value="rect">Rectangular</option>
            <option value="arc">Arc/Balcony</option>
          </Form.Select>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Default Price</Form.Label>
          <Form.Control 
            type="number" 
            value={localState.defaultPrice} 
            onChange={(e) => onPropertyChange('section', localState.sectionId, { defaultPrice: parseFloat(e.target.value) })}
            min="0"
            step="0.01"
          />
        </Form.Group>

        <div className="mb-3">
          <Form.Label>Rows ({localState.rows?.length || 0})</Form.Label>
          <div className="d-flex gap-2">
            <Button 
              variant="success" 
              size="sm"
              onClick={handleAddRowToSection}
            >
              Add Row
            </Button>
          </div>
        </div>

        {showDeleteConfirm ? (
          <Alert variant="danger">
            <Alert.Heading>Delete Section?</Alert.Heading>
            <p>Are you sure you want to delete this section? This action cannot be undone.</p>
            <div className="d-flex gap-2">
              <Button variant="danger" size="sm" onClick={handleDeleteSection}>
                Yes, Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </Alert>
        ) : (
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Section
          </Button>
        )}
      </Form>
    </Tab>
  );

  const renderRowTab = () => (
    <Tab eventKey="row" title="Row">
      <Form className="p-3">
        <Form.Group className="mb-3">
          <Form.Label>Section</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.sectionName} 
            readOnly
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Row Label</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.label} 
            onChange={(e) => onPropertyChange('row', selectedElement.id, { label: e.target.value })}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Seat Count</Form.Label>
          <Form.Control 
            type="number" 
            value={localState.seatCount} 
            onChange={(e) => {
              const seatCount = parseInt(e.target.value);
              const newSeats = Array(seatCount).fill().map((_, i) => ({
                seatId: `${localState.label}${i+1}`,
                number: i+1,
                type: "standard",
                status: "available",
                price: theatre.halls[currentHallIndex].sections
                  .find(s => s.sectionId === selectedElement.id.sectionId)?.defaultPrice || 0
              }));
              
              onPropertyChange('row', selectedElement.id, {
                seatCount,
                seats: newSeats
              });
            }}
            min="1"
          />
        </Form.Group>

        {showDeleteConfirm ? (
          <Alert variant="danger">
            <Alert.Heading>Delete Row?</Alert.Heading>
            <p>Are you sure you want to delete this row? This action cannot be undone.</p>
            <div className="d-flex gap-2">
              <Button variant="danger" size="sm" onClick={handleDeleteRow}>
                Yes, Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </Alert>
        ) : (
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Row
          </Button>
        )}
      </Form>
    </Tab>
  );

  const renderSeatTab = () => (
    <Tab eventKey="seat" title="Seat">
      <Form className="p-3">
        <Form.Group className="mb-3">
          <Form.Label>Section</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.sectionName} 
            readOnly
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Row</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.rowLabel} 
            readOnly
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Seat Number</Form.Label>
          <Form.Control 
            type="text" 
            value={localState.number} 
            readOnly
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Type</Form.Label>
          <Form.Select 
            value={localState.type} 
            onChange={(e) => onPropertyChange('seat', selectedElement.id, { type: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
            <option value="wheelchair">Wheelchair</option>
          </Form.Select>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select 
            value={localState.status} 
            onChange={(e) => onPropertyChange('seat', selectedElement.id, { status: e.target.value })}
          >
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="reserved">Reserved</option>
            <option value="disabled">Disabled</option>
          </Form.Select>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Price</Form.Label>
          <Form.Control 
            type="number" 
            value={localState.price} 
            onChange={(e) => onPropertyChange('seat', selectedElement.id, { price: parseFloat(e.target.value) })}
            min="0"
            step="0.01"
          />
        </Form.Group>
      </Form>
    </Tab>
  );

  return (
    <Card className="h-100 rounded-0">
      <Card.Header className="py-2">
        <Card.Title className="mb-0 fs-6">
          {selectedElement.type.toUpperCase()} PROPERTIES
        </Card.Title>
      </Card.Header>
      <Card.Body className="p-0 overflow-auto">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="px-2 pt-2"
        >
          {selectedElement.type === 'theatre' && renderTheatreTab()}
          {selectedElement.type === 'hall' && renderHallTab()}
          {selectedElement.type === 'screen' && renderScreenTab()}
          {selectedElement.type === 'section' && renderSectionTab()}
          {selectedElement.type === 'row' && renderRowTab()}
          {selectedElement.type === 'seat' && renderSeatTab()}
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default PropertiesPanel;
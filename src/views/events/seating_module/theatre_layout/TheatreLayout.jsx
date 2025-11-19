// AuditoriumLayoutDesigner.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Transformer } from 'react-konva';
import {
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  BorderOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './AuditoriumLayoutDesigner.css';
import { Button, Card, Input, Radio, Slider, Space } from 'antd';
import { Select, InputNumber, Form } from 'antd';
const { Option } = Select;



// Draggable Stage Component
const DraggableStage = ({ stage, isSelected, onSelect, onDragEnd, onTransformEnd }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected]);

  return (
    <>
      <Group
        ref={shapeRef}
        draggable
        x={stage.x}
        y={stage.y}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onDragEnd({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onTransformEnd({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY)
          });
        }}
      >
        <Rect
          width={stage.width}
          height={stage.height}
          fill="#333"
          stroke={isSelected ? '#2196F3' : '#000'}
          strokeWidth={isSelected ? 3 : 2}
        />
        <Text
          width={stage.width}
          y={stage.height / 2 - 10}
          text="SCREEN"
          fontSize={18}
          fill="#FFF"
          align="center"
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (Math.abs(newBox.width) < 200 || Math.abs(newBox.height) < 30) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['middle-left', 'middle-right']}
          rotateEnabled={false}
        />
      )}
    </>
  );
};

// Draggable Section Component
const DraggableSection = ({ section, isSelected, onSelect, onDragEnd, onTransformEnd, children }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected]);

  return (
    <>
      <Group
        ref={shapeRef}
        draggable
        x={section.x}
        y={section.y}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onDragEnd({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onTransformEnd({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY)
          });
        }}
      >
        <Rect
          width={section.width}
          height={section.height}
          fill="rgba(200, 200, 200, 0.2)"
          stroke={isSelected ? '#2196F3' : '#999'}
          strokeWidth={isSelected ? 3 : 1}
          dash={[5, 5]}
        />
        <Text
          x={10}
          y={10}
          text={section.name}
          fontSize={16}
          fill="#333"
          fontStyle="bold"
        />
        {children}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (Math.abs(newBox.width) < 200 || Math.abs(newBox.height) < 150) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
        />
      )}
    </>
  );
};

const AuditoriumLayoutDesigner = () => {
  // State Management
  const [stage, setStage] = useState({
    position: 'top',
    shape: 'straight',
    width: 800,
    height: 50,
    x: 100,
    y: 50
  });

  const [sections, setSections] = useState([]);
  const [ticketCategories, setTicketCategories] = useState([
    { id: 'cat_1', name: 'Regular', price: 200, color: '#4CAF50' },
    { id: 'cat_2', name: 'Premium', price: 350, color: '#2196F3' },
    { id: 'cat_3', name: 'VIP', price: 500, color: '#FFD700' }
  ]);

  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [nextSectionId, setNextSectionId] = useState(1);

  const stageRef = useRef();
  const layerRef = useRef();

  // Generate unique IDs
  const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add Section
  const addSection = () => {
    const newSection = {
      id: generateId('section'),
      name: `Section ${nextSectionId}`,
      type: 'Regular',
      x: 100,
      y: 150 + (sections.length * 300),
      width: 600,
      height: 250,
      rows: [],
      subSections: []
    };

    setSections([...sections, newSection]);
    setNextSectionId(nextSectionId + 1);
    setSelectedElement(newSection);
    setSelectedType('section');
  };

  // Add Row to Section
  const addRowToSection = (sectionId) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const rowNumber = section.rows.length + 1;
        const newRow = {
          id: generateId('row'),
          title: String.fromCharCode(64 + rowNumber),
          numberOfSeats: 10,
          ticketCategory: ticketCategories[0].id,
          shape: 'straight',
          curve: 0,
          spacing: 40,
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
    const totalWidth = section.width - 100;
    const seatSpacing = totalWidth / (row.numberOfSeats + 1);

    for (let i = 0; i < row.numberOfSeats; i++) {
      const seatNumber = i + 1;
      let x, y;

      if (row.shape === 'straight') {
        x = 50 + (seatSpacing * (i + 1));
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
        ticketCategory: row.ticketCategory,
        status: 'available',
        radius: 12
      });
    }

    return seats;
  };

  // Update Section
  const updateSection = (sectionId, updates) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedSection = { ...section, ...updates };

        // Regenerate seats if width or height changed
        if (updates.width || updates.height) {
          updatedSection.rows = section.rows.map((row, index) => ({
            ...row,
            seats: generateSeatsForRow(row, updatedSection, index)
          }));
        }

        return updatedSection;
      }
      return section;
    }));

    // Update selected element if it's the one being updated
    if (selectedElement?.id === sectionId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
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

  // Delete Row
  const deleteRow = (sectionId, rowId) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.filter(r => r.id !== rowId)
        };
      }
      return section;
    }));
  };

  // Export Layout
  const exportLayout = () => {
    const layout = {
      stage,
      sections,
      ticketCategories,
      metadata: {
        createdAt: new Date().toISOString(),
        totalSections: sections.length,
        totalSeats: sections.reduce((total, section) =>
          total + section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0)
          , 0)
      }
    };

    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditorium-layout-${Date.now()}.json`;
    link.click();
  };

  // Import Layout
  const importLayout = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const layout = JSON.parse(e.target.result);
          setStage(layout.stage);
          setSections(layout.sections);
          setTicketCategories(layout.ticketCategories);
        } catch (error) {
          alert('Invalid layout file');
        }
      };
      reader.readAsText(file);
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
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.5, Math.min(newScale, 3));

    setCanvasScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    stage.position(newPos);
    stage.batchDraw();
  };

  // Get Seat Color
  const getSeatColor = (seat) => {
    if (seat.status === 'disabled') return '#9E9E9E';
    if (seat.status === 'reserved') return '#FF9800';
    if (seat.status === 'blocked') return '#F44336';

    const category = ticketCategories.find(c => c.id === seat.ticketCategory);
    return category ? category.color : '#4CAF50';
  };

  return (
    <div className="auditorium-designer">
      {/* Top Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSection}
          >
            Add Section
          </Button>

          <Button
            onClick={() => setShowGrid(!showGrid)}
            icon={<BorderOutlined />}
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>
        </div>

        <div className="toolbar-center">
          <h2>Auditorium Layout Designer</h2>
        </div>

        <div className="toolbar-right">
          <Button
            icon={<ZoomInOutlined />}
            onClick={() => handleZoom(true)}
          />

          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => handleZoom(false)}
          />

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportLayout}
          >
            Export
          </Button>

          <Upload
            accept=".json"
            showUploadList={false}
            customRequest={({ file, onSuccess }) => {
              importLayout({ target: { files: [file] } });
              setTimeout(() => onSuccess("ok"), 0);
            }}
          >
            <Button icon={<UploadOutlined />}>Import</Button>
          </Upload>
        </div>
      </div>


      <div className="designer-content">
        {/* Left Panel */}
        <div className="left-panel">
          <div>
            <h5 className='mb-3'>Layout Structure</h5>
            {/* Stage / Screen */}
            <div
              className={`structure-item ${selectedType === 'stage' ? 'selected' : ''}`}
              onClick={() => {
                setSelectedElement(stage);
                setSelectedType('stage');
              }}
              style={{ cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}
            >
              <Space>
                <span>🎭</span>
                <Text>Stage / Screen</Text>
              </Space>
            </div>

            {/* Sections Tree */}
            {sections.map(section => (
              <Card
                key={section.id}
                size="small"
                type="inner"
                title={
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text>{section.name}</Text>
                    <Button
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                    />
                  </Space>
                }
                style={{ marginBottom: 8 }}
                onClick={() => {
                  setSelectedElement(section);
                  setSelectedType('section');
                }}
              >
                {/* Rows */}
                {section.rows.map(row => (
                  <div
                    key={row.id}
                    className={`structure-item nested ${selectedElement?.id === row.id && selectedType === 'row' ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement({ ...row, sectionId: section.id });
                      setSelectedType('row');
                    }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px', cursor: 'pointer', marginBottom: 2 }}
                  >
                    <Space>
                      <span>↔️</span>
                      <Text>Row {row.title} ({row.seats.length} seats)</Text>
                    </Space>
                    <Button
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRow(section.id, row.id);
                      }}
                    />
                  </div>
                ))}

                <Button
                  type="dashed"
                  size="small"
                  className='w-100'
                  icon={<PlusOutlined />}
                  onClick={() => addRowToSection(section.id)}
                >
                  Add Row
                </Button>
              </Card>
            ))}

          </div>
        </div>

        {/* Center Canvas */}
        <div className="canvas-container">
          <Stage
            ref={stageRef}
            width={window.innerWidth - 700}
            height={window.innerHeight - 100}
            draggable={!selectedElement}
            scaleX={canvasScale}
            scaleY={canvasScale}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
          >
            <Layer ref={layerRef}>
              {/* Grid */}
              {showGrid && (
                <>
                  {Array.from({ length: 50 }).map((_, i) => (
                    <React.Fragment key={`grid-${i}`}>
                      <Line
                        points={[i * 50, 0, i * 50, 3000]}
                        stroke="#E0E0E0"
                        strokeWidth={1}
                        listening={false}
                      />
                      <Line
                        points={[0, i * 50, 3000, i * 50]}
                        stroke="#E0E0E0"
                        strokeWidth={1}
                        listening={false}
                      />
                    </React.Fragment>
                  ))}
                </>
              )}

              {/* Stage/Screen */}
              <DraggableStage
                stage={stage}
                isSelected={selectedType === 'stage' && selectedElement?.position === stage.position}
                onSelect={() => {
                  setSelectedElement(stage);
                  setSelectedType('stage');
                }}
                onDragEnd={(pos) => {
                  setStage({ ...stage, ...pos });
                }}
                onTransformEnd={(transform) => {
                  setStage({ ...stage, ...transform });
                }}
              />

              {/* Sections */}
              {sections.map(section => (
                <DraggableSection
                  key={section.id}
                  section={section}
                  isSelected={selectedElement?.id === section.id && selectedType === 'section'}
                  onSelect={() => {
                    setSelectedElement(section);
                    setSelectedType('section');
                  }}
                  onDragEnd={(pos) => {
                    updateSection(section.id, pos);
                  }}
                  onTransformEnd={(transform) => {
                    updateSection(section.id, transform);
                  }}
                >
                  {/* Rows and Seats */}
                  {section.rows.map(row => (
                    <Group key={row.id}>
                      <Text
                        x={10}
                        y={row.seats[0]?.y - 5}
                        text={row.title}
                        fontSize={14}
                        fill="#666"
                        fontStyle="bold"
                        listening={false}
                      />

                      {row.seats.map(seat => (
                        <Group key={seat.id}>
                          <Circle
                            x={seat.x}
                            y={seat.y}
                            radius={seat.radius}
                            fill={getSeatColor(seat)}
                            stroke={selectedElement?.id === seat.id && selectedType === 'seat' ? '#000' : '#333'}
                            strokeWidth={selectedElement?.id === seat.id && selectedType === 'seat' ? 2 : 0.5}
                            onClick={(e) => {
                              e.cancelBubble = true;
                              setSelectedElement({ ...seat, sectionId: section.id, rowId: row.id });
                              setSelectedType('seat');
                            }}
                          />
                          {seat.status === 'disabled' && (
                            <Line
                              points={[
                                seat.x - seat.radius * 0.7,
                                seat.y - seat.radius * 0.7,
                                seat.x + seat.radius * 0.7,
                                seat.y + seat.radius * 0.7
                              ]}
                              stroke="#F44336"
                              strokeWidth={2}
                              listening={false}
                            />
                          )}
                        </Group>
                      ))}
                    </Group>
                  ))}
                </DraggableSection>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Right Panel - Editor */}
        <div className="right-panel">

          <div className="panel-header">
            <h3>
              {selectedType === 'stage' && 'Stage Editor'}
              {selectedType === 'section' && 'Section Editor'}
              {selectedType === 'row' && 'Row Editor'}
              {selectedType === 'seat' && 'Seat Editor'}
              {!selectedType && 'Select an Element'}
            </h3>
          </div>

          <div className="editor-content">

            {!selectedType && (
              <div className="empty-state">
                <p>Select a stage, section, row, or seat to edit its properties</p>
              </div>
            )}

            {/* Stage Editor */}
            {selectedType === 'stage' && (
              <Form
                layout="vertical"
                className="editor-form"
              >
                <Form.Item label="Position">
                  <Select
                    value={stage.position}
                    onChange={(value) => setStage({ ...stage, position: value })}
                  >
                    <Option value="top">Top</Option>
                    <Option value="bottom">Bottom</Option>
                    <Option value="center">Center</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Shape">
                  <Select
                    value={stage.shape}
                    onChange={(value) => setStage({ ...stage, shape: value })}
                  >
                    <Option value="straight">Straight</Option>
                    <Option value="curved">Curved</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Width">
                  <InputNumber
                    min={0}
                    value={stage.width}
                    onChange={(value) => setStage({ ...stage, width: value })}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item label="Height">
                  <InputNumber
                    min={0}
                    value={stage.height}
                    onChange={(value) => setStage({ ...stage, height: value })}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <div className="">
                  <Text>
                    💡 Tip: Click and drag the screen to move it. Use corner handles to resize.
                  </Text>
                </div>
              </Form>
            )}

            {/* Section Editor */}
            {selectedType === 'section' && selectedElement && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Section Name</Text>
                  <Input
                    value={selectedElement.name}
                    onChange={(e) => {
                      updateSection(selectedElement.id, { name: e.target.value });
                      setSelectedElement({ ...selectedElement, name: e.target.value });
                    }}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>Section Type</Text>
                  <Select
                    value={selectedElement.type}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { type: value });
                      setSelectedElement({ ...selectedElement, type: value });
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                    options={[
                      { value: 'Regular', label: 'Regular' },
                      { value: 'Balcony', label: 'Balcony' },
                      { value: 'VIP', label: 'VIP' },
                      { value: 'Lower', label: 'Lower' },
                      { value: 'Upper', label: 'Upper' }
                    ]}
                  />
                </div>

                <div>
                  <Text strong>Width</Text>
                  <InputNumber
                    value={selectedElement.width}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { width: value });
                      setSelectedElement({ ...selectedElement, width: value });
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>Height</Text>
                  <InputNumber
                    value={selectedElement.height}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { height: value });
                      setSelectedElement({ ...selectedElement, height: value });
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  block
                  onClick={() => addRowToSection(selectedElement.id)}
                >
                  Add Row
                </Button>

                <div className='border-secondary p-2 rounded-4'>
                  <Text strong>Rows:</Text> {selectedElement.rows.length}<br />
                  <Text strong>Total Seats:</Text> {selectedElement.rows.reduce((total, row) => total + row.seats.length, 0)}<br /><br />
                  <Text strong>💡 Tip:</Text> Click and drag to move. Use corner handles to resize.
                </div>
              </Space>
            )}

            {/* Row Editor */}
             {selectedType === 'row' && selectedElement && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Row Title</Text>
                  <Input
                    value={selectedElement.title}
                    onChange={(e) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { title: e.target.value });
                      setSelectedElement({ ...selectedElement, title: e.target.value });
                    }}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>Number of Seats</Text>
                  <InputNumber
                    min={1}
                    max={50}
                    value={selectedElement.numberOfSeats}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { numberOfSeats: value });
                      setSelectedElement({ ...selectedElement, numberOfSeats: value });
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>Assign Ticket Category to All Seats</Text>
                  <Select
                    value={selectedElement.ticketCategory}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { ticketCategory: value });
                      setSelectedElement({ ...selectedElement, ticketCategory: value });

                      const section = sections.find(s => s.id === selectedElement.sectionId);
                      const row = section?.rows.find(r => r.id === selectedElement.id);
                      row?.seats.forEach(seat => {
                        updateSeat(selectedElement.sectionId, selectedElement.id, seat.id, { ticketCategory: value });
                      });
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                    options={ticketCategories.map(cat => ({
                      value: cat.id,
                      label: `${cat.name} (₹${cat.price})`
                    }))}
                  />
                </div>

                <div>
                  <Text strong>Row Shape</Text>
                  <Select
                    value={selectedElement.shape}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { shape: value });
                      setSelectedElement({ ...selectedElement, shape: value });
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                    options={[
                      { value: 'straight', label: 'Straight' },
                      { value: 'curved-convex', label: 'Curved (Convex)' },
                      { value: 'curved-concave', label: 'Curved (Concave)' }
                    ]}
                  />
                </div>

                {selectedElement.shape !== 'straight' && (
                  <div>
                    <Text strong>Curve Amount</Text>
                    <Slider
                      min={20}
                      max={100}
                      value={selectedElement.curve || 50}
                      onChange={(value) => {
                        updateRow(selectedElement.sectionId, selectedElement.id, { curve: value });
                        setSelectedElement({ ...selectedElement, curve: value });
                      }}
                      tooltip={{ formatter: (value) => `${value}px` }}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                )}

                <div>
                  <Text strong>Row Spacing</Text>
                  <Slider
                    min={30}
                    max={80}
                    value={selectedElement.spacing}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { spacing: value });
                      setSelectedElement({ ...selectedElement, spacing: value });
                    }}
                    tooltip={{ formatter: (value) => `${value}px` }}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <Text strong>Total Seats in Row:</Text> {selectedElement.seats?.length || 0}
                </div>
              </Space>
            )}

            {/* Seat Editor */}
            {selectedType === 'seat' && selectedElement && (
              <Form layout="vertical" className="editor-form">

                {/* Seat Label */}
                <Form.Item label="Seat Label">
                  <Input
                    value={selectedElement.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { label });
                      setSelectedElement({ ...selectedElement, label });
                    }}
                  />
                </Form.Item>

                {/* Ticket Category */}
                <Form.Item label="Ticket Category">
                  <Select
                    value={selectedElement.ticketCategory}
                    onChange={(value) => {
                      updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { ticketCategory: value });
                      setSelectedElement({ ...selectedElement, ticketCategory: value });
                    }}
                  >
                    {ticketCategories.map(cat => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name} (₹{cat.price})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Seat Status */}
                <Form.Item label="Seat Status">
                  <Radio.Group
                    value={selectedElement.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { status });
                      setSelectedElement({ ...selectedElement, status });
                    }}
                  >
                    <Radio value="available" style={{ display: 'block', marginBottom: 4 }}>
                      Available
                    </Radio>
                    <Radio value="disabled" style={{ display: 'block', marginBottom: 4 }}>
                      Disabled
                    </Radio>
                    <Radio value="reserved" style={{ display: 'block', marginBottom: 4 }}>
                      Reserved
                    </Radio>
                    <Radio value="blocked" style={{ display: 'block', marginBottom: 4 }}>
                      Blocked
                    </Radio>
                  </Radio.Group>
                </Form.Item>


                {/* Info Box */}
                <div className="info-box">
                  <Space align="center">
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      backgroundColor: getSeatColor(selectedElement),
                    }} />
                    <div>
                      <Text strong>Seat:</Text> {selectedElement.label} <br />
                      <Text strong>Status:</Text> {selectedElement.status}
                    </div>
                  </Space>
                </div>

              </Form>
            )}
            
          </div>

          {/* Legend */}
          <div className="legend">
            <h4>Ticket Categories</h4>
            {ticketCategories.map(cat => (
              <div key={cat.id} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name} - ₹{cat.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditoriumLayoutDesigner;
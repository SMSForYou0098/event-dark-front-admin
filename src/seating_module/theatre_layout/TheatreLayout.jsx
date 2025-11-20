// AuditoriumLayoutDesigner.jsx - UPDATED WITH ROW ICON FEATURE
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Transformer, Image as KonvaImage } from 'react-konva';
import { Plus, Trash2, Upload } from 'lucide-react';
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  BorderOutlined,
  DeleteOutlined,
  CopyOutlined,
  SaveOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { FaChair } from 'react-icons/fa';
import { MdOutlineChair, MdOutlineTableBar } from 'react-icons/md';
import { PiArmchairLight, PiChair, PiOfficeChair } from 'react-icons/pi';
import { LuSofa } from 'react-icons/lu';
import { TbSofa } from 'react-icons/tb';
import { GiRoundTable } from 'react-icons/gi';
import { SiTablecheck } from 'react-icons/si';
import './AuditoriumLayoutDesigner.css';
import { Button, Card, Input, message, Radio, Slider, Space } from 'antd';
import { Select, InputNumber, Form } from 'antd';
import { PRIMARY } from 'utils/consts';
import api from 'auth/FetchInterceptor';
import Flex from 'components/shared-components/Flex';
import LeftBar from './components/creation/LeftBar';
const { Option } = Select;

// Icon Image Component - Converts React Icon to Konva Image
const IconImage = ({ iconName, x, y, size = 20 }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!iconName) return;

    const iconMap = {
      'FaChair': FaChair,
      'MdOutlineChair': MdOutlineChair,
      'PiArmchairLight': PiArmchairLight,
      'PiChair': PiChair,
      'PiOfficeChair': PiOfficeChair,
      'LuSofa': LuSofa,
      'TbSofa': TbSofa,
      'GiRoundTable': GiRoundTable,
      'SiTablecheck': SiTablecheck,
      'MdOutlineTableBar': MdOutlineTableBar
    };

    const IconComponent = iconMap[iconName];
    if (!IconComponent) return;

    // Render icon to SVG string
    const svgString = renderToStaticMarkup(
      <IconComponent size={size} color="#FFFFFF" />
    );

    // Create blob and load as image
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [iconName, size]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      listening={false}
    />
  );
};

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

          onTransformEnd({
            x: node.x(),
            y: node.y(),
            width: Math.max(200, stage.width * scaleX),
            height: Math.max(30, stage.height * scaleY)
          });

          // Reset scale after transform
          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        <Rect
          width={stage.width}
          height={stage.height}
          fill="#333"
          stroke={isSelected ? PRIMARY : '#000'}
          strokeWidth={isSelected ? 2 : 1}
        />
        <Text
          width={stage.width}
          y={stage.height / 2 - 10}
          text={stage.name || 'SCREEN'}
          fontSize={18}
          fill="#FFF"
          align="center"
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          borderStroke={PRIMARY}
          anchorStroke={PRIMARY}
          anchorFill={PRIMARY}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
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

          onTransformEnd({
            x: node.x(),
            y: node.y(),
            width: Math.max(200, section.width * scaleX),
            height: Math.max(150, section.height * scaleY)
          });

          // Reset scale after transform
          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        <Rect
          width={section.width}
          height={section.height}
          fill="rgba(200, 200, 200, 0.2)"
          stroke={isSelected ? PRIMARY : '#999'}
          strokeWidth={isSelected ? 2 : 1}
          dash={[5, 5]}
        />
        <Text
          x={10}
          y={10}
          text={section.name}
          fontSize={16}
          fill="#FFFFFF"
          fontStyle="bold"
        />
        {children}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          borderStroke={PRIMARY}
          anchorStroke={PRIMARY}
          anchorFill={PRIMARY}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
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
  // Available seat icons
  const seatIcons = [
    { id: 'chair1', name: 'Chair 1', icon: 'FaChair' },
    { id: 'chair2', name: 'Chair 2', icon: 'MdOutlineChair' },
    { id: 'chair3', name: 'Armchair', icon: 'PiArmchairLight' },
    { id: 'chair4', name: 'Simple Chair', icon: 'PiChair' },
    { id: 'chair5', name: 'Office Chair', icon: 'PiOfficeChair' },
    { id: 'sofa1', name: 'Sofa 1', icon: 'LuSofa' },
    { id: 'sofa2', name: 'Sofa 2', icon: 'TbSofa' },
    { id: 'table1', name: 'Round Table', icon: 'GiRoundTable' },
    { id: 'table2', name: 'Table', icon: 'SiTablecheck' },
    { id: 'table3', name: 'Bar Table', icon: 'MdOutlineTableBar' }
  ];

  // Icon component mapper
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FaChair': FaChair,
      'MdOutlineChair': MdOutlineChair,
      'PiArmchairLight': PiArmchairLight,
      'PiChair': PiChair,
      'PiOfficeChair': PiOfficeChair,
      'LuSofa': LuSofa,
      'TbSofa': TbSofa,
      'GiRoundTable': GiRoundTable,
      'SiTablecheck': SiTablecheck,
      'MdOutlineTableBar': MdOutlineTableBar
    };
    return iconMap[iconName];
  };

  // State Management
  const [stage, setStage] = useState({
    position: 'top',
    shape: 'straight',
    width: 800,
    height: 50,
    x: 100,
    y: 50,
    name: 'SCREEN'
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
  const [showGrid, setShowGrid] = useState(false);
  const [nextSectionId, setNextSectionId] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const stageRef = useRef();
  const layerRef = useRef();

  // Generate unique IDs
  const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
          ticketCategory: ticketCategories[0].id,
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
        ticketCategory: row.ticketCategory,
        status: 'available',
        radius: seatRadius,
        icon: row.defaultIcon || null, // NEW: Inherit row's default icon
        customIcon: false // NEW: Track if seat has custom icon
      });
    }

    return seats;
  };

  // Update Section
  const updateSection = (sectionId, updates) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedSection = { ...section, ...updates };

        // Regenerate seats if width or height changed significantly
        if ((updates.width && Math.abs(updates.width - section.width) > 10) ||
          (updates.height && Math.abs(updates.height - section.height) > 10)) {
          updatedSection.rows = section.rows.map((row, index) => ({
            ...row,
            seats: generateSeatsForRow(row, updatedSection, index)
          }));
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

  // Save Layout to Backend
  const saveLayout = async () => {
    setIsSaving(true);

    const payload = {
      stage,
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

    try {
      const response = await api.post('/auditorium/layout/save', payload);
      const data = await response.json();

      message.success('Layout saved successfully!');
      console.log('Saved layout response:', data);

    } catch (error) {
      message.error(`Failed to save layout`);
    } finally {
      setIsSaving(false);
    }
  };

  // Import Layout
  const importLayout = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const layout = JSON.parse(e.target.result);
          setStage(layout.stage || stage);
          setSections(layout.sections || []);
          setTicketCategories(layout.ticketCategories || ticketCategories);
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

  return (
    <Card title="Auditorium Layout Designer"
      extra={
        <Space>
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
              icon={<SaveOutlined />}
              onClick={saveLayout}
              loading={isSaving}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Save
            </Button>

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
        </Space>
      }
      className="auditorium-designer"
    >

      <div className="designer-content">
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
        />

        {/* Center Canvas */}
        <div className="canvas-container">
          <Stage
            ref={stageRef}
            width={window.innerWidth - 700}
            height={window.innerHeight - 100}
            draggable={true}
            scaleX={canvasScale}
            scaleY={canvasScale}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            onDragEnd={(e) => {
              const pos = e.target.position();
              setStagePosition(pos);
            }}
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
                  const updatedStage = { ...stage, ...pos };
                  setStage(updatedStage);
                  if (selectedType === 'stage') setSelectedElement(updatedStage);
                }}
                onTransformEnd={(transform) => {
                  const updatedStage = { ...stage, ...transform };
                  setStage(updatedStage);
                  if (selectedType === 'stage') setSelectedElement(updatedStage);
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
                    const updatedSection = { ...section, ...pos };
                    updateSection(section.id, pos);
                    if (selectedElement?.id === section.id && selectedType === 'section') setSelectedElement(updatedSection);
                  }}
                  onTransformEnd={(transform) => {
                    const updatedSection = { ...section, ...transform };
                    updateSection(section.id, transform);
                    if (selectedElement?.id === section.id && selectedType === 'section') setSelectedElement(updatedSection);
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
                        fill="#FFFFFF"
                        fontStyle="bold"
                        listening={false}
                      />

                      {row.seats.map(seat => {
                        return (
                          <Group key={seat.id}>
                            <Rect
                              x={seat.x - seat.radius}
                              y={seat.y - seat.radius}
                              width={seat.radius * 2}
                              height={seat.radius * 2}
                              fill={selectedElement?.id === seat.id && selectedType === 'seat' ? '#b51515' : 'transparent'}
                              stroke={selectedElement?.id === seat.id && selectedType === 'seat' ? '#b51515' : '#999'}
                              strokeWidth={selectedElement?.id === seat.id && selectedType === 'seat' ? 2 : 1}
                              cornerRadius={4}
                              onMouseEnter={(e) => {
                                const container = e.target.getStage().container();
                                container.style.cursor = 'pointer';
                              }}
                              onMouseLeave={(e) => {
                                const container = e.target.getStage().container();
                                container.style.cursor = 'default';
                              }}
                              onClick={(e) => {
                                e.cancelBubble = true;
                                setSelectedElement({ ...seat, sectionId: section.id, rowId: row.id });
                                setSelectedType('seat');
                              }}
                            />
                            {seat.icon ? (
                              <IconImage
                                iconName={seat.icon}
                                x={seat.x}
                                y={seat.y}
                                size={seat.radius * 1.2}
                              />
                            ) : (
                              <Text
                                x={seat.x - seat.radius}
                                y={seat.y - 4}
                                width={seat.radius * 2}
                                text={seat.number.toString()}
                                fontSize={10}
                                fill="#FFFFFF"
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                              />
                            )}
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
                        );
                      })}
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
              <Form layout="vertical" className="editor-form">
                <Form.Item label="Stage/Screen Name">
                  <Input
                    value={stage.name}
                    onChange={(e) => {
                      const updatedStage = { ...stage, name: e.target.value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                    placeholder="e.g., SCREEN, STAGE, etc."
                  />
                </Form.Item>

                <Form.Item label="Position">
                  <Select
                    value={stage.position}
                    onChange={(value) => {
                      const updatedStage = { ...stage, position: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                  >
                    <Option value="top">Top</Option>
                    <Option value="bottom">Bottom</Option>
                    <Option value="center">Center</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Shape">
                  <Select
                    value={stage.shape}
                    onChange={(value) => {
                      const updatedStage = { ...stage, shape: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                  >
                    <Option value="straight">Straight</Option>
                    <Option value="curved">Curved</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Width">
                  <InputNumber
                    min={200}
                    value={stage.width}
                    onChange={(value) => {
                      const updatedStage = { ...stage, width: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item label="Height">
                  <InputNumber
                    min={30}
                    value={stage.height}
                    onChange={(value) => {
                      const updatedStage = { ...stage, height: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <div style={{
                  padding: '12px',
                  background: '#f0f7ff',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  💡 Tip: Click and drag the screen to move it. Use corner handles to resize.
                </div>
              </Form>
            )}

            {/* Section Editor */}
            {selectedType === 'section' && selectedElement && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Section Name</div>
                  <Input
                    value={selectedElement.name}
                    onChange={(e) => {
                      updateSection(selectedElement.id, { name: e.target.value });
                      setSelectedElement({ ...selectedElement, name: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Section Type</div>
                  <Select
                    value={selectedElement.type}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { type: value });
                      setSelectedElement({ ...selectedElement, type: value });
                    }}
                    style={{ width: '100%' }}
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
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Width</div>
                  <InputNumber
                    value={selectedElement.width}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { width: value });
                      setSelectedElement({ ...selectedElement, width: value });
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Height</div>
                  <InputNumber
                    value={selectedElement.height}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { height: value });
                      setSelectedElement({ ...selectedElement, height: value });
                    }}
                    style={{ width: '100%' }}
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

                <div>
                  <div><strong>Rows:</strong> {selectedElement.rows.length}</div>
                  <div><strong>Total Seats:</strong> {selectedElement.rows.reduce((total, row) => total + row.seats.length, 0)}</div>
                  <div style={{ marginTop: '8px', color: '#666' }}>
                    <strong>💡 Tip:</strong> Click and drag to move. Use corner handles to resize.
                  </div>
                </div>
              </Space>
            )}

            {/* Row Editor - UPDATED WITH ICON SELECTOR */}
            {selectedType === 'row' && selectedElement && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Title</div>
                  <Input
                    value={selectedElement.title}
                    onChange={(e) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { title: e.target.value });
                      setSelectedElement({ ...selectedElement, title: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Number of Seats</div>
                  <InputNumber
                    min={1}
                    max={50}
                    value={selectedElement.numberOfSeats}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { numberOfSeats: value });
                      setSelectedElement({ ...selectedElement, numberOfSeats: value });
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* NEW: Row Seat Icon Selector */}
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Seat Icon</div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    Apply icon to all seats (except custom ones)
                  </div>
                  <Space wrap size={8}>
                    {/* Default numeric seat */}
                    <div
                      onClick={() => {
                        // Update all sections at once
                        setSections(sections.map(section => {
                          if (section.id === selectedElement.sectionId) {
                            return {
                              ...section,
                              rows: section.rows.map(row => {
                                if (row.id === selectedElement.id) {
                                  return {
                                    ...row,
                                    defaultIcon: null,
                                    seats: row.seats.map(seat =>
                                      seat.customIcon ? seat : { ...seat, icon: null }
                                    )
                                  };
                                }
                                return row;
                              })
                            };
                          }
                          return section;
                        }));
                        setSelectedElement({ ...selectedElement, defaultIcon: null });
                      }}
                      className='border-secondary'
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: !selectedElement.defaultIcon ? 'var(--primary-color)' : 'transparent',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                      title="Default (Numbers)"
                    >
                      1
                    </div>

                    {/* Icon options */}
                    {seatIcons.map(iconObj => {
                      const IconComponent = getIconComponent(iconObj.icon);
                      const isActive = selectedElement.defaultIcon === iconObj.icon;

                      return (
                        <div
                          key={iconObj.id}
                          className='border-secondary'
                          onClick={() => {
                            // Update all sections at once
                            setSections(sections.map(section => {
                              if (section.id === selectedElement.sectionId) {
                                return {
                                  ...section,
                                  rows: section.rows.map(row => {
                                    if (row.id === selectedElement.id) {
                                      return {
                                        ...row,
                                        defaultIcon: iconObj.icon,
                                        seats: row.seats.map(seat =>
                                          seat.customIcon ? seat : { ...seat, icon: iconObj.icon }
                                        )
                                      };
                                    }
                                    return row;
                                  })
                                };
                              }
                              return section;
                            }));
                            setSelectedElement({ ...selectedElement, defaultIcon: iconObj.icon });
                          }}
                          style={{
                            width: 48,
                            height: 48,
                            border: isActive
                              ? '2px solid var(--primary-color)'
                              : '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isActive ? 'var(--primary-color)' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                          title={iconObj.name}
                        >
                          <IconComponent />
                        </div>
                      );
                    })}
                  </Space>
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Assign Ticket Category to All Seats</div>
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
                    style={{ width: '100%' }}
                    options={ticketCategories.map(cat => ({
                      value: cat.id,
                      label: `${cat.name} (₹${cat.price})`
                    }))}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Shape</div>
                  <Select
                    value={selectedElement.shape}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { shape: value });
                      setSelectedElement({ ...selectedElement, shape: value });
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'straight', label: 'Straight' },
                      { value: 'curved-convex', label: 'Curved (Convex)' },
                      { value: 'curved-concave', label: 'Curved (Concave)' }
                    ]}
                  />
                </div>

                {selectedElement.shape !== 'straight' && (
                  <div>
                    <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Curve Amount</div>
                    <Slider
                      min={20}
                      max={100}
                      value={selectedElement.curve || 50}
                      onChange={(value) => {
                        updateRow(selectedElement.sectionId, selectedElement.id, { curve: value });
                        setSelectedElement({ ...selectedElement, curve: value });
                      }}
                      tooltip={{ formatter: (value) => `${value}px` }}
                    />
                  </div>
                )}

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Spacing</div>
                  <Slider
                    min={30}
                    max={80}
                    value={selectedElement.spacing}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { spacing: value });
                      setSelectedElement({ ...selectedElement, spacing: value });
                    }}
                    tooltip={{ formatter: (value) => `${value}px` }}
                  />
                </div>

                <div style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <div><strong>Total Seats in Row:</strong> {selectedElement.seats?.length || 0}</div>
                  {selectedElement.seats && selectedElement.seats.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <strong>Seat Size:</strong> {selectedElement.seats[0].radius}px radius
                      {selectedElement.seats[0].radius < 8 && (
                        <div style={{ color: '#ff9800', marginTop: '4px', fontSize: '12px' }}>
                          ⚠️ Seats are small due to limited space. Consider reducing seat count or increasing section width.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Space>
            )}

            {/* Seat Editor - UPDATED TO MARK CUSTOM ICONS */}
            {selectedType === 'seat' && selectedElement && (
              <Form layout="vertical" className="editor-form">
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

                <Form.Item label="Seat Icon">
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    Setting a custom icon will prevent row-level icon changes from affecting this seat
                  </div>
                  <Space wrap size={8}>
                    {/* Default numeric seat */}
                    <div
                      onClick={() => {
                        updateSeat(
                          selectedElement.sectionId,
                          selectedElement.rowId,
                          selectedElement.id,
                          { icon: null, customIcon: true }
                        );
                        setSelectedElement({ ...selectedElement, icon: null, customIcon: true });
                      }}
                      className='border-secondary'
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: !selectedElement.icon ? 'var(--primary-color)' : 'transparent',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {selectedElement.number}
                    </div>

                    {/* Icon options */}
                    {seatIcons.map(iconObj => {
                      const IconComponent = getIconComponent(iconObj.icon);
                      const isActive = selectedElement.icon === iconObj.icon;

                      return (
                        <div
                          key={iconObj.id}
                          className='border-secondary'
                          onClick={() => {
                            updateSeat(
                              selectedElement.sectionId,
                              selectedElement.rowId,
                              selectedElement.id,
                              { icon: iconObj.icon, customIcon: true }
                            );
                            setSelectedElement({ ...selectedElement, icon: iconObj.icon, customIcon: true });
                          }}
                          style={{
                            width: 48,
                            height: 48,
                            border: isActive
                              ? '2px solid var(--primary-color)'
                              : '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isActive ? 'var(--primary-color)' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                          title={iconObj.name}
                        >
                          <IconComponent />
                        </div>
                      );
                    })}
                  </Space>
                  {selectedElement.customIcon && (
                    <div className='text-warning'>
                      <WarningOutlined /> This seat has a custom icon and won't be affected by row-level icon changes
                    </div>
                  )}
                </Form.Item>


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

                <div className="info-box">
                  <Space align="center">
                    <div style={{
                      width: 30,
                      height: 30,
                      border: '1px solid #999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      {selectedElement.icon ? (() => {
                        const IconComponent = getIconComponent(selectedElement.icon);
                        return <IconComponent />;
                      })() : selectedElement.number}
                    </div>
                    <div>
                      <strong>Seat:</strong> {selectedElement.label} <br />
                      <strong>Status:</strong> {selectedElement.status}
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
    </Card>
  );
};

export default AuditoriumLayoutDesigner;

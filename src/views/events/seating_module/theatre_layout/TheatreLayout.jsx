// AuditoriumLayoutDesigner.jsx - UPDATED WITH ROW ICON FEATURE
import React, { useRef, useState } from 'react';
import {PlusOutlined,ZoomInOutlined,ZoomOutOutlined,BorderOutlined,SaveOutlined} from '@ant-design/icons';
import { Button, Card, Col, message, Row, Space } from 'antd';
import api from 'auth/FetchInterceptor';
import LeftBar from './components/creation/LeftBar';
import CenterCanvas from './components/creation/CenterCanvas';
import RightPanel from './components/creation/RightPanel';

const AuditoriumLayoutDesigner = () => {

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
  // const importLayout = (event) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       try {
  //         const layout = JSON.parse(e.target.result);
  //         setStage(layout.stage || stage);
  //         setSections(layout.sections || []);
  //         setTicketCategories(layout.ticketCategories || ticketCategories);
  //       } catch (error) {
  //         alert('Invalid layout file');
  //       }
  //     };
  //     reader.readAsText(file);
  //   }
  // };

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

            {/* <Button
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
            </Upload> */}
          </div>
        </Space>
      }
      className="auditorium-designer"
    >

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
          updateSection={updateSection}
          selectedType={selectedType}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          setSelectedType={setSelectedType}
          handleCanvasClick={handleCanvasClick}
          handleWheel={handleWheel}
          setStagePosition={setStagePosition}
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
        />
        </Col>
      </Row>
    </Card>
  );
};

export default AuditoriumLayoutDesigner;

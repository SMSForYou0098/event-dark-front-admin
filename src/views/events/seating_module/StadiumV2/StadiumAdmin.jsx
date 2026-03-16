/**
 * StadiumAdmin - Main Admin Page for Stadium Layout Management
 * 
 * Schema: Stadium → Stands → Tiers → Sections → Rows → Seats
 * 
 * Features:
 * - Split view: Builder on left, Preview on right
 * - Create new stadium or edit existing
 * - Live preview updates
 * - Drill-down preview (Stand → Tier → Section → Seats)
 * - Ticket assignment at any level
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Row, Col, Card, Button, Space, Typography, Breadcrumb, Tag, message, Drawer, Grid, Segmented, FloatButton, Select } from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  EyeOutlined,
  EditOutlined,
  TagOutlined,
  MenuOutlined,
  SettingOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import StadiumBuilder from './components/StadiumBuilder';
import StadiumCanvas from './components/StadiumCanvas';
import SeatsCanvas from './components/SeatsCanvas';
import TicketAssignment from './components/TicketAssignment';
import { EMPTY_STADIUM } from './api/mockData';
import { DUMMY_EVENTS } from './api/ticketData';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const createBlankStadium = () => ({
  ...EMPTY_STADIUM,
  id: `stadium-${Date.now()}`,
  stands: [],
  rings: [],
});

const StadiumAdmin = () => {
  // Responsive breakpoints
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // Stadium data - using proper hierarchical schema
  const [stadium, setStadium] = useState(() => createBlankStadium());

  // Mobile drawer state
  const [mobileBuilderDrawer, setMobileBuilderDrawer] = useState(false);

  // Event selection for ticket assignment
  const [selectedEventId, setSelectedEventId] = useState(DUMMY_EVENTS[0]?.id || null);

  // View state
  const [viewMode, setViewMode] = useState('builder'); // 'builder' | 'preview'
  
  // Drill-down: stands → tiers → sections → seats
  const [viewLevel, setViewLevel] = useState('stands'); // 'stands' | 'tiers' | 'sections' | 'seats'
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  
  const [loading, setLoading] = useState(false);

  // Ticket assignment state
  const [showTicketAssignment, setShowTicketAssignment] = useState(false);
  const [ticketAssignmentTarget, setTicketAssignmentTarget] = useState(null);

  // Selected seats for preview
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Calculate capacity
  const totalCapacity = useMemo(() => {
    let total = 0;
    for (const stand of stadium?.stands || []) {
      for (const tier of stand.tiers || []) {
        for (const section of tier.sections || []) {
          for (const row of section.rows || []) {
            total += row.seatCount || row.seats?.length || 0;
          }
        }
      }
    }
    return total;
  }, [stadium]);

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const items = [{ title: 'Stadium', onClick: () => resetPreview() }];
    
    if (selectedStand) {
      items.push({ 
        title: selectedStand.name, 
        onClick: () => {
          setViewLevel('tiers');
          setSelectedTier(null);
          setSelectedSection(null);
        }
      });
    }

    if (selectedTier) {
      items.push({ 
        title: selectedTier.name,
        onClick: () => {
          setViewLevel('sections');
          setSelectedSection(null);
        }
      });
    }

    if (selectedSection) {
      items.push({ title: selectedSection.name });
    }
    
    return items;
  }, [selectedStand, selectedTier, selectedSection]);

  // Reset preview to top level
  const resetPreview = useCallback(() => {
    setViewLevel('stands');
    setSelectedStand(null);
    setSelectedTier(null);
    setSelectedSection(null);
    setSelectedSeats([]);
  }, []);

  // Handle stand click
  const handleStandClick = useCallback((stand) => {
    setSelectedStand(stand);
    setViewLevel('tiers');
    setSelectedTier(null);
    setSelectedSection(null);
  }, []);

  // Handle tier click
  const handleTierClick = useCallback((tier, parentStand) => {
    if (parentStand) setSelectedStand(parentStand);
    setSelectedTier(tier);
    setViewLevel('sections');
    setSelectedSection(null);
  }, []);

  // Handle section click - show seats
  const handleSectionClick = useCallback((section, parentTier, parentStand) => {
    if (parentStand) setSelectedStand(parentStand);
    if (parentTier) setSelectedTier(parentTier);
    setSelectedSection(section);
    setViewLevel('seats');
    setSelectedSeats([]);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (viewLevel === 'seats') {
      setViewLevel('sections');
      setSelectedSection(null);
      setSelectedSeats([]);
    } else if (viewLevel === 'sections') {
      setViewLevel('tiers');
      setSelectedTier(null);
    } else if (viewLevel === 'tiers') {
      setViewLevel('stands');
      setSelectedStand(null);
    }
  }, [viewLevel]);

  // Save stadium
  const handleSave = useCallback(async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    message.success('Stadium saved successfully!');
    setLoading(false);
    
    // In real app, this would be:
    // await axios.post('/api/stadiums', stadium);
  }, [stadium]);

  // Create new stadium
  const handleCreateNew = useCallback(() => {
    setStadium(createBlankStadium());
    resetPreview();
    message.info('Creating new stadium');
  }, [resetPreview]);

  // Open ticket assignment
  const openTicketAssignment = useCallback((level, target, standId, tierId, sectionId) => {
    // Find parent items
    const stand = stadium.stands.find(s => s.id === standId) || null;
    const tier = stand?.tiers.find(t => t.id === tierId) || null;
    const section = tier?.sections.find(s => s.id === sectionId) || null;

    setTicketAssignmentTarget({ 
      level, 
      target, 
      parentPath: { stand, tier, section } 
    });
    setShowTicketAssignment(true);
  }, [stadium]);

  // Handle ticket assignment
  const handleTicketAssign = useCallback((assignment) => {
    const { level, target, parentPath } = ticketAssignmentTarget;
    const { ticketId, icon, mode, eventId } = assignment;

    // Update the stadium with the ticket assignment
    const updateItem = (item) => ({
      ...item,
      ticketId,
      icon,
      eventId,
    });

    const updateChildren = (item, depth) => {
      const updated = updateItem(item);
      
      if (mode === 'cascade') {
        if (depth === 'stand' && updated.tiers) {
          updated.tiers = updated.tiers.map(t => updateChildren(t, 'tier'));
        }
        if ((depth === 'stand' || depth === 'tier') && updated.sections) {
          updated.sections = updated.sections.map(s => updateChildren(s, 'section'));
        }
        if ((depth === 'stand' || depth === 'tier' || depth === 'section') && updated.rows) {
          updated.rows = updated.rows.map(r => updateItem(r));
        }
      }
      
      return updated;
    };

    setStadium(prev => {
      const newStadium = { ...prev };
      
      if (level === 'stand') {
        newStadium.stands = prev.stands.map(s => 
          s.id === target.id ? updateChildren(s, 'stand') : s
        );
      } else if (level === 'tier') {
        newStadium.stands = prev.stands.map(s => 
          s.id === parentPath.stand?.id 
            ? {
                ...s,
                tiers: s.tiers.map(t => 
                  t.id === target.id ? updateChildren(t, 'tier') : t
                )
              }
            : s
        );
      } else if (level === 'section') {
        newStadium.stands = prev.stands.map(s => 
          s.id === parentPath.stand?.id 
            ? {
                ...s,
                tiers: s.tiers.map(t => 
                  t.id === parentPath.tier?.id
                    ? {
                        ...t,
                        sections: t.sections.map(sec => 
                          sec.id === target.id ? updateChildren(sec, 'section') : sec
                        )
                      }
                    : t
                )
              }
            : s
        );
      } else if (level === 'row') {
        newStadium.stands = prev.stands.map(s => 
          s.id === parentPath.stand?.id 
            ? {
                ...s,
                tiers: s.tiers.map(t => 
                  t.id === parentPath.tier?.id
                    ? {
                        ...t,
                        sections: t.sections.map(sec => 
                          sec.id === parentPath.section?.id
                            ? {
                                ...sec,
                                rows: sec.rows.map(r => 
                                  r.id === target.id ? updateItem(r) : r
                                )
                              }
                            : sec
                        )
                      }
                    : t
                )
              }
            : s
        );
      }
      
      return newStadium;
    });

    setShowTicketAssignment(false);
    message.success(`Ticket assigned to ${level}: ${target.name || target.label}`);
  }, [ticketAssignmentTarget]);

  // Calculate canvas dimensions based on view mode and screen size
  const canvasSize = useMemo(() => {
    if (isMobile) {
      const mobileWidth = Math.min(window.innerWidth - 32, 400);
      return { width: mobileWidth, height: mobileWidth };
    }
    if (isTablet) {
      return { width: 450, height: 450 };
    }
    if (viewMode === 'preview') {
      return { width: 700, height: 700 };
    }
    return { width: 500, height: 500 };
  }, [viewMode, isMobile, isTablet]);

  // Render preview content based on level - memoized callback
  const renderPreviewContent = useCallback(() => {
    if (viewLevel === 'seats' && selectedSection) {
      return (
        <SeatsCanvas
          section={selectedSection}
          tier={selectedTier}
          stand={selectedStand}
          eventId={selectedEventId}
          selectedSeats={selectedSeats}
          onSelectionChange={setSelectedSeats}
          isAdmin={true}
          width={viewMode === 'preview' ? 700 : 500}
          height={viewMode === 'preview' ? 500 : 400}
        />
      );
    }

    if (!stadium?.stands?.length) {
      return (
        <div style={{ 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.5)',
          padding: 40,
        }}>
          <Title level={4} style={{ color: 'inherit' }}>
            No stands yet
          </Title>
          <Text style={{ color: 'inherit' }}>
            Add stands using the builder panel
          </Text>
        </div>
      );
    }

    return (
      <StadiumCanvas
        stadium={stadium}
        width={canvasSize.width}
        height={canvasSize.height}
        viewLevel={viewLevel}
        selectedStand={selectedStand}
        selectedTier={selectedTier}
        onStandClick={handleStandClick}
        onTierClick={handleTierClick}
        onSectionClick={handleSectionClick}
      />
    );
  }, [viewLevel, selectedSection, selectedTier, selectedStand, selectedEventId, selectedSeats, viewMode, canvasSize, stadium, handleStandClick, handleTierClick, handleSectionClick]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      padding: isMobile ? 12 : 24,
    }}>
      {/* Header */}
      <Card
        style={{
          marginBottom: isMobile ? 12 : 24,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        bodyStyle={{ padding: isMobile ? '12px 16px' : '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} sm={24} md={12} lg={10}>
            <Space size={isMobile ? 'small' : 'large'} wrap>
              <Title level={isMobile ? 5 : 3} style={{ margin: 0, color: '#fff', whiteSpace: 'nowrap' }}>
                🏟️ {isMobile ? 'Stadium' : 'Stadium Builder Version 2'}
              </Title>
              <Tag color="blue" style={{ fontSize: isMobile ? 11 : 14 }}>
                {stadium?.name || 'Untitled'}
              </Tag>
              <Tag style={{ fontSize: isMobile ? 11 : 14 }}>
                {totalCapacity.toLocaleString()} seats
              </Tag>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={12} lg={14}>
            {/* Desktop Controls */}
            {!isMobile ? (
              <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
                {/* Event Selection */}
                Select Event
                <Select
                  value={selectedEventId}
                  onChange={setSelectedEventId}
                  style={{ minWidth: 200 }}
                  size={isTablet ? 'small' : 'middle'}
                  placeholder="Select Event"
                  suffixIcon={<CalendarOutlined />}
                >
                  {DUMMY_EVENTS.map(event => (
                    <Select.Option key={event.id} value={event.id}>
                      {event.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button onClick={handleCreateNew} size={isTablet ? 'small' : 'middle'}>
                  New
                </Button>
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  size={isTablet ? 'small' : 'middle'}
                  options={[
                    { label: 'Builder', value: 'builder', icon: <EditOutlined /> },
                    { label: 'Preview', value: 'preview', icon: <EyeOutlined /> },
                  ]}
                />
              </Space>
            ) : (
              /* Mobile Controls */
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Segmented
                  value={viewMode}
                  onChange={(val) => {
                    setViewMode(val);
                    if (val === 'builder') setMobileBuilderDrawer(true);
                  }}
                  size="small"
                  options={[
                    { label: <EditOutlined />, value: 'builder' },
                    { label: <EyeOutlined />, value: 'preview' },
                  ]}
                />
                <Button size="small" onClick={handleCreateNew}>New</Button>
              </Space>
            )}
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row gutter={isMobile ? 12 : 24}>
        {/* Builder Panel - Now full width since it has its own canvas */}
        {!isMobile && (viewMode === 'split' || viewMode === 'builder') && (
          <Col span={24}>
            <Card
              style={{
                height: isTablet ? 'calc(100vh - 160px)' : 'calc(100vh - 180px)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              bodyStyle={{ padding: 0, height: '100%' }}
            >
              <StadiumBuilder
                stadium={stadium}
                onChange={setStadium}
                onSave={handleSave}
                onPreview={() => setViewMode('preview')}
                loading={loading}
                onAssignTicket={openTicketAssignment}
                isMobile={isMobile}
              />
            </Card>
          </Col>
        )}

        {/* Preview Panel - Only shown in preview mode */}
        {(viewMode === 'preview' || isMobile) && (
          <Col span={24}>
            <Card
              style={{
                height: isMobile ? 'calc(100vh - 200px)' : isTablet ? 'calc(100vh - 160px)' : 'calc(100vh - 180px)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              bodyStyle={{ 
                padding: isMobile ? 8 : 16, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Preview Header */}
              <div style={{ marginBottom: isMobile ? 8 : 16 }}>
                <Space 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8
                  }}
                  direction={isMobile ? 'vertical' : 'horizontal'}
                >
                  <Space wrap size={isMobile ? 4 : 8}>
                    {viewLevel !== 'stands' && (
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                        size="small"
                      >
                        Back
                      </Button>
                    )}
                    <Breadcrumb
                      separator={isMobile ? '/' : undefined}
                      items={breadcrumbPath.map((item, i) => ({
                        title: (
                          <span
                            onClick={item.onClick}
                            style={{ 
                              cursor: item.onClick ? 'pointer' : 'default',
                              color: i === breadcrumbPath.length - 1 ? '#fff' : 'rgba(255,255,255,0.5)',
                              fontSize: isMobile ? 12 : 14,
                            }}
                          >
                            {isMobile && item.title.length > 10 ? item.title.slice(0, 8) + '...' : item.title}
                          </span>
                        ),
                      }))}
                    />
                  </Space>
                  <Space wrap size={4}>
                    {/* Ticket assignment button based on level */}
                    {viewLevel === 'tiers' && selectedStand && (
                      <Button
                        size="small"
                        icon={<TagOutlined />}
                        onClick={() => openTicketAssignment('stand', selectedStand, selectedStand.id)}
                      >
                        {isMobile ? 'Assign' : 'Assign to Stand'}
                      </Button>
                    )}
                    {viewLevel === 'sections' && selectedTier && (
                      <Button
                        size="small"
                        icon={<TagOutlined />}
                        onClick={() => openTicketAssignment('tier', selectedTier, selectedStand?.id, selectedTier.id)}
                      >
                        {isMobile ? 'Assign' : 'Assign to Tier'}
                      </Button>
                    )}
                    {viewLevel === 'seats' && selectedSection && (
                      <Button
                        size="small"
                        icon={<TagOutlined />}
                        onClick={() => openTicketAssignment('section', selectedSection, selectedStand?.id, selectedTier?.id, selectedSection.id)}
                      >
                        {isMobile ? 'Assign' : 'Assign to Section'}
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<HomeOutlined />}
                      onClick={resetPreview}
                    >
                      {isMobile ? '' : 'Reset View'}
                    </Button>
                  </Space>
                </Space>
              </div>

              {/* Canvas */}
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'auto',
              }}>
                {renderPreviewContent()}
              </div>

              {/* Preview Legend */}
              <div style={{ 
                marginTop: isMobile ? 8 : 16, 
                padding: isMobile ? '8px 12px' : '12px 16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
              }}>
                <Space wrap size={isMobile ? 4 : 8}>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 14 }}>
                    {viewLevel === 'stands' && (isMobile ? 'Tap stand → tiers' : 'Click a stand to view its tiers')}
                    {viewLevel === 'tiers' && (isMobile ? 'Tap tier → sections' : 'Click a tier to view its sections')}
                    {viewLevel === 'sections' && (isMobile ? 'Tap section → seats' : 'Click a section to view seats')}
                    {viewLevel === 'seats' && `Viewing ${selectedSection?.name}`}
                  </Text>
                  {!isMobile && (
                    <>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">Scroll to zoom</Text>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">Drag to pan</Text>
                    </>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Mobile Builder Drawer */}
      {isMobile && (
        <Drawer
          title="Stadium Builder"
          placement="bottom"
          height="85%"
          open={mobileBuilderDrawer}
          onClose={() => setMobileBuilderDrawer(false)}
          bodyStyle={{ padding: 0, background: '#1a1a2e' }}
          headerStyle={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <StadiumBuilder
            stadium={stadium}
            onChange={setStadium}
            onSave={handleSave}
            onPreview={() => {
              setViewMode('preview');
              setMobileBuilderDrawer(false);
            }}
            loading={loading}
            onAssignTicket={openTicketAssignment}
            isMobile={true}
          />
        </Drawer>
      )}

      {/* Mobile FAB to open builder */}
      {isMobile && viewMode === 'preview' && (
        <FloatButton
          icon={<SettingOutlined />}
          type="primary"
          onClick={() => setMobileBuilderDrawer(true)}
          style={{ bottom: 90 }}
          tooltip="Open Builder"
        />
      )}

      {/* Ticket Assignment Drawer */}
      <Drawer
        title="Assign Ticket"
        placement={isMobile ? 'bottom' : 'right'}
        width={isMobile ? '100%' : 400}
        height={isMobile ? '70%' : undefined}
        open={showTicketAssignment}
        onClose={() => setShowTicketAssignment(false)}
        bodyStyle={{ padding: 0, background: '#1a1a2e' }}
        headerStyle={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        {ticketAssignmentTarget && (
          <TicketAssignment
            level={ticketAssignmentTarget.level}
            target={ticketAssignmentTarget.target}
            parentPath={ticketAssignmentTarget.parentPath}
            selectedEventId={selectedEventId}
            onAssign={handleTicketAssign}
            onClose={() => setShowTicketAssignment(false)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default StadiumAdmin;

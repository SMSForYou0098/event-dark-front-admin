/**
 * EventSeatingManager - Organizer's Event Seating Configuration
 * 
 * Purpose: For organizers to configure seating for their events
 * 
 * Flow:
 * 1. Select an existing layout OR create new one
 * 2. Assign tickets to stands/tiers/sections/rows
 * 3. Configure pricing and availability
 * 4. Save event seating configuration
 * 
 * Route: /events/:eventId/seating or /organizer/events/:eventId/seating
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Space, Typography, Tag, message, 
  Drawer, Grid, Steps, Spin, Empty,
  Breadcrumb,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  TagOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  LayoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutSelector from './LayoutSelector';
import StadiumCanvas from '../components/StadiumCanvas';
import SeatsCanvas from '../components/SeatsCanvas';
import TicketAssignment from '../components/TicketAssignment';
import { DUMMY_EVENTS } from '../api/ticketData';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

// Steps for the seating configuration wizard
const STEPS = [
  { title: 'Select Layout', icon: <LayoutOutlined /> },
  { title: 'Assign Tickets', icon: <TagOutlined /> },
  { title: 'Review & Save', icon: <CheckCircleOutlined /> },
];

const EventSeatingManager = ({
  eventId: propEventId,
  onSave: propOnSave,
  onBack: propOnBack,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const { eventId: paramEventId } = useParams();
  const eventId = propEventId || paramEventId;

  // Responsive breakpoints
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Selected event and layout
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [eventSeatingConfig, setEventSeatingConfig] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // View state for ticket assignment
  const [viewLevel, setViewLevel] = useState('stands');
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Ticket assignment drawer
  const [showTicketAssignment, setShowTicketAssignment] = useState(false);
  const [ticketAssignmentTarget, setTicketAssignmentTarget] = useState(null);

  // Load event data
  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  const loadEventData = async (id) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.get(`/events/${id}/seating`);
      
      // Simulated
      await new Promise(resolve => setTimeout(resolve, 500));
      const event = DUMMY_EVENTS.find(e => e.id === id) || DUMMY_EVENTS[0];
      setSelectedEvent(event);
      
      // If event already has seating config, load it
      // setEventSeatingConfig(response.data.seatingConfig);
      // setSelectedLayout(response.data.layout);
    } catch (error) {
      message.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate capacity from layout
  const totalCapacity = useMemo(() => {
    if (!selectedLayout) return 0;
    let total = 0;
    for (const stand of selectedLayout?.stands || []) {
      for (const tier of stand.tiers || []) {
        for (const section of tier.sections || []) {
          for (const row of section.rows || []) {
            total += row.seatCount || row.seats?.length || 0;
          }
        }
      }
    }
    return total;
  }, [selectedLayout]);

  // Breadcrumb for ticket assignment view
  const breadcrumbPath = useMemo(() => {
    const items = [{ title: 'Stadium', onClick: () => resetView() }];
    
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStand, selectedTier, selectedSection]);

  // Reset view
  const resetView = useCallback(() => {
    setViewLevel('stands');
    setSelectedStand(null);
    setSelectedTier(null);
    setSelectedSection(null);
    setSelectedSeats([]);
  }, []);

  // Navigation handlers
  const handleStandClick = useCallback((stand) => {
    setSelectedStand(stand);
    setViewLevel('tiers');
    setSelectedTier(null);
    setSelectedSection(null);
  }, []);

  const handleTierClick = useCallback((tier, parentStand) => {
    if (parentStand) setSelectedStand(parentStand);
    setSelectedTier(tier);
    setViewLevel('sections');
    setSelectedSection(null);
  }, []);

  const handleSectionClick = useCallback((section, parentTier, parentStand) => {
    if (parentStand) setSelectedStand(parentStand);
    if (parentTier) setSelectedTier(parentTier);
    setSelectedSection(section);
    setViewLevel('seats');
    setSelectedSeats([]);
  }, []);

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

  // Open ticket assignment
  const openTicketAssignment = useCallback((level, target, standId, tierId, sectionId) => {
    const stand = selectedLayout?.stands?.find(s => s.id === standId) || null;
    const tier = stand?.tiers?.find(t => t.id === tierId) || null;
    const section = tier?.sections?.find(s => s.id === sectionId) || null;

    setTicketAssignmentTarget({ 
      level, 
      target, 
      parentPath: { stand, tier, section } 
    });
    setShowTicketAssignment(true);
  }, [selectedLayout]);

  // Handle ticket assignment
  const handleTicketAssign = useCallback((assignment) => {
    const { level, target, parentPath } = ticketAssignmentTarget;
    const { ticketId, icon, mode, eventId } = assignment;

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

    setSelectedLayout(prev => {
      const newLayout = { ...prev };
      
      if (level === 'stand') {
        newLayout.stands = prev.stands.map(s => 
          s.id === target.id ? updateChildren(s, 'stand') : s
        );
      } else if (level === 'tier') {
        newLayout.stands = prev.stands.map(s => 
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
        newLayout.stands = prev.stands.map(s => 
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
        newLayout.stands = prev.stands.map(s => 
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
      
      return newLayout;
    });

    setShowTicketAssignment(false);
    message.success(`Ticket assigned to ${level}: ${target.name || target.label}`);
  }, [ticketAssignmentTarget]);

  // Handle layout selection
  const handleLayoutSelect = useCallback((layout) => {
    setSelectedLayout(layout);
    message.success(`Layout "${layout.name}" selected`);
  }, []);

  // Save event seating configuration
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const config = {
        eventId: selectedEvent?.id,
        layoutId: selectedLayout?.id,
        layout: selectedLayout,
        configuredAt: new Date().toISOString(),
      };

      if (propOnSave) {
        await propOnSave(config);
      } else {
        // TODO: Replace with actual API call
        // await api.post(`/events/${eventId}/seating`, config);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setEventSeatingConfig(config);
      message.success('Seating configuration saved!');
      setCurrentStep(2); // Move to review step
    } catch (error) {
      message.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, [selectedEvent, selectedLayout, propOnSave]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (currentStep === 0 && !selectedLayout) {
      message.warning('Please select a layout first');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }, [currentStep, selectedLayout]);

  // Go to previous step
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Go back
  const handleGoBack = useCallback(() => {
    if (propOnBack) propOnBack();
    else navigate(-1);
  }, [propOnBack, navigate]);

  // Canvas dimensions
  const canvasSize = useMemo(() => {
    if (isMobile) {
      const mobileWidth = Math.min(window.innerWidth - 32, 400);
      return { width: mobileWidth, height: mobileWidth };
    }
    if (isTablet) {
      return { width: 450, height: 450 };
    }
    return { width: 600, height: 600 };
  }, [isMobile, isTablet]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <LayoutSelector
            onSelect={handleLayoutSelect}
            onCreateNew={() => navigate('/admin/layouts/new')}
            selectedLayoutId={selectedLayout?.id}
            title="Step 1: Select Stadium Layout"
          />
        );

      case 1:
        return renderTicketAssignmentStep();

      case 2:
        return renderReviewStep();

      default:
        return null;
    }
  };

  // Render ticket assignment step
  const renderTicketAssignmentStep = () => {
    if (!selectedLayout) {
      return (
        <Card
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Empty description="No layout selected. Go back and select a layout." />
        </Card>
      );
    }

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            bodyStyle={{ padding: isMobile ? 12 : 20 }}
          >
            {/* Navigation Header */}
            <div style={{ marginBottom: 16 }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  {viewLevel !== 'stands' && (
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBack} size="small">
                      Back
                    </Button>
                  )}
                  <Breadcrumb
                    items={breadcrumbPath.map((item, i) => ({
                      title: (
                        <span
                          onClick={item.onClick}
                          style={{ 
                            cursor: item.onClick ? 'pointer' : 'default',
                            color: i === breadcrumbPath.length - 1 ? '#fff' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {item.title}
                        </span>
                      ),
                    }))}
                  />
                </Space>
                <Space>
                  {/* Context-aware ticket assignment button */}
                  {viewLevel === 'tiers' && selectedStand && (
                    <Button
                      size="small"
                      icon={<TagOutlined />}
                      onClick={() => openTicketAssignment('stand', selectedStand, selectedStand.id)}
                    >
                      Assign to Stand
                    </Button>
                  )}
                  {viewLevel === 'sections' && selectedTier && (
                    <Button
                      size="small"
                      icon={<TagOutlined />}
                      onClick={() => openTicketAssignment('tier', selectedTier, selectedStand?.id, selectedTier.id)}
                    >
                      Assign to Tier
                    </Button>
                  )}
                  {viewLevel === 'seats' && selectedSection && (
                    <Button
                      size="small"
                      icon={<TagOutlined />}
                      onClick={() => openTicketAssignment('section', selectedSection, selectedStand?.id, selectedTier?.id, selectedSection.id)}
                    >
                      Assign to Section
                    </Button>
                  )}
                  <Button size="small" icon={<HomeOutlined />} onClick={resetView}>
                    Reset
                  </Button>
                </Space>
              </Space>
            </div>

            {/* Canvas */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 400,
            }}>
              {viewLevel === 'seats' && selectedSection ? (
                <SeatsCanvas
                  section={selectedSection}
                  tier={selectedTier}
                  stand={selectedStand}
                  eventId={selectedEvent?.id}
                  selectedSeats={selectedSeats}
                  onSelectionChange={setSelectedSeats}
                  isAdmin={true}
                  width={canvasSize.width}
                  height={400}
                />
              ) : (
                <StadiumCanvas
                  stadium={selectedLayout}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  viewLevel={viewLevel}
                  selectedStand={selectedStand}
                  selectedTier={selectedTier}
                  onStandClick={handleStandClick}
                  onTierClick={handleTierClick}
                  onSectionClick={handleSectionClick}
                  mode="assignment" // Show ticket assignments
                />
              )}
            </div>

            {/* Help text */}
            <div style={{ 
              marginTop: 16, 
              padding: '12px 16px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
            }}>
              <Text type="secondary">
                {viewLevel === 'stands' && 'Click a stand to view its tiers and assign tickets'}
                {viewLevel === 'tiers' && 'Click a tier to view sections, or assign ticket to entire stand'}
                {viewLevel === 'sections' && 'Click a section to view seats, or assign ticket to entire tier'}
                {viewLevel === 'seats' && 'Assign tickets to individual seats or entire section'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // Render review step
  const renderReviewStep = () => {
    return (
      <Card
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
          <Title level={3} style={{ color: '#fff' }}>
            Configuration Complete!
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 24 }}>
            Your event seating has been configured successfully.
          </Text>
          
          <Space direction="vertical" size="large">
            <div>
              <Text strong style={{ color: '#fff' }}>Event: </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedEvent?.name}</Text>
            </div>
            <div>
              <Text strong style={{ color: '#fff' }}>Layout: </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedLayout?.name}</Text>
            </div>
            <div>
              <Text strong style={{ color: '#fff' }}>Capacity: </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{totalCapacity.toLocaleString()} seats</Text>
            </div>
          </Space>

          <div style={{ marginTop: 32 }}>
            <Space>
              <Button onClick={() => setCurrentStep(1)}>
                Edit Assignments
              </Button>
              <Button type="primary" onClick={handleGoBack}>
                Done
              </Button>
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Spin size="large" tip="Loading event..." />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: embedded ? 'auto' : '100vh',
      background: embedded ? 'transparent' : 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      padding: isMobile ? 12 : 24,
    }}>
      {/* Header */}
      <Card
        style={{
          marginBottom: 16,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        bodyStyle={{ padding: isMobile ? '12px 16px' : '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Space size="large" wrap>
              {!embedded && (
                <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack} size={isMobile ? 'small' : 'middle'} />
              )}
              <Title level={isMobile ? 5 : 3} style={{ margin: 0, color: '#fff' }}>
                🎫 Event Seating
              </Title>
              {selectedEvent && (
                <Tag color="blue">{selectedEvent.name}</Tag>
              )}
              {selectedLayout && (
                <Tag color="green">{selectedLayout.name}</Tag>
              )}
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              {currentStep < 2 && (
                <>
                  {currentStep > 0 && (
                    <Button onClick={prevStep}>
                      Previous
                    </Button>
                  )}
                  {currentStep === 1 ? (
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                      loading={saving}
                    >
                      Save & Continue
                    </Button>
                  ) : (
                    <Button type="primary" onClick={nextStep}>
                      Next Step
                    </Button>
                  )}
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Steps indicator */}
      <Card
        style={{
          marginBottom: 16,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
      >
        <Steps
          current={currentStep}
          items={STEPS}
          size={isMobile ? 'small' : 'default'}
          responsive={false}
        />
      </Card>

      {/* Step Content */}
      {renderStepContent()}

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
            selectedEventId={selectedEvent?.id}
            onAssign={handleTicketAssign}
            onClose={() => setShowTicketAssignment(false)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default EventSeatingManager;

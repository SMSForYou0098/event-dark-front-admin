/**
 * LayoutBuilder - Admin-Only Stadium Layout Creation/Editing
 * 
 * Purpose: Create reusable stadium layouts that can be used by organizers
 * 
 * Features:
 * - Create new stadium layouts from scratch
 * - Edit existing layouts
 * - Save layouts to database for reuse
 * - NO ticket assignment here (that's for EventSeatingManager)
 * 
 * Route: /admin/layouts or /admin/layouts/:layoutId
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Space, Typography, Tag, message, 
  Drawer, Grid, Segmented, FloatButton, Input, Modal, Spin, Empty 
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
  SaveOutlined,
  SettingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import StadiumBuilder from '../components/StadiumBuilder';
import StadiumCanvas from '../components/StadiumCanvas';
import SeatsCanvas from '../components/SeatsCanvas';
import { EMPTY_STADIUM } from '../api/mockData';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

// Create a blank stadium template
const createBlankStadium = (name = 'Untitled Stadium') => ({
  ...EMPTY_STADIUM,
  id: `stadium-${Date.now()}`,
  name,
  stands: [],
  rings: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const LayoutBuilder = ({ 
  // Props for embedded usage
  layoutId: propLayoutId,
  onSave: propOnSave,
  onBack: propOnBack,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const { layoutId: paramLayoutId } = useParams();
  const layoutId = propLayoutId || paramLayoutId;

  // Responsive breakpoints
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // Stadium data
  const [stadium, setStadium] = useState(() => createBlankStadium());
  const [originalStadium, setOriginalStadium] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mobile drawer state
  const [mobileBuilderDrawer, setMobileBuilderDrawer] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState('builder'); // 'builder' | 'preview'
  
  // Drill-down preview state
  const [viewLevel, setViewLevel] = useState('stands');
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Rename modal
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  // Load existing layout if editing
  useEffect(() => {
    if (layoutId && layoutId !== 'new') {
      loadLayout(layoutId);
    }
  }, [layoutId]);

  // Track changes
  useEffect(() => {
    if (originalStadium) {
      const changed = JSON.stringify(stadium) !== JSON.stringify(originalStadium);
      setHasChanges(changed);
    }
  }, [stadium, originalStadium]);

  // Load layout from API
  const loadLayout = async (id) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.get(`/layouts/${id}`);
      // setStadium(response.data);
      // setOriginalStadium(response.data);
      
      // Simulated for now
      await new Promise(resolve => setTimeout(resolve, 500));
      message.info('Layout loaded (simulated)');
    } catch (error) {
      message.error('Failed to load layout');
    } finally {
      setLoading(false);
    }
  };

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

  // Reset preview to top level
  const resetPreview = useCallback(() => {
    setViewLevel('stands');
    setSelectedStand(null);
    setSelectedTier(null);
    setSelectedSection(null);
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
  }, []);

  const handleBack = useCallback(() => {
    if (viewLevel === 'seats') {
      setViewLevel('sections');
      setSelectedSection(null);
    } else if (viewLevel === 'sections') {
      setViewLevel('tiers');
      setSelectedTier(null);
    } else if (viewLevel === 'tiers') {
      setViewLevel('stands');
      setSelectedStand(null);
    }
  }, [viewLevel]);

  // Save layout
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const layoutData = {
        ...stadium,
        updatedAt: new Date().toISOString(),
      };
      
      if (propOnSave) {
        await propOnSave(layoutData);
      } else {
        // TODO: Replace with actual API call
        // await api.post('/layouts', layoutData);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setOriginalStadium(stadium);
      setHasChanges(false);
      message.success('Layout saved successfully!');
    } catch (error) {
      message.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  }, [stadium, propOnSave]);

  // Create new layout
  const handleCreateNew = useCallback(() => {
    if (hasChanges) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to discard them?',
        onOk: () => {
          setStadium(createBlankStadium());
          setOriginalStadium(null);
          setHasChanges(false);
          resetPreview();
        },
      });
    } else {
      setStadium(createBlankStadium());
      setOriginalStadium(null);
      resetPreview();
    }
  }, [hasChanges, resetPreview]);

  // Rename stadium
  const handleRename = useCallback(() => {
    if (newName.trim()) {
      setStadium(prev => ({ ...prev, name: newName.trim() }));
      setRenameModalVisible(false);
      setNewName('');
    }
  }, [newName]);

  // Go back
  const handleGoBack = useCallback(() => {
    if (hasChanges) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to discard them?',
        onOk: () => {
          if (propOnBack) propOnBack();
          else navigate(-1);
        },
      });
    } else {
      if (propOnBack) propOnBack();
      else navigate(-1);
    }
  }, [hasChanges, propOnBack, navigate]);

  // Canvas dimensions
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

  // Render preview content
  const renderPreviewContent = useCallback(() => {
    if (viewLevel === 'seats' && selectedSection) {
      return (
        <SeatsCanvas
          section={selectedSection}
          tier={selectedTier}
          stand={selectedStand}
          width={viewMode === 'preview' ? 700 : 500}
          height={viewMode === 'preview' ? 500 : 400}
          isAdmin={true}
          readOnly={true} // Layout builder doesn't handle seat selection
        />
      );
    }

    if (!stadium?.stands?.length) {
      return (
        <Empty
          description={
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
              No stands yet. Add stands using the builder panel.
            </Text>
          }
        />
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
        mode="layout" // Layout mode - no ticket info
      />
    );
  }, [viewLevel, selectedSection, selectedTier, selectedStand, viewMode, canvasSize, stadium, handleStandClick, handleTierClick, handleSectionClick]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Spin size="large" tip="Loading layout..." />
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
          marginBottom: isMobile ? 12 : 24,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        bodyStyle={{ padding: isMobile ? '12px 16px' : '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} sm={24} md={12} lg={10}>
            <Space size={isMobile ? 'small' : 'large'} wrap>
              {!embedded && (
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleGoBack}
                  size={isMobile ? 'small' : 'middle'}
                />
              )}
              <Title 
                level={isMobile ? 5 : 3} 
                style={{ margin: 0, color: '#fff', cursor: 'pointer' }}
                onClick={() => {
                  setNewName(stadium.name);
                  setRenameModalVisible(true);
                }}
              >
                🏟️ {stadium?.name || 'Untitled'}
              </Title>
              <Tag color="blue" style={{ fontSize: isMobile ? 11 : 14 }}>
                {totalCapacity.toLocaleString()} seats
              </Tag>
              {hasChanges && (
                <Tag color="orange" style={{ fontSize: isMobile ? 11 : 14 }}>
                  Unsaved
                </Tag>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={24} md={12} lg={14}>
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={handleCreateNew} size={isMobile ? 'small' : 'middle'}>
                <PlusOutlined /> New
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                loading={saving}
                // disabled={!hasChanges}
                size={isMobile ? 'small' : 'middle'}
              >
                Save Layout
              </Button>
              {!isMobile && (
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  size={isTablet ? 'small' : 'middle'}
                  options={[
                    { label: 'Builder', value: 'builder', icon: <EditOutlined /> },
                    { label: 'Preview', value: 'preview', icon: <EyeOutlined /> },
                  ]}
                />
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row gutter={isMobile ? 12 : 24}>
        {/* Builder Panel */}
        {!isMobile && (viewMode === 'builder') && (
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
                loading={saving}
                isMobile={isMobile}
                mode="layout" // Layout mode - no ticket assignment
              />
            </Card>
          </Col>
        )}

        {/* Preview Panel */}
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
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    {viewLevel !== 'stands' && (
                      <Button icon={<ArrowLeftOutlined />} onClick={handleBack} size="small">
                        Back
                      </Button>
                    )}
                    <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {viewLevel === 'stands' && 'Stadium Overview'}
                      {viewLevel === 'tiers' && `${selectedStand?.name} - Tiers`}
                      {viewLevel === 'sections' && `${selectedTier?.name} - Sections`}
                      {viewLevel === 'seats' && `${selectedSection?.name} - Seats`}
                    </Text>
                  </Space>
                  <Button size="small" onClick={resetPreview}>
                    Reset View
                  </Button>
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

              {/* Legend */}
              <div style={{ 
                marginTop: isMobile ? 8 : 16, 
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
              }}>
                <Text type="secondary">
                  {viewLevel === 'stands' && 'Click a stand to view its tiers'}
                  {viewLevel === 'tiers' && 'Click a tier to view its sections'}
                  {viewLevel === 'sections' && 'Click a section to view seats'}
                  {viewLevel === 'seats' && 'Viewing seat layout'}
                </Text>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Mobile Builder Drawer */}
      {isMobile && (
        <Drawer
          title="Layout Builder"
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
            loading={saving}
            isMobile={true}
            mode="layout"
          />
        </Drawer>
      )}

      {/* Mobile FAB */}
      {isMobile && viewMode === 'preview' && (
        <FloatButton
          icon={<SettingOutlined />}
          type="primary"
          onClick={() => setMobileBuilderDrawer(true)}
          style={{ bottom: 90 }}
          tooltip="Open Builder"
        />
      )}

      {/* Rename Modal */}
      <Modal
        title="Rename Layout"
        open={renameModalVisible}
        onOk={handleRename}
        onCancel={() => setRenameModalVisible(false)}
        okText="Rename"
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter layout name"
          onPressEnter={handleRename}
        />
      </Modal>
    </div>
  );
};

export default LayoutBuilder;

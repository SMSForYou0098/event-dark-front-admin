/**
 * StadiumBuilder - Folder-Style Hierarchical Stadium Layout Editor
 *
 * Schema: Stadium → Stands → Tiers → Sections → Rows → Seats
 *
 * Navigation works like a file explorer:
 * - Clicking a Stand shows its Tiers
 * - Clicking a Tier shows its Sections
 * - Clicking a Section shows its Rows
 * - Clicking a Row shows its Seats
 * - Breadcrumb allows jumping back to any level
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  Space,
  Typography,
  Empty,
  Breadcrumb,
  Grid,
  Row,
  Col,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  SearchOutlined,
  PartitionOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  RightOutlined,
  LayoutOutlined,
  BlockOutlined,
  UnorderedListOutlined,
  TableOutlined,
  FolderOutlined,
} from '@ant-design/icons';

// Local components
import FolderItem from './FolderItem';
import StandEditPanel from './StandEditPanel';
import RowEditPanel from './RowEditPanel';
import SectionEditPanel from './SectionEditPanel';
import { useStadiumData } from './useStadiumData';
import { STAND_COLORS, TIER_COLORS } from './constants';

// External components
import StadiumCanvas from '../StadiumCanvas';
import SeatsCanvas from '../SeatsCanvas';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const StadiumBuilder = ({
  stadium,
  onChange,
  onAssignTicket,
  selectedEvent,
  isMobile = false,
}) => {
  // Responsive breakpoints
  const screens = useBreakpoint();
  const isCompact = isMobile || !screens.lg;
  const isTablet = screens.md && !screens.lg;

  // ============================================
  // NAVIGATION STATE (Folder-style drill-down)
  // ============================================
  const [navLevel, setNavLevel] = useState('stands');
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Search filter
  const [searchFilter, setSearchFilter] = useState('');

  // Edit mode for stand geometry
  const [editingStandId, setEditingStandId] = useState(null);
  
  // Edit mode for section aisles
  const [editingSectionId, setEditingSectionId] = useState(null);

  // ============================================
  // DATA OPERATIONS HOOK
  // ============================================
  const {
    updateStadium,
    addStand,
    updateStand,
    deleteStand,
    redistributeStands,
    addTier,
    updateTier,
    deleteTier,
    addSection,
    updateSection,
    deleteSection,
    addRow,
    updateRow,
    deleteRow,
  } = useStadiumData(
    stadium,
    onChange,
    selectedStand,
    setSelectedStand,
    selectedTier,
    setSelectedTier,
    selectedSection,
    setSelectedSection,
    selectedRow,
    setSelectedRow,
    setNavLevel
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Get current items based on nav level
  const currentItems = useMemo(() => {
    let items = [];

    if (navLevel === 'stands') {
      items = stadium?.stands || [];
    } else if (navLevel === 'tiers' && selectedStand) {
      const freshStand = stadium?.stands?.find(s => s.id === selectedStand.id);
      items = freshStand?.tiers || selectedStand.tiers || [];
    } else if (navLevel === 'sections' && selectedTier) {
      const freshStand = stadium?.stands?.find(s => s.id === selectedStand?.id);
      const freshTier = freshStand?.tiers?.find(t => t.id === selectedTier.id);
      items = freshTier?.sections || selectedTier.sections || [];
    } else if (navLevel === 'rows' && selectedSection) {
      const freshStand = stadium?.stands?.find(s => s.id === selectedStand?.id);
      const freshTier = freshStand?.tiers?.find(t => t.id === selectedTier?.id);
      const freshSection = freshTier?.sections?.find(sec => sec.id === selectedSection.id);
      items = freshSection?.rows || selectedSection.rows || [];
    } else if (navLevel === 'seats' && selectedRow) {
      const freshStand = stadium?.stands?.find(s => s.id === selectedStand?.id);
      const freshTier = freshStand?.tiers?.find(t => t.id === selectedTier?.id);
      const freshSection = freshTier?.sections?.find(sec => sec.id === selectedSection?.id);
      const freshRow = freshSection?.rows?.find(r => r.id === selectedRow.id);
      const seatCount = freshRow?.seatCount || selectedRow.seatCount || 0;
      items = Array.from({ length: seatCount }, (_, i) => ({
        id: `${selectedRow.id}-seat-${i}`,
        number: i + 1,
        status: freshRow?.seats?.[i]?.status || selectedRow.seats?.[i]?.status || 'active',
      }));
    }

    // Apply search filter
    if (searchFilter.trim()) {
      const keyword = searchFilter.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(keyword) ||
        item.code?.toLowerCase().includes(keyword) ||
        item.label?.toLowerCase().includes(keyword)
      );
    }

    return items;
  }, [navLevel, stadium, selectedStand, selectedTier, selectedSection, selectedRow, searchFilter]);

  // Calculate stats for each item
  const getItemStats = useCallback((item, type) => {
    if (type === 'stand') {
      const tiers = item.tiers?.length || 0;
      const seats = item.tiers?.reduce((sum, t) =>
        sum + (t.sections?.reduce((ss, s) =>
          ss + (s.rows?.reduce((rs, r) => rs + (r.seatCount || 0), 0) || 0), 0) || 0), 0) || 0;
      return { tiers, seats };
    }
    if (type === 'tier') {
      const sections = item.sections?.length || 0;
      const seats = item.sections?.reduce((sum, s) =>
        sum + (s.rows?.reduce((rs, r) => rs + (r.seatCount || 0), 0) || 0), 0) || 0;
      return { sections, seats };
    }
    if (type === 'section') {
      const rows = item.rows?.length || 0;
      const seats = item.rows?.reduce((sum, r) => sum + (r.seatCount || 0), 0) || 0;
      return { rows, seats };
    }
    if (type === 'row') {
      return { seatCount: item.seatCount || 0 };
    }
    return {};
  }, []);

  // Total stats
  const totalStats = useMemo(() => {
    const stands = stadium?.stands || [];
    const tiers = stands.reduce((sum, stand) => sum + (stand.tiers?.length || 0), 0);
    const sections = stands.reduce(
      (sum, stand) =>
        sum + (stand.tiers?.reduce((tierSum, tier) => tierSum + (tier.sections?.length || 0), 0) || 0),
      0
    );
    const seats = stands.reduce(
      (sum, stand) =>
        sum + (stand.tiers?.reduce(
          (tierSum, tier) =>
            tierSum + (tier.sections?.reduce(
              (secSum, sec) =>
                secSum + (sec.rows?.reduce((rowSum, row) => rowSum + (row.seatCount || 0), 0) || 0),
              0
            ) || 0),
          0
        ) || 0),
      0
    );
    return { stands: stands.length, tiers, sections, seats };
  }, [stadium]);

  // ============================================
  // BREADCRUMB NAVIGATION
  // ============================================
  const breadcrumbItems = useMemo(() => {
    const items = [{
      key: 'stadium',
      title: stadium?.name || 'Stadium',
      onClick: () => {
        setNavLevel('stands');
        setSelectedStand(null);
        setSelectedTier(null);
        setSelectedSection(null);
        setSelectedRow(null);
        setSearchFilter('');
      }
    }];

    if (selectedStand) {
      items.push({
        key: 'stand',
        title: selectedStand.name || selectedStand.code,
        onClick: () => {
          setNavLevel('tiers');
          setSelectedTier(null);
          setSelectedSection(null);
          setSelectedRow(null);
          setSearchFilter('');
        }
      });
    }

    if (selectedTier) {
      items.push({
        key: 'tier',
        title: selectedTier.name || `Tier ${selectedTier.level + 1}`,
        onClick: () => {
          setNavLevel('sections');
          setSelectedSection(null);
          setSelectedRow(null);
          setSearchFilter('');
        }
      });
    }

    if (selectedSection) {
      items.push({
        key: 'section',
        title: selectedSection.name || selectedSection.code,
        onClick: () => {
          setNavLevel('rows');
          setSelectedRow(null);
          setSearchFilter('');
        }
      });
    }

    if (selectedRow) {
      items.push({
        key: 'row',
        title: `Row ${selectedRow.label || selectedRow.order + 1}`,
        onClick: null
      });
    }

    return items;
  }, [stadium, selectedStand, selectedTier, selectedSection, selectedRow]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleSelectStand = useCallback((stand) => {
    const freshStand = stadium?.stands?.find(s => s.id === stand.id) || stand;
    setSelectedStand(freshStand);
    setNavLevel('tiers');
    setSearchFilter('');
  }, [stadium]);

  const handleSelectTier = useCallback((tier) => {
    setSelectedTier(tier);
    setNavLevel('sections');
    setSearchFilter('');
  }, []);

  const handleSelectSection = useCallback((section) => {
    setSelectedSection(section);
    setNavLevel('rows');
    setSearchFilter('');
  }, []);

  const handleSelectRow = useCallback((row) => {
    setSelectedRow(row);
    setNavLevel('seats');
    setSearchFilter('');
  }, []);

  const handleBack = useCallback(() => {
    if (navLevel === 'seats') {
      setNavLevel('rows');
      setSelectedRow(null);
    } else if (navLevel === 'rows') {
      setNavLevel('sections');
      setSelectedSection(null);
    } else if (navLevel === 'sections') {
      setNavLevel('tiers');
      setSelectedTier(null);
    } else if (navLevel === 'tiers') {
      setNavLevel('stands');
      setSelectedStand(null);
    }
    setSearchFilter('');
  }, [navLevel]);

  // ============================================
  // CANVAS SIZE
  // ============================================
  const canvasSize = useMemo(() => {
    if (isMobile) return { width: Math.min(window.innerWidth - 48, 350), height: 350 };
    if (isTablet) return { width: 400, height: 400 };
    return { width: 500, height: 500 };
  }, [isMobile, isTablet]);

  // ============================================
  // RENDER CURRENT LEVEL CONTENT
  // ============================================
  const renderCurrentLevel = () => {
    // Stand geometry editing
    if (editingStandId && navLevel === 'stands') {
      const stand = stadium.stands?.find(s => s.id === editingStandId);
      if (stand) {
        return (
          <StandEditPanel
            stand={stand}
            onUpdate={(updates) => {
              updateStand(stand.id, updates);
              message.success('Stand geometry updated');
              setEditingStandId(null);
            }}
            onBack={() => setEditingStandId(null)}
            isMobile={isMobile}
          />
        );
      }
    }

    // Section aisles editing
    if (editingSectionId && navLevel === 'sections') {
      const section = selectedTier?.sections?.find(s => s.id === editingSectionId);
      if (section) {
        return (
          <SectionEditPanel
            section={section}
            onUpdate={(updates) => {
              updateSection(section.id, updates);
              message.success('Section aisles updated');
            }}
            onBack={() => setEditingSectionId(null)}
            isMobile={isMobile}
          />
        );
      }
    }

    // Row editing
    if (navLevel === 'seats' && selectedRow) {
      return (
        <RowEditPanel
          row={selectedRow}
          onUpdate={(updates) => {
            updateRow(selectedRow.id, updates);
            message.success('Row updated');
          }}
          onBack={handleBack}
        />
      );
    }

    const isEmpty = currentItems.length === 0;

    if (isEmpty) {
      const levelLabels = {
        stands: { label: 'stands', add: addStand },
        tiers: { label: 'tiers', add: addTier },
        sections: { label: 'sections', add: addSection },
        rows: { label: 'rows', add: addRow },
        seats: { label: 'seats', add: null },
      };

      const current = levelLabels[navLevel];

      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
              No {current.label} yet
            </Text>
          }
        >
          {current.add && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={current.add}
            >
              Add {current.label.slice(0, -1)}
            </Button>
          )}
        </Empty>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {currentItems.map((item, index) => {
          if (navLevel === 'stands') {
            return (
              <FolderItem
                key={item.id}
                item={item}
                type="stand"
                color={item.style?.color || STAND_COLORS[index % STAND_COLORS.length]}
                stats={getItemStats(item, 'stand')}
                onSelect={() => handleSelectStand(item)}
                onEdit={(updates) => updateStand(item.id, updates)}
                onDelete={() => deleteStand(item.id)}
                onStatusChange={(status) => updateStand(item.id, { status })}
                onAssignTicket={() => onAssignTicket?.('stand', item, item.id)}
                onEditGeometry={() => setEditingStandId(item.id)}
                isMobile={isMobile}
              />
            );
          }

          if (navLevel === 'tiers') {
            return (
              <FolderItem
                key={item.id}
                item={item}
                type="tier"
                color={item.style?.color || TIER_COLORS[item.level % TIER_COLORS.length]}
                stats={getItemStats(item, 'tier')}
                onSelect={() => handleSelectTier(item)}
                onEdit={(updates) => updateTier(item.id, updates)}
                onDelete={() => deleteTier(item.id)}
                onStatusChange={(status) => updateTier(item.id, { status })}
                onAssignTicket={() => onAssignTicket?.('tier', item, selectedStand?.id, item.id)}
                isMobile={isMobile}
              />
            );
          }

          if (navLevel === 'sections') {
            return (
              <FolderItem
                key={item.id}
                item={item}
                type="section"
                color={item.style?.color || '#10b981'}
                stats={getItemStats(item, 'section')}
                onSelect={() => handleSelectSection(item)}
                onEdit={(updates) => updateSection(item.id, updates)}
                onDelete={() => deleteSection(item.id)}
                onStatusChange={(status) => updateSection(item.id, { status })}
                onAssignTicket={() => onAssignTicket?.('section', item, selectedStand?.id, selectedTier?.id, item.id)}
                onEditGeometry={() => setEditingSectionId(item.id)}
                editGeometryTooltip="Configure Aisles"
                isMobile={isMobile}
              />
            );
          }

          if (navLevel === 'rows') {
            return (
              <FolderItem
                key={item.id}
                item={item}
                type="row"
                color="#f59e0b"
                stats={getItemStats(item, 'row')}
                onSelect={() => handleSelectRow(item)}
                onEdit={(updates) => updateRow(item.id, updates)}
                onDelete={() => deleteRow(item.id)}
                onStatusChange={(status) => updateRow(item.id, { status })}
                onAssignTicket={() => onAssignTicket?.('row', item, selectedStand?.id, selectedTier?.id, selectedSection?.id, item.id)}
                isMobile={isMobile}
              />
            );
          }

          return null;
        })}
      </div>
    );
  };

  // Get level title and icon
  const getLevelInfo = () => {
    const levels = {
      stands: { icon: <AppstoreOutlined />, title: 'Stands', count: stadium?.stands?.length || 0 },
      tiers: { icon: <LayoutOutlined />, title: 'Tiers', count: selectedStand?.tiers?.length || 0 },
      sections: { icon: <BlockOutlined />, title: 'Sections', count: selectedTier?.sections?.length || 0 },
      rows: { icon: <UnorderedListOutlined />, title: 'Rows', count: selectedSection?.rows?.length || 0 },
      seats: { icon: <TableOutlined />, title: 'Edit Row', count: selectedRow?.seatCount || 0 },
    };
    return levels[navLevel];
  };

  const levelInfo = getLevelInfo();

  // Get add handler for current level
  const getAddHandler = () => {
    if (navLevel === 'stands') return addStand;
    if (navLevel === 'tiers') return addTier;
    if (navLevel === 'sections') return addSection;
    if (navLevel === 'rows') return addRow;
    return null;
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div style={{
      height: '100%',
      padding: isMobile ? 12 : 16,
      overflow: 'hidden',
    }}>
      <Row gutter={[16, 16]} style={{ height: '100%' }}>
        {/* Left Panel - Folder Navigation */}
        <Col xs={24} lg={12} style={{ height: isCompact ? 'auto' : '100%', maxHeight: isCompact ? '55vh' : '100%' }}>
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflow: 'hidden',
          }}>
            {/* Stadium Info Card */}
            <Card
              size="small"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.05) 100%)',
                border: '1px solid rgba(59,130,246,0.2)',
                flexShrink: 0,
              }}
              bodyStyle={{ padding: isMobile ? 10 : 12 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <Input
                    value={stadium?.name || ''}
                    onChange={e => updateStadium({ name: e.target.value })}
                    placeholder="Stadium Name"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 500,
                    }}
                    size={isMobile ? 'small' : 'middle'}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Stands', value: totalStats.stands, color: '#3b82f6' },
                    { label: 'Tiers', value: totalStats.tiers, color: '#8b5cf6' },
                    { label: 'Seats', value: totalStats.seats, color: '#f59e0b' },
                  ].map((stat) => (
                    <Tag
                      key={stat.label}
                      style={{
                        background: `${stat.color}20`,
                        border: 'none',
                        color: stat.color,
                        margin: 0,
                        fontSize: 11,
                      }}
                    >
                      {stat.value.toLocaleString()} {stat.label}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>

            {/* Breadcrumb Navigation */}
            <Card
              size="small"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}
              bodyStyle={{ padding: '10px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {navLevel !== 'stands' && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                    size="small"
                    type="text"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#fff',
                    }}
                  >
                    Back
                  </Button>
                )}
                <Breadcrumb
                  separator={<RightOutlined style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }} />}
                  items={breadcrumbItems.map((item, i) => ({
                    key: item.key,
                    title: (
                      <span
                        onClick={item.onClick}
                        style={{
                          cursor: item.onClick ? 'pointer' : 'default',
                          color: i === breadcrumbItems.length - 1 ? '#fff' : 'rgba(255,255,255,0.5)',
                          fontSize: 13,
                          fontWeight: i === breadcrumbItems.length - 1 ? 600 : 400,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: i === breadcrumbItems.length - 1 ? 'rgba(59,130,246,0.2)' : 'transparent',
                        }}
                      >
                        {i === 0 && <HomeOutlined style={{ marginRight: 4 }} />}
                        {item.title}
                      </span>
                    ),
                  }))}
                />
              </div>
            </Card>

            {/* Level Header & Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
              flexShrink: 0,
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <Space size={8}>
                <span style={{ color: '#60a5fa' }}>{levelInfo.icon}</span>
                <Text style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                  {levelInfo.title} ({levelInfo.count})
                </Text>
              </Space>
              <Space size={6} wrap>
                {/* Search */}
                {navLevel !== 'seats' && (
                  <Input
                    allowClear
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search..."
                    prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
                    size="small"
                    style={{
                      width: 130,
                      background: 'rgba(255,255,255,0.04)',
                      border: 'none',
                      color: '#fff',
                    }}
                  />
                )}
                {/* Add button */}
                {getAddHandler() && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={getAddHandler()}
                  >
                    Add
                  </Button>
                )}
                {/* Redistribute (only for stands) */}
                {navLevel === 'stands' && stadium?.stands?.length > 1 && (
                  <Tooltip title="Redistribute stands evenly">
                    <Button
                      size="small"
                      icon={<PartitionOutlined />}
                      onClick={redistributeStands}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}
                    />
                  </Tooltip>
                )}
              </Space>
            </div>

            {/* Items List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              paddingRight: 4,
            }}>
              {renderCurrentLevel()}
            </div>
          </div>
        </Col>

        {/* Right Panel - Visual Canvas */}
        <Col xs={24} lg={12} style={{ height: isCompact ? 'auto' : '100%' }}>
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {/* Canvas Header */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>
                {(navLevel === 'rows' || navLevel === 'seats') ? '🎫 Seat Layout' : 'Live Preview'}
              </Text>
              <Space size={8}>
                {(navLevel === 'rows' || navLevel === 'seats') && selectedSection && (
                  <Tag style={{
                    background: 'rgba(59,130,246,0.15)',
                    border: 'none',
                    color: '#60a5fa',
                    margin: 0,
                  }}>
                    {selectedSection?.rows?.reduce((sum, r) => sum + (r.seatCount || 0), 0) || 0} Seats
                  </Tag>
                )}
                <Tag style={{
                  background: 'rgba(34,197,94,0.15)',
                  border: 'none',
                  color: '#4ade80',
                  margin: 0,
                }}>
                  {totalStats.seats.toLocaleString()} Total
                </Tag>
              </Space>
            </div>

            {/* Canvas */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              overflow: 'auto',
            }}>
              {!stadium?.stands?.length ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <FolderOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                  <Text style={{ display: 'block', color: 'rgba(255,255,255,0.4)' }}>
                    Add stands to see the preview
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addStand}
                    style={{ marginTop: 16 }}
                  >
                    Add First Stand
                  </Button>
                </div>
              ) : (navLevel === 'rows' || navLevel === 'seats') && selectedSection ? (
                <SeatsCanvas
                  section={selectedSection}
                  tier={selectedTier}
                  stand={selectedStand}
                  eventId={stadium?.eventId}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  isAdmin={true}
                  onSeatClick={(seat) => {
                    console.log('Seat clicked:', seat);
                  }}
                />
              ) : (
                <StadiumCanvas
                  stadium={stadium}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  viewLevel={navLevel === 'stands' ? 'stands' : navLevel === 'tiers' ? 'tiers' : 'sections'}
                  selectedStand={selectedStand}
                  selectedTier={selectedTier}
                  onStandClick={handleSelectStand}
                  onTierClick={(tier) => {
                    if (selectedStand) {
                      handleSelectTier(tier);
                    }
                  }}
                  onSectionClick={(section, tier, stand) => {
                    if (stand) setSelectedStand(stand);
                    if (tier) setSelectedTier(tier);
                    handleSelectSection(section);
                  }}
                />
              )}
            </div>

            {/* Canvas Footer */}
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {navLevel === 'stands' && 'Click a stand to drill down →'}
                  {navLevel === 'tiers' && `📍 ${selectedStand?.name || 'Stand'}`}
                  {navLevel === 'sections' && `📍 ${selectedStand?.name} › ${selectedTier?.name}`}
                  {navLevel === 'rows' && `🎫 ${selectedSection?.name} - Seat Layout`}
                  {navLevel === 'seats' && `🎫 Row ${selectedRow?.label || ''} - Seats`}
                </Text>
                <Space size={8}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                    {(navLevel === 'rows' || navLevel === 'seats') ? 'Click seats to select' : 'Scroll to zoom'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.15)' }}>•</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Drag to pan</Text>
                </Space>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default StadiumBuilder;

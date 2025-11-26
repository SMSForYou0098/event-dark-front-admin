/**
 * StadiumBuilder - Admin Interface for Hierarchical Stadium Layout
 * 
 * Schema: Stadium → Stands → Tiers → Sections → Rows → Seats
 * 
 * Features:
 * - Create/Edit stands with position (angles)
 * - Add multiple tiers per stand
 * - Add sections per tier
 * - Add rows per section
 * - Ticket assignment at any level
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  InputNumber,
  Switch,
  Space,
  Typography,
  Divider,
  Tag,
  Empty,
  Tooltip,
  Popconfirm,
  Alert,
  Segmented,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
  TagOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  SearchOutlined,
  ExpandOutlined,
  CompressOutlined,
  BulbOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Stand colors
const STAND_COLORS = [
  '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#22c55e', '#06b6d4', '#f97316', '#6366f1',
];

// Tier colors
const TIER_COLORS = [
  '#dc2626', '#f59e0b', '#3b82f6', '#06b6d4', '#8b5cf6', '#22c55e',
];

// Generate unique ID
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

const StadiumBuilder = ({
  stadium,
  onChange,
  onAssignTicket,
  selectedEvent,
  isMobile = false,
}) => {
  const [expandedStands, setExpandedStands] = useState([]);
  const [expandedTiers, setExpandedTiers] = useState([]);
  const [expandedSections, setExpandedSections] = useState([]);
  const [standFilter, setStandFilter] = useState('');
  const [viewMode, setViewMode] = useState('guided'); // guided | advanced

  const filteredStands = useMemo(() => {
    const allStands = stadium.stands || [];
    if (!standFilter.trim()) return allStands;
    const keyword = standFilter.toLowerCase();
    return allStands.filter(stand =>
      stand.name?.toLowerCase().includes(keyword) ||
      stand.code?.toLowerCase().includes(keyword)
    );
  }, [stadium.stands, standFilter]);

  const handleExpandAll = useCallback(() => {
    setExpandedStands(filteredStands.map(s => s.id));
  }, [filteredStands]);

  const handleCollapseAll = useCallback(() => {
    setExpandedStands([]);
  }, []);

  const totalStats = useMemo(() => {
    const stands = stadium?.stands || [];
    const tiers = stands.reduce((sum, stand) => sum + (stand.tiers?.length || 0), 0);
    const sections = stands.reduce(
      (sum, stand) =>
        sum +
        (stand.tiers?.reduce((tierSum, tier) => tierSum + (tier.sections?.length || 0), 0) || 0),
      0
    );
    const rows = stands.reduce(
      (sum, stand) =>
        sum +
        (stand.tiers?.reduce(
          (tierSum, tier) =>
            tierSum +
            (tier.sections?.reduce((secSum, sec) => secSum + (sec.rows?.length || 0), 0) || 0),
          0
        ) || 0),
      0
    );
    const seats = stands.reduce(
      (sum, stand) =>
        sum +
        (stand.tiers?.reduce(
          (tierSum, tier) =>
            tierSum +
            (tier.sections?.reduce(
              (secSum, sec) =>
                secSum +
                (sec.rows?.reduce((rowSum, row) => rowSum + (row.seatCount || 0), 0) || 0),
              0
            ) || 0),
          0
        ) || 0),
      0
    );
    return { stands: stands.length, tiers, sections, rows, seats };
  }, [stadium]);

  // ============================================
  // STADIUM HANDLERS
  // ============================================

  const updateStadium = useCallback((updates) => {
    onChange({ ...stadium, ...updates });
  }, [stadium, onChange]);

  // ============================================
  // STAND HANDLERS
  // ============================================

  const addStand = useCallback(() => {
    const index = stadium.stands?.length || 0;
    const anglePerStand = 360 / (index + 1);
    
    const newStand = {
      id: uid('stand'),
      stadiumId: stadium.id,
      name: `Stand ${String.fromCharCode(65 + index)}`,
      code: String.fromCharCode(65 + index),
      order: index,
      geometry: {
        startAngle: index * anglePerStand,
        endAngle: (index + 1) * anglePerStand - 5,
        visualWeight: 1,
        shape: 'arc',
      },
      tiers: [],
      status: 'active',
      style: { color: STAND_COLORS[index % STAND_COLORS.length] },
    };

    updateStadium({
      stands: [...(stadium.stands || []), newStand],
    });
    setExpandedStands([...expandedStands, newStand.id]);
  }, [stadium, updateStadium, expandedStands]);

  const quickAddStand = useCallback(() => {
    const index = stadium.stands?.length || 0;
    const anglePerStand = 360 / (index + 1 || 1);
    const standId = uid('stand');
    const tierId = uid('tier');
    const sectionId = uid('section');
    const rowId = uid('row');

    const newStand = {
      id: standId,
      stadiumId: stadium.id,
      name: `Stand ${String.fromCharCode(65 + index)}`,
      code: String.fromCharCode(65 + index),
      order: index,
      geometry: {
        startAngle: index * anglePerStand,
        endAngle: (index + 1) * anglePerStand - 5,
        visualWeight: 1,
        shape: 'arc',
      },
      status: 'active',
      style: { color: STAND_COLORS[index % STAND_COLORS.length] },
      tiers: [
        {
          id: tierId,
          standId,
          name: 'Lower Bowl',
          code: 'T1',
          level: 0,
          geometry: { radiusOffset: 0, thickness: 40, elevation: 0 },
          status: 'active',
          basePrice: 750,
          style: { color: TIER_COLORS[0] },
          sections: [
            {
              id: sectionId,
              tierId,
              standId,
              name: 'Section 1',
              code: 'S1',
              order: 0,
              geometry: { startAngle: 0, endAngle: 0, curve: 0 },
              status: 'active',
              priceOverride: null,
              style: { color: null },
              rows: [
                {
                  id: rowId,
                  sectionId,
                  tierId,
                  standId,
                  label: 'A',
                  order: 0,
                  geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
                  seats: [],
                  seatCount: 24,
                  status: 'active',
                  priceOverride: null,
                },
              ],
            },
          ],
        },
      ],
    };

    updateStadium({
      stands: [...(stadium.stands || []), newStand],
    });
    setExpandedStands(prev => [...prev, standId]);
    setExpandedTiers(prev => [...prev, tierId]);
    setExpandedSections(prev => [...prev, sectionId]);
  }, [stadium, updateStadium]);

  const updateStand = useCallback((standId, updates) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId ? { ...s, ...updates } : s
      ),
    });
  }, [stadium, updateStadium]);

  const deleteStand = useCallback((standId) => {
    updateStadium({
      stands: stadium.stands.filter(s => s.id !== standId),
    });
  }, [stadium, updateStadium]);

  // ============================================
  // TIER HANDLERS
  // ============================================

  const addTier = useCallback((standId) => {
    const stand = stadium.stands.find(s => s.id === standId);
    const level = stand?.tiers?.length || 0;

    const newTier = {
      id: uid('tier'),
      standId,
      name: level === 0 ? 'Lower Tier' : level === 1 ? 'Upper Tier' : `Tier ${level + 1}`,
      code: `T${level + 1}`,
      level,
      geometry: { radiusOffset: level * 50, thickness: 40, elevation: level * 5 },
      sections: [],
      status: 'active',
      basePrice: 500 + (level * 300),
      style: { color: TIER_COLORS[level % TIER_COLORS.length] },
    };

    updateStand(standId, {
      tiers: [...(stand?.tiers || []), newTier],
    });
    setExpandedTiers([...expandedTiers, newTier.id]);
  }, [stadium, updateStand, expandedTiers]);

  const updateTier = useCallback((standId, tierId, updates) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId
          ? { ...s, tiers: s.tiers.map(t => t.id === tierId ? { ...t, ...updates } : t) }
          : s
      ),
    });
  }, [stadium, updateStadium]);

  const deleteTier = useCallback((standId, tierId) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId
          ? { ...s, tiers: s.tiers.filter(t => t.id !== tierId) }
          : s
      ),
    });
  }, [stadium, updateStadium]);

  // ============================================
  // SECTION HANDLERS
  // ============================================

  const addSection = useCallback((standId, tierId) => {
    const stand = stadium.stands.find(s => s.id === standId);
    const tier = stand?.tiers.find(t => t.id === tierId);
    const order = tier?.sections?.length || 0;

    const newSection = {
      id: uid('section'),
      tierId,
      standId,
      name: `Section ${order + 1}`,
      code: `S${order + 1}`,
      order,
      geometry: { startAngle: 0, endAngle: 0, curve: 0 },
      rows: [],
      status: 'active',
      priceOverride: null,
      style: { color: null },
    };

    updateTier(standId, tierId, {
      sections: [...(tier?.sections || []), newSection],
    });
    setExpandedSections([...expandedSections, newSection.id]);
  }, [stadium, updateTier, expandedSections]);

  const updateSection = useCallback((standId, tierId, sectionId, updates) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId
          ? {
              ...s,
              tiers: s.tiers.map(t =>
                t.id === tierId
                  ? { ...t, sections: t.sections.map(sec => sec.id === sectionId ? { ...sec, ...updates } : sec) }
                  : t
              ),
            }
          : s
      ),
    });
  }, [stadium, updateStadium]);

  const deleteSection = useCallback((standId, tierId, sectionId) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId
          ? {
              ...s,
              tiers: s.tiers.map(t =>
                t.id === tierId
                  ? { ...t, sections: t.sections.filter(sec => sec.id !== sectionId) }
                  : t
              ),
            }
          : s
      ),
    });
  }, [stadium, updateStadium]);

  // ============================================
  // ROW HANDLERS
  // ============================================

  const addRow = useCallback((standId, tierId, sectionId) => {
    const stand = stadium.stands.find(s => s.id === standId);
    const tier = stand?.tiers.find(t => t.id === tierId);
    const section = tier?.sections.find(sec => sec.id === sectionId);
    const order = section?.rows?.length || 0;

    const newRow = {
      id: uid('row'),
      sectionId,
      tierId,
      standId,
      label: String.fromCharCode(65 + order), // A, B, C...
      order,
      geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
      seats: [],
      seatCount: 20,
      status: 'active',
      priceOverride: null,
    };

    updateSection(standId, tierId, sectionId, {
      rows: [...(section?.rows || []), newRow],
    });
  }, [stadium, updateSection]);

  const updateRow = useCallback((standId, tierId, sectionId, rowId, updates) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId
          ? {
              ...s,
              tiers: s.tiers.map(t =>
                t.id === tierId
                  ? {
                      ...t,
                      sections: t.sections.map(sec =>
                        sec.id === sectionId
                          ? { ...sec, rows: sec.rows.map(r => r.id === rowId ? { ...r, ...updates } : r) }
                          : sec
                      ),
                    }
                  : t
              ),
            }
          : s
      ),
    });
  }, [stadium, updateStadium]);

  const deleteRow = useCallback((standId, tierId, sectionId, rowId) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId
          ? {
              ...s,
              tiers: s.tiers.map(t =>
                t.id === tierId
                  ? {
                      ...t,
                      sections: t.sections.map(sec =>
                        sec.id === sectionId
                          ? { ...sec, rows: sec.rows.filter(r => r.id !== rowId) }
                          : sec
                      ),
                    }
                  : t
              ),
            }
          : s
      ),
    });
  }, [stadium, updateStadium]);

  // ============================================
  // RENDERERS
  // ============================================

  const renderRowEditor = (row, standId, tierId, sectionId) => (
    <div key={row.id} style={{ ...rowItemStyle, padding: isMobile ? '3px 6px' : '4px 8px' }}>
      <Space style={{ flex: 1 }} size={isMobile ? 4 : 8}>
        <Input
          value={row.label}
          onChange={e => updateRow(standId, tierId, sectionId, row.id, { label: e.target.value })}
          style={{ 
            width: isMobile ? 35 : 50, 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: '#fff',
            fontSize: isMobile ? 10 : 12,
          }}
          size="small"
        />
        <InputNumber
          value={row.seatCount}
          min={1}
          max={100}
          onChange={v => updateRow(standId, tierId, sectionId, row.id, { seatCount: v })}
          style={{ 
            width: isMobile ? 55 : 70, 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none',
          }}
          size="small"
          prefix={!isMobile && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>seats</Text>}
        />
      </Space>
      <Space size={isMobile ? 2 : 4}>
        <Tooltip title="Assign Ticket">
          <Button
            type="text"
            icon={<TagOutlined style={{ fontSize: isMobile ? 10 : 12 }} />}
            size="small"
            onClick={() => onAssignTicket?.('row', row, standId, tierId, sectionId)}
            style={{ 
              color: row.ticketTypeId ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)',
              padding: isMobile ? '0 2px' : undefined,
            }}
          />
        </Tooltip>
        <Popconfirm title="Delete row?" onConfirm={() => deleteRow(standId, tierId, sectionId, row.id)} okText="Yes">
          <Button 
            type="text" 
            icon={<DeleteOutlined style={{ fontSize: isMobile ? 10 : 12 }} />} 
            size="small" 
            danger 
            style={{ padding: isMobile ? '0 2px' : undefined }}
          />
        </Popconfirm>
      </Space>
    </div>
  );

  const renderSectionEditor = (section, standId, tierId) => {
    const isExpanded = expandedSections.includes(section.id);
    const rowCount = section.rows?.length || 0;
    const seatCount = section.rows?.reduce((sum, r) => sum + (r.seatCount || 0), 0) || 0;

    return (
      <div key={section.id} style={sectionCardStyle}>
        <div
          style={{
            ...sectionHeaderStyle,
            padding: isMobile ? '4px 8px' : '6px 10px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? 4 : 0,
          }}
          onClick={() => setExpandedSections(
            isExpanded ? expandedSections.filter(id => id !== section.id) : [...expandedSections, section.id]
          )}
        >
          <Space size={isMobile ? 2 : 4}>
            {isExpanded ? <DownOutlined style={{ fontSize: isMobile ? 8 : 10 }} /> : <RightOutlined style={{ fontSize: isMobile ? 8 : 10 }} />}
            <Input
              value={section.name}
              onChange={e => { e.stopPropagation(); updateSection(standId, tierId, section.id, { name: e.target.value }); }}
              onClick={e => e.stopPropagation()}
              style={{ 
                width: isMobile ? 70 : 110, 
                background: 'transparent', 
                border: 'none', 
                color: '#fff', 
                padding: 0,
                fontSize: isMobile ? 10 : 12,
              }}
              size="small"
            />
          </Space>
          <Space size={isMobile ? 2 : 4}>
            <Tag style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? 8 : 10,
              padding: isMobile ? '0 2px' : '0 4px',
              margin: 0,
            }}>
              {rowCount}R · {seatCount}
            </Tag>
            <Tooltip title="Assign Ticket">
              <Button
                type="text"
                icon={<TagOutlined style={{ fontSize: isMobile ? 10 : 12 }} />}
                size="small"
                onClick={e => { e.stopPropagation(); onAssignTicket?.('section', section, standId, tierId); }}
                style={{ 
                  color: section.ticketTypeId ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)',
                  padding: isMobile ? '0 2px' : undefined,
                  minWidth: isMobile ? 20 : undefined,
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete section?"
              onConfirm={e => { e?.stopPropagation(); deleteSection(standId, tierId, section.id); }}
              okText="Yes"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined style={{ fontSize: isMobile ? 10 : 12 }} />} 
                size="small" 
                danger 
                onClick={e => e.stopPropagation()} 
                style={{ padding: isMobile ? '0 2px' : undefined, minWidth: isMobile ? 20 : undefined }}
              />
            </Popconfirm>
          </Space>
        </div>

        {isExpanded && (
          <div style={{ padding: isMobile ? '4px 6px 4px 14px' : '8px 0 0 20px' }}>
            {section.rows?.map(row => renderRowEditor(row, standId, tierId, section.id))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => addRow(standId, tierId, section.id)}
              style={{ width: '100%', marginTop: 8, opacity: 0.6, fontSize: isMobile ? 11 : 12 }}
            >
              Add Row
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTierEditor = (tier, standId) => {
    const isExpanded = expandedTiers.includes(tier.id);
    const sectionCount = tier.sections?.length || 0;
    const totalSeats = tier.sections?.reduce((sum, sec) =>
      sum + (sec.rows?.reduce((s, r) => s + (r.seatCount || 0), 0) || 0), 0
    ) || 0;

    return (
      <div key={tier.id} style={tierCardStyle}>
        <div
          style={{
            ...tierHeaderStyle,
            padding: isMobile ? '6px 8px' : '8px 12px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? 6 : 0,
          }}
          onClick={() => setExpandedTiers(
            isExpanded ? expandedTiers.filter(id => id !== tier.id) : [...expandedTiers, tier.id]
          )}
        >
          <Space size={isMobile ? 4 : 8} style={{ flex: isMobile ? '1 1 auto' : 'auto' }}>
            {isExpanded ? <DownOutlined style={{ fontSize: isMobile ? 9 : 10 }} /> : <RightOutlined style={{ fontSize: isMobile ? 9 : 10 }} />}
            <div
              style={{
                width: isMobile ? 10 : 12, 
                height: isMobile ? 10 : 12, 
                borderRadius: 3,
                background: tier.style?.color || TIER_COLORS[tier.level % TIER_COLORS.length],
              }}
            />
            <Input
              value={tier.name}
              onChange={e => { e.stopPropagation(); updateTier(standId, tier.id, { name: e.target.value }); }}
              onClick={e => e.stopPropagation()}
              style={{ 
                width: isMobile ? 80 : 120, 
                background: 'transparent', 
                border: 'none', 
                color: '#fff', 
                padding: 0,
                fontSize: isMobile ? 11 : 13,
              }}
              size="small"
            />
          </Space>
          <Space size={4} wrap>
            <Tag style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? 9 : 11,
              padding: isMobile ? '0 3px' : '0 7px',
              margin: 0,
            }}>
              {sectionCount}S · {totalSeats}
            </Tag>
            {!isMobile && viewMode === 'advanced' && (
              <Tooltip title="Base Price">
                <InputNumber
                  value={tier.basePrice}
                  min={0}
                  onChange={v => updateTier(standId, tier.id, { basePrice: v })}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 80, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                  size="small"
                  prefix="₹"
                />
              </Tooltip>
            )}
            {!isMobile && viewMode !== 'advanced' && (
              <Tag style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff' }}>
                ₹{tier.basePrice || 0}
              </Tag>
            )}
            <Tooltip title="Assign Ticket">
              <Button
                type="text"
                icon={<TagOutlined style={{ fontSize: isMobile ? 12 : 14 }} />}
                size="small"
                onClick={e => { e.stopPropagation(); onAssignTicket?.('tier', tier, standId); }}
                style={{ 
                  color: tier.ticketTypeId ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)',
                  padding: isMobile ? '0 4px' : undefined,
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete tier?"
              onConfirm={e => { e?.stopPropagation(); deleteTier(standId, tier.id); }}
              okText="Yes"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined style={{ fontSize: isMobile ? 12 : 14 }} />} 
                size="small" 
                danger 
                onClick={e => e.stopPropagation()} 
                style={{ padding: isMobile ? '0 4px' : undefined }}
              />
            </Popconfirm>
          </Space>
        </div>

        {isExpanded && (
          <div style={{ padding: isMobile ? '6px 8px 6px 16px' : '8px 0 0 16px' }}>
            {viewMode === 'advanced' ? (
              <>
                <div style={{ marginBottom: 12, display: 'flex', gap: isMobile ? 6 : 4, flexWrap: 'wrap' }}>
                  {TIER_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => updateTier(standId, tier.id, { style: { ...tier.style, color } })}
                      style={{
                        width: isMobile ? 24 : 20, 
                        height: isMobile ? 24 : 20, 
                        borderRadius: 4,
                        background: color, 
                        cursor: 'pointer',
                        border: tier.style?.color === color ? '2px solid #fff' : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 4 }}>
                    Base Price
                  </Text>
                  <InputNumber
                    value={tier.basePrice}
                    min={0}
                    onChange={v => updateTier(standId, tier.id, { basePrice: v })}
                    style={{ width: isMobile ? '100%' : 140, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                    size="small"
                    prefix="₹"
                  />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  Color & pricing are auto-applied here. Switch to Advanced to fine tune.
                </Text>
                <Tag style={{ marginTop: 6, background: 'rgba(255,255,255,0.08)', border: 'none' }}>
                  Base ₹{tier.basePrice || 0}
                </Tag>
              </div>
            )}

            {tier.sections?.map(section => renderSectionEditor(section, standId, tier.id))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => addSection(standId, tier.id)}
              style={{ width: '100%', marginTop: 8, opacity: 0.7 }}
            >
              Add Section
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderStandEditor = (stand) => {
    const isExpanded = expandedStands.includes(stand.id);
    const tierCount = stand.tiers?.length || 0;
    const totalSeats = stand.tiers?.reduce((sum, tier) =>
      tier.sections?.reduce((s, sec) =>
        s + (sec.rows?.reduce((rs, r) => rs + (r.seatCount || 0), 0) || 0), sum
      ) || sum, 0
    ) || 0;
    const firstTier = stand.tiers?.[0];
    const firstSection = firstTier?.sections?.[0];

    return (
      <Card
        key={stand.id}
        size="small"
        style={standCardStyle}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            ...standHeaderStyle,
            padding: isMobile ? '8px 12px' : '12px 16px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? 8 : 0,
          }}
          onClick={() => setExpandedStands(
            isExpanded ? expandedStands.filter(id => id !== stand.id) : [...expandedStands, stand.id]
          )}
        >
          <Space size={isMobile ? 4 : 8} style={{ flex: isMobile ? '1 1 100%' : 'auto' }}>
            {isExpanded ? <DownOutlined style={{ fontSize: isMobile ? 10 : 12 }} /> : <RightOutlined style={{ fontSize: isMobile ? 10 : 12 }} />}
            <div
              style={{
                width: isMobile ? 12 : 16, 
                height: isMobile ? 12 : 16, 
                borderRadius: 4,
                background: stand.style?.color || STAND_COLORS[stand.order % STAND_COLORS.length],
              }}
            />
            <Input
              value={stand.name}
              onChange={e => { e.stopPropagation(); updateStand(stand.id, { name: e.target.value }); }}
              onClick={e => e.stopPropagation()}
              style={{ 
                width: isMobile ? 100 : 140, 
                background: 'transparent', 
                border: 'none', 
                color: '#fff', 
                fontWeight: 600, 
                padding: 0,
                fontSize: isMobile ? 12 : 14,
              }}
            />
          </Space>
          <Space size={isMobile ? 4 : 8} wrap style={{ flex: isMobile ? '1 1 100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
            <Tag style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? 10 : 12,
              padding: isMobile ? '0 4px' : '0 7px',
            }}>
              {tierCount}T · {totalSeats}S
            </Tag>
            <Switch
              size="small"
              checked={stand.status === 'active'}
              onChange={checked => updateStand(stand.id, { status: checked ? 'active' : 'blocked' })}
              onClick={e => e.stopPropagation()}
            />
            <Tooltip title="Assign Ticket">
              <Button
                type="text"
                icon={<TagOutlined />}
                size="small"
                onClick={e => { e.stopPropagation(); onAssignTicket?.('stand', stand); }}
                style={{ color: stand.ticketTypeId ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)' }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete stand?"
              onConfirm={e => { e?.stopPropagation(); deleteStand(stand.id); }}
              okText="Yes"
            >
              <Button type="text" icon={<DeleteOutlined />} size="small" danger onClick={e => e.stopPropagation()} />
            </Popconfirm>
          </Space>
        </div>

        {isExpanded && (
          <div style={{ padding: isMobile ? '8px 12px' : '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8, marginBottom: isMobile ? 10 : 12 }}>
              <Tooltip title="Add a tier to this stand">
                <Button
                  size="small"
                  icon={<LayoutOutlined />}
                  onClick={(e) => { e.stopPropagation(); addTier(stand.id); }}
                >
                  Tier
                </Button>
              </Tooltip>
              <Tooltip title={firstTier ? 'Add a section to the first tier' : 'Add a tier first'}>
                <Button
                  size="small"
                  disabled={!firstTier}
                  icon={<AppstoreOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (firstTier) addSection(stand.id, firstTier.id);
                  }}
                >
                  Section
                </Button>
              </Tooltip>
              <Tooltip title={firstSection ? 'Add a row to the first section' : 'Add a section first'}>
                <Button
                  size="small"
                  disabled={!firstSection}
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (firstTier && firstSection) addRow(stand.id, firstTier.id, firstSection.id);
                  }}
                >
                  Row
                </Button>
              </Tooltip>
            </div>

            {/* Stand geometry */}
            {viewMode === 'advanced' ? (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, auto)',
                  gap: isMobile ? 8 : 12, 
                  marginBottom: 16 
                }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 4 }}>
                      Start°
                    </Text>
                    <InputNumber
                      value={stand.geometry?.startAngle}
                      min={-180}
                      max={360}
                      onChange={v => updateStand(stand.id, { geometry: { ...stand.geometry, startAngle: v } })}
                      style={{ width: isMobile ? '100%' : 80, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                      size="small"
                    />
                  </div>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 4 }}>
                      End°
                    </Text>
                    <InputNumber
                      value={stand.geometry?.endAngle}
                      min={-180}
                      max={360}
                      onChange={v => updateStand(stand.id, { geometry: { ...stand.geometry, endAngle: v } })}
                      style={{ width: isMobile ? '100%' : 80, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                      size="small"
                    />
                  </div>
                  <div style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 4 }}>
                      Weight
                    </Text>
                    <InputNumber
                      value={stand.geometry?.visualWeight}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onChange={v => updateStand(stand.id, { geometry: { ...stand.geometry, visualWeight: v } })}
                      style={{ width: isMobile ? '100%' : 70, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                      size="small"
                    />
                  </div>
                </div>

                {/* Stand color picker */}
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 6 }}>
                    Stand Color
                  </Text>
                  <div style={{ display: 'flex', gap: isMobile ? 6 : 4, flexWrap: 'wrap' }}>
                    {STAND_COLORS.map(color => (
                      <div
                        key={color}
                        onClick={() => updateStand(stand.id, { style: { ...stand.style, color } })}
                        style={{
                          width: isMobile ? 28 : 24, 
                          height: isMobile ? 28 : 24, 
                          borderRadius: 4,
                          background: color, 
                          cursor: 'pointer',
                          border: stand.style?.color === color ? '2px solid #fff' : '2px solid transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>
                  Geometry is auto-balanced in Guided mode. Switch to Advanced to edit exact angles & colors.
                </Text>
                <Space size={6} wrap>
                  <Tag>{`Start ${stand.geometry?.startAngle ?? 0}°`}</Tag>
                  <Tag>{`End ${stand.geometry?.endAngle ?? 0}°`}</Tag>
                  <Tag>{`Weight ${stand.geometry?.visualWeight ?? 1}`}</Tag>
                </Space>
              </div>
            )}

            <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Tiers */}
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 11 : 12, fontWeight: 600 }}>
                <LayoutOutlined style={{ marginRight: 6 }} />
                Tiers ({tierCount})
              </Text>
            </div>

            {stand.tiers?.map(tier => renderTierEditor(tier, stand.id))}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => addTier(stand.id)}
              style={{ width: '100%', marginTop: 8 }}
              size={isMobile ? 'small' : 'middle'}
            >
              Add Tier
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? 8 : 16 }}>
      {/* Stadium Info */}
      <Card size="small" style={cardStyle} bodyStyle={{ padding: isMobile ? 8 : 12 }}>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? 8 : 12, 
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: 'wrap' 
        }}>
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : 150 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 4 }}>
              Stadium Name
            </Text>
            <Input
              value={stadium?.name}
              onChange={e => updateStadium({ name: e.target.value })}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
              placeholder="Enter stadium name"
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
          <div style={{ minWidth: isMobile ? '45%' : 100 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 11, display: 'block', marginBottom: 4 }}>
              Code
            </Text>
            <Input
              value={stadium?.code}
              onChange={e => updateStadium({ code: e.target.value.toUpperCase() })}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: isMobile ? '100%' : 80 }}
              maxLength={5}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      {/* Guidance + quick actions */}
      <Card
        size="small"
        style={cardStyle}
        bodyStyle={{ padding: isMobile ? 10 : 14, display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12 }}
      >
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 12, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <Space align="start">
            <BulbOutlined style={{ color: '#fadb14', fontSize: 18, marginTop: 2 }} />
            <div>
              <Text style={{ color: '#fff', fontWeight: 600 }}>
                Builder Assistant
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: 12 }}>
                Stay in Guided mode for a simplified view, or switch to Advanced to tweak geometry & colors.
              </Text>
            </div>
          </Space>
          <Segmented
            size="small"
            value={viewMode}
            onChange={(val) => setViewMode(val)}
            options={[
              { label: 'Guided', value: 'guided' },
              { label: 'Advanced', value: 'advanced' },
            ]}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: 'Stands', value: totalStats.stands },
            { label: 'Tiers', value: totalStats.tiers },
            { label: 'Sections', value: totalStats.sections },
            { label: 'Rows', value: totalStats.rows },
            { label: 'Seats', value: totalStats.seats },
          ].map((stat) => (
            <Badge
              key={stat.label}
              count={stat.value}
              showZero
              style={{ backgroundColor: '#1890ff' }}
            >
              <div style={statChipStyle}>{stat.label}</div>
            </Badge>
          ))}
        </div>

        <Space size={isMobile ? 6 : 10} wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={addStand}>
            Add Stand
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={quickAddStand}>
            Quick Stand
          </Button>
          <Button icon={<ExpandOutlined />} onClick={handleExpandAll}>
            Expand All
          </Button>
          <Button icon={<CompressOutlined />} onClick={handleCollapseAll}>
            Collapse All
          </Button>
        </Space>
      </Card>

      {/* Stands */}
      <div style={{ marginTop: isMobile ? 12 : 16 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: isMobile ? 8 : 12,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <Text style={{ color: '#fff', fontWeight: 600, fontSize: isMobile ? 13 : 14 }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Stands ({stadium?.stands?.length || 0})
          </Text>
          <Input
            allowClear
            value={standFilter}
            onChange={e => setStandFilter(e.target.value)}
            placeholder="Search stand or code"
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
            size="small"
            style={{
              width: isMobile ? '100%' : 240,
              background: 'rgba(255,255,255,0.04)',
              border: 'none',
              color: '#fff',
            }}
          />
        </div>

        {!stadium?.stands?.length ? (
          <Empty
            description={<Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 12 : 14 }}>No stands yet</Text>}
            style={{ padding: isMobile ? 20 : 40 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={addStand} size={isMobile ? 'small' : 'middle'}>
              Create First Stand
            </Button>
          </Empty>
        ) : !filteredStands.length ? (
          <Alert
            type="warning"
            message="No stands match your search."
            showIcon
            style={{ background: 'rgba(250,173,20,0.08)', borderColor: 'rgba(250,173,20,0.3)' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12 }}>
            {filteredStands.map(renderStandEditor)}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {stadium?.stands?.length > 0 && (
        <Alert
          type="info"
          style={{ 
            marginTop: isMobile ? 12 : 16, 
            background: 'rgba(24, 144, 255, 0.1)', 
            border: '1px solid rgba(24, 144, 255, 0.3)',
            padding: isMobile ? '8px 12px' : undefined,
          }}
          message={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: isMobile ? 4 : 8,
              fontSize: isMobile ? 11 : 14,
            }}>
              <span>
                <strong>{stadium.stands.length}</strong> {isMobile ? 'St' : 'Stands'}
              </span>
              <span>
                <strong>{stadium.stands.reduce((sum, s) => sum + (s.tiers?.length || 0), 0)}</strong> {isMobile ? 'Ti' : 'Tiers'}
              </span>
              <span>
                <strong>
                  {stadium.stands.reduce((sum, s) =>
                    s.tiers?.reduce((ts, t) => ts + (t.sections?.length || 0), sum) || sum, 0
                  )}
                </strong> {isMobile ? 'Se' : 'Sections'}
              </span>
              <span>
                <strong>
                  {stadium.stands.reduce((sum, s) =>
                    s.tiers?.reduce((ts, t) =>
                      t.sections?.reduce((ss, sec) =>
                        sec.rows?.reduce((rs, r) => rs + (r.seatCount || 0), ss) || ss, ts
                      ) || ts, sum
                    ) || sum, 0
                  )}
                </strong> Seats
              </span>
            </div>
          }
        />
      )}
    </div>
  );
};

// ============================================
// STYLES
// ============================================

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
};

const standCardStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
};

const standHeaderStyle = {
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const tierCardStyle = {
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 6,
  marginBottom: 8,
};

const tierHeaderStyle = {
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
};

const sectionCardStyle = {
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: 4,
  marginBottom: 6,
};

const sectionHeaderStyle = {
  padding: '6px 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
};

const rowItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 8px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: 4,
  marginBottom: 4,
};

const statChipStyle = {
  padding: '2px 10px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 12,
};

export default StadiumBuilder;

import React from 'react';
import {
  Typography,
  Button,
  Input,
  Switch,
  Tag,
  Tooltip,
  InputNumber,
  Popconfirm,
} from 'antd';
import { 
  LayoutOutlined, 
  AppstoreOutlined, 
  PlusOutlined, 
  TagOutlined, 
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const TierSectionPanel = ({
  stand,
  viewMode,
  selectedTierId,
  selectedSectionId,
  onSelectTier,
  onSelectSection,
  onAddTier,
  onAddSection,
  onUpdateTier,
  onDeleteTier,
  onUpdateSection,
  onDeleteSection,
  onAssignTicket,
  isMobile,
}) => {
  if (!stand) {
    return (
      <div 
        className="d-flex flex-column align-items-center justify-content-center h-100 rounded-3"
        style={{ 
          background: 'linear-gradient(180deg, rgba(30,30,50,0.6) 0%, rgba(20,20,35,0.8) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: 300,
        }}
      >
        <div 
          className="rounded-circle mb-3 d-flex align-items-center justify-content-center"
          style={{ width: 64, height: 64, background: 'rgba(139,92,246,0.1)' }}
        >
          <LayoutOutlined style={{ fontSize: 28, color: '#a78bfa' }} />
        </div>
        <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Select a stand to view tiers</Text>
      </div>
    );
  }

  const tiers = stand.tiers || [];

  return (
    <div 
      className="d-flex flex-column h-100 rounded-3"
      style={{ 
        background: 'linear-gradient(180deg, rgba(30,30,50,0.6) 0%, rgba(20,20,35,0.8) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div 
        className="p-3"
        style={{ 
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <div 
            className="rounded-2 d-flex align-items-center justify-content-center"
            style={{ 
              width: 36, 
              height: 36, 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
            }}
          >
            <LayoutOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div className="flex-fill">
            <Text className="fw-semibold text-white d-block" style={{ fontSize: 14 }}>Tiers & Sections</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              {tiers.length} tiers in <span style={{ color: '#3b82f6' }}>{stand.name}</span>
            </Text>
          </div>
        </div>
        
        <Button 
          icon={<PlusOutlined />} 
          size="small" 
          type="primary"
          onClick={() => onAddTier(stand.id)} 
          className="w-100"
          style={{ 
            height: 32,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          Add New Tier
        </Button>
      </div>

      {/* Tiers List */}
      <div className="flex-fill overflow-auto p-2" style={{ maxHeight: isMobile ? 'unset' : 'calc(100% - 120px)' }}>
        {!tiers.length ? (
          <div className="text-center py-5">
            <div 
              className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: 64, height: 64, background: 'rgba(139,92,246,0.1)' }}
            >
              <LayoutOutlined style={{ fontSize: 28, color: '#a78bfa' }} />
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 12 }}>
              No tiers created yet
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small" 
              onClick={() => onAddTier(stand.id)}
              style={{ 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
              }}
            >
              Create First Tier
            </Button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {tiers.map((tier) => {
              const sectionCount = tier.sections?.length || 0;
              const totalSeats = tier.sections?.reduce(
                (sum, section) => sum + (section.rows?.reduce((rSum, row) => rSum + (row.seatCount || 0), 0) || 0),
                0
              ) || 0;
              const isSelectedTier = selectedTierId === tier.id;
              // If stand is blocked, tier is also blocked
              const isStandBlocked = stand.status === 'blocked';
              const isBlocked = isStandBlocked || tier.status === 'blocked';

              return (
                <div 
                  key={tier.id} 
                  className="rounded-3 overflow-hidden"
                  style={{
                    background: isSelectedTier 
                      ? 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSelectedTier ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.05)'}`,
                    opacity: isBlocked ? 0.5 : 1,
                  }}
                >
                  {/* Tier Header */}
                  <div 
                    className="p-2 d-flex align-items-center gap-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectTier(tier.id)}
                  >
                    {/* Expand Icon */}
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: 20, height: 20 }}
                    >
                      {isSelectedTier ? (
                        <DownOutlined style={{ color: '#a78bfa', fontSize: 10 }} />
                      ) : (
                        <RightOutlined style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                      )}
                    </div>
                    
                    {/* Color Indicator */}
                    <div
                      className="rounded flex-shrink-0"
                      style={{
                        width: 16,
                        height: 16,
                        background: `linear-gradient(135deg, ${tier.style?.color || '#8b5cf6'} 0%, ${tier.style?.color || '#8b5cf6'}cc 100%)`,
                        boxShadow: `0 2px 8px ${tier.style?.color || '#8b5cf6'}40`,
                      }}
                    />
                    
                    {/* Name Input */}
                    <Input
                      value={tier.name}
                      onChange={(e) => onUpdateTier(stand.id, tier.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#fff',
                        padding: '2px 6px',
                        fontSize: 13,
                        fontWeight: 500,
                        flex: 1,
                        minWidth: 0,
                      }}
                      size="small"
                    />

                    {/* Stats */}
                    <div className="d-flex gap-1 flex-shrink-0">
                      <Tag 
                        style={{ 
                          background: 'rgba(20,184,166,0.12)', 
                          border: 'none', 
                          color: '#2dd4bf', 
                          fontSize: 10, 
                          padding: '0 6px',
                          margin: 0,
                          borderRadius: 4,
                        }}
                      >
                        {sectionCount} sec
                      </Tag>
                      <Tag 
                        style={{ 
                          background: 'rgba(34,197,94,0.12)', 
                          border: 'none', 
                          color: '#4ade80', 
                          fontSize: 10, 
                          padding: '0 6px',
                          margin: 0,
                          borderRadius: 4,
                        }}
                      >
                        {totalSeats.toLocaleString()}
                      </Tag>
                    </div>

                    {/* Actions */}
                    <div className="d-flex align-items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {viewMode === 'advanced' ? (
                        <InputNumber
                          value={tier.basePrice}
                          min={0}
                          onChange={(val) => onUpdateTier(stand.id, tier.id, { basePrice: val })}
                          size="small"
                          prefix={<DollarOutlined style={{ fontSize: 10 }} />}
                          style={{ 
                            width: 75, 
                            background: 'rgba(0,0,0,0.3)', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 4,
                          }}
                        />
                      ) : (
                        <Tag 
                          style={{ 
                            background: 'rgba(251,191,36,0.12)', 
                            border: 'none', 
                            color: '#fbbf24', 
                            fontSize: 11,
                            margin: 0,
                            borderRadius: 4,
                          }}
                        >
                          ₹{tier.basePrice || 0}
                        </Tag>
                      )}
                      <Switch
                        size="small"
                        checked={tier.status !== 'blocked'}
                        onChange={(checked) => onUpdateTier(stand.id, tier.id, { status: checked ? 'active' : 'blocked' })}
                      />
                      <Tooltip title="Assign ticket">
                        <Button
                          type="text"
                          icon={<TagOutlined />}
                          size="small"
                          onClick={() => onAssignTicket?.('tier', tier, stand.id)}
                          style={{ color: tier.ticketTypeId ? '#8b5cf6' : 'rgba(255,255,255,0.25)', padding: '0 4px', height: 24 }}
                        />
                      </Tooltip>
                      <Popconfirm title="Delete tier?" onConfirm={() => onDeleteTier(stand.id, tier.id)} okText="Yes" okButtonProps={{ danger: true }}>
                        <Button type="text" icon={<DeleteOutlined />} size="small" style={{ color: 'rgba(255,255,255,0.25)', padding: '0 4px', height: 24 }} />
                      </Popconfirm>
                    </div>
                  </div>

                  {/* Sections (Expanded) */}
                  {isSelectedTier && (
                    <div className="px-2 pb-2">
                      <div 
                        className="rounded-2 p-2"
                        style={{ background: 'rgba(0,0,0,0.25)' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <AppstoreOutlined style={{ color: '#2dd4bf', fontSize: 12 }} />
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}>
                              Sections ({sectionCount})
                            </Text>
                          </div>
                          <Button 
                            icon={<PlusOutlined />} 
                            size="small" 
                            onClick={() => onAddSection(stand.id, tier.id)}
                            style={{ 
                              height: 26,
                              background: 'rgba(20,184,166,0.12)', 
                              borderColor: 'rgba(20,184,166,0.25)', 
                              color: '#2dd4bf', 
                              fontSize: 11,
                              borderRadius: 4,
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {!sectionCount ? (
                          <div 
                            className="text-center py-3 rounded-2" 
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
                          >
                            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                              No sections yet
                            </Text>
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            {tier.sections.map((section) => {
                              const rowCount = section.rows?.length || 0;
                              const seatCount = section.rows?.reduce((sum, row) => sum + (row.seatCount || 0), 0) || 0;
                              const isSelectedSection = selectedSectionId === section.id;
                              // If stand or tier is blocked, section is also blocked
                              const isSectionBlocked = isBlocked || section.status === 'blocked';

                              return (
                                <div
                                  key={section.id}
                                  className="rounded-2 p-2 d-flex align-items-center gap-2"
                                  style={{
                                    background: isSelectedSection 
                                      ? 'rgba(20,184,166,0.12)' 
                                      : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isSelectedSection ? 'rgba(20,184,166,0.3)' : 'rgba(255,255,255,0.04)'}`,
                                    cursor: 'pointer',
                                    opacity: isSectionBlocked ? 0.5 : 1,
                                  }}
                                  onClick={() => onSelectSection(section.id)}
                                >
                                  <Input
                                    value={section.name}
                                    onChange={(e) => onUpdateSection(stand.id, tier.id, section.id, { name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ 
                                      background: 'transparent', 
                                      border: 'none', 
                                      color: '#fff',
                                      padding: '2px 6px',
                                      fontSize: 12,
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                    size="small"
                                  />
                                  <Tag 
                                    style={{ 
                                      background: 'rgba(255,255,255,0.06)', 
                                      border: 'none', 
                                      color: 'rgba(255,255,255,0.5)', 
                                      fontSize: 10, 
                                      padding: '0 6px',
                                      margin: 0,
                                      borderRadius: 4,
                                    }}
                                  >
                                    {rowCount}R · {seatCount}S
                                  </Tag>
                                  
                                  <div className="d-flex align-items-center gap-0" onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                      size="small"
                                      checked={section.status !== 'blocked'}
                                      onChange={(checked) => onUpdateSection(stand.id, tier.id, section.id, { status: checked ? 'active' : 'blocked' })}
                                    />
                                    <Tooltip title="Assign ticket">
                                      <Button
                                        type="text"
                                        icon={<TagOutlined />}
                                        size="small"
                                        onClick={() => onAssignTicket?.('section', section, stand.id, tier.id)}
                                        style={{ color: section.ticketTypeId ? '#2dd4bf' : 'rgba(255,255,255,0.2)', padding: '0 4px', height: 24 }}
                                      />
                                    </Tooltip>
                                    <Popconfirm
                                      title="Delete section?"
                                      onConfirm={() => onDeleteSection(stand.id, tier.id, section.id)}
                                      okText="Yes"
                                      okButtonProps={{ danger: true }}
                                    >
                                      <Button type="text" icon={<DeleteOutlined />} size="small" style={{ color: 'rgba(255,255,255,0.2)', padding: '0 4px', height: 24 }} />
                                    </Popconfirm>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TierSectionPanel;


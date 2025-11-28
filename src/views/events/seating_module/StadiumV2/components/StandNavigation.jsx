import React from 'react';
import { Input, Typography, Button, Tag, Switch, Tooltip, Popconfirm, Empty } from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  TagOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  CloseCircleFilled
} from '@ant-design/icons';

const { Text } = Typography;

const StandNavigation = ({
  isMobile,
  stands,
  totalStandCount,
  standFilter,
  onChangeFilter,
  selectedStandId,
  onSelectStand,
  onAddStand,
  onQuickAddStand,
  onAssignTicket,
  onUpdateStand,
  onDeleteStand,
}) => {
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
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <div 
            className="rounded-2 d-flex align-items-center justify-content-center"
            style={{ 
              width: 36, 
              height: 36, 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}
          >
            <AppstoreOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div className="flex-fill">
            <Text className="fw-semibold text-white d-block" style={{ fontSize: 14 }}>Stands</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              {totalStandCount} {totalStandCount === 1 ? 'stand' : 'stands'} total
            </Text>
          </div>
        </div>
        
        <div className="d-flex gap-2 mb-3">
          <Button
            size="small"
            icon={<PlusOutlined />}
            type="primary"
            onClick={onAddStand}
            className="flex-fill"
            style={{ 
              height: 32,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Add
          </Button>
          <Button
            size="small"
            onClick={onQuickAddStand}
            icon={<ThunderboltOutlined />}
            style={{ 
              height: 32,
              background: 'rgba(251,191,36,0.12)', 
              borderColor: 'rgba(251,191,36,0.25)', 
              color: '#fbbf24',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Quick
          </Button>
        </div>

        <Input
          allowClear
          value={standFilter}
          onChange={(e) => onChangeFilter(e.target.value)}
          placeholder="Search stands..."
          size="small"
          prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
          style={{ 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
          }}
        />
      </div>

      {/* Stand List */}
      <div className="flex-fill overflow-auto p-2" style={{ maxHeight: isMobile ? 'unset' : 'calc(100% - 160px)' }}>
        {!totalStandCount ? (
          <div className="text-center py-5">
            <div 
              className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: 64, height: 64, background: 'rgba(59,130,246,0.1)' }}
            >
              <AppstoreOutlined style={{ fontSize: 28, color: '#3b82f6' }} />
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 12 }}>
              No stands created yet
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small" 
              onClick={onAddStand}
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
              }}
            >
              Create First Stand
            </Button>
          </div>
        ) : !stands.length ? (
          <div 
            className="text-center py-4 px-3 rounded-2" 
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
          >
            <Text style={{ color: '#fbbf24' }}>No matches found</Text>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {stands.map((stand) => {
              const tierCount = stand.tiers?.length || 0;
              const seatCount = stand.tiers?.reduce(
                (sum, tier) => sum + (tier.sections?.reduce((secSum, sec) => 
                  secSum + (sec.rows?.reduce((rowSum, row) => rowSum + (row.seatCount || 0), 0) || 0), 0) || 0),
                0
              ) || 0;
              const isActive = selectedStandId === stand.id;
              const isBlocked = stand.status === 'blocked';

              return (
                <div
                  key={stand.id}
                  className="rounded-3 position-relative"
                  style={{
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isBlocked ? 0.5 : 1,
                    overflow: 'hidden',
                  }}
                  onClick={() => onSelectStand(stand.id)}
                >
                  {/* Selection Indicator */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    }} />
                  )}

                  <div className="p-2 ps-3">
                    <div className="d-flex align-items-center gap-2">
                      {/* Color Badge */}
                      <div 
                        className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{ 
                          width: 40, 
                          height: 40, 
                          background: `linear-gradient(135deg, ${stand.style?.color || '#3b82f6'} 0%, ${stand.style?.color || '#3b82f6'}cc 100%)`,
                          color: '#fff',
                          fontSize: 14,
                          boxShadow: `0 4px 12px ${stand.style?.color || '#3b82f6'}40`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {stand.code?.slice(0, 2) || 'ST'}
                      </div>

                      {/* Info */}
                      <div className="flex-fill min-width-0">
                        <div className="d-flex align-items-center gap-2">
                          <Text className="fw-semibold text-white text-truncate" style={{ fontSize: 13 }}>
                            {stand.name}
                          </Text>
                          {stand.status === 'active' ? (
                            <CheckCircleFilled style={{ color: '#4ade80', fontSize: 10 }} />
                          ) : (
                            <CloseCircleFilled style={{ color: '#f87171', fontSize: 10 }} />
                          )}
                        </div>
                        <div className="d-flex gap-1 mt-1">
                          <Tag 
                            style={{ 
                              background: 'rgba(139,92,246,0.12)', 
                              border: 'none', 
                              color: '#a78bfa', 
                              fontSize: 10, 
                              padding: '0 6px',
                              margin: 0,
                              borderRadius: 4,
                            }}
                          >
                            {tierCount} tiers
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
                            {seatCount.toLocaleString()} seats
                          </Tag>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="d-flex flex-column gap-1 align-items-end" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          size="small"
                          checked={stand.status === 'active'}
                          onChange={(checked) => onUpdateStand(stand.id, { status: checked ? 'active' : 'blocked' })}
                        />
                        <div className="d-flex gap-0">
                          <Tooltip title="Assign ticket">
                            <Button
                              type="text"
                              icon={<TagOutlined />}
                              size="small"
                              onClick={() => onAssignTicket?.('stand', stand)}
                              style={{ 
                                color: stand.ticketTypeId ? '#3b82f6' : 'rgba(255,255,255,0.25)', 
                                padding: '0 4px',
                                height: 24,
                              }}
                            />
                          </Tooltip>
                          <Popconfirm 
                            title="Delete this stand?" 
                            onConfirm={() => onDeleteStand(stand.id)} 
                            okText="Yes" 
                            okButtonProps={{ danger: true }}
                          >
                            <Button 
                              type="text" 
                              icon={<DeleteOutlined />} 
                              size="small" 
                              style={{ 
                                color: 'rgba(255,255,255,0.25)', 
                                padding: '0 4px',
                                height: 24,
                              }} 
                            />
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandNavigation;


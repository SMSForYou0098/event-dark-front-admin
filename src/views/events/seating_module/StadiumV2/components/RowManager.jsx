import React from 'react';
import { Typography, Button, Input, InputNumber, Tooltip, Popconfirm, Tag } from 'antd';
import { PlusOutlined, TagOutlined, DeleteOutlined, UnorderedListOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

const RowManager = ({
  stand,
  tier,
  section,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  onAssignTicket,
  isMobile,
}) => {
  if (!stand || !tier || !section) {
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
          style={{ width: 64, height: 64, background: 'rgba(251,146,60,0.1)' }}
        >
          <UnorderedListOutlined style={{ fontSize: 28, color: '#fb923c' }} />
        </div>
        <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Select a section to manage rows</Text>
      </div>
    );
  }

  const rows = section.rows || [];
  const totalSeats = rows.reduce((sum, row) => sum + (row.seatCount || 0), 0);

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
          background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(251,146,60,0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <div 
            className="rounded-2 d-flex align-items-center justify-content-center"
            style={{ 
              width: 36, 
              height: 36, 
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
              boxShadow: '0 4px 12px rgba(251,146,60,0.3)',
            }}
          >
            <UnorderedListOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div className="flex-fill">
            <Text className="fw-semibold text-white d-block" style={{ fontSize: 14 }}>Rows</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              {rows.length} rows · {totalSeats.toLocaleString()} seats
            </Text>
          </div>
        </div>

        {/* Breadcrumb */}
        <div 
          className="rounded-2 px-2 py-1 mb-3 d-flex flex-wrap gap-1 align-items-center"
          style={{ background: 'rgba(0,0,0,0.25)', fontSize: 11 }}
        >
          <Text style={{ color: '#3b82f6', fontWeight: 500 }}>{stand.name}</Text>
          <RightOutlined style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
          <Text style={{ color: '#a78bfa', fontWeight: 500 }}>{tier.name}</Text>
          <RightOutlined style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
          <Text style={{ color: '#2dd4bf', fontWeight: 500 }}>{section.name}</Text>
        </div>
        
        <Button 
          icon={<PlusOutlined />} 
          size="small" 
          type="primary"
          onClick={() => onAddRow(stand.id, tier.id, section.id)}
          className="w-100"
          style={{ 
            height: 32,
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
            border: 'none',
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          Add New Row
        </Button>
      </div>

      {/* Rows List */}
      <div className="flex-fill overflow-auto p-2" style={{ maxHeight: isMobile ? 'unset' : 'calc(100% - 180px)' }}>
        {!rows.length ? (
          <div className="text-center py-5">
            <div 
              className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: 64, height: 64, background: 'rgba(251,146,60,0.1)' }}
            >
              <UnorderedListOutlined style={{ fontSize: 28, color: '#fb923c' }} />
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 12 }}>
              No rows created yet
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small" 
              onClick={() => onAddRow(stand.id, tier.id, section.id)}
              style={{ 
                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                border: 'none',
              }}
            >
              Create First Row
            </Button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-1">
            {rows.map((row, index) => (
              <div 
                key={row.id} 
                className="rounded-2 p-2 d-flex align-items-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Row Number */}
                <div 
                  className="rounded-1 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                  style={{ 
                    width: 28, 
                    height: 28, 
                    background: 'linear-gradient(135deg, rgba(251,146,60,0.2) 0%, rgba(251,146,60,0.1) 100%)',
                    color: '#fb923c',
                    fontSize: 11,
                    border: '1px solid rgba(251,146,60,0.2)',
                  }}
                >
                  {index + 1}
                </div>

                {/* Label */}
                <Input
                  value={row.label}
                  onChange={(e) => onUpdateRow(stand.id, tier.id, section.id, row.id, { label: e.target.value })}
                  style={{ 
                    background: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    color: '#fff',
                    width: 50,
                    textAlign: 'center',
                    fontWeight: 600,
                    borderRadius: 4,
                  }}
                  size="small"
                />

                {/* Seat Count */}
                <InputNumber
                  value={row.seatCount}
                  min={1}
                  max={150}
                  onChange={(val) => onUpdateRow(stand.id, tier.id, section.id, row.id, { seatCount: val })}
                  size="small"
                  className="flex-fill"
                  style={{ 
                    background: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    minWidth: 60,
                  }}
                  addonAfter={<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>seats</span>}
                />

                {/* Actions */}
                <div className="d-flex gap-0 align-items-center flex-shrink-0">
                  <Tooltip title="Assign ticket">
                    <Button
                      type="text"
                      icon={<TagOutlined />}
                      size="small"
                      onClick={() => onAssignTicket?.('row', row, stand.id, tier.id, section.id)}
                      style={{ color: row.ticketTypeId ? '#fb923c' : 'rgba(255,255,255,0.25)', padding: '0 4px', height: 24 }}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this row?"
                    onConfirm={() => onDeleteRow(stand.id, tier.id, section.id, row.id)}
                    okText="Yes"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" icon={<DeleteOutlined />} size="small" style={{ color: 'rgba(255,255,255,0.25)', padding: '0 4px', height: 24 }} />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {rows.length > 0 && (
        <div 
          className="p-2 d-flex justify-content-between align-items-center"
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            background: 'rgba(0,0,0,0.2)' 
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Summary</Text>
          <div className="d-flex gap-2">
            <Tag 
              style={{ 
                background: 'rgba(251,146,60,0.12)', 
                border: 'none', 
                color: '#fb923c', 
                fontSize: 10,
                margin: 0,
                borderRadius: 4,
              }}
            >
              {rows.length} rows
            </Tag>
            <Tag 
              style={{ 
                background: 'rgba(34,197,94,0.12)', 
                border: 'none', 
                color: '#4ade80', 
                fontSize: 10,
                margin: 0,
                borderRadius: 4,
              }}
            >
              {totalSeats.toLocaleString()} seats
            </Tag>
          </div>
        </div>
      )}
    </div>
  );
};

export default RowManager;


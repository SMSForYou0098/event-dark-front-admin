/**
 * FolderItem - Reusable folder/item card component for hierarchical navigation
 * Used to display stands, tiers, sections, rows in folder-style view
 */

import React, { useState } from 'react';
import { Input, Tag, Switch, Tooltip, Button, Popconfirm, Typography } from 'antd';
import {
  EditOutlined,
  TagOutlined,
  DeleteOutlined,
  RightOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const FolderItem = ({
  item,
  type, // 'stand' | 'tier' | 'section' | 'row' | 'seat'
  color,
  stats,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onAssignTicket,
  onEditGeometry,
  isMobile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name || item.label || '');

  const handleSaveName = () => {
    if (editName.trim()) {
      onEdit({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  const getChildLabel = () => {
    if (type === 'stand') return `${stats?.tiers || 0}T · ${stats?.seats?.toLocaleString() || 0} Seats`;
    if (type === 'tier') return `${stats?.sections || 0} Sections · ${stats?.seats?.toLocaleString() || 0} Seats`;
    if (type === 'section') return `${stats?.rows || 0} Rows · ${stats?.seats?.toLocaleString() || 0} Seats`;
    if (type === 'row') return `${stats?.seatCount || 0} Seats`;
    return '';
  };

  return (
    <div
      onClick={() => !isEditing && onSelect?.()}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: isActive
          ? '1px solid rgba(59,130,246,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: isMobile ? '10px 12px' : '12px 16px',
        cursor: type !== 'seat' ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      {/* Color indicator */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${color || '#3b82f6'} 0%, ${color || '#3b82f6'}99 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
          boxShadow: `0 2px 8px ${color || '#3b82f6'}40`,
        }}
      >
        {type === 'stand' && (item.code || item.name?.charAt(0) || 'S')}
        {type === 'tier' && `T${item.level + 1 || 1}`}
        {type === 'section' && (item.code || `S${item.order + 1}`)}
        {type === 'row' && (item.label || `${item.order + 1}`)}
        {type === 'seat' && item.number}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onPressEnter={handleSaveName}
            onBlur={handleSaveName}
            autoFocus
            size="small"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>
                {item.name || item.label || `${type} ${item.order + 1}`}
              </Text>
              {item.status === 'inactive' && (
                <Tag style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#f87171', margin: 0, fontSize: 10 }}>
                  Inactive
                </Tag>
              )}
              {item.ticketId && (
                <Tag style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#4ade80', margin: 0, fontSize: 10 }}>
                  <TagOutlined /> Assigned
                </Tag>
              )}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              {getChildLabel()}
            </Text>
          </>
        )}
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status toggle */}
        <Tooltip title={item.status === 'active' ? 'Active' : 'Inactive'}>
          <Switch
            size="small"
            checked={item.status === 'active'}
            onChange={(checked) => onStatusChange?.(checked ? 'active' : 'inactive')}
            style={{ marginRight: 4 }}
          />
        </Tooltip>

        {/* Edit name */}
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => setIsEditing(true)}
          style={{ color: 'rgba(255,255,255,0.5)' }}
        />

        {/* Edit geometry (for stands only) */}
        {onEditGeometry && (
          <Tooltip title="Edit Geometry">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => onEditGeometry()}
              style={{ color: 'rgba(255,255,255,0.5)' }}
            />
          </Tooltip>
        )}

        {/* Assign ticket */}
        {onAssignTicket && (
          <Button
            type="text"
            size="small"
            icon={<TagOutlined />}
            onClick={() => onAssignTicket()}
            style={{ color: 'rgba(255,255,255,0.5)' }}
          />
        )}

        {/* Delete */}
        <Popconfirm
          title={`Delete this ${type}?`}
          description="This action cannot be undone."
          onConfirm={() => onDelete?.()}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
          />
        </Popconfirm>

        {/* Navigate arrow for folders */}
        {type !== 'seat' && (
          <RightOutlined style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 4 }} />
        )}
      </div>
    </div>
  );
};

export default FolderItem;

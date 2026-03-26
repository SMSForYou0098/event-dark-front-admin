import React from 'react';
import {
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';

const shapeOptions = [
  { label: 'Rectangle', type: 'rect', entityType: 'stall' },
  { label: 'Square Booth', type: 'square', entityType: 'stall' },
  { label: 'Circle', type: 'circle', entityType: 'stall' },
  { label: 'Text Label', type: 'text', entityType: 'label' },
  { label: 'Line', type: 'line', entityType: 'walkway' },
  { label: 'Polygon', type: 'polygon', entityType: 'restricted' },
];

const entityTypeOptions = [
  { label: 'Stall', value: 'stall' },
  { label: 'Walkway', value: 'walkway' },
  { label: 'Parking', value: 'parking' },
  { label: 'Stage', value: 'stage' },
  { label: 'Label', value: 'label' },
  { label: 'Restricted', value: 'restricted' },
];

const labelStyle = {
  fontSize: 11,
  color: '#888',
  marginBottom: 3,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const fieldStyle = {
  width: '100%',
};

const rowStyle = {
  display: 'grid',
  gap: 8,
};

const Sidebar = ({
  defaults,
  onDefaultChange,
  onAddShape,
  onAddStall,
  onApplyToSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onBringForward,
  onSendBackward,
  onUndo,
  onRedo,
  onSave,
  onExportJson,
  onImportJson,
  onExportImage,
  canUndo,
  canRedo,
  hasSelection,
  loading = false,
  layoutName = '',
  onLayoutNameChange,
  approvalRequired = false,
  onApprovalRequiredChange,
}) => {
  const styleDefaults = defaults.style || {};
  const metaDefaults = defaults.meta || {};

  const syncDefaults = (changed) => {
    onDefaultChange(changed);
  };

  return (
    <Card
      title="Tools"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 48px)', overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* Layout Name */}
        <div>
          <span style={labelStyle}>Layout Name</span>
          <Input 
            size="small" 
            placeholder="Enter layout name" 
            value={layoutName} 
            onChange={(e) => onLayoutNameChange(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={labelStyle}>Approval Required</span>
          <Switch
            size="small"
            checked={!!approvalRequired}
            onChange={(checked) => onApprovalRequiredChange?.(checked)}
          />
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Shape Buttons */}
        <Typography.Text strong style={{ fontSize: 12 }}>Drag to Canvas / Click to Add</Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {shapeOptions.map((shape) => (
            <Button
              key={shape.type}
              size="small"
              draggable
              style={{ fontSize: 11 }}
              onDragStart={(evt) => {
                evt.dataTransfer.setData('shapeType', shape.type);
                evt.dataTransfer.setData('entityType', shape.entityType || defaults.entityType || 'stall');
              }}
              onClick={() => onAddShape(shape.type, { entityType: shape.entityType || defaults.entityType || 'stall' })}
            >
              {shape.label}
            </Button>
          ))}
        </div>

        <Button type="primary" onClick={onAddStall} block size="small">
          + Add Stall
        </Button>

        <Divider style={{ margin: '4px 0' }} />

        {/* Entity Data Section */}
        <Typography.Text strong style={{ fontSize: 12 }}>Default Entity Data</Typography.Text>

        {/* Entity Type — full width */}
        <div>
          <span style={labelStyle}>Entity Type</span>
          <Select
            value={defaults.entityType || 'stall'}
            options={entityTypeOptions}
            size="small"
            style={fieldStyle}
            onChange={(value) => syncDefaults({
              entityType: value,
              meta: { ...(metaDefaults || {}), bookable: value === 'stall' },
            })}
          />
        </div>

        {/* Color + Border Color side by side */}
        <div style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <span style={labelStyle}>Fill Color</span>
            <input
              type="color"
              value={styleDefaults.fill || '#cfcfcf'}
              onChange={(evt) => syncDefaults({ style: { ...styleDefaults, fill: evt.target.value } })}
              style={{ width: '100%', height: 28, border: '1px solid #333', borderRadius: 4, padding: 0, cursor: 'pointer', background: 'none' }}
            />
          </div>
          <div>
            <span style={labelStyle}>Border Color</span>
            <input
              type="color"
              value={styleDefaults.stroke || '#1f1f1f'}
              onChange={(evt) => syncDefaults({ style: { ...styleDefaults, stroke: evt.target.value } })}
              style={{ width: '100%', height: 28, border: '1px solid #333', borderRadius: 4, padding: 0, cursor: 'pointer', background: 'none' }}
            />
          </div>
        </div>

        {/* Name + Border Width side by side */}
        <div style={{ ...rowStyle, gridTemplateColumns: '1fr 80px' }}>
          <div>
            <span style={labelStyle}>Name</span>
            <Input
              size="small"
              value={metaDefaults.name || ''}
              placeholder="Stall A1"
              onChange={(evt) => syncDefaults({ meta: { ...metaDefaults, name: evt.target.value } })}
            />
          </div>
          <div>
            <span style={labelStyle}>Border W</span>
            <InputNumber
              min={0}
              size="small"
              value={Number(styleDefaults.strokeWidth ?? 1)}
              style={{ width: '100%' }}
              onChange={(value) => syncDefaults({ style: { ...styleDefaults, strokeWidth: Number(value ?? 1) } })}
            />
          </div>
        </div>

        {/* Price + Bookable side by side */}
        <div style={{ ...rowStyle, gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
          <div>
            <span style={labelStyle}>Price</span>
            <InputNumber
              min={0}
              size="small"
              value={Number(metaDefaults.price || 0)}
              style={{ width: '100%' }}
              onChange={(value) => syncDefaults({ meta: { ...metaDefaults, price: Number(value || 0) } })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={labelStyle}>Bookable</span>
            <Switch
              size="small"
              checked={!!metaDefaults.bookable}
              onChange={(checked) => syncDefaults({ meta: { ...metaDefaults, bookable: checked } })}
              disabled={defaults.entityType !== 'stall'}
            />
          </div>
        </div>

        <Button block size="small" onClick={onApplyToSelected} disabled={!hasSelection}>
          Apply to Selected
        </Button>

        <Divider style={{ margin: '4px 0' }} />

        {/* Layer Controls */}
        <Typography.Text strong style={{ fontSize: 12 }}>Layer Controls</Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Button size="small" onClick={onBringForward} disabled={!hasSelection}>Bring Forward</Button>
          <Button size="small" onClick={onSendBackward} disabled={!hasSelection}>Send Backward</Button>
        </div>

        {/* Actions */}
        <Typography.Text strong style={{ fontSize: 12 }}>Actions</Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Button size="small" onClick={onDuplicateSelected} disabled={!hasSelection}>Duplicate</Button>
          <Button size="small" danger onClick={onDeleteSelected} disabled={!hasSelection}>Delete</Button>
          <Button size="small" onClick={onUndo} disabled={!canUndo}>Undo</Button>
          <Button size="small" onClick={onRedo} disabled={!canRedo}>Redo</Button>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Save / Export */}
        <Button type="primary" block size="small" onClick={onSave} loading={loading}>Save Layout</Button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Button block size="small" onClick={onExportJson}>Export JSON</Button>
          <Button block size="small" onClick={onImportJson}>Import JSON</Button>
        </div>
        <Button block size="small" onClick={onExportImage}>Export Image</Button>

      </Space>
    </Card>
  );
};

export default Sidebar;
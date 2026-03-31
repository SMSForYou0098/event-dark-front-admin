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
  Tooltip as AntdTooltip,
} from 'antd';
import {
  DragOutlined,
  EditOutlined,
  LineOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const shapeOptions = [
  { label: 'Rectangle', type: 'rect', entityType: 'stall' },
  { label: 'Square Booth', type: 'square', entityType: 'stall' },
  { label: 'Circle', type: 'circle', entityType: 'stall' },
  { label: 'L-Shape Stall', type: 'L_shape', entityType: 'stall' },
  { label: 'T-Shape Stall', type: 'T_shape', entityType: 'stall' },
  { label: 'Text Label', type: 'text', entityType: 'label' },
  { label: 'Line (Fixed)', type: 'line', entityType: 'walkway' },
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
  display: 'block',
  marginRight: 8,
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

const getShapePreview = (shapeType) => {
  const common = {
    border: '1.5px solid #bbb',
    display: 'inline-block',
    background: '#8f8f8f',
  };

  if (shapeType === 'rect') {
    return <span style={{ ...common, width: 22, height: 12, borderRadius: 2 }} />;
  }
  if (shapeType === 'square') {
    return <span style={{ ...common, width: 16, height: 16, borderRadius: 2 }} />;
  }
  if (shapeType === 'circle') {
    return <span style={{ ...common, width: 16, height: 16, borderRadius: '50%' }} />;
  }
  if (shapeType === 'line') {
    return <span style={{ width: 22, height: 0, borderTop: '3px solid #8f8f8f', display: 'inline-block' }} />;
  }
  if (shapeType === 'polygon') {
    return (
      <span
        style={{
          width: 18,
          height: 18,
          border: '1.5px solid #bbb',
          background: '#8f8f8f',
          display: 'inline-block',
          transform: 'rotate(18deg)',
          clipPath: 'polygon(50% 0%, 95% 35%, 77% 90%, 23% 90%, 5% 35%)',
        }}
      />
    );
  }
  if (shapeType === 'text') {
    return <span style={{ fontSize: 12, fontWeight: 700, color: '#bbb', lineHeight: 1 }}>T</span>;
  }
  if (shapeType === 'L_shape') {
    return (
      <span style={{ 
        ...common, 
        width: 18, 
        height: 18, 
        clipPath: 'polygon(0% 0%, 35% 0%, 35% 65%, 100% 65%, 100% 100%, 0% 100%)' 
      }} />
    );
  }
  if (shapeType === 'T_shape') {
    return (
      <span style={{ 
        ...common, 
        width: 18, 
        height: 18, 
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 35%, 65% 35%, 65% 100%, 35% 100%, 35% 35%, 0% 35%)' 
      }} />
    );
  }
  return <span style={{ fontSize: 12, color: '#bbb' }}>?</span>;
};

const getReadableTextColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return '#000000';
  const clean = hexColor.replace('#', '').trim();
  const normalized = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  if (normalized.length !== 6) return '#000000';

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((val) => Number.isNaN(val))) return '#000000';

  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
  return luminance < 150 ? '#ffffff' : '#000000';
};

const Sidebar = ({
  defaults,
  onDefaultChange,
  onAddShape,
  onAddStall,
  onApplyToSelected,
  onBringForward,
  onSendBackward,
  onSave,
  onExportJson,
  onImportJson,
  onExportImage,
  hasSelection,
  loading = false,
  layoutName = '',
  activeTool = 'select',
  onSetTool,
  onLayoutNameChange,
  approvalRequired = false,
  onApprovalRequiredChange,
}) => {
  const styleDefaults = defaults.style || {};
  const metaDefaults = defaults.meta || {};
  const resolvedFontColor = styleDefaults.textColor || getReadableTextColor(styleDefaults.fill || '#cfcfcf');

  const syncDefaults = (changed) => {
    onDefaultChange(changed);
  };

  return (
    <Card
      title="Tools"
      extra={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={labelStyle}>Approval Required</span>
          <Switch
            size="small"
            checked={!!approvalRequired}
            onChange={(checked) => onApprovalRequiredChange?.(checked)}
          />
        </div>
      }
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

        {/* Drawing Tools */}
        <Typography.Text strong style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Drawing Tools</Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { id: 'select', icon: <DragOutlined />, label: 'Select' },
            { id: 'pencil', icon: <EditOutlined />, label: 'Pencil' },
            { id: 'line_draw', icon: <LineOutlined />, label: 'Line' },
            { id: 'eraser', icon: <DeleteOutlined />, label: 'Eraser' },
          ].map(tool => (
            <AntdTooltip title={tool.label} key={tool.id}>
              <Button
                size="small"
                type={activeTool === tool.id ? 'primary' : 'default'}
                icon={tool.icon}
                onClick={() => onSetTool?.(tool.id)}
                style={{ width: '100%' }}
              />
            </AntdTooltip>
          ))}
        </div>

        {/* Shape Buttons */}
        <Typography.Text strong style={{ fontSize: 12 }}>Drag to Canvas / Click to Add</Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {shapeOptions.map((shape) => (
            <Button
              key={shape.type}
              size="small"
              draggable
              title={shape.label}
              style={{
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onDragStart={(evt) => {
                evt.dataTransfer.setData('shapeType', shape.type);
                evt.dataTransfer.setData('entityType', shape.entityType || defaults.entityType || 'stall');
              }}
              onClick={() => onAddShape(shape.type, { entityType: shape.entityType || defaults.entityType || 'stall' })}
            >
              {getShapePreview(shape.type)}
            </Button>
          ))}
        </div>

        <Button type="primary" onClick={onAddStall} block size="small">
          + Add Stall
        </Button>
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

        {/* Fill + Border + Font color in one line */}
        <div style={{ ...rowStyle, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
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
          <div>
            <span style={labelStyle}>Font Color</span>
            <input
              type="color"
              value={resolvedFontColor}
              onChange={(evt) => syncDefaults({ style: { ...styleDefaults, textColor: evt.target.value } })}
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

        {/* Layer Controls */}
        <Typography.Text strong style={{ fontSize: 12 }}>Layer Controls</Typography.Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Button size="small" onClick={onBringForward} disabled={!hasSelection}>Bring Forward</Button>
          <Button size="small" onClick={onSendBackward} disabled={!hasSelection}>Send Backward</Button>
        </div>

        {/* Save / Export */}
        <Button type="primary" block size="small" onClick={onSave} loading={loading}>Save Layout</Button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Button block size="small" onClick={onExportJson}>Export</Button>
          <Button block size="small" onClick={onImportJson}>Import</Button>
        </div>
        <Button block size="small" onClick={onExportImage}>Export Image</Button>

      </Space>
    </Card>
  );
};

export default Sidebar;
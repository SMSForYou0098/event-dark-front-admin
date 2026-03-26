import React, { useEffect } from 'react';
import {
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from 'antd';
import { getElementDimension } from '../utils/layoutReducer';

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

const sectionStyle = {
  fontSize: 12,
  fontWeight: 600,
  margin: '8px 0 6px',
  display: 'block',
};

const grid2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const PropertiesPanel = ({ selectedElements, onUpdateElement, onUpdateSelected }) => {
  const [form] = Form.useForm();

  const isSingle = selectedElements.length === 1;
  const selected = isSingle ? selectedElements[0] : null;

  useEffect(() => {
    if (!selected) {
      form.resetFields();
      return;
    }

    const dimensions = getElementDimension(selected);
    const style = selected.style || {};
    const meta = selected.meta || {};

    form.setFieldsValue({
      x: Number(selected.x || 0),
      y: Number(selected.y || 0),
      width: Number(dimensions.width || 0),
      height: Number(dimensions.height || 0),
      entityType: selected.entityType || 'stall',
      fill: style.fill || '#cfcfcf',
      stroke: style.stroke || '#1f1f1f',
      strokeWidth: Number(style.strokeWidth || 1),
      rotation: Number(selected.rotation || 0),
      name: meta.name || '',
      price: Number(meta.price || 0),
      bookable: !!meta.bookable,
      showLabel: selected.display?.showLabel ?? true,
      text: selected.text || '',
      fontSize: Number(selected.fontSize || 20),
    });
  }, [form, selected]);

  const mapFormValuesToUpdate = (values) => {
    const updates = {};

    if (values.entityType !== undefined) {
      updates.entityType = values.entityType;
      if (values.entityType !== 'stall') {
        updates.meta = { ...(updates.meta || {}), bookable: false };
      }
    }

    ['x', 'y', 'width', 'height', 'rotation', 'text', 'fontSize'].forEach((field) => {
      if (values[field] !== undefined) updates[field] = values[field];
    });

    if (values.fill !== undefined || values.stroke !== undefined || values.strokeWidth !== undefined) {
      updates.style = { ...(updates.style || {}) };
      if (values.fill !== undefined) updates.style.fill = values.fill;
      if (values.stroke !== undefined) updates.style.stroke = values.stroke;
      if (values.strokeWidth !== undefined) updates.style.strokeWidth = values.strokeWidth;
    }

    if (values.name !== undefined || values.price !== undefined || values.bookable !== undefined) {
      updates.meta = { ...(updates.meta || {}) };
      if (values.name !== undefined) updates.meta.name = values.name;
      if (values.price !== undefined) updates.meta.price = values.price;
      if (values.bookable !== undefined) updates.meta.bookable = values.bookable;
    }

    if (values.showLabel !== undefined) {
      updates.display = { ...(updates.display || {}), showLabel: values.showLabel };
    }

    return updates;
  };

  const handleValuesChange = (changedValues) => {
    if (!selectedElements.length) return;
    const updates = mapFormValuesToUpdate(changedValues);
    if (isSingle) {
      onUpdateElement(selected.id, updates);
    } else {
      onUpdateSelected(updates);
    }
  };

  const selectedEntityType = form.getFieldValue('entityType') || selected?.entityType || 'stall';
  const isLabelEntity = selectedEntityType === 'label' || selected?.type === 'text';

  return (
    <Card
      title="Properties"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 48px)', overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px' }}
    >
      {!selectedElements.length && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select an element" />
      )}

      {!!selectedElements.length && !isSingle && (
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
          {selectedElements.length} elements selected — shared changes apply to all.
        </Typography.Text>
      )}

      {!!selectedElements.length && (
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>

          {/* Position */}
          <span style={sectionStyle}>Position</span>
          <div style={grid2}>
            <div>
              <span style={labelStyle}>X</span>
              <Form.Item name="x" noStyle><InputNumber size="small" style={{ width: '100%' }} /></Form.Item>
            </div>
            <div>
              <span style={labelStyle}>Y</span>
              <Form.Item name="y" noStyle><InputNumber size="small" style={{ width: '100%' }} /></Form.Item>
            </div>
          </div>

          {/* Size */}
          {!isLabelEntity && (
            <>
              <span style={{ ...sectionStyle, marginTop: 10 }}>Size</span>
              <div style={grid2}>
                <div>
                  <span style={labelStyle}>Width</span>
                  <Form.Item name="width" noStyle><InputNumber size="small" min={1} style={{ width: '100%' }} /></Form.Item>
                </div>
                <div>
                  <span style={labelStyle}>Height</span>
                  <Form.Item name="height" noStyle><InputNumber size="small" min={1} style={{ width: '100%' }} /></Form.Item>
                </div>
              </div>
            </>
          )}

          {/* Rotation + Entity Type */}
          <span style={{ ...sectionStyle, marginTop: 10 }}>Transform & Type</span>
          <div style={grid2}>
            <div>
              <span style={labelStyle}>Rotation</span>
              <Form.Item name="rotation" noStyle><InputNumber size="small" style={{ width: '100%' }} /></Form.Item>
            </div>
            <div>
              <span style={labelStyle}>Entity Type</span>
              <Form.Item name="entityType" noStyle>
                <Select size="small" options={entityTypeOptions} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>

          {/* Colors */}
          <span style={{ ...sectionStyle, marginTop: 10 }}>Appearance</span>
          <div style={grid2}>
            <div>
              <span style={labelStyle}>Fill Color</span>
              <input
                type="color"
                value={form.getFieldValue('fill') || '#cfcfcf'}
                onChange={(evt) => handleValuesChange({ fill: evt.target.value })}
                style={{ width: '100%', height: 28, border: '1px solid #333', borderRadius: 4, padding: 0, cursor: 'pointer', background: 'none' }}
              />
            </div>
            <div>
              <span style={labelStyle}>Border Color</span>
              <input
                type="color"
                value={form.getFieldValue('stroke') || '#1f1f1f'}
                onChange={(evt) => handleValuesChange({ stroke: evt.target.value })}
                style={{ width: '100%', height: 28, border: '1px solid #333', borderRadius: 4, padding: 0, cursor: 'pointer', background: 'none' }}
              />
            </div>
          </div>

          {/* Border Width */}
          <div style={{ marginTop: 8 }}>
            <span style={labelStyle}>Border Width</span>
            <Form.Item name="strokeWidth" noStyle>
              <InputNumber size="small" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* Meta */}
          <span style={{ ...sectionStyle, marginTop: 10 }}>Metadata</span>

          {/* Name full width */}
          <div style={{ marginBottom: 8 }}>
            <span style={labelStyle}>Name</span>
            <Form.Item name="name" noStyle><Input size="small" /></Form.Item>
          </div>

          {/* Price + Bookable */}
          <div style={{ ...grid2, alignItems: 'end', marginBottom: 8 }}>
            <div>
              <span style={labelStyle}>Price</span>
              <Form.Item name="price" noStyle>
                <InputNumber size="small" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={labelStyle}>Bookable</span>
              <Form.Item name="bookable" noStyle valuePropName="checked">
                <Switch size="small" disabled={selectedEntityType !== 'stall'} />
              </Form.Item>
            </div>
          </div>

          {/* Show Label + Text */}
          <span style={{ ...sectionStyle, marginTop: 10 }}>Display</span>

          {/* Show Label toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Form.Item name="showLabel" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
            <span style={{ fontSize: 12, color: '#aaa' }}>Show Label</span>
          </div>

          {/* Text + Font Size */}
          <div style={{ ...grid2, alignItems: 'end' }}>
            <div>
              <span style={labelStyle}>Text</span>
              <Form.Item name="text" noStyle><Input size="small" /></Form.Item>
            </div>
            <div>
              <span style={labelStyle}>Font Size</span>
              <Form.Item name="fontSize" noStyle>
                <InputNumber size="small" min={8} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>

        </Form>
      )}
    </Card>
  );
};

export default PropertiesPanel;
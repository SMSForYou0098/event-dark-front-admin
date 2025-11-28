/**
 * StandEditPanel - Panel for editing stand geometry (angles, weight)
 */

import React, { useState } from 'react';
import { Card, Input, InputNumber, Button, Space, Typography } from 'antd';

const { Text } = Typography;

const StandEditPanel = ({ stand, onUpdate, onBack, isMobile }) => {
  const [name, setName] = useState(stand?.name || '');
  const [code, setCode] = useState(stand?.code || '');
  const [startAngle, setStartAngle] = useState(stand?.geometry?.startAngle || 0);
  const [endAngle, setEndAngle] = useState(stand?.geometry?.endAngle || 0);
  const [weight, setWeight] = useState(stand?.geometry?.visualWeight || 1);

  const handleSave = () => {
    onUpdate({
      name,
      code,
      geometry: {
        ...stand?.geometry,
        startAngle,
        endAngle,
        visualWeight: weight,
      },
    });
  };

  // Calculate arc span
  const arcSpan = endAngle >= startAngle
    ? endAngle - startAngle
    : (360 - startAngle) + endAngle;

  return (
    <Card
      size="small"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.05) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
      }}
      bodyStyle={{ padding: isMobile ? 12 : 16 }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600 }}>
          ✏️ Edit Stand Geometry
        </Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
            Stand Name
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Stand A"
            size="small"
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
          />
        </div>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
            Code
          </Text>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="A"
            maxLength={3}
            size="small"
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
            Start Angle (°)
          </Text>
          <InputNumber
            value={startAngle}
            onChange={(val) => setStartAngle(val || 0)}
            min={0}
            max={360}
            precision={1}
            size="small"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
          />
        </div>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
            End Angle (°)
          </Text>
          <InputNumber
            value={endAngle}
            onChange={(val) => setEndAngle(val || 0)}
            min={0}
            max={360}
            precision={1}
            size="small"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          Visual Weight (thickness multiplier)
        </Text>
        <InputNumber
          value={weight}
          onChange={(val) => setWeight(val || 1)}
          min={0.5}
          max={3}
          step={0.1}
          precision={1}
          size="small"
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
        />
      </div>

      {/* Preview info */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 12,
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
          Arc Span: <span style={{ color: '#4ade80' }}>{arcSpan.toFixed(1)}°</span>
        </Text>
      </div>

      <Space>
        <Button type="primary" onClick={handleSave} size="small">
          Save Changes
        </Button>
        <Button onClick={onBack} size="small">
          Back
        </Button>
      </Space>
    </Card>
  );
};

export default StandEditPanel;

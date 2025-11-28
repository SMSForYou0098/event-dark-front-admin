/**
 * RowEditPanel - Panel for editing row properties (label, seat count)
 */

import React, { useState } from 'react';
import { Card, Input, InputNumber, Button, Space, Typography } from 'antd';

const { Text } = Typography;

const RowEditPanel = ({ row, onUpdate, onBack, isMobile }) => {
  const [seatCount, setSeatCount] = useState(row?.seatCount || 0);
  const [label, setLabel] = useState(row?.label || '');

  const handleSave = () => {
    onUpdate({ seatCount, label });
  };

  return (
    <Card
      size="small"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
      }}
      bodyStyle={{ padding: isMobile ? 12 : 16 }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: 600 }}>
          ✏️ Edit Row
        </Text>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          Row Label
        </Text>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., A, B, C..."
          size="small"
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          Number of Seats
        </Text>
        <InputNumber
          value={seatCount}
          onChange={(val) => setSeatCount(val || 0)}
          min={0}
          max={100}
          size="small"
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
        />
      </div>
      <Space>
        <Button type="primary" onClick={handleSave} size="small">
          Save Changes
        </Button>
        <Button onClick={onBack} size="small">
          Back to Rows
        </Button>
      </Space>
    </Card>
  );
};

export default RowEditPanel;

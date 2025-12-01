/**
 * SectionEditPanel - Panel for editing section properties
 * 
 * Supports:
 * - Section name
 * - Section-level aisles (EXIT tunnels, stairs that span specific rows)
 * - Aisles can span ALL rows or just a subset (startRow to endRow)
 * - Position is specified as "after seat X"
 */

import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Input, 
  InputNumber,
  Button, 
  Space, 
  Typography, 
  Divider,
  Tooltip,
  Row,
  Col,
  Tag,
  Select,
  Slider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * Section Aisle Schema:
 * {
 *   id: string,
 *   position: 'center' | 'left' | 'right' | number (0-1),
 *   width: number (px),
 *   type: 'exit' | 'stairs' | 'aisle',
 *   label: string,
 * }
 */

const SectionEditPanel = ({ section, onUpdate, onBack, isMobile }) => {
  const [name, setName] = useState(section?.name || '');
  const [aisles, setAisles] = useState(section?.aisles || []);

  // Get row labels from section
  const rowLabels = useMemo(() => {
    return (section?.rows || []).map(r => r.label || r.name || `Row ${r.order + 1}`);
  }, [section]);

  // Get max seat count from rows
  const maxSeats = useMemo(() => {
    const rows = section?.rows || [];
    return Math.max(...rows.map(r => r.seatCount || 0), 20);
  }, [section]);

  const handleSave = () => {
    onUpdate({
      name,
      aisles: aisles.length > 0 ? aisles : null,
    });
  };

  const addAisle = () => {
    const newAisle = {
      id: `aisle-${Date.now()}`,
      afterSeat: Math.floor(maxSeats / 2), // Position after middle seat
      width: 80,
      type: 'exit',
      label: 'EXIT',
      startRowIndex: 0,  // Start from first row
      endRowIndex: rowLabels.length - 1,  // End at last row (full section)
    };
    setAisles([...aisles, newAisle]);
  };

  const removeAisle = (index) => {
    setAisles(aisles.filter((_, i) => i !== index));
  };

  const updateAisle = (index, updates) => {
    setAisles(aisles.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  return (
    <Card
      size="small"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
      }}
      bodyStyle={{ padding: isMobile ? 12 : 16 }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: '#8b5cf6', fontSize: 14, fontWeight: 600 }}>
          ✏️ Edit Section
        </Text>
      </div>

      {/* Section Name */}
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          Section Name
        </Text>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Section A, VIP Area..."
          size="small"
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
        />
      </div>

      <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Section Aisles (Tunnels) */}
      <div style={{ marginBottom: 12 }}>
        <Space style={{ marginBottom: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            EXIT Tunnels / Aisles
          </Text>
          <Tooltip title="These are vertical gaps that span ALL rows in the section (like EXIT tunnels in real stadiums)">
            <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />
          </Tooltip>
        </Space>

        {aisles.length === 0 ? (
          <div style={{ 
            padding: 16, 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: 8,
            textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              No aisles configured. Add one to create a vertical gap in the seating.
            </Text>
          </div>
        ) : (
          aisles.map((aisle, index) => (
            <div 
              key={aisle.id}
              style={{ 
                marginBottom: 8, 
                padding: 10, 
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Row gutter={[8, 8]} align="middle">
                {/* Type & Delete */}
                <Col span={24}>
                  <Space size={4} wrap>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Type:</Text>
                    <Select
                      value={aisle.type}
                      onChange={(val) => updateAisle(index, { 
                        type: val, 
                        label: val === 'exit' ? 'EXIT' : val === 'stairs' ? 'STAIRS' : 'AISLE' 
                      })}
                      size="small"
                      style={{ width: 90 }}
                    >
                      <Select.Option value="exit">
                        <Tag color="green" style={{ margin: 0 }}>EXIT</Tag>
                      </Select.Option>
                      <Select.Option value="stairs">
                        <Tag color="orange" style={{ margin: 0 }}>STAIRS</Tag>
                      </Select.Option>
                      <Select.Option value="aisle">
                        <Tag color="blue" style={{ margin: 0 }}>AISLE</Tag>
                      </Select.Option>
                    </Select>
                    
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeAisle(index)}
                      style={{ marginLeft: 'auto' }}
                    />
                  </Space>
                </Col>

                {/* Position: After Seat X */}
                <Col span={24}>
                  <Space>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>After Seat:</Text>
                    <InputNumber
                      value={aisle.afterSeat}
                      onChange={(val) => updateAisle(index, { afterSeat: val })}
                      min={1}
                      max={maxSeats - 1}
                      size="small"
                      style={{ width: 65 }}
                    />
                    <Tooltip title="The aisle will appear after this seat number in each row">
                      <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </Tooltip>
                  </Space>
                </Col>

                {/* Width */}
                <Col span={24}>
                  <Space>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Width:</Text>
                    <Slider
                      value={aisle.width}
                      onChange={(val) => updateAisle(index, { width: val })}
                      min={40}
                      max={150}
                      style={{ width: 100 }}
                    />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{aisle.width}px</Text>
                  </Space>
                </Col>

                {/* Row Range */}
                <Col span={24}>
                  <Space wrap>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>From Row:</Text>
                    <Select
                      value={aisle.startRowIndex ?? 0}
                      onChange={(val) => updateAisle(index, { startRowIndex: val })}
                      size="small"
                      style={{ width: 70 }}
                    >
                      {rowLabels.map((label, i) => (
                        <Select.Option key={i} value={i}>{label}</Select.Option>
                      ))}
                    </Select>
                    
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>To Row:</Text>
                    <Select
                      value={aisle.endRowIndex ?? rowLabels.length - 1}
                      onChange={(val) => updateAisle(index, { endRowIndex: val })}
                      size="small"
                      style={{ width: 70 }}
                    >
                      {rowLabels.map((label, i) => (
                        <Select.Option key={i} value={i}>{label}</Select.Option>
                      ))}
                    </Select>
                    
                    <Tooltip title="Leave as first to last row for full section tunnel">
                      <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </Tooltip>
                  </Space>
                </Col>

                {/* Custom Label */}
                <Col span={24}>
                  <Space>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Label:</Text>
                    <Input
                      value={aisle.label}
                      onChange={(e) => updateAisle(index, { label: e.target.value })}
                      size="small"
                      style={{ width: 100, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                      placeholder="e.g., EXIT"
                    />
                  </Space>
                </Col>
              </Row>
            </div>
          ))
        )}

        <Button 
          size="small" 
          icon={<PlusOutlined />}
          onClick={addAisle}
          style={{ marginTop: 8 }}
          type="dashed"
          block
        >
          Add Tunnel/Aisle
        </Button>
      </div>

      {/* Visual Preview */}
      {aisles.length > 0 && (
        <div style={{ marginBottom: 12, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 8 }}>
            Preview (Side View)
          </Text>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 4,
            padding: '8px 0',
          }}>
            {/* Simple visual: seats | aisle | seats */}
            <div style={{ flex: 1, height: 20, background: 'rgba(82, 196, 26, 0.3)', borderRadius: 4 }} />
            {aisles.map((aisle, i) => (
              <React.Fragment key={aisle.id}>
                <div style={{ 
                  width: Math.max(aisle.width / 4, 15), 
                  height: 30, 
                  background: aisle.type === 'exit' ? 'rgba(82, 196, 26, 0.5)' : 
                              aisle.type === 'stairs' ? 'rgba(250, 173, 20, 0.5)' : 
                              'rgba(24, 144, 255, 0.5)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 7, fontWeight: 600 }}>{aisle.label}</Text>
                </div>
                <div style={{ flex: 1, height: 20, background: 'rgba(82, 196, 26, 0.3)', borderRadius: 4 }} />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      <Space>
        <Button type="primary" onClick={handleSave} size="small">
          Save Changes
        </Button>
        <Button onClick={onBack} size="small">
          Back to Sections
        </Button>
      </Space>
    </Card>
  );
};

export default SectionEditPanel;

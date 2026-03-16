/**
 * RowEditPanel - Panel for editing row properties
 * 
 * Supports:
 * - Row label (A, B, C...)
 * - Seat blocks with gaps/aisles between them
 * - Aisle positions (for EXIT tunnels, stairs, walkways)
 * - Curve amount for stadium feel
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  InputNumber, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Switch,
  Tooltip,
  Row,
  Col,
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * Row Schema:
 * {
 *   id: string,
 *   label: string (A, B, C...),
 *   seatCount: number (total seats - for backward compatibility),
 *   blocks: [
 *     { seats: 10, type: 'seats' },
 *     { width: 80, type: 'aisle', label: 'EXIT' },  // aisle/gap
 *     { seats: 10, type: 'seats' },
 *   ],
 *   geometry: { curve: number },
 *   status: 'active' | 'blocked',
 * }
 */

const RowEditPanel = ({ row, onUpdate, onBack, isMobile }) => {
  const [label, setLabel] = useState(row?.label || '');
  const [curve, setCurve] = useState(row?.geometry?.curve || 0);
  const [useBlocks, setUseBlocks] = useState(row?.blocks?.length > 0);
  
  // Simple mode - just seat count
  const [seatCount, setSeatCount] = useState(row?.seatCount || 0);
  
  // Advanced mode - blocks with aisles
  const [blocks, setBlocks] = useState(row?.blocks || [
    { id: 'block-1', seats: 10, type: 'seats' },
  ]);

  // Sync blocks to simple seatCount
  useEffect(() => {
    if (useBlocks) {
      const totalSeats = blocks
        .filter(b => b.type === 'seats')
        .reduce((sum, b) => sum + (b.seats || 0), 0);
      setSeatCount(totalSeats);
    }
  }, [blocks, useBlocks]);

  const handleSave = () => {
    const updatedRow = {
      label,
      seatCount,
      geometry: { curve },
    };
    
    if (useBlocks && blocks.length > 0) {
      updatedRow.blocks = blocks;
    } else {
      // Clear blocks if simple mode
      updatedRow.blocks = null;
    }
    
    onUpdate(updatedRow);
  };

  const addBlock = (type) => {
    const newBlock = type === 'seats' 
      ? { id: `block-${Date.now()}`, seats: 10, type: 'seats' }
      : { id: `aisle-${Date.now()}`, width: 60, type: 'aisle', label: '' };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index, updates) => {
    setBlocks(blocks.map((b, i) => i === index ? { ...b, ...updates } : b));
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

      {/* Row Label */}
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

      {/* Curve Amount */}
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          Row Curve (0 = flat, 10 = very curved)
        </Text>
        <InputNumber
          value={curve}
          onChange={(val) => setCurve(val || 0)}
          min={0}
          max={20}
          size="small"
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
        />
      </div>

      <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Toggle: Simple vs Block Mode */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            Use Blocks & Aisles
          </Text>
          <Tooltip title="Enable to create gaps/aisles in the row (e.g., for EXIT tunnels, stairs)">
            <InfoCircleOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />
          </Tooltip>
        </Space>
        <Switch
          checked={useBlocks}
          onChange={setUseBlocks}
          size="small"
        />
      </div>

      {/* Quick Templates (when blocks mode is on) */}
      {useBlocks && (
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 6 }}>
            Quick Templates
          </Text>
          <Space size={4} wrap>
            <Button 
              size="small" 
              onClick={() => {
                setBlocks([
                  { id: 'b1', seats: 10, type: 'seats' },
                  { id: 'a1', width: 70, type: 'aisle', label: 'EXIT' },
                  { id: 'b2', seats: 10, type: 'seats' },
                ]);
              }}
              style={{ fontSize: 10 }}
            >
              🚪 Center Exit
            </Button>
            <Button 
              size="small" 
              onClick={() => {
                setBlocks([
                  { id: 'b1', seats: 8, type: 'seats' },
                  { id: 'a1', width: 50, type: 'aisle', label: 'STAIRS' },
                  { id: 'b2', seats: 8, type: 'seats' },
                  { id: 'a2', width: 50, type: 'aisle', label: 'STAIRS' },
                  { id: 'b3', seats: 8, type: 'seats' },
                ]);
              }}
              style={{ fontSize: 10 }}
            >
              🪜 Two Stairs
            </Button>
            <Button 
              size="small" 
              onClick={() => {
                setBlocks([
                  { id: 'a1', width: 40, type: 'aisle' },
                  { id: 'b1', seats: 20, type: 'seats' },
                  { id: 'a2', width: 40, type: 'aisle' },
                ]);
              }}
              style={{ fontSize: 10 }}
            >
              ↔️ Side Aisles
            </Button>
          </Space>
        </div>
      )}

      {!useBlocks ? (
        /* Simple Mode - Just Seat Count */
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>
            Number of Seats
          </Text>
          <InputNumber
            value={seatCount}
            onChange={(val) => setSeatCount(val || 0)}
            min={0}
            max={200}
            size="small"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none' }}
          />
        </div>
      ) : (
        /* Advanced Mode - Blocks with Aisles */
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 8 }}>
            Seat Blocks & Aisles (left to right)
          </Text>
          
          {blocks.map((block, index) => (
            <div 
              key={block.id} 
              style={{ 
                marginBottom: 8, 
                padding: 8, 
                background: block.type === 'aisle' 
                  ? 'rgba(250, 173, 20, 0.1)' 
                  : 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                border: `1px solid ${block.type === 'aisle' ? 'rgba(250, 173, 20, 0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <Row gutter={8} align="middle">
                <Col flex="auto">
                  {block.type === 'seats' ? (
                    <Space size={4}>
                      <Tag color="blue" style={{ margin: 0 }}>Seats</Tag>
                      <InputNumber
                        value={block.seats}
                        onChange={(val) => updateBlock(index, { seats: val || 0 })}
                        min={1}
                        max={100}
                        size="small"
                        style={{ width: 60, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                      />
                    </Space>
                  ) : (
                    <Space size={4} wrap>
                      <Tag color="orange" style={{ margin: 0 }}>Aisle</Tag>
                      <InputNumber
                        value={block.width}
                        onChange={(val) => updateBlock(index, { width: val || 40 })}
                        min={20}
                        max={200}
                        size="small"
                        placeholder="Width"
                        style={{ width: 60, background: 'rgba(255,255,255,0.05)', border: 'none' }}
                        addonAfter="px"
                      />
                      <Select
                        value={block.label || ''}
                        onChange={(val) => updateBlock(index, { label: val })}
                        size="small"
                        style={{ width: 80 }}
                        placeholder="Label"
                        allowClear
                      >
                        <Select.Option value="EXIT">EXIT</Select.Option>
                        <Select.Option value="STAIRS">STAIRS</Select.Option>
                        <Select.Option value="AISLE">AISLE</Select.Option>
                        <Select.Option value="">None</Select.Option>
                      </Select>
                    </Space>
                  )}
                </Col>
                <Col>
                  <Button 
                    type="text" 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeBlock(index)}
                    disabled={blocks.length === 1 && block.type === 'seats'}
                  />
                </Col>
              </Row>
            </div>
          ))}

          {/* Add Block Buttons */}
          <Space size={8} style={{ marginTop: 8 }}>
            <Button 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => addBlock('seats')}
            >
              Add Seats
            </Button>
            <Button 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => addBlock('aisle')}
              style={{ borderColor: '#faad14', color: '#faad14' }}
            >
              Add Aisle
            </Button>
          </Space>

          {/* Preview */}
          <div style={{ marginTop: 12, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4 }}>
              Preview (Total: {seatCount} seats)
            </Text>
            <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {blocks.map((block, i) => (
                <React.Fragment key={block.id}>
                  {block.type === 'seats' ? (
                    <div style={{ 
                      display: 'flex', 
                      gap: 1,
                    }}>
                      {Array.from({ length: Math.min(block.seats, 15) }).map((_, j) => (
                        <div 
                          key={j}
                          style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: 2, 
                            background: '#52c41a',
                          }} 
                        />
                      ))}
                      {block.seats > 15 && (
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8 }}>
                          +{block.seats - 15}
                        </Text>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      width: Math.min(block.width / 3, 30), 
                      height: 8, 
                      background: 'rgba(250, 173, 20, 0.3)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {block.label && (
                        <Text style={{ color: '#faad14', fontSize: 6 }}>{block.label}</Text>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

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

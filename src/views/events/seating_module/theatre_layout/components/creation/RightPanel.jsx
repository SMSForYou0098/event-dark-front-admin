import React from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Slider,
  Radio
} from "antd";

import {
  PlusOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { getIconComponent, seatIcons } from "../consts";

const { Option } = Select;

const RightPanel = (props) => {
  const { selectedType, selectedElement, stage, setStage, setSelectedElement, updateSection, updateRow, updateSeat, sections, setSections, addRowToSection, ticketCategories} = props;

  return (
    <div className="right-panel">
          <div className="panel-header">
            <h3>
              {selectedType === 'stage' && 'Stage Editor'}
              {selectedType === 'section' && 'Section Editor'}
              {selectedType === 'row' && 'Row Editor'}
              {selectedType === 'seat' && 'Seat Editor'}
              {!selectedType && 'Select an Element'}
            </h3>
          </div>

          <div className="editor-content">
            {!selectedType && (
              <div className="empty-state">
                <p>Select a stage, section, row, or seat to edit its properties</p>
              </div>
            )}

            {/* Stage Editor */}
            {selectedType === 'stage' && (
              <Form layout="vertical" className="editor-form">
                <Form.Item label="Stage/Screen Name">
                  <Input
                    value={stage.name}
                    onChange={(e) => {
                      const updatedStage = { ...stage, name: e.target.value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                    placeholder="e.g., SCREEN, STAGE, etc."
                  />
                </Form.Item>

                <Form.Item label="Position">
                  <Select
                    value={stage.position}
                    onChange={(value) => {
                      const updatedStage = { ...stage, position: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                  >
                    <Option value="top">Top</Option>
                    <Option value="bottom">Bottom</Option>
                    <Option value="center">Center</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Shape">
                  <Select
                    value={stage.shape}
                    onChange={(value) => {
                      const updatedStage = { ...stage, shape: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                  >
                    <Option value="straight">Straight</Option>
                    <Option value="curved">Curved</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Width">
                  <InputNumber
                    min={200}
                    value={stage.width}
                    onChange={(value) => {
                      const updatedStage = { ...stage, width: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item label="Height">
                  <InputNumber
                    min={30}
                    value={stage.height}
                    onChange={(value) => {
                      const updatedStage = { ...stage, height: value };
                      setStage(updatedStage);
                      setSelectedElement(updatedStage);
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <div style={{
                  padding: '12px',
                  background: '#f0f7ff',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  💡 Tip: Click and drag the screen to move it. Use corner handles to resize.
                </div>
              </Form>
            )}

            {/* Section Editor */}
            {selectedType === 'section' && selectedElement && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Section Name</div>
                  <Input
                    value={selectedElement.name}
                    onChange={(e) => {
                      updateSection(selectedElement.id, { name: e.target.value });
                      setSelectedElement({ ...selectedElement, name: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Section Type</div>
                  <Select
                    value={selectedElement.type}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { type: value });
                      setSelectedElement({ ...selectedElement, type: value });
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'Regular', label: 'Regular' },
                      { value: 'Balcony', label: 'Balcony' },
                      { value: 'VIP', label: 'VIP' },
                      { value: 'Lower', label: 'Lower' },
                      { value: 'Upper', label: 'Upper' }
                    ]}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Width</div>
                  <InputNumber
                    value={selectedElement.width}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { width: value });
                      setSelectedElement({ ...selectedElement, width: value });
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Height</div>
                  <InputNumber
                    value={selectedElement.height}
                    onChange={(value) => {
                      updateSection(selectedElement.id, { height: value });
                      setSelectedElement({ ...selectedElement, height: value });
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  block
                  onClick={() => addRowToSection(selectedElement.id)}
                >
                  Add Row
                </Button>

                <div>
                  <div><strong>Rows:</strong> {selectedElement.rows.length}</div>
                  <div><strong>Total Seats:</strong> {selectedElement.rows.reduce((total, row) => total + row.seats.length, 0)}</div>
                  <div style={{ marginTop: '8px', color: '#666' }}>
                    <strong>💡 Tip:</strong> Click and drag to move. Use corner handles to resize.
                  </div>
                </div>
              </Space>
            )}

            {/* Row Editor - UPDATED WITH ICON SELECTOR */}
            {selectedType === 'row' && selectedElement && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Title</div>
                  <Input
                    value={selectedElement.title}
                    onChange={(e) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { title: e.target.value });
                      setSelectedElement({ ...selectedElement, title: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Number of Seats</div>
                  <InputNumber
                    min={1}
                    max={50}
                    value={selectedElement.numberOfSeats}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { numberOfSeats: value });
                      setSelectedElement({ ...selectedElement, numberOfSeats: value });
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* NEW: Row Seat Icon Selector */}
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Seat Icon</div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    Apply icon to all seats (except custom ones)
                  </div>
                  <Space wrap size={8}>
                    {/* Default numeric seat */}
                    <div
                      onClick={() => {
                        // Update all sections at once
                        setSections(sections?.map(section => {
                          if (section?.id === selectedElement?.sectionId) {
                            return {
                              ...section,
                              rows: section?.rows?.map(row => {
                                if (row?.id === selectedElement?.id) {
                                  return {
                                    ...row,
                                    defaultIcon: null,
                                    seats: (row?.seats || [])?.map(seat =>
                                      seat.customIcon ? seat : { ...seat, icon: null }
                                    )
                                  };
                                }
                                return row;
                              })
                            };
                          }
                          return section;
                        }));
                        setSelectedElement({ ...selectedElement, defaultIcon: null });
                      }}
                      className='border-secondary'
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: !selectedElement.defaultIcon ? 'var(--primary-color)' : 'transparent',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                      title="Default (Numbers)"
                    >
                      1
                    </div>

                    {/* Icon options */}
                    {seatIcons?.map(iconObj => {
                      const IconComponent = getIconComponent(iconObj?.icon);
                      const isActive = selectedElement.defaultIcon === iconObj?.icon;

                      return (
                        <div
                          key={iconObj?.id}
                          className='border-secondary'
                          onClick={() => {
                            // Update all sections at once
                            setSections(sections?.map(section => {
                              if (section?.id === selectedElement?.sectionId) {
                                return {
                                  ...section,
                                  rows: section?.rows?.map(row => {
                                    if (row?.id === selectedElement?.id) {
                                      return {
                                        ...row,
                                        defaultIcon: iconObj.icon,
                                        seats: row?.seats?.map(seat =>
                                          seat.customIcon ? seat : { ...seat, icon: iconObj.icon }
                                        )
                                      };
                                    }
                                    return row;
                                  })
                                };
                              }
                              return section;
                            }));
                            setSelectedElement({ ...selectedElement, defaultIcon: iconObj.icon });
                          }}
                          style={{
                            width: 48,
                            height: 48,
                            border: isActive
                              ? '2px solid var(--primary-color)'
                              : '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isActive ? 'var(--primary-color)' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                          title={iconObj.name}
                        >
                          <IconComponent />
                        </div>
                      );
                    })}
                  </Space>
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Assign Ticket Category to All Seats</div>
                  <Select
                    value={selectedElement.ticketCategory}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { ticketCategory: value });
                      setSelectedElement({ ...selectedElement, ticketCategory: value });

                      const section = sections.find(s => s.id === selectedElement.sectionId);
                      const row = section?.rows.find(r => r.id === selectedElement.id);
                      row?.seats.forEach(seat => {
                        updateSeat(selectedElement.sectionId, selectedElement.id, seat.id, { ticketCategory: value });
                      });
                    }}
                    style={{ width: '100%' }}
                    options={ticketCategories?.map(cat => ({
                      value: cat.id,
                      label: `${cat.name} (₹${cat.price})`
                    }))}
                  />
                </div>

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Shape</div>
                  <Select
                    value={selectedElement.shape}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { shape: value });
                      setSelectedElement({ ...selectedElement, shape: value });
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'straight', label: 'Straight' },
                      { value: 'curved-convex', label: 'Curved (Convex)' },
                      { value: 'curved-concave', label: 'Curved (Concave)' }
                    ]}
                  />
                </div>

                {selectedElement.shape !== 'straight' && (
                  <div>
                    <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Curve Amount</div>
                    <Slider
                      min={20}
                      max={100}
                      value={selectedElement.curve || 50}
                      onChange={(value) => {
                        updateRow(selectedElement.sectionId, selectedElement.id, { curve: value });
                        setSelectedElement({ ...selectedElement, curve: value });
                      }}
                      tooltip={{ formatter: (value) => `${value}px` }}
                    />
                  </div>
                )}

                <div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Row Spacing</div>
                  <Slider
                    min={30}
                    max={80}
                    value={selectedElement.spacing}
                    onChange={(value) => {
                      updateRow(selectedElement.sectionId, selectedElement.id, { spacing: value });
                      setSelectedElement({ ...selectedElement, spacing: value });
                    }}
                    tooltip={{ formatter: (value) => `${value}px` }}
                  />
                </div>

                <div style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <div><strong>Total Seats in Row:</strong> {selectedElement.seats?.length || 0}</div>
                  {selectedElement.seats && selectedElement.seats.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <strong>Seat Size:</strong> {selectedElement.seats[0].radius}px radius
                      {selectedElement.seats[0].radius < 8 && (
                        <div style={{ color: '#ff9800', marginTop: '4px', fontSize: '12px' }}>
                          ⚠️ Seats are small due to limited space. Consider reducing seat count or increasing section width.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Space>
            )}

            {/* Seat Editor - UPDATED TO MARK CUSTOM ICONS */}
            {selectedType === 'seat' && selectedElement && (
              <Form layout="vertical" className="editor-form">
                <Form.Item label="Seat Label">
                  <Input
                    value={selectedElement.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { label });
                      setSelectedElement({ ...selectedElement, label });
                    }}
                  />
                </Form.Item>

                <Form.Item label="Seat Icon">
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    Setting a custom icon will prevent row-level icon changes from affecting this seat
                  </div>
                  <Space wrap size={8}>
                    {/* Default numeric seat */}
                    <div
                      onClick={() => {
                        updateSeat(
                          selectedElement.sectionId,
                          selectedElement.rowId,
                          selectedElement.id,
                          { icon: null, customIcon: true }
                        );
                        setSelectedElement({ ...selectedElement, icon: null, customIcon: true });
                      }}
                      className='border-secondary'
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: !selectedElement.icon ? 'var(--primary-color)' : 'transparent',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {selectedElement.number}
                    </div>

                    {/* Icon options */}
                    {seatIcons?.map(iconObj => {
                      const IconComponent = getIconComponent(iconObj.icon);
                      const isActive = selectedElement.icon === iconObj.icon;

                      return (
                        <div
                          key={iconObj.id}
                          className='border-secondary'
                          onClick={() => {
                            updateSeat(
                              selectedElement.sectionId,
                              selectedElement.rowId,
                              selectedElement.id,
                              { icon: iconObj.icon, customIcon: true }
                            );
                            setSelectedElement({ ...selectedElement, icon: iconObj.icon, customIcon: true });
                          }}
                          style={{
                            width: 48,
                            height: 48,
                            border: isActive
                              ? '2px solid var(--primary-color)'
                              : '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isActive ? 'var(--primary-color)' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                          title={iconObj.name}
                        >
                          <IconComponent />
                        </div>
                      );
                    })}
                  </Space>
                  {selectedElement.customIcon && (
                    <div className='text-warning'>
                      <WarningOutlined /> This seat has a custom icon and won't be affected by row-level icon changes
                    </div>
                  )}
                </Form.Item>


                <Form.Item label="Ticket Category">
                  <Select
                    value={selectedElement.ticketCategory}
                    onChange={(value) => {
                      updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { ticketCategory: value });
                      setSelectedElement({ ...selectedElement, ticketCategory: value });
                    }}
                  >
                    {ticketCategories?.map(cat => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name} (₹{cat.price})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Seat Status">
                  <Radio.Group
                    value={selectedElement.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { status });
                      setSelectedElement({ ...selectedElement, status });
                    }}
                  >
                    <Radio value="available" style={{ display: 'block', marginBottom: 4 }}>
                      Available
                    </Radio>
                    <Radio value="disabled" style={{ display: 'block', marginBottom: 4 }}>
                      Disabled
                    </Radio>
                    <Radio value="reserved" style={{ display: 'block', marginBottom: 4 }}>
                      Reserved
                    </Radio>
                    <Radio value="blocked" style={{ display: 'block', marginBottom: 4 }}>
                      Blocked
                    </Radio>
                  </Radio.Group>
                </Form.Item>

                <div className="info-box">
                  <Space align="center">
                    <div style={{
                      width: 30,
                      height: 30,
                      border: '1px solid #999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      {selectedElement.icon ? (() => {
                        const IconComponent = getIconComponent(selectedElement.icon);
                        return <IconComponent />;
                      })() : selectedElement.number}
                    </div>
                    <div>
                      <strong>Seat:</strong> {selectedElement.label} <br />
                      <strong>Status:</strong> {selectedElement.status}
                    </div>
                  </Space>
                </div>

              </Form>
            )}
          </div>

          {/* Legend */}
          <div className="legend">
            <h4>Ticket Categories</h4>
            {ticketCategories?.map(cat => (
              <div key={cat.id} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name} - ₹{cat.price}</span>
              </div>
            ))}
          </div>
        </div>
  );
};

export default RightPanel;

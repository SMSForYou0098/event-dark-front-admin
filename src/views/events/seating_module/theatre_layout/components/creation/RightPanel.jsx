import React from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Slider,
  Radio,
  Typography,
  Alert,
  Col,
  Row
} from "antd";

import {
  PlusOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { getIconComponent, seatIcons } from "../consts";

const { Option } = Select;
const { Text, Title } = Typography;

const RightPanel = (props) => {
  const {
    selectedType,
    selectedElement,
    stage,
    setStage,
    setSelectedElement,
    updateSection,
    updateRow,
    updateSeat,
    sections,
    setSections,
    addRowToSection,
    ticketCategories,
    isAssignMode = false
  } = props;

  return (
    <div className="right-panel bg-custom-secondary">
      <div className="panel-header">
        <Title level={4} className="mb-0">
          {selectedType === 'stage' && 'Stage Editor'}
          {selectedType === 'section' && 'Section Editor'}
          {selectedType === 'row' && 'Row Editor'}
          {selectedType === 'seat' && 'Seat Editor'}
          {!selectedType && 'Select an Element'}
        </Title>
      </div>

      <div className="editor-content">
        {!selectedType && (
          <div className="empty-state text-center p-4">
            <Text type="secondary">Select a stage, section, row, or seat to edit its properties</Text>
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
                value={stage.shape || 'curved'}
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
                value={parseFloat(stage.width) || 800}
                onChange={(value) => {
                  const updatedStage = { ...stage, width: parseFloat(value) || 800 };
                  setStage(updatedStage);
                  setSelectedElement(updatedStage);
                }}
                className="w-100"
              />
            </Form.Item>

            <Form.Item label="Height">
              <InputNumber
                min={30}
                value={parseFloat(stage.height) || 50}
                onChange={(value) => {
                  const updatedStage = { ...stage, height: parseFloat(value) || 50 };
                  setStage(updatedStage);
                  setSelectedElement(updatedStage);
                }}
                className="w-100"
              />
            </Form.Item>

            {stage.shape === 'curved' && (
              <Form.Item label="Curve Amount">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={stage.curve || 0.15}
                  onChange={(value) => {
                    const updatedStage = { ...stage, curve: value };
                    setStage(updatedStage);
                    setSelectedElement(updatedStage);
                  }}
                  tooltip={{ formatter: (value) => `${Math.round(value * 100)}%` }}
                />
              </Form.Item>
            )}

            <Alert
              message="💡 Tip: Click and drag the screen to move it. Use corner handles to resize."
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Form>
        )}

        {/* Section Editor */}
        {selectedType === 'section' && selectedElement && (
          <Form layout="vertical" className="editor-form">
            <Form.Item label="Section Name">
              <Input
                value={selectedElement.name}
                onChange={(e) => {
                  updateSection(selectedElement.id, { name: e.target.value });
                  setSelectedElement({ ...selectedElement, name: e.target.value });
                }}
              />
            </Form.Item>

            <Form.Item label="Section Type">
              <Select
                value={selectedElement.type}
                onChange={(value) => {
                  updateSection(selectedElement.id, { type: value });
                  setSelectedElement({ ...selectedElement, type: value });
                }}
                options={[
                  { value: 'Regular', label: 'Regular' },
                  { value: 'Balcony', label: 'Balcony' },
                  { value: 'VIP', label: 'VIP' },
                  { value: 'Lower', label: 'Lower' },
                  { value: 'Upper', label: 'Upper' }
                ]}
              />
            </Form.Item>

            <Form.Item label="Width">
              <InputNumber
                value={selectedElement.width}
                onChange={(value) => {
                  updateSection(selectedElement.id, { width: value });
                  setSelectedElement({ ...selectedElement, width: value });
                }}
                className="w-100"
              />
            </Form.Item>

            <Form.Item label="Height">
              <InputNumber
                value={selectedElement.height}
                onChange={(value) => {
                  updateSection(selectedElement.id, { height: value });
                  setSelectedElement({ ...selectedElement, height: value });
                }}
                className="w-100"
              />
            </Form.Item>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              onClick={() => addRowToSection(selectedElement.id)}
              className="mb-3"
            >
              Add Row
            </Button>

            <div className="p-3 bg-light rounded">
              <div className="mb-1"><Text strong>Rows:</Text> {selectedElement.rows.length}</div>
              <div className="mb-2"><Text strong>Total Seats:</Text> {selectedElement.rows.reduce((total, row) => total + row.seats.length, 0)}</div>
              <Text type="secondary" className="d-block">
                <strong>💡 Tip:</strong> Click and drag to move. Use corner handles to resize.
              </Text>
            </div>
          </Form>
        )}

        {/* Row Editor */}
        {selectedType === 'row' && selectedElement && (
          <Form layout="vertical" className="editor-form">
            <Form.Item label="Row Title">
              <Input
                value={selectedElement.title}
                disabled={isAssignMode}
                onChange={(e) => {
                  updateRow(selectedElement.sectionId, selectedElement.id, { title: e.target.value });
                  setSelectedElement({ ...selectedElement, title: e.target.value });
                }}
              />
            </Form.Item>

            <Form.Item
              label="Number of Seats"
              help={isAssignMode && "Layout is locked in ticket assignment mode"}
            >
              <InputNumber
                min={1}
                max={50}
                value={selectedElement.numberOfSeats}
                onChange={(value) => {
                  updateRow(selectedElement.sectionId, selectedElement.id, { numberOfSeats: value });
                  setSelectedElement({ ...selectedElement, numberOfSeats: value });
                }}
                className="w-100"
                disabled={isAssignMode}
              />
            </Form.Item>

            {/* Row Icon Selector */}
            {!isAssignMode && (
              <Form.Item
                label="Row Seat Icon"
                help="Apply icon to all seats in this row"
              >
                <Row gutter={[16, 10]}>
                  {/* Default numeric seat */}
                  <Col span={4}>
                    <div
                      onClick={() => {
                        setSections(sections?.map(section => {
                          if (section?.id === selectedElement?.sectionId) {
                            return {
                              ...section,
                              rows: section?.rows?.map(row => {
                                if (row?.id === selectedElement?.id) {
                                  return {
                                    ...row,
                                    defaultIcon: null,
                                    seats: (row?.seats || [])?.map(seat => ({
                                      ...seat,
                                      icon: null,
                                      customIcon: false
                                    }))
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
                      className="border border-secondary rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: 38,
                        height: 38,
                        cursor: 'pointer',
                        background: !selectedElement.defaultIcon ? 'var(--primary-color)' : 'transparent',
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                      title="Default (Numbers)"
                    >
                      1
                    </div>
                  </Col>

                  {seatIcons?.map(iconObj => {
                    const IconComponent = getIconComponent(iconObj?.icon);
                    const isActive = selectedElement.defaultIcon === iconObj?.icon;

                    return (
                      <Col span={4} key={iconObj?.id}>
                        <div
                          className="border border-secondary rounded d-flex align-items-center justify-content-center"
                          onClick={() => {
                            setSections(sections?.map(section => {
                              if (section?.id === selectedElement?.sectionId) {
                                return {
                                  ...section,
                                  rows: section?.rows?.map(row => {
                                    if (row?.id === selectedElement?.id) {
                                      return {
                                        ...row,
                                        defaultIcon: iconObj.icon,
                                        seats: row?.seats?.map(seat => ({
                                          ...seat,
                                          icon: iconObj.icon,
                                          customIcon: false
                                        }))
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
                            width: 38,
                            height: 38,
                            border: isActive
                              ? '2px solid var(--primary-color)'
                              : '1px solid #d9d9d9',
                            cursor: 'pointer',
                            background: isActive ? 'var(--primary-color)' : 'transparent',
                            color: '#ffffff',
                            fontSize: 22,
                          }}
                          title={iconObj.name}
                        >
                          <IconComponent />
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Form.Item>
            )}

            <Form.Item label="Assign Ticket Category to All Seats">
              <Select
                value={selectedElement.ticketCategory}
                onChange={(value) => {
                  // Update the row's ticket category and override ALL seats (including custom ones)
                  setSections(sections.map(section => {
                    if (section.id === selectedElement.sectionId) {
                      return {
                        ...section,
                        rows: section.rows.map(row => {
                          if (row.id === selectedElement.id) {
                            return {
                              ...row,
                              ticketCategory: value,
                              seats: row.seats.map(seat => ({
                                ...seat,
                                ticketCategory: value,
                                status: seat.status || 'available',
                                customTicket: false // Reset custom flag
                              }))
                            };
                          }
                          return row;
                        })
                      };
                    }
                    return section;
                  }));

                  setSelectedElement({ ...selectedElement, ticketCategory: value });
                }}
                placeholder="Select a ticket category"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {ticketCategories?.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name} (₹{cat.price})
                  </Option>
                ))}
              </Select>
            </Form.Item>


            {selectedElement.shape !== 'straight' && (
              <Form.Item label="Curve Amount" initialValue={95}>
                <Slider
                  min={20}
                  max={100}
                  value={selectedElement.curve || 95}
                  onChange={(value) => {
                    updateRow(selectedElement.sectionId, selectedElement.id, { curve: value });
                    setSelectedElement({ ...selectedElement, curve: value });
                  }}
                  tooltip={{ formatter: (value) => `${value}px` }}
                />
              </Form.Item>
            )}

            <Form.Item label="Row Spacing">
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
            </Form.Item>

            <div className="p-3 bg-light rounded">
              <div className="mb-1"><Text strong>Total Seats in Row:</Text> {selectedElement.seats?.length || 0}</div>
              {selectedElement.seats && selectedElement.seats.length > 0 && (
                <div>
                  <Text strong>Seat Size:</Text> {selectedElement.seats[0].radius}px radius
                  {selectedElement.seats[0].radius < 8 && (
                    <Alert
                      message="⚠️ Seats are small due to limited space. Consider reducing seat count or increasing section width."
                      type="warning"
                      showIcon={false}
                      className="mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          </Form>
        )}

        {/* Seat Editor */}
        {selectedType === 'seat' && selectedElement && (
          <Form layout="vertical" className="editor-form">
            <Form.Item label="Seat Label">
              <Input
                disabled={isAssignMode}
                value={selectedElement.label}
                onChange={(e) => {
                  const label = e.target.value;
                  updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { label });
                  setSelectedElement({ ...selectedElement, label });
                }}
              />
            </Form.Item>

            {/* Seat Icon Selector */}
            {!isAssignMode && (
              <Form.Item
                label="Seat Icon"
                help="Set custom icon for this seat. Note: Row-level changes will override this."
              >
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
                    className="border border-secondary rounded d-flex align-items-center justify-content-center"
                    style={{
                      width: 48,
                      height: 48,
                      cursor: 'pointer',
                      background: !selectedElement.icon ? 'var(--primary-color)' : 'transparent',
                      color: '#ffffff',
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
                        className="rounded d-flex align-items-center justify-content-center"
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
                          cursor: 'pointer',
                          background: isActive ? 'var(--primary-color)' : 'transparent',
                          color: '#ffffff',
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
                  <Alert
                    message="Custom icon set. This will be overridden if row-level icon is changed."
                    type="info"
                    icon={<InfoCircleOutlined />}
                    showIcon
                    className="mt-2"
                  />
                )}
              </Form.Item>
            )}

            <Form.Item label="Ticket Category">
              <Select
                value={Number(selectedElement.ticketCategory)}
                placeholder="select ticket"
                allowClear
                onChange={(value) => {
                  updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, {
                    ticketCategory: value,
                    customTicket: true, // Mark as custom when individually assigned
                    status: selectedElement.status || 'available' // Maintain existing status
                  });
                  setSelectedElement({
                    ...selectedElement,
                    ticketCategory: value,
                    customTicket: true,
                    status: selectedElement.status || 'available'
                  });
                }}
              >
                {ticketCategories?.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name} (₹{cat.price})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedElement.customTicket && (
              <Alert
                message="Custom ticket assigned. This will be overridden if row-level ticket is changed."
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
                className="mb-3"
              />
            )}

            <Form.Item label="Seat Status">
              <Radio.Group
                value={selectedElement.status}
                onChange={(e) => {
                  const status = e.target.value;
                  updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { status });
                  setSelectedElement({ ...selectedElement, status });
                }}
              >
                <Radio value="available" className="d-block mb-2">
                  Available
                </Radio>
                <Radio value="disabled" className="d-block mb-2">
                  Disabled
                </Radio>
                <Radio value="reserved" className="d-block mb-2">
                  Reserved
                </Radio>
                <Radio value="blocked" className="d-block mb-2">
                  Blocked
                </Radio>
              </Radio.Group>
            </Form.Item>

            <div className="p-3 bg-light rounded">
              <div className="d-flex align-items-center gap-3">
                <div className="border border-secondary d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, fontSize: '16px' }}>
                  {selectedElement.icon ? (() => {
                    const IconComponent = getIconComponent(selectedElement.icon);
                    return <IconComponent />;
                  })() : selectedElement.number}
                </div>
                <div>
                  <Text strong>Seat:</Text> {selectedElement.label} <br />
                  <Text strong>Status:</Text> {selectedElement.status}
                </div>
              </div>
            </div>
          </Form>
        )}
      </div>

      {/* Legend */}
      <div className="legend">
        <Title level={5}>Ticket Categories</Title>
        {ticketCategories?.map(cat => (
          <div key={cat.id} className="legend-item d-flex align-items-center gap-2 mb-2">
            <div
              className="legend-color rounded"
              style={{ backgroundColor: cat.color, width: 20, height: 20 }}
            />
            <Text>{cat.name} - ₹{cat.price}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightPanel;
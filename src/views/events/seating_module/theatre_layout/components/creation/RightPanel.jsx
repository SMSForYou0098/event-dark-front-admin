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
  Alert
} from "antd";

import {
  PlusOutlined,
  WarningOutlined,
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
    <div className="right-panel">
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
                className="w-100"
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
                className="w-100"
              />
            </Form.Item>

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
                help="Apply icon to all seats (except custom ones)"
              >
                <Space wrap size={8}>
                  {/* Default numeric seat */}
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
                    className="border border-secondary rounded d-flex align-items-center justify-content-center"
                    style={{
                      width: 48,
                      height: 48,
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

                  {/* Icon options */}
                  {seatIcons?.map(iconObj => {
                    const IconComponent = getIconComponent(iconObj?.icon);
                    const isActive = selectedElement.defaultIcon === iconObj?.icon;

                    return (
                      <div
                        key={iconObj?.id}
                        className="rounded d-flex align-items-center justify-content-center"
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
              </Form.Item>
            )}

            <Form.Item label="Assign Ticket Category to All Seats">
              <Select
                value={selectedElement.ticketCategory}
                onChange={(value) => {
                  // Update the row's ticket category and cascade to seats that don't have custom assignments
                  setSections(sections.map(section => {
                    if (section.id === selectedElement.sectionId) {
                      return {
                        ...section,
                        rows: section.rows.map(row => {
                          if (row.id === selectedElement.id) {
                            return {
                              ...row,
                              ticketCategory: value,
                              seats: row.seats.map(seat =>
                                !seat.customTicket
                                  ? {
                                    ...seat,
                                    ticketCategory: value,
                                    // Maintain existing status or default to available
                                    status: seat.status || 'available'
                                  }
                                  : seat
                              )
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
              >
                {ticketCategories?.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name} (₹{cat.price})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* <Form.Item label="Row Shape">
              <Select
                value={selectedElement.shape}
                onChange={(value) => {
                  updateRow(selectedElement.sectionId, selectedElement.id, { shape: value });
                  setSelectedElement({ ...selectedElement, shape: value });
                }}
                options={[
                  { value: 'straight', label: 'Straight' },
                  { value: 'curved-convex', label: 'Curved (Convex)' },
                  { value: 'curved-concave', label: 'Curved (Concave)' }
                ]}
              />
            </Form.Item> */}

            {selectedElement.shape !== 'straight' && (
              <Form.Item label="Curve Amount">
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
                help="Setting a custom icon will prevent row-level icon changes from affecting this seat"
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
                    message="This seat has a custom icon and won't be affected by row-level icon changes"
                    type="warning"
                    icon={<WarningOutlined />}
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
                message="This seat has a custom ticket assignment and won't be affected by row-level ticket changes"
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
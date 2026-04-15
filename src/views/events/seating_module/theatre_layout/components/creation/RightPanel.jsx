import React from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Slider,
  Typography,
  Alert,
  Checkbox
} from "antd";

import {
  PlusOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { getIconComponent, seatIcons } from "../consts";
import PermissionChecker from "layouts/PermissionChecker";

const UPDATE_SEATING_PERMISSION = "Update Seating Layout Sections";

const { Option } = Select;
const { Text, Title } = Typography;
const SEAT_COLOR_OPTIONS = ['#b51515', '#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2'];

const SeatColorSelector = ({ value, onChange }) => {
  const selectedColor = value || SEAT_COLOR_OPTIONS[0];
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space wrap size={8}>
        {SEAT_COLOR_OPTIONS.map((color) => (
          <div
            key={color}
            onClick={() => onChange(color)}
            title={color}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              cursor: 'pointer',
              backgroundColor: color,
              border: selectedColor === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
              boxShadow: selectedColor === color ? '0 0 0 1px rgba(0,0,0,0.35)' : 'none'
            }}
          />
        ))}
      </Space>
      <Space align="center" size={8}>
        <Text type="secondary">Custom</Text>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
        />
      </Space>
    </Space>
  );
};

const SeatIconSelect = ({
  value,
  onChange,
  placeholder = "Select seat icon",
  disabled = false,
}) => (
  <Select
    placeholder={placeholder}
    value={value || undefined}
    onChange={(nextValue) => onChange(nextValue || null)}
    allowClear
    disabled={disabled}
  >
    {seatIcons?.map((iconObj) => {
      const IconComponent = getIconComponent(iconObj.icon);
      return (
        <Option key={iconObj.id} value={iconObj.icon}>
          <Space size={8} align="center">
            {IconComponent ? <IconComponent /> : null}
            <span>{iconObj.name}</span>
          </Space>
        </Option>
      );
    })}
  </Select>
);

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
    isAssignMode = false,
    addBlankSeatToRow,
    removeAllGapsFromRow,
    removeSingleGapFromRow,
    applyAlignmentToSectionRows,
    selectedSeatIds = [],
    updateMultipleSeats
  } = props;

  // State for gap management
  const [gapAfterSeatNumber, setGapAfterSeatNumber] = React.useState('');
  const [applyGapToAllRows, setApplyGapToAllRows] = React.useState(false);
  const [numberOfGaps, setNumberOfGaps] = React.useState(1); // NEW: Number of gaps to add
  const [previousRowId, setPreviousRowId] = React.useState(null); // Track previous row ID

  // Helper function to extract first gap information from a row
  const extractFirstGapFromRow = React.useCallback((row) => {
    if (!row?.seats || row.seats.length === 0) return null;

    // Find first gap group
    for (let idx = 0; idx < row.seats.length; idx++) {
      const seat = row.seats[idx];
      if (seat.type === 'blank' && idx > 0) {
        const prevSeat = row.seats[idx - 1];
        if (prevSeat.type === 'regular') {
          // Count consecutive blanks
          let gapCount = 0;
          let checkIdx = idx;
          while (checkIdx < row.seats.length && row.seats[checkIdx].type === 'blank') {
            gapCount++;
            checkIdx++;
          }
          return {
            afterSeat: prevSeat.number,
            gapCount: gapCount
          };
        }
      }
    }
    return null;
  }, []);

  // Reset gap form fields when switching to a DIFFERENT row
  React.useEffect(() => {
    if (selectedType === 'row' && selectedElement?.id) {
      // Only update if we're switching to a different row
      if (previousRowId !== null && previousRowId !== selectedElement.id) {
        // Extract gap information from the new row
        const firstGapInfo = extractFirstGapFromRow(selectedElement);

        if (firstGapInfo) {
          setGapAfterSeatNumber(firstGapInfo.afterSeat);
          setNumberOfGaps(firstGapInfo.gapCount);
        } else {
          // No gaps found, reset to defaults
          setGapAfterSeatNumber('');
          setNumberOfGaps(1);
        }
        setApplyGapToAllRows(false);
      } else if (previousRowId === null) {
        // First time selecting this row, load its gap data
        const firstGapInfo = extractFirstGapFromRow(selectedElement);
        if (firstGapInfo) {
          setGapAfterSeatNumber(firstGapInfo.afterSeat);
          setNumberOfGaps(firstGapInfo.gapCount);
        }
      }
      // Update the previous row ID
      setPreviousRowId(selectedElement.id);
    } else if (selectedType !== 'row') {
      // Reset tracking when not on a row
      setPreviousRowId(null);
    }
  }, [selectedElement, selectedType, previousRowId, extractFirstGapFromRow]);

  const isMultiSeatEdit = selectedType === 'seat' && selectedSeatIds.length > 1;

  return (
    <div className="right-panel bg-custom-secondary" style={{ minHeight: 'calc(100vh - 100px)', overflowX: 'hidden', overflowY: 'auto' }}>
      <div className="panel-header">
        <Title level={4} className="mb-0">
          {selectedType === 'stage' && 'Stage Editor'}
          {selectedType === 'section' && 'Section Editor'}
          {selectedType === 'row' && 'Row Editor'}
          {selectedType === 'seat' && 'Seat Lable'}
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
          <PermissionChecker
            permission={UPDATE_SEATING_PERMISSION}
            fallback={
              <Alert
                message="You don't have permission to edit the stage."
                type="warning"
                showIcon
                className="m-3"
              />
            }
          >
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
                  min={5}
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
          </PermissionChecker>
        )}

        {/* Section Editor */}
        {selectedType === 'section' && selectedElement && (
          <PermissionChecker
            permission={UPDATE_SEATING_PERMISSION}
            fallback={
              <Alert
                message="You don't have permission to edit sections."
                type="warning"
                showIcon
                className="m-3"
              />
            }
          >
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
                    { value: 'Standing', label: 'Standing' }
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
              {selectedElement.type !== 'Standing' && (
                <Form.Item
                  label="Seat Color (Section)"
                  extra="Apply seat color to all rows and seats in this section."
                >
                  <SeatColorSelector
                    value={selectedElement.seatColor || SEAT_COLOR_OPTIONS[0]}
                    onChange={(color) => {
                      setSections(sections.map((section) => {
                        if (section.id !== selectedElement.id) return section;
                        return {
                          ...section,
                          seatColor: color,
                          rows: section.rows.map((row) => ({
                            ...row,
                            seatColor: color,
                            seats: row.seats.map((seat) => ({
                              ...seat,
                              seatColor: color,
                              customSeatColor: false
                            }))
                          }))
                        };
                      }));
                      setSelectedElement({ ...selectedElement, seatColor: color });
                    }}
                  />
                </Form.Item>
              )}
              {selectedElement.type !== 'Standing' && (
                <Form.Item label="Rows Alignment (Apply All)">
                  <Select
                    value={selectedElement.rows?.[0]?.alignment || 'center'}
                    onChange={(value) => {
                      applyAlignmentToSectionRows?.(selectedElement.id, value);
                    }}
                  >
                    <Option value="start">Start</Option>
                    <Option value="center">Center</Option>
                    <Option value="end">End</Option>
                  </Select>
                </Form.Item>
              )}

              {selectedElement.type !== 'Standing' && isAssignMode && ticketCategories?.length > 0 && (
                <Form.Item
                  label="Assign Ticket to Entire Section"
                  extra="Applies to all rows and available seats. Gaps stay unassigned; unavailable seats are unchanged."
                >
                  <Select
                    value={
                      selectedElement.ticketCategory
                        ? String(selectedElement.ticketCategory)
                        : selectedElement.ticket?.id
                          ? String(selectedElement.ticket.id)
                          : undefined
                    }
                    onChange={(value) => {
                      const next = value == null ? null : value;
                      setSections(sections.map((section) => {
                        if (section.id !== selectedElement.id) return section;
                        return {
                          ...section,
                          ticketCategory: next,
                          rows: section.rows.map((row) => ({
                            ...row,
                            ticketCategory: next,
                            seats: row.seats.map((seat) => {
                              if (seat.type === 'blank') {
                                return {
                                  ...seat,
                                  ticketCategory: null,
                                  status: 'unavailable',
                                  customTicket: false
                                };
                              }
                              if (seat.status !== 'available') {
                                return seat;
                              }
                              return {
                                ...seat,
                                ticketCategory: next,
                                status: seat.status || 'available',
                                customTicket: false
                              };
                            })
                          }))
                        };
                      }));
                      setSelectedElement({ ...selectedElement, ticketCategory: next });
                    }}
                    placeholder="Apply to all rows and available seats"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {ticketCategories?.map((cat) => (
                      <Option key={cat.id} value={String(cat.id)}>
                        {cat.name} (₹{cat.price})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {selectedElement.type === 'Standing' ? (
                <>


                  {isAssignMode && ticketCategories?.length > 0 && (
                    <Form.Item label="Assign Ticket Category">
                      <Select
                        value={selectedElement.ticketCategory ? String(selectedElement.ticketCategory) : (selectedElement.ticket?.id ? String(selectedElement.ticket.id) : undefined)}
                        onChange={(value) => {
                          updateSection(selectedElement.id, { ticketCategory: value });
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
                          <Option key={cat.id} value={String(cat.id)}>
                            {cat.name} (₹{cat.price})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}

                  <Form.Item label="Standing Capacity">
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      value={selectedElement.capacity || 100}
                      onChange={(value) => {
                        updateSection(selectedElement.id, { capacity: value });
                        setSelectedElement({ ...selectedElement, capacity: value });
                      }}
                    />
                  </Form.Item>

                  <div className="p-3 bg-light rounded">
                    <div className="mb-1"><Text strong>Type:</Text> Standing</div>

                    <Text type="secondary" className="d-block">
                      <strong>💡 Tip:</strong> Standing sections have tickets only — no rows or seats.
                    </Text>
                  </div>
                </>
              ) : (
                <>
                  {/* Removed !isAssignMode restriction to allow adding rows in assign mode */}
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
                </>
              )}
            </Form>
          </PermissionChecker>
        )}

        {/* Row Editor */}
        {selectedType === 'row' && selectedElement && (
          <PermissionChecker
            permission={UPDATE_SEATING_PERMISSION}
            fallback={
              <Alert
                message="You don't have permission to edit rows."
                type="warning"
                showIcon
                className="m-3"
              />
            }
          >
            <Form layout="vertical" className="editor-form">
              {(() => {
                const regularSeats = (selectedElement.seats || []).filter(seat => seat.type !== 'blank');
                const lockedSeatsCount = regularSeats.filter(seat => seat.status !== 'available').length;
                const minSeatsAllowed = Math.max(1, lockedSeatsCount);
                const rowTitleValue = selectedElement.title ?? '';
                const rowSeatsValue = Math.max(
                  minSeatsAllowed,
                  parseInt(selectedElement.numberOfSeats ?? regularSeats.length, 10) || minSeatsAllowed
                );
                return (
                  <>
                    <Form.Item label="Row Title">
                      <Input
                        value={rowTitleValue}
                        onChange={(e) => {
                          const nextTitle = e.target.value ?? '';
                          setSelectedElement({ ...selectedElement, title: nextTitle });
                          updateRow(selectedElement.sectionId, selectedElement.id, { title: nextTitle });
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Number of Seats"
                    // help={isAssignMode && "Layout is locked in ticket assignment mode"} // Removed isAssignMode help
                    >
                      <InputNumber
                        min={minSeatsAllowed}
                        max={50}
                        value={rowSeatsValue}
                        onChange={(value) => {
                          const nextValue = Math.max(minSeatsAllowed, parseInt(value || 0, 10) || minSeatsAllowed);
                          setSelectedElement({ ...selectedElement, numberOfSeats: nextValue });
                          updateRow(selectedElement.sectionId, selectedElement.id, { numberOfSeats: nextValue });
                        }}
                        className="w-100"
                      />
                    </Form.Item>

                    <Form.Item label="Row Alignment">
                      <Select
                        value={selectedElement.alignment || 'center'}
                        onChange={(value) => {
                          updateRow(selectedElement.sectionId, selectedElement.id, { alignment: value });
                          setSelectedElement({ ...selectedElement, alignment: value });
                        }}
                      >
                        <Option value="start">Start</Option>
                        <Option value="center">Center</Option>
                        <Option value="end">End</Option>
                      </Select>
                    </Form.Item>
                  </>
                );
              })()}
              <Form.Item
                label="Seat Color (Row)"
                extra="Apply color to all seats in this row."
              >
                <SeatColorSelector
                  value={selectedElement.seatColor || SEAT_COLOR_OPTIONS[0]}
                  onChange={(color) => {
                    setSections(sections.map((section) => {
                      if (section.id !== selectedElement.sectionId) return section;
                      return {
                        ...section,
                        rows: section.rows.map((row) => {
                          if (row.id !== selectedElement.id) return row;
                          return {
                            ...row,
                            seatColor: color,
                            seats: row.seats.map((seat) => ({
                              ...seat,
                              seatColor: color,
                              customSeatColor: false
                            }))
                          };
                        })
                      };
                    }));
                    setSelectedElement({ ...selectedElement, seatColor: color });
                  }}
                />
              </Form.Item>
              {/* Removed !isAssignMode restriction for row icon selector */}
              <Form.Item
                label="Row Seat Icon"
                help="Apply icon to all seats in this row"
              >
                <SeatIconSelect
                  placeholder="Select icon for all seats in row"
                  value={selectedElement.defaultIcon}
                  onChange={(nextIcon) => {
                    setSections(sections?.map(section => {
                      if (section?.id !== selectedElement?.sectionId) return section;
                      return {
                        ...section,
                        rows: section?.rows?.map(row => {
                          if (row?.id !== selectedElement?.id) return row;
                          return {
                            ...row,
                            defaultIcon: nextIcon || null,
                            seats: (row?.seats || [])?.map(seat => ({
                              ...seat,
                              icon: nextIcon || null,
                              customIcon: false
                            }))
                          };
                        })
                      };
                    }));
                    setSelectedElement({ ...selectedElement, defaultIcon: nextIcon || null });
                  }}
                />
              </Form.Item>



              {isAssignMode && ticketCategories?.length > 0 && (
                <Form.Item label="Assign Ticket Category to All Seats">
                  <Select
                    value={selectedElement.ticketCategory ? String(selectedElement.ticketCategory) : (selectedElement.ticket?.id ? String(selectedElement.ticket.id) : undefined)}
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
                                  seats: row.seats.map(seat => {
                                    if (seat.type === 'blank') {
                                      return {
                                        ...seat,
                                        ticketCategory: null,
                                        status: 'unavailable',
                                        customTicket: false
                                      };
                                    }

                                    if (seat.status !== 'available') {
                                      return seat;
                                    }

                                    return {
                                      ...seat,
                                      ticketCategory: value,
                                      status: seat.status || 'available',
                                      customTicket: false // Reset custom flag
                                    };
                                  })
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
                      <Option key={cat.id} value={String(cat.id)}>
                        {cat.name} (₹{cat.price})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}


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

              {/* Removed !isAssignMode restriction for gap management */}
              {/* <Divider style={{ margin: '16px 0' }} /> */}
              <Form.Item label="Add Blank Seat/Gap" help="Create spacing between seats">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {/* Method 1: Input seat number */}
                  {/* <Input
                      type="number"
                      placeholder="Enter seat number"
                      value={gapAfterSeatNumber}
                      onChange={(e) => setGapAfterSeatNumber(e.target.value)}
                      min={1}
                      max={selectedElement.numberOfSeats}
                    /> */}

                  {/* Method 2: Select from dropdown */}
                  <Select
                    showSearch
                    placeholder="Or select seat"
                    value={gapAfterSeatNumber || undefined}
                    onChange={setGapAfterSeatNumber}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {selectedElement.seats
                      ?.filter(s => s.type !== 'blank')
                      .map(seat => (
                        <Option key={seat.id} value={seat.number}>
                          After Seat {seat.label}
                        </Option>
                      ))
                    }
                  </Select>

                  {/* Number of gaps to add */}
                  <Form.Item label="Number of Gaps" className="mb-2">
                    <InputNumber
                      min={1}
                      max={10}
                      value={numberOfGaps}
                      onChange={setNumberOfGaps}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  {/* Apply to all rows checkbox */}
                  <Checkbox
                    checked={applyGapToAllRows}
                    onChange={(e) => setApplyGapToAllRows(e.target.checked)}
                  >
                    Apply to all rows in this section
                  </Checkbox>

                  {/* Action buttons */}
                  <Space style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        if (gapAfterSeatNumber && addBlankSeatToRow) {
                          addBlankSeatToRow(
                            selectedElement.sectionId,
                            selectedElement.id,
                            parseInt(gapAfterSeatNumber),
                            applyGapToAllRows,
                            numberOfGaps
                          );
                        }
                      }}
                      disabled={!gapAfterSeatNumber}
                    >
                      Add {numberOfGaps > 1 ? `${numberOfGaps} Gaps` : 'Gap'}
                    </Button>

                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        if (removeAllGapsFromRow) {
                          removeAllGapsFromRow(
                            selectedElement.sectionId,
                            selectedElement.id,
                            applyGapToAllRows
                          );
                        }
                      }}
                    >
                      Remove All Gaps
                    </Button>
                  </Space>
                </Space>
              </Form.Item>

              {/* Show current gaps */}
              {selectedElement.seats?.some(s => s.type === 'blank') && (
                <Alert
                  message={
                    <div>
                      <div><strong>Current gaps: {selectedElement.seats.filter(s => s.type === 'blank').length}</strong></div>
                      <div className="mt-1" style={{ fontSize: '12px' }}>
                        Gaps after seats: {
                          selectedElement.seats
                            .filter((s, idx) => s.type === 'blank' && idx > 0)
                            .map((s, idx) => {
                              const prevSeat = selectedElement.seats[selectedElement.seats.indexOf(s) - 1];
                              return prevSeat.type === 'regular' ? prevSeat.number : null;
                            })
                            .filter((num, idx, arr) => num !== null && arr.indexOf(num) === idx) // Remove duplicates
                            .join(', ')
                        }
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                  className="mt-2"
                />
              )}

              <div className="p-3 bg-light rounded">
                <div className="mb-1"><Text strong>Total Seats in Row:</Text> {selectedElement.seats?.length || 0}</div>
                {/* {selectedElement.seats && selectedElement.seats.length > 0 && (
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
              )} */}
              </div>
            </Form>
          </PermissionChecker>
        )}

        {/* Seat Editor */}
        {selectedType === 'seat' && selectedElement && (
          <Form layout="vertical" className="editor-form">
            {isMultiSeatEdit && (
              <>
                {(() => {
                  const selectedLabels = sections
                    .flatMap(s => s.rows?.flatMap(r => r.seats?.filter(seat => selectedSeatIds.includes(seat.id)).map(seat => seat.label) || []) || [])
                    .filter(Boolean);
                  return (
                    <Alert
                      message={`${selectedSeatIds.length} seat${selectedSeatIds.length > 1 ? 's' : ''} selected`}
                      description={selectedLabels.length > 0 ? `Selected: ${selectedLabels.join(', ')}` : null}
                      type="info"
                      showIcon
                      className="mb-3"
                    />
                  );
                })()}

                <PermissionChecker permission={UPDATE_SEATING_PERMISSION}>
                  {selectedElement.status === 'available' && (
                    <Form.Item label="Seat Color (Bulk)">
                      <SeatColorSelector
                        value={selectedElement.seatColor || SEAT_COLOR_OPTIONS[0]}
                        onChange={(color) => {
                          updateMultipleSeats?.(selectedSeatIds, { seatColor: color, customSeatColor: true });
                          setSelectedElement({ ...selectedElement, seatColor: color, customSeatColor: true });
                        }}
                      />
                    </Form.Item>
                  )}

                  <Form.Item label="Seat Icon (Bulk)">
                    <SeatIconSelect
                      placeholder="Apply icon to selected seats"
                      value={selectedElement.icon}
                      onChange={(nextIcon) => {
                        updateMultipleSeats?.(selectedSeatIds, { icon: nextIcon, customIcon: true });
                        setSelectedElement({ ...selectedElement, icon: nextIcon, customIcon: true });
                      }}
                    />
                  </Form.Item>

                  {isAssignMode && ticketCategories?.length > 0 && (
                    <Form.Item label="Ticket Category (Bulk)">
                      <Select
                        placeholder="Apply ticket to selected seats"
                        allowClear
                        onChange={(value) => {
                          updateMultipleSeats?.(selectedSeatIds, {
                            ticketCategory: value || null,
                            customTicket: true,
                            status: 'available'
                          });
                        }}
                      >
                        {ticketCategories?.map(cat => (
                          <Option key={cat.id} value={String(cat.id)}>
                            {cat.name} (₹{cat.price})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                </PermissionChecker>

                <Form.Item label="Seat Status (Bulk)">
                  <Select
                    value={selectedElement.status || undefined}
                    placeholder="Select status for selected seats"
                    onChange={(value) => {
                      updateMultipleSeats?.(selectedSeatIds, { status: value });
                      setSelectedElement({ ...selectedElement, status: value });
                    }}
                    options={[
                      { value: 'available', label: 'Available' },
                      { value: 'reserved', label: 'Reserved' },
                      { value: 'disabled', label: 'Disabled' },
                      // { value: 'blocked', label: 'Blocked' }
                    ]}
                  />
                </Form.Item>
              </>
            )}
            {!isMultiSeatEdit && (selectedElement.type === 'blank' ? (
              <>
                <Alert
                  message="Gap selected"
                  description="This is a blank gap placeholder. You can remove only this gap from the row."
                  type="info"
                  showIcon
                  className="mb-3"
                />
                <Button
                  danger
                  type="primary"
                  block
                  onClick={() => {
                    if (removeSingleGapFromRow) {
                      removeSingleGapFromRow(
                        selectedElement.sectionId,
                        selectedElement.rowId,
                        selectedElement.id
                      );
                    }
                  }}
                >
                  Delete This Gap
                </Button>
              </>
            ) : (
              (() => {
                const isSeatLockedForEdit = isAssignMode && selectedElement.status !== 'available';
                return (
                  <>
                    <PermissionChecker permission={UPDATE_SEATING_PERMISSION}>
                      <Form.Item label="">
                        <Input
                          disabled={isSeatLockedForEdit}
                          value={selectedElement.label}
                          onChange={(e) => {
                            const label = e.target.value;
                            updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { label });
                            setSelectedElement({ ...selectedElement, label });
                          }}
                        />
                      </Form.Item>

                      <Form.Item label="Seat Icon">
                        <SeatIconSelect
                          placeholder="Select icon for this seat"
                          value={selectedElement.icon}
                          disabled={isSeatLockedForEdit}
                          onChange={(nextIcon) => {
                            updateSeat(
                              selectedElement.sectionId,
                              selectedElement.rowId,
                              selectedElement.id,
                              { icon: nextIcon, customIcon: true }
                            );
                            setSelectedElement({ ...selectedElement, icon: nextIcon, customIcon: true });
                          }}
                        />
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

                      {isAssignMode && ticketCategories?.length > 0 && (
                        <>
                          <Form.Item label="Ticket Category">
                            <Select
                              value={selectedElement.ticketCategory ? String(selectedElement.ticketCategory) : (selectedElement.ticket?.id ? String(selectedElement.ticket.id) : undefined)}
                              placeholder="select ticket"
                              allowClear
                              disabled={isSeatLockedForEdit}
                              onChange={(value) => {
                                updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, {
                                  ticketCategory: value,
                                  customTicket: true,
                                  status: selectedElement.status || 'available'
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
                                <Option key={cat.id} value={String(cat.id)}>
                                  {cat.name} (₹{cat.price})
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </>
                      )}
                    </PermissionChecker>

                    {/* Seat Status — visible to ALL users */}
                    <Form.Item label="Seat Status">
                      <Select
                        value={selectedElement.status || undefined}
                        placeholder="Select seat status"
                        onChange={(status) => {
                          updateSeat(selectedElement.sectionId, selectedElement.rowId, selectedElement.id, { status });
                          setSelectedElement({ ...selectedElement, status });
                        }}
                        options={[
                          { value: 'available', label: 'Available' },
                          { value: 'reserved', label: 'Reserved' },
                          { value: 'disabled', label: 'Disabled' },
                          // { value: 'blocked', label: 'Blocked' }
                        ]}
                      />
                    </Form.Item>

                    {selectedElement.status === 'available' && (
                      <PermissionChecker permission={UPDATE_SEATING_PERMISSION}>
                        <Form.Item label="Seat Color (Single Seat)">
                          <SeatColorSelector
                            value={selectedElement.seatColor || SEAT_COLOR_OPTIONS[0]}
                            onChange={(color) => {
                              updateSeat(
                                selectedElement.sectionId,
                                selectedElement.rowId,
                                selectedElement.id,
                                { seatColor: color, customSeatColor: true }
                              );
                              setSelectedElement({ ...selectedElement, seatColor: color, customSeatColor: true });
                            }}
                          />
                        </Form.Item>
                      </PermissionChecker>
                    )}
                    <div className="d-flex align-items-center ">
                      <Text className="m-0 mr-2">Seat:</Text> {selectedElement.label} {selectedElement.status}
                    </div>
                  </>
                );
              })()
            ))}
          </Form>
        )}
      </div>

      {/* Legend */}
      <div className="legend mt-2">
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
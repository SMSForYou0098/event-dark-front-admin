// EventControlsStep.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Form, Select, Switch, Card, Row, Col, Space, DatePicker, Modal, Button, List, Tag, Typography, InputNumber, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { CONSTANTS } from './CONSTANTS';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import ContentSelect from './ContentSelect';
import { useMyContext } from 'Context/MyContextProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, CheckCircleFilled, PlusOutlined, EditOutlined } from '@ant-design/icons';
import MultiScanCheckpoints from './MultiScanCheckpoints';
import SelectFields from 'views/events/Settings/Fields/SelectFields';
import apiClient from 'auth/FetchInterceptor';
const { Text } = Typography;

// helpers — convert to boolean
const toBoolean = (v) => v === true || v === 1 || v === '1';
const toBooleanValue = (checked) => Boolean(checked);

const EventControlsStep = ({ form, orgId, contentList, contentLoading, layouts, eventLayoutId, eventId, venue_id, eventHasAttendee }) => {


  const { userRole } = useMyContext();
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false);
  const [selectFieldsModalOpen, setSelectFieldsModalOpen] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);
  const [selectedFieldsData, setSelectedFieldsData] = useState([]);
  const [fieldNotes, setFieldNotes] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Watch attendee_required switch value (from Ticket Controls section)
  const attendeeRequired = Form.useWatch('attendee_required', form);
  const isAttendeeRequired = toBoolean(attendeeRequired);

  // Get categoryId from form - 'category' field is set in both BasicDetails and Controls steps
  const categoryId = Form.useWatch('category', form);

  // Fetch category details whenever categoryId is available (not dependent on switch)
  const {
    data: categoryDetails,
    isLoading: categoryDetailsLoading,
  } = useQuery({
    queryKey: ['category-show', categoryId],
    queryFn: async () => {
      const response = await apiClient.get(`category-show/${categoryId}`);
      return response?.data || response;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });

  // Initialize selected fields from eventHasAttendee when editing
  useEffect(() => {
    if (eventHasAttendee && eventHasAttendee.length > 0 && categoryDetails?.fields && !isInitialized) {
      // Extract field IDs from event_has_attendee
      const existingFieldIds = eventHasAttendee.map(item => item.field_id);

      // Match with category fields to get full field data
      const existingFieldsData = categoryDetails.fields.filter(field =>
        existingFieldIds.includes(field.id)
      );

      setSelectedFieldIds(existingFieldIds);
      setSelectedFieldsData(existingFieldsData);
      setIsInitialized(true);

      // Build fields payload for form
      const fieldsPayload = existingFieldIds.map(id => ({
        field_id: id,
        note: ''
      }));

      form.setFieldsValue({
        selected_field_ids: existingFieldIds,
        attendee_fields: fieldsPayload
      });
    }
  }, [eventHasAttendee, categoryDetails, isInitialized, form]);

  // Check category conditions from API response:
  // - If title is "Registration" → DON'T show SelectFields
  // - If category's attendy_required is true → DON'T show SelectFields  
  const isRegistrationCategory = categoryDetails?.title?.toLowerCase() === 'registration';
  const categoryHasAttendyRequired = toBoolean(categoryDetails?.attendy_required);

  // Show SelectFields component when ALL conditions are met:
  // 1. Event's attendee_required switch is ON (from Ticket Controls)
  // 2. Category title is NOT "Registration"
  // 3. Category's attendy_required is NOT true
  // 4. categoryId exists and category data is loaded
  const shouldShowSelectFields = isAttendeeRequired &&
    !isRegistrationCategory &&
    !categoryHasAttendyRequired &&
    !!categoryId &&
    !!categoryDetails;

  // Handle selected fields from SelectFields modal
  const handleFieldsSelected = useCallback((fieldIds, fieldsData, notes) => {
    setSelectedFieldIds(fieldIds);
    setSelectedFieldsData(fieldsData);
    setFieldNotes(notes || {});

    // Build fields array for payload: [{field_id, note}]
    const fieldsPayload = fieldIds.map(id => ({
      field_id: id,
      note: notes?.[id] || ''
    }));

    // Store in form
    form.setFieldsValue({
      selected_field_ids: fieldIds,
      field_notes: notes || {},
      attendee_fields: fieldsPayload
    });
  }, [form]);

  // Remove a selected field
  const handleRemoveField = useCallback((fieldId) => {
    const newFieldIds = selectedFieldIds.filter(id => id !== fieldId);
    const newFieldsData = selectedFieldsData.filter(f => f.id !== fieldId);
    const newNotes = { ...fieldNotes };
    delete newNotes[fieldId];

    // Build updated fields array for payload
    const fieldsPayload = newFieldIds.map(id => ({
      field_id: id,
      note: newNotes[id] || ''
    }));

    setSelectedFieldIds(newFieldIds);
    setSelectedFieldsData(newFieldsData);
    setFieldNotes(newNotes);
    form.setFieldsValue({
      selected_field_ids: newFieldIds,
      field_notes: newNotes,
      attendee_fields: fieldsPayload
    });
  }, [selectedFieldIds, selectedFieldsData, fieldNotes, form]);

  const navigate = useNavigate();
  const handleBookingTypeChange = (fieldName, checked) => {
    if (checked) {
      // If one is turned on, turn off the other
      if (fieldName === 'ticket_system') {
        form.setFieldValue('bookingBySeat', false);
      } else if (fieldName === 'bookingBySeat') {
        form.setFieldValue('ticket_system', false);
      }
    }
    return toBooleanValue(checked);
  };

  const handleManageLayoutClick = () => {
    if (!layouts || layouts.length === 0) {
      Modal.confirm({
        title: 'No Layout Found',
        content: 'There is no layout available for this venue. Would you like to create a new layout?',
        okText: 'Create Layout',
        cancelText: 'Cancel',
        centered: true,
        onOk: () => {
          if (eventLayoutId) {
            navigate(`/theatre/new?venueId=${eventLayoutId}`);
          } else {
            navigate(`/theatre/new?venueId=${venue_id}`);
          }
        }
      });
      return;
    }

    if (layouts.length === 1) {
      navigate(`/theatre/event/${eventId}/layout/${layouts[0].id}`);
    } else {
      setIsLayoutModalVisible(true);
    }
  };
  // Watch ticket_transfer value to conditionally show ticket_transfer_otp
  const ticketTransferEnabled = Form.useWatch('ticket_transfer', form);
  const isTicketTransferEnabled = toBoolean(ticketTransferEnabled);

  const switchFields = [
    {
      name: 'ticket_system',
      label: 'Booking By Ticket',
      onChange: (checked) => handleBookingTypeChange('ticket_system', checked),
      initialValue: true  // Default checked
    },
    {
      name: 'bookingBySeat',
      label: 'Booking By Seat',
      onChange: (checked) => handleBookingTypeChange('bookingBySeat', checked),
      initialValue: false
    },
  ];
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {/* Hidden category field for Form.useWatch to work */}
      <Form.Item name="category" hidden>
        <input />
      </Form.Item>

      {/* Top controls */}
      <Row gutter={ROW_GUTTER}>
        <Col xs={24} sm={12} lg={12}>
          <Form.Item
            name="scan_detail"
            label="User Data While Scan"
            initialValue={2}
            rules={[
              { required: true, message: "Please select user data option" },
            ]}
          >
            <Select options={CONSTANTS.userDataOptions} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <ContentSelect
            form={form}
            fieldName="insta_whts_url" // form will store only the id
            contentList={contentList}
            contentType="note"
            loading={contentLoading}
            customOrgId={orgId}
            extra="Please enter the Instagram post ID (not the full URL)."
            label="Instagram URL"
            placeholder="Select Instagram URL"
          // rules={[{ required: false }, { type: "url", message: "Please enter a valid URL" }]}
          />
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <ContentSelect
            form={form}
            fieldName="whts_note"
            label="WhatsApp Note"
            contentType="note"
            customOrgId={orgId}
            contentList={contentList} // pass your WhatsApp note list here
            loading={contentLoading} // loading state you get from API
            placeholder="Select WhatsApp note"
            rules={[{ required: false }]} // no required rule unless you want it
          />
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <ContentSelect
            form={form}
            fieldName="booking_notice"
            label="Booking Note"
            contentType="description"
            customOrgId={orgId}
            contentList={contentList} // <-- you will pass this from parent
            loading={contentLoading} // <-- loading state for Booking Notes
            placeholder="Select booking note"
            rules={[{ required: false }]} // or make required if needed
          />
        </Col>
      </Row>

      {/* Switch Section - Grouped */}

      {/* Group 1: Booking Channels */}
      <Card size="small" title="Booking Channels" style={{ marginBottom: 16 }}>
        <Row gutter={ROW_GUTTER}>
          {[
            {
              name: "online_booking",
              label: "Online",
              tooltip: "Allow online ticket bookings",
              defaultValue: true,
            },
            {
              name: "agent_booking",
              label: "Agent",
              tooltip: "Allow agent ticket bookings",
              defaultValue: true,
            },
            {
              name: "pos_booking",
              label: "POS",
              tooltip: "Allow POS ticket bookings",
              defaultValue: true,
            },
            {
              name: "complimentary_booking",
              label: "Complimentary",
              tooltip: "Allow complimentary ticket bookings",
              defaultValue: true,
            },
            {
              name: "sponsor_booking",
              label: "Sponsor",
              tooltip: "Allow sponsor ticket bookings",
              defaultValue: true,
            },
          ].map((f) => (
            <Col xs={24} sm={12} lg={4} key={f.name}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_cancelled !== curr.is_cancelled}>
                {({ getFieldValue }) => {
                  const isCancelled = toBoolean(getFieldValue('is_cancelled'));

                  return (
                    <Form.Item
                      name={f.name}
                      label={f.label}
                      tooltip={f.tooltip}
                      valuePropName="checked"
                      getValueProps={(v) => ({ checked: toBoolean(v) })}
                      getValueFromEvent={toBooleanValue}
                      initialValue={f.defaultValue ?? false}
                    >
                      <Switch
                        disabled={isCancelled}
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                        onChange={(checked) => {
                          // Dependency: If online_booking is turned OFF, turn off event_feature and show_on_home too
                          if (f.name === 'online_booking' && !checked) {
                            form.setFieldValue('event_feature', false);
                            form.setFieldValue('show_on_home', false);
                          }
                        }}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Group 2: Event Status */}
      <Card size="small" title="Event Status" style={{ marginBottom: 16 }}>
        <Row gutter={ROW_GUTTER}>
          {[
            {
              name: "status",
              label: "Event Status",
              tooltip: "Enable or disable event",
              onLabels: ["Active", "Inactive"],
            },
            {
              name: "event_feature",
              label: "High Demand",
              tooltip: "Mark this event as high demand",
            },
            {
              name: "house_full",
              label: "House Full",
              tooltip: "Mark event as sold out",
            },
            {
              name: "is_sold_out",
              label: "Sold Out",
              tooltip: "Mark event as sold out",
            },
            {
              name: "is_cancelled",
              label: "Event Cancelled",
              tooltip: "Mark event as cancelled",
            },
            {
              name: "is_postponed",
              label: "Event Postponed",
              tooltip: "Mark event as postponed",
            },
            {
              name: "is_approval_required",
              label: "Approval Required",
              tooltip: "Require admin approval for bookings",
            },
            {
              name: "attendee_required",
              label: "Attendee Required",
              // onChange: (checked) => handleBookingTypeChange('attendee_required', checked),
            },
            {
              name: "ticket_transfer",
              label: "Ticket Transfer",
              tooltip: "Allow users to transfer their tickets to others",
            },
            {
              name: "use_preprinted_cards",
              label: "Use Preprinted Cards",
              tooltip: "Enable use of preprinted cards for this event",
            },
          ]
            .filter((f) => {
              // Only show "High Demand" field to Admin users
              if (f.name === "event_feature" && userRole !== "Admin") {
                return false;
              }
              return true;
            })
            .map((f) => {
              // Define mutually exclusive fields
              const exclusiveFields = ['is_cancelled', 'is_sold_out', 'is_postponed'];
              const isExclusive = exclusiveFields.includes(f.name);

              return (
                <Col xs={24} sm={12} lg={4} key={f.name}>
                  <Form.Item noStyle shouldUpdate={(prev, curr) => prev.online_booking !== curr.online_booking}>
                    {({ getFieldValue }) => {
                      const onlineBookingEnabled = toBoolean(getFieldValue('online_booking'));

                      // Disable event_feature if online_booking is false
                      const isDisabled = f.name === 'event_feature' && !onlineBookingEnabled;

                      return (
                        <Form.Item
                          name={f.name}
                          label={f.label}
                          tooltip={f.tooltip}
                          valuePropName="checked"
                          getValueProps={(v) => ({ checked: toBoolean(v) })}
                          getValueFromEvent={toBooleanValue}
                          initialValue={f.defaultValue ?? false}
                        >
                          <Switch
                            disabled={isDisabled}
                            checkedChildren={f.onLabels?.[0] || "Yes"}
                            unCheckedChildren={f.onLabels?.[1] || "No"}
                            onChange={(checked) => {
                              // If this is one of the exclusive fields and it's being turned ON
                              if (isExclusive && checked) {
                                // Turn off the other exclusive fields
                                exclusiveFields.forEach((fieldName) => {
                                  if (fieldName !== f.name) {
                                    form.setFieldValue(fieldName, false);
                                  }
                                });
                              }

                              // When Event Cancelled is turned ON, turn off all appropriate switches
                              if (f.name === 'is_cancelled' && checked) {
                                const fieldsToTurnOff = [
                                  'online_booking',
                                  'agent_booking',
                                  'pos_booking',
                                  'complimentary_booking',
                                  'sponsor_booking',
                                  'status',
                                  'house_full',
                                  'show_on_home',
                                  'event_feature'
                                ];

                                fieldsToTurnOff.forEach((fieldName) => {
                                  form.setFieldValue(fieldName, false);
                                });
                              }
                            }}
                          />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
              );
            })}
        </Row>
        {/* Expected Date - Only show when event is postponed */}
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_postponed !== curr.is_postponed}>
          {({ getFieldValue }) => {
            const isPostponed = toBoolean(getFieldValue('is_postponed'));

            return isPostponed ? (
              <Row gutter={ROW_GUTTER}>
                <Col xs={24} sm={4} lg={4}>
                  <Form.Item
                    name="expected_date"
                    label="Expected Date"
                    tooltip="Expected date for postponed or rescheduled events"
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      placeholder="Select expected date"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : null;
          }}
        </Form.Item>

        {/* Ticket Transfer OTP - Only show when ticket_transfer is ON */}
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.ticket_transfer !== curr.ticket_transfer}>
          {({ getFieldValue }) => {
            const isTicketTransferEnabled = toBoolean(getFieldValue('ticket_transfer'));

            return isTicketTransferEnabled ? (
              <Row gutter={ROW_GUTTER}>
                <Col xs={24} sm={12} lg={4}>
                  <Form.Item
                    name="ticket_transfer_otp"
                    label="Transfer OTP"
                    tooltip="Require OTP verification for ticket transfers"
                    valuePropName="checked"
                    getValueProps={(v) => ({ checked: toBoolean(v) })}
                    getValueFromEvent={toBooleanValue}
                    initialValue={false}
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
              </Row>
            ) : null;
          }}
        </Form.Item>
      </Card>

      {/* Group 3: Display Settings */}
      <Card size="small" title="Display Settings" style={{ marginBottom: 16 }}>
        <Row gutter={ROW_GUTTER}>
          {[
            { name: "show_on_home", label: "Display on Home" },
            {
              name: "online_att_sug",
              label: "Hide Online Att Sug",
            },
            {
              name: "offline_att_sug",
              label: "Hide Agent Att Sug",
            },
          ].map((f) => (
            <Col xs={24} sm={12} lg={4} key={f.name}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.online_booking !== curr.online_booking || prev.is_cancelled !== curr.is_cancelled}>
                {({ getFieldValue }) => {
                  const onlineBookingEnabled = toBoolean(getFieldValue('online_booking'));
                  const isCancelled = toBoolean(getFieldValue('is_cancelled'));

                  // Disable show_on_home if online_booking is false or event is cancelled
                  const isDisabled = (f.name === 'show_on_home' && (!onlineBookingEnabled || isCancelled));

                  return (
                    <Form.Item
                      name={f.name}
                      label={f.label}
                      tooltip={f.tooltip}
                      valuePropName="checked"
                      getValueProps={(v) => ({ checked: toBoolean(v) })}
                      getValueFromEvent={toBooleanValue}
                      initialValue={f.defaultValue ?? false}
                    >
                      <Switch
                        disabled={isDisabled}
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>



      {/* WhatsApp Note */}
      {/* <Form.Item
        name="whts_note"
        label="WhatsApp Note"
        tooltip="This note will be sent via WhatsApp to attendees"
      >
        <TextArea
          rows={3}
          placeholder="Enter WhatsApp notification message..."
          showCount
          maxLength={200}
        />
      </Form.Item> */}



      {/* <Form.Item
        name="booking_notice"
        label="Booking Note"
        tooltip=""
      >
        <TextArea
          rows={3}
          placeholder="Enter Booking notification message..."
          showCount
          maxLength={200}
        />
      </Form.Item> */}

      {/* Ticket Settings */}
      <Row gutter={ROW_GUTTER}>
        <Col span={24}>
          <Card
            title="Ticket Settings"
            extra={
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const bookingBySeatValue = form.getFieldValue("bookingBySeat");
                  return toBoolean(bookingBySeatValue) ? (
                    <Button type="primary" onClick={handleManageLayoutClick} size="small">
                      Manage Ticket in Layout
                    </Button>
                  ) : null;
                }}
              </Form.Item>
            }
          >
            <Row gutter={ROW_GUTTER}>
              {switchFields.map((f) => (
                <Col xs={24} sm={12} lg={4} key={f.name}>
                  <Form.Item
                    name={f.name}
                    label={f.label}
                    tooltip={f.tooltip}
                    valuePropName="checked"
                    getValueProps={(v) => ({ checked: toBoolean(v) })}
                    getValueFromEvent={f.onChange || toBooleanValue}
                    initialValue={f.initialValue}
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
              ))}

              {/* Ticket Transfer OTP - only show when ticket_transfer is ON */}

              {/* </Row> */}

              {/* show button only when Booking By Seat is selected */}


              {/* Multi-Scan Configuration Section */}
              {/* <Card size="small" title="Multi-Scan Configuration" style={{ marginTop: 16 }}> */}
              {/* <Row gutter={ROW_GUTTER}> */}
              {/* Multi-Scan Master Switch */}
              <Col xs={24} sm={12} lg={4}>
                <Form.Item
                  name="multi_scan"
                  label="Enable Multi-Scan"
                  tooltip="Allow multiple scans for different checkpoints"
                  valuePropName="checked"
                  getValueProps={(v) => ({ checked: toBoolean(v) })}
                  getValueFromEvent={toBooleanValue}
                  initialValue={false}
                >
                  <Switch
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                    onChange={(checked) => {
                      // Clear checkpoints if multi-scan is disabled
                      if (!checked) {
                        form.setFieldsValue({
                          scan_mode: false,
                          checkpoints: [],
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Sequential Mode Switch - only show when multi_scan is ON */}
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.multi_scan !== curr.multi_scan}>
                {({ getFieldValue }) => {
                  const isMultiScanEnabled = toBoolean(getFieldValue('multi_scan'));

                  return isMultiScanEnabled ? (
                    <>
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          name="scan_mode"
                          label="Checkpoint Mode"
                          tooltip="Enable sequential checkpoint validation with time slots"
                          valuePropName="checked"
                          getValueProps={(v) => ({ checked: toBoolean(v) })}
                          getValueFromEvent={toBooleanValue}
                          initialValue={false}
                        >
                          <Switch
                            checkedChildren="Yes"
                            unCheckedChildren="No"
                            onChange={(checked) => {
                              // Initialize checkpoints when turning on
                              if (checked) {
                                const currentCheckpoints = getFieldValue('checkpoints');
                                if (!currentCheckpoints || currentCheckpoints.length === 0) {
                                  form.setFieldsValue({
                                    checkpoints: [{ label: 'Entry', start_time: null, end_time: null }],
                                  });
                                }
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>

                      {/* Scan Count - only show when multi_scan is ON but scan_mode is OFF */}
                      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.scan_mode !== curr.scan_mode}>
                        {({ getFieldValue: gfv }) => {
                          const isSequential = toBoolean(gfv('scan_mode'));

                          return !isSequential ? (
                            <Col xs={24} sm={12} lg={6}>
                              <Form.Item
                                name="max_scan_count"
                                label="Scan Count"
                                tooltip="Number of times a ticket can be scanned"
                                rules={[
                                  { required: true, message: 'Please enter scan count' },
                                  { type: 'number', min: 1, message: 'Must be at least 1' },
                                ]}
                                initialValue={1}
                              >
                                <InputNumber
                                  min={1}
                                  style={{ width: '100%' }}
                                  placeholder="Enter scan count"
                                />
                              </Form.Item>
                            </Col>
                          ) : null;
                        }}
                      </Form.Item>

                      {/* Checkpoint Count - only show when scan_mode is ON */}
                      {/* <Form.Item noStyle shouldUpdate={(prev, curr) => prev.scan_mode !== curr.scan_mode || prev.checkpoints !== curr.checkpoints}>
                        {({ getFieldValue: gfv }) => {
                          const isSequential = toBoolean(gfv('scan_mode'));
                          const checkpoints = gfv('checkpoints') || [];

                          return isSequential ? (
                            <Col xs={24} sm={12} lg={6}>
                              <Form.Item label="Checkpoint Count">
                                <InputNumber
                                  value={checkpoints.length}
                                  disabled
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          ) : null;
                        }}
                      </Form.Item> */}
                    </>
                  ) : null;
                }}
              </Form.Item>
            </Row>

            {/* Checkpoint List - only show when both multi_scan AND scan_mode are ON */}
            {/* </Card> */}

          </Card>
          <Form.Item noStyle shouldUpdate={(prev, curr) =>
            prev.multi_scan !== curr.multi_scan ||
            prev.scan_mode !== curr.scan_mode
          }>
            {({ getFieldValue }) => {
              const isMultiScanEnabled = toBoolean(getFieldValue('multi_scan'));
              const isSequential = toBoolean(getFieldValue('scan_mode'));

              return isMultiScanEnabled && isSequential ? (
                <MultiScanCheckpoints form={form} />
              ) : null;
            }}
          </Form.Item>
        </Col>
      </Row>

      {/* Attendee Fields Section - Show when attendee_required is ON and category has no fields */}
      {shouldShowSelectFields && (
        <Card
          size="small"
          title={
            <Space>
              <span>Attendee Fields</span>
              {categoryDetailsLoading && <Tag>Loading...</Tag>}
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={selectedFieldIds.length > 0 ? <EditOutlined /> : <PlusOutlined />}
              onClick={() => setSelectFieldsModalOpen(true)}
              size="small"
            >
              {selectedFieldIds.length > 0 ? 'Edit Fields' : 'Add Fields'}
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          {/* Show selected fields */}
          {selectedFieldIds.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {selectedFieldsData.map((field) => (
                <div key={field.id} className="d-flex align-items-center gap-2">
                  <Tag
                    color="green"
                    closable
                    onClose={() => handleRemoveField(field.id)}
                    className="py-1 px-2 m-0"
                  >
                    {field.lable || field.field_name}
                  </Tag>
                  {fieldNotes[field.id] && (
                    <span className="text-muted small fst-italic">
                      — {fieldNotes[field.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              description="No attendee fields selected"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setSelectFieldsModalOpen(true)}
              >
                Add Attendee Fields
              </Button>
            </Empty>
          )}

          {/* Hidden form field for attendee_fields payload */}
          <Form.Item name="attendee_fields" hidden>
            <input />
          </Form.Item>
        </Card>
      )}

      {/* Select Fields Drawer for Attendee Fields */}
      <SelectFields
        open={selectFieldsModalOpen}
        onClose={() => setSelectFieldsModalOpen(false)}
        onSuccess={handleFieldsSelected}
        initialSelectedIds={selectedFieldIds}
        initialFieldNotes={fieldNotes}
      />

      <Modal
        title="Select Layout for Event"
        open={isLayoutModalVisible}
        onCancel={() => setIsLayoutModalVisible(false)}
        footer={null}
      >
        <List
          dataSource={layouts}
          renderItem={(item) => {
            console.log('event id',eventLayoutId)
            const isAssigned = Number(item.id) === Number(eventLayoutId);
            return (<List.Item
              className={`${isAssigned ? 'border border-primary border-2 bg-light' : 'border border-light'} cursor-pointer rounded mb-2 px-3`}
              onClick={() => {
                setIsLayoutModalVisible(false);
                navigate(`/theatre/event/${eventId}/layout/${item.id}`);
              }}
              actions={[
                isAssigned ? (
                  <Tag className='cursor-pointer m-0' color="success" icon={<CheckCircleFilled />}>
                    Currently Assigned
                  </Tag>
                ) : (
                  <Button type='primary' icon={<ArrowRightOutlined />}>
                    Select
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={<Text strong>{item.name}</Text>}
              //description={`Venue ID: ${item.venue_id}`}
              />
            </List.Item>
            )
          }}
        />
      </Modal>
    </Space>
  );
};

export default EventControlsStep;

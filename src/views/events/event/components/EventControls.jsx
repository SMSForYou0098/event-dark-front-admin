// EventControlsStep.jsx
import React, { useState } from 'react';
import { Form, Select, Switch, Card, Row, Col, Space, DatePicker, Modal, Button, List, Tag, Typography } from 'antd';
import { CONSTANTS } from './CONSTANTS';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import ContentSelect from './ContentSelect';
import { useMyContext } from 'Context/MyContextProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
const { Text } = Typography;

// helpers — convert to boolean
const toBoolean = (v) => v === true || v === 1 || v === '1';
const toBooleanValue = (checked) => Boolean(checked);

const EventControlsStep = ({ form, orgId, contentList, contentLoading, layouts, eventLayoutId, eventId, venueId }) => {
  const { userRole } = useMyContext();
  console.log('fom', form.getFieldValue('expected_date'));
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false);

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
            navigate(`/theatre/new?venueId=${venueId}`);
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
  const switchFields = [
    { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans', initialValue: false },
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
          {/* <Form.Item
            name="insta_whts_url"
            label="Instagram URL"
            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
          >
            <Input placeholder="https://www.instagram.com/p/DM2a-hmI9i4/t" />
          </Form.Item> */}
          {/* {instaUrl ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Eye size={20} className="text-success" /> &nbsp;
              <a
               className="text-success"
                href={instaUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {instaUrl}
              </a>
            </div>
          ) : null} */}
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

      {/* Switch Section */}
      <Card size="small">
        <Row gutter={ROW_GUTTER}>
          {[
            {
              name: "event_feature",
              label: "High Demand",
              tooltip: "Mark this event as high demand",
            },
            {
              name: "status",
              label: "Event Status",
              tooltip: "Enable or disable event",
              onLabels: ["Active", "Inactive"],
            },
            {
              name: "house_full",
              label: "House Full",
              tooltip: "Mark event as sold out",
            },
            {
              name: "online_att_sug",
              label: "Hide Online Att Sug",
            },
            {
              name: "offline_att_sug",
              label: "Hide Agent Att Sug",
            },
            { name: "show_on_home", label: "Display on Home" },
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
            {
              name: "is_cancelled",
              label: "Event Cancelled",
              tooltip: "Mark event as cancelled",
            },
            {
              name: "is_sold_out",
              label: "Sold Out",
              tooltip: "Mark event as sold out",
            },
            {
              name: "is_postponed",
              label: "Event Postponed",
              tooltip: "Mark event as postponed",
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

                      // Disable event_feature and show_on_home if online_booking is false
                      const isDisabled =
                        (f.name === 'event_feature' || f.name === 'show_on_home') && !onlineBookingEnabled;

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
                              // except: is_postponed, is_sold_out, online_att_sug, offline_att_sug
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
              );
            })}
        </Row>
      </Card>

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
          <Card title="Ticket Settings">
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
            </Row>

            {/* show button only when Booking By Seat is selected */}
            <Form.Item shouldUpdate noStyle>
              {() => {
                const bookingBySeatValue = form.getFieldValue("bookingBySeat");
                return toBoolean(bookingBySeatValue) ? (
                  <Button type="primary" onClick={handleManageLayoutClick}>
                    Manage Ticket in Layout
                  </Button>
                ) : null;
              }}
            </Form.Item>

          </Card>
        </Col>
      </Row>

      <Modal
        title="Select Layout for Event"
        open={isLayoutModalVisible}
        onCancel={() => setIsLayoutModalVisible(false)}
        footer={null}
      >
        <List
          dataSource={layouts}
          renderItem={(item) => {
            const isAssigned = Number(item.id) === Number(eventLayoutId);
            console.log(item.id, eventLayoutId, isAssigned)
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

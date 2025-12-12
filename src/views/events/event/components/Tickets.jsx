import React, { useState } from 'react';
import { Form, Input, Row, Col, Switch, Card, Button, Modal, List, Typography, Tag } from 'antd';
import { ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
import TicketManager from 'views/events/Tickets/TicketManager/TicketManager';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { useNavigate } from 'react-router-dom';
import ContentSelect from './ContentSelect';

const { TextArea } = Input;
const { Text } = Typography;

const TicketsStep = ({ eventId, eventName, layouts, eventLayoutId, contentList, contentLoading }) => {
  const navigate = useNavigate();
  const form = Form.useFormInstance();
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false);

  const toChecked = (v) => v === 1 || v === '1';
  const toNumber = (checked) => (checked ? 1 : 0);

  const handleBookingTypeChange = (fieldName, checked) => {
    if (checked) {
      // If one is turned on, turn off the other
      if (fieldName === 'ticket_system') {
        form.setFieldValue('bookingBySeat', 0);
      } else if (fieldName === 'bookingBySeat') {
        form.setFieldValue('ticket_system', 0);
      }
    }
    return toNumber(checked);
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
          navigate(`/theatre/new?venueId=${eventLayoutId}`);
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
    { name: 'multi_scan', label: 'Multi Scan Ticket', tooltip: 'Allow multiple scans', initialValue: 0 },
    {
      name: 'ticket_system',
      label: 'Booking By Ticket',
      onChange: (checked) => handleBookingTypeChange('ticket_system', checked),
      initialValue: 1  // Default checked
    },
    {
      name: 'bookingBySeat',
      label: 'Booking By Seat',
      onChange: (checked) => handleBookingTypeChange('bookingBySeat', checked),
      initialValue: 0
    },
  ];

  return (
    <Row gutter={ROW_GUTTER}>
      <Col xs={24} md={12} lg={18}>
        {/* Ticket Manager Section */}
        <Card className="mb-4">
          <TicketManager
            eventId={eventId}
            eventName={eventName}
            showEventName={true}
          />
        </Card>
      </Col>

      {/* Ticket Settings */}
      <Col xs={24} md={12} lg={6}>
        <Card title="Ticket Settings">
          <div className="d-flex flex-column gap-3">
            {switchFields.map((f) => (
              <div key={f.name} className="d-flex justify-content-between align-items-center mb-4">
                <span style={{ fontSize: '14px' }}>{f.label}</span>
                <Form.Item
                  name={f.name}
                  valuePropName="checked"
                  getValueProps={(v) => ({ checked: toChecked(v) })}
                  getValueFromEvent={f.onChange || toNumber}
                  initialValue={f.initialValue}
                  noStyle
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </div>
            ))}
          </div>
          {/* show button only when Booking By Seat is selected */}
          <Form.Item shouldUpdate noStyle>
            {() => {
              const bookingBySeatValue = form.getFieldValue('bookingBySeat');
              return toChecked(bookingBySeatValue) ? (
                <Button type="primary" onClick={handleManageLayoutClick}>
                  Manage Ticket in Layout
                </Button>
              ) : null;
            }}
          </Form.Item>
        </Card>
      </Col>

      {/* Terms & Conditions */}
      <Col span={24}>
        <Card title="Terms & Conditions">
          <ContentSelect
            form={form}
            fieldName="ticket_terms"
            label="Ticket Terms & Conditions"
            contentList={contentList}
            loading={contentLoading}
            placeholder="Select ticket terms"
            rules={[{ required: true, message: "Please select ticket terms" }]}
          />

        </Card>
      </Col>

      {/* Layout Selection Modal */}
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
    </Row>
  );
};

export default TicketsStep;
// BasicDetailsStep.jsx
import React from 'react';
import { Form, Input, Select, Row, Col, Typography, Card, Space, Button } from 'antd';
import { CONSTANTS } from './CONSTANTS';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { CompassOutlined, EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
const { TextArea } = Input;

const BasicDetailsStep = ({ form }) => (
  <Row gutter={ROW_GUTTER}>
    <Col xs={24} md={8}>
      <Form.Item
        name="organizer"
        label="Organizer"
        rules={[{ required: true, message: 'Please select organizer' }]}
      >
        <Select
          placeholder="Select Organizer"
          options={CONSTANTS.organizers}

          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </Col>

    <Col xs={24} md={8}>
      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: 'Please select category' }]}
      >
        <Select
          placeholder="Select Category"
          options={CONSTANTS.categories}

          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </Col>

    <Col xs={24} md={8}>
      <Form.Item
        name="eventName"
        label="Event Name"
        rules={[
          { required: true, message: 'Please enter event name' },
          { min: 3, message: 'Event name must be at least 3 characters' }
        ]}
      >
        <Input placeholder="Enter Event Name" />
      </Form.Item>
    </Col>

    <Col xs={24} md={8}>
      <Form.Item
        name="state"
        label="State"
        rules={[{ required: true, message: 'Please select state' }]}
      >
        <Select
          placeholder="Select State"
          options={CONSTANTS.states}

          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </Col>

    <Col xs={24} md={8}>
      <Form.Item
        name="city"
        label="City"
        rules={[{ required: true, message: 'Please select city' }]}
      >
        <Select
          placeholder="Select City"
          options={CONSTANTS.cities}

          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </Col>

    <Col xs={24} md={8}>
      <Form.Item
        name="venue"
        label="Select Venue"
        rules={[{ required: true, message: 'Please select venue' }]}
      >
        <Select
          placeholder="Select Venue"
          options={CONSTANTS.venues.map(venue => ({
            value: venue.value,
            label: (
              <div>
                <Typography.Text strong>{venue.label}</Typography.Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <EnvironmentOutlined />
                  <span>{venue.location}</span>
                </div>
                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                  {venue.address}
                </Typography.Text>
              </div>
            )
          }))}
          showSearch
          filterOption={(input, option) =>
            (option?.label?.props?.children[0]?.props?.children ?? '').toLowerCase().includes(input.toLowerCase()) ||
            (option?.label?.props?.children[1]?.props?.children[1]?.props?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
          optionLabelProp="label"
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Col>
    {/* //show venue details if venue is selected */}
    <Col xs={24}>
      <Form.Item
        dependencies={['venue']}
        noStyle
      >
        {({ getFieldValue }) => {
          const selectedVenue = CONSTANTS.venues.find(venue => venue.value === getFieldValue('venue'));
          return selectedVenue ? (
            <Card size="small"
              title="Venue Details"
            >
              <Space direction="vertical">

                <Space size="large">
                  <Space>
                    <HomeOutlined className='text-white bg-primary p-2 rounded-circle' />
                    <Typography.Text>{selectedVenue.label}</Typography.Text>
                  </Space>
                  <Space>
                    <CompassOutlined className='text-white bg-primary p-2 rounded-circle' />
                    <Typography.Text>{selectedVenue.location}</Typography.Text>
                  </Space>
                </Space>
                <Space>
                  <EnvironmentOutlined className='text-white bg-primary p-2 rounded-circle' />
                  <Typography.Text>{selectedVenue.address}</Typography.Text>
                </Space>
              </Space>
                <Button
                  type="primary"
                  className='positive-absolute float-sm-center float-none float-sm-right mt-3'
                  icon={<EnvironmentOutlined />}
                  onClick={() => window.open(`https://maps.google.com/?q=${selectedVenue.address}`, '_blank')}
                >
                  View Map
                </Button>
            </Card>
          ) : null;
        }}
      </Form.Item>
    </Col>
    <Col xs={24}>
      <Form.Item
        name="description"
        label="Event Description"
        rules={[
          { required: true, message: 'Please enter description' },
          { min: 20, message: 'Description must be at least 20 characters' }
        ]}
      >
        <TextArea
          rows={5}
          placeholder="Enter detailed event description..."
          showCount
          maxLength={500}
        />
      </Form.Item>
    </Col>
  </Row>
);

export default BasicDetailsStep;
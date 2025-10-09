// BasicDetailsStep.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Form, Input, Select, Row, Col, Typography, Card, Space, Button, Spin, Alert
} from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { CompassOutlined, EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
import {
  useOrganizers,
  useVenuesByOrganizer,
  useEventCategories
} from '../hooks/useEventOptions';
import { useMyContext } from 'Context/MyContextProvider';
import { OrganisationList } from 'utils/CommonInputs';

const { TextArea } = Input;

const BasicDetailsStep = ({ form, isEdit }) => {
  const { UserData,  } = useMyContext();

  // categories
  const {
    data: categories = [],
    isLoading: catLoading,
  } = useEventCategories();

  // compute the organizerId for venues:
  const selectedOrganizerFromForm = Form.useWatch('org_id', form);
  const organizerId = useMemo(() => {
    if (UserData?.role === 'Organizer') {
      return UserData?.id;
    }
    return selectedOrganizerFromForm;
  }, [UserData, selectedOrganizerFromForm]);

  // if user is organizer, set the organizer field once
  useEffect(() => {
    if (UserData?.role === 'Organizer') {
      const current = form.getFieldValue('org_id');
      if (!current && organizerId != null) {
        form.setFieldsValue({ org_id: String(organizerId) });
      }
    }
  }, [UserData, organizerId, form]);

  // Reset venue when organizer changes
  useEffect(() => {
    if (!isEdit && selectedOrganizerFromForm) {
      form.setFieldsValue({ venue_id: undefined });
    }
  }, [selectedOrganizerFromForm, form, isEdit]);

  // venues by organizer
  const {
    data: venues = [],
    isLoading: venueLoading,
    isError: venueError,
    error: venueErrObj,
    refetch: refetchVenues,
  } = useVenuesByOrganizer(organizerId);

  const renderVenueOptionLabel = (v) => (
    <div>
      <Typography.Text strong>
        {v?.name || v?.label || `Venue #${v?.id ?? ''}`}
      </Typography.Text>
      {(v?.location || v?.city || v?.state) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <EnvironmentOutlined />
          <span>{v?.location || [v?.city, v?.state].filter(Boolean).join(', ')}</span>
        </div>
      )}
      {v?.address && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {v.address}
        </Typography.Text>
      )}
    </div>
  );

  // selected venue for details card
  const selectedVenueId = Form.useWatch('venue_id', form);
  const selectedVenue = useMemo(() => {
    if (selectedVenueId == null || selectedVenueId === '') return undefined;
    return venues.find(v =>
      (v?.id != null && String(v.id) === String(selectedVenueId)) ||
      (v?.value != null && String(v.value) === String(selectedVenueId))
    );
  }, [selectedVenueId, venues]);

  const isUserOrganizer = UserData?.role?.toLowerCase() === 'organizer';

  return (
    <Row gutter={ROW_GUTTER}>
      {/* Errors */}
      {venueError && (
        <Col span={24}>
          <Alert
            type="error"
            showIcon
            message="Failed to load venues"
            description={venueErrObj?.message}
            action={<Button size="small" onClick={() => refetchVenues()}>Retry</Button>}
          />
        </Col>
      )}

      {/* Organizer (hidden when user is an organizer) */}
      {!isUserOrganizer && (
        <Col xs={24} md={8}>
          <OrganisationList />
        </Col>
      )}

      {/* Category */}
      <Col xs={24} md={8}>
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: "Please select category" }]}
        >
          <Select
            placeholder="Select Category"
            loading={catLoading}
            options={categories}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={catLoading ? "Loading..." : "No categories found"}
          />
        </Form.Item>
      </Col>

      {/* Event Name */}
      <Col xs={24} md={8}>
        <Form.Item
          name="name"
          label="Event Name"
          rules={[
            { required: true, message: "Please enter event name" },
            { min: 3, message: "Event name must be at least 3 characters" },
          ]}
        >
          <Input placeholder="Enter Event Name" />
        </Form.Item>
      </Col>

      {/* Venues — driven by organizerId */}
      <Col xs={24} md={8}>
        <Form.Item
          name="venue_id"
          label="Select Venue"
          rules={[{ required: true, message: organizerId ? "Please select venue" : "Select organizer first" }]}
        >
          <Select
            placeholder={organizerId ? "Select Venue" : (isUserOrganizer ? "No venues found" : "Select organizer first")}
            loading={venueLoading}
            disabled={!organizerId}
            options={venues.map((v) => ({
              value:String(v.id) ?? String(v.value),
              label: renderVenueOptionLabel(v),
            }))}
            optionLabelProp="label"
            showSearch
            filterOption={(input, option) => {
              const text =
                (option?.label?.props?.children?.[0]?.props?.children ?? '') + ' ' +
                (option?.label?.props?.children?.[1]?.props?.children?.[1] ?? '') + ' ' +
                (option?.label?.props?.children?.[2]?.props?.children ?? '');
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>

      {/* Venue Details */}
      {selectedVenue && (
        <Col xs={24}>
          <Form.Item dependencies={['venue_id']} noStyle>
            {() => selectedVenue ? (
              <Card size="small" title="Venue Details">
                <Space direction="vertical">
                  <Space size="large">
                    <Space>
                      <HomeOutlined className='text-white bg-primary p-2 rounded-circle' />
                      <Typography.Text>{selectedVenue?.name || selectedVenue?.label}</Typography.Text>
                    </Space>
                    {(selectedVenue?.location || selectedVenue?.city || selectedVenue?.state) && (
                      <Space>
                        <CompassOutlined className='text-white bg-primary p-2 rounded-circle' />
                        <Typography.Text>
                          {selectedVenue?.location || [selectedVenue?.city, selectedVenue?.state].filter(Boolean).join(', ')}
                        </Typography.Text>
                      </Space>
                    )}
                  </Space>
                  {selectedVenue?.address && (
                    <Space>
                      <EnvironmentOutlined className='text-white bg-primary p-2 rounded-circle' />
                      <Typography.Text>{selectedVenue.address}</Typography.Text>
                    </Space>
                  )}
                </Space>
                {selectedVenue?.address && (
                  <Button
                    type="primary"
                    className='positive-absolute float-sm-center float-none float-sm-right mt-3'
                    icon={<EnvironmentOutlined />}
                    // onClick={() => window.open(`https://maps.google.com/?q=${selectedVenue.address}`, '_blank')}
                    onClick={() => window.open(`${selectedVenue?.map_url}`, '_blank')}
                  >
                    View Map
                  </Button>
                )}
              </Card>
            ) : null}
          </Form.Item>
        </Col>
      )}

      {/* Description */}
      <Col xs={24}>
        <Form.Item
          name="description"
          label="Event Description"
          rules={[
            { required: true, message: "Please enter description" },
            { min: 20, message: "Description must be at least 20 characters" },
          ]}
        >
          <TextArea rows={5} placeholder="Enter detailed event description..." showCount maxLength={500} />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default BasicDetailsStep;
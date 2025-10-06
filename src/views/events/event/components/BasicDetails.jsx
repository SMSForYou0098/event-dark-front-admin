// BasicDetailsStep.jsx
import React, { useEffect, useMemo } from 'react';
import {
  Form, Input, Select, Row, Col, Typography, Card, Space, Button, Spin, Alert
} from 'antd';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { CompassOutlined, EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
import { useOrganizers, useCountries, useStates, useCities, useVenuesByOrganizer, useEventCategories } from '../hooks/useEventOptions';
import { useMyContext } from 'Context/MyContextProvider';

const { TextArea } = Input;

const BasicDetailsStep = ({ form }) => {
  const { UserData } = useMyContext(); // expect something like { role: 'Organizer', organizerId: 123 }

  // organizers (only needed if NOT an organizer)
  const {
    data: organizers = [],
    isLoading: orgLoading,
    isError: orgError,
    error: orgErrObj,
    refetch: refetchOrg,
  } = useOrganizers();

  // compute the organizerId we should use for venues:
  // - if user is Organizer → use their id
  // - else → use the selected organizer from the form
  const selectedOrganizerFromForm = Form.useWatch('user_id', form);
  const organizerId = useMemo(() => {
    if (UserData?.role?.toLowerCase() === 'organizer') return UserData?.organizerId || UserData?.id;
    return selectedOrganizerFromForm;
  }, [UserData, selectedOrganizerFromForm]);

  // if user is organizer, set the organizer field once (for validation & submit)
  useEffect(() => {
    if (UserData?.role?.toLowerCase() === 'organizer') {
      const current = form.getFieldValue('user_id');
      if (!current && organizerId) {
        form.setFieldsValue({ user_id: organizerId });
      }
    }
  }, [UserData, organizerId, form]);

  // country/state/city
  const country = Form.useWatch('country', form);
  const state = Form.useWatch('state', form);
  const { data: countries = [], isLoading: ctryLoading } = useCountries();
  const { data: states = [], isLoading: stateLoading } = useStates(country);
  const { data: cities = [], isLoading: cityLoading } = useCities(country, state);
  const { data: categories = [], isLoading, isError, refetch } = useEventCategories();
  // venues by organizer id
  const {
    data: venues = [],
    isLoading: venueLoading,
    isError: venueError,
    error: venueErrObj,
    refetch: refetchVenues,
  } = useVenuesByOrganizer(organizerId);

  const renderVenueOptionLabel = (v) => (
    <div>
      <Typography.Text strong>{v?.name || v?.label || `Venue #${v?.id ?? ''}`}</Typography.Text>
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

  // 👇 keep these near the top of the component
const selectedVenueId = Form.useWatch('venue', form);

const selectedVenue = React.useMemo(() => {
  if (selectedVenueId === undefined || selectedVenueId === null || selectedVenueId === '') {
    return undefined;
  }
  return venues.find(v =>
    (v?.id != null && String(v.id) === String(selectedVenueId)) ||
    (v?.value != null && String(v.value) === String(selectedVenueId))
  );
}, [selectedVenueId, venues]);

  const isUserOrganizer = UserData?.role?.toLowerCase() === 'organizer';

  return (
    <Row gutter={ROW_GUTTER}>
      {/* Errors */}
      {!isUserOrganizer && orgError && (
        <Col span={24}>
          <Alert
            type="error"
            showIcon
            message="Failed to load organizers"
            description={orgErrObj?.message}
            action={
              <Button size="small" onClick={() => refetchOrg()}>
                Retry
              </Button>
            }
          />
        </Col>
      )}
      {venueError && (
        <Col span={24}>
          <Alert
            type="error"
            showIcon
            message="Failed to load venues"
            description={venueErrObj?.message}
            action={
              <Button size="small" onClick={() => refetchVenues()}>
                Retry
              </Button>
            }
          />
        </Col>
      )}

      {/* Organizer (hidden when user is an organizer) */}
      {!isUserOrganizer && (
        <Col xs={24} md={8}>
          <Form.Item
            name="user_id"
            label="Organizer"
            rules={[{ required: true, message: "Please select organizer" }]}
          >
            <Select
              placeholder="Select Organizer"
              loading={orgLoading}
              options={organizers.map((o) => ({ label: o.name, value: o.id }))}
              notFoundContent={
                orgLoading ? <Spin size="small" /> : "No organizers found"
              }
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={() => form.setFieldsValue({ venue: undefined })}
            />
          </Form.Item>
        </Col>
      )}

      {/* Event Categories */}

      <Col xs={24} md={8}>
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: "Please select category" }]}
        >
          <Select
            placeholder="Select Category"
            loading={isLoading}
            options={categories}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={isLoading ? "Loading..." : "No categories found"}
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

      {/* Country */}
      <Col xs={24} md={8}>
        <Form.Item
          name="country"
          label="Country"
          rules={[{ required: true, message: "Please select country" }]}
        >
          <Select
            placeholder="Select Country"
            options={countries}
            loading={ctryLoading}
            showSearch
            filterOption={(i, o) =>
              (o?.label ?? "").toLowerCase().includes(i.toLowerCase())
            }
            onChange={() =>
              form.setFieldsValue({ state: undefined, city: undefined })
            }
          />
        </Form.Item>
      </Col>

      {/* State */}
      <Col xs={24} md={8}>
        <Form.Item
          name="state"
          label="State"
          rules={[{ required: true, message: "Please select state" }]}
        >
          <Select
            placeholder={country ? "Select State" : "Select country first"}
            options={states}
            loading={stateLoading}
            disabled={!country}
            showSearch
            filterOption={(i, o) =>
              (o?.label ?? "").toLowerCase().includes(i.toLowerCase())
            }
            onChange={() => form.setFieldsValue({ city: undefined })}
          />
        </Form.Item>
      </Col>

      {/* City */}
      <Col xs={24} md={8}>
        <Form.Item
          name="city"
          label="City"
          rules={[{ required: true, message: "Please select city" }]}
        >
          <Select
            placeholder={state ? "Select City" : "Select state first"}
            options={cities}
            loading={cityLoading}
            disabled={!state}
            showSearch
            filterOption={(i, o) =>
              (o?.label ?? "").toLowerCase().includes(i.toLowerCase())
            }
          />
        </Form.Item>
      </Col>

      {/* Venues — driven by organizerId (from user or select) */}
      <Col xs={24} md={8}>
        <Form.Item
          name="venue"
          label="Select Venue"
          rules={[
            {
              required: true,
              message: organizerId
                ? "Please select venue"
                : "Select organizer first",
            },
          ]}
        >
          <Select
            placeholder={
              organizerId
                ? "Select Venue"
                : isUserOrganizer
                ? "No venues found"
                : "Select organizer first"
            }
            loading={venueLoading}
            disabled={!organizerId}
            options={venues.map((v) => ({
              value: v.id ?? v.value,
              label: renderVenueOptionLabel(v),
            }))}
            optionLabelProp="label"
            showSearch
            filterOption={(input, option) => {
              const text =
                (option?.label?.props?.children?.[0]?.props?.children ?? "") +
                " " +
                (option?.label?.props?.children?.[1]?.props?.children?.[1] ??
                  "") +
                " " +
                (option?.label?.props?.children?.[2]?.props?.children ?? "");
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Col>

      {/* Venue Details */}
      {selectedVenue && (
      <Col xs={24}>
  <Form.Item dependencies={['venue']} noStyle>
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
            onClick={() => window.open(`https://maps.google.com/?q=${selectedVenue.address}`, '_blank')}
          >
            View Map
          </Button>
        )}
      </Card>
    ) : null}
  </Form.Item>
</Col>)}

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
};

export default BasicDetailsStep;

import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Empty, Form, Row, Select, Space, Spin, Tooltip, Typography } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { BarChartOutlined, ColumnWidthOutlined, LeftOutlined, RightOutlined, ExpandOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';
import PermissionChecker from 'layouts/PermissionChecker';
import { PERMISSIONS } from 'constants/PermissionConstant';
import { OrgEventList, OrganisationList } from 'utils/CommonInputs';
import ReportSummaryCards from './components/ReportSummaryCards';
import ReportTables from './components/ReportTables';
import EventWiseAccordion from './components/EventWiseAccordion';
import { buildGlobalReportPayload, getChannelCardVisibility } from './utils/reportHelpers';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { Title, Text } = Typography;

const GlobalReport = () => {
  const [form] = Form.useForm();
  const [reportData, setReportData] = useState(null);
  const [submittedChannels, setSubmittedChannels] = useState([]);
  const [submittedEventIds, setSubmittedEventIds] = useState([]);
  const [submittedEventNames, setSubmittedEventNames] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [layoutMode, setLayoutMode] = useState('balanced');

  const { mutate: submitGlobalReport, isPending: isSubmitting } = useMutation({
    mutationFn: async (payload) => {
      return api.post('/global-report', payload);
    },
    onSuccess: (response) => {
      const normalized = response?.data ? response.data : response;
      setReportData(normalized || null);
      console.log('Global Report API Response:', normalized);
    },
  });

  const [filters, setFilters] = useState({
    orgId: null,
    eventId: [],
    channel: [],
    bookingType: [],
    duration: null,
    customDateRange: [],
  });

  const handleOrgChange = (value) => {
    setFilters(prev => ({
      ...prev,
      orgId: value,
      eventId: []
    }));
    form.setFieldValue('event_id', []);
  };

  const handleEventChange = (value) => {
    setFilters(prev => ({
      ...prev,
      eventId: value
    }));
  };

  const handleChannelChange = (value) => {
    const isOfflineSelected = value?.includes('offline');
    setFilters(prev => ({
      ...prev,
      channel: value,
      bookingType: isOfflineSelected ? prev.bookingType : []
    }));
    if (!isOfflineSelected) {
      form.setFieldValue('bookingType', []);
    }
  };

  const handleBookingTypeChange = (value) => {
    setFilters(prev => ({
      ...prev,
      bookingType: value
    }));
  };

  const handleDurationChange = (value) => {
    const isCustomDate = value === 'custom_date';
    setFilters(prev => ({
      ...prev,
      duration: value,
      customDateRange: isCustomDate ? prev.customDateRange : []
    }));

    if (!isCustomDate) {
      form.setFieldValue('customDateRange', []);
    }
  };

  const handleCustomDateRangeChange = (value) => {
    setFilters(prev => ({
      ...prev,
      customDateRange: value || []
    }));
  };

  const handleSubmit = (values) => {
    const payload = buildGlobalReportPayload(values);
    const selectedIds = payload.event_id || [];
    const selectedNames = selectedIds
      .map((id) => eventOptions.find((event) => String(event?.value) === String(id))?.label)
      .filter(Boolean);

    setSubmittedChannels(payload.channel || []);
    setSubmittedEventIds(selectedIds);
    setSubmittedEventNames(selectedNames);
    console.log('Global Report Filters:', payload);
    submitGlobalReport(payload);
  };

  const { showOfflineCard } = getChannelCardVisibility(submittedChannels);
  const hasEventWiseData = Array.isArray(reportData?.events) && reportData.events.length > 0;
  const selectedEventCount = submittedEventIds.length;
  const showEventWiseSplit = hasEventWiseData && selectedEventCount !== 1;
  const selectedEventNamesText =
    selectedEventCount === 0
      ? 'All Events'
      : submittedEventNames.length > 0
        ? submittedEventNames.join(', ')
        : submittedEventIds.join(', ');

  // Layout span calculations based on layout mode
  const getLayoutSpans = () => {
    if (!showEventWiseSplit) return { accordion: 0, report: 24 };

    const modes = {
      balanced: { accordion: 12, report: 12 },
      'accordion-wide': { accordion: 16, report: 8 },
      'report-wide': { accordion: 8, report: 16 },
      stacked: { accordion: 24, report: 24 },
    };
    return modes[layoutMode] || modes.balanced;
  };

  const layoutSpans = getLayoutSpans();

  return (
    <PermissionChecker permission={PERMISSIONS.VIEW_DASHBOARD}>
      <div className="p-3">
        <Card
          title={
            <Title level={4} className="mb-0">
              <BarChartOutlined className="mr-2" />
              Global Report
            </Title>
          }
          extra={
            <>
              <Space size={'small'}>
                {showEventWiseSplit && (
                  <Space size={4} className="d-flex align-items-center">
                    <Text type="secondary" style={{ fontSize: '12px' }}>Layout:</Text>
                    <Button.Group size="small">
                      <Tooltip title="Balanced 50/50">
                        <Button
                          type={layoutMode === 'balanced' ? 'primary' : 'default'}
                          onClick={() => setLayoutMode('balanced')}
                          icon={<ColumnWidthOutlined />}
                        />
                      </Tooltip>
                      <Tooltip title="Accordion Wide">
                        <Button
                          type={layoutMode === 'accordion-wide' ? 'primary' : 'default'}
                          onClick={() => setLayoutMode('accordion-wide')}
                          icon={<LeftOutlined />}
                        />
                      </Tooltip>
                      <Tooltip title="Report Wide">
                        <Button
                          type={layoutMode === 'report-wide' ? 'primary' : 'default'}
                          onClick={() => setLayoutMode('report-wide')}
                          icon={<RightOutlined />}
                        />
                      </Tooltip>
                      <Tooltip title="Stacked Full Width">
                        <Button
                          type={layoutMode === 'stacked' ? 'primary' : 'default'}
                          onClick={() => setLayoutMode('stacked')}
                          icon={<ExpandOutlined />}
                        />
                      </Tooltip>
                    </Button.Group>
                  </Space>
                )}
              <Tooltip title={!filters.orgId ? 'Select organization first' : ''}>
                <span>
                  <Button
                    type="primary"
                    loading={isSubmitting}
                    disabled={!filters.orgId}
                    onClick={() => form.submit()}
                  >
                    Submit
                  </Button>
                </span>
              </Tooltip>
              </Space>
            </>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={[16, 16]} align="top">
              <Col flex="auto">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8} lg={4}>
                    <OrganisationList
                      label={null}
                      onChange={handleOrgChange}
                      value={filters.orgId}
                      formItemProps={{ style: { marginBottom: 0 } }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4}>
                    <OrgEventList
                      label={null}
                      orgId={filters.orgId}
                      mode='multiple'
                      type='Organizer'
                      onChange={handleEventChange}
                      onEventsLoaded={setEventOptions}
                      value={filters.eventId}
                      formItemProps={{ style: { marginBottom: 0 } }}
                      selectProps={{ maxTagCount: 'responsive' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4}>
                    <Form.Item
                      name="channel"
                      label={null}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Select Channel"
                        onChange={handleChannelChange}
                        value={filters.channel}
                        maxTagCount="responsive"
                      >
                        <Select.Option value="online">Online</Select.Option>
                        <Select.Option value="offline">Offline</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  {filters.channel?.includes('offline') && (
                    <Col xs={24} sm={12} md={8} lg={3}>
                      <Form.Item
                        name="bookingType"
                        label={null}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select Booking Type"
                          onChange={handleBookingTypeChange}
                          value={filters.bookingType}
                          maxTagCount="responsive"
                        >
                          <Select.Option value="agent">Agent</Select.Option>
                          <Select.Option value="pos">POS</Select.Option>
                          <Select.Option value="complimentary">Complimentary</Select.Option>
                          <Select.Option value="sponsor">Sponsor</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  )}

                  <Col xs={24} sm={12} md={8} lg={3}>
                    <Form.Item
                      name="duration"
                      label={null}
                    >
                      <Select
                        placeholder="Select Duration"
                        onChange={handleDurationChange}
                        value={filters.duration}
                        virtual={false}
                      >
                        <Select.Option value="today">Today</Select.Option>
                        <Select.Option value="yesterday">Yesterday</Select.Option>
                        <Select.Option value="this_week">This Week</Select.Option>
                        <Select.Option value="last_week">Last Week</Select.Option>
                        <Select.Option value="this_month">This Month</Select.Option>
                        <Select.Option value="overall">Overall</Select.Option>
                        <Select.Option value="custom_date">Custom Date</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {filters.duration === 'custom_date' && (
                    <Col xs={24} sm={12} md={12} lg={6}>
                      <Form.Item
                        name="customDateRange"
                        label={null}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const duration = getFieldValue('duration');
                              if (duration !== 'custom_date') {
                                return Promise.resolve();
                              }

                              if (Array.isArray(value) && value.length === 2) {
                                return Promise.resolve();
                              }

                              return Promise.reject(new Error('Please select custom date range'));
                            },
                          }),
                        ]}
                      >
                        <DatePicker.RangePicker
                          style={{ width: '100%' }}
                          onChange={handleCustomDateRangeChange}
                          value={filters.customDateRange}
                        />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              </Col>
            </Row>
          </Form>
        </Card>

        {isSubmitting && !reportData && (
          <Card className="mt-3">
            <div className="py-5 text-center">
              <Spin />
            </div>
          </Card>
        )}

        {!isSubmitting && !reportData && (
          <Card className="mt-3">
            <Empty description="Submit filters to load report" />
          </Card>
        )}

        {reportData && (
          <Row gutter={ROW_GUTTER} align="top" className={layoutMode === 'stacked' ? '' : ''}>
            <Col xs={24} lg={layoutSpans.report}>
              <Card
                size="small"
                title={"Report Summary & Details - " + selectedEventNamesText}
              >
                {/* <Title level={5} className="mb-3">Report Result</Title> */}

                {isSubmitting ? (
                  <div className="py-5 text-center">
                    <Spin />
                  </div>
                ) : (
                  <>
                    <ReportSummaryCards
                      reportData={reportData}
                      isSingleEventSelected={selectedEventCount === 1}
                    />

                    <ReportTables
                      reportData={reportData}
                      showTickets={!showEventWiseSplit}
                      showOfflineBookingType={showOfflineCard}
                    />
                  </>
                )}
              </Card>
            </Col>
            {showEventWiseSplit && (
              <Col xs={24} lg={layoutSpans.accordion}>
                <Card size="small" title="Event Wise Details">
                  <EventWiseAccordion
                    events={reportData?.events || []}
                    submittedChannels={submittedChannels}
                  />
                </Card>
              </Col>
            )}
          </Row>
        )}
      </div>
    </PermissionChecker>
  );
};

export default GlobalReport;

import React, { memo, useState, useMemo } from 'react';
import { Card, Form, Select, DatePicker, Radio, Button, Spin, Table, Typography, Row, Col, Space, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMyContext } from '../../../Context/MyContextProvider';
import Utils from 'utils';
import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';
import usePermission from 'utils/hooks/usePermission';
import api from 'auth/FetchInterceptor';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Intimations = memo(() => {
    const { UserData } = useMyContext();
    const [form] = Form.useForm();
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch events list using TanStack Query
    const {
        data: eventsData = { events: [], pagination: null },
        isLoading: eventsLoading,
        isError: eventsError, // using Utils for error messages
        error: eventsErrObj,
    } = useQuery({
        queryKey: ['intimation-events', UserData?.id],
        queryFn: async () => {
            const response = await api.get(`events/active`);

            if (response?.status && response?.events) {
                return {
                    events: response.events,
                    pagination: response.pagination
                };
            }
            throw new Error(response?.message || 'Failed to fetch events');
        },
        enabled: !!UserData?.id,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    });

    // Extract events for dropdown
    const eventOptions = useMemo(() => {
        return eventsData.events.map(event => ({
            value: event.id,
            label: `${event.name} (${event.event_key})`,
            event: event
        }));
    }, [eventsData.events]);

    // Mutation for fetching contacts
    const {
        mutate: fetchContacts,
        data: contactsData = { contacts: [], pagination: null },
        isLoading: contactsLoading,
        isError: contactsError,
        error: contactsErrObj,
        reset: resetContacts,
    } = useMutation({
        mutationFn: async (payload) => {
            const response = await api.post('event/contacts', payload);

            if (response?.status) {
                return {
                    contacts: response.contacts || response.data || [],
                    pagination: response.pagination
                };
            }
            throw new Error(response?.message || 'Failed to fetch contacts');
        },
        onError: (error) => {
            message.error(error?.message || 'Failed to fetch contacts');
        },
        onSuccess: (data) => {
            const count = data.contacts?.length || 0;
            message.success(`Found ${count} contact(s)`);
        }
    });

    // Handle event selection change
    const canViewIntimations = usePermission(PERMISSIONS.VIEW_INTIMATIONS);
    const handleEventChange = (value, option) => {
        setSelectedEvent(option?.event || null);
        form.setFieldsValue({ event_id: value });
        resetContacts(); // Reset previous contacts when event changes
    };

    // Handle form submission
    const handleSubmit = (values) => {
        const { event_id, type, date_range, booking_type } = values;

        // Format date range as required by API: "2024-12-01,2024-12-31"
        let formattedDateRange = '';
        if (date_range && date_range.length === 2) {
            formattedDateRange = `${dayjs(date_range[0]).format('YYYY-MM-DD')},${dayjs(date_range[1]).format('YYYY-MM-DD')}`;
        }

        const payload = {
            event_id: event_id,
            type: type || 'both',
            date_range: formattedDateRange,
            booking_type: booking_type || 'online',
            page: 1,
            per_page: 500,
        };

        fetchContacts(payload);
    };

    // Table columns for contacts display
    const contactColumns = useMemo(() => [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Booking Type',
            dataIndex: 'booking_type',
            key: 'booking_type',
        },
    ], []);

    return (
        <PermissionChecker permission={PERMISSIONS.VIEW_INTIMATIONS}>
            <div className="intimations-container">
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            Event Intimations
                        </Title>
                    }
                    className="mb-4"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            type: 'both',
                            booking_type: 'online',
                        }}
                    >
                        <Row gutter={[16, 16]}>
                            {/* Event Selection */}
                            <Col xs={24} md={12} lg={8}>
                                <Form.Item
                                    name="event_id"
                                    label="Select Event"
                                    rules={[{ required: true, message: 'Please select an event' }]}
                                >
                                    <Select
                                        placeholder="Select an event"
                                        loading={eventsLoading}
                                        disabled={eventsLoading}
                                        showSearch
                                        optionFilterProp="label"
                                        options={eventOptions}
                                        onChange={handleEventChange}
                                        notFoundContent={
                                            eventsLoading ? <Spin size="small" /> : 'No events found'
                                        }
                                        status={eventsError ? 'error' : undefined}
                                    />
                                </Form.Item>
                                {eventsError && (
                                    <Text type="danger" className="d-block mb-2">
                                        {Utils.getErrorMessage(eventsErrObj)}
                                    </Text>
                                )}
                            </Col>

                            {/* Date Range */}
                            <Col xs={24} md={12} lg={8}>
                                <Form.Item
                                    name="date_range"
                                    label="Date Range"
                                    rules={[{ required: true, message: 'Please select date range' }]}
                                >
                                    <RangePicker
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD"
                                        placeholder={['Start Date', 'End Date']}
                                    />
                                </Form.Item>
                            </Col>

                            {/* Type Selection */}
                            <Col xs={24} md={12} lg={8}>
                                <Form.Item
                                    name="type"
                                    label="Contact Type"
                                >
                                    <Radio.Group>
                                        <Radio value="attendee">Attendees</Radio>
                                        <Radio value="user">Users</Radio>
                                        <Radio value="both">Both</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>

                            {/* Booking Type */}
                            <Col xs={24} md={12} lg={8}>
                                <Form.Item
                                    name="booking_type"
                                    label="Booking Type"
                                >
                                    <Select
                                        placeholder="Select booking type"
                                        options={[
                                            { value: 'online', label: 'Online' },
                                            { value: 'sponsor', label: 'Sponsor' },
                                            { value: 'agent', label: 'Agent' },
                                            { value: 'all', label: 'All' },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>

                            {/* Submit Button */}
                            <Col xs={24}>
                                <Form.Item>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={contactsLoading}
                                            disabled={eventsLoading}
                                        >
                                            Fetch Contacts
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                form.resetFields();
                                                setSelectedEvent(null);
                                                resetContacts();
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>

                {/* Contacts Results */}
                {(contactsData.contacts?.length > 0 || contactsLoading || contactsError) && (
                    <Card
                        title={
                            <Title level={5} style={{ margin: 0 }}>
                                Contacts ({contactsData.contacts?.length || 0})
                            </Title>
                        }
                    >
                        {contactsError && (
                            <Text type="danger" className="d-block mb-3">
                                {Utils.getErrorMessage(contactsErrObj)}
                            </Text>
                        )}
                        <Table
                            dataSource={contactsData.contacts}
                            columns={contactColumns}
                            loading={contactsLoading}
                            rowKey={(record) => record.id || record.email || record.phone}
                            pagination={{
                                pageSize: 15,
                                showSizeChanger: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} contacts`,
                            }}
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                )}
            </div>
        </PermissionChecker>
    );
});

Intimations.displayName = 'Intimations';

export default Intimations;

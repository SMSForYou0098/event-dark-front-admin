import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, notification, Radio, Row, Select, Space, Spin, Switch } from 'antd';
import PermissionChecker from 'layouts/PermissionChecker';
import React, { useEffect, useMemo } from 'react';
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from 'Context/MyContextProvider';
import { Key } from 'lucide-react';
import { mapApiToForm, mapFormToApi } from './dataMappers';
import axios from 'axios';
import { updateUser } from 'store/slices/authSlice';
import Flex from 'components/shared-components/Flex';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

const ProfileTab = ({ mode, handleSubmit, id = null }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const { OrganizerList, userRole, UserData, api, authToken } = useMyContext();


    // Fetch user data in edit mode
    const { data: fethedData, isLoading: loading } = useQuery({
        queryKey: ["user", id],
        enabled: mode === "edit" && Boolean(id),
        queryFn: async () => {
            const res = await apiClient.get(`edit-user/${id}`);
            if (!res?.status) {
                throw new Error(res?.message || res?.error || 'Failed to load user');
            }
            return res;
        },
    });




    const [form] = Form.useForm();

    // Watch form values for conditional logic
    const EMPTY_ARRAY = [];
    const roleId = Form.useWatch('roleId', form);
    const roleName = Form.useWatch('roleName', form);
    const reportingUser = Form.useWatch('reportingUser', form);
    const selectedEvents = Form.useWatch('events', form) || EMPTY_ARRAY;



    // Fetch roles
    const { data: roles = [] } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get(`role-list`);
            return (res?.role || []).slice().reverse();
        },
        staleTime: 5 * 60 * 1000,
    });

    // Conditional checks
    const showRoleGate = mode === "create" && !roleId;
    const showAM = useMemo(() => {
        return ['POS', 'Agent', 'Scanner', 'Sponsor'].includes(roleName);
    }, [roleName]);

    const needsEvents = useMemo(() => {
        return ['Agent', 'Sponsor', 'Accreditation'].includes(roleName);
    }, [roleName]);

    // Get reporting user ID for events query
    const reportingUserId = useMemo(() => {
        if (mode === "create") {
            return userRole === 'Organizer' ? UserData?.id : reportingUser?.value || reportingUser;
        }
        return reportingUser?.value || reportingUser?.key || reportingUser;
    }, [mode, userRole, UserData, reportingUser]);


    // Fetch events
    const { data: events = [] } = useQuery({
        queryKey: ["org-events", reportingUserId],
        enabled: Boolean(needsEvents && reportingUserId),
        queryFn: async () => {
            const res = await apiClient.get(`org-event/${reportingUserId}`);
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.events) ? res.events : [];
            return list.map(event => ({
                value: event.id,
                label: event.name,
                tickets: event.tickets || []
            }));
        },
        staleTime: 5 * 60 * 1000,
    });

    // Generate ticket options based on selected events
    const ticketOptions = useMemo(() => {
        if (!selectedEvents.length) return [];

        const selectedEventObjects = events.filter(e =>
            selectedEvents.includes(e.value)
        );

        return selectedEventObjects.map(event => ({
            label: event.label,
            options: (event.tickets || []).map(ticket => ({
                value: String(ticket.id || ticket.value),
                label: ticket.name || ticket.label,
                eventId: event.value
            }))
        }));
    }, [selectedEvents, events]);

    // Initialize form with data
    useEffect(() => {
        if (mode === 'edit' && fethedData?.user) {
            const mappedData = mapApiToForm(fethedData?.user);
            form.setFieldsValue(mappedData);
        }
    }, [mode, fethedData, form]);

    // Handle role change
    const handleRoleChange = (value) => {
        const selectedRole = roles.find(r => r.id === parseInt(value));
        form.setFieldValue('roleName', selectedRole?.name);
        form.setFieldsValue({ events: [], tickets: [], gates: [] });
    };

    // Handle event change
    const handleEventChange = (selectedValues) => {
        // When events change, filter out tickets that no longer belong
        const currentTickets = form.getFieldValue('tickets') || [];

        if (!selectedValues || selectedValues.length === 0) {
            // Clear all tickets if no events selected
            form.setFieldValue('tickets', []);
            return;
        }

        // Get valid tickets for selected events
        const validEventIds = selectedValues;
        const validTickets = currentTickets.filter(ticketId => {
            // Check if this ticket belongs to any selected event
            return ticketOptions.some(group =>
                group.options.some(ticket =>
                    String(ticket.value) === String(ticketId) &&
                    validEventIds.includes(ticket.eventId)
                )
            );
        });

        // Update tickets if any were filtered out
        if (validTickets.length !== currentTickets.length) {
            form.setFieldValue('tickets', validTickets);
        }
    };

    // Custom validation rules
    const requiredIf = (condition, message) => ({
        validator(_, value) {
            if (!condition) return Promise.resolve();
            const hasValue = Array.isArray(value)
                ? value.length > 0
                : value !== undefined && value !== null && value !== '';
            return hasValue ? Promise.resolve() : Promise.reject(new Error(message));
        }
    });
    if (loading) {
        return <Spin className='w-100 text-center mt-5' />
    }
    // Form submit handler
    const onFinish = async (values) => {
        const apiData = mapFormToApi(values);
        try {
            const url = mode === "create" ? `${api}create-user` : `${api}update-user/${id}`;
            const response = await axios.post(url, apiData, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });

            if (response.data?.status) {
                if (id === UserData?.id) {
                    dispatch(updateUser(response.data.user));
                    navigate(-1);
                }
                // successAlert(`User ${mode === "create" ? "created" : "updated"}`, response.data.message);
                notification.success({
                    message: `User ${mode === "create" ? "created" : "updated"}`,
                    description: response.data.message,
                });

                if (mode === "create") {
                    navigate(-1);
                }
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: error.response?.data?.error || error.response?.data?.message || 'Something went wrong!',
            });

        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                status: 'Active',
                paymentMethod: 'Cash',
                authentication: false,
                agreementStatus: false,
                agentDiscount: false,
            }}
        >
            <Row gutter={[16, 16]}>
                {/* Left Column */}
                <Col xs={24} lg={12}>
                    {/* Role Selection (Admin/Organizer only) */}
                    <PermissionChecker role={['Admin', 'Organizer']}>
                        <Card title="Select User Role" extra={
                            <Flex justifyContent="end">
                                <Button className="mr-2" onClick={() => navigate(-1)}>
                                    Discard
                                </Button>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    {mode === "create" ? "Create" : "Update"}
                                </Button>
                            </Flex>
                        } style={{ marginBottom: 16 }}>

                            <Form.Item
                                label="User Role"
                                name="roleId"
                                rules={[{ required: true, message: 'Please select role' }]}
                            >
                                <Select
                                    placeholder="Select role"
                                    onChange={handleRoleChange}
                                    options={roles.map(item => ({
                                        value: item.id,
                                        label: item.name
                                    }))}
                                />
                            </Form.Item>
                            <Form.Item name="roleName" hidden>
                                <Input />
                            </Form.Item>
                        </Card>
                    </PermissionChecker>

                    {/* Basic Information */}
                    <Card title="Basic Information">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter name' }]}
                                >
                                    <Input placeholder="Enter name" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please enter email' },
                                        { type: 'email', message: 'Please enter valid email' }
                                    ]}
                                >
                                    <Input placeholder="Enter email" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Mobile Number"
                                    name="number"
                                    rules={[
                                        { required: true, message: 'Please enter mobile number' },
                                        { pattern: /^\d{10,12}$/, message: 'Must be 10-12 digits' }
                                    ]}
                                >
                                    <Input placeholder="Enter mobile number" />
                                </Form.Item>
                            </Col>

                            {/* Conditional Fields based on Role */}
                            {roleName === 'Organizer' && (
                                <>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Agreement Status"
                                            name="agreementStatus"
                                            valuePropName="checked"
                                        >
                                            <Switch
                                                checkedChildren="Active"
                                                unCheckedChildren="Inactive"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Organisation"
                                            name="organisation"
                                        >
                                            <Input placeholder="Enter organisation" />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}

                            {/* Account Manager for specific roles */}
                            {showAM && (
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Account Manager"
                                        name="reportingUser"
                                        rules={[requiredIf(showAM, 'Please select account manager')]}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Select organization"
                                            options={OrganizerList?.map(org => ({
                                                value: String(org.value),
                                                label: `${org.organisation} (${org.label})`,
                                            }))}
                                            optionFilterProp="label"
                                        />
                                    </Form.Item>
                                </Col>
                            )}

                            {/* Events Assignment */}
                            {needsEvents && (
                                <>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Assign Events"
                                            name="events"
                                            rules={[requiredIf(needsEvents, 'Please select at least one event')]}
                                        >
                                            <Select
                                                mode="multiple"
                                                placeholder="Select events"
                                                options={events}
                                                onChange={handleEventChange}
                                                optionFilterProp="label"
                                                showSearch
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Assign Tickets"
                                            name="tickets"
                                            dependencies={['events']}
                                        >

                                            <Select
                                                mode="multiple"
                                                placeholder="Select tickets"
                                                disabled={!selectedEvents.length}
                                                showSearch
                                            >

                                                {ticketOptions.map(group => (
                                                    <Select.OptGroup key={group.label} label={group.label}>
                                                        {group.options.map(ticket => (
                                                            <Select.Option key={ticket.value} value={ticket.value}>
                                                                {ticket.label}
                                                            </Select.Option>
                                                        ))}
                                                    </Select.OptGroup>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </>
                            )}

                            {/* Agent Discount */}
                            {roleName === 'Agent' && (
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Agent Discount"
                                        name="agentDiscount"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            )}

                            {/* Scanner QR Length */}
                            {roleName === 'Scanner' && (
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="QR Data Length"
                                        name="qrLength"
                                        rules={[
                                            { required: true, message: 'Please enter QR length' },
                                            {
                                                type: 'number',
                                                min: 6,
                                                max: 20,
                                                message: 'Must be between 6 and 20'
                                            }
                                        ]}
                                    >
                                        <Input type="number" min={6} max={20} placeholder="6-20" />
                                    </Form.Item>
                                </Col>
                            )}


                            {mode === 'create' && (
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Confirm Password"
                                        name="repeatPassword"
                                        dependencies={['password']}
                                        rules={[
                                            { required: true, message: 'Please confirm password' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match'));
                                                }
                                            })
                                        ]}
                                    >
                                        <Input.Password placeholder="Re-enter password" />
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                    </Card>
                </Col>

                {/* Right Column */}
                <Col xs={24} lg={12}>
                    {/* Payment Method */}
                    {(roleName === 'POS' || roleName === 'Corporate') && (
                        <Card title="Payment Method" style={{ marginBottom: 16 }}>
                            <Form.Item
                                name="paymentMethod"
                                rules={[{ required: true, message: 'Please select payment method' }]}
                            >
                                <Radio.Group>
                                    <Radio value="Cash">Cash</Radio>
                                    <Radio value="UPI">UPI</Radio>
                                    <Radio value="Card">Card</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Card>
                    )}

                    {/* Address */}
                    {!showRoleGate && (
                        <Card title="Address" style={{ marginBottom: 16 }}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="City" name="city">
                                        <Input placeholder="Enter city" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Pincode" name="pincode">
                                        <Input placeholder="Enter pincode" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {/* Banking Details (Admin + Organizer role) */}
                    {userRole === 'Admin' && roleName === 'Organizer' && (
                        <Card title="Banking Details" style={{ marginBottom: 16 }}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Bank Name" name="bankName">
                                        <Input placeholder="Enter bank name" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="IFSC Code" name="bankIfsc">
                                        <Input placeholder="Enter IFSC code" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Branch Name" name="bankBranch">
                                        <Input placeholder="Enter branch name" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Account Number" name="bankNumber">
                                        <Input placeholder="Enter account number" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {/* Other (Organizer only) */}
                    {roleName === 'Organizer' && (
                        <Card title="Other" style={{ marginBottom: 16 }}>
                            <Form.Item label="GST / VAT Tax" name="orgGstNumber">
                                <Input placeholder="GST / VAT Tax" />
                            </Form.Item>
                        </Card>
                    )}

                    {/* Status & Security */}
                    {!showRoleGate && (
                        <PermissionChecker role={['Admin', 'Organizer']}>
                            <Card title="Status & Security">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="User Status" name="status">
                                            <Select>
                                                <Select.Option value="Active">Active</Select.Option>
                                                <Select.Option value="Inactive">Inactive</Select.Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>


                                    {/* Password Fields */}
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Password"
                                            name="password"
                                            rules={[
                                                requiredIf(mode === 'create', 'Please enter password'),
                                                ...(mode === 'create' ? [{ min: 6, message: 'Min 6 characters' }] : [])
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<Key className="text-primary" size={16} />}
                                                placeholder="Enter password"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={24}>
                                        <Space size="large">
                                            <Form.Item
                                                label="Authentication Method"
                                                name="authentication"
                                                valuePropName="checked"
                                            >
                                                <Switch
                                                    checkedChildren="Password"
                                                    unCheckedChildren="OTP"
                                                />
                                            </Form.Item>
                                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
                                                prevValues.authentication !== currentValues.authentication
                                            }>
                                                {({ getFieldValue }) => {
                                                    const isPasswordAuth = getFieldValue('authentication');
                                                    return (
                                                        <Alert
                                                            type="info"
                                                            message={
                                                                isPasswordAuth
                                                                    ? "Password authentication is currently active"
                                                                    : "OTP (One-Time Password) authentication is currently active"
                                                            }
                                                            showIcon
                                                        />
                                                    );
                                                }}
                                            </Form.Item>
                                        </Space>
                                    </Col>
                                </Row>
                            </Card>
                        </PermissionChecker>
                    )}

                </Col>
            </Row>
        </Form>
    );
};

export default ProfileTab;
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, message, Radio, Row, Select, Space, Spin, Switch } from 'antd';
import PermissionChecker from 'layouts/PermissionChecker';
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from 'Context/MyContextProvider';
import { Key } from 'lucide-react';
import { mapApiToForm, mapFormToApi } from './dataMappers';
import axios from 'axios';
import { updateUser } from 'store/slices/authSlice';
import Flex from 'components/shared-components/Flex';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ORGANIZER_ALLOWED_ROLES } from '../constants';
import { RoleSelect } from 'utils/CommonInputs';

const ProfileTab = ({ mode, handleSubmit, id = null, setSelectedRole }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { OrganizerList, userRole, UserData, api, authToken } = useMyContext();
    const [form] = Form.useForm();
    const location = useLocation();
    const editOtherUser =
        ['Admin', 'Organizer'].includes(userRole) || id == UserData.id;

    //   if(editOtherUser ===false){
    //     navigate('/forbidden')
    //   }
    // Main form state
    const [formState, setFormState] = useState({
        // Basic info
        name: '',
        email: '',
        number: '',
        roleId: null,
        roleName: '',
        reportingUser: '',
        status: 'Active',

        // Role-specific fields
        agreementStatus: false,
        organisation: '',
        agentDiscount: false,
        qrLength: '',
        paymentMethod: 'Cash',

        // Event management
        events: [],
        tickets: [],
        gates: [],

        // Address
        city: '',
        pincode: '',

        // Banking (Admin + Organizer)
        bankName: '',
        bankIfsc: '',
        bankBranch: '',
        bankNumber: '',
        orgGstNumber: '',

        // Security
        password: '',
        repeatPassword: '',
        authentication: false,

        // Add these new fields
        convenienceFeeType: 'percentage',
        convenienceFee: '',
    });

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [convenienceFeeType, setConvenienceFeeType] = useState('percentage');

    // Track if form has been initialized
    const didInit = useRef(false);
    const isInitializing = useRef(false);

    // Fetch user data in edit mode
    const { data: fetchedData, isLoading: loading } = useQuery({
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

    const updateMultipleFields = useCallback((updates) => {
        setFormState(prev => ({ ...prev, ...updates }));
        form.setFieldsValue(updates);
    }, [form]);
    // Calculate conditions based on current state
    const showAM = ['POS', 'Agent', 'Scanner', 'Sponsor'].includes(formState.roleName);
    const needsEvents = ['Agent', 'Sponsor', 'Accreditation', 'Scanner'].includes(formState.roleName);

    // Stabilize reportingUserId
    const reportingUserId = useMemo(() => {
        // ✅ For Organizer, always use their own ID
        if (userRole === 'Organizer') {
            return UserData?.id;
        }

        // ✅ For Admin/others, use the selected reporting user
        return formState.reportingUser || undefined;
    }, [userRole, UserData?.id, formState.reportingUser]);

    // Fetch roles
    const { data: roles = [] } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get(`role-list`);
            return (res?.role || []).slice().reverse();
        },
        staleTime: 5 * 60 * 1000,
    });

    // Filter roles based on user permissions
    const filteredRoles = useMemo(() => {
        if (userRole === 'Admin') {
            // Admin can see all roles
            return roles;
        } else if (userRole === 'Organizer') {
            // Organizer can only see specific roles
            return roles.filter(role => ORGANIZER_ALLOWED_ROLES.includes(role.name));
        }
        return [];
    }, [roles, userRole]);

    // Track initial reporting user to detect changes
    const initialReportingUser = useRef(null);

    // FIXED: Set initial reporting user and handle query params separately
    useEffect(() => {
        if (mode === 'edit' && fetchedData?.user && initialReportingUser.current === null) {
            initialReportingUser.current = fetchedData?.user?.reporting_user_id?.toString();
        }
    }, [mode, fetchedData?.user]);

    // FIXED: Handle query params in separate effect for create mode
    useEffect(() => {
        if (mode === 'create' && filteredRoles.length > 0) {
            // ✅ Define typeParam properly
            const queryParams = new URLSearchParams(location.search);
            const typeParam = queryParams.get('type');

            if (typeParam) {
                const roleName = typeParam.replace(/-/g, ' ');

                // ✅ Find role by name
                const matchedRole = filteredRoles.find(
                    (role) => role.name.toLowerCase() === roleName.toLowerCase()
                );

                if (matchedRole) {
                    // ✅ This automatically updates both formState and AntD form
                    updateMultipleFields({
                        roleName: matchedRole.name,
                        roleId: matchedRole.id,
                    });
                }
            }
        }
    }, [mode, location.search, filteredRoles, updateMultipleFields]);


    // Check if reporting user has changed from initial value
    const hasReportingUserChanged = useMemo(() => {
        if (mode === 'create') return true;
        if (!initialReportingUser.current) return false;
        return String(reportingUserId) !== String(initialReportingUser.current);
    }, [mode, reportingUserId]);

    // Get events from edit-user response (for edit mode, unchanged org)
    const eventsFromEditResponse = useMemo(() => {
        if (mode !== 'edit' || !fetchedData?.user?.events) return [];

        return fetchedData.user.events.map(event => ({
            value: event.id,
            label: event.name,
            tickets: event.tickets || [],
        }));
    }, [mode, fetchedData?.user?.events]);


    // ✅ SIMPLIFIED: Fetch events only when we have a valid reporting user
    const shouldFetchEvents = useMemo(() => {
        // Don't fetch if role doesn't need events
        if (!needsEvents) return false;

        // ✅ Fetch if reporting user exists (works for both create and edit)
        return Boolean(reportingUserId) &&
            reportingUserId !== 'undefined' &&
            reportingUserId !== null;
    }, [needsEvents, reportingUserId]);

    // Fetch events
    const { data: fetchedEvents = [], isLoading: eventsLoading, isFetching: eventsFetching } = useQuery({
        queryKey: ["org-events", reportingUserId],
        enabled: shouldFetchEvents,
        queryFn: async () => {
            // ✅ Double-check before making API call
            if (!reportingUserId || reportingUserId === 'undefined') {
                throw new Error('Invalid reporting user ID');
            }

            const res = await apiClient.get(`org-event/${reportingUserId}`);
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.events) ? res.events : [];
            return list.map(event => ({
                value: event.id,
                label: event.name,
                tickets: event.tickets || [],
            }));
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    // Use all available events for options/ticket derivation: prefer fetchedEvents, fallback to edit response
    const allEvents = useMemo(() => {
        return (fetchedEvents && fetchedEvents.length) ? fetchedEvents : eventsFromEditResponse;
    }, [fetchedEvents, eventsFromEditResponse]);

    // Generate ticket options - only when events are stable
    const ticketOptions = useMemo(() => {
        if (eventsLoading || !allEvents.length || !formState.events?.length) {
            return [];
        }

        const selectedEventObjects = allEvents.filter(e => formState.events.includes(e.value));
        return selectedEventObjects.map(event => ({
            label: event.label,
            options: (event.tickets || []).map(ticket => ({
                value: String(ticket.id || ticket.value),
                label: ticket.name || ticket.label,
                eventId: event.value,
            })),
        }));
    }, [allEvents, formState.events, eventsLoading]);

    // Initialize form with fetched data
    useEffect(() => {
        if (mode === 'edit' && fetchedData?.user && !didInit.current && !isInitializing.current) {
            isInitializing.current = true;
            const formData = mapApiToForm(fetchedData.user);

            setFormState(prevState => ({ ...prevState, ...formData }));

            // Set convenience fee type state
            if (formData.convenienceFeeType) {
                setConvenienceFeeType(formData.convenienceFeeType);
            }

            // Also set form fields for Ant Design Form
            form.setFieldsValue(formData);

            didInit.current = true;
            isInitializing.current = false;

            if (setSelectedRole && formData.roleName) {
                setSelectedRole(formData.roleName);
            }
        }
    }, [mode, fetchedData?.user, form, setSelectedRole]);

    // Sync form state with Ant Design Form
    const handleFormChange = useCallback((changedFields, allFields) => {
        const changes = {};
        changedFields.forEach(field => {
            changes[field.name[0]] = field.value;
        });

        setFormState(prev => ({ ...prev, ...changes }));
    }, []);

    // State update handlers
    const updateField = useCallback((field, value) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        form.setFieldsValue({ [field]: value });
    }, [form]);



    // Handle role change
    const handleRoleChange = useCallback((value) => {
        const selectedRole = filteredRoles.find(r => r.id === Number(value));
        const nextName = selectedRole?.name;

        const updates = { roleId: value };
        if (formState.roleName !== nextName) {
            updates.roleName = nextName;
        }

        // Clear event-related fields when role changes
        const hasAny = formState.events?.length || formState.tickets?.length || formState.gates?.length;
        if (hasAny) {
            updates.events = [];
            updates.tickets = [];
            updates.gates = [];
        }

        updateMultipleFields(updates);
        if (setSelectedRole && nextName) {
            setSelectedRole(nextName);
        }
    }, [filteredRoles, formState.roleName, formState.events, formState.tickets, formState.gates, updateMultipleFields]);

    // Handle event change with proper guards
    const handleEventChange = useCallback((selectedValues = []) => {
        if (eventsLoading || eventsFetching || !allEvents.length || isInitializing.current) {
            return;
        }

        const updates = { events: selectedValues };

        // Clear tickets if no events selected
        if (selectedValues.length === 0) {
            if (formState.tickets.length) {
                updates.tickets = [];
            }
        } else {
            // Build set of valid ticket IDs from selected events
            const validIds = new Set(
                allEvents
                    .filter(e => selectedValues.includes(e.value))
                    .flatMap(e => (e.tickets || []).map(t => String(t.id || t.value)))
            );

            // Filter current tickets to only keep valid ones
            const nextTickets = formState.tickets.filter(id => validIds.has(String(id)));

            // Only update if there's an actual change
            const changed =
                nextTickets.length !== formState.tickets.length ||
                nextTickets.some((v, i) => v !== formState.tickets[i]);

            if (changed) {
                updates.tickets = nextTickets;
            }
        }

        updateMultipleFields(updates);
    }, [allEvents, formState.tickets, eventsLoading, eventsFetching, updateMultipleFields]);

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


    // Form submit handler
    const onFinish = async (values) => {
        setIsSubmitting(true);
        try {
            const mergedValues = {
                ...values,
                roleId: values.roleId ?? formState.roleId,
                roleName: values.roleName ?? formState.roleName,
                convenienceFeeType: values.convenienceFeeType ?? formState.convenienceFeeType,
                convenienceFee: values.convenienceFee ?? formState.convenienceFee,
                reportingUser: reportingUserId,
            };
            const apiData = mapFormToApi(mergedValues);
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
                message.success(`User ${mode === "create" ? "created" : "updated"}`);

                if (mode === "create") {
                    navigate(-1);
                }
            }
        } catch (error) {
            message.error(`Error: ${error.response?.data?.error || error.response?.data?.message || 'Something went wrong!'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate conditions for UI
    const showRoleGate = mode === "create" && !formState.roleId;

    if (loading) {
        return <Spin className='w-100 text-center mt-5' />
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFieldsChange={handleFormChange}
            initialValues={{
                status: 'Active',
                paymentMethod: 'Cash',
                authentication: false,
                agreementStatus: false,
                agentDiscount: false,
                convenienceFeeType: 'percentage',
                convenienceFee: ''
            }}
        >
            <Row gutter={[16, 16]}>
                {/* Ensure roleId is always registered on the form */}
                <Form.Item name="roleId" hidden>
                    <Input />
                </Form.Item>
                {/* Left Column */}
                <Col xs={24} lg={12}>
                    {/* Role Selection (Admin/Organizer only) */}
                    <PermissionChecker role={['Admin']}>
                        <Card title="Select User Role" extra={
                            <Flex justifyContent="end">
                                <Button className="mr-2" onClick={() => navigate(-1)}>
                                    Discard
                                </Button>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    {mode === "create" ? "Create" : "Update"}
                                </Button>
                            </Flex>
                        } style={{ marginBottom: 16 }}>
                            <RoleSelect
                                onChange={handleRoleChange}
                                required={true}
                                showAlert={true}
                            />

                            {/* Show info message for Organizers */}
                            {userRole === 'Organizer' && (
                                <Alert
                                    message="Role Restriction"
                                    description="As an Organizer, you can only create users with specific roles: POS, Agent, Scanner, Shop Keeper, Box Office Manager, Sponsor, and Accreditation."
                                    type="info"
                                    showIcon
                                    style={{ marginTop: 16 }}
                                />
                            )}
                        </Card>
                    </PermissionChecker>

                    {/* Basic Information */}
                    <Card title="Basic Information" extra={
                        editOtherUser &&
                        <PermissionChecker permission={["Edit User", "Edit Profile"]}>
                            <Flex justifyContent="end">
                                <Button className="mr-2" onClick={() => navigate(-1)}>
                                    Discard
                                </Button>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    {mode === "create" ? "Create" : "Update"}
                                </Button>
                            </Flex>
                        </PermissionChecker>
                    }>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter name' }]}
                                >
                                    <Input placeholder="Enter name" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
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

                            <Col xs={24} md={8}>
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

                            {formState.roleName === 'Organizer' && (
                                <>


                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Organisation"
                                            name="organisation"
                                            required={true}
                                        >
                                            <Input placeholder="Enter organisation" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Brand Name"
                                            name="brandName"
                                            required={true}
                                        >
                                            <Input placeholder="Enter brand name" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="GST Number" name="orgGstNumber">
                                            <Input placeholder="GST Number" />
                                        </Form.Item>
                                    </Col>

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
                                    {
                                        userRole === 'Admin' && formState.roleName === 'Organizer' && (

                                            <Col xs={24} md={12}>
                                                <Form.Item label="Convenience Fee" required={false}>
                                                    <Space.Compact className='w-100 mb-2'>
                                                        <Form.Item name="convenienceFeeType" noStyle>
                                                            <Select
                                                                style={{ width: 180 }}
                                                                aria-label="Select fee type"
                                                                onChange={(val) => setConvenienceFeeType(val)}
                                                            >
                                                                <Select.Option value="fixed">Fixed</Select.Option>
                                                                <Select.Option value="percentage">Percentage</Select.Option>
                                                            </Select>
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="convenienceFee"
                                                            noStyle
                                                            dependencies={["convenienceFeeType"]}
                                                            rules={[
                                                                ({ getFieldValue }) => ({
                                                                    validator(_, value) {
                                                                        if (value === undefined || value === null || value === '') {
                                                                            return Promise.resolve();
                                                                        }
                                                                        const num = Number(value);
                                                                        if (Number.isNaN(num)) {
                                                                            return Promise.reject(new Error('Enter a valid number'));
                                                                        }
                                                                        if (num < 0) {
                                                                            return Promise.reject(new Error('Value cannot be negative'));
                                                                        }
                                                                        const type = getFieldValue('convenienceFeeType') || convenienceFeeType;
                                                                        if (type === 'percentage' && num > 100) {
                                                                            return Promise.reject(new Error('Percentage cannot exceed 100'));
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                })
                                                            ]}
                                                        >
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                step="0.01"
                                                                placeholder={convenienceFeeType === 'percentage' ? '0 - 100' : 'Amount'}
                                                                aria-label="Convenience fee value"
                                                            />
                                                        </Form.Item>
                                                    </Space.Compact>
                                                </Form.Item>
                                            </Col>
                                        )
                                    }
                                </>
                            )}




                            {/* Conditional Fields based on Role */}


                            {/* Account Manager for specific roles */}
                            {showAM && userRole === 'Admin' && (
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
                                                mode={formState.roleName !== 'Scanner' && "multiple"}
                                                placeholder="Select events"
                                                options={fetchedEvents}
                                                onChange={handleEventChange}
                                                optionFilterProp="label"
                                                showSearch
                                                loading={eventsLoading || eventsFetching}
                                                disabled={!reportingUserId}
                                                notFoundContent={
                                                    eventsLoading ? <Spin size="small" /> :
                                                        !reportingUserId ? 'Please select an account manager first' :
                                                            'No events found'
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    {formState.roleName !== 'Scanner' &&
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Assign Tickets"
                                                name="tickets"
                                                dependencies={['events']}
                                            >
                                                <Select
                                                    mode="multiple"
                                                    placeholder="Select tickets"
                                                    disabled={!formState.events?.length}
                                                    showSearch
                                                    options={ticketOptions}
                                                    optionFilterProp="label"
                                                    notFoundContent={
                                                        !formState.events?.length ? 'Please select events first' :
                                                            'No tickets available for selected events'
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    }
                                </>
                            )}

                            {/* Agent Discount */}
                            {formState.roleName === 'Agent' && (
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
                            {formState.roleName === 'Scanner' && (
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="QR Data Length"
                                        name="qrLength"
                                        rules={[
                                            { required: true, message: 'Please enter QR length' },
                                            {
                                                validator(_, value) {
                                                    if (value === undefined || value === null || value === '') {
                                                        return Promise.resolve();
                                                    }
                                                    const n = Number(value);
                                                    if (!Number.isInteger(n)) {
                                                        return Promise.reject(new Error('Must be an integer'));
                                                    }
                                                    if (n < 6 || n > 20) {
                                                        return Promise.reject(new Error('Must be between 6 and 20'));
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <Input type="number" min={6} max={20} placeholder="6-20" />
                                    </Form.Item>
                                </Col>
                            )}

                        </Row>
                    </Card>
                </Col>

                {/* Right Column */}
                <Col xs={24} lg={12}>
                    {/* Payment Method */}
                    {(formState.roleName === 'POS' || formState.roleName === 'Corporate') && (
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
                    {userRole === 'Admin' && formState.roleName === 'Organizer' && (
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

                    {/* Status & Security */}
                    {!showRoleGate && (
                        <PermissionChecker role={['Admin', 'Organizer']}>
                            <Card title="Status & Security" extra={
                                editOtherUser &&
                                <PermissionChecker permission={["Edit User", "Edit Profile"]}>
                                    <Flex justifyContent="end">
                                        <Button className="mr-2" onClick={() => navigate(-1)}>
                                            Discard
                                        </Button>

                                        <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                            {mode === "create" ? "Create" : "Update"}
                                        </Button>
                                    </Flex>
                                </PermissionChecker>
                            }>
                                <Row gutter={[16, 16]}>
                                    {/* Password Fields */}
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Password"
                                            name="password"
                                            rules={[
                                                { required: mode === 'create', message: 'Please enter password' },
                                                ...(mode === 'create' ? [{ min: 6, message: 'Min 6 characters' }] : [])
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<Key className="text-primary" size={16} />}
                                                placeholder="Enter password"
                                            />
                                        </Form.Item>
                                    </Col>
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
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="User Status"
                                            name="status"
                                            valuePropName="checked"
                                            getValueFromEvent={(checked) => (checked ? 1 : 0)}
                                        >
                                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Space size="large">
                                            <Form.Item
                                                label="Authentication"
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
                                                                    ? "Password login is currently active"
                                                                    : "OTP (One-Time Password) login is currently active"
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
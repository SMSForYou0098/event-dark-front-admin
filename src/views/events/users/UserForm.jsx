import React, { memo, Fragment, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    Row,
    Col,
    Form,
    Button,
    Card,
    Input,
    Select,
    Switch,
    Radio,
    Spin,
    notification
} from "antd";
import {
    ArrowLeftOutlined,
} from '@ant-design/icons';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";
import { useDispatch } from "react-redux";
import { useMyContext } from "Context/MyContextProvider";
import { updateUser } from "store/slices/authSlice";
import { Key } from "lucide-react";
import usePermission from "utils/hooks/usePermission";
import PermissionChecker from "layouts/PermissionChecker";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import Flex from "components/shared-components/Flex";

const { Option } = Select;

const UserForm = memo(({ mode = "edit" }) => {
    const {
        api,
        authToken,
        userRole,
        UserData,
        UserList,
        OrganizerList,
        HandleBack,
        UserPermissions
    } = useMyContext();
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { id } = useParams();
    const location = useLocation();
    const [form] = Form.useForm();

    // Single form state object
    const [formState, setFormState] = useState({
        // Basic Info
        name: '',
        email: '',
        password: '',
        repeatPassword: '',
        number: '',
        organisation: '',
        altNumber: '',
        pincode: '',
        state: '',
        city: '',

        // Role & Status
        roleId: '',
        roleName: '',
        reportingUser: null,
        userType: '',
        status: 'Active',

        // Banking
        bankName: '',
        bankNumber: '',
        bankIfsc: '',
        bankBranch: '',
        bankMicr: '',

        // Shop
        shopName: '',
        shopNumber: '',
        gstNumber: '',
        orgGstNumber: '',

        // Settings
        qrLength: '',
        auth: false,
        agentDiscount: false,
        agreementStatus: false,
        paymentMethod: 'Cash',
        enablePasswordAuth: false,

        // Agreement
        aggrementDetails: {
            org_office_address: "",
            org_name_signatory: "",
            pan_no: "",
            account_holder: "",
            org_type_of_company: "",
            org_signature_type: ""
        }
    });

    // Other states
    const [roles, setRoles] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [loading] = useState(false);
    const [gates] = useState([]);
    const [selectedGates, setSelectedGates] = useState([]);
    const [ticketGroup, setTicketGroup] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [disableOrg, setDisableOrg] = useState(false);
    const [disable, setDisable] = useState(false);
    const [showAM, setShowAM] = useState(false);

    // Update form state helper
    const updateFormState = (updates) => {
        setFormState(prev => ({
            ...prev,
            ...updates
        }));
    };

    // Conditional validator helper for antd Form
    const requiredIf = (condition, message) => ({
        validator(_, value) {
            if (!condition) return Promise.resolve();
            const hasValue = Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';
            return hasValue ? Promise.resolve() : Promise.reject(new Error(message));
        }
    });

    // Fetch roles
    const { data: rolesData } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get(`role-list`);
            return (res?.role || []).slice().reverse();
        },
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (Array.isArray(rolesData)) {
            setRoles(rolesData);
        }
    }, [rolesData]);

    // Mode-specific initialization
    useEffect(() => {
        if (mode === "create") {
            const queryParams = new URLSearchParams(location.search);
            const typeParam = queryParams.get('type');
            updateFormState({ userType: typeParam?.replace(/-/g, ' ') });

            if (userRole === 'Organizer') {
                updateFormState({
                    reportingUser: { value: UserData?.id, label: UserData?.name || UserData?.id },
                    organisation: UserData?.organisation
                });
                setDisableOrg(true);
            }
        }
    }, [mode, location.search, userRole, UserData]);

    // Fetch user data in edit mode
    const { data: userData, isLoading: userLoading } = useQuery({
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

    // Handle edit mode data initialization
    useEffect(() => {
        if (mode === "edit" && userData?.user) {
            const data = userData.user;

            // Set reporting user properly
            let reportingUserObj = null;
            if (data.reporting_user_id && UserList) {
                reportingUserObj = UserList.find((item) => item?.value === data.reporting_user_id);
            }

            // Map events properly
            const mappedEvents = data?.events?.map(event => ({
                value: event.id,
                label: event.name,
                tickets: event?.tickets || []
            })) || [];

            // Map tickets properly
            const mappedTickets = data?.agentTicket || [];

            const formUpdates = {
                name: data.name,
                email: data.email,
                password: data.password,
                number: data.phone_number,
                paymentMethod: data?.payment_method || 'Cash',
                organisation: data?.organisation,
                altNumber: data?.alt_number,
                pincode: data?.pincode,
                authentication: data?.authentication === 1,
                state: data?.state,
                city: data?.city,
                qrLength: data.qrLength,
                bankName: data.bank_name,
                bankNumber: data.bank_number,
                bankIfsc: data.bank_ifsc,
                bankBranch: data.bank_branch,
                status: data.status === 1 ? 'Active' : 'Deative',
                bankMicr: data.bank_micr,
                orgGstNumber: data.org_gst_no || "",
                roleName: data?.role?.name,
                roleId: data?.role?.id,
                shopName: data?.shop?.shop_name || '',
                shopNumber: data?.shop?.shop_no || '',
                gstNumber: data?.shop?.gst_no || '',
                agreementStatus: data?.agreement_status,
                agentDiscount: data?.agent_disc === 1,
                reportingUser: reportingUserObj,
                aggrementDetails: {
                    org_office_address: data.org_office_address || "",
                    org_name_signatory: data?.org_name_signatory || "",
                    pan_no: data?.pan_no,
                    account_holder: data?.account_holder || "",
                    org_type_of_company: data?.org_type_of_company || "",
                    org_signature_type: data?.org_signature_type || ""
                }
            };

            updateFormState(formUpdates);
            setSelectedEvents(mappedEvents);
            setSelectedTickets(mappedTickets);

            // Update the antd form instance
            form.setFieldsValue({
                ...formUpdates,
                events: mappedEvents,
                tickets: mappedTickets
            });

            // Set roles if available
            if (userData?.roles) {
                setRoles(userData.roles);
            }

            // Fetch reporting user role if needed
            if (data.reporting_user_id) {
                fetchUserRole(data.reporting_user_id);
            }
        }
    }, [mode, userData, UserList]);

    // Auto-select role in create mode
    useEffect(() => {
        if (mode === "create" && formState.userType && roles?.length) {
            const matchedRole = roles.find((r) => r?.name === formState.userType);
            if (matchedRole && matchedRole.id !== formState.roleId) {
                updateFormState({ roleId: matchedRole.id, roleName: matchedRole.name });
            }
        }
    }, [mode, formState.userType, roles, formState.roleId]);

    // Fetch events when needed
    const needsEvents = formState.roleName === 'Agent' || formState.roleName === 'Sponsor' || formState.roleName === 'Accreditation';
    const reportingUserId = mode === "create"
        ? (userRole === 'Organizer' ? UserData?.id : formState.reportingUser?.value)
        : (formState.reportingUser?.value || formState.reportingUser?.key);

    const { data: eventsData } = useQuery({
        queryKey: ["org-events", reportingUserId],
        enabled: Boolean(needsEvents && reportingUserId),
        queryFn: async () => {
            const res = await apiClient.get(`org-event/${reportingUserId}`);
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.events) ? res.events : [];
            return list.map(event => ({ value: event.id, label: event.name, tickets: event.tickets || [] }));
        },
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (Array.isArray(eventsData)) {
            setEvents(eventsData);
        }
    }, [eventsData]);

    // Generate ticket groups when selected events change
    useEffect(() => {
        if (selectedEvents && selectedEvents.length > 0) {
            const groupedEventTicketOptions = selectedEvents.map(event => ({
                label: event?.label,
                value: event?.value,
                options: event?.tickets?.map(ticket => ({
                    value: ticket?.id,
                    label: ticket?.name,
                    eventId: event?.value
                })) || []
            }));
            setTicketGroup(groupedEventTicketOptions);
        } else {
            setTicketGroup([]);
        }
    }, [selectedEvents]);

    // Unified function to fetch user role data
    const fetchUserRole = async (reportingId) => {
        if (!reportingId) return;

        try {
            const res = await apiClient.get(`edit-user/${reportingId}`);
            if (res?.status) {
                const data = res?.user;

                // Map events if they exist
                if (data.events && data.events.length > 0) {
                    const eventOptions = data.events.map(event => ({
                        value: event.id,
                        label: event.name,
                        tickets: event.tickets || []
                    }));
                    setSelectedEvents(eventOptions);
                }

                // Update organisation if user is Organizer
                if (data?.role?.name === 'Organizer') {
                    updateFormState({
                        organisation: data?.organisation || formState.organisation
                    });
                    setDisable(true);
                } else {
                    setDisable(false);
                }
            }
        } catch (error) {
            notification.error({
                message: "Error",
                description:
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Something went wrong!",
            });
        }
    };

    // Custom filter for tickets search
    const customTicketFilter = (input, option) => {
        const searchTerm = input.toLowerCase().trim();
        if (!searchTerm) return true;

        // If searching within an option group item
        if (option?.label) {
            return option.label.toLowerCase().includes(searchTerm);
        }

        // If searching the group label itself
        return false;
    };

    // Handle event selection change
    const handleEventChange = (selectedValues) => {
        // Map selected values to full event objects with tickets
        const selectedEventObjects = selectedValues.map(value =>
            events.find(e => e.value === value)
        ).filter(Boolean);

        setSelectedEvents(selectedEventObjects);

        // Filter out tickets that no longer belong to selected events
        const validEventIds = selectedEventObjects.map(e => e.value);
        const filteredTickets = selectedTickets.filter(ticket =>
            validEventIds.includes(ticket.eventId)
        );

        if (filteredTickets.length !== selectedTickets.length) {
            setSelectedTickets(filteredTickets);
            form.setFieldValue('tickets', filteredTickets.map(t => t.value));
        }
    };

    // Handle ticket selection change
    const handleTicketChange = (selectedValues) => {
        // Map selected values to full ticket objects from ticketGroup
        const selectedTicketObjects = [];
        ticketGroup.forEach(eventGroup => {
            eventGroup.options.forEach(ticket => {
                if (selectedValues.includes(ticket.value)) {
                    selectedTicketObjects.push(ticket);
                }
            });
        });

        setSelectedTickets(selectedTicketObjects);
    };

    // Handle gate selection change
    const handleGateChange = (selectedValues) => {
        // Map selected values to full gate objects
        const selectedGateObjects = selectedValues.map(value =>
            gates.find(g => g.value === value)
        ).filter(Boolean);

        setSelectedGates(selectedGateObjects);
    };

    // Handle role change
    const handleRoleChange = async (value) => {
        const roleName = roles?.find((data) => data?.id === parseInt(value))?.name;

        updateFormState({
            roleId: value,
            roleName: roleName
        });

        const rolesToDisable = ['POS', 'Agent', 'Scanner'];
        setShowAM(rolesToDisable?.includes(roleName));
    };

    // Handle reporting user change
    const handleReportingUserChange = (value, option) => {
        const user = { value: value, label: option?.label, organisation: option?.organisation };
        if (showAM) {
            updateFormState({ organisation: user?.organisation });
        }
        updateFormState({ reportingUser: user });
        if (user?.value && user?.value !== formState?.id && user?.value !== id) {
            fetchUserRole(user.value);
        }
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        const userData = {
            name: formState.name,
            email: formState.email,
            number: formState.number,
            password: formState.password,
            organisation: formState.organisation,
            authentication: formState.authentication,
            alt_number: formState.altNumber,
            pincode: formState.pincode,
            state: formState.state,
            city: formState.city,
            role_name: formState.roleName,
            bank_name: formState.bankName,
            qr_length: formState.qrLength,
            reporting_user: formState.reportingUser?.value,
            bank_number: formState.bankNumber,
            role_id: formState.roleId,
            bank_ifsc: formState.bankIfsc,
            bank_branch: formState.bankBranch,
            bank_micr: formState.bankMicr,
            shop_name: formState.shopName,
            shop_no: formState.shopNumber,
            gst_no: formState.gstNumber,
            status: formState.status === 'Active' ? 1 : 0,
            agent_disc: formState.agentDiscount ? 1 : 0,
            events: (formState.roleName === 'Agent' || formState.roleName === 'Sponsor' || formState.roleName === 'Accreditation')
                ? selectedEvents.map(event => event.value)
                : [],
            tickets: selectedTickets,
            gates: formState.roleName === 'Scanner'
                ? selectedGates.map(gate => gate.value)
                : [],
            agreement_status: formState.agreementStatus,
            payment_method: formState.paymentMethod,
            org_gst_no: formState.orgGstNumber,
            account_holder: formState.aggrementDetails?.account_holder,
            pan_no: formState.aggrementDetails?.pan_no,
            org_name_signatory: formState.aggrementDetails?.org_name_signatory,
            org_office_address: formState.aggrementDetails?.org_office_address,
            org_type_of_company: formState.aggrementDetails?.org_type_of_company,
            org_signature_type: formState.aggrementDetails?.org_signature_type,
        };

        try {
            const url = mode === "create" ? `${api}create-user` : `${api}update-user/${id}`;
            const response = await axios.post(url, userData, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });

            if (response.data?.status) {
                if (id == UserData?.id) {
                    dispatch(updateUser(response.data.user));
                    HandleBack();
                }
                notification.success({
                    message: `User ${mode === "create" ? "created" : "updated"}`,
                    description: response.data.message,
                });

                if (mode === "create") {
                    HandleBack();
                }
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: error.response?.data?.error || error.response?.data?.message || 'Something went wrong!',
            });

        }
    };

    // Event handlers for form fields
    const handleInputChange = (field, value) => {
        updateFormState({ [field]: value });
    };

    const handlePaymentMethodChange = (e) => {
        updateFormState({ paymentMethod: e.target.value });
    };

    // Role-first gating for create mode: show role selector before other fields
    const showRoleGate = mode === "create" && !formState.roleId;

    if (userLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Fragment>
            <Form
                layout="vertical"
                form={form}
                name="user_form"
                className="ant-advanced-search-form"
                onFinish={handleSubmit}
                initialValues={formState}
            >
                <div className="container"z>
                    <Row gutter={[16, 16]}>
                        {/* Left Column - Basic Info */}
                        <Col xs={24} lg={12}>
                            <PermissionChecker role={['Admin', 'Organizer']}>
                                <Card title="Select User Role">
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="User Role"
                                                name="roleId"
                                                rules={[{ required: true, message: 'Please select role' }]}
                                            >
                                                <Select
                                                    placeholder="Select role"
                                                    value={formState.roleId}
                                                    onChange={handleRoleChange}
                                                >
                                                    {roles?.map((item) => (
                                                        <Option key={item.id} value={item.id}>
                                                            {item.name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            </PermissionChecker>

                            <Card title="Basic Information">
                                <Row gutter={[16]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Name"
                                            name="name"
                                            rules={[{ required: true, message: 'Please enter name' }]}
                                        >
                                            <Input
                                                placeholder="Enter name"
                                                value={formState.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                            />
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
                                            <Input
                                                placeholder="Enter email"
                                                value={formState.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Mobile Number"
                                            name="number"
                                            rules={[
                                                { required: true, message: 'Please enter mobile number' },
                                                { pattern: /^\d{10,12}$/, message: 'Mobile number must be 10-12 digits' }
                                            ]}
                                        >
                                            <Input
                                                placeholder="Enter mobile number"
                                                value={formState.number}
                                                onChange={(e) => handleInputChange('number', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>

                                    {formState.roleName === 'Organizer' && (
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Agreement Status"
                                                name="agreementStatus"
                                                valuePropName="checked"
                                            >
                                                <Switch
                                                    checked={formState.agreementStatus}
                                                    onChange={(checked) => handleInputChange('agreementStatus', checked)}
                                                    checkedChildren="Active"
                                                    unCheckedChildren="Inactive"
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}

                                    <>
                                        <PermissionChecker role={['Admin', 'Organizer']}>
                                            {
                                                formState.roleName === 'Organizer' && (

                                                    <Col xs={24} md={12}>
                                                        <Form.Item
                                                            label="Organisation"
                                                            name="organisation"
                                                        >
                                                            <Input
                                                                placeholder="Enter organisation"
                                                                disabled={disableOrg || disable}
                                                                value={formState.organisation}
                                                                onChange={(e) => handleInputChange('organisation', e.target.value)}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                )
                                            }

                                            {!disableOrg && (formState.roleName === 'Agent' || formState.roleName === 'POS' || formState.roleName === 'Sponsor' || formState.roleName === 'Corporate') && (
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Account Manager"
                                                        name="reportingUser"
                                                        rules={[requiredIf(showAM && !disableOrg, 'Please select account manager')]}
                                                    >
                                                        <Select
                                                            placeholder="Select account manager"
                                                            options={OrganizerList}
                                                            value={formState.reportingUser}
                                                            onChange={handleReportingUserChange}
                                                            optionFilterProp="label"
                                                            showSearch
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            )}

                                            {/* Role-specific fields */}
                                            {formState.roleName === 'Scanner' && (
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Event Gates"
                                                        name="gates"
                                                    >
                                                        <Select
                                                            mode="multiple"
                                                            placeholder="Select gates"
                                                            options={gates}
                                                            value={selectedGates.map(g => g.value)}
                                                            onChange={handleGateChange}
                                                            optionFilterProp="label"
                                                            showSearch
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            )}

                                            {(formState.roleName === 'Agent' || formState.roleName === 'Sponsor' || formState.roleName === 'Accreditation') && (
                                                <>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item
                                                            label="Assign Events"
                                                            name="events"
                                                            rules={[{
                                                                validator: () => {
                                                                    const needs = ['Agent', 'Sponsor', 'Accreditation'].includes(formState.roleName);
                                                                    return needs && selectedEvents.length === 0
                                                                        ? Promise.reject(new Error('Please select at least one event'))
                                                                        : Promise.resolve();
                                                                }
                                                            }]}
                                                        >
                                                            <Select
                                                                mode="multiple"
                                                                placeholder="Select events"
                                                                options={events}
                                                                value={selectedEvents.map(e => e.value)}
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
                                                        >
                                                            <Select
                                                                mode="multiple"
                                                                placeholder="Select tickets"
                                                                value={selectedTickets.map(t => t.value)}
                                                                onChange={handleTicketChange}
                                                                filterOption={customTicketFilter}
                                                                showSearch
                                                                disabled={selectedEvents.length === 0}
                                                            >
                                                                {ticketGroup.map(eventGroup => (
                                                                    <Select.OptGroup
                                                                        key={eventGroup.value}
                                                                        label={eventGroup.label}
                                                                    >
                                                                        {eventGroup.options.map(ticket => (
                                                                            <Option
                                                                                key={ticket.value}
                                                                                value={ticket.value}
                                                                                label={ticket.label}
                                                                            >
                                                                                {ticket.label}
                                                                            </Option>
                                                                        ))}
                                                                    </Select.OptGroup>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>
                                                    {
                                                        formState.roleName === 'Agent' && (

                                                            <Col xs={24} md={12}>
                                                                <Form.Item label="Agent Discount">
                                                                    <Switch
                                                                        checked={formState.agentDiscount}
                                                                        onChange={(checked) => handleInputChange('agentDiscount', checked)}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                        )
                                                    }
                                                </>
                                            )}


                                            {/* Password field */}
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    label="Password"
                                                    name="password"
                                                    rules={[
                                                        requiredIf(mode === 'create', 'Please enter password'),
                                                        ...(mode === 'create'
                                                            ? [{ min: 6, message: 'Password must be at least 6 characters' }]
                                                            : [])
                                                    ]}
                                                >
                                                    <Input.Password
                                                        prefix={<Key className="text-primary" size={16} />}
                                                        size="large"
                                                        placeholder="Enter your password"
                                                        value={formState.password}
                                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                                        autoFocus
                                                        disabled={loading}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            {/* Confirm Password field (only in create mode) */}
                                            {mode === 'create' && (
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Confirm Password"
                                                        name="repeatPassword"
                                                        dependencies={["password"]}
                                                        rules={[
                                                            requiredIf(true, 'Please confirm password'),
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
                                                        <Input.Password
                                                            size="large"
                                                            placeholder="Re-enter your password"
                                                            value={formState.repeatPassword}
                                                            onChange={(e) => handleInputChange('repeatPassword', e.target.value)}
                                                            disabled={loading}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            )}
                                        </PermissionChecker>


                                        {formState.roleName === 'Scanner' && !disableOrg && (
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    label="QR Data Length"
                                                    name="qrLength"
                                                    rules={[
                                                        requiredIf(true, 'Please enter QR length'),
                                                        {
                                                            validator: (_, value) => {
                                                                if (value === undefined || value === null || value === '') return Promise.reject(new Error('Please enter QR length'));
                                                                const num = Number(value);
                                                                if (Number.isNaN(num)) return Promise.reject(new Error('QR length must be a number'));
                                                                if (num < 6 || num > 20) return Promise.reject(new Error('QR length must be between 6 and 20'));
                                                                return Promise.resolve();
                                                            }
                                                        }
                                                    ]}
                                                >
                                                    <Input
                                                        type="number"
                                                        min={6}
                                                        max={20}
                                                        placeholder="6-20"
                                                        value={formState.qrLength}
                                                        onChange={(e) => handleInputChange('qrLength', e.target.value)}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        )}
                                    </>
                                </Row>
                            </Card>
                        </Col>

                        {/* Right Column - Additional Details */}
                        <Col xs={24} lg={12}>
                            {/* Payment Method */}
                            {!showRoleGate && (formState.roleName === 'POS' || formState.roleName === 'Corporate') && (
                                <Card title="Payment Method" style={{ marginBottom: 16 }}>
                                    <Form.Item
                                        name="paymentMethod"
                                        rules={[requiredIf(true, 'Please select a payment method')]}
                                    >
                                        <Radio.Group
                                            value={formState.paymentMethod}
                                            onChange={handlePaymentMethodChange}
                                        >
                                            <Radio value="Cash">Cash</Radio>
                                            <Radio value="UPI">UPI</Radio>
                                            <Radio value="Card">Card</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                </Card>
                            )}

                            {/* Shop Details */}
                            {!showRoleGate && formState.roleName === 'Shop Keeper' && (
                                <Card title="Shop Details" style={{ marginBottom: 16 }}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={8}>
                                            <Form.Item label="Shop Name">
                                                <Input
                                                    placeholder="Enter shop name"
                                                    value={formState.shopName}
                                                    onChange={(e) => handleInputChange('shopName', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item label="Shop Number">
                                                <Input
                                                    placeholder="Enter shop number"
                                                    value={formState.shopNumber}
                                                    onChange={(e) => handleInputChange('shopNumber', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item label="GST Number">
                                                <Input
                                                    placeholder="Enter GST number"
                                                    value={formState.gstNumber}
                                                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            )}

                            {/* Address Section */}
                            {!showRoleGate && (
                                <Card title="Address" >
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="City">
                                                <Input
                                                    placeholder="Enter city"
                                                    value={formState.city}
                                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Pincode">
                                                <Input
                                                    placeholder="Enter pincode"
                                                    value={formState.pincode}
                                                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            )}

                            {/* Banking Details */}
                            {!showRoleGate && (userRole === 'Admin' && formState.roleName === 'Organizer') && (
                                <Card title="Banking Details" style={{ marginBottom: 16 }}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Bank Name">
                                                <Input
                                                    placeholder="Enter bank name"
                                                    value={formState.bankName}
                                                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="IFSC Code">
                                                <Input
                                                    placeholder="Enter IFSC code"
                                                    value={formState.bankIfsc}
                                                    onChange={(e) => handleInputChange('bankIfsc', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Branch Name">
                                                <Input
                                                    placeholder="Enter branch name"
                                                    value={formState.bankBranch}
                                                    onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Account Number">
                                                <Input
                                                    placeholder="Enter account number"
                                                    value={formState.bankNumber}
                                                    onChange={(e) => handleInputChange('bankNumber', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            )}

                            {/* Other */}
                            {!showRoleGate && formState.roleName === 'Organizer' && (
                                <Card title="Other" style={{ marginBottom: 16 }}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="GST / VAT Tax">
                                                <Input
                                                    placeholder="GST / VAT Tax"
                                                    value={formState.orgGstNumber}
                                                    onChange={(e) => handleInputChange('orgGstNumber', e.target.value)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            )}

                            {/* Status and Security */}
                            {!showRoleGate && (
                                <PermissionChecker role={['Admin', 'Organizer']}>
                                    <Card title="Status & Security">
                                        <Row gutter={[16, 16]}>
                                            {/* User Status */}
                                            <Col xs={24} md={12}>
                                                <Form.Item label="User Status">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <Switch
                                                            checked={formState.status === 'Active'}
                                                            onChange={(checked) =>
                                                                handleInputChange('status', checked ? 'Active' : 'Inactive')
                                                            }
                                                            checkedChildren="Active"
                                                            unCheckedChildren="Inactive"
                                                        />
                                                        <span
                                                            style={{
                                                                color: formState.status === 'Active' ? '#52c41a' : '#ff4d4f',
                                                            }}
                                                        >
                                                            {formState.status === 'Active'
                                                                ? 'User is Active'
                                                                : 'User is Inactive'}
                                                        </span>
                                                    </div>
                                                </Form.Item>
                                            </Col>

                                            {/* Authentication Method */}
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Authentication Method">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <Switch
                                                            checked={!!formState.authentication}
                                                            onChange={(checked) => handleInputChange('authentication', checked)}
                                                            checkedChildren="Password"
                                                            unCheckedChildren="OTP"
                                                        />
                                                        <span>
                                                            {formState.authentication ? 'Password Auth' : 'OTP Auth'}
                                                        </span>
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                </PermissionChecker>
                            )}
                        </Col>
                    </Row>
                </div>
            </Form>
        </Fragment>
    );
});

UserForm.displayName = "UserForm";
export default UserForm;
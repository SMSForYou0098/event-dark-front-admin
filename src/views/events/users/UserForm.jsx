import React, { memo, Fragment, useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
    Row, 
    Col, 
    Form, 
    Button, 
    Card, 
    Tabs, 
    Input, 
    Select, 
    Switch, 
    Radio, 
    
    Spin,
    
} from "antd";
import {
    ArrowLeftOutlined,
    UserOutlined,
    ShoppingOutlined,
    WalletOutlined,
    TransactionOutlined,
    SafetyCertificateOutlined,
    
} from '@ant-design/icons';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import apiClient from "auth/FetchInterceptor";
// import BookingList from "../Events/Bookings/BookingList";
import { useDispatch } from "react-redux";
import { useMyContext } from "Context/MyContextProvider";
import { updateUser } from "store/slices/authSlice";
import { Key, Shield } from "lucide-react";
// import { PasswordField } from "../CustomUtils/CustomFormFields";
// import TransactionHistory from "./Transaction/TransactionHistory";
// import RolePermission from "../RolePermission/RolePermission";

const { Option } = Select;
// const { TabPane } = Tabs;
// const { TextArea } = Input;

const UserForm = memo(({ mode = "edit" }) => {
    const { 
        api, 
        authToken, 
        successAlert, 
        userRole, 
        UserData, 
        UserList, 
        OrganizerList, 
        ErrorAlert, 
        HandleBack, 
        UserPermissions 
    } = useMyContext();
    
    const dispatch = useDispatch();
    const { id } = useParams();
    const location = useLocation();
    // const navigate = useNavigate();
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
    // const [bookings, setBookings] = useState([]);
    const [roles, setRoles] = useState([]);
    const [events, setEvents] = useState([]);
    const [errorTimeout, setErrorTimeout] = useState(null);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [loading] = useState(false);
    const [gates] = useState([]);
    const [selectedGates, setSelectedGates] = useState([]);
    // const [ticketGroup, setTicketGroup] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState([]);
    // const [validated, setValidated] = useState(false);
    const [disableOrg, setDisableOrg] = useState(false);
    const [disable, setDisable] = useState(false);
    const [showAM, setShowAM] = useState(false);
    const [activeTab, setActiveTab] = useState("1");

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

    // Update nested agreement details
    // const updateAggrementDetails = (updates) => {
    //     setFormState(prev => ({
    //         ...prev,
    //         aggrementDetails: {
    //             ...prev.aggrementDetails,
    //             ...updates
    //         }
    //     }));
    // };

    // Common functions
    const { data: rolesData } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get(`role-list`);
            // Expecting { role: [...] }
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
            // roles are loaded via query
            
            if (userRole === 'Organizer') {
                updateFormState({ 
                    reportingUser: { value: UserData?.id, label: UserData?.name || UserData?.id },
                    organisation: UserData?.organisation 
                });
                setDisableOrg(true);
            }
        }
    }, [mode, location.search, userRole, UserData]);
    //     const { data: userData, isLoading: userLoading } = useQuery({
    //     queryKey: ["user", id],
    //     enabled: mode === "edit" && Boolean(id),
    //     queryFn: async () => {
    //         const res = await apiClient.get(`edit-user/${id}`);
    //         if (!res?.status) {
    //             throw new Error(res?.message || res?.error || 'Failed to load user');
    //         }
    //         return res;
    //     },
    // });

     const { data: userData, isLoading: userLoading } = useQuery({
        queryKey: ["user", id],
        enabled: mode === "edit" && Boolean(id),
        queryFn: async () => {
            const res = await apiClient.get(`edit-user/${id}`);
            // Expecting { status: true, user: {...}, roles: [...] }
            if (!res?.status) {
                throw new Error(res?.message || res?.error || 'Failed to load user');
            }
            return res;
        },
    });

    
    useEffect(() => {
        if (mode === "create" && formState.userType && roles?.length) {
            const matchedRole = roles.find((r) => r?.name === formState.userType);
            if (matchedRole && matchedRole.id !== formState.roleId) {
                updateFormState({ roleId: matchedRole.id, roleName: matchedRole.name });
            }
        }
    }, [mode, formState.userType, roles, formState.roleId]);
    
// Replace the problematic section with this useEffect:

useEffect(() => {
    if (mode === "edit" && userData?.user) {
        const data = userData.user;
        const formUpdates = {
            name: data.name,
            email: data.email,
            password: data.password,
            number: data.phone_number,
            paymentMethod: data?.payment_method || 'Cash',
            organisation: data?.organisation,
            altNumber: data?.alt_number,
            pincode: data?.pincode,
            auth: data?.authentication === 1,
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
        
        // Also update the antd form instance
        form.setFieldsValue(formUpdates);
    }
}, [mode, userData, form]); // Dependencies: only run when these change

// Remove the old if(userData) block entirely
    const needsEvents = formState.roleName === 'Agent' || formState.roleName === 'Sponsor' || formState.roleName === 'Accreditation';
    const reportingUserId = formState.reportingUser?.value || formState.reportingUser?.key;
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

    const fetchUserRole = async (reportingId) => {
        if (!reportingId) return;
        try {
            const res = await apiClient.get(`edit-user/${reportingId}`);
            if (res?.status) {
                const data = res?.user;
                const eventOptions = data.events.map(event => ({
                    value: event.id,
                    label: event.name
                }));
                setSelectedEvents(eventOptions);
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
            ErrorAlert(error.response?.data?.error || error.response?.data?.message);
        }
    };

    console.log('events',events)


    const showDelayedError = (errorMessage) => {
        if (errorTimeout) {
            clearTimeout(errorTimeout);
        }
        const timeout = setTimeout(() => {
            ErrorAlert(errorMessage);
        }, 1000);
        setErrorTimeout(timeout);
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

        // Optionally fetch users by role in future
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
        if (!formState.email) {
            ErrorAlert('Please enter email');
            return;
        }
        
        if (!/^\d{10}$|^\d{12}$/.test(formState.number)) {
            ErrorAlert('Mobile number must be 10 or 12 digits only');
            return;
        }
        
        if (mode === "create" && formState.password !== formState.repeatPassword) {
            ErrorAlert('Password Do not Match');
            return;
        }
            
        const userData = {
            name: formState.name,
            email: formState.email,
            number: formState.number,
            password: formState.password,
            organisation: formState.organisation,
            authentication: mode === "create" ? formState.enablePasswordAuth : formState.auth,
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
            events: (formState.roleName === 'Agent' || formState.roleName === 'Sponsor' || formState.roleName === 'Accreditation') ? selectedEvents.map(event => event.value) : [],
            tickets: selectedTickets,
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
                if (userRole === 'User' && mode === "edit") {
                    dispatch(updateUser(response.data.user));
                    HandleBack();
                }
                successAlert(`User ${mode === "create" ? "created" : "updated"}`, response.data.message);
                if (mode === "create") {
                    HandleBack();
                }
            }
        } catch (error) {
            ErrorAlert(error.response?.data?.error || error.response?.data?.message);
        }
    };

    // Event handlers for form fields
    const handleInputChange = (field, value) => {
        updateFormState({ [field]: value });
    };

    const handlePaymentMethodChange = (e) => {
        updateFormState({ paymentMethod: e.target.value });
    };

    const HandleUserAuthType = () => {
        updateFormState({ auth: !formState.auth });
    };

    // const HandleTickets = (data) => {
    //     setSelectedTickets(data);
    // };

    // Tab items
    const tabItems = [
        {
            key: "1",
            label: (
                <span>
                    <UserOutlined />
                    Profile
                </span>
            ),
            children: renderProfileTab(),
        },
        {
            key: "2",
            label: (
                <span>
                    <ShoppingOutlined />
                    Bookings
                </span>
            ),
            children: renderBookingsTab(),
        },
        ...(formState.roleName === 'Agent' || formState.roleName === 'Sponsor' || formState.roleName === 'Accreditation' ? [{
            key: "3",
            label: (
                <span>
                    <WalletOutlined />
                    Wallet
                </span>
            ),
            // children: <AgentCredit id={id} />,
            children: <>Agent credit</>
        }] : []),
        {
            key: "4",
            label: (
                <span>
                    <TransactionOutlined />
                    Transactions
                </span>
            ),
            // children: <TransactionHistory id={id} />,
            children: <>transactions</>,
        },
        ...((userRole === "Admin" || UserPermissions.includes("Assign Permissions")) ? [{
            key: "5",
            label: (
                <span>
                    <Shield />
                    Permissions
                </span>
            ),
            // children: <RolePermission isUser={true} />,
            children: <>role permissons</>,
        }] : [])
    ];

    function renderProfileTab() {
        // Role-first gating for create mode: show role selector before other fields
        const showRoleGate = mode === "create" && !formState.roleId;

        return (
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={formState}
            >
                <Row gutter={[16, 16]}>
                    {/* Left Column - Basic Info */}
                    <Col xs={24} lg={12}>
                        {/* In create mode, ensure role is chosen first */}
                        {/* {showRoleGate ? ( */}
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
                        {/* // ) : ( */}
                            <Card 
                                title="Basic Information" 
                                extra={
                                    <Button type="primary" htmlType="submit">
                                        Save
                                    </Button>
                                }
                            >
                            <Row gutter={[16, 16]}>
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

                                {userRole !== 'User' && (
                                    <>
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

                                        {!disableOrg && (
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
                                                <Form.Item label="Event Gates">
                                                    <Select
                                                        mode="multiple"
                                                        placeholder="Select gates"
                                                        options={gates}
                                                        value={selectedGates}
                                                        onChange={setSelectedGates}
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
                                                                const needs = ['Agent','Sponsor','Accreditation'].includes(formState.roleName);
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
                                                            value={selectedEvents}
                                                            onChange={setSelectedEvents}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Form.Item label="Agent Discount">
                                                        <Switch
                                                            checked={formState.agentDiscount}
                                                            onChange={(checked) => handleInputChange('agentDiscount', checked)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </>
                                        )}

                                        {(userRole === 'Admin' || userRole === 'Organizer') && (
                                            <Col xs={24} md={12}>
                                                <Form.Item 
                                                    label="Password"
                                                    name="password"
                                                    rules={[
                                                        requiredIf(mode === 'create', 'Please enter password'),
                                                        ...(mode === 'create' ? [{ min: 6, message: 'Password must be at least 6 characters' }] : [])
                                                    ]}
                                                >
                                                    <Input.Password
                                                        prefix={<Key className="text-primary" size={16} />}
                                                        size="large"
                                                        placeholder="Enter your password"
                                                        value={formState.password}
                                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                                        // onKeyDown={handleKeyDown}
                                                        autoFocus
                                                        disabled={loading}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        )}

                                        {/* Create mode confirm password */}
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
                                )}
                            </Row>
                        </Card>
                        {/* // )} */}

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
                        <Card title="Address" style={{ marginTop: 16 }}>
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
                        <Card title="Status & Security">
                            {(userRole === 'Admin' || userRole === 'Organizer') && (
                                <Form.Item label="User Status">
                                    <Select
                                        value={formState.status}
                                        onChange={(value) => handleInputChange('status', value)}
                                    >
                                        <Option value="Active">Active</Option>
                                        <Option value="Deative">Deactive</Option>
                                    </Select>
                                </Form.Item>
                            )}

                            {userRole !== 'User' && mode === 'edit' && (
                                <Card 
                                    type="inner" 
                                    title="Account Security" 
                                    extra={
                                        <Button type="primary" onClick={HandleUserAuthType}>
                                            {formState.auth ? "Enable OTP" : "Enable Password"}
                                        </Button>
                                    }
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                                        <span>
                                            {formState.auth
                                                ? "Your account is secured using a password. Click to enable OTP authentication instead."
                                                : "Your account is secured using OTP. Click to enable password authentication instead."}
                                        </span>
                                    </div>
                                </Card>
                            )}

                            {mode === 'create' && (
                                <Card type="inner" title="Authentication">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Switch
                                            checked={formState.enablePasswordAuth}
                                            onChange={(checked) => handleInputChange('enablePasswordAuth', checked)}
                                        />
                                        <span>
                                            {formState.enablePasswordAuth
                                                ? "Password authentication enabled for this user."
                                                : "OTP authentication will be used unless password auth is enabled."}
                                        </span>
                                    </div>
                                </Card>
                            )}
                        </Card>
                        )}
                    </Col>
                </Row>
            </Form>
        );
    }

    function renderBookingsTab() {
        return (
            <Card>
                {/* <BookingList bookings={bookings} loading={loading} setLoading={setLoading} /> */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button type="primary">Load More</Button>
                </div>
            </Card>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Fragment>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button 
                            type="text" 
                            icon={<ArrowLeftOutlined />} 
                            onClick={HandleBack}
                            style={{ padding: 0, height: 'auto' }}
                        />
                        <h2 style={{ margin: 0 }}>
                            {mode === "create" ? "Create User" : `Manage User - ${formState.roleName}`}
                        </h2>
                    </div>
                </div>

                {mode === "edit" ? (
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                    />
                ) : (
                    renderProfileTab()
                )}
            </Card>
        </Fragment>
    );
});

UserForm.displayName = "UserForm";
export default UserForm;
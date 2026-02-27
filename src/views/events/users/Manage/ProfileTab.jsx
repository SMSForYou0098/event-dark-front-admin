import { useQuery, useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, message, Modal, Radio, Row, Select, Space, Spin, Switch, Tag, Typography } from 'antd';
import PermissionChecker from 'layouts/PermissionChecker';
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from 'Context/MyContextProvider';
import { CircleCheckBig, CircleX, Key, ScrollText } from 'lucide-react';
import { mapApiToForm, mapFormToApi } from './dataMappers';
import axios from 'axios';
import { updateUser } from 'store/slices/authSlice';
import Flex from 'components/shared-components/Flex';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Utils from 'utils';
import { ORGANIZER_ALLOWED_ROLES } from '../constants';
import { RoleSelect } from 'utils/CommonInputs';
import SignatureInput, { SIGNATURE_FONTS } from '../../../../components/shared-components/SignatureInput';
import { useGetAllOrganizerAgreements } from '../../Agreement/Organizer/useOrganizerAgreement';
import { useApproveOrganizerOnboarding } from '../../Onboarding/Organizer/useOrganizerOnboarding';
import DOMPurify from 'dompurify';
import OtpVerificationModal from 'components/shared-components/OtpVerificationModal';

// Child Components
import {
    AgreementSelectionModal,
    FormActionButtons,
    SecurityCard,
    AddressCard,
    BankingDetailsCard,
    PaymentMethodCard,
} from './components';
import { createValidationRules } from './hooks/useProfileFormData';

const ProfileTab = ({ mode, handleSubmit, id = null, setSelectedRole, setUserNumber }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { OrganizerList, userRole, UserData, api, authToken } = useMyContext();
    const [form] = Form.useForm();
    const location = useLocation();
    const editOtherUser = !['Admin', 'Organizer'].includes(userRole) || id === UserData.id;

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
        status: true,
        email_verified_at: null,
        agreement: null,

        // Role-specific fields
        agreementStatus: false,
        agreementVerification: false,  // For edit mode - tracks if agreement is verified
        organisation: '',
        agentDiscount: false,
        qrLength: '',
        paymentMethod: 'Cash',

        // Event management
        events: [],
        tickets: [],
        gates: [],

        // Address
        address: '',
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

    // OTP verification state (for own profile edit)
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [pendingFormValues, setPendingFormValues] = useState(null);
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);

    // OTP verification state (for user creation)
    const [createOtpModalVisible, setCreateOtpModalVisible] = useState(false);
    const [createOtpValue, setCreateOtpValue] = useState('');
    const [createOtpSessionId, setCreateOtpSessionId] = useState(null);
    const [pendingCreateValues, setPendingCreateValues] = useState(null);

    // Track original email and phone for comparison
    const originalEmail = useRef(null);
    const originalNumber = useRef(null);

    // Track if form has been initialized
    const didInit = useRef(false);
    const isInitializing = useRef(false);

    // Signature state (for Organizers with agreementStatus = false)
    const [signatureType, setSignatureType] = useState('type');
    const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
    const [typedSignature, setTypedSignature] = useState('');
    const [uploadedSignature, setUploadedSignature] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);
    const canvasRef = useRef(null);

    // Agreement modal state (for creating Organizer with verifiedEmail)
    const [agreementModalVisible, setAgreementModalVisible] = useState(false);
    const [selectedAgreementId, setSelectedAgreementId] = useState(null);
    const [createdUserId, setCreatedUserId] = useState(null);  // Store created user ID for agreement approval

    // Agreement state (OTP removed - now done at user creation)
    // Keeping these for backward compatibility but they won't be used for new flow

    // Fetch user data in edit mode
    const { data: fetchedData, isLoading: loading } = useQuery({
        queryKey: ["user", id],
        enabled: mode === "edit" && Boolean(id),
        queryFn: async () => {
            const res = await apiClient.get(`edit-user/${id}`);
            if (!res?.status) {
                throw new Error(Utils.getErrorMessage(res));
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
        enabled: UserData?.activity_status === true, // ⬅️ run only when active
    });

    // Fetch agreements for organizer creation with verifiedEmail
    const { data: agreements = [] } = useGetAllOrganizerAgreements({
        enabled: userRole === 'Admin',
    });

    // Approve organizer mutation (for creating organizer with agreement)
    const approveMutation = useApproveOrganizerOnboarding({
        onSuccess: () => {
            setAgreementModalVisible(false);
            setSelectedAgreementId(null);
            setCreatedUserId(null);
            navigate(-1);
        },
    });

    // Send OTP mutation for user creation
    const sendCreateOtpMutation = useMutation({
        mutationFn: async (number) => {
            const response = await apiClient.post('user/otp', { number });
            return response;
        },
        onSuccess: (data) => {
            if (data?.status) {
                message.success('OTP sent successfully!');
                setCreateOtpModalVisible(true);
            } else {
                message.error(data?.message || 'Failed to send OTP');
            }
        },
        onError: (error) => {
            console.error('Send OTP error:', error);
            message.error(Utils.getErrorMessage(error));
        },
    });

    // Verify OTP mutation for user creation - returns session_id
    const verifyCreateOtpMutation = useMutation({
        mutationFn: async ({ number, otp }) => {
            const response = await apiClient.post('user/otp/verify', { number, otp });
            return response;
        },
        onSuccess: async (data) => {
            if (data?.status && data?.session_id) {
                message.success('OTP verified successfully!');
                setCreateOtpSessionId(data.session_id);
                setCreateOtpModalVisible(false);
                setCreateOtpValue('');

                // Now proceed with user creation using session_id
                if (pendingCreateValues) {
                    await saveUserProfile(pendingCreateValues, true, data.session_id);
                    setPendingCreateValues(null);
                }
            } else {
                message.error(data?.message || 'Invalid OTP');
            }
        },
        onError: (error) => {
            console.error('Verify OTP error:', error);
            message.error(Utils.getErrorMessage(error));
        },
    });

    // Agreement options for select dropdown
    const agreementOptions = useMemo(() => {
        return agreements
            .filter((a) => a.status === 1 || a.status === true)
            .map((a) => ({ label: a.title, value: a.id }));
    }, [agreements]);

    // Get the selected agreement
    const selectedAgreement = useMemo(() => {
        if (selectedAgreementId) {
            return agreements.find((a) => a.id === selectedAgreementId);
        }
        return null;
    }, [agreements, selectedAgreementId]);

    // Auto-select if only one agreement is available
    useEffect(() => {
        if (agreementOptions.length === 1 && !selectedAgreementId) {
            setSelectedAgreementId(agreementOptions[0].value);
        }
    }, [agreementOptions, selectedAgreementId]);

    // Process agreement content with placeholders
    const processedAgreementContent = useMemo(() => {
        if (!selectedAgreement?.content) return selectedAgreement?.content || '';

        return selectedAgreement.content
            .replace(/:C_Name/g, `<strong>${formState.name || ''}</strong>`)
            .replace(/:ORG_Name/g, `<strong>${formState.organisation || ''}</strong>`);
    }, [selectedAgreement, formState.name, formState.organisation]);

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
        if (mode === 'edit' && fetchedData?.data && initialReportingUser.current === null) {
            initialReportingUser.current = fetchedData?.data?.reporting_user_id?.toString();
        }
    }, [mode, fetchedData?.data]);

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
        if (mode !== 'edit' || !fetchedData?.data?.events) return [];

        return fetchedData.data.events.map(event => ({
            value: event.id,
            label: event.name,
            tickets: event.tickets || [],
        }));
    }, [mode, fetchedData?.data?.events]);


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
    const roleName = formState.roleName;

    const {
        data: fetchedEvents = [],
        isLoading: eventsLoading,
        isFetching: eventsFetching,
    } = useQuery({
        queryKey: ["org-events", reportingUserId, roleName],
        enabled:
            shouldFetchEvents &&
            !!reportingUserId &&
            reportingUserId !== "undefined" &&
            !!roleName, // 👈 runs when roleName is set
        queryFn: async () => {
            const res = await apiClient.get(
                `org-event/${reportingUserId}?role=${roleName}`
            );

            const list = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.events)
                    ? res.events
                    : [];

            return list.map((event) => ({
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
        if (mode === 'edit' && fetchedData?.data && !didInit.current && !isInitializing.current) {
            isInitializing.current = true;
            const formData = mapApiToForm(fetchedData.data);

            setFormState(prevState => ({ ...prevState, ...formData }));

            // Set convenience fee type state
            if (formData.convenienceFeeType) {
                setConvenienceFeeType(formData.convenienceFeeType);
            }

            // Store original email and phone for OTP verification check
            originalEmail.current = formData.email || fetchedData.data.email;
            originalNumber.current = formData.number || fetchedData.data.number;

            // Initialize signature state from fetched data
            if (formData.signatureType) {
                setSignatureType(formData.signatureType);
            }
            if (formData.signatureText) {
                setTypedSignature(formData.signatureText);
            }
            if (formData.signatureFont) {
                const font = SIGNATURE_FONTS.find(f => f.name === formData.signatureFont);
                if (font) {
                    setSelectedFont(font);
                }
            }
            if (formData.signatureImage) {
                setSignaturePreview(formData.signatureImage);
            }

            // Also set form fields for Ant Design Form
            form.setFieldsValue(formData);

            didInit.current = true;
            isInitializing.current = false;

            if (setSelectedRole && formData.roleName) {
                setSelectedRole(formData.roleName);
            }

            // Pass user number to parent for reset OTP limits feature
            if (setUserNumber && formData.number) {
                setUserNumber(formData.number);
            }
        }
    }, [mode, fetchedData?.data, form, setSelectedRole, setUserNumber]);

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

    // Check if user is editing their own profile (compare as strings to handle type mismatch)
    const isEditingOwnProfile = mode === 'edit' && String(id) === String(UserData?.id);

    // Check if email or name has changed (Identity changed)
    const hasIdentityChanged = useCallback((values) => {
        if (!isEditingOwnProfile) return false;

        const currentEmail = values.email?.trim()?.toLowerCase();
        const currentName = values.name?.trim();
        const origEmail = originalEmail.current?.trim()?.toLowerCase();
        // Assuming originalName is tracked, otherwise comparing with formState initial values if needed
        // But originalEmail ref is used. Let's start with what we have.
        // Wait, originalName was NOT tracked in the original code. 
        // I should add originalName tracking or use fetchedData.

        // Let's use fetchedData directly since it's available in scope
        const origName = fetchedData?.data?.name?.trim();

        const emailChanged = origEmail && currentEmail !== origEmail;
        const nameChanged = origName && currentName !== origName;

        return emailChanged || nameChanged;
    }, [isEditingOwnProfile, fetchedData]);

    // Send OTP for verification
    const sendOtp = async (values) => {
        setOtpSending(true);
        try {
            // Determine what changed (normalize for comparison)
            const currentEmail = values.email?.trim()?.toLowerCase();
            const currentName = values.name?.trim();
            const origEmail = originalEmail.current?.trim()?.toLowerCase();
            const origName = fetchedData?.data?.name?.trim();

            const emailChanged = origEmail && currentEmail !== origEmail;
            const nameChanged = origName && currentName !== origName;

            const payload = {
                user_id: id,
                email: emailChanged ? values.email : null,
                // number: phoneChanged ? values.number : null, // Phone not updating here
                number: null,
                type: 'email', // Always email for name or email change
            };

            // Call OTP send API
            const response = await apiClient.post('user/otp', payload);

            if (response?.status) {
                message.success('OTP sent successfully');
                setOtpSent(true);
                return true;
            } else {
                message.error(response?.message || 'Failed to send OTP');
                return false;
            }
        } catch (error) {
            message.error(Utils.getErrorMessage(error));
            return false;
        } finally {
            setOtpSending(false);
        }
    };

    // Verify OTP and save
    const verifyOtpAndSave = async () => {
        if (!otpValue || otpValue.length < 4) {
            message.error('Please enter a valid OTP');
            return;
        }

        setOtpLoading(true);
        try {
            // Verify OTP
            const verifyResponse = await apiClient.post('user/otp/verify', {
                user_id: id,
                otp: otpValue,
            });

            if (!verifyResponse?.status) {
                message.error(verifyResponse?.message || 'Invalid OTP');
                return;
            }

            // OTP verified, proceed with save
            await saveUserProfile(pendingFormValues);

            // Close modal and reset state
            setOtpModalVisible(false);
            setOtpValue('');
            setOtpSent(false);
            setPendingFormValues(null);

        } catch (error) {
            message.error(Utils.getErrorMessage(error));
        } finally {
            setOtpLoading(false);
        }
    };

    // Get signature data based on type
    const getSignatureData = useCallback(async () => {
        // Only include signature for Organizers with inactive agreement
        if (formState.roleName !== 'Organizer' || formState.agreementStatus) {
            return null;
        }

        if (signatureType === 'draw' && canvasRef.current) {
            return { type: 'draw', data: canvasRef.current.toDataURL() };
        } else if (signatureType === 'type' && typedSignature) {
            return {
                type: 'type',
                text: typedSignature,
                font: selectedFont.name,
                fontStyle: selectedFont.style
            };
        } else if (signatureType === 'upload' && uploadedSignature) {
            return { type: 'upload', file: uploadedSignature };
        }
        return null;
    }, [formState.roleName, formState.agreementStatus, signatureType, typedSignature, selectedFont, uploadedSignature]);

    // Save user profile (actual API call)
    const saveUserProfile = async (values, isVerifiedOrganizer = false, sessionId = null) => {
        const mergedValues = {
            ...values,
            roleId: values.roleId ?? formState.roleId,
            roleName: values.roleName ?? formState.roleName,
            convenienceFeeType: values.convenienceFeeType ?? formState.convenienceFeeType,
            convenienceFee: values.convenienceFee ?? formState.convenienceFee,
            reportingUser: reportingUserId,
        };

        // Get signature data
        const signatureData = await getSignatureData();

        const url = mode === "create" ? `${api}create-user` : `${api}update-user/${id}`;
        let response;

        // If signature exists, use FormData; otherwise use JSON
        if (signatureData) {
            const formData = new FormData();
            const apiData = mapFormToApi(mergedValues);

            // Append all form fields to FormData
            Object.keys(apiData).forEach(key => {
                const value = apiData[key];
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        // Handle arrays (event_ids, ticket_ids, gate_ids)
                        formData.append(key, JSON.stringify(value));
                    } else if (typeof value === 'object') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, value);
                    }
                }
            });

            // Append session_id if available (from OTP verification)
            if (sessionId) {
                formData.append('session_id', sessionId);
            }

            // Append signature data
            formData.append('signature_type', signatureData.type);

            if (signatureData.type === 'type') {
                formData.append('signature_text', signatureData.text);
                formData.append('signature_font', signatureData.font);
                formData.append('signature_font_style', signatureData.fontStyle);
            } else if (signatureData.type === 'draw') {
                // Base64 data for draw
                formData.append('signature_image', signatureData.data);
            } else if (signatureData.type === 'upload' && signatureData.file) {
                // File object for upload
                formData.append('signature_image', signatureData.file);
            }

            response = await axios.post(url, formData, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'multipart/form-data',
                }
            });
        } else {
            // No signature - use regular JSON payload
            const apiData = mapFormToApi(mergedValues);

            // Add session_id if available (from OTP verification)
            if (sessionId) {
                apiData.session_id = sessionId;
            }

            response = await axios.post(url, apiData, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });
        }

        if (response.data?.status) {
            // If creating verified organizer, show agreement modal with user ID
            if (isVerifiedOrganizer && response.data?.user?.id) {
                message.success('User created! Please select an agreement.');
                setCreatedUserId(response.data.user.id);
                setAgreementModalVisible(true);
                return response; // Return early, don't navigate
            }

            if (id === UserData?.id) {
                dispatch(updateUser(response.data.user));
                navigate(-1);
            }
            message.success(`User ${mode === "create" ? "created" : "updated"}`);

            if (mode === "create") {
                navigate(-1);
            }
        }

        return response;
    };


    // Form submit handler
    const onFinish = async (values) => {
        setIsSubmitting(true);
        try {
            // Check if creating Organizer - always use OTP flow (no direct create-user for organizer)
            const isCreatingVerifiedOrganizer =
                mode === 'create' &&
                formState.roleName === 'Organizer';
            // && !values.verifiedEmail;  // Commented out: no direct create-user for organizer

            // Check if editing own profile and email/name changed
            if (hasIdentityChanged(values)) {
                // Store values and show OTP modal
                setPendingFormValues(values);
                setOtpModalVisible(true);

                // Send OTP
                await sendOtp(values);
            } else if (isCreatingVerifiedOrganizer) {
                // For creating organizer - send OTP first, then create user with session_id
                setPendingCreateValues(values);
                // setCreateOtpModalVisible(true);

                // Send OTP to the mobile number
                sendCreateOtpMutation.mutate(values.number);
            } else {
                // Create or update user normally
                await saveUserProfile(values, false);
            }
        } catch (error) {
            message.error(`Error: ${Utils.getErrorMessage(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };



    // Handle OTP modal cancel
    const handleOtpModalCancel = () => {
        setOtpModalVisible(false);
        setOtpValue('');
        setOtpSent(false);
        setPendingFormValues(null);
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (pendingFormValues) {
            await sendOtp(pendingFormValues);
        }
    };

    // Agreement modal handlers
    const handleAgreementModalClose = useCallback(() => {
        setAgreementModalVisible(false);
        setSelectedAgreementId(null);
        setCreatedUserId(null);
    }, []);

    // Open agreement modal for edit mode (when agreement_verification is false)
    const handleOpenAgreementModal = useCallback(() => {
        setAgreementModalVisible(true);
    }, []);

    const handleAgreementChange = useCallback((value) => {
        setSelectedAgreementId(value);
    }, []);

    // Handle approve with agreement - directly assign without OTP (OTP already done at creation)
    const handleApproveWithAgreement = useCallback(() => {
        if (!selectedAgreementId) {
            message.error('Please select an agreement');
            return;
        }

        // Use createdUserId (for create mode) or id (for edit mode)
        const userId = createdUserId || id;
        if (!userId) {
            message.error('User ID not found');
            return;
        }

        // Directly call the agreement approval API (OTP was already verified during user creation)
        approveMutation.mutate({
            id: userId,
            payload: {
                agreement_id: selectedAgreementId,
                action: 'sign',
                agreement_title: selectedAgreement?.title,
                organizer_email: formState.email,
                organizer_name: formState.name,
                organization_name: formState.organisation,
            },
        });
    }, [selectedAgreementId, createdUserId, id, approveMutation, selectedAgreement, formState.email, formState.name, formState.organisation]);

    // Handle OTP verification for user creation
    const handleVerifyCreateOtp = useCallback(() => {
        if (!createOtpValue || createOtpValue.length < 6) {
            message.error('Please enter a valid 6-digit OTP');
            return;
        }

        // Verify OTP using TanStack mutation - this will trigger user creation with session_id
        verifyCreateOtpMutation.mutate({
            number: pendingCreateValues?.number,
            otp: createOtpValue,
        });
    }, [createOtpValue, pendingCreateValues, verifyCreateOtpMutation]);

    // Handle resend OTP for user creation
    const handleResendCreateOtp = useCallback(() => {
        if (pendingCreateValues?.number) {
            sendCreateOtpMutation.mutate(pendingCreateValues.number);
        }
    }, [pendingCreateValues, sendCreateOtpMutation]);

    // Handle close create OTP modal
    const handleCreateOtpModalClose = useCallback(() => {
        setCreateOtpModalVisible(false);
        setCreateOtpValue('');
        setPendingCreateValues(null);
        setIsSubmitting(false);
    }, []);

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
                status: true,
                paymentMethod: 'Cash',
                authentication: false,
                agreementStatus: false,
                agentDiscount: false,
                convenienceFeeType: 'percentage',
                convenienceFee: '',
                verifiedEmail: false
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
                    <Card title="Basic Information"
                        extra={
                            <Flex justifyContent="end" alignItems="center" gap="middle">
                                {formState?.email_verified_at ? (
                                    <Tag
                                        color="success"
                                        className="btn btn-secondary d-inline-flex align-items-center gap-2"
                                    >
                                        <CircleCheckBig size={14} />
                                        Email Verified
                                    </Tag>
                                ) : (
                                    <Tag
                                        color="error"
                                        className="btn btn-secondary d-inline-flex align-items-center gap-2"
                                    >
                                        <CircleX size={14} />
                                        Email Not Verified
                                    </Tag>
                                )}
                                {editOtherUser &&
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
                                }

                                {formState.agreement && (
                                    <PermissionChecker role={["Admin", "Organizer"]}>
                                        <Button
                                            type="default"
                                            onClick={() => navigate(`/agreement/preview/${formState.agreement}`)}
                                            className="btn btn-secondary d-inline-flex align-items-center gap-2"
                                            icon={<ScrollText size={16} />}
                                        >
                                            View Agreement
                                        </Button>
                                    </PermissionChecker>
                                )}

                                {/* Assign Agreement button - shows in edit mode when agreement_verification is false */}
                                {mode === 'edit' && formState.roleName === 'Organizer' && !formState.agreementVerification && (
                                    <PermissionChecker role={["Admin"]}>
                                        <Button
                                            type="primary"
                                            onClick={handleOpenAgreementModal}
                                            className="d-inline-flex align-items-center gap-2"
                                            icon={<ScrollText size={16} />}
                                        >
                                            Assign Agreement
                                        </Button>
                                    </PermissionChecker>
                                )}

                            </Flex>
                        }

                    >

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
                                    <Input placeholder="Enter mobile number" disabled={mode === 'edit' && userRole !== 'Admin'} />
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

                            {/* Verified Email Checkbox - Only for Admin creating Organizer */}
                            {mode === 'create' && (userRole === 'Admin' || userRole === 'Organizer') && (
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Email Required"
                                        name="verifiedEmail"
                                        valuePropName="checked"
                                    >
                                        <Switch
                                            checkedChildren="Yes"
                                            unCheckedChildren="No"
                                        />
                                    </Form.Item>
                                </Col>
                            )}

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
                                                value: String(org.id),
                                                label: `${org.organisation} (${org.name})`,
                                            }))}
                                            optionFilterProp="label"
                                        />
                                    </Form.Item>
                                </Col>
                            )}

                            {/* Events Assignment */}
                            {needsEvents && (
                                <PermissionChecker role={['Admin', 'Organizer']}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Assign Events"
                                            name="events"
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
                                                dropdownRender={(menu) => {
                                                    // Only show Select All for multiple mode (not for Scanner)
                                                    if (formState.roleName === 'Scanner') {
                                                        return menu;
                                                    }

                                                    const allEventValues = fetchedEvents.map(e => e.value);
                                                    const allSelected = allEventValues.length > 0 &&
                                                        formState.events?.length === allEventValues.length;

                                                    return (
                                                        <>
                                                            {allEventValues.length > 0 && (
                                                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #303030' }}>
                                                                    <Space>
                                                                        <Button
                                                                            size="small"
                                                                            type={allSelected ? 'default' : 'primary'}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (allSelected) {
                                                                                    // Deselect all
                                                                                    handleEventChange([]);
                                                                                } else {
                                                                                    // Select all
                                                                                    handleEventChange(allEventValues);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {allSelected ? 'Deselect All' : 'Select All'}
                                                                        </Button>
                                                                        {formState.events?.length > 0 && !allSelected && (
                                                                            <span style={{ color: '#888', fontSize: 12 }}>
                                                                                {formState.events.length} / {allEventValues.length} selected
                                                                            </span>
                                                                        )}
                                                                    </Space>
                                                                </div>
                                                            )}
                                                            {menu}
                                                        </>
                                                    );
                                                }}
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
                                                    dropdownRender={(menu) => {
                                                        const allTicketValues = ticketOptions.flatMap(group => group.options.map(opt => opt.value));
                                                        const allSelected = allTicketValues.length > 0 &&
                                                            formState.tickets?.length === allTicketValues.length;

                                                        return (
                                                            <>
                                                                {allTicketValues.length > 0 && (
                                                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #303030' }}>
                                                                        <Space>
                                                                            <Button
                                                                                size="small"
                                                                                type={allSelected ? 'default' : 'primary'}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const newValues = allSelected ? [] : allTicketValues;
                                                                                    updateField('tickets', newValues);
                                                                                }}
                                                                            >
                                                                                {allSelected ? 'Deselect All' : 'Select All'}
                                                                            </Button>
                                                                            {formState.tickets?.length > 0 && !allSelected && (
                                                                                <span style={{ color: '#888', fontSize: 12 }}>
                                                                                    {formState.tickets.length} / {allTicketValues.length} selected
                                                                                </span>
                                                                            )}
                                                                        </Space>
                                                                    </div>
                                                                )}
                                                                {menu}
                                                            </>
                                                        );
                                                    }}
                                                    notFoundContent={
                                                        !formState.events?.length ? 'Please select events first' :
                                                            'No tickets available for selected events'
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    }
                                </PermissionChecker>
                            )}

                            {/* Agent Discount */}
                            {formState.roleName === 'Agent' && (
                                <PermissionChecker role={['Admin', 'Organizer']}>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Agent Discount"
                                            name="agentDiscount"
                                            valuePropName="checked"
                                        >
                                            <Switch />
                                        </Form.Item>
                                    </Col>
                                </PermissionChecker>
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
                    {/* Signature Section - Only for Organizers with inactive agreement */}
                    {formState.roleName === 'Organizer' && !formState.agreementStatus && (
                        <Col xs={24}>
                            <Card title="Admin Signature" className="mb-4">
                                <SignatureInput
                                    signatureType={signatureType}
                                    onSignatureTypeChange={setSignatureType}
                                    selectedFont={selectedFont}
                                    onFontChange={setSelectedFont}
                                    typedSignature={typedSignature}
                                    onTypedSignatureChange={setTypedSignature}
                                    uploadedSignature={uploadedSignature}
                                    onUploadedSignatureChange={setUploadedSignature}
                                    signaturePreview={signaturePreview}
                                    onSignaturePreviewChange={setSignaturePreview}
                                    canvasRef={canvasRef}
                                    onClearCanvas={() => {
                                        const canvas = canvasRef.current;
                                        if (canvas) {
                                            const ctx = canvas.getContext('2d');
                                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                    )}
                </Col>

                {/* Right Column */}
                <Col xs={24} lg={12}>
                    {/* Payment Method */}
                    {(formState.roleName === 'POS' || formState.roleName === 'Corporate') && (
                        <PaymentMethodCard />
                    )}

                    {/* Address */}
                    {!showRoleGate && <AddressCard />}

                    {/* Banking Details (Admin + Organizer role) */}
                    {formState.roleName === 'Organizer' && <BankingDetailsCard />}

                    {/* Status & Security */}
                    {!showRoleGate && (
                        <SecurityCard
                            mode={mode}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </Col>
            </Row>



            {/* OTP Verification Modal */}
            <Modal
                title="Verify OTP"
                open={otpModalVisible}
                onCancel={handleOtpModalCancel}
                footer={null}
                maskClosable={false}
                destroyOnClose
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Alert
                        message="Verification Required"
                        description="You've changed your email or phone number. Please verify with OTP to save changes."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    {otpSent ? (
                        <>
                            <p style={{ marginBottom: 16 }}>
                                Enter the OTP sent to your {pendingFormValues?.email !== originalEmail.current && pendingFormValues?.number !== originalNumber.current
                                    ? 'email and phone'
                                    : pendingFormValues?.email !== originalEmail.current
                                        ? 'email'
                                        : 'phone'}
                            </p>
                            {Input.OTP ? (
                                <Input.OTP
                                    length={6}
                                    value={otpValue}
                                    onChange={setOtpValue}
                                    style={{ marginBottom: 16 }}
                                />
                            ) : (
                                <Input
                                    maxLength={6}
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value)}
                                    style={{ marginBottom: 16, width: 200, textAlign: 'center', letterSpacing: '0.5em', fontSize: 18 }}
                                    placeholder="000000"
                                />
                            )}
                            <div style={{ marginTop: 24 }}>
                                <Space>
                                    <Button onClick={handleOtpModalCancel}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="link"
                                        onClick={handleResendOtp}
                                        loading={otpSending}
                                    >
                                        Resend OTP
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={verifyOtpAndSave}
                                        loading={otpLoading}
                                        disabled={!otpValue || otpValue.length < 6}
                                    >
                                        Verify & Save
                                    </Button>
                                </Space>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '20px 0' }}>
                            <Spin tip="Sending OTP..." />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Agreement Selection Modal for Organizer with Verified Email */}
            <AgreementSelectionModal
                open={agreementModalVisible}
                onClose={handleAgreementModalClose}
                onAssign={handleApproveWithAgreement}
                agreementOptions={agreementOptions}
                selectedAgreementId={selectedAgreementId}
                onAgreementChange={handleAgreementChange}
                selectedAgreement={selectedAgreement}
                processedContent={processedAgreementContent}
                isLoading={approveMutation.isPending}
            />

            {/* OTP Verification Modal for User Creation */}
            <OtpVerificationModal
                open={createOtpModalVisible}
                onClose={handleCreateOtpModalClose}
                onVerify={handleVerifyCreateOtp}
                onResend={handleResendCreateOtp}
                phoneNumber={pendingCreateValues?.number}
                title="Verify OTP"
                description={`Please enter the OTP sent to ${pendingCreateValues?.number} to create the user.`}
                otpValue={createOtpValue}
                onOtpChange={setCreateOtpValue}
                isVerifying={verifyCreateOtpMutation.isPending || isSubmitting}
                isSending={sendCreateOtpMutation.isPending}
                verifyButtonText="Submit"
            />
        </Form>
    );
};

export default ProfileTab;
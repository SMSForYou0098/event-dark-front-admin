import { useQuery, useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import apiClient from "auth/FetchInterceptor";
import { useMyContext } from 'Context/MyContextProvider';
import { useMemo, useCallback } from 'react';
import { useGetAllOrganizerAgreements } from 'views/events/Agreement/Organizer/useOrganizerAgreement';
import { useApproveOrganizerOnboarding } from 'views/events/Onboarding/Organizer/useOrganizerOnboarding';

/**
 * Custom hook for managing user profile form data and mutations
 * Extracts TanStack Query logic from ProfileTab component
 */
export const useProfileFormData = ({
    mode,
    id,
    userRole,
    reportingUserId,
    roleName,
    formState,
    createdUserId,
    selectedAgreementId,
    selectedAgreement,
    setAgreementModalVisible,
    setAgreementOtpModalVisible,
    setAgreementOtpValue,
    setSelectedAgreementId,
    setCreatedUserId,
    navigate,
}) => {
    const { UserData } = useMyContext();

    // Fetch user data in edit mode
    const userQuery = useQuery({
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

    // Fetch roles
    const rolesQuery = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get(`role-list`);
            return (res?.role || []).slice().reverse();
        },
        staleTime: 5 * 60 * 1000,
        enabled: UserData?.activity_status === true,
    });

    // Fetch agreements for organizer creation
    const agreementsQuery = useGetAllOrganizerAgreements({
        enabled: mode === 'create' && userRole === 'Admin',
    });

    // Fetch events based on role and reporting user
    const eventsQuery = useQuery({
        queryKey: ["events-create-user", reportingUserId, roleName],
        enabled: Boolean(reportingUserId) && Boolean(roleName),
        queryFn: async () => {
            const res = await apiClient.get(`organizer/events/${reportingUserId}`);
            if (!res?.status) {
                throw new Error(res?.message || 'Failed to load events');
            }
            return res?.events?.map(e => ({
                value: e.id,
                label: e.name,
                tickets: e.tickets || [],
            })) || [];
        },
        placeholderData: (previousData) => previousData,
    });

    // Approve organizer mutation
    const approveMutation = useApproveOrganizerOnboarding({
        onSuccess: () => {
            setAgreementModalVisible(false);
            setAgreementOtpModalVisible(false);
            setAgreementOtpValue('');
            setSelectedAgreementId(null);
            setCreatedUserId(null);
            navigate(-1);
        },
    });

    // Send OTP mutation for agreement verification
    const sendAgreementOtpMutation = useMutation({
        mutationFn: async (phoneNumber) => {
            const response = await apiClient.post('verify-user', { data: phoneNumber });
            return response;
        },
        onSuccess: (data) => {
            if (data?.status) {
                message.success('OTP sent successfully!');
                setAgreementOtpModalVisible(true);
            } else {
                message.error(data?.message || 'Failed to send OTP');
            }
        },
        onError: (error) => {
            console.error('Send OTP error:', error);
            message.error(error?.response?.data?.message || 'Failed to send OTP');
        },
    });

    // Verify OTP mutation for agreement verification
    const verifyAgreementOtpMutation = useMutation({
        mutationFn: async ({ phoneNumber, otp }) => {
            const response = await apiClient.post('otp-verify', { data: phoneNumber, otp });
            return response;
        },
        onSuccess: (data) => {
            if (data?.status) {
                message.success('OTP verified successfully!');
                // Now call the agreement approval API
                approveMutation.mutate({
                    id: createdUserId,
                    payload: {
                        agreement_id: selectedAgreementId,
                        action: 'approve',
                        agreement_title: selectedAgreement?.title,
                        organizer_email: formState.email,
                        organizer_name: formState.name,
                        organization_name: formState.organisation,
                    },
                });
            } else {
                message.error(data?.message || 'Invalid OTP');
            }
        },
        onError: (error) => {
            console.error('Verify OTP error:', error);
            message.error(error?.response?.data?.message || 'Failed to verify OTP');
        },
    });

    // Agreement options for select dropdown
    const agreementOptions = useMemo(() => {
        const agreements = agreementsQuery.data || [];
        return agreements
            .filter((a) => a.status === 1 || a.status === true)
            .map((a) => ({ label: a.title, value: a.id }));
    }, [agreementsQuery.data]);

    return {
        // Queries
        userQuery,
        rolesQuery,
        agreementsQuery,
        eventsQuery,
        agreementOptions,
        // Mutations
        approveMutation,
        sendAgreementOtpMutation,
        verifyAgreementOtpMutation,
    };
};

/**
 * Custom validation rules helper
 */
export const createValidationRules = () => {
    // Conditional required validation
    const requiredIf = (condition, message) => ({
        required: condition,
        validator(_, value) {
            if (!condition) return Promise.resolve();
            if (value === undefined || value === null || value === '' ||
                (Array.isArray(value) && value.length === 0)) {
                return Promise.reject(new Error(message));
            }
            return Promise.resolve();
        }
    });

    // Number validation with range
    const numberRange = (min, max, errorMessage) => ({
        validator(_, value) {
            if (value === undefined || value === null || value === '') {
                return Promise.resolve();
            }
            const n = Number(value);
            if (!Number.isInteger(n)) {
                return Promise.reject(new Error('Must be an integer'));
            }
            if (n < min || n > max) {
                return Promise.reject(new Error(errorMessage || `Must be between ${min} and ${max}`));
            }
            return Promise.resolve();
        }
    });

    // Percentage validation
    const percentageValidator = (getFieldValue, convenienceFeeType) => ({
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
    });

    return {
        requiredIf,
        numberRange,
        percentageValidator,
    };
};

export default useProfileFormData;

import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Button, Alert, Typography, Divider, Space } from 'antd';
import { LockOutlined, DollarOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import api from 'auth/FetchInterceptor';
import { setRefundHashKey } from 'store/slices/refundSlice';

const { Text } = Typography;

// ===================== PASSWORD & OTP MODAL =====================
const PasswordModal = ({ open, onClose, onSuccess, loading }) => {
    const [step, setStep] = useState('password'); // 'password' | 'otp'
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch();

    // Step 1: Send password to get OTP
    const authenticatePasswordMutation = useMutation({
        mutationFn: async (password) => {
            const response = await api.post('refunds/password/otp', { password });
            return response;
        },
        onSuccess: (data) => {
            if (data.status) {
                setError('');
                // Move to OTP step
                setStep('otp');
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to send OTP');
        },
    });

    // Step 2: Verify OTP and password to get hash_key (valid for 30 mins)
    const verifyOtpMutation = useMutation({
        mutationFn: async ({ otp, password }) => {
            const response = await api.post('refunds/password/authenticate', {
                password,
                otp
            });
            return response;
        },
        onSuccess: (data) => {
            console.log(data, "data");

            if (data.status && data.data.hash_key) {
                setError('');
                // Store hash_key in Redux
                dispatch(setRefundHashKey({ hash_key: data.data.hash_key, password }));
                // Reset form
                setPassword('');
                setOtp('');
                setStep('password');
                // Proceed to next step
                onSuccess();
            } else {
                setError(data.message || 'OTP verification failed');
            }
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'OTP verification failed');
        },
    });

    const handlePasswordSubmit = () => {
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }
        authenticatePasswordMutation.mutate(password);
    };

    const handleOtpSubmit = () => {
        if (!otp.trim()) {
            setError('Please enter the OTP');
            return;
        }
        verifyOtpMutation.mutate({ otp, password });
    };

    const handleClose = () => {
        setPassword('');
        setOtp('');
        setError('');
        setStep('password');
        onClose();
    };

    const isLoading = authenticatePasswordMutation.isPending || verifyOtpMutation.isPending;

    return (
        <Modal
            title={
                <Space>
                    <LockOutlined />
                    <span>{step === 'password' ? 'Verify Password' : 'Verify OTP'}</span>
                </Space>
            }
            open={open}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={isLoading}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={isLoading}
                    onClick={step === 'password' ? handlePasswordSubmit : handleOtpSubmit}
                >
                    {step === 'password' ? 'Send OTP' : 'Verify OTP'}
                </Button>,
            ]}
            destroyOnClose
        >
            {error && (
                <Alert
                    type="error"
                    message={error}
                    showIcon
                    className="mt-3"
                />
            )}
            <div className="mt-3">
                {step === 'password' ? (
                    <>
                        <Text type="secondary">Enter your password to authorize the refund</Text>
                        <Input.Password
                            placeholder="Enter password"
                            prefix={<LockOutlined />}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            onPressEnter={handlePasswordSubmit}
                            className="mt-3"
                            size="large"
                            disabled={isLoading}
                        />
                    </>
                ) : (
                    <>
                        <Text type="secondary">Enter the OTP sent to your registered contact</Text>
                        <Input
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => {
                                setOtp(e.target.value);
                                setError('');
                            }}
                            onPressEnter={handleOtpSubmit}
                            className="mt-3"
                            size="large"
                            maxLength={6}
                            disabled={isLoading}
                        />
                    </>
                )}

            </div>
        </Modal>
    );
};

// ===================== REFUND MODAL =====================
const RefundPercentageModal = ({ open, onClose, bookingData, onRefundComplete }) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    // Get hash_key and password from Redux
    const dispatch = useDispatch();
    const { refundHashKey: hashKey, refundPassword } = useSelector((state) => state.refund);

    // Get the total amount from booking data
    const currentAmount = useMemo(() => {
        return bookingData?.total_amount || bookingData?.bookings?.[0]?.total_amount || 0;
    }, [bookingData]);
    const gateway = useMemo(() => {
        return bookingData?.gateway || bookingData?.bookings?.[0]?.gateway || 0;
    }, [bookingData]);

    // Determine if this is a master booking (has nested bookings array)
    const isMaster = useMemo(() => {
        return !!(bookingData?.bookings && bookingData.bookings.length > 0);
    }, [bookingData]);

    // API call for refund processing
    const processRefundMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await api.post(`refunds`, payload);
            return response;
        },
        onSuccess: (data) => {
            if (data.status) {
                // Success - close modal and trigger completion
                onRefundComplete?.();
                handleClose();
            }
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.message || 'Refund processing failed';
            const responseData = err.response?.data || {};
            setError(errorMessage);

            // Check if authorization has expired or new password is required
            if (responseData.authorization_expired === true || responseData.require_new_password === true) {
                // Clear stored credentials and re-open password modal
                dispatch(setRefundHashKey({ hash_key: null, password: null }));
                // Trigger parent to re-open password modal
                onClose();
            }
        },
    });

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('Please enter a reason for the refund');
            return;
        }

        const payload = {
            booking_id: bookingData?.id,
            gateway,
            is_master: isMaster,
            amount: currentAmount,
            reason: reason.trim(),
            notes: notes.trim(),
            hash_key: hashKey, // Include hash_key from Redux
            // password: refundPassword // Include password from Redux
        };

        processRefundMutation.mutate(payload);
    };

    const handleClose = () => {
        setReason('');
        setNotes('');
        setError('');
        onClose();
    };

    return (
        <Modal
            title={
                <Space>
                    <DollarOutlined />
                    <span>Process Refund</span>
                </Space>
            }
            open={open}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={processRefundMutation.isPending}
                    onClick={handleSubmit}
                    disabled={!reason.trim()}
                >
                    Process Refund
                </Button>,
            ]}
            destroyOnClose
            width={450}
        >
            {error && (
                <Alert
                    type="error"
                    message={error}
                    showIcon
                />
            )}
            <div className="mt-3">
                {/* Booking Amount Display */}
                <div className="p-3 rounded mb-4">
                    <div className="d-flex justify-content-between">
                        <Text>Booking Amount:</Text>
                        <Text strong className="fs-5 text-primary">₹{currentAmount}</Text>
                    </div>
                </div>

                {/* Reason Input */}
                <div className="mb-3">
                    <Text type="secondary">Reason for Refund <Text type="danger">*</Text></Text>
                    <Input
                        placeholder="Enter reason for refund"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            setError('');
                        }}
                        className="mt-2"
                        size="large"
                        maxLength={200}
                        showCount
                    />
                </div>

                {/* Notes Input */}
                <div className="mb-3">
                    <Text type="secondary">Additional Notes</Text>
                    <Input.TextArea
                        placeholder="Enter any additional notes (optional)"
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            setError('');
                        }}
                        className="mt-2"
                        size="large"
                        rows={4}
                        maxLength={500}
                        showCount
                    />
                </div>


            </div>
        </Modal>
    );
};

// ===================== MAIN REFUND MODAL COMPONENT =====================
const RefundModal = ({ bookingData, onClose, onRefundComplete }) => {
    const [step, setStep] = useState('password'); // 'password' | 'refund'
    const [isOpen, setIsOpen] = useState(false);

    // Get stored credentials from Redux
    const { refundHashKey, refundPassword } = useSelector((state) => state.refund);

    // Open modal when bookingData is provided
    useEffect(() => {
        if (bookingData) {
            setIsOpen(true);
            // Skip password step if credentials are already stored
            if (refundHashKey && refundPassword) {
                setStep('refund');
            } else {
                setStep('password');
            }
        } else {
            setIsOpen(false);
        }
    }, [bookingData, refundHashKey, refundPassword]);

    const handlePasswordSuccess = () => {
        setStep('refund');
    };

    const handleClose = () => {
        setIsOpen(false);
        setStep('password');
        onClose?.();
    };

    const handleRefundComplete = () => {
        setIsOpen(false);
        setStep('password');
        onRefundComplete?.();
    };

    if (!bookingData) return null;

    return (
        <>
            {/* Step 1: Password Verification */}
            <PasswordModal
                open={isOpen && step === 'password'}
                onClose={handleClose}
                onSuccess={handlePasswordSuccess}
            />

            {/* Step 2: Refund Entry */}
            <RefundPercentageModal
                open={isOpen && step === 'refund'}
                onClose={handleClose}
                bookingData={bookingData}
                onRefundComplete={handleRefundComplete}
            />
        </>
    );
};

export default RefundModal;

import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Button, Alert, Typography, Divider, Space } from 'antd';
import { LockOutlined, DollarOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

const { Text } = Typography;

// ===================== PASSWORD MODAL =====================
const PasswordModal = ({ open, onClose, onSuccess, loading }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // API call for password verification
    const verifyPasswordMutation = useMutation({
        mutationFn: async (password) => {
            // Dummy API call for password verification
            // Replace with actual API: await api.post('refunds/verify-password', { password });
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { status: true, message: 'Password verified successfully' };
        },
        onSuccess: (data) => {
            if (data.status) {
                setError('');
                setPassword('');
                onSuccess();
            } else {
                setError(data.message || 'Invalid password');
            }
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Password verification failed');
        },
    });

    const handleSubmit = () => {
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }
        verifyPasswordMutation.mutate(password);
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal
            title={
                <Space>
                    <LockOutlined />
                    <span>Verify Password</span>
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
                    loading={verifyPasswordMutation.isPending}
                    onClick={handleSubmit}
                >
                    Verify
                </Button>,
            ]}
            destroyOnClose
        >
            <div className="mt-3">
                <Text type="secondary">Enter your password to authorize the refund</Text>
                <Input.Password
                    placeholder="Enter password"
                    prefix={<LockOutlined />}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    onPressEnter={handleSubmit}
                    className="mt-3"
                    size="large"
                />
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        showIcon
                        className="mt-3"
                    />
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

    // Get the total amount from booking data
    const currentAmount = useMemo(() => {
        return bookingData?.total_amount || bookingData?.bookings?.[0]?.total_amount || 0;
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
                // Modal.success({
                //     title: data.approval_require ? 'Approval Required' : 'Refund Successful',
                //     content: data.approval_require
                //         ? 'Your refund request has been submitted and is pending admin approval. You will be notified once it is approved.'
                //         : 'The refund has been processed successfully.',
                //     onOk: () => {
                //         onRefundComplete?.();
                //         handleClose();
                //     },
                // });
            }
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Refund processing failed');
        },
    });

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('Please enter a reason for the refund');
            return;
        }

        const payload = {
            booking_id: bookingData?.id,
            is_master: isMaster,
            amount: currentAmount,
            reason: reason.trim(),
            notes: notes.trim()
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

                {error && (
                    <Alert
                        type="error"
                        message={error}
                        showIcon
                    />
                )}
            </div>
        </Modal>
    );
};

// ===================== MAIN REFUND MODAL COMPONENT =====================
const RefundModal = ({ bookingData, onClose, onRefundComplete }) => {
    const [step, setStep] = useState('password'); // 'password' | 'refund'
    const [isOpen, setIsOpen] = useState(false);

    // Open modal when bookingData is provided
    useEffect(() => {
        if (bookingData) {
            setIsOpen(true);
            setStep('password');
        } else {
            setIsOpen(false);
        }
    }, [bookingData]);

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

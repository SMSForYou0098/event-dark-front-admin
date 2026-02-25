import React from 'react';
import { Modal, Button, Space, Alert } from 'antd';
import OtpInput from './OtpInput';

/**
 * Reusable OTP Verification Modal Component
 * Used for both profile edit verification and agreement assignment verification
 */
const OtpVerificationModal = ({
    open,
    onClose,
    onVerify,
    onResend,
    phoneNumber,
    title = "Verify OTP",
    description,
    otpValue,
    onOtpChange,
    isVerifying = false,
    isSending = false,
    verifyButtonText = "Verify",
    cooldownSeconds = 0, // Optional: remaining cooldown time in seconds
}) => {
    const defaultDescription = `Please enter the OTP sent to ${phoneNumber} to complete the verification.`;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Prevent default if needed, though usually fine for Enter in inputs unless in a form
            if (otpValue && otpValue.length >= 6) {
                onVerify();
            }
        }
    };

    return (
        <Modal
            open={open}
            title={title}
            onCancel={onClose}
            footer={null}
            maskClosable={false}
            destroyOnClose
        >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Alert
                    // message="OTP Verification Required"
                    description={description || defaultDescription}
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <p style={{ marginBottom: 16 }}>
                    Enter the 6-digit OTP sent to your phone
                </p>
                <OtpInput
                    value={otpValue}
                    onChange={onOtpChange}
                    onKeyDown={handleKeyDown}
                />
                <div style={{ marginTop: 24 }}>
                    <Space>
                        <Button onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                onOtpChange(''); // Clear OTP input on resend
                                onResend();
                            }}
                            loading={isSending}
                            disabled={cooldownSeconds > 0}
                        >
                            {cooldownSeconds > 0
                                ? `Resend OTP (${Math.floor(cooldownSeconds / 60)}:${String(cooldownSeconds % 60).padStart(2, '0')})`
                                : 'Resend OTP'
                            }
                        </Button>
                        <Button
                            type="primary"
                            onClick={onVerify}
                            loading={isVerifying}
                            disabled={!otpValue || otpValue.length < 6}
                        >
                            {verifyButtonText}
                        </Button>
                    </Space>
                </div>
            </div>
        </Modal>
    );
};

export default OtpVerificationModal;

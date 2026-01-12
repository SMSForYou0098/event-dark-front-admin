import React from 'react';
import { Modal, Button, Input, Space, Alert } from 'antd';

// Check if Input.OTP exists (Ant Design v5.16+)
const OTPInput = Input.OTP || Input;

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
}) => {
    const defaultDescription = `Please enter the OTP sent to ${phoneNumber} to complete the verification.`;

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
                {Input.OTP ? (
                    <Input.OTP
                        length={6}
                        value={otpValue}
                        onChange={onOtpChange}
                        style={{ marginBottom: 16 }}
                    />
                ) : (
                    <Input
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => onOtpChange(e.target.value)}
                        style={{ marginBottom: 16, width: 200, textAlign: 'center', letterSpacing: '0.5em', fontSize: 18 }}
                        placeholder="000000"
                    />
                )}
                <div style={{ marginTop: 24 }}>
                    <Space>
                        <Button onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="link"
                            onClick={onResend}
                            loading={isSending}
                        >
                            Resend OTP
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

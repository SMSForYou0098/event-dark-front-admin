import React, { useState, useEffect } from 'react';
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
    cooldownSeconds = 0, // Optional: remaining cooldown time in seconds from parent
}) => {
    const defaultDescription = `Please enter the OTP sent to ${phoneNumber} to complete the verification.`;
    const [internalCooldown, setInternalCooldown] = useState(0);

    // Initial cooldown and countdown logic
    useEffect(() => {
        let timer;
        if (open) {
            // Set initial 30s cooldown when modal opens
            setInternalCooldown(30);

            timer = setInterval(() => {
                setInternalCooldown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            setInternalCooldown(0);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [open]);

    const activeCooldown = Math.max(cooldownSeconds, internalCooldown);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Prevent default if needed, though usually fine for Enter in inputs unless in a form
            if (otpValue && otpValue.length >= 6) {
                onVerify();
            }
        }
    };

    const handleResend = () => {
        onOtpChange(''); // Clear OTP input on resend
        onResend();
        setInternalCooldown(30); // Reset internal cooldown after clicking resend
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
                {/* <Alert
                    // message="OTP Verification Required"
                    description={description || defaultDescription}
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                /> */}

                <p style={{ marginBottom: 16 }}>
                    {description || defaultDescription}
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
                            onClick={handleResend}
                            loading={isSending}
                            disabled={activeCooldown > 0}
                        >
                            {activeCooldown > 0
                                ? `Resend OTP (${Math.floor(activeCooldown / 60)}:${String(activeCooldown % 60).padStart(2, '0')})`
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

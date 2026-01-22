// GatewayOTPModal - Reusable OTP verification UI component
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Typography, Space, message } from 'antd';
import { SafetyOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const GatewayOTPModal = ({
  open,
  onClose,
  onVerify,
  onResend,
  title = 'OTP Verification',
  description = 'Please enter the OTP sent to your registered email/phone',
  otpLength = 6,
  isVerifying = false,
  isSending = false,
  resendTimer = 0,
}) => {
  const [otp, setOtp] = useState(new Array(otpLength).fill(''));
  const inputRefs = useRef([]);

  // Focus first input when modal opens
  useEffect(() => {
    if (open && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  // Reset OTP when modal closes
  useEffect(() => {
    if (!open) {
      setOtp(new Array(otpLength).fill(''));
    }
  }, [open, otpLength]);

  const handleClose = () => {
    setOtp(new Array(otpLength).fill(''));
    onClose?.();
  };

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === otpLength) {
      onVerify?.(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, otpLength);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < otpLength) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, otpLength) - 1;
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if complete
    if (newOtp.every(digit => digit !== '')) {
      onVerify?.(newOtp.join(''));
    }
  };

  const handleVerifyClick = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== otpLength) {
      message.warning(`Please enter ${otpLength} digit OTP`);
      return;
    }
    onVerify?.(otpCode);
  };

  const handleResendClick = () => {
    if (resendTimer > 0) return;
    setOtp(new Array(otpLength).fill(''));
    onResend?.();
  };

  const isLoading = isVerifying || isSending;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={420}
      maskClosable={false}
      destroyOnClose
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        
        <Title level={4} style={{ marginBottom: 8 }}>
          {title}
        </Title>
        
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          {description}
        </Text>

        {/* OTP Input Fields */}
        <Space size="middle" style={{ marginBottom: 24 }}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              maxLength={1}
              disabled={isLoading}
              style={{
                width: 50,
                height: 50,
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                borderRadius: 8,
              }}
            />
          ))}
        </Space>

        {/* Verify Button */}
        <Button
          type="primary"
          size="large"
          block
          icon={<CheckCircleOutlined />}
          onClick={handleVerifyClick}
          loading={isVerifying}
          disabled={otp.some(digit => digit === '') || isLoading}
          style={{ marginBottom: 16, height: 44 }}
        >
          {isVerifying ? 'Verifying...' : 'Verify OTP'}
        </Button>

        {/* Resend OTP */}
        <div style={{ marginTop: 8 }}>
          {resendTimer > 0 ? (
            <Text type="secondary">
              Resend OTP in <Text strong>{resendTimer}s</Text>
            </Text>
          ) : (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={handleResendClick}
              loading={isSending}
              disabled={isLoading}
            >
              Resend OTP
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GatewayOTPModal;

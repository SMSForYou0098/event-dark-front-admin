import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Drawer, Input, Button, Alert, Badge, Card, Space, Typography, Avatar } from 'antd';
import { User, Mail, Phone, ArrowRight, CheckCircle, AlertCircle, KeyRound, RotateCcw, Ticket, Send } from 'lucide-react';
import { getUserByPhone, createTransferUser, transferBooking, verifyTransferOtp } from 'services/transferService';
import { useMyContext } from 'Context/MyContextProvider';
import OtpInput from 'components/shared-components/OtpInput';

const { Text } = Typography;

// Step Indicator Component (custom styling with Ant Design layout)
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Find User' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'Transfer' },
  ];

  const activeColor = 'var(--primary-color)';
  const inactiveBorder = 'rgba(255, 255, 255, 0.6)';
  const inactiveText = 'rgba(255, 255, 255, 0.65)';

  return (
    <div
      className="mb-4 pb-3"
      style={{ borderBottom: '1px solid var(--bs-border-color)' }}
    >
      <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
        {steps.map((step, index) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          const isPastOrCurrent = currentStep >= step.num;

          return (
            <React.Fragment key={step.num}>
              <Space align="center" className='' size={8}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${isPastOrCurrent ? activeColor : inactiveBorder}`,
                    background: isPastOrCurrent ? activeColor : 'transparent',
                    color: isPastOrCurrent ? '#fff' : inactiveBorder,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {step.num}
                </div>
                <Text
                  strong={isActive}
                  style={{
                    color: isPastOrCurrent ? '#fff' : inactiveText,
                    fontSize: 13,
                    minWidth: 60,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',

                  }}
                >
                  {step.label}
                </Text>
              </Space>

              {index < steps.length - 1 && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    borderRadius: 1,
                    background: isCompleted ? activeColor : 'rgba(255, 255, 255, 0.25)',
                    margin: '0 4px',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Space>
    </div>
  );
};

// User Info Card Component (using Ant Design components)
const UserInfoCard = ({ user, phoneNumber, isNew = false, variant = 'success' }) => (
  <Card size="small" className="mb-3 gray-bg" bordered={false}>
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space align="center">
          <Space direction="vertical" size={0}>
            <Text strong>{user?.name || 'Unknown'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {phoneNumber}
            </Text>
          </Space>
        </Space>
      </Space>

      {user?.email && (
        <Space align="center" size={6}>
          <Mail size={14} className="text-white" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user.email}
          </Text>
        </Space>
      )}
    </Space>
  </Card>
);

const TransferBookingDrawer = ({ visible, onClose, booking, onTransferSuccess }) => {
  const { UserData, successAlert } = useMyContext();

  // Get event_id and OTP settings from booking
  const eventData = useMemo(() => {
    const normalizeBooking = booking?.bookings ? booking.bookings[0] : booking;
    return {
      eventId: normalizeBooking?.event?.id || normalizeBooking?.event_id,
      otpRequired: normalizeBooking?.event?.event_controls?.ticket_transfer_otp ?? true,
      eventName: normalizeBooking?.event?.name || 'Event',
    };
  }, [booking]);

  // Form data state (consolidated)
  const [formData, setFormData] = useState({ phone: '', name: '', email: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [userFound, setUserFound] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  // OTP states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [transferHashKey, setTransferHashKey] = useState(null);

  // Transfer states
  const [quantity, setQuantity] = useState(1);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get max quantity from booking
  const maxQuantity = booking?.bookings?.length || 1;

  // Calculate current step
  const currentStep = useMemo(() => {
    if (otpVerified) return 3;
    if (otpSent || (userFound !== null && !eventData.otpRequired)) return 2;
    if (userFound !== null) return 2;
    return 1;
  }, [userFound, otpSent, otpVerified, eventData.otpRequired]);

  // Refs for inputs
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  // Focus OTP input when OTP sent
  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({ phone: '', name: '', email: '' });
    setUserFound(null);
    setTargetUser(null);
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setTransferHashKey(null);
    setQuantity(1);
    setError('');
    setSuccess('');
  }, []);

  // Handle drawer close
  const handleClose = useCallback(() => {
    resetForm();
    onClose?.();
  }, [resetForm, onClose]);

  // Search user by phone
  const handleSearchUser = useCallback(async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSearching(true);
    setError('');
    setUserFound(null);
    setTargetUser(null);

    try {
      const response = await getUserByPhone(formData.phone);
      if (response.status && response.user) {
        setUserFound(true);
        setTargetUser(response.user);
      } else {
        setUserFound(false);
        setTargetUser(null);
      }
    } catch (err) {
      setError('Failed to search user');
      setUserFound(false);
    } finally {
      setIsSearching(false);
    }
  }, [formData.phone]);

  // Auto-search when phone number reaches 10 digits
  useEffect(() => {
    if (formData.phone.length === 10 && userFound === null && !isSearching) {
      handleSearchUser();
    }
  }, [formData.phone, userFound, isSearching, handleSearchUser]);

  // Send OTP / verify without OTP based on settings
  const handleSendOtp = useCallback(async () => {
    if (userFound === false && !formData.name.trim()) {
      setError("Please enter the recipient's name");
      return;
    }

    setIsSendingOtp(true);
    setError('');

    try {
      const payload = {
        number: formData.phone,
        event_id: eventData.eventId,
        name: userFound === true ? targetUser?.name : formData.name,
        email: userFound === true ? targetUser?.email : formData.email || undefined,
      };

      const response = await createTransferUser(payload);

      if (response.status) {
        if (response.user) {
          setTargetUser(response.user);
        }

        if (!eventData.otpRequired) {
          if (response.data?.hash_key) {
            setTransferHashKey(response.data.hash_key);
          }
          if (response.data?.user_id) {
            setTargetUser((prev) => ({
              ...prev,
              id: response.data.user_id,
            }));
          }
          setOtpVerified(true);
          setSuccess('Verified! Select quantity and transfer.');
        } else {
          setOtpSent(true);
          setSuccess(`OTP sent to ${formData.phone}`);
        }
      } else {
        setError(response.message || 'Failed to verify user');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  }, [formData, eventData, userFound, targetUser]);

  // Handle OTP verification
  const handleVerifyOtp = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setError('');

    try {
      const verifyResponse = await verifyTransferOtp({
        number: formData.phone,
        otp,
        event_id: eventData.eventId,
      });

      if (verifyResponse.status) {
        setOtpVerified(true);
        setSuccess('Verified! Select quantity and transfer.');
        if (verifyResponse.data) {
          setTransferHashKey(verifyResponse.data.hash_key);
          setTargetUser((prev) => ({
            ...prev,
            id: verifyResponse.data.user_id,
          }));
        }
      } else {
        setError(verifyResponse.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Failed to verify OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [otp, formData.phone, eventData.eventId]);

  // Handle transfer
  const handleTransfer = useCallback(async () => {
    if (!otpVerified) {
      setError('Please complete verification first');
      return;
    }

    setIsTransferring(true);
    setError('');
    setSuccess('');

    try {
      const transferPayload = {
        is_master: booking?.bookings?.length > 1,
        booking_id: booking?.id,
        transfer_from: UserData?.id,
        transfer_to: targetUser?.id,
        hash_key: transferHashKey,
        quantity,
        event_id: eventData.eventId,
      };

      const transferResponse = await transferBooking(transferPayload);

      if (transferResponse.status) {
        successAlert(transferResponse.message || 'Booking transferred successfully!');
        handleClose();
        onTransferSuccess?.();
      } else {
        setError(transferResponse.message || 'Failed to transfer booking');
      }
    } catch (err) {
      setError('An error occurred during transfer');
    } finally {
      setIsTransferring(false);
    }
  }, [
    otpVerified,
    booking,
    UserData,
    targetUser,
    quantity,
    handleClose,
    transferHashKey,
    eventData.eventId,
    successAlert,
    onTransferSuccess,
  ]);

  return (
    <Drawer
      title={
        <div className="d-flex flex-column">
          <span className="fw-semibold">Transfer Booking</span>
          <small className="text-white">
            Securely move tickets to another attendee
          </small>
        </div>
      }
      open={visible}
      onClose={handleClose}
      width={480}
      destroyOnClose
      bodyStyle={{ padding: 0 }}
    >
      <div className="h-100 d-flex flex-column">
        {/* Header: steps + booking summary */}
        <div className="p-3 pb-2 border-bottom">
          <StepIndicator currentStep={currentStep} />

          <div className="d-flex align-items-center gap-2 p-2 rounded-3 gray-bg mt-1">
            <div className="flex-grow-1">
              <small className="text-white d-block mb-2">
                Transferring
              </small>
              <span className="fw-medium" style={{ fontSize: '0.85rem' }}>
                {maxQuantity} ticket(s) • {eventData.eventName}
              </span>
            </div>
            <Badge
              color={eventData.otpRequired ? 'blue' : 'green'}
              text={eventData.otpRequired ? 'OTP verification' : 'Instant transfer'}
            />
          </div>
        </div>

        {/* Body: main content */}
        <div className="px-3 pt-3 pb-3 flex-grow-1 overflow-auto">
          {/* Error/Success Messages */}
          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              className="mb-3"
            />
          )}
          {success && (
            <Alert
              type="success"
              showIcon
              message={success}
              className="mb-3"
            />
          )}

          {/* Step 1: Phone Number Input */}
          <div className="mb-3">
            <label className="small text-white mb-2 d-flex align-items-center gap-1">
              <Phone size={14} />
              Recipient&apos;s Phone Number
            </label>
            <Input
              ref={phoneInputRef}
              type="tel"
              placeholder="Enter 10-digit number"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: e.target.value.replace(/\D/g, ''),
                }))
              }
              maxLength={10}
              disabled={isSearching || userFound !== null}
              className="gray-bg card-glassmorphism__input rounded-3"
              style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}
            />
            {formData.phone.length > 0 && formData.phone.length < 10 && (
              <div className="text-white small">
                {10 - formData.phone.length} more digits needed
              </div>
            )}
          </div>

          {/* User Found Display */}
          {userFound === true && targetUser && !otpSent && !otpVerified && (
            <div className="animate__animated animate__fadeIn">
              <UserInfoCard
                user={targetUser}
                phoneNumber={formData.phone}
                variant="success"
              />
              <Button
                type="primary"
                onClick={handleSendOtp}
                loading={isSendingOtp}
                disabled={isSendingOtp}
                className="w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
              >
                {!isSendingOtp && <Send size={18} />}
                {eventData.otpRequired ? 'Send Verification OTP' : 'Verify & Continue'}
              </Button>
            </div>
          )}

          {/* User Not Found - Create Form */}
          {userFound === false && !otpSent && !otpVerified && (
            <div className="animate__animated animate__fadeIn">
              <div
                className="rounded-3 p-3 mb-3"
                style={{
                  background: 'var(--bs-warning-bg-subtle)',
                  border: '1px solid var(--bs-warning-border-subtle)',
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={18} className="text-warning" />
                  <span className="fw-medium">New user - Enter details</span>
                </div>

                <div className="mb-3">
                  <label className="small text-white mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter recipient's name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    size="large"
                  />
                </div>

                <div>
                  <label className="small text-white mb-1">
                    Email <span className="text-white">(Optional)</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    size="large"
                  />
                </div>
              </div>

              <Button
                type="primary"
                onClick={handleSendOtp}
                loading={isSendingOtp}
                disabled={isSendingOtp || !formData.name.trim()}
                className="w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
              >
                {!isSendingOtp && <Send size={18} />}
                {eventData.otpRequired ? 'Send Verification OTP' : 'Verify & Continue'}
              </Button>
            </div>
          )}

          {/* OTP Input */}
          {otpSent && !otpVerified && (
            <div className="animate__animated animate__fadeIn">
              <UserInfoCard
                user={targetUser || { name: formData.name }}
                phoneNumber={formData.phone}
                isNew={userFound === false}
                variant="info"
              />

              <div
                className="rounded-3 p-3 mb-3 text-center"
                style={{
                  background: 'var(--bs-info-bg-subtle)',
                  border: '1px solid var(--bs-info-border-subtle)',
                }}
              >
                <KeyRound size={24} className="text-info mb-2" />
                <p className="mb-3 small">
                  Enter the 6-digit OTP sent to <strong>{formData.phone}</strong>
                </p>

                <OtpInput
                  value={otp}
                  onChange={(value) => setOtp(String(value).replace(/\D/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otp.length === 6 && !isVerifyingOtp) {
                      handleVerifyOtp();
                    }
                  }}
                  length={6}
                  style={{
                    fontSize: '1.5rem',
                    letterSpacing: '0.5em',
                    fontWeight: 600,
                  }}
                />

                <Button
                  type="primary"
                  onClick={handleVerifyOtp}
                  loading={isVerifyingOtp}
                  disabled={isVerifyingOtp || otp.length !== 6}
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  {!isVerifyingOtp && <CheckCircle size={18} />}
                  Verify OTP
                </Button>
              </div>
            </div>
          )}

          {/* Transfer Ready */}
          {otpVerified && (
            <div className="animate__animated animate__fadeIn">
              <UserInfoCard
                user={targetUser || { name: formData.name }}
                phoneNumber={formData.phone}
                isNew={userFound === false}
                variant="success"
              />

              <div className="mb-4">
                <label className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-white">Number of Tickets to Transfer</span>
                  <Badge color="blue" text={`${quantity} of ${maxQuantity}`} />
                </label>

                {maxQuantity > 1 ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--bs-border-color)',
                        minWidth: 220,
                      }}
                    >
                      <Button
                        type="text"
                        size="large"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        style={{
                          width: 56,
                          height: 48,
                          borderRadius: 0,
                        }}
                      >
                        −
                      </Button>
                      <div
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          fontWeight: 600,
                        }}
                      >
                        {quantity}
                      </div>
                      <Button
                        type="text"
                        size="large"
                        onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                        disabled={quantity >= maxQuantity}
                        style={{
                          width: 56,
                          height: 48,
                          borderRadius: 0,
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2 text-center">
                    <span className="fw-semibold">1 Ticket</span>
                  </div>
                )}
              </div>

              <Button
                type="primary"
                onClick={handleTransfer}
                loading={isTransferring}
                disabled={isTransferring}
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                {!isTransferring && <ArrowRight size={18} />}
                {`Transfer ${quantity} Ticket${quantity > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </div>

        {/* Footer: reset */}
        {userFound !== null && (
          <div className="p-3 border-top bg-light-subtle">
            <Button
              type="link"
              size="small"
              onClick={resetForm}
              className="w-100 text-white d-flex align-items-center justify-content-center gap-2"
            >
              <RotateCcw size={14} />
              Start Over
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default TransferBookingDrawer;


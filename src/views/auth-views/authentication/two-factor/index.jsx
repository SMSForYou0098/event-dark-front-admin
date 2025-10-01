import React, { memo, Fragment, useState, useEffect, useCallback, useRef } from 'react';

// Ant Design
import { Row, Col } from 'antd';
import { Card, Form, Input, Button, Alert, Typography, message } from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

// Router / Redux
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout, signIn } from '../../../../store/slices/authSlice';

// Utils
import axios from 'axios';
import { API_BASE_URL } from 'constants/ApiConstant';
import { persistor } from 'store';
import { AUTH_PREFIX_PATH } from 'configs/AppConfig';

const { Title, Paragraph, Text } = Typography;

const Twofactor = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const number = location?.state?.data;
  const path = location?.state?.path;

  const [otp, setOTP] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timerVisible, setTimerVisible] = useState(true);
  const [otpSent, setOtpSent] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs to prevent duplicate dispatches
  const isVerifyingRef = useRef(false);
  const isSendingOtpRef = useRef(false);
  const hasShownSuccessRef = useRef(false);

  // On mount: ensure we have number; toast success (once)
  useEffect(() => {
    if (number && !hasShownSuccessRef.current) {
      message.success('OTP has been sent successfully!');
      hasShownSuccessRef.current = true;
    } else if (!number) {
      navigate(`${AUTH_PREFIX_PATH}/sign-in`);
    }
  }, [number, navigate]);

  // Leave protection + reset local UI state
  useEffect(() => {
    setOTP('');
    setAttempts(0);
    setError('');
    setLoading(false);

    const isConfirmedLeave = sessionStorage.getItem('isConfirmedLeave');
    if (isConfirmedLeave) {
      navigate(`${AUTH_PREFIX_PATH}/sign-in`);
      sessionStorage.removeItem('isConfirmedLeave');
    }

    const handleBeforeUnload = (event) => {
      const confirmationMessage = 'Are you sure you want to leave? Your current data will be lost.';
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    };
    
    const handleUnload = () => {
      sessionStorage.setItem('isConfirmedLeave', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (timerVisible && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setOtpSent(false);
      setTimerVisible(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerVisible, countdown]);

  // Memoized verify OTP handler with ref guard
  const handleVerifyOtp = useCallback(async () => {
    // Guard against duplicate calls
    if (isVerifyingRef.current) {
      return;
    }

    if (!otp) {
      setAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= 3) {
          dispatch(logout());
          persistor.purge();
          navigate(`${AUTH_PREFIX_PATH}/sign-in`);
        }
        return newAttempts;
      });
      return;
    }

    try {
      isVerifyingRef.current = true;
      setLoading(true);
      setError('');

      const payload = { otp, number };
      const action = await dispatch(signIn(payload));

      if (action?.type === 'login/fulfilled') {
        message.success('Login successful');
        navigate(path ?? '/dashboard');
      } else {
        setError(action?.payload || 'Invalid OTP');
      }
    } catch (e) {
      console.error('Verify OTP error:', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  }, [otp, number, dispatch, navigate, path]);

  // Memoized resend OTP handler with ref guard
  const handleSendOtp = useCallback(async () => {
    // Guard against duplicate calls
    if (isSendingOtpRef.current) {
      return;
    }

    try {
      isSendingOtpRef.current = true;
      setLoading(true);
      setOTP('');
      setError('');

      await axios.post(`${API_BASE_URL}verify-user`, { data: number });

      setCountdown(30);
      setTimerVisible(true);
      setOtpSent(true);
      message.success('OTP has been re-sent successfully!');
    } catch (err) {
      console.error('Resend OTP error:', err);
      message.error('Failed to resend OTP. Please try again.');
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
      isSendingOtpRef.current = false;
    }
  }, [number]);

  // Memoized key handler
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && otp && !isVerifyingRef.current) {
        handleVerifyOtp();
      }
    },
    [otp, handleVerifyOtp]
  );

  // Memoized back handler
  const handleBack = useCallback(() => {
    navigate(`${AUTH_PREFIX_PATH}/sign-in`);
  }, [navigate]);

  return (
    <Fragment>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Row justify="end" style={{ width: '100%', margin: 0 }}>
          <Col xs={22} sm={18} md={14} lg={10} xl={8} xxl={6}>
            <Card bordered style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderRadius: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="link"
                  onClick={handleBack}
                  icon={<ArrowLeftOutlined />}
                  style={{ padding: 0 }}
                >
                  Back to Sign In
                </Button>
              </div>

              <Title level={3} style={{ marginBottom: 8 }}>
                Two-Step Verification
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Enter the 6-digit OTP sent to your registered mobile number and email address.
              </Paragraph>

              {error && (
                <Alert
                  type="error"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  message={error}
                  closable
                  onClose={() => setError('')}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form layout="vertical" onFinish={handleVerifyOtp}>
                <Form.Item
                  label="One-Time Password (OTP)"
                  name="otp"
                  validateStatus={error ? 'error' : ''}
                  help={attempts > 0 && !otp ? `Please enter OTP (Attempt ${attempts}/3)` : ''}
                >
                  <Input
                    size="large"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only digits
                      setOTP(value);
                      if (error) setError(''); // Clear error on input
                    }}
                    onKeyDown={handleKeyDown}
                    maxLength={6}
                    autoFocus
                    disabled={loading}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    disabled={!otp || otp.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {timerVisible && otpSent ? (
                  <Text type="secondary">
                    Resend OTP in <Text strong>{countdown}</Text> seconds
                  </Text>
                ) : (
                  <Button
                    type="link"
                    onClick={handleSendOtp}
                    size="large"
                    disabled={loading}
                    style={{ padding: 0 }}
                  >
                    {loading ? 'Sending...' : "Didn't receive OTP? Resend"}
                  </Button>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Fragment>
  );
});

Twofactor.displayName = 'Twofactor';
export default Twofactor;
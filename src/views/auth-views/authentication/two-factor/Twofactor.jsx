import React, { memo, Fragment, useState, useEffect, useCallback, useRef } from 'react';
import { Form, Button, Alert, Typography, message, Row, Col } from 'antd';
import { InputOTP } from 'antd-input-otp';
import { ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout, signIn } from '../../../../store/slices/authSlice';
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

  // 🔧 OTP is an array of strings (matches antd-input-otp)
  const [otp, setOTP] = useState([]);

  const [attempts, setAttempts] = useState(0);
  const [timerVisible, setTimerVisible] = useState(true);
  const [otpSent, setOtpSent] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isVerifyingRef = useRef(false);
  const isSendingOtpRef = useRef(false);
  const hasShownSuccessRef = useRef(false);

  // Utility: joined OTP code
  const code = otp.join('');
  const isCodeComplete = code.length === 6;

  useEffect(() => {
    if (number && !hasShownSuccessRef.current) {
      message.success('OTP has been sent successfully!');
      hasShownSuccessRef.current = true;
    } else if (!number) {
      navigate(`${AUTH_PREFIX_PATH}/sign-in`);
    }
  }, [number, navigate]);

  useEffect(() => {
    setOTP([]); // clear OTP on mount
    setAttempts(0);
    setError('');
    setLoading(false);

    const isConfirmedLeave = sessionStorage.getItem('isConfirmedLeave');
    if (isConfirmedLeave) {
      navigate(`${AUTH_PREFIX_PATH}/sign-in`);
      sessionStorage.removeItem('isConfirmedLeave');
    }

    const handleBeforeUnload = (event) => {
      const msg = 'Are you sure you want to leave? Your current data will be lost.';
      event.returnValue = msg;
      return msg;
    };
    const handleUnload = () => sessionStorage.setItem('isConfirmedLeave', 'true');

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [navigate]);

  useEffect(() => {
    let timer;
    if (timerVisible && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setOtpSent(false);
      setTimerVisible(false);
    }
    return () => timer && clearInterval(timer);
  }, [timerVisible, countdown]);

  const handleVerifyOtp = useCallback(async () => {
    if (isVerifyingRef.current) return;

    if (!isCodeComplete) {
      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          dispatch(logout());
          persistor.purge();
          navigate(`${AUTH_PREFIX_PATH}/sign-in`);
        }
        return next;
      });
      return;
    }

    try {
      isVerifyingRef.current = true;
      setLoading(true);
      setError('');

      // ✅ Send joined code string
      const payload = { otp: code, number };
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
  }, [code, isCodeComplete, number, dispatch, navigate, path]);

  // 🔁 Auto-submit when code complete
  useEffect(() => {
    if (isCodeComplete && !isVerifyingRef.current) {
      handleVerifyOtp();
    }
  }, [isCodeComplete, handleVerifyOtp]);

  const handleSendOtp = useCallback(async () => {
    if (isSendingOtpRef.current) return;
    try {
      isSendingOtpRef.current = true;
      setLoading(true);
      setOTP([]); // ✅ clear input boxes
      setError('');

      await axios.post(`${API_BASE_URL}verify-user`, { data: number });

      setCountdown(30);
      setTimerVisible(true);
      setOtpSent(true);
      message.success('OTP has been re-sent successfully!');
    } catch (err) {
      console.error('Resend OTP error:', err);
      message.error('Failed to resend OTP. Please try again.');
      setError(err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
      isSendingOtpRef.current = false;
    }
  }, [number]);

  const handleBack = useCallback(() => {
    navigate(`${AUTH_PREFIX_PATH}/sign-in`);
  }, [navigate]);

  // ✅ antd-input-otp gives/accepts string[]
  const handleOtpChange = useCallback((value) => {
    setOTP(value);
    if (error) setError('');
  }, [error]);

  return (
    <Fragment className="two-factor-authentication mt-2">
      {/* <Title level={3} className="mb-2">Two-Step Verification</Title> */}
      {/* <Paragraph type="secondary" className="mb-3">
        Enter the 6-digit OTP sent to your registered mobile number and email address.
      </Paragraph> */}

      {error && (
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={error}
          closable
          onClose={() => setError('')}
          className="mb-3"
        />
      )}

      <Form layout="vertical" onFinish={handleVerifyOtp}>
        <Form.Item
          label="One-Time Password (OTP)"
          name="otp"
          validateStatus={error ? 'error' : ''}
          help={attempts > 0 && !isCodeComplete ? `Please enter OTP (Attempt ${attempts}/3)` : ''}
        >
          <InputOTP
            length={6}
            size="large"
            value={otp}               // ✅ string[]
            onChange={handleOtpChange}
            disabled={loading}
            autoFocus
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            disabled={!isCodeComplete} // ✅ only enable when 6 digits filled
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </Form.Item>
      </Form>

      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Button
            className="ant-btn-tertiary w-100"
            onClick={handleBack}
            icon={<ArrowLeftOutlined />}
          >
            Back to Sign In
          </Button>
        </Col>
        <Col xs={24} sm={12} className="text-end">
          <div className="text-center fw-bold">
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
        </Col>
      </Row>


    </Fragment>
  );
});

Twofactor.displayName = 'Twofactor';
export default Twofactor;

import React, { useEffect, useState, useMemo } from 'react';
import { Button, Form, Input, Alert, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import api from '../../../auth/FetchInterceptor';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from 'constants/ApiConstant';
import { AUTH_PREFIX_PATH } from 'configs/AppConfig';

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{6,15}$/;

// Verification status configurations
const VERIFICATION_STATUS = {
  'email-verification-pending': {
    message: 'Email verification is pending. Please check your inbox and verify your email.',
    type: 'warning',
    showResend: false,
  },
  'email-verification-failed': {
    message: 'Email verification failed. Please try again or contact support.',
    type: 'error',
    showResend: false,
  },
  'email-verified-success': {
    message: 'Email verified successfully! You can now sign in.',
    type: 'success',
    showResend: false,
  },
  'verification-expired': {
    message: 'Email verification expired. Please resend the verification email.',
    type: 'error',
    showResend: true,
  },
};

const LoginForm = ({ extra = null }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'error' });
  const [showResendButton, setShowResendButton] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async (email) => {
      const response = await api.post(`${API_BASE_URL}resend-verification`, { email });
      return response.data;
    },
    onSuccess: () => {
      message.success('Verification email sent successfully!');
      setShowResendButton(false);
      navigate(`${AUTH_PREFIX_PATH}/two-factor`, { state: { data: userEmail } });
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to resend verification email.';
      message.error(errorMsg);
    },
  });

  // Handle email verification query params
  useEffect(() => {
    const setParam = searchParams.get('set');
    const config = VERIFICATION_STATUS[setParam];

    if (config) {
      setAlert({ show: true, message: config.message, type: config.type });
      setShowResendButton(config.showResend);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-hide alert after 3 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  // Handle login
  const onLogin = async (values) => {
    const { data } = values;

    setUserEmail(data);

    try {
      setLoading(true);
      const response = await api.post(`${API_BASE_URL}verify-user`, { data });

      if (response?.status) {
        const { pass_req, session_id, auth_session } = response;

        if (pass_req) {
          const info = { data, password_required: pass_req, session_id, auth_session };
          navigate(`${AUTH_PREFIX_PATH}/verify-password`, { state: { info } });
        } else {
          navigate(`${AUTH_PREFIX_PATH}/two-factor`, { state: { data } });
        }
      }
    } catch (err) {
      const meta = err?.response?.data?.meta === 404;
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error;

      if (meta) {
        navigate(`${AUTH_PREFIX_PATH}/register`, { state: { data } });
      }

      setAlert({
        show: true,
        message: apiMsg || 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Form validation rules
  const validationRules = useMemo(() => [
    { required: true, message: 'Please enter your email or mobile number.' },
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        const trimmedValue = String(value).trim();
        if (EMAIL_REGEX.test(trimmedValue) || PHONE_REGEX.test(trimmedValue)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Enter a valid email or mobile number'));
      },
    },
  ], []);

  return (
    <>
      {alert.show && (
        <motion.div
          initial={{ opacity: 0, marginBottom: 0 }}
          animate={{
            opacity: alert.show ? 1 : 0,
            marginBottom: alert.show ? 20 : 0,
          }}
        >
          <Alert
            type={alert.type}
            showIcon
            message={alert.message}
            style={{ visibility: alert.show ? 'visible' : 'hidden' }}
          />
        </motion.div>
      )}

      <Form
        layout="vertical"
        name="login-form"
        onFinish={onLogin}
        autoComplete="on"
      >
        <Form.Item
          name="data"
          label="Email or mobile number"
          rules={validationRules}
        >
          <Input
            size="large"
            placeholder="Email or mobile number"
            prefix={<MailOutlined className="text-primary" />}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form.Item>

        {showResendButton && (
          <Form.Item>
            <Button
              type="default"
              block
              size="large"
              loading={resendVerificationMutation.isPending}
              onClick={() => resendVerificationMutation.mutate(userEmail)}
              disabled={!userEmail}
            >
              Resend Verification Email
            </Button>
          </Form.Item>
        )}

        {extra}
      </Form>
    </>
  );
};

export default LoginForm;

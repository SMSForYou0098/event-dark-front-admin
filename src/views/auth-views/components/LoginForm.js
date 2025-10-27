import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from 'constants/ApiConstant';
import { AUTH_PREFIX_PATH } from 'configs/AppConfig';

const LoginForm = ({
  showForgetPassword = false,   // kept for API-compat with your props
  otherSignIn = false,          // turn off social here by default
  extra = null,                 // any extra JSX you were injecting
}) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');

  const onLogin = async (values) => {
    const { data } = values; // "data" = email or mobile (same as your working file)
    if (!data) {
      setMessage('Please enter your email or mobile number.');
      setShowMessage(true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}verify-user`, { data });

      if (response?.data?.status) {
        const isPassReq = response?.data?.pass_req;
        if (isPassReq === true) {
          const session_id = response?.data?.session_id;
          const auth_session = response?.data?.auth_session;
          const info = { data, password_required: isPassReq, session_id, auth_session };
          navigate(`${AUTH_PREFIX_PATH}/verify-password`, { state: { info } });
        } else {
          navigate(`${AUTH_PREFIX_PATH}/two-factor`, { state: { data } });
        }
      } else {
        // Non-true status but no thrown error – mirror original behavior (just stop loading)
		// navigate(`${AUTH_PREFIX_PATH}/register-1`, { state: { data } });
      }
    } catch (err) {
      // If API returns { status:false } => go to sign-up with prefilled data
      const status = err?.response?.data?.status;
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error;

      if (status === false) {
        navigate(`${AUTH_PREFIX_PATH}/register-1`, { state: { data } });
      }

      setMessage(apiMsg || 'Something went wrong. Please try again.');
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  // auto-hide alert like your original pattern
  useEffect(() => {
    if (showMessage) {
      const t = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showMessage]);

  // simple validator: allow email OR digits (mobile)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{6,15}$/; // adjust if you want stricter

  return (
    <>
    {showMessage && 
      <motion.div
        initial={{ opacity: 0, marginBottom: 0 }}
        animate={{
          opacity: showMessage ? 1 : 0,
          marginBottom: showMessage ? 20 : 0,
        }}
      >
        <Alert type="error" showIcon message={message} style={{ visibility: showMessage ? 'visible' : 'hidden' }} />
      </motion.div>
    }

      <Form
        layout="vertical"
        name="login-form"
        onFinish={onLogin}
        autoComplete="on"
      >
        <Form.Item
          name="data"
          label="Email or mobile number"
          rules={[
            { required: true, message: 'Please enter your email or mobile number.' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const v = String(value).trim();
                if (emailRegex.test(v) || phoneRegex.test(v)) return Promise.resolve();
                return Promise.reject(new Error('Enter a valid email or mobile number'));
              },
            },
          ]}
        >
          <Input
            size="large"
            placeholder="Email or mobile number"
            prefix={<MailOutlined className="text-primary" />}
          />
        </Form.Item>

        {/* Password field removed to mirror the verify-first flow.
            If pass is required, we navigate to /verify-password exactly like your working component. */}

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form.Item>

        {extra}
      </Form>
    </>
  );
};

export default LoginForm;

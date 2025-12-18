import React, {
  memo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout, signIn } from "../../../../store/slices/authSlice";

import { Form, Input, Button, Alert, Typography, message, Row, Col } from "antd";
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { persistor } from "store";
import { AUTH_PREFIX_PATH } from "configs/AppConfig";
import { Key } from "lucide-react";
import Flex from "components/shared-components/Flex";

const { Title, Paragraph } = Typography;

const VerifyPassword = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Pulled from navigation state
  const number = location?.state?.info?.data;
  const session_id = location?.state?.info?.session_id;
  //   const passwordRequired = location?.state?.info?.password_required;
  const auth_session = location?.state?.info?.auth_session;

  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref to prevent duplicate dispatches
  const isVerifyingRef = useRef(false);

  // Ensure we have the number, otherwise bounce to sign-in
  useEffect(() => {
    if (!number) {
      navigate(`${AUTH_PREFIX_PATH}/sign-in`);
    }
  }, [number, navigate]);

  // Leave protection + local state reset
  useEffect(() => {
    setPassword("");
    setAttempts(0);
    setError("");
    setLoading(false);

    const isConfirmedLeave = sessionStorage.getItem("isConfirmedLeave");
    if (isConfirmedLeave) {
      navigate(`${AUTH_PREFIX_PATH}/sign-in`);
      sessionStorage.removeItem("isConfirmedLeave");
    }

    const handleBeforeUnload = (event) => {
      const confirmationMessage =
        "Are you sure you want to leave? Your current data will be lost.";
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    };

    const handleUnload = () => {
      sessionStorage.setItem("isConfirmedLeave", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [navigate]);

  // Memoized verify password handler with ref guard
  const handleVerifyPassword = useCallback(async () => {
    // Guard against duplicate calls
    if (isVerifyingRef.current) {
      return;
    }

    if (!password) {
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
      setError("");

      const details = {
        password,
        number,
        session_id,
        auth_session,
        passwordRequired: true,
      };

      const action = await dispatch(signIn(details));

      if (action?.type === "login/fulfilled") {
        message.success("Login successful");
        navigate("/dashboard");
      } else {
        setError(action?.payload || "Invalid password");
      }
    } catch (e) {
      console.error("Verify password error:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  }, [password, number, session_id, auth_session, dispatch, navigate]);

  // Memoized key handler
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && password && !isVerifyingRef.current) {
        handleVerifyPassword();
      }
    },
    [password, handleVerifyPassword]
  );

  // Memoized back handler
  const handleBack = useCallback(() => {
    navigate(`${AUTH_PREFIX_PATH}/sign-in`);
  }, [navigate]);

  // Memoized password change handler
  const handlePasswordChange = useCallback(
    (e) => {
      setPassword(e.target.value);
      if (error) setError(""); // Clear error on input
    },
    [error]
  );

  const handleForgotPassword = useCallback(() => {
    navigate(`${AUTH_PREFIX_PATH}/forgot-password`);
  }, [navigate]);
  return (
    <div>


      {/* <Title level={3} style={{ marginBottom: 8 }}>
        Password Verification
      </Title> */}
      {/* <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Enter your password to continue.
      </Paragraph> */}

      {error && (
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={error}
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={handleVerifyPassword}>
        <Form.Item
          label="Password"
          name="password"
          validateStatus={error ? "error" : ""}
          help={
            attempts > 0 && !password
              ? `Please enter password (Attempt ${attempts}/3)`
              : ""
          }
        >
          <Input.Password
            prefix={<Key className="text-primary" size={16} />}
            size="large"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
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
            disabled={!password}
          >
            {loading ? "Verifying..." : "Continue"}
          </Button>
        </Form.Item>
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
            <Button
              type="link"
              className="w-100 text-center text-sm-right"
              onClick={handleForgotPassword}
              icon={<QuestionCircleOutlined />}
              style={{ padding: 0 }}
            >
              Forgot password
            </Button>
          </Col>
        </Row>
      </Form>

      {attempts > 0 && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Typography.Text type="danger">
            Failed attempts: {attempts}/3
          </Typography.Text>
        </div>
      )}
    </div>
  );
});

VerifyPassword.displayName = "VerifyPassword";
export default VerifyPassword;

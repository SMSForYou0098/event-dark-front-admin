// PaymentGatewayForm.js
import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Row, Switch, Input, Select, Space, message, Card, Divider, Typography, Badge } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { SaveOutlined } from '@ant-design/icons';
import apiClient from 'auth/FetchInterceptor';
import Utils from 'utils';
import { useMyContext } from 'Context/MyContextProvider';
import GatewayOTPModal from 'components/shared-components/GatewayOTPModal';


const { Option } = Select;
const { Title, Text } = Typography;


const PaymentGatewayForm = ({
  gateway,
  user,
  gatewayType,
  fields = [],
  hasEnvironment = false,
  apiEndpoint,
  onStatusChange,
  onSuccess
}) => {
  const { UserData } = useMyContext();
  const [form] = Form.useForm();
  const [status, setStatus] = useState(false);
  const [refund, setRefund] = useState(false);
  const [environment, setEnvironment] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Update form mutation
  const updateGatewayMutation = useMutation({
    mutationFn: async (payload) => {
      return await apiClient.post(apiEndpoint, payload);
    },
    onSuccess: () => {
      message.success(`${gatewayType} credentials stored successfully!`);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Error updating gateway:', error);
      message.error(Utils.getErrorMessage(error));
    }
  });

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('gateway/refund/send-otp', {
        user_id: user || UserData?.id,
        gateway_type: gatewayType
      });
    },
    onSuccess: (response) => {
      message.success(response?.message || 'OTP sent successfully!');
      setOtpModalOpen(true);
      setResendTimer(60);
    },
    onError: (error) => {
      console.error('Error sending OTP:', error);
      message.error(Utils.getErrorMessage(error));
      // Reset refund switch on error
      setRefund(gateway?.refund || false);
      setPendingFormValues(null);
    }
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (otpCode) => {
      return await apiClient.post('gateway/refund/verify-otp', {
        user_id: user || UserData?.id,
        gateway_type: gatewayType,
        otp: otpCode
      });
    },
    onSuccess: (response) => {
      message.success(response?.message || 'OTP verified successfully!');
      setOtpModalOpen(false);
      // Save the gateway after OTP verification with hash_key (only when refund is enabled)
      if (pendingFormValues) {
        const payloadWithHash = {
          ...pendingFormValues,
          ...(pendingFormValues.refund && { hash_key: response?.hash_key || response?.data?.hash_key })
        };
        updateGatewayMutation.mutate(payloadWithHash);
        setPendingFormValues(null);
      }
    },
    onError: (error) => {
      console.error('Error verifying OTP:', error);
      message.error(Utils.getErrorMessage(error));
    }
  });

  // Resend timer countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Initialize form when gateway data changes
  useEffect(() => {
    if (gateway) {
      const formValues = {};
      fields.forEach(field => {
        formValues[field.name] = gateway[field.gatewayKey] || '';
      });
      form.setFieldsValue(formValues);
      setStatus(gateway.status);
      setRefund(gateway.refund || false);
      if (hasEnvironment) {
        setEnvironment(gateway.env || null);
      }
    } else {
      form.resetFields();
      setStatus(false);
      setRefund(false);
      if (hasEnvironment) {
        setEnvironment(null);
      }
    }
  }, [gateway, fields, hasEnvironment, form]);

  const handleSubmit = async (values) => {
    const payload = {
      user_id: user || UserData?.id,
      status: status,
      refund: refund,
      ...values
    };

    if (hasEnvironment) {
      payload.env = environment;
    }

    // If refund is being enabled (not already enabled), require OTP verification first
    if (refund && !gateway?.refund) {
      setPendingFormValues(payload);
      // Send OTP first, modal will open only on success
      sendOtpMutation.mutate();
      return;
    }

    updateGatewayMutation.mutate(payload);
  };

  // Handle OTP verification
  const handleVerifyOtp = (otpCode) => {
    verifyOtpMutation.mutate(otpCode);
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    sendOtpMutation.mutate();
  };

  // Handle OTP modal close
  const handleOtpModalClose = () => {
    setOtpModalOpen(false);
    setPendingFormValues(null);
    setResendTimer(0);
    // Reset refund switch if OTP verification was cancelled
    setRefund(gateway?.refund || false);
  };

  const environmentOptions = [
    { value: "test", label: "Test Environment" },
    { value: "prod", label: "Production Environment" },
  ];

  const handleStatusChange = (checked) => {
    setStatus(checked);
    onStatusChange?.(checked);
  };
  return (
    <Card
      bordered={false}
      className="bg-transparent"
    >
      <div className="mb-6">
        <Space align="center" className="mb-2">
          <Title level={4} className="m-0">
            {gatewayType} Configuration
          </Title>
          <Badge
            status={status ? 'success' : 'error'}
            text={status ? 'Enabled' : 'Disabled'}
          />
        </Space>
      </div>

      <Divider className="my-4 mb-6" />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        size="large"
      >
        <Row gutter={[16, 16]}>
          {/* Dynamic Fields */}
          {fields.map((field) => (
            <Col xs={24} sm={24} md={12} lg={12} xl={12} key={field.name}>
              <Form.Item
                label={<span className="font-medium">{field.label}</span>}
                name={field.name}
                rules={[
                  {
                    required: field.required !== false,
                    message: `Please enter ${field.label}`
                  }
                ]}
              >
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  className="rounded-md"
                />
              </Form.Item>
            </Col>
          ))}

          {/* Environment Selector */}
          {hasEnvironment && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label={<span className="font-medium">Environment</span>}
                rules={[
                  { required: true, message: 'Please select environment' }
                ]}
              >
                <Select
                  value={environment}
                  onChange={setEnvironment}
                  placeholder="Choose environment..."
                  allowClear
                  className="rounded-md"
                >
                  {environmentOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}

          {/* Status Switch */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              label={<span className="font-medium">Gateway Status</span>}
            >
              <Space align="center" size="middle">
                <Switch
                  checked={status}
                  onChange={handleStatusChange}
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                  size="default"
                />
                <Text type={status ? 'success' : 'secondary'}>
                  {status ? 'Gateway is active' : 'Gateway is inactive'}
                </Text>
              </Space>
            </Form.Item>
          </Col>

          {/* Refund Switch */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              label={<span className="font-medium">Refund Support</span>}
            >
              <Space align="center" size="middle">
                <Switch
                  checked={refund}
                  onChange={setRefund}
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                  size="default"
                />
                <Text type={refund ? 'success' : 'secondary'}>
                  {refund ? 'Refunds enabled' : 'Refunds disabled'}
                </Text>
              </Space>
            </Form.Item>
          </Col>

          {/* Submit Button */}
          <Col span={24}>
            <Divider className="my-4" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="default"
                size="large"
                onClick={() => {
                  form.resetFields();
                  setStatus(false);
                  setRefund(false);
                  if (hasEnvironment) setEnvironment(null);
                }}
                disabled={updateGatewayMutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateGatewayMutation.isPending || sendOtpMutation.isPending}
                icon={<SaveOutlined />}
                size="large"
              // style={{ minWidth: '120px' }}
              >
                {sendOtpMutation.isPending ? 'Sending OTP...' : updateGatewayMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Col>

        </Row>
      </Form>

      {/* OTP Verification Modal for Refund */}
      <GatewayOTPModal
        open={otpModalOpen}
        onClose={handleOtpModalClose}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        title="Verify Refund Authorization"
        description="For security purposes, please verify your identity to enable refund support for this gateway."
        isVerifying={verifyOtpMutation.isPending}
        isSending={sendOtpMutation.isPending}
        resendTimer={resendTimer}
      />
    </Card>
  );
};

export default PaymentGatewayForm;
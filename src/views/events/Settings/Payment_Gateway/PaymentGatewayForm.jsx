// PaymentGatewayForm.js
import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Row, Switch, Input, Select, Space, message, Card, Divider, Typography, Badge } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { SaveOutlined } from '@ant-design/icons';
import apiClient from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';


const { Option } = Select;
const { Title, Text } = Typography;


const PaymentGatewayForm = ({
  gateway,
  user,
  gatewayType,
  fields = [],
  hasEnvironment = false,
  apiEndpoint,
  onSuccess
}) => {
  const { UserData } = useMyContext();
  const [form] = Form.useForm();
  const [status, setStatus] = useState(false);
  const [environment, setEnvironment] = useState(null);

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
      message.error(`Failed to store ${gatewayType} credentials!`);
    }
  });

  // Initialize form when gateway data changes
  useEffect(() => {
    if (gateway) {
      const formValues = {};
      fields.forEach(field => {
        formValues[field.name] = gateway[field.gatewayKey] || '';
      });
      form.setFieldsValue(formValues);
      setStatus(gateway.status === 1);
      if (hasEnvironment) {
        setEnvironment(gateway.env || null);
      }
    } else {
      form.resetFields();
      setStatus(false);
      if (hasEnvironment) {
        setEnvironment(null);
      }
    }
  }, [gateway, fields, hasEnvironment, form]);

  const handleSubmit = async (values) => {
    const payload = {
      user_id: user || UserData?.id,
      status: status ? 1 : 0,
      ...values
    };

    if (hasEnvironment) {
      payload.env = environment;
    }

    updateGatewayMutation.mutate(payload);
  };

  const environmentOptions = [
    { value: "test", label: "Test Environment" },
    { value: "prod", label: "Production Environment" },
  ];

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
            status={status ? 'success' : 'default'}
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
          <Col xs={24} sm={24} md={hasEnvironment ? 12 : 24} lg={hasEnvironment ? 12 : 24} xl={hasEnvironment ? 12 : 24}>
            <Form.Item
              label={<span className="font-medium">Gateway Status</span>}
            >
              <Space align="center" size="middle">
                <Switch
                  checked={status}
                  onChange={setStatus}
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
                  if (hasEnvironment) setEnvironment(null);
                }}
                disabled={updateGatewayMutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateGatewayMutation.isPending}
                icon={<SaveOutlined />}
                size="large"
                // style={{ minWidth: '120px' }}
              >
                {updateGatewayMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Col>

        </Row>
      </Form>
    </Card>
  );
};

export default PaymentGatewayForm;
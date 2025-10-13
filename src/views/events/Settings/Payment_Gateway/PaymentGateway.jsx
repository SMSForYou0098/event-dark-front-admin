import React, { useState } from 'react';
import { Card, Col, Row, Tabs, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import { PAYMENT_GATEWAY_CONFIG, PAYMENT_GATEWAY_MENU } from './paymentGatewayConfig';
import PaymentGatewayForm from './PaymentGatewayForm';
import apiClient from 'auth/FetchInterceptor';

const PaymentGateway = () => {
  const { UserData } = useMyContext();
  const [user, setUser] = useState();

  // Fetch payment gateways using TanStack Query
  const {
    data: gateways = {},
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-gateways', user || UserData?.id],
    queryFn: async () => {
      const id = user || UserData?.id;
      const response = await apiClient.get(`payment-gateways/${id}`);
      return response?.gateways || {};
    },
    enabled: Boolean(user || UserData?.id),
    staleTime: 5 * 60 * 1000,
  });

  // Create tab items
  const tabItems = PAYMENT_GATEWAY_MENU.map((item) => ({
    key: item.eventKey,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.icon && <span>{item.icon}</span>}
        <span>{item.title}</span>
      </span>
    ),
    children: (
      <PaymentGatewayForm
        gateway={gateways[item.eventKey]}
        user={user}
        gatewayType={PAYMENT_GATEWAY_CONFIG[item.eventKey].title}
        fields={PAYMENT_GATEWAY_CONFIG[item.eventKey].fields}
        hasEnvironment={PAYMENT_GATEWAY_CONFIG[item.eventKey].hasEnvironment}
        apiEndpoint={PAYMENT_GATEWAY_CONFIG[item.eventKey].apiEndpoint}
        onSuccess={refetch}
      />
    ),
  }));

  if (isError) {
    return (
      <Row>
        <Col span={24}>
          <Alert
            message="Error Loading Payment Gateways"
            description={error?.message || 'Failed to fetch payment gateway data'}
            type="error"
            showIcon
          />
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title={
            <span style={{ fontSize: '18px', fontWeight: 600 }}>
              Payment Gateway Settings
            </span>
          }
          bordered={false}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
              }}
            >
              <Spin size="large" tip="Loading payment gateways..." />
            </div>
          ) : (
            <Tabs
              defaultActiveKey="razorpay"
              tabPosition="top"
              items={tabItems}
              style={{ width: '100%' }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default PaymentGateway;

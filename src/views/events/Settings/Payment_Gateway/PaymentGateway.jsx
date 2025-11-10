import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Tabs, Spin, Alert, Badge } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import { PAYMENT_GATEWAY_CONFIG, PAYMENT_GATEWAY_MENU } from './paymentGatewayConfig';
import PaymentGatewayForm from './PaymentGatewayForm';
import apiClient from 'auth/FetchInterceptor';
import Loader from 'utils/Loader';

const PaymentGateway = () => {
  const { UserData } = useMyContext();
  const [user, setUser] = useState();
  const [gatewayStatuses, setGatewayStatuses] = useState({});


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

  useEffect(() => {
    if (gateways) {
      const statuses = Object.entries(gateways).reduce((acc, [key, value]) => {
        acc[key] = value?.status;
        return acc;
      }, {});
      setGatewayStatuses(statuses);
    }
  }, [gateways]);
  // Create tab items
  const tabItems = useMemo(() => 
    PAYMENT_GATEWAY_MENU.map((item) => ({
      key: item.eventKey,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Badge
            status={gatewayStatuses[item.eventKey] === 1 ? 'success' : 'error'}
            dot
          />
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
          onStatusChange={(status) => {
            setGatewayStatuses(prev => ({
              ...prev,
              [item.eventKey]: status ? 1 : 0
            }));
          }}
        />
      ),
    })), [gateways, user, gatewayStatuses]);

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
          title='Payment Gateway Settings'
          bordered={false}
        >
          {isLoading ? (
            <Loader />
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

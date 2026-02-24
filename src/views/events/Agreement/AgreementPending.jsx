import React from 'react';
import { Result, Button, Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Paragraph, Text } = Typography;

const AgreementPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <Card bordered={false} style={{ maxWidth: 640, width: '100%' }}>
        <Result
          status="warning"
          title="Your organizer agreement is not approved yet"
          subTitle="Your organizer account is under review. Once your agreement is approved, you will get access to all organizer features."
          extra={[
            <Button
              key="dashboard"
              type="primary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>,
            <Button
              key="support"
              onClick={() => navigate('/customer-inquiries')}
            >
              Contact Support
            </Button>,
          ]}
        >
          <Paragraph>
            <Text type="secondary">
              This space is reserved for organizers whose onboarding or legal agreement is still pending.
              You can safely browse basic areas of the panel, but access to event management, sales,
              and other restricted routes is temporarily disabled until an admin approves your agreement.
            </Text>
          </Paragraph>
        </Result>
      </Card>
    </div>
  );
};

export default AgreementPending;


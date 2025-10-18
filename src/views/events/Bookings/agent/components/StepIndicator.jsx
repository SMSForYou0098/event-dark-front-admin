import React from 'react';
import { Card, Space, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Text } = Typography;

const StepIndicator = ({ currentStep, isAttendeeRequire }) => {
  return (
    <Card size="small">
      <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
        {/* Step 1: Select Tickets */}
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: currentStep >= 0 ? 'var(--primary-color)' : 'var(--bg-secondary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            1
          </div>
          <Text strong={currentStep === 0}>Tickets</Text>
        </Space>

        <ArrowRightOutlined style={{ color: '#d9d9d9' }} />

        {/* Step 2: Add Attendees (Conditional) */}
        {isAttendeeRequire && (
          <>
            <Space>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: currentStep >= 1 ? 'var(--primary-color)' : 'var(--bg-secondary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                2
              </div>
              <Text strong={currentStep === 1}>Attendees</Text>
            </Space>

            <ArrowRightOutlined style={{ color: '#d9d9d9' }} />
          </>
        )}

        {/* Step 3: Checkout */}
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: currentStep <= (isAttendeeRequire ? 1 : 0) ? 'var(--bg-secondary)' : 'var(--primary-color)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {isAttendeeRequire ? 3 : 2}
          </div>
          <Text>Checkout</Text>
        </Space>
      </Space>
    </Card>
  );
};

export default StepIndicator;
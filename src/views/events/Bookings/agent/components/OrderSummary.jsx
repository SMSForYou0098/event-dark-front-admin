import React from 'react';
import { Button, Card, Space, Statistic, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import OrderCalculation from '../../components/OrderCalculation';
import DiscoutFIeldGroup from '../../components/DiscoutFIeldGroup';
import StickyLayout from 'utils/MobileStickyBottom.jsx/StickyLayout';

const { Title } = Typography;

const OrderSummary = ({
  stats,
  ticketCurrency,
  subtotal,
  discount,
  baseAmount,
  centralGST,
  totalTax,
  grandTotal,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  disableChoice,
  handleDiscount,
  currentStep,
  isAttendeeRequire,
  selectedTickets,
  isLoading,
  onCheckout, // ✅ This should be goToNextStep for step 0
  onNext, // ✅ Add onNext prop for navigation
  isMobile,
}) => {
  // ✅ Determine which handler to use
  const handleButtonClick = () => {
    if (currentStep === 0) {
      // Step 0: Use navigation function
      onNext && onNext();
    } else if (currentStep === 1) {
      // Step 1: Use navigation function
      onNext && onNext();
    } else {
      // Step 2 (final): Open checkout modal
      onCheckout && onCheckout();
    }
  };

  const getButtonText = () => {
    if (currentStep === 0) {
      return isAttendeeRequire ? 'Add Attendees' : 'Checkout';
    } else if (currentStep === 1) {
      return 'Checkout';
    }
    return 'Complete Booking';
  };

  const getButtonTextShort = () => {
    if (currentStep === 0 || currentStep === 1) {
      return 'Next';
    }
    return 'Checkout';
  };

  return (
    <Card bordered={false}>
      <Flex justify="space-around" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
        {stats.map((item, index) => (
          <Statistic
            key={index}
            title={item.title}
            value={item.value}
            prefix={item.prefix}
            valueStyle={{ ...item.valueStyle, fontSize: '14px', fontWeight: 'bold' }}
          />
        ))}
      </Flex>

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <OrderCalculation
          ticketCurrency={ticketCurrency}
          selectedTickets={selectedTickets}
        />

        <DiscoutFIeldGroup
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          disableChoice={disableChoice}
          handleDiscount={handleDiscount}
        />

        <Flex justifyContent="space-between" align="center">
          <Title level={5} style={{ margin: 0 }}>
            Order Total
          </Title>
          <Title level={3} type="primary" style={{ margin: 0 }}>
            {ticketCurrency}
            {grandTotal}
          </Title>
        </Flex>

        {/* Desktop Button */}
        <div className="d-none d-sm-block">
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            size="large"
            block
            onClick={handleButtonClick} // ✅ Use smart handler
            loading={isLoading}
            disabled={selectedTickets.length === 0}
          >
            {getButtonText()}
          </Button>
        </div>

        {/* Mobile Sticky Button */}
        <div className="d-block d-sm-none">
          <StickyLayout
            left={
              <span className="p-0 m-0">
                <Title level={5} className="p-0 m-0">
                  Order Total
                </Title>
                <Title level={3} type="primary" className="p-0 m-0">
                  {ticketCurrency}
                  {grandTotal}
                </Title>
              </span>
            }
            right={
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                size="large"
                style={{ width: '10rem' }}
                block
                onClick={handleButtonClick} // ✅ Use smart handler
                loading={isLoading}
                disabled={selectedTickets.length === 0}
              >
                {getButtonTextShort()}
              </Button>
            }
          />
        </div>
      </Space>
    </Card>
  );
};

export default OrderSummary;
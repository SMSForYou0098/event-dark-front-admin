import React from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import OrderCalculation from '../../components/OrderCalculation';
import StickyLayout from 'utils/MobileStickyBottom.jsx/StickyLayout';
import { BookingStats } from '../utils';
import { calcTicketTotals } from 'utils/ticketCalculations';

const { Title } = Typography;

const OrderSummary = (props) => {
  const { userId, ticketCurrency, discount, discountType, setDiscountType, discountValue, setDiscountValue, handleDiscount, currentStep, isAttendeeRequire, selectedTickets, isLoading, onCheckout, onNext } = props
  const {
    grandTotal,
  } = calcTicketTotals(selectedTickets, discount);
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
      <BookingStats type="agent" id={userId} />

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <OrderCalculation
          ticketCurrency={ticketCurrency}
          selectedTickets={selectedTickets}
          setDiscountValue={setDiscountValue}
          handleDiscount={handleDiscount}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          discount={discount}
        />

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
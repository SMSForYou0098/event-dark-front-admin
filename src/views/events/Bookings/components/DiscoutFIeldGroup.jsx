import React from 'react';
import { Select, Input, Button, Space } from 'antd';

const { Option } = Select;

const DiscoutFIeldGroup = ({ discountType, setDiscountType, discountValue, setDiscountValue, disableChoice, handleDiscount }) => {
  return (
    <div>
      <Space.Compact className='w-100 mb-2'>
        <Select
          value={discountType}
          onChange={(val) => {
            setDiscountType(val);
            if (val === 'percentage' && Number(discountValue) > 100) {
              setDiscountValue('100');
            }
          }}
          style={{ width: 180 }}
          aria-label="Select discount type"
        >
          <Option value="fixed">Fixed</Option>
          <Option value="percentage">Percentage</Option>
        </Select>
        <Input
          placeholder="Add Discount"
          value={discountValue}
          maxLength={10}
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, ''); // Only digits
            if (value.startsWith('0') && value.length > 1) {
              value = value.substring(1);
            }

            // Limit to 100 if percentage
            if (discountType === 'percentage' && Number(value) > 100) {
              return;
            }

            if (value.length <= 10) {
              setDiscountValue(value);
            }
          }}
          aria-label="Discount value"
        />
        <Button
          type="primary"
          disabled={disableChoice}
          onClick={handleDiscount}
          aria-label="Apply discount"
        >
          Apply
        </Button>
      </Space.Compact>
    </div>
  );
};

export default DiscoutFIeldGroup;

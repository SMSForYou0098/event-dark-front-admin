import React from 'react';
import { Select, Input, Button, Space } from 'antd';

const { Option } = Select;

const DiscoutFIeldGroup = ({ discountType, setDiscountType, discountValue, setDiscountValue, disableChoice, handleDiscount }) => {
  return (
    <div>
      <Space.Compact className='w-100 mb-2'>
        <Select
          value={discountType}
          onChange={setDiscountType}
          style={{ width: 180 }}
          aria-label="Select discount type"
        >
          <Option value="fixed">Fixed</Option>
          <Option value="percentage">Percentage</Option>
        </Select>
        <Input
          placeholder="Add Discount"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
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

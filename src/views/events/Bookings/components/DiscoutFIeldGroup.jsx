import React from 'react';
import { Select, Input, Button, Space } from 'antd';

const { Option } = Select;

const DiscoutFIeldGroup = ({ discountType, setDiscountType, discountValue, setDiscountValue, disableChoice, handleDiscount }) => {
  return (
    <div className="border-bottom" style={{ paddingBottom: 12 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          value={discountType}
          onChange={setDiscountType}
          style={{ width: 120 }}
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

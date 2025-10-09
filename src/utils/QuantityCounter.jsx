import React, { Fragment, useState } from "react";
import { Input as AntdInput } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";

const CounterInput = (props) => {
  const { className, value, min, max, onChange } = props
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <AntdInput
      type="number"
      className={className}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      prefix={
        <MinusOutlined
          className="text-white"
          onClick={handleDecrease}
          style={{ cursor: value > min ? "pointer" : "not-allowed" }}
        />
      }
      suffix={
        <PlusOutlined
          className="text-white"
          onClick={handleIncrease}
          style={{ cursor: value < max ? "pointer" : "not-allowed" }}
        />
      }
    />
  );
};

const Counter = (props) => {
  const [value, setValue] = useState(1);
  const min = 1;
  const max = 10;

  return (
    <Fragment>
      <div className="d-block d-sm-none mobile">
        <CounterInput
          className="counter w-100"
          value={value}
          min={min}
          max={max}
          onChange={setValue}
          {...props}
        />
      </div>
      <div className="d-none d-sm-block pc">
        <CounterInput
          className="counter w-75"
          value={value}
          min={min}
          max={max}
          onChange={setValue}
          {...props}
        />
      </div>
    </Fragment>
  );
};

export default Counter;

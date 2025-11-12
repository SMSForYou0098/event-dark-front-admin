import React, { Fragment, useState, useEffect } from "react";
import { Input as AntdInput, message } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";

const CounterInput = (props) => {
  const {
    getTicketCount,
    category,
    price,
    limit,
    ticketID,
    className,
    initialValue = 0,
    isDisable,
  } = props;

  const [counter, setCount] = useState(initialValue);

  useEffect(() => {
    setCount(initialValue);
  }, [initialValue]);

  const min = 0;
  const max = limit;

  const increase = () => {
    if (isDisable) return; // prevent click when disabled
    if (counter >= max) {
      message.error(`You can select max ${limit} tickets`);
      return;
    }
    const newCount = counter + 1;
    setCount(newCount);
    getTicketCount(newCount, category, price, ticketID);
  };

  const decrease = () => {
    if (isDisable) return; // prevent click when disabled
    const newCount = counter > min ? counter - 1 : 0;
    setCount(newCount);
    getTicketCount(newCount, category, price, ticketID);
  };

  return (
    <AntdInput
      type="number"
      className={className}
      value={counter}
      disabled={isDisable}
      min={min}
      max={max}
      readOnly
      prefix={
        <div className="text-center">
          <MinusOutlined
            className="text-white"
            onClick={!isDisable && counter > min ? decrease : undefined}
            style={{
              cursor:
                isDisable || counter <= min ? "not-allowed" : "pointer",
              opacity: isDisable ? 0.3 : counter > min ? 1 : 0.3,
              pointerEvents: isDisable ? "none" : "auto",
            }}
          />
        </div>
      }
      suffix={
        <PlusOutlined
          className="text-white"
          onClick={!isDisable && counter < max ? increase : undefined}
          style={{
            cursor:
              isDisable || counter >= max ? "not-allowed" : "pointer",
            opacity: isDisable ? 0.3 : counter < max ? 1 : 0.3,
            pointerEvents: isDisable ? "none" : "auto",
          }}
        />
      }
    />
  );
};

const Counter = (props) => {
  return (
    <Fragment>
      <div className="d-block d-sm-none mobile">
        <CounterInput className="counter w-100" {...props} />
      </div>
      <div className="d-none d-sm-block pc">
        <CounterInput className="counter w-75" {...props} />
      </div>
    </Fragment>
  );
};

export default Counter;

import React from 'react';
import { Input } from 'antd';

/**
 * Common OTP input component using Ant Design.
 * Falls back to a styled numeric Input when Input.OTP is not available.
 */
const OtpInput = ({
  value,
  onChange,
  onKeyDown,
  length = 6,
  style,
  placeholder = '000000',
}) => {
  const handleChange = (valOrEvent) => {
    if (Input.OTP) {
      onChange?.(valOrEvent);
    } else {
      onChange?.(valOrEvent?.target?.value || '');
    }
  };

  if (Input.OTP) {
    return (
      <Input.OTP
        length={length}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        style={{ marginBottom: 16, ...style }}
      />
    );
  }

  return (
    <Input
      maxLength={length}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      style={{
        marginBottom: 16,
        width: 200,
        textAlign: 'center',
        letterSpacing: '0.5em',
        fontSize: 18,
        ...style,
      }}
      inputMode="numeric"
      pattern="\d*"
      placeholder={placeholder}
    />
  );
};

export default OtpInput;


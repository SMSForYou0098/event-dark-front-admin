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
    // Determine the raw value based on whether it's from Input.OTP or a regular Input event
    const rawVal = Input.OTP ? valOrEvent : (valOrEvent?.target?.value || '');

    // Filter to allow only digits (0-9)
    const filteredVal = rawVal.replace(/\D/g, '');

    // Only trigger onChange if the value is different from original (prevents unnecessary re-renders)
    // and satisfies the length restriction
    if (filteredVal.length <= length) {
      onChange?.(filteredVal);
    }
  };

  if (Input.OTP) {
    return (
      <Input.OTP
        length={length}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        pattern="[0-9]*"
        inputMode="numeric"
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


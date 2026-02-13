import React from 'react';
import { Select, Spin } from 'antd';

const TicketSelect = ({
    options,
    disabled,
    value,
    onChange,
    placeholder = "Select a ticket",
    notFoundContent
}) => {
    return (
        <Select
            placeholder={placeholder}
            options={options}
            value={value}
            onChange={onChange}
            disabled={disabled}
            notFoundContent={notFoundContent}
            style={{ width: '100%' }}
        />
    );
};

export default TicketSelect;

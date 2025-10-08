import React from 'react';
import { Tag, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const SelectedOptionView = ({ item, HandleClick, closable = false }) => {
  return (
    <Tooltip title={item}>
      <Tag
        color="blue"
        closable={closable}
        onClose={HandleClick}
        closeIcon={<CloseOutlined />}
        style={{
          fontSize: '0.85rem',
          padding: '4px 8px',
          borderRadius: 8,
          cursor: closable ? 'pointer' : 'default',
          marginBottom: 6,
        }}
      >
        {item}
      </Tag>
    </Tooltip>
  );
};

export default SelectedOptionView;

import React from 'react';
import { Radio, Space, Checkbox, Button } from 'antd';
import { PrinterOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';

import CustomFieldsSettings from './CustomFieldsSettings';

const PrintOptionsSection = ({
  selectedDimension,
  onSizeChange,
  uniformFontSize,
  onFontSizeChange,
  customFieldsData,
  setSelectedFields,
  eventId,
  DIMENSION_OPTIONS,
  primaryColor = '#B51515'
}) => {
  return (
    <Space direction="vertical" size="middle" className="w-100">
      {/* Dimension Selection */}
      <div 
        className="p-3 rounded"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="mb-2 fw-semibold small text-white d-flex align-items-center">
          <PrinterOutlined className="me-2" style={{ color: primaryColor }} />
          Print Size:
        </div>
        <Radio.Group
          value={selectedDimension}
          onChange={(e) => onSizeChange(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          {DIMENSION_OPTIONS.map(opt => (
            <Radio.Button key={opt.value} value={opt.value}>
              {opt.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* Font Size Selection */}
      <div 
        className="p-3 rounded"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="mb-2 fw-semibold small text-white">
          Font Size:
        </div>
        <Radio.Group
          value={uniformFontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="small">Small</Radio.Button>
          <Radio.Button value="medium">Medium</Radio.Button>
          <Radio.Button value="large">Large</Radio.Button>
        </Radio.Group>
        <div className="mt-2 small text-white-50">
          <span style={{ color: primaryColor }}>ℹ</span> Name will be displayed larger and bold
        </div>
      </div>

      {/* Field Selection */}
      <div 
        className="p-3 rounded"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="mb-2 fw-semibold small text-white d-flex justify-content-between align-items-center">
          <span>Fields to Print:</span>
          <CustomFieldsSettings 
            customFieldsData={customFieldsData} 
            setSelectedFields={setSelectedFields} 
            eventId={eventId} 
          />
        </div>
        <div className="small text-white-50 mt-1">
          Click the settings icon to select and reorder fields.
        </div>
      </div>
    </Space>
  );
};

export default PrintOptionsSection;










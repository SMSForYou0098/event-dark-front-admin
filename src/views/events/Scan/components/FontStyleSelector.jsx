import React from 'react';
import { Radio } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

// Font style options for TSPL printer
const FONT_STYLE_OPTIONS = [
  { 
    label: 'Sans Serif', 
    value: 'sans',
    description: 'Standard Sans Serif font',
    fontNum: { name: '4', other: '3' }
  },
  { 
    label: 'Serif', 
    value: 'serif',
    description: 'Standard Serif font',
    fontNum: { name: '4', other: '3' } // TSPL maps to standard font
  },
  { 
    label: 'Monospace', 
    value: 'mono',
    description: 'Fixed-width font',
    fontNum: { name: '3', other: '2' }
  },
];

const FontStyleSelector = ({ 
  selectedFontStyle, 
  onFontStyleChange, 
  uniformFontSize,
  primaryColor = '#B51515' 
}) => {
  // Preview text based on selected font style
  const getPreviewStyle = (styleValue) => {
    switch(styleValue) {
      case 'serif':
        return { fontFamily: "'Times New Roman', serif", fontSize: '16px' };
      case 'mono':
        return { fontFamily: "'Courier New', monospace", fontSize: '14px' };
      case 'sans':
      default:
        return { fontFamily: "Arial, sans-serif", fontSize: '15px' };
    }
  };

  return (
    <div 
      className="p-3 rounded"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="mb-2 fw-semibold small text-white d-flex align-items-center">
        <PrinterOutlined className="me-2" style={{ color: primaryColor }} />
        Font Style:
      </div>
      <Radio.Group
        value={selectedFontStyle}
        onChange={(e) => onFontStyleChange(e.target.value)}
        buttonStyle="solid"
        size="small"
        className="mb-3"
      >
        {FONT_STYLE_OPTIONS.map(opt => (
          <Radio.Button key={opt.value} value={opt.value}>
            {opt.label}
          </Radio.Button>
        ))}
      </Radio.Group>
      
      {/* Preview Section */}
      <div 
        className="p-2 rounded"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="small text-white-50 mb-2">Preview:</div>
        <div 
          className="text-white"
          style={getPreviewStyle(selectedFontStyle)}
        >
          <div className="fw-bold mb-1">John Doe</div>
          <div className="small">john.doe@example.com</div>
          <div className="small">9876543210</div>
        </div>
      </div>
    </div>
  );
};

export { FONT_STYLE_OPTIONS };
export default FontStyleSelector;


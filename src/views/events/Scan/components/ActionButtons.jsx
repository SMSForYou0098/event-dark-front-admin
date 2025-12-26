import React from 'react';
import { Button, Space } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';

const ActionButtons = ({
  onClose,
  onDisconnect,
  onBrowserPrint,
  onThermalPrint,
  isConnected,
  isPrinting,
  isMobile
}) => {
  return (
    <div className="w-100">
      <Space 
        className="w-100 justify-content-end" 
        size="small"
        wrap
        style={{ 
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <Button
          icon={<CloseOutlined />}
          onClick={onClose}
          size="small"
          className="flex-grow-1 flex-md-grow-0"
          style={{ minWidth: isMobile ? 'calc(50% - 4px)' : 'auto' }}
        >
          Close
        </Button>
        {isConnected && (
          <Button
            danger
            onClick={onDisconnect}
            size="small"
            className="flex-grow-1 flex-md-grow-0"
            style={{ minWidth: isMobile ? 'calc(50% - 4px)' : 'auto' }}
          >
            Disconnect
          </Button>
        )}
        <Button
          type="default"
          icon={<PrinterOutlined />}
          onClick={onBrowserPrint}
          size="small"
          className="flex-grow-1 flex-md-grow-0"
          style={{ minWidth: isMobile ? 'calc(50% - 4px)' : 'auto' }}
        >
          Browser Print
        </Button>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={onThermalPrint}
          loading={isPrinting}
          size="small"
          className="flex-grow-1 flex-md-grow-0"
          style={{ minWidth: isMobile ? 'calc(50% - 4px)' : 'auto' }}
        >
          {isConnected ? 'Send to Thermal' : `Thermal (${isMobile ? 'Bluetooth' : 'Bluetooth/USB'})`}
        </Button>
      </Space>
    </div>
  );
};

export default ActionButtons;










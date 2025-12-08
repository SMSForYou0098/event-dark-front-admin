import React from 'react';
import { Button, Space } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';

const PrintFooter = ({
    onClose,
    onBrowserPrint,
    onThermalPrint,
    onDisconnect,
    isConnected,
    isPrinting,
    printerType
}) => {
    return (
        <Space>
            <Button onClick={onClose} icon={<CloseOutlined />}>
                Close
            </Button>
            
            {isConnected && (
                <Button danger onClick={onDisconnect}>
                    Disconnect
                </Button>
            )}
            
            <Button
                className='border-0'
                type="primary"
                onClick={onBrowserPrint}
                icon={<PrinterOutlined />}
            >
                Print Invoice
            </Button>
            
            <Button
                type="default"
                onClick={onThermalPrint}
                icon={<PrinterOutlined />}
                loading={isPrinting}
                disabled={!printerType}
            >
                {isConnected ? 'Send to Thermal' : 'Thermal Print'}
            </Button>
        </Space>
    );
};

export default PrintFooter;


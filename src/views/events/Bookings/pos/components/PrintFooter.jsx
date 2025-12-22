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
        <Space className='w-100 d-flex justify-content-between'>
            <Button
                className='border-0'
                type="primary"
                onClick={onBrowserPrint}
                icon={<PrinterOutlined />}
            >
                Print
            </Button>

            <Button
                type="default"
                onClick={onThermalPrint}
                icon={<PrinterOutlined />}
                loading={isPrinting}
                disabled={!printerType}
            >
                Thermal Print
            </Button>
        </Space>
    );
};

export default PrintFooter;







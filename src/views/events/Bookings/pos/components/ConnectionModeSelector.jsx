import React from 'react';
import { Radio, Space } from 'antd';
import { UsbOutlined, PrinterOutlined } from '@ant-design/icons';
import { Bluetooth } from 'lucide-react';

const ConnectionModeSelector = ({ connectionMode, setConnectionMode, isMobile, isConnected }) => {
    return (
        <div className="mb-3">
            <div className="mb-2 fw-semibold">
                Connection Mode:
            </div>
            <Radio.Group 
                value={connectionMode} 
                onChange={(e) => setConnectionMode(e.target.value)}
            >
                <Space direction="vertical" size={8}>
                    <Radio value="browser">
                        <span className="d-inline-flex align-items-center gap-2">
                            <PrinterOutlined style={{ fontSize: '16px' }} />
                            <span>Browser Print</span>
                        </span>
                    </Radio>
                    {!isMobile && (
                        <Radio value="usb">
                            <span className="d-inline-flex align-items-center gap-2">
                                <UsbOutlined style={{ fontSize: '16px' }} />
                                <span>USB (Thermal)</span>
                            </span>
                        </Radio>
                    )}
                    <Radio value="ble">
                        <span className="d-inline-flex align-items-center gap-2">
                            <Bluetooth size={16} />
                            <span>Bluetooth (Thermal)</span>
                        </span>
                    </Radio>
                </Space>
            </Radio.Group>
        </div>
    );
};

export default ConnectionModeSelector;

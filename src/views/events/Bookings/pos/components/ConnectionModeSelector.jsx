import React from 'react';
import { Radio, Space } from 'antd';
import { UsbOutlined } from '@ant-design/icons';
import { Bluetooth } from 'lucide-react';

const ConnectionModeSelector = ({ connectionMode, setConnectionMode, isMobile, isConnected }) => {
    if (isMobile || isConnected) return null;

    return (
        <div className="mb-3">
            <div className="mb-2 fw-semibold" style={{ fontSize: '13px', color: '#262626' }}>
                Connection Mode:
            </div>
            <Radio.Group 
                value={connectionMode} 
                onChange={(e) => setConnectionMode(e.target.value)}
            >
                <Space direction="horizontal" size={16}>
                    <Radio value="usb">
                        <span className="d-inline-flex align-items-center gap-2">
                            <UsbOutlined style={{ fontSize: '16px' }} />
                            <span>USB</span>
                        </span>
                    </Radio>
                    <Radio value="ble">
                        <span className="d-inline-flex align-items-center gap-2">
                            <Bluetooth size={16} />
                            <span>Bluetooth</span>
                        </span>
                    </Radio>
                </Space>
            </Radio.Group>
        </div>
    );
};

export default ConnectionModeSelector;

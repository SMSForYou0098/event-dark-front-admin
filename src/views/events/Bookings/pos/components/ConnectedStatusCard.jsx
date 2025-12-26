import React from 'react';
import { Card, Space, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const ConnectedStatusCard = ({ connectionMode, printerType, isConnected }) => {
    if (!isConnected) return null;

    const getPrinterTypeLabel = () => {
        if (printerType === 'escpos-native') return 'ESC/POS (Native QR)';
        if (printerType === 'escpos-bitmap') return 'ESC/POS (Bitmap)';
        return 'TSPL';
    };

    return (
        <Card 
            size="small" 
            style={{ marginBottom: '16px', background: '#f6ffed', borderColor: '#b7eb8f' }}
            bodyStyle={{ padding: '12px' }}
        >
            <Space>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <div>
                    <div style={{ fontWeight: '600' }}>Printer Connected</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {connectionMode === 'usb' ? 'USB' : 'Bluetooth'} • {getPrinterTypeLabel()}
                    </div>
                </div>
            </Space>
        </Card>
    );
};

export default ConnectedStatusCard;








import React from 'react';
import { Card, Divider, Space } from 'antd';
import ConnectionModeSelector from './ConnectionModeSelector';
import PrinterTypeSelector from './PrinterTypeSelector';

const PrinterConfigCard = ({
    connectionMode,
    setConnectionMode,
    printerType,
    setPrinterType,
    isMobile,
    isConnected
}) => {
    if (isConnected) return null;

    return (
        <Card 
            size="small" 
            style={{ marginBottom: '16px'}}
            bodyStyle={{ padding: '12px' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {
                    !isConnected &&
                <ConnectionModeSelector
                    connectionMode={connectionMode}
                    setConnectionMode={setConnectionMode}
                    isMobile={isMobile}
                    isConnected={isConnected}
                />
                }
                
                {!isMobile && connectionMode && <Divider style={{ margin: '8px 0' }} />}
                
                <PrinterTypeSelector
                    printerType={printerType}
                    setPrinterType={setPrinterType}
                    isConnected={isConnected}
                />
            </Space>
        </Card>
    );
};

export default PrinterConfigCard;


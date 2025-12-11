import React from 'react';
import { Card, Divider, Space, Switch, Typography, Tag, Alert, Button } from 'antd';
import { CheckCircleOutlined, UsbOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import ConnectionModeSelector from './ConnectionModeSelector';
import PrinterTypeSelector from './PrinterTypeSelector';

const { Text } = Typography;

const PrinterConfigCard = ({
    connectionMode,
    setConnectionMode,
    printerType,
    setPrinterType,
    isMobile,
    isConnected,
    isAutoPrintEnabled,
    setIsAutoPrintEnabled,
    deviceName,
    status,
    onDisconnect
}) => {
    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                
                {/* Connected Printer Info */}
                {isConnected && (
                    <>
                        <Alert
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                            message={
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong style={{ fontSize: '14px' }}>Printer Connected</Text>
                                        <Button 
                                            size="small" 
                                            danger 
                                            icon={<DisconnectOutlined />}
                                            onClick={onDisconnect}
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                    <Space>
                                        {connectionMode === 'usb' ? (
                                            <Tag icon={<UsbOutlined />} color="blue">USB</Tag>
                                        ) : (
                                            <Tag icon={<WifiOutlined />} color="purple">Bluetooth</Tag>
                                        )}
                                        <Text type="secondary">{deviceName || 'Unknown Device'}</Text>
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{status}</Text>
                                </Space>
                            }
                        />
                        <Divider style={{ margin: '8px 0' }} />
                    </>
                )}

                {/* Auto Print Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Auto Print on Open</Text>
                    <Switch
                        checked={isAutoPrintEnabled}
                        onChange={setIsAutoPrintEnabled}
                        checkedChildren="On"
                        unCheckedChildren="Off"
                    />
                </div>
                
                <Divider style={{ margin: '8px 0' }} />
                
                {/* Connection Mode - show even when connected to allow changes */}
                <ConnectionModeSelector
                    connectionMode={connectionMode}
                    setConnectionMode={setConnectionMode}
                    isMobile={isMobile}
                    isConnected={isConnected}
                />
                
                {!isMobile && connectionMode && <Divider style={{ margin: '8px 0' }} />}
                
                <PrinterTypeSelector
                    printerType={printerType}
                    setPrinterType={setPrinterType}
                    isConnected={isConnected}
                />
            </Space>
        </>
    );
};

export default PrinterConfigCard;


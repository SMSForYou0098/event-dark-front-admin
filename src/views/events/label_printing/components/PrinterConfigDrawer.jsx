import React from "react";
import {
    Button,
    Card,
    Drawer,
    Radio,
    Space,
    Tag,
    Typography,
    Divider,
} from "antd";
import { SettingsIcon, CheckCircle, Wifi, Usb, Monitor, Printer } from "lucide-react";

const { Text, Title } = Typography;

/**
 * Printer Configuration Drawer
 * Handles printer connection settings
 */
const PrinterConfigDrawer = ({
    open,
    onClose,
    connectionMode,
    setConnectionMode,
    printerType,
    setPrinterType,
    isConnected,
    deviceName,
    printerStatus,
    onSave,
    onDisconnect,
    isMobile,
}) => {
    const drawerWidth = isMobile ? "100%" : 480;

    return (
        <Drawer
            title={
                <div className="d-flex align-items-center justify-content-between">
                    <Space>
                        <SettingsIcon size={18} />
                        <span>Printer Configuration</span>
                    </Space>
                    {isConnected && (
                        <Tag color="success" icon={<CheckCircle size={12} />}>
                            Connected
                        </Tag>
                    )}
                </div>
            }
            placement={isMobile ? "bottom" : "right"}
            open={open}
            onClose={onClose}
            height={isMobile ? "85%" : undefined}
            width={drawerWidth}
            footer={
                <div className="d-flex justify-content-between gap-2">
                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={onSave}>
                        Save & Connect
                    </Button>
                </div>
            }
        >
            <Space direction="vertical" size="large" className="w-100">
                {/* Connection Mode */}
                <Card 
                    title={
                        <Space>
                            <Wifi size={16} />
                            <span>Connection Mode</span>
                        </Space>
                    }
                    size="small"
                >
                    <Radio.Group 
                        value={connectionMode} 
                        onChange={(e) => setConnectionMode(e.target.value)} 
                        className="w-100"
                    >
                        <Space direction="vertical" className="w-100">
                            <Radio value="browser" className="py-2">
                                <Space>
                                    <Monitor size={16} />
                                    <div>
                                        <Text strong>Browser Print</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Use system print dialog (default)
                                        </Text>
                                    </div>
                                </Space>
                            </Radio>
                            <Divider className="my-2" />
                            <Radio value="usb" className="py-2">
                                <Space>
                                    <Usb size={16} />
                                    <div>
                                        <Text strong>USB Thermal Printer</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Connect via USB WebUSB API
                                        </Text>
                                    </div>
                                </Space>
                            </Radio>
                            <Divider className="my-2" />
                            <Radio value="bluetooth" className="py-2">
                                <Space>
                                    <Wifi size={16} />
                                    <div>
                                        <Text strong>Bluetooth Thermal Printer</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Connect via Web Bluetooth API
                                        </Text>
                                    </div>
                                </Space>
                            </Radio>
                        </Space>
                    </Radio.Group>
                </Card>

                {/* Printer Type (for thermal printers) */}
                {connectionMode !== "browser" && (
                    <Card 
                        title={
                            <Space>
                                <Printer size={16} />
                                <span>Printer Language</span>
                            </Space>
                        }
                        size="small"
                    >
                        <Radio.Group 
                            value={printerType} 
                            onChange={(e) => setPrinterType(e.target.value)} 
                            className="w-100"
                        >
                            <Space direction="vertical" className="w-100">
                                <Radio value="tspl" className="py-2">
                                    <div>
                                        <Text strong>TSPL</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            TSC Label Printers
                                        </Text>
                                    </div>
                                </Radio>
                                <Radio value="zpl" className="py-2">
                                    <div>
                                        <Text strong>ZPL</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Zebra Printers
                                        </Text>
                                    </div>
                                </Radio>
                                <Radio value="cpcl" className="py-2">
                                    <div>
                                        <Text strong>CPCL</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Citizen/Intermec Printers
                                        </Text>
                                    </div>
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </Card>
                )}

                {/* Connection Status */}
                {isConnected && (
                    <Card 
                        title={
                            <Space>
                                <CheckCircle size={16} className="text-success" />
                                <span>Connection Status</span>
                            </Space>
                        }
                        size="small"
                    >
                        <Space direction="vertical" className="w-100">
                            <div className="d-flex justify-content-between">
                                <Text type="secondary">Device:</Text>
                                <Text strong>{deviceName || "Unknown Device"}</Text>
                            </div>
                            <div className="d-flex justify-content-between">
                                <Text type="secondary">Status:</Text>
                                <Tag color="success">{printerStatus || "Connected"}</Tag>
                            </div>
                            <Divider className="my-2" />
                            <Button danger block onClick={onDisconnect}>
                                Disconnect Printer
                            </Button>
                        </Space>
                    </Card>
                )}
            </Space>
        </Drawer>
    );
};

export default PrinterConfigDrawer;

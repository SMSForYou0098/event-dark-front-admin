import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Input, Space, Typography, Row, Col, Switch, Tag, Divider, Alert } from 'antd';
import {
    UsbOutlined,
    DisconnectOutlined,
    SendOutlined,
    ClearOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    CodeOutlined
} from '@ant-design/icons';
import { Bluetooth } from 'lucide-react';

const { TextArea } = Input;
const { Text, Title } = Typography;

const PrinterTesting = () => {
    // State
    const [mode, setMode] = useState('usb'); // 'usb' or 'ble'
    const [status, setStatus] = useState('Disconnected');
    const [isConnected, setIsConnected] = useState(false);

    // Connection Objects
    const [usbPort, setUsbPort] = useState(null);
    const [usbWriter, setUsbWriter] = useState(null);
    const [bleDevice, setBleDevice] = useState(null);
    const [bleChar, setBleChar] = useState(null);

    // UI State
    const [inputData, setInputData] = useState('');
    const [baudRate, setBaudRate] = useState(9600);
    const [flowControl, setFlowControl] = useState(false);
    const [logs, setLogs] = useState([]);
    const logEndRef = useRef(null);

    // Logging
    const addLog = (type, msg) => {
        const time = new Date().toLocaleTimeString([], { hour12: false });
        setLogs(prev => [...prev, { id: Date.now(), time, type, msg }]);
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // USB Logic
    const connectUSB = async () => {
        if (!("serial" in navigator)) return addLog('error', 'Web Serial not supported in this browser.');

        try {
            addLog('info', 'Requesting USB Device...');
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: parseInt(baudRate), flowControl: flowControl ? 'hardware' : 'none' });

            // Get the writable stream writer directly
            const writer = port.writable.getWriter();

            setUsbPort(port);
            setUsbWriter(writer);
            setIsConnected(true);
            setStatus('USB Connected');
            addLog('success', 'USB Connection Established');
        } catch (err) {
            addLog('error', `USB Error: ${err.message}`);
        }
    };

    // BLE Logic
    const connectBLE = async () => {
        if (!navigator.bluetooth) return addLog('error', 'Web Bluetooth not supported.');

        try {
            addLog('info', 'Scanning for BLE Devices...');
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb',
                    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
                    '00001101-0000-1000-8000-00805f9b34fb',
                    'generic_access',
                    'device_information'
                ]
            });

            addLog('info', `Selected: ${device.name || 'Unknown Device'}`);
            device.addEventListener('gattserverdisconnected', disconnect);

            addLog('tx', 'Connecting to GATT Server...');
            const server = await device.gatt.connect();
            addLog('success', 'GATT Connected. Discovering Services...');

            const services = await server.getPrimaryServices();
            let foundChar = null;

            for (const service of services) {
                const uuid = service.uuid;
                const isPrinter = uuid.includes('18f0');
                addLog('info', `Found Service: ${uuid.substring(0, 8)}... ${isPrinter ? '(PRINTER)' : ''}`);

                try {
                    const chars = await service.getCharacteristics();
                    for (const char of chars) {
                        if (!foundChar && (char.properties.write || char.properties.writeWithoutResponse)) {
                            foundChar = char;
                            addLog('success', `  >>> Locked onto WRITE Characteristic: ${char.uuid.substring(0, 8)}...`);
                        }

                        if (char.properties.read && (char.uuid.includes('2a29') || char.uuid.includes('2a00'))) {
                            try {
                                const value = await char.readValue();
                                const decoder = new TextDecoder('utf-8');
                                const info = decoder.decode(value);
                                addLog('success', `  >>> VERIFIED DEVICE INFO: "${info}"`);
                            } catch (e) { /* ignore */ }
                        }
                    }
                } catch (err) {
                    addLog('warn', `  Cannot access chars in service ${uuid.substring(0, 8)}`);
                }
            }

            if (!foundChar) throw new Error('No writable characteristic found. Is this a printer?');

            setBleDevice(device);
            setBleChar(foundChar);
            setIsConnected(true);
            setStatus(`BLE: ${device.name}`);
            addLog('success', 'READY TO PRINT');

        } catch (err) {
            addLog('error', `BLE Error: ${err.message}`);
        }
    };

    // Disconnect
    const disconnect = async () => {
        try {
            if (mode === 'usb') {
                if (usbWriter) { 
                    await usbWriter.releaseLock(); 
                    setUsbWriter(null); 
                }
                if (usbPort) { 
                    await usbPort.close(); 
                    setUsbPort(null); 
                }
            } else {
                if (bleDevice && bleDevice.gatt.connected) { bleDevice.gatt.disconnect(); }
                setBleDevice(null);
                setBleChar(null);
            }
            setIsConnected(false);
            setStatus('Disconnected');
            addLog('info', 'Disconnected');
        } catch (err) {
            addLog('error', `Disconnect Error: ${err.message}`);
        }
    };

    // Sending Engine
    const sendPayload = async (data, isText = true) => {
        if (!isConnected) return addLog('error', 'Not Connected');

        try {
            addLog('tx', `Sending ${isText ? 'Text' : 'Binary'}...`);

            if (mode === 'usb') {
                const encoder = new TextEncoder();
                const encodedData = encoder.encode(data + (isText ? "\n" : ""));
                await usbWriter.write(encodedData);
            } else {
                const encoder = new TextEncoder();
                const encodedData = isText ? encoder.encode(data + '\n') : data;

                const CHUNK_SIZE = 100;
                for (let i = 0; i < encodedData.byteLength; i += CHUNK_SIZE) {
                    const chunk = encodedData.slice(i, i + CHUNK_SIZE);
                    await bleChar.writeValue(chunk);
                    await new Promise(r => setTimeout(r, 20));
                }
            }
            addLog('success', 'Data Sent');
        } catch (err) {
            addLog('error', `Send Failed: ${err.message}`);
        }
    };

    const sendHex = async () => {
        if (!inputData) return;
        try {
            const cleanHex = inputData.replace(/\s+/g, '');
            if (cleanHex.length % 2 !== 0) throw new Error("Invalid Hex");

            const byteArray = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

            if (mode === 'usb') {
                await usbWriter.write(byteArray);
            } else {
                await sendPayload(byteArray, false);
            }
            addLog('success', 'Hex Sent');
        } catch (e) {
            addLog('error', e.message);
        }
    };

    // Test Templates
    const testPrint = (lang) => {
        let cmd = "";
        if (lang === 'ESC') cmd = "\x1B\x40\x1B\x61\x01GYT TESTING\n\x1B\x61\x00- ESC/POS OK -\n\n\n";
        if (lang === 'TSPL') cmd = "SIZE 48 mm,30 mm\r\nCLS\r\nTEXT 20,20,\"3\",0,1,1,\"GYT TSPL OK\"\r\nPRINT 1\r\n";
        if (lang === 'ZPL') cmd = "^XA^FO20,20^ADN,36,20^FDGYT ZPL OK^FS^XZ";
        if (lang === 'CPCL') cmd = "! 0 200 200 210 1\r\nTEXT 4 0 30 40 GYT CPCL OK\r\nFORM\r\nPRINT\r\n";
        setInputData(cmd);
        sendPayload(cmd, true);
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'error': return 'red';
            case 'success': return 'green';
            case 'tx': return 'blue';
            case 'warn': return 'orange';
            default: return 'default';
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Card
                title={
                    <Space>
                        <CodeOutlined style={{ fontSize: 24 }} />
                        <Title level={4} style={{ margin: 0 }}>GYT Label Printer Testing</Title>
                        <Tag color={isConnected ? 'success' : 'error'} icon={isConnected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                            {status}
                        </Tag>
                    </Space>
                }
                bordered={false}
            >
                <Row gutter={[24, 24]}>
                    {/* Left Column: Controls */}
                    <Col xs={24} lg={16}>
                        {/* Mode Selection */}
                        <Card size="small" title="Connection Mode" style={{ marginBottom: 16 }}>
                            <Space>
                                <Button
                                    type={mode === 'usb' ? 'primary' : 'default'}
                                    icon={<UsbOutlined />}
                                    onClick={() => !isConnected && setMode('usb')}
                                    disabled={isConnected}
                                >
                                    USB
                                </Button>
                                <Button
                                    type={mode === 'ble' ? 'primary' : 'default'}
                                    icon={<Bluetooth />}
                                    onClick={() => !isConnected && setMode('ble')}
                                    disabled={isConnected}
                                >
                                    Bluetooth
                                </Button>
                            </Space>
                        </Card>

                        {/* Connection Panel */}
                        {!isConnected ? (
                            <Card size="small" title={mode === 'usb' ? 'USB OTG Connection' : 'Bluetooth Low Energy'} style={{ marginBottom: 16 }}>
                                {mode === 'usb' && (
                                    <Space style={{ marginBottom: 16 }}>
                                        <Select
                                            value={baudRate}
                                            onChange={setBaudRate}
                                            style={{ width: 120 }}
                                            options={[
                                                { value: 9600, label: '9600 Baud' },
                                                { value: 115200, label: '115200 Baud' }
                                            ]}
                                        />
                                        <Space>
                                            <Switch
                                                checked={flowControl}
                                                onChange={setFlowControl}
                                                size="small"
                                            />
                                            <Text type="secondary">Flow Control</Text>
                                        </Space>
                                    </Space>
                                )}
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    icon={mode === 'usb' ? <UsbOutlined /> : <Bluetooth />}
                                    onClick={mode === 'usb' ? connectUSB : connectBLE}
                                >
                                    {mode === 'usb' ? 'Connect via USB' : 'Scan BLE Devices'}
                                </Button>
                                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                                    {mode === 'usb' ? 'Connect printer via USB OTG cable.' : 'Note: Classic Bluetooth printers will NOT appear here.'}
                                </Text>
                            </Card>
                        ) : (
                            <Alert
                                message="System Online"
                                type="success"
                                showIcon
                                action={
                                    <Button danger icon={<DisconnectOutlined />} onClick={disconnect}>
                                        Disconnect
                                    </Button>
                                }
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {/* Quick Test Buttons */}
                        <Card size="small" title="Quick Test" style={{ marginBottom: 16 }}>
                            <Space wrap>
                                <Button onClick={() => testPrint('ESC')} disabled={!isConnected}>Test ESC/POS</Button>
                                <Button onClick={() => testPrint('TSPL')} disabled={!isConnected}>Test TSPL</Button>
                                <Button onClick={() => testPrint('ZPL')} disabled={!isConnected}>Test ZPL</Button>
                                <Button onClick={() => testPrint('CPCL')} disabled={!isConnected}>Test CPCL</Button>
                            </Space>
                        </Card>

                        {/* Command Editor */}
                        <Card
                            size="small"
                            title="Command Editor"
                            extra={<Button type="text" icon={<ClearOutlined />} onClick={() => setInputData('')}>Clear</Button>}
                        >
                            <TextArea
                                value={inputData}
                                onChange={e => setInputData(e.target.value)}
                                placeholder="Enter raw commands here..."
                                rows={8}
                                style={{ fontFamily: 'monospace', marginBottom: 16 }}
                            />
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={() => sendPayload(inputData, true)}
                                    disabled={!isConnected}
                                >
                                    Send Text
                                </Button>
                                <Button
                                    type="default"
                                    icon={<CodeOutlined />}
                                    onClick={sendHex}
                                    disabled={!isConnected}
                                >
                                    Send HEX
                                </Button>
                            </Space>
                        </Card>
                    </Col>

                    {/* Right Column: Logs */}
                    <Col xs={24} lg={8}>
                        <Card
                            size="small"
                            title="System Log"
                            extra={<Button type="text" size="small" onClick={() => setLogs([])}>Clear</Button>}
                            bodyStyle={{
                                height: 500,
                                overflowY: 'auto',
                                background: '#1a1a1a',
                                padding: 12
                            }}
                        >
                            {logs.length === 0 && (
                                <Text type="secondary" italic>System Ready...</Text>
                            )}
                            {logs.map(log => (
                                <div key={log.id} style={{ marginBottom: 4, wordBreak: 'break-word' }}>
                                    <Text type="secondary" style={{ fontSize: 10, marginRight: 8 }}>{log.time}</Text>
                                    <Text style={{ color: getLogColor(log.type) === 'default' ? '#888' : getLogColor(log.type) }}>
                                        {log.msg}
                                    </Text>
                                </div>
                            ))}
                            <div ref={logEndRef}></div>
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default PrinterTesting;

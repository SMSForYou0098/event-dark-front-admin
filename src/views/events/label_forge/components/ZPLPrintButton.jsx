// ZPL Print Button Component
// Prints ZPL code to Zebra thermal printers via browser

import React, { useState, useMemo } from 'react';
import { Button, Modal, message, Select, Input, Tooltip, Row, Col, Divider, Segmented } from 'antd';
import { PrinterOutlined, SettingOutlined, QrcodeOutlined, UserOutlined, BankOutlined, IdcardOutlined, ReloadOutlined, EditOutlined, FormOutlined } from '@ant-design/icons';
import { LABEL_SIZES } from '../utils/zplGenerator';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Sample ZPL for 3" x 2" Badge Label (609 x 406 dots at 203 DPI)
 * 
 * ZPL Reference:
 * - ^XA = Start format
 * - ^XZ = End format
 * - ^FO = Field Origin (x,y position in dots)
 * - ^A0 = Scalable font (height,width)
 * - ^FD = Field Data
 * - ^FS = Field Separator
 * - ^GB = Graphic Box (width,height,thickness,color,rounding)
 * - ^BQ = QR Code (orientation,model,magnification)
 * - ^PW = Print Width
 * - ^LL = Label Length
 * - ^CI28 = UTF-8 encoding
 */
const SAMPLE_ZPL_3X2_BADGE = `^XA

^FX === 3" x 2" Event Badge Label (609 x 406 dots @ 203 DPI) ===
^PW609
^LL406
^CI28
^LH0,0

^FX Top border line
^FO20,15^GB569,3,3,B,0^FS

^FX Name (large, centered) - "Rahul Sharma"
^FO120,45^A0N,50,50^FDRahul Sharma^FS

^FX Company name (medium, centered)
^FO130,105^A0N,32,32^FDTechCorp Solutions^FS

^FX Designation (smaller, centered)
^FO185,145^A0N,24,24^FDSenior Developer^FS

^FX Separator line
^FO30,180^GB549,2,2,B,0^FS

^FX QR Code (centered) - Token/ID for scanning
^FO230,195^BQN,2,5^FDMA,BADGE-2024-RAHUL-001^FS

^FX Stall/Booth number
^FO245,360^A0N,26,26^FDStall: A-101^FS

^FX Bottom border line
^FO20,390^GB569,3,3,B,0^FS

^XZ`;

// Default sample data for badge
const DEFAULT_BADGE_DATA = {
    name: 'Rahul',
    surname: 'Sharma',
    company_name: 'TechCorp Solutions',
    designation: 'Senior Developer',
    stall_number: 'A-101',
    qrcode: 'BADGE-2024-RAHUL-001',
};

/**
 * Generate ZPL code for a badge label using native commands
 * This is FAST - no bitmap conversion needed!
 * 
 * @param {Object} data - Badge data
 * @param {string} sizeKey - Label size key ('2x2', '3x2', etc.)
 * @returns {string} - ZPL code string
 */
const generateBadgeLabelZPL = (data, sizeKey = '3x2') => {
    const {
        name = '',
        surname = '',
        company_name = '',
        designation = '',
        stall_number = '',
        qrcode = '',
    } = data;

    const size = LABEL_SIZES[sizeKey] || LABEL_SIZES['3x2'];
    const fullName = `${name} ${surname}`.trim() || 'Guest';

    // Calculate text positions for centering
    // Approximate character width at given font size (0.6 ratio)
    const calcCenteredX = (text, fontSize) => {
        const textWidth = text.length * fontSize * 0.6;
        return Math.max(20, Math.round((size.width - textWidth) / 2));
    };

    const lines = [];
    
    // Start ZPL
    lines.push('^XA');
    lines.push('');
    lines.push(`^FX === ${sizeKey.replace('x', '" x ')}" Badge Label (${size.width} x ${size.height} dots @ 203 DPI) ===`);
    lines.push(`^PW${size.width}`);
    lines.push(`^LL${size.height}`);
    lines.push('^CI28');  // UTF-8 encoding
    lines.push('^LH0,0'); // Label home at origin
    lines.push('');

    // Top border line
    lines.push('^FX Top border');
    lines.push(`^FO20,15^GB${size.width - 40},3,3,B,0^FS`);
    lines.push('');

    let yPos = 45;

    // Name - large and bold
    if (fullName) {
        const nameSize = sizeKey === '2x1' ? 35 : sizeKey === '2x2' ? 42 : 50;
        const nameX = calcCenteredX(fullName, nameSize);
        lines.push('^FX Name (large, centered)');
        lines.push(`^FO${nameX},${yPos}^A0N,${nameSize},${nameSize}^FD${fullName}^FS`);
        // Bold effect - print again slightly offset
        lines.push(`^FO${nameX + 1},${yPos}^A0N,${nameSize},${nameSize}^FD${fullName}^FS`);
        yPos += nameSize + 15;
    }

    // Company name - medium
    if (company_name) {
        const compSize = sizeKey === '2x1' ? 22 : sizeKey === '2x2' ? 28 : 32;
        const compX = calcCenteredX(company_name, compSize);
        lines.push('');
        lines.push('^FX Company name');
        lines.push(`^FO${compX},${yPos}^A0N,${compSize},${compSize}^FD${company_name}^FS`);
        yPos += compSize + 10;
    }

    // Designation - smaller
    if (designation) {
        const desSize = sizeKey === '2x1' ? 18 : sizeKey === '2x2' ? 22 : 24;
        const desX = calcCenteredX(designation, desSize);
        lines.push('');
        lines.push('^FX Designation');
        lines.push(`^FO${desX},${yPos}^A0N,${desSize},${desSize}^FD${designation}^FS`);
        yPos += desSize + 15;
    }

    // Separator line before QR
    if (qrcode || stall_number) {
        lines.push('');
        lines.push('^FX Separator line');
        lines.push(`^FO30,${yPos}^GB${size.width - 60},2,2,B,0^FS`);
        yPos += 15;
    }

    // QR Code - centered
    if (qrcode) {
        // QR magnification: 3-5 works well for most badges
        const qrMag = sizeKey === '2x1' ? 3 : sizeKey === '2x2' ? 4 : 5;
        const qrSize = qrMag * 25; // Approximate QR size
        const qrX = Math.round((size.width - qrSize) / 2);
        lines.push('');
        lines.push('^FX QR Code (centered)');
        lines.push(`^FO${qrX},${yPos}^BQN,2,${qrMag}^FDMA,${qrcode}^FS`);
        yPos += qrSize + 20;
    }

    // Stall number
    if (stall_number) {
        const stallSize = sizeKey === '2x1' ? 20 : 26;
        const stallText = `Stall: ${stall_number}`;
        const stallX = calcCenteredX(stallText, stallSize);
        const stallY = size.height - 50;
        lines.push('');
        lines.push('^FX Stall number');
        lines.push(`^FO${stallX},${stallY}^A0N,${stallSize},${stallSize}^FD${stallText}^FS`);
    }

    // Bottom border line
    lines.push('');
    lines.push('^FX Bottom border');
    lines.push(`^FO20,${size.height - 18}^GB${size.width - 40},3,3,B,0^FS`);
    lines.push('');

    // End ZPL
    lines.push('^XZ');

    return lines.join('\n');
};

/**
 * ZPL Print Button Component
 * 
 * Supports multiple printing methods:
 * 1. Bluetooth (Web Bluetooth API)
 * 2. Raw Print (via print dialog with monospace formatting)
 * 3. Zebra BrowserPrint SDK
 * 4. Network Print (Direct IP)
 * 5. Clipboard copy (for manual pasting)
 * 6. Download as .zpl file
 * 
 * @param {Object} props
 * @param {string} props.zplCode - ZPL code to print (optional, uses sample if not provided)
 * @param {string} props.buttonText - Custom button text
 * @param {Object} props.buttonProps - Additional button props
 * @param {Object} props.badgeData - Badge data for dynamic generation
 */
const ZPLPrintButton = ({ 
    zplCode = null, 
    buttonText = 'Print Badge',
    buttonProps = {},
    showSettings = true,
    badgeData = null,
}) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [printMethod, setPrintMethod] = useState('bluetooth');
    const [printerIP, setPrinterIP] = useState('');
    const [printerPort, setPrinterPort] = useState('9100');
    const [customZPL, setCustomZPL] = useState('');
    const [bluetoothDevice, setBluetoothDevice] = useState(null);
    const [bluetoothConnected, setBluetoothConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Badge form data
    const [formData, setFormData] = useState(badgeData || DEFAULT_BADGE_DATA);
    const [labelSize, setLabelSize] = useState('3x2');
    const [inputMode, setInputMode] = useState('form'); // 'form' or 'custom'

    // Generate ZPL dynamically from form data
    const generatedZPL = useMemo(() => {
        if (inputMode === 'custom' && customZPL) {
            return customZPL;
        }
        if (zplCode) {
            return zplCode;
        }
        // Generate badge ZPL from form data using native ZPL commands
        return generateBadgeLabelZPL(formData, labelSize);
    }, [formData, labelSize, inputMode, customZPL, zplCode]);

    // Get the ZPL code to print
    const getZPLCode = () => generatedZPL;

    // Update form field
    const updateFormField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Reset to default sample
    const resetToDefault = () => {
        setFormData(DEFAULT_BADGE_DATA);
        setCustomZPL('');
        setInputMode('form');
    };

    // Load sample ZPL for custom mode
    const loadSampleZPL = () => {
        setCustomZPL(SAMPLE_ZPL_3X2_BADGE);
    };

    /**
     * Connect to Bluetooth Printer
     */
    const connectBluetooth = async () => {
        if (!navigator.bluetooth) {
            message.error('Web Bluetooth is not supported in this browser. Try Chrome or Edge.');
            return null;
        }

        setIsConnecting(true);

        try {
            // Request Bluetooth device - accepts all devices that have serial-like services
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '38eb4a80-c570-11e3-9507-0002a5d5c51b', // Zebra Serial Service
                    '00001101-0000-1000-8000-00805f9b34fb', // SPP Service
                    '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip transparent UART
                    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
                ]
            });

            message.info(`Connecting to ${device.name || 'Bluetooth Printer'}...`);

            // Connect to GATT server
            const server = await device.gatt.connect();
            
            // Try to find a writable characteristic
            let writeCharacteristic = null;
            const services = await server.getPrimaryServices();
            
            for (const service of services) {
                try {
                    const characteristics = await service.getCharacteristics();
                    for (const char of characteristics) {
                        if (char.properties.write || char.properties.writeWithoutResponse) {
                            writeCharacteristic = char;
                            console.log('Found writable characteristic:', char.uuid);
                            break;
                        }
                    }
                    if (writeCharacteristic) break;
                } catch (e) {
                    console.log('Service scan error:', e);
                }
            }

            if (!writeCharacteristic) {
                throw new Error('No writable characteristic found on printer');
            }

            // Store device info
            device._writeCharacteristic = writeCharacteristic;
            setBluetoothDevice(device);
            setBluetoothConnected(true);
            
            // Handle disconnection
            device.addEventListener('gattserverdisconnected', () => {
                setBluetoothConnected(false);
                setBluetoothDevice(null);
                message.warning('Bluetooth printer disconnected');
            });

            message.success(`Connected to ${device.name || 'Bluetooth Printer'}!`);
            setIsConnecting(false);
            return device;

        } catch (error) {
            setIsConnecting(false);
            if (error.name === 'NotFoundError') {
                message.info('Bluetooth pairing cancelled');
            } else {
                message.error(`Bluetooth error: ${error.message}`);
                console.error('Bluetooth connection error:', error);
            }
            return null;
        }
    };

    /**
     * Disconnect Bluetooth
     */
    const disconnectBluetooth = () => {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            bluetoothDevice.gatt.disconnect();
        }
        setBluetoothDevice(null);
        setBluetoothConnected(false);
        message.info('Bluetooth disconnected');
    };

    /**
     * Print via Bluetooth
     */
    const printViaBluetooth = async () => {
        let device = bluetoothDevice;
        
        // Connect if not connected
        if (!device || !device.gatt.connected) {
            device = await connectBluetooth();
            if (!device) return;
        }

        const zpl = getZPLCode();
        const encoder = new TextEncoder();
        const data = encoder.encode(zpl);

        try {
            const writeChar = device._writeCharacteristic;
            
            // Send data in chunks (BLE has MTU limits, typically 20-512 bytes)
            const chunkSize = 20; // Safe default, some devices support larger
            
            message.loading({ content: 'Sending to printer...', key: 'btprint' });
            
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                
                if (writeChar.properties.writeWithoutResponse) {
                    await writeChar.writeValueWithoutResponse(chunk);
                } else {
                    await writeChar.writeValue(chunk);
                }
                
                // Small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            message.success({ content: 'ZPL sent to printer via Bluetooth!', key: 'btprint' });

        } catch (error) {
            message.error({ content: `Bluetooth print failed: ${error.message}`, key: 'btprint' });
            console.error('Bluetooth print error:', error);
            
            // Try to reconnect on next print
            setBluetoothConnected(false);
        }
    };

    /**
     * Method 1: Raw Print via Browser Print Dialog
     * Creates an iframe with the ZPL code and triggers print
     */
    const printViaRawPrint = () => {
        const zpl = getZPLCode();
        
        // Create a hidden iframe for printing
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);

        const printDoc = printFrame.contentWindow.document;
        printDoc.open();
        printDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ZPL Print</title>
                <style>
                    @page {
                        size: 4in 6in;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 10px;
                        font-family: 'Courier New', monospace;
                        font-size: 10px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>${zpl.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
            </html>
        `);
        printDoc.close();

        // Wait for content to load then print
        printFrame.onload = () => {
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                
                // Clean up after print dialog closes
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 250);
        };

        message.info('Print dialog opened. Select your Zebra printer.');
    };

    /**
     * Method 2: Direct Print via Zebra BrowserPrint SDK
     * Requires Zebra BrowserPrint to be installed on the client machine
     */
    const printViaBrowserPrint = async () => {
        const zpl = getZPLCode();

        // Check if BrowserPrint is available
        if (typeof window.BrowserPrint === 'undefined') {
            message.error('Zebra BrowserPrint SDK not found. Please install Zebra BrowserPrint.');
            window.open('https://www.zebra.com/us/en/support-downloads/printer-software/by-request-software.html', '_blank');
            return;
        }

        try {
            // Get default printer
            window.BrowserPrint.getDefaultDevice('printer', (device) => {
                if (device) {
                    device.send(zpl, 
                        () => message.success('ZPL sent to printer successfully!'),
                        (error) => message.error(`Print failed: ${error}`)
                    );
                } else {
                    message.error('No Zebra printer found. Please check connection.');
                }
            }, (error) => {
                message.error(`Error finding printer: ${error}`);
            });
        } catch (error) {
            message.error(`BrowserPrint error: ${error.message}`);
        }
    };

    /**
     * Method 3: Network Print via WebSocket/HTTP
     * Sends ZPL directly to printer IP address
     */
    const printViaNetwork = async () => {
        const zpl = getZPLCode();

        if (!printerIP) {
            message.error('Please enter printer IP address in settings.');
            setSettingsOpen(true);
            return;
        }

        try {
            // Try to send via fetch (requires CORS to be enabled on printer)
            // Note: no-cors mode means we can't read the response
            await fetch(`http://${printerIP}:${printerPort}/pstprnt`, {
                method: 'POST',
                body: zpl,
                headers: {
                    'Content-Type': 'text/plain',
                },
                mode: 'no-cors'
            });
            
            message.success('ZPL sent to printer. Check printer for output.');
        } catch (error) {
            message.warning('Network print attempted. If print fails, try Raw Print method.');
            console.error('Network print error:', error);
        }
    };

    /**
     * Method 4: Copy to Clipboard
     * Copies ZPL code for manual pasting
     */
    const copyToClipboard = async () => {
        const zpl = getZPLCode();
        
        try {
            await navigator.clipboard.writeText(zpl);
            message.success('ZPL code copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = zpl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            message.success('ZPL code copied to clipboard!');
        }
    };

    /**
     * Method 5: Download as ZPL file
     */
    const downloadZPL = () => {
        const zpl = getZPLCode();
        const blob = new Blob([zpl], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'label.zpl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.success('ZPL file downloaded!');
    };

    // Handle print based on selected method
    const handlePrint = () => {
        switch (printMethod) {
            case 'bluetooth':
                printViaBluetooth();
                break;
            case 'rawPrint':
                printViaRawPrint();
                break;
            case 'browserPrint':
                printViaBrowserPrint();
                break;
            case 'network':
                printViaNetwork();
                break;
            case 'clipboard':
                copyToClipboard();
                break;
            case 'download':
                downloadZPL();
                break;
            default:
                printViaBluetooth();
        }
    };

    return (
        <div className="zpl-print-button-container">
            <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                {...buttonProps}
            >
                {buttonText}
            </Button>

            {showSettings && (
                <Tooltip title="Print Settings">
                    <Button
                        icon={<SettingOutlined />}
                        onClick={() => setSettingsOpen(true)}
                        style={{ marginLeft: 8 }}
                    />
                </Tooltip>
            )}

            <Modal
                title="ZPL Badge Printer"
                open={settingsOpen}
                onCancel={() => setSettingsOpen(false)}
                footer={[
                    <Button key="reset" icon={<ReloadOutlined />} onClick={resetToDefault}>
                        Reset
                    </Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                        Print Badge
                    </Button>,
                ]}
                width={800}
            >
                <Row gutter={24}>
                    {/* Left Column - Badge Data Form or Custom ZPL */}
                    <Col span={12}>
                        {/* Mode Toggle */}
                        <div style={{ marginBottom: 16 }}>
                            <Segmented
                                value={inputMode}
                                onChange={setInputMode}
                                options={[
                                    { label: <><FormOutlined /> Badge Form</>, value: 'form' },
                                    { label: <><EditOutlined /> Custom ZPL</>, value: 'custom' },
                                ]}
                                block
                            />
                        </div>

                        {inputMode === 'form' ? (
                            <>
                                <Divider orientation="left">Badge Data</Divider>
                                
                                <div style={{ marginBottom: 16 }}>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                                <UserOutlined /> First Name
                                            </label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => updateFormField('name', e.target.value)}
                                                placeholder="First Name"
                                            />
                                        </Col>
                                        <Col span={12}>
                                            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                                <UserOutlined /> Surname
                                            </label>
                                            <Input
                                                value={formData.surname}
                                                onChange={(e) => updateFormField('surname', e.target.value)}
                                                placeholder="Surname"
                                            />
                                        </Col>
                                    </Row>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                        <BankOutlined /> Company Name
                                    </label>
                                    <Input
                                        value={formData.company_name}
                                        onChange={(e) => updateFormField('company_name', e.target.value)}
                                        placeholder="Company Name"
                                    />
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                        <IdcardOutlined /> Designation
                                    </label>
                                    <Input
                                        value={formData.designation}
                                        onChange={(e) => updateFormField('designation', e.target.value)}
                                        placeholder="Designation"
                                    />
                                </div>

                                <Row gutter={8}>
                                    <Col span={12}>
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                                Stall Number
                                            </label>
                                            <Input
                                                value={formData.stall_number}
                                                onChange={(e) => updateFormField('stall_number', e.target.value)}
                                                placeholder="A-101"
                                            />
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                                Label Size
                                            </label>
                                            <Select
                                                value={labelSize}
                                                onChange={setLabelSize}
                                                style={{ width: '100%' }}
                                            >
                                                <Option value="2x1">2" x 1"</Option>
                                                <Option value="2x2">2" x 2"</Option>
                                                <Option value="3x2">3" x 2" (Recommended)</Option>
                                                <Option value="4x2">4" x 2"</Option>
                                                <Option value="4x3">4" x 3"</Option>
                                            </Select>
                                        </div>
                                    </Col>
                                </Row>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                                        <QrcodeOutlined /> QR Code Data
                                    </label>
                                    <Input
                                        value={formData.qrcode}
                                        onChange={(e) => updateFormField('qrcode', e.target.value)}
                                        placeholder="Token or ID for QR code"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <Divider orientation="left">Paste Custom ZPL Code</Divider>
                                
                                <div style={{ marginBottom: 12 }}>
                                    <Button size="small" onClick={loadSampleZPL} style={{ marginRight: 8 }}>
                                        Load Sample
                                    </Button>
                                    <Button size="small" onClick={() => setCustomZPL('')}>
                                        Clear
                                    </Button>
                                </div>

                                <TextArea
                                    value={customZPL}
                                    onChange={(e) => setCustomZPL(e.target.value)}
                                    placeholder="Paste your ZPL code here...&#10;&#10;Example:&#10;^XA&#10;^FO50,50^A0N,40,40^FDHello World^FS&#10;^XZ"
                                    rows={12}
                                    style={{ 
                                        fontFamily: 'Consolas, monospace', 
                                        fontSize: 11,
                                        background: '#0d0d0d',
                                        color: '#00ff00',
                                        border: '1px solid #333',
                                    }}
                                />

                                <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                                    <strong>Tip:</strong> ZPL code must start with <code>^XA</code> and end with <code>^XZ</code>
                                </div>
                            </>
                        )}

                        <Divider orientation="left">Print Settings</Divider>
                        
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                                Print Method:
                            </label>
                            <Select
                                value={printMethod}
                                onChange={setPrintMethod}
                                style={{ width: '100%' }}
                            >
                                <Option value="bluetooth">🔵 Bluetooth</Option>
                                <Option value="rawPrint">Raw Print (Browser)</Option>
                                <Option value="browserPrint">Zebra BrowserPrint</Option>
                                <Option value="network">Network (IP)</Option>
                                <Option value="clipboard">Copy to Clipboard</Option>
                                <Option value="download">Download .zpl</Option>
                            </Select>
                        </div>

                        {printMethod === 'network' && (
                            <Row gutter={8}>
                                <Col span={16}>
                                    <Input
                                        value={printerIP}
                                        onChange={(e) => setPrinterIP(e.target.value)}
                                        placeholder="Printer IP (e.g., 192.168.1.100)"
                                    />
                                </Col>
                                <Col span={8}>
                                    <Input
                                        value={printerPort}
                                        onChange={(e) => setPrinterPort(e.target.value)}
                                        placeholder="9100"
                                    />
                                </Col>
                            </Row>
                        )}

                        {printMethod === 'bluetooth' && (
                            <div style={{ padding: 12, background: '#1a1a2e', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ 
                                        width: 10, 
                                        height: 10, 
                                        borderRadius: '50%', 
                                        background: bluetoothConnected ? '#52c41a' : '#ff4d4f',
                                        boxShadow: bluetoothConnected ? '0 0 6px #52c41a' : 'none'
                                    }} />
                                    <span style={{ fontSize: 12 }}>
                                        {bluetoothConnected 
                                            ? `Connected: ${bluetoothDevice?.name || 'Printer'}` 
                                            : 'Not connected'}
                                    </span>
                                    {!bluetoothConnected ? (
                                        <Button 
                                            size="small"
                                            type="primary"
                                            onClick={connectBluetooth}
                                            loading={isConnecting}
                                        >
                                            {isConnecting ? '...' : 'Pair'}
                                        </Button>
                                    ) : (
                                        <Button size="small" danger onClick={disconnectBluetooth}>
                                            Disconnect
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Col>

                    {/* Right Column - ZPL Preview */}
                    <Col span={12}>
                        <Divider orientation="left">ZPL Code Preview</Divider>
                        
                        {/* Visual Label Preview - Only show for form mode */}
                        {inputMode === 'form' ? (
                            <div style={{
                                background: '#fff',
                                border: '2px solid #333',
                                borderRadius: 4,
                                padding: 12,
                                marginBottom: 12,
                                minHeight: 150,
                                color: '#000',
                                textAlign: 'center',
                            }}>
                                <div style={{ borderBottom: '2px solid #000', marginBottom: 8, paddingBottom: 4 }}>
                                    <strong style={{ fontSize: 18 }}>{`${formData.name} ${formData.surname}`.trim() || 'Guest'}</strong>
                                </div>
                                {formData.company_name && (
                                    <div style={{ fontSize: 14, marginBottom: 4 }}>{formData.company_name}</div>
                                )}
                                {formData.designation && (
                                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{formData.designation}</div>
                                )}
                                {formData.qrcode && (
                                    <div style={{ 
                                        display: 'inline-block',
                                        padding: 8,
                                        background: '#f0f0f0',
                                        fontSize: 10,
                                        marginBottom: 8,
                                        border: '1px solid #ddd',
                                    }}>
                                        [QR: {formData.qrcode.substring(0, 20)}...]
                                    </div>
                                )}
                                {formData.stall_number && (
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>Stall: {formData.stall_number}</div>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                background: '#1a1a2e',
                                border: '1px solid #333',
                                borderRadius: 4,
                                padding: 12,
                                marginBottom: 12,
                                minHeight: 60,
                                color: '#888',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div>
                                    <EditOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                                    <span style={{ fontSize: 12 }}>Custom ZPL Mode - Preview not available</span>
                                </div>
                            </div>
                        )}

                        {/* ZPL Code */}
                        <pre style={{ 
                            background: '#1a1a1a', 
                            padding: 12, 
                            borderRadius: 4,
                            maxHeight: inputMode === 'custom' ? 350 : 280,
                            overflow: 'auto',
                            fontSize: 10,
                            color: '#00ff00',
                            fontFamily: 'Consolas, monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                        }}>
                            {getZPLCode() || '// Enter ZPL code on the left panel'}
                        </pre>

                        <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                            {inputMode === 'form' ? (
                                <>
                                    <strong>Label:</strong> {labelSize.replace('x', '" × ')}" • {LABEL_SIZES[labelSize]?.width} × {LABEL_SIZES[labelSize]?.height} dots @ 203 DPI
                                </>
                            ) : (
                                <>
                                    <strong>Custom ZPL:</strong> {customZPL ? `${customZPL.length} characters` : 'No code entered'}
                                </>
                            )}
                        </div>
                    </Col>
                </Row>
            </Modal>
        </div>
    );
};

export default ZPLPrintButton;

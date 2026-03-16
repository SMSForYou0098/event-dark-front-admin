import React from 'react';
import { Radio, Space } from 'antd';

const PrinterTypeSelector = ({ printerType, setPrinterType, isConnected, printerOptions }) => {
    if (isConnected) return null;

    // Default options for POS printers (ESC/POS)
    const defaultPrinterOptions = [
        {
            value: 'escpos-native',
            title: 'ESC/POS (Modern)',
            description: 'Native QR - Epson, Star, most receipt printers'
        },
        {
            value: 'escpos-bitmap',
            title: 'ESC/POS (Old)',
            description: 'Bitmap QR - Old thermal printers'
        },
    ];

    // Use custom options if provided, otherwise use default
    const options = printerOptions || defaultPrinterOptions;

    return (
        <div className="mb-3">
            <div className="mb-2 fw-semibold">
                Printer Type:
            </div>
            <Radio.Group
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value)}
            >
                <Space direction="vertical" size={12}>
                    {options.map((option) => (
                        <Radio key={option.value} value={option.value}>
                            <div style={{ marginLeft: '4px' }}>
                                <div
                                    className="fw-semibold"
                                    style={{ fontSize: '13px', lineHeight: '1.4' }}
                                >
                                    {option.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: '#8c8c8c',
                                        lineHeight: '1.4',
                                        marginTop: '2px'
                                    }}
                                >
                                    {option.description}
                                </div>
                            </div>
                        </Radio>
                    ))}
                </Space>
            </Radio.Group>
        </div>
    );
};

export default PrinterTypeSelector;

// Header Component for Label Forge

import React, { useState } from 'react';
import { Button, Select, Tooltip, Dropdown, Badge } from 'antd';
import {
    UndoOutlined,
    RedoOutlined,
    CodeOutlined,
    SaveOutlined,
    UploadOutlined,
    ReloadOutlined,
    LayoutOutlined,
    PrinterOutlined,
    UsbOutlined,
    WifiOutlined,
    DisconnectOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { Printer, PenTool, Eye } from 'lucide-react';
import { PRINTER_LANGUAGES } from '../constants';

/**
 * Header component with tabs and toolbar
 */
const Header = ({
    activeTab,
    setActiveTab,
    printerLang,
    setPrinterLang,
    historyIndex,
    historyLength,
    undo,
    redo,
    handleReset,
    handleLoadDemo,
    handleExportTemplate,
    onImportClick,
    handleGenerateCode,
    // Printer props
    handlePrint,
    isPrinting,
    isConnected,
    connectUSB,
    connectBluetooth,
    printerStatus,
    deviceName
}) => {
    const [connecting, setConnecting] = useState(false);

    // Handle USB connection
    const onConnectUSB = async () => {
        setConnecting(true);
        try {
            await connectUSB();
        } catch (err) {
            console.error('USB connect error:', err);
        } finally {
            setConnecting(false);
        }
    };

    // Handle Bluetooth connection
    const onConnectBluetooth = async () => {
        setConnecting(true);
        try {
            await connectBluetooth();
        } catch (err) {
            console.error('Bluetooth connect error:', err);
        } finally {
            setConnecting(false);
        }
    };

    // Dropdown menu items for printer connection
    const printerMenuItems = [
        {
            key: 'usb',
            icon: <UsbOutlined />,
            label: 'Connect via USB',
            onClick: onConnectUSB,
        },
        {
            key: 'bluetooth',
            icon: <WifiOutlined />,
            label: 'Connect via Bluetooth',
            onClick: onConnectBluetooth,
        },
    ];
    return (
        <header className="lf-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--lf-border-secondary)' }}>
            {/* Left side - Logo & Tabs */}
            <div className="d-flex align-items-center gap-4">
                {/* Logo */}
                <div className="d-flex align-items-center gap-2">
                    <div 
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: '#b51515' 
                        }}
                    >
                        <Printer size={22} color="white" />
                    </div>
                    <div>
                        <h5 className="mb-0 fw-bold lf-text-heading" style={{ fontSize: 16 }}>
                            LabelForge
                        </h5>
                        <small className="lf-text-muted" style={{ fontSize: 11 }}>
                            Thermal Printer Design Suite
                        </small>
                    </div>
                </div>

                {/* Tabs */}
                <div 
                    className="d-flex rounded p-1 lf-tab-switcher"
                >
                    <Button
                        type={activeTab === 'editor' ? 'primary' : 'text'}
                        size="small"
                        icon={<PenTool size={14} />}
                        onClick={() => setActiveTab('editor')}
                        style={{ 
                            boxShadow: activeTab === 'editor' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none'
                        }}
                    >
                        Editor
                    </Button>
                    <Button
                        type={activeTab === 'preview' ? 'primary' : 'text'}
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => setActiveTab('preview')}
                        style={{ 
                            boxShadow: activeTab === 'preview' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none'
                        }}
                    >
                        Preview
                    </Button>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="d-flex align-items-center gap-3">
                {/* File Operations */}
                <div 
                    className="d-flex align-items-center gap-1 rounded p-1 lf-tab-switcher"
                >
                    <Tooltip title="Reset Canvas">
                        <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            danger
                        />
                    </Tooltip>
                    <div 
                        style={{ 
                            width: 1, 
                            height: 20, 
                            backgroundColor: 'var(--lf-border-secondary)', 
                            margin: '0 4px' 
                        }} 
                    />
                    <Tooltip title="Load Demo Template">
                        <Button
                            type="text"
                            size="small"
                            icon={<LayoutOutlined />}
                            onClick={handleLoadDemo}
                        />
                    </Tooltip>
                    <Tooltip title="Export Template">
                        <Button
                            type="text"
                            size="small"
                            icon={<SaveOutlined />}
                            onClick={handleExportTemplate}
                            style={{ color: '#04d182' }}
                        />
                    </Tooltip>
                    <Tooltip title="Import Template">
                        <Button
                            type="text"
                            size="small"
                            icon={<UploadOutlined />}
                            onClick={onImportClick}
                            style={{ color: '#ffc542' }}
                        />
                    </Tooltip>
                </div>

                {/* Undo/Redo */}
                <div 
                    className="d-flex align-items-center gap-1 rounded p-1 lf-tab-switcher"
                >
                    <Tooltip title="Undo (Ctrl+Z)">
                        <Button
                            type="text"
                            size="small"
                            icon={<UndoOutlined />}
                            onClick={undo}
                            disabled={historyIndex <= 0}
                        />
                    </Tooltip>
                    <Tooltip title="Redo (Ctrl+Y)">
                        <Button
                            type="text"
                            size="small"
                            icon={<RedoOutlined />}
                            onClick={redo}
                            disabled={historyIndex >= historyLength - 1}
                        />
                    </Tooltip>
                </div>

                {/* Printer Language */}
                <div 
                    className="d-flex align-items-center gap-2 rounded p-1 px-2 lf-tab-switcher"
                >
                    <span className="small fw-semibold lf-text-muted">
                        Language:
                    </span>
                    <Select
                        size="small"
                        value={printerLang}
                        onChange={setPrinterLang}
                        style={{ width: 160 }}
                        options={PRINTER_LANGUAGES}
                    />
                </div>

                {/* Generate Code Button */}
                <Button
                    type="default"
                    icon={<CodeOutlined />}
                    onClick={handleGenerateCode}
                >
                    Generate Code
                </Button>

                {/* Printer Connection & Print */}
                <div className="d-flex align-items-center gap-2">
                    {isConnected ? (
                        <Tooltip title={`Connected: ${deviceName || 'Printer'}`}>
                            <Badge 
                                status="success" 
                                text={
                                    <span className="small lf-text-muted">
                                        <CheckCircleFilled style={{ color: '#52c41a', marginRight: 4 }} />
                                        {deviceName || 'Connected'}
                                    </span>
                                } 
                            />
                        </Tooltip>
                    ) : (
                        <Dropdown
                            menu={{ items: printerMenuItems }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <Button
                                type="default"
                                icon={<DisconnectOutlined />}
                                loading={connecting}
                            >
                                {connecting ? 'Connecting...' : 'Connect Printer'}
                            </Button>
                        </Dropdown>
                    )}

                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        disabled={!isConnected}
                        loading={isPrinting}
                        style={{ 
                            backgroundColor: isConnected ? '#52c41a' : undefined,
                            borderColor: isConnected ? '#52c41a' : undefined
                        }}
                    >
                        {isPrinting ? 'Printing...' : 'Print'}
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;

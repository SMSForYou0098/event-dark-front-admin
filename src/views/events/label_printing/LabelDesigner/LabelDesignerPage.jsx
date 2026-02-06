/**
 * Label Designer Page
 * 
 * Standalone page for visual drag-and-drop label design.
 * Allows users to:
 * - Drag fields onto the label canvas
 * - Resize label by dragging edges
 * - Position and resize individual elements
 * - Configure fonts and styles
 * - Export configuration for use in printing
 */

import React, { useState, useCallback } from 'react';
import { Card, Button, Space, Tag, message, Modal, Input } from 'antd';
import {
    PrinterOutlined,
    SaveOutlined,
    FolderOpenOutlined,
    SettingOutlined,
    DownloadOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import LabelDesigner from './LabelDesigner';
import { usePrinter } from 'Context/PrinterContext';
import './LabelDesigner.css';

// Saved layout templates
const SAVED_LAYOUTS = [
    {
        id: 'basic-badge',
        name: 'Basic Badge',
        config: {
            labelWidth: 50.8,
            labelHeight: 50.8,
            elements: [
                { fieldId: 'name', x: 50, y: 20, width: 150, height: 30, fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
                { fieldId: 'company_name', x: 35, y: 60, width: 180, height: 26, fontSize: 14, textAlign: 'center', fontWeight: 'normal' },
                { fieldId: 'designation', x: 45, y: 95, width: 160, height: 24, fontSize: 12, textAlign: 'center', fontWeight: 'normal' },
            ],
        },
    },
    {
        id: 'badge-with-qr',
        name: 'Badge with QR',
        config: {
            labelWidth: 76.2,
            labelHeight: 50.8,
            elements: [
                { fieldId: 'name', x: 20, y: 20, width: 160, height: 30, fontSize: 16, textAlign: 'left', fontWeight: 'bold' },
                { fieldId: 'company_name', x: 20, y: 55, width: 160, height: 24, fontSize: 12, textAlign: 'left', fontWeight: 'normal' },
                { fieldId: 'designation', x: 20, y: 85, width: 160, height: 22, fontSize: 11, textAlign: 'left', fontWeight: 'normal' },
                { fieldId: 'qrcode', x: 210, y: 15, width: 80, height: 80, isQR: true },
            ],
        },
    },
    {
        id: 'minimal-stall',
        name: 'Minimal Stall',
        config: {
            labelWidth: 50.8,
            labelHeight: 25.4,
            elements: [
                { fieldId: 'name', x: 30, y: 10, width: 140, height: 28, fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
                { fieldId: 'stall_number', x: 60, y: 50, width: 80, height: 30, fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
            ],
        },
    },
];

const LabelDesignerPage = () => {
    const [currentConfig, setCurrentConfig] = useState(null);
    const [layoutName, setLayoutName] = useState('');
    const [savedLayouts, setSavedLayouts] = useState(SAVED_LAYOUTS);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [loadModalVisible, setLoadModalVisible] = useState(false);
    
    const { isConnected, deviceName } = usePrinter();

    // Handle config change from designer
    const handleConfigChange = useCallback((config) => {
        setCurrentConfig(config);
    }, []);

    // Save current layout
    const handleSaveLayout = useCallback(() => {
        if (!layoutName.trim()) {
            message.warning('Please enter a layout name');
            return;
        }
        
        const newLayout = {
            id: `custom-${Date.now()}`,
            name: layoutName,
            config: currentConfig,
        };
        
        setSavedLayouts(prev => [...prev, newLayout]);
        setSaveModalVisible(false);
        setLayoutName('');
        message.success('Layout saved!');
        
        // Also save to localStorage
        try {
            const existingLayouts = JSON.parse(localStorage.getItem('labelDesignerLayouts') || '[]');
            existingLayouts.push(newLayout);
            localStorage.setItem('labelDesignerLayouts', JSON.stringify(existingLayouts));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }, [layoutName, currentConfig]);

    // Load layout
    const handleLoadLayout = useCallback((layout) => {
        setCurrentConfig(layout.config);
        setLoadModalVisible(false);
        message.success(`Loaded: ${layout.name}`);
    }, []);

    // Export config as JSON
    const handleExportJSON = useCallback(() => {
        if (!currentConfig) {
            message.warning('No configuration to export');
            return;
        }
        
        const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `label-layout-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('Configuration exported!');
    }, [currentConfig]);

    // Import config from JSON
    const handleImportJSON = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    setCurrentConfig(config);
                    message.success('Configuration imported!');
                } catch (err) {
                    message.error('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, []);

    return (
        <div className="label-designer-page p-4">
            {/* Page Header */}
            <Card className="mb-4" size="small">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h4 className="mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            <SettingOutlined className="mr-2" />
                            Label Designer
                        </h4>
                        <small style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Drag and drop fields to design your label layout
                        </small>
                    </div>
                    
                    <Space wrap>
                        {isConnected && (
                            <Tag color="success" icon={<PrinterOutlined />}>
                                {deviceName}
                            </Tag>
                        )}
                        
                        <Button 
                            icon={<FolderOpenOutlined />}
                            onClick={() => setLoadModalVisible(true)}
                        >
                            Load Layout
                        </Button>
                        <Button 
                            icon={<SaveOutlined />}
                            onClick={() => setSaveModalVisible(true)}
                            disabled={!currentConfig}
                        >
                            Save Layout
                        </Button>
                        <Button 
                            icon={<DownloadOutlined />}
                            onClick={handleExportJSON}
                            disabled={!currentConfig}
                        >
                            Export JSON
                        </Button>
                        <Button 
                            icon={<UploadOutlined />}
                            onClick={handleImportJSON}
                        >
                            Import JSON
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Designer Component */}
            <Card 
                bodyStyle={{ padding: 0, height: 'calc(100vh - 220px)', minHeight: 500 }}
            >
                <LabelDesigner 
                    onConfigChange={handleConfigChange}
                    initialConfig={currentConfig}
                    key={currentConfig ? JSON.stringify(currentConfig) : 'default'}
                />
            </Card>

            {/* Save Layout Modal */}
            <Modal
                title="Save Layout"
                open={saveModalVisible}
                onOk={handleSaveLayout}
                onCancel={() => setSaveModalVisible(false)}
                okText="Save"
            >
                <Input
                    placeholder="Enter layout name"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    onPressEnter={handleSaveLayout}
                />
            </Modal>

            {/* Load Layout Modal */}
            <Modal
                title="Load Layout"
                open={loadModalVisible}
                onCancel={() => setLoadModalVisible(false)}
                footer={null}
                width={500}
            >
                <div className="d-flex flex-column gap-2">
                    {savedLayouts.map(layout => (
                        <Card 
                            key={layout.id}
                            size="small"
                            hoverable
                            onClick={() => handleLoadLayout(layout)}
                            className="cursor-pointer"
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{layout.name}</strong>
                                    <div className="small" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                        {layout.config.labelWidth}mm × {layout.config.labelHeight}mm 
                                        • {layout.config.elements.length} fields
                                    </div>
                                </div>
                                <Button type="primary" size="small">Load</Button>
                            </div>
                        </Card>
                    ))}
                    
                    {savedLayouts.length === 0 && (
                        <div className="text-center py-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            No saved layouts
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default LabelDesignerPage;

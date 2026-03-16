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
import { Card, Button, Space, Tag, message, Modal, Input, Upload, Select } from 'antd';
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
import * as XLSX from 'xlsx';

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
    const [availableFields, setAvailableFields] = useState([]);
    const [dataRows, setDataRows] = useState([]);
    const [lang, setLang] = useState('zpl');
    const [singleModalVisible, setSingleModalVisible] = useState(false);
    const [singleValues, setSingleValues] = useState({});
    
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

    // Handle Excel/CSV upload and parse fields (first row headers)
    const handleDataFile = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const ws = workbook.Sheets[sheetName];
                const rowsObj = XLSX.utils.sheet_to_json(ws, { defval: '' });
                if (!rowsObj || rowsObj.length === 0) {
                    message.error('Uploaded file has no data');
                    return;
                }
                const headers = Object.keys(rowsObj[0]).map(h => String(h || '').trim()).filter(h => h);
                if (headers.length === 0) {
                    message.error('No headers detected in the first row');
                    return;
                }
                const fields = headers.map(h => ({ id: h.replace(/\s+/g, '_').toLowerCase(), label: h }));
                // normalize rows to use ids as keys
                const normalizedRows = rowsObj.map(r => {
                    const obj = {};
                    headers.forEach(h => { obj[h.replace(/\s+/g, '_').toLowerCase()] = r[h]; });
                    return obj;
                });
                setAvailableFields(fields);
                setDataRows(normalizedRows);
                message.success(`Loaded ${fields.length} fields and ${normalizedRows.length} rows from ${file.name}`);
            } catch (err) {
                console.error(err);
                message.error('Failed to parse file');
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const beforeUpload = useCallback((file) => {
        handleDataFile(file);
        return false; // prevent auto upload
    }, [handleDataFile]);

    // Convert mm to printer dots (approx) for ZPL (use DPI 203)
    const mmToDots = (mm, dpi = 203) => Math.round(mm * dpi / 25.4);

    const createAndDownload = (filename, content) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateZPL = (config, row) => {
        const DPI = 203;
        const labelWidthMm = config.labelWidth;
        const labelHeightMm = config.labelHeight;
        let out = '';
        config.elements.forEach(el => {
            const xMm = (el.x / 4); // MM_TO_PX is 4
            const yMm = (el.y / 4);
            if (el.isQR) {
                const x = mmToDots(xMm, DPI);
                const y = mmToDots(yMm, DPI);
                // Simple QR with ^BQN
                out += `^FO${x},${y}^BQN,2,6^FDLA,${row[el.fieldId] || ''}^FS\n`;
            } else {
                const x = mmToDots(xMm, DPI);
                const y = mmToDots(yMm, DPI);
                const fontDots = Math.max(10, Math.round((el.fontSize || 12) * DPI / 96));
                out += `^FO${x},${y}^A0N,${fontDots},${fontDots}^FD${row[el.fieldId] || ''}^FS\n`;
            }
        });
        // Wrap in ZPL start/stop
        return `^XA\n${out}^XZ`;
    };

    const generateTSPL = (config, row) => {
        const labelWidth = config.labelWidth;
        const labelHeight = config.labelHeight;
        let out = `SIZE ${labelWidth} mm, ${labelHeight} mm\nGAP 2 mm,0\nDIRECTION 1\nCLS\n`;
        config.elements.forEach(el => {
            const xMm = (el.x / 4);
            const yMm = (el.y / 4);
            if (el.isQR) {
                out += `QRCODE ${Math.round(xMm)},${Math.round(yMm)},L,5,A,0,M,${row[el.fieldId] || ''}\n`;
            } else {
                // TSPL TEXT: TEXT x,y,font,rotation,x_mul,y_mul,content
                out += `TEXT ${Math.round(xMm)},${Math.round(yMm)},"0",0,1,1,${row[el.fieldId] || ''}\n`;
            }
        });
        out += `PRINT 1,1\n`;
        return out;
    };

    const handleGenerateAndDownload = useCallback((mode, language, singleData) => {
        if (!currentConfig) { message.error('No layout configured'); return; }
        const configs = [];
        if (mode === 'single') configs.push(singleData);
        else configs.push(...dataRows);

        const parts = configs.map(r => {
            if (language === 'zpl') return generateZPL(currentConfig, r);
            return generateTSPL(currentConfig, r);
        });
        const ext = language === 'zpl' ? 'zpl' : 'txt';
        createAndDownload(`labels-${language}-${Date.now()}.${ext}`, parts.join('\n'));
    }, [currentConfig, dataRows]);

    const openSingleModal = useCallback(() => {
        // initialize with first row or empty
        const init = {};
        availableFields.forEach(f => { init[f.id] = (dataRows[0] && dataRows[0][f.id]) || ''; });
        setSingleValues(init);
        setSingleModalVisible(true);
    }, [availableFields, dataRows]);

    const handleSingleOk = useCallback(() => {
        setSingleModalVisible(false);
        handleGenerateAndDownload('single', lang, singleValues);
    }, [handleGenerateAndDownload, lang, singleValues]);

    const handleSingleChange = useCallback((id, val) => {
        setSingleValues(prev => ({ ...prev, [id]: val }));
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
                        <Upload beforeUpload={beforeUpload} accept=".xlsx,.xls,.csv" showUploadList={false}>
                            <Button icon={<UploadOutlined />}>Upload Data</Button>
                        </Upload>
                        <Select value={lang} onChange={setLang} style={{ width: 120 }}>
                            <Select.Option value="zpl">ZPL</Select.Option>
                            <Select.Option value="tspl">TSPL</Select.Option>
                        </Select>
                        <Button onClick={openSingleModal} disabled={!currentConfig} >Print Single</Button>
                        <Button onClick={() => handleGenerateAndDownload('bulk', lang)} disabled={!currentConfig || dataRows.length===0}>Print Bulk</Button>
                        <Button 
                            icon={<UploadOutlined />}
                            onClick={handleImportJSON}
                        >
                            Import JSON
                        </Button>
                        {availableFields.length > 0 && (
                            <Tag color="processing">{availableFields.length} fields</Tag>
                        )}
                    </Space>
                </div>
            </Card>

            <Modal
                title="Enter label data"
                open={singleModalVisible}
                onOk={handleSingleOk}
                onCancel={() => setSingleModalVisible(false)}
            >
                <div className="d-flex flex-column gap-2">
                    {availableFields.map(f => (
                        <div key={f.id}>
                            <label style={{ color: 'rgba(255,255,255,0.85)' }}>{f.label}</label>
                            <Input value={singleValues[f.id] || ''} onChange={(e) => handleSingleChange(f.id, e.target.value)} />
                        </div>
                    ))}
                    {availableFields.length === 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.45)' }}>No uploaded fields. Upload a file to enable bulk printing.</div>
                    )}
                </div>
            </Modal>

            {/* Designer Component */}
            <Card 
                bodyStyle={{ padding: 0, height: 'calc(100vh - 220px)', minHeight: 500 }}
            >
                <LabelDesigner 
                    onConfigChange={handleConfigChange}
                    initialConfig={currentConfig}
                    availableFields={availableFields}
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

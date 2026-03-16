/**
 * Dynamic Label Print Component - Enhanced
 * 
 * Features:
 * - Drag and drop label sizing
 * - Bulk printing from API data
 * - Browser print option (opens print dialog)
 * - Direct thermal print (TSPL, ZPL, CPCL)
 * - Dynamic field mapping from any API structure
 * - QR code from token/order_id
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    InputNumber,
    Divider,
    Space,
    Tag,
    message,
    Empty,
    Table,
    Tabs,
    Modal,
    Spin,
    Progress,
    Badge,
    Switch,
    Slider,
} from 'antd';
import {
    PrinterOutlined,
    PlusOutlined,
    ClearOutlined,
    SettingOutlined,
    WifiOutlined,
    UsbOutlined,
    DisconnectOutlined,
    QrcodeOutlined,
    UserOutlined,
    BankOutlined,
    PhoneOutlined,
    IdcardOutlined,
    ShopOutlined,
    ReloadOutlined,
    SearchOutlined,
    CloudDownloadOutlined,
    FileTextOutlined,
    DesktopOutlined,
    DragOutlined,
    SwapOutlined,
    ItalicOutlined,
    FontColorsOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { usePrinter } from 'Context/PrinterContext';
import { generateCPCLFromExcel, generateTSPLFromExcel, generateZPLFromExcel } from '../Bookings/pos/utils/printerCommands';
import { getDataSources, DEFAULT_FIELD_MAPPINGS } from './services/labelApi';
import { generateLabelCommands, generateCommandPreview, FONT_FAMILIES } from './utils/labelCommandGenerators';
import { generateBitmapPrintCommands, generateCleanBitmapPrintCommands, captureMonochromeAsDataURL } from './utils/bitmapPrinterCommands';

// Label Size Presets
const LABEL_SIZES = [
    { value: '2x2', label: '2" x 2" (50.8mm x 50.8mm)', width: 50.8, height: 50.8 },
    { value: '2x1', label: '2" x 1" (50.8mm x 25.4mm)', width: 50.8, height: 25.4 },
    { value: '3x2', label: '3" x 2" (76.2mm x 50.8mm)', width: 76.2, height: 50.8 },
    { value: '4x2', label: '4" x 2" (101.6mm x 50.8mm)', width: 101.6, height: 50.8 },
    { value: '4x3', label: '4" x 3" (101.6mm x 76.2mm)', width: 101.6, height: 76.2 },
    { value: 'custom', label: 'Custom Size', width: 50, height: 50 },
];

// Printer Types
const PRINTER_TYPES = [
    { value: 'tspl', label: 'TSPL (TSC/Godex)' },
    { value: 'zpl', label: 'ZPL (Zebra)' },
    { value: 'cpcl', label: 'CPCL (Citizen/Intermec)' },
];

// Available Fields for Label
const LABEL_FIELDS = [
    { key: 'name', label: 'Name', icon: <UserOutlined />, defaultEnabled: true },
    { key: 'surname', label: 'Surname', icon: <UserOutlined />, defaultEnabled: true },
    { key: 'company_name', label: 'Company Name', icon: <BankOutlined />, defaultEnabled: true },
    { key: 'designation', label: 'Designation', icon: <IdcardOutlined />, defaultEnabled: false },
    { key: 'number', label: 'Phone Number', icon: <PhoneOutlined />, defaultEnabled: false },
    { key: 'stall_number', label: 'Stall Number', icon: <ShopOutlined />, defaultEnabled: false },
    { key: 'qrcode', label: 'QR Code', icon: <QrcodeOutlined />, defaultEnabled: false },
];

// Dummy/Sample Data
const SAMPLE_DATA = {
    name: 'Rahul',
    surname: 'Sharma',
    company_name: 'TechCorp Solutions',
    designation: 'Senior Developer',
    number: '+91 98765 43210',
    stall_number: 'A-101',
    qrcode: 'BADGE-2024-001',
};

const DynamicLabelPrint = () => {
    const [form] = Form.useForm();
    const printFrameRef = useRef(null);
    const labelPreviewRef = useRef(null);

    // Printer Context
    const {
        connectionMode,
        setConnectionMode,
        isConnected,
        connectUSB,
        connectBluetooth,
        disconnect,
        sendRawBytes,
        deviceName,
        status: printerStatus,
    } = usePrinter();

    // Mode: 'single' or 'bulk'
    const [activeTab, setActiveTab] = useState('single');

    // State - Label Configuration
    const [labelSize, setLabelSize] = useState('2x2');
    const [customWidth, setCustomWidth] = useState(50);
    const [customHeight, setCustomHeight] = useState(50);
    const [printerType, setPrinterType] = useState('tspl');
    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedFields, setSelectedFields] = useState(
        LABEL_FIELDS.filter(f => f.defaultEnabled).map(f => f.key)
    );
    const [labelData, setLabelData] = useState(SAMPLE_DATA);
    const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
    const [lineGapMultiplier, setLineGapMultiplier] = useState(1.0);

    // Bulk mode state
    const [dataSource, setDataSource] = useState('badges');
    const [apiData, setApiData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [availableFields, setAvailableFields] = useState([]);
    const [fieldMappings, setFieldMappings] = useState(DEFAULT_FIELD_MAPPINGS.badges || {});
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkPrintProgress, setBulkPrintProgress] = useState({ current: 0, total: 0, printing: false });
    const [showMappingModal, setShowMappingModal] = useState(false);

    // Drag resize state (for label)
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Individual field sizes state
    const [fieldSizes, setFieldSizes] = useState({
        name: 18,           // Base font size for name
        surname: 18,        // Same as name (combined display)
        company_name: 14,
        designation: 12,
        number: 11,
        stall_number: 12,
    });
    const [qrSize, setQrSize] = useState(60); // QR code size in pixels

    // Field resize tracking
    const [activeFieldResize, setActiveFieldResize] = useState(null);
    const [fieldResizeStart, setFieldResizeStart] = useState({ x: 0, y: 0, size: 0 });

    // Field positions for Canva-style drag (percentage-based for responsiveness)
    const [fieldPositions, setFieldPositions] = useState({
        name: { x: 50, y: 15 },           // Center top
        company_name: { x: 50, y: 35 },
        designation: { x: 50, y: 50 },
        number: { x: 50, y: 62 },
        stall_number: { x: 50, y: 75 },
        qrcode: { x: 50, y: 88 },
    });

    // Field drag tracking
    const [activeFieldDrag, setActiveFieldDrag] = useState(null);
    const [fieldDragStart, setFieldDragStart] = useState({ x: 0, y: 0, posX: 0, posY: 0 });

    // Font weight options for each field (100-900, or 'normal', 'bold')
    const [fieldWeights, setFieldWeights] = useState({
        name: 700,           // Bold for name
        surname: 700,
        company_name: 400,   // Normal
        designation: 400,
        number: 400,
        stall_number: 600,   // Semi-bold
    });

    // Font style (italic) toggle for each field
    const [fieldItalic, setFieldItalic] = useState({
        name: false,
        surname: false,
        company_name: false,
        designation: true,   // Designation italic by default
        number: false,
        stall_number: false,
    });

    // Show font settings modal
    const [showFontSettingsModal, setShowFontSettingsModal] = useState(false);

    // Font family for all fields
    const [fontFamily, setFontFamily] = useState('Arial, sans-serif');

    // Show command preview modal
    const [showCommandPreview, setShowCommandPreview] = useState(false);

    // Get current label dimensions
    const labelDimensions = useMemo(() => {
        if (labelSize === 'custom') {
            return { width: customWidth, height: customHeight };
        }
        const preset = LABEL_SIZES.find(s => s.value === labelSize);
        return { width: preset?.width || 50, height: preset?.height || 50 };
    }, [labelSize, customWidth, customHeight]);

    // Handle field toggle
    const handleFieldToggle = useCallback((fieldKey) => {
        setSelectedFields(prev => {
            if (prev.includes(fieldKey)) {
                return prev.filter(k => k !== fieldKey);
            }
            return [...prev, fieldKey];
        });
    }, []);

    // Handle form value change
    const handleFormChange = useCallback((changedValues, allValues) => {
        setLabelData(prev => ({ ...prev, ...changedValues }));
    }, []);

    // Load sample data
    const loadSampleData = useCallback(() => {
        form.setFieldsValue(SAMPLE_DATA);
        setLabelData(SAMPLE_DATA);
        message.success('Sample data loaded');
    }, [form]);

    // Clear form
    const clearForm = useCallback(() => {
        form.resetFields();
        setLabelData({});
        message.info('Form cleared');
    }, [form]);

    // Connect to printer
    const handleConnect = useCallback(async () => {
        try {
            message.loading({ content: 'Connecting to printer...', key: 'connect' });

            let success = false;
            if (connectionMode === 'usb') {
                success = await connectUSB();
            } else if (connectionMode === 'bluetooth') {
                success = await connectBluetooth();
            }

            if (success) {
                message.success({ content: 'Printer connected!', key: 'connect' });
            } else {
                message.error({ content: 'Failed to connect', key: 'connect' });
            }
        } catch (err) {
            message.error({ content: err.message || 'Connection failed', key: 'connect' });
        }
    }, [connectionMode, connectUSB, connectBluetooth]);

    // Disconnect printer
    const handleDisconnect = useCallback(async () => {
        await disconnect();
        message.info('Printer disconnected');
    }, [disconnect]);

    // Direct Print - Skip browser dialog
    const handleDirectPrint = useCallback(async () => {
        try {
            // Validate we have data to print
            const hasData = selectedFields.some(field => labelData[field]);
            if (!hasData) {
                message.warning('Please enter at least one field value');
                return;
            }

            // Ensure connection
            if (!isConnected) {
                message.loading({ content: 'Connecting to printer...', key: 'print' });
                try {
                    if (connectionMode === 'usb') {
                        await connectUSB();
                    } else if (connectionMode === 'bluetooth') {
                        await connectBluetooth();
                    } else {
                        message.error({ content: 'Please select USB or Bluetooth connection', key: 'print' });
                        return;
                    }
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    message.error({ content: err.message || 'Failed to connect', key: 'print' });
                    return;
                }
            }

            setIsPrinting(true);
            message.loading({ content: 'Printing label...', key: 'print' });

            // Prepare row data for print command generators
            const rowData = {
                firstName: labelData.name || '',
                surname: labelData.surname || '',
                number: labelData.number || '',
                designation: labelData.designation || '',
                company_name: labelData.company_name || '',
                stall_number: labelData.stall_number || '',
            };

            // Map selected fields to the format expected by generators
            const fieldsToGenerate = selectedFields.filter(f => f !== 'qrcode');

            // Field font sizes — direct point sizes (empty = use config defaults)
            const fieldFontSizes = {};

            let printerBytes;

            switch (printerType) {
                case 'zpl':
                    printerBytes = await generateZPLFromExcel(
                        rowData,
                        fieldsToGenerate,
                        labelSize === 'custom' ? '2x2' : labelSize,
                        fontSizeMultiplier,
                        fieldFontSizes,
                        lineGapMultiplier
                    );
                    break;
                case 'cpcl':
                    printerBytes = await generateCPCLFromExcel(
                        rowData,
                        fieldsToGenerate,
                        labelSize === 'custom' ? '2x2' : labelSize,
                        fontSizeMultiplier,
                        fieldFontSizes,
                        lineGapMultiplier
                    );
                    break;
                case 'tspl':
                default:
                    printerBytes = await generateTSPLFromExcel(
                        rowData,
                        fieldsToGenerate,
                        labelSize === 'custom' ? '2x2' : labelSize,
                        fontSizeMultiplier,
                        fieldFontSizes,
                        lineGapMultiplier
                    );
                    break;
            }

            await sendRawBytes(printerBytes);
            message.success({ content: 'Label printed successfully!', key: 'print' });

        } catch (err) {
            console.error('Print error:', err);
            message.error({ content: err.message || 'Print failed', key: 'print' });
        } finally {
            setIsPrinting(false);
        }
    }, [
        labelData,
        selectedFields,
        isConnected,
        connectionMode,
        connectUSB,
        connectBluetooth,
        sendRawBytes,
        printerType,
        labelSize,
        fontSizeMultiplier,
        lineGapMultiplier,
    ]);

    // Fetch data from API (for bulk mode)
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const sources = getDataSources();
            const source = sources.find(s => s.value === dataSource);
            if (source) {
                const response = await source.fetchFn({ search: searchTerm });
                if (response.success) {
                    setApiData(response.data);
                    setAvailableFields(response.availableFields || []);
                    if (DEFAULT_FIELD_MAPPINGS[dataSource]) {
                        setFieldMappings(DEFAULT_FIELD_MAPPINGS[dataSource]);
                    }
                    message.success(`Loaded ${response.data.length} records`);
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
            message.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, [dataSource, searchTerm]);

    // Load data when switching to bulk tab
    useEffect(() => {
        if (activeTab === 'bulk') {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSource, activeTab]);

    // Map API row to label fields
    const mapRowToLabelData = useCallback((row) => {
        const mapped = {};
        LABEL_FIELDS.forEach(slot => {
            const apiField = fieldMappings[slot.key];
            if (apiField && row[apiField] !== undefined) {
                mapped[slot.key] = row[apiField];
            }
        });
        return mapped;
    }, [fieldMappings]);

    // Generate printer bytes helper - Uses advanced generators with all styling
    const generateLabelBytes = useCallback((data) => {
        // Use the new advanced generators that support positions, sizes, weights, etc.
        return generateLabelCommands(printerType, {
            data: {
                name: data.name || '',
                surname: data.surname || '',
                number: data.number || '',
                designation: data.designation || '',
                company_name: data.company_name || '',
                stall_number: data.stall_number || '',
                qrcode: data.qrcode || data.token || '',
                token: data.token || '',
            },
            selectedFields,
            labelDimensions,
            fieldPositions,
            fieldSizes,
            fieldWeights,
            fieldItalic,
            qrSize,
            fontFamily,
        });
    }, [selectedFields, printerType, labelDimensions, fieldPositions, fieldSizes, fieldWeights, fieldItalic, qrSize, fontFamily]);

    // Get command preview for debugging
    const getCommandPreviewText = useCallback(() => {
        return generateCommandPreview(printerType, {
            data: labelData,
            selectedFields,
            labelDimensions,
            fieldPositions,
            fieldSizes,
            fieldWeights,
            fieldItalic,
            qrSize,
            fontFamily,
        });
    }, [printerType, labelData, selectedFields, labelDimensions, fieldPositions, fieldSizes, fieldWeights, fieldItalic, qrSize, fontFamily]);

    // Browser Print - Opens print dialog (with Canva-style positions)
    const handleBrowserPrint = useCallback((dataArray = null) => {
        const printData = dataArray || [labelData];
        const printContent = printData.map((data) => {
            const scale = 3;
            const width = labelDimensions.width * scale;
            const height = labelDimensions.height * scale;

            // Generate positioned fields with font weights
            const fields = [];

            if (selectedFields.includes('name') || selectedFields.includes('surname')) {
                const pos = fieldPositions.name || { x: 50, y: 15 };
                const weight = fieldWeights.name || 400;
                const italic = fieldItalic.name ? 'italic' : 'normal';
                fields.push(`<div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);font-size:${fieldSizes.name * fontSizeMultiplier}px;font-weight:${weight};font-style:${italic};text-align:center;color:#000;white-space:nowrap;">${[data.name, data.surname].filter(Boolean).join(' ') || ''}</div>`);
            }
            if (selectedFields.includes('company_name')) {
                const pos = fieldPositions.company_name || { x: 50, y: 35 };
                const weight = fieldWeights.company_name || 400;
                const italic = fieldItalic.company_name ? 'italic' : 'normal';
                fields.push(`<div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);font-size:${fieldSizes.company_name * fontSizeMultiplier}px;font-weight:${weight};font-style:${italic};text-align:center;color:#333;white-space:nowrap;">${data.company_name || ''}</div>`);
            }
            if (selectedFields.includes('designation')) {
                const pos = fieldPositions.designation || { x: 50, y: 50 };
                const weight = fieldWeights.designation || 400;
                const italic = fieldItalic.designation ? 'italic' : 'normal';
                fields.push(`<div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);font-size:${fieldSizes.designation * fontSizeMultiplier}px;font-weight:${weight};font-style:${italic};text-align:center;color:#666;white-space:nowrap;">${data.designation || ''}</div>`);
            }
            if (selectedFields.includes('number')) {
                const pos = fieldPositions.number || { x: 50, y: 62 };
                const weight = fieldWeights.number || 400;
                const italic = fieldItalic.number ? 'italic' : 'normal';
                fields.push(`<div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);font-size:${fieldSizes.number * fontSizeMultiplier}px;font-weight:${weight};font-style:${italic};text-align:center;color:#666;white-space:nowrap;">${data.number ? '📞 ' + data.number : ''}</div>`);
            }
            if (selectedFields.includes('stall_number')) {
                const pos = fieldPositions.stall_number || { x: 50, y: 75 };
                const weight = fieldWeights.stall_number || 400;
                const italic = fieldItalic.stall_number ? 'italic' : 'normal';
                fields.push(`<div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);font-size:${fieldSizes.stall_number * fontSizeMultiplier}px;font-weight:${weight};font-style:${italic};text-align:center;background:#f0f0f0;padding:4px 8px;border-radius:4px;color:#000;white-space:nowrap;">${data.stall_number ? 'Stall: ' + data.stall_number : ''}</div>`);
            }
            if (selectedFields.includes('qrcode') && data.qrcode) {
                const pos = fieldPositions.qrcode || { x: 50, y: 88 };
                fields.push(`<div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);"><img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 2}x${qrSize * 2}&margin=0&data=${encodeURIComponent(data.qrcode)}" style="width:${qrSize}px;height:${qrSize}px;" /></div>`);
            }

            return `<div class="label-page" style="width:${width}px;height:${height}px;background:white;position:relative;margin:10px auto;border:1px solid #ccc;page-break-after:always;font-family:${fontFamily};">${fields.join('')}</div>`;
        }).join('');
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Print Labels</title><style>@media print{body{margin:0;padding:0;}.label-page{page-break-after:always;}.label-page:last-child{page-break-after:avoid;}}body{background:#f0f0f0;display:flex;flex-direction:column;align-items:center;padding:20px;}</style></head><body>${printContent}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body></html>`);
        printWindow.document.close();
    }, [labelData, labelDimensions, selectedFields, fontSizeMultiplier, fieldSizes, qrSize, fieldPositions, fieldWeights, fieldItalic, fontFamily]);

    // Bulk Direct Print (Thermal)
    const handleBulkDirectPrint = useCallback(async () => {
        if (selectedRows.length === 0) {
            message.warning('Please select records to print');
            return;
        }
        if (!isConnected) {
            message.loading({ content: 'Connecting...', key: 'bulk' });
            try {
                if (connectionMode === 'usb') await connectUSB();
                else if (connectionMode === 'bluetooth') await connectBluetooth();
                else { message.error({ content: 'Select connection mode', key: 'bulk' }); return; }
                await new Promise(r => setTimeout(r, 500));
            } catch (err) { message.error({ content: err.message, key: 'bulk' }); return; }
        }
        setBulkPrintProgress({ current: 0, total: selectedRows.length, printing: true });
        let successCount = 0;
        for (let i = 0; i < selectedRows.length; i++) {
            try {
                const rowData = apiData.find(r => r.id === selectedRows[i] || r.token === selectedRows[i]);
                if (rowData) {
                    const mappedData = mapRowToLabelData(rowData);
                    const printerBytes = await generateLabelBytes(mappedData);
                    await sendRawBytes(printerBytes);
                    successCount++;
                    await new Promise(r => setTimeout(r, 300));
                }
            } catch (err) { console.error('Print error:', err); }
            setBulkPrintProgress(prev => ({ ...prev, current: i + 1 }));
        }
        setBulkPrintProgress(prev => ({ ...prev, printing: false }));
        message.success(`Printed ${successCount} of ${selectedRows.length} labels`);
    }, [selectedRows, apiData, isConnected, connectionMode, connectUSB, connectBluetooth, mapRowToLabelData, generateLabelBytes, sendRawBytes]);

    // Bulk Browser Print
    const handleBulkBrowserPrint = useCallback(() => {
        if (selectedRows.length === 0) { message.warning('Please select records'); return; }
        const printData = selectedRows.map(rowId => {
            const row = apiData.find(r => r.id === rowId || r.token === rowId);
            return row ? mapRowToLabelData(row) : null;
        }).filter(Boolean);
        handleBrowserPrint(printData);
    }, [selectedRows, apiData, mapRowToLabelData, handleBrowserPrint]);

    // Bitmap Print - Captures preview as image and sends to printer (WYSIWYG)
    // Uses clean rendering - only renders the fields, not the UI control buttons
    const handleBitmapPrint = useCallback(async () => {
        try {
            // Validate we have fields to print
            if (selectedFields.length === 0) {
                message.warning('Please select at least one field to display');
                return;
            }

            // Ensure connection
            if (!isConnected) {
                message.loading({ content: 'Connecting to printer...', key: 'bitmap-print' });
                try {
                    if (connectionMode === 'usb') {
                        await connectUSB();
                    } else if (connectionMode === 'bluetooth') {
                        await connectBluetooth();
                    } else {
                        message.error({ content: 'Please select USB or Bluetooth connection', key: 'bitmap-print' });
                        return;
                    }
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    message.error({ content: err.message || 'Failed to connect', key: 'bitmap-print' });
                    return;
                }
            }

            setIsPrinting(true);
            message.loading({ content: 'Rendering and printing label...', key: 'bitmap-print' });

            // Generate bitmap print commands using clean rendering (no UI controls)
            const printerBytes = await generateCleanBitmapPrintCommands(
                {
                    labelDimensions,
                    selectedFields,
                    labelData,
                    fieldPositions,
                    fieldSizes,
                    fieldWeights,
                    fieldItalic,
                    qrSize,
                    fontFamily,
                    fontSizeMultiplier,
                    scale: 2, // Higher resolution for clearer print
                },
                printerType,
                {
                    threshold: 128, // Brightness threshold for black/white conversion
                }
            );

            // Send to printer
            await sendRawBytes(printerBytes);
            message.success({ content: 'Label printed as image!', key: 'bitmap-print' });

        } catch (err) {
            console.error('Bitmap print error:', err);
            message.error({ content: err.message || 'Bitmap print failed', key: 'bitmap-print' });
        } finally {
            setIsPrinting(false);
        }
    }, [
        selectedFields,
        isConnected,
        connectionMode,
        connectUSB,
        connectBluetooth,
        sendRawBytes,
        printerType,
        labelDimensions,
        labelData,
        fieldPositions,
        fieldSizes,
        fieldWeights,
        fieldItalic,
        qrSize,
        fontFamily,
        fontSizeMultiplier,
    ]);

    // Handle label resize via drag (supports mouse and touch)
    const getEventCoords = useCallback((e) => {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    }, []);

    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        const coords = getEventCoords(e);
        setIsResizing(true);
        setResizeStart({ x: coords.clientX, y: coords.clientY, width: customWidth, height: customHeight });
    }, [customWidth, customHeight, getEventCoords]);

    const handleResizeMove = useCallback((e) => {
        if (!isResizing) return;
        const coords = getEventCoords(e);
        const deltaX = (coords.clientX - resizeStart.x) / 4;
        const deltaY = (coords.clientY - resizeStart.y) / 4;
        setCustomWidth(Math.max(20, Math.min(200, resizeStart.width + deltaX)));
        setCustomHeight(Math.max(20, Math.min(200, resizeStart.height + deltaY)));
        setLabelSize('custom');
    }, [isResizing, resizeStart, getEventCoords]);

    const handleResizeEnd = useCallback(() => { setIsResizing(false); }, []);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            window.addEventListener('touchmove', handleResizeMove, { passive: false });
            window.addEventListener('touchend', handleResizeEnd);
            return () => {
                window.removeEventListener('mousemove', handleResizeMove);
                window.removeEventListener('mouseup', handleResizeEnd);
                window.removeEventListener('touchmove', handleResizeMove);
                window.removeEventListener('touchend', handleResizeEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    // Handle individual field resize via drag (supports touch)
    const handleFieldResizeStart = useCallback((e, fieldKey, currentSize) => {
        e.preventDefault();
        e.stopPropagation();
        const coords = getEventCoords(e);
        setActiveFieldResize(fieldKey);
        setFieldResizeStart({ x: coords.clientX, y: coords.clientY, size: currentSize });
    }, [getEventCoords]);

    const handleFieldResizeMove = useCallback((e) => {
        if (!activeFieldResize) return;
        const coords = getEventCoords(e);
        const deltaY = (coords.clientY - fieldResizeStart.y) / 5; // Slower resize for precision

        if (activeFieldResize === 'qrcode') {
            setQrSize(Math.max(30, Math.min(120, fieldResizeStart.size + deltaY)));
        } else {
            setFieldSizes(prev => ({
                ...prev,
                [activeFieldResize]: Math.max(8, Math.min(36, fieldResizeStart.size + deltaY))
            }));
            // If resizing name, also update surname (they're displayed together)
            if (activeFieldResize === 'name') {
                setFieldSizes(prev => ({
                    ...prev,
                    surname: Math.max(8, Math.min(36, fieldResizeStart.size + deltaY))
                }));
            }
        }
    }, [activeFieldResize, fieldResizeStart, getEventCoords]);

    const handleFieldResizeEnd = useCallback(() => {
        setActiveFieldResize(null);
    }, []);

    useEffect(() => {
        if (activeFieldResize) {
            window.addEventListener('mousemove', handleFieldResizeMove);
            window.addEventListener('mouseup', handleFieldResizeEnd);
            window.addEventListener('touchmove', handleFieldResizeMove, { passive: false });
            window.addEventListener('touchend', handleFieldResizeEnd);
            return () => {
                window.removeEventListener('mousemove', handleFieldResizeMove);
                window.removeEventListener('mouseup', handleFieldResizeEnd);
                window.removeEventListener('touchmove', handleFieldResizeMove);
                window.removeEventListener('touchend', handleFieldResizeEnd);
            };
        }
    }, [activeFieldResize, handleFieldResizeMove, handleFieldResizeEnd]);

    // Reset field sizes to defaults
    const resetFieldSizes = useCallback(() => {
        setFieldSizes({
            name: 18,
            surname: 18,
            company_name: 14,
            designation: 12,
            number: 11,
            stall_number: 12,
        });
        setQrSize(60);
        setFieldPositions({
            name: { x: 50, y: 15 },
            company_name: { x: 50, y: 35 },
            designation: { x: 50, y: 50 },
            number: { x: 50, y: 62 },
            stall_number: { x: 50, y: 75 },
            qrcode: { x: 50, y: 88 },
        });
        setFieldWeights({
            name: 700,
            surname: 700,
            company_name: 400,
            designation: 400,
            number: 400,
            stall_number: 600,
        });
        setFieldItalic({
            name: false,
            surname: false,
            company_name: false,
            designation: true,
            number: false,
            stall_number: false,
        });
        setFontFamily('Arial, sans-serif');
        message.success('All field styles reset to defaults');
    }, []);

    // Handle field drag for positioning (Canva-style, supports touch)
    const handleFieldDragStart = useCallback((e, fieldKey) => {
        e.preventDefault();
        e.stopPropagation();
        const coords = getEventCoords(e);
        const pos = fieldPositions[fieldKey] || { x: 50, y: 50 };
        setActiveFieldDrag(fieldKey);
        setFieldDragStart({ x: coords.clientX, y: coords.clientY, posX: pos.x, posY: pos.y });
    }, [fieldPositions, getEventCoords]);

    const handleFieldDragMove = useCallback((e) => {
        if (!activeFieldDrag) return;
        e.preventDefault(); // Prevent scrolling on touch
        const coords = getEventCoords(e);
        // Calculate delta in percentage of label preview
        const scale = 4;
        const previewWidth = labelDimensions.width * scale;
        const previewHeight = labelDimensions.height * scale;

        const deltaX = ((coords.clientX - fieldDragStart.x) / previewWidth) * 100;
        const deltaY = ((coords.clientY - fieldDragStart.y) / previewHeight) * 100;

        const newX = Math.max(5, Math.min(95, fieldDragStart.posX + deltaX));
        const newY = Math.max(5, Math.min(95, fieldDragStart.posY + deltaY));

        setFieldPositions(prev => ({
            ...prev,
            [activeFieldDrag]: { x: newX, y: newY }
        }));
    }, [activeFieldDrag, fieldDragStart, labelDimensions, getEventCoords]);

    const handleFieldDragEnd = useCallback(() => {
        setActiveFieldDrag(null);
    }, []);

    useEffect(() => {
        if (activeFieldDrag) {
            window.addEventListener('mousemove', handleFieldDragMove);
            window.addEventListener('mouseup', handleFieldDragEnd);
            window.addEventListener('touchmove', handleFieldDragMove, { passive: false });
            window.addEventListener('touchend', handleFieldDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleFieldDragMove);
                window.removeEventListener('mouseup', handleFieldDragEnd);
                window.removeEventListener('touchmove', handleFieldDragMove);
                window.removeEventListener('touchend', handleFieldDragEnd);
            };
        }
    }, [activeFieldDrag, handleFieldDragMove, handleFieldDragEnd]);

    // Table columns for bulk mode
    const tableColumns = useMemo(() => {
        return availableFields.slice(0, 5).map(field => ({
            title: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
            dataIndex: field,
            key: field,
            ellipsis: true,
        }));
    }, [availableFields]);

    // Render Label Preview
    const renderLabelPreview = () => {
        const scale = 4; // Scale for preview display
        const previewWidth = labelDimensions.width * scale;
        const previewHeight = labelDimensions.height * scale;

        // Canva-style draggable field component
        const DraggableField = ({ fieldKey, children, isQr = false }) => {
            const pos = fieldPositions[fieldKey] || { x: 50, y: 50 };
            const isActive = activeFieldDrag === fieldKey || activeFieldResize === fieldKey;

            return (
                <div
                    style={{
                        position: 'absolute',
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: activeFieldDrag === fieldKey ? 'grabbing' : 'grab',
                        zIndex: isActive ? 100 : 10,
                        userSelect: 'none',
                        touchAction: 'none', // Prevent default touch scrolling
                    }}
                    onMouseDown={(e) => handleFieldDragStart(e, fieldKey)}
                    onTouchStart={(e) => handleFieldDragStart(e, fieldKey)}
                >
                    <div
                        style={{
                            position: 'relative',
                            padding: '4px 8px',
                            border: isActive ? '2px dashed #b51515' : '2px dashed transparent',
                            borderRadius: 4,
                            backgroundColor: isActive ? 'rgba(181, 21, 21, 0.1)' : 'transparent',
                            transition: 'border-color 0.2s, background-color 0.2s',
                        }}
                    >
                        {children}

                        {/* Resize handle (bottom-right of field) */}
                        <div
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                handleFieldResizeStart(e, fieldKey, isQr ? qrSize : fieldSizes[fieldKey]);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                handleFieldResizeStart(e, fieldKey, isQr ? qrSize : fieldSizes[fieldKey]);
                            }}
                            style={{
                                position: 'absolute',
                                right: -6,
                                bottom: -6,
                                width: 16,
                                height: 16,
                                background: activeFieldResize === fieldKey ? '#ff4d4f' : '#b51515',
                                borderRadius: '50%',
                                cursor: 'ns-resize',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.9,
                                zIndex: 20,
                                touchAction: 'none',
                            }}
                            title="Drag to resize"
                        >
                            <span style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>↕</span>
                        </div>

                        {/* Move indicator (top-left) */}
                        <div
                            style={{
                                position: 'absolute',
                                left: -6,
                                top: -6,
                                width: 16,
                                height: 16,
                                background: activeFieldDrag === fieldKey ? '#ff4d4f' : '#1890ff',
                                borderRadius: '50%',
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.9,
                                zIndex: 20,
                                touchAction: 'none',
                            }}
                            title="Drag to move"
                        >
                            <span style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>✥</span>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div
                ref={labelPreviewRef}
                style={{
                    width: previewWidth,
                    height: previewHeight,
                    backgroundColor: '#ffffff',
                    border: '2px solid #2c2f34',
                    borderRadius: 4,
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    overflow: 'visible',
                    fontFamily: fontFamily,
                    touchAction: 'none', // Prevent touch scrolling while dragging
                }}
            >
                {selectedFields.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                    }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Select fields to display"
                            style={{ margin: 0 }}
                        />
                    </div>
                ) : (
                    <>
                        {/* Name (combined firstName + surname) */}
                        {(selectedFields.includes('name') || selectedFields.includes('surname')) && (
                            <DraggableField fieldKey="name">
                                <div style={{
                                    fontSize: fieldSizes.name * fontSizeMultiplier,
                                    fontWeight: fieldWeights.name || 400,
                                    fontStyle: fieldItalic.name ? 'italic' : 'normal',
                                    color: '#000',
                                    textAlign: 'center',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {[labelData.name, labelData.surname].filter(Boolean).join(' ') || 'Full Name'}
                                </div>
                            </DraggableField>
                        )}

                        {/* Company Name */}
                        {selectedFields.includes('company_name') && (
                            <DraggableField fieldKey="company_name">
                                <div style={{
                                    fontSize: fieldSizes.company_name * fontSizeMultiplier,
                                    fontWeight: fieldWeights.company_name || 400,
                                    fontStyle: fieldItalic.company_name ? 'italic' : 'normal',
                                    color: '#333',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {labelData.company_name || 'Company Name'}
                                </div>
                            </DraggableField>
                        )}

                        {/* Designation */}
                        {selectedFields.includes('designation') && (
                            <DraggableField fieldKey="designation">
                                <div style={{
                                    fontSize: fieldSizes.designation * fontSizeMultiplier,
                                    fontWeight: fieldWeights.designation || 400,
                                    fontStyle: fieldItalic.designation ? 'italic' : 'normal',
                                    color: '#666',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {labelData.designation || 'Designation'}
                                </div>
                            </DraggableField>
                        )}

                        {/* Phone */}
                        {selectedFields.includes('number') && (
                            <DraggableField fieldKey="number">
                                <div style={{
                                    fontSize: fieldSizes.number * fontSizeMultiplier,
                                    fontWeight: fieldWeights.number || 400,
                                    fontStyle: fieldItalic.number ? 'italic' : 'normal',
                                    color: '#666',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {labelData.number ? `📞 ${labelData.number}` : '📞 Phone Number'}
                                </div>
                            </DraggableField>
                        )}

                        {/* Stall Number */}
                        {selectedFields.includes('stall_number') && (
                            <DraggableField fieldKey="stall_number">
                                <div style={{
                                    fontSize: fieldSizes.stall_number * fontSizeMultiplier,
                                    fontWeight: fieldWeights.stall_number || 400,
                                    fontStyle: fieldItalic.stall_number ? 'italic' : 'normal',
                                    color: '#000',
                                    textAlign: 'center',
                                    backgroundColor: '#f0f0f0',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    whiteSpace: 'nowrap',
                                }}>
                                    Stall: {labelData.stall_number || 'A-101'}
                                </div>
                            </DraggableField>
                        )}

                        {/* QR Code */}
                        {selectedFields.includes('qrcode') && (
                            <DraggableField fieldKey="qrcode" isQr={true}>
                                {labelData.qrcode ? (
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 2}x${qrSize * 2}&margin=0&data=${encodeURIComponent(labelData.qrcode)}`}
                                        alt="QR Code"
                                        style={{ width: qrSize, height: qrSize, display: 'block' }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div style={{
                                        width: qrSize,
                                        height: qrSize,
                                        border: '2px dashed #ccc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ccc',
                                    }}>
                                        <QrcodeOutlined style={{ fontSize: qrSize / 2.5 }} />
                                    </div>
                                )}
                            </DraggableField>
                        )}
                    </>
                )}

                {/* Label Resize handle (bottom-right corner) */}
                <div
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    style={{
                        position: 'absolute',
                        right: -4,
                        bottom: -4,
                        width: 20,
                        height: 20,
                        background: '#b51515',
                        borderRadius: 2,
                        cursor: 'se-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 200,
                        touchAction: 'none',
                    }}
                    title="Drag to resize label"
                >
                    <DragOutlined style={{ fontSize: 10, color: '#fff' }} />
                </div>
            </div>
        );
    };

    // Field Mapping Modal
    const renderMappingModal = () => (
        <Modal
            title={<><SwapOutlined /> Field Mapping</>}
            open={showMappingModal}
            onCancel={() => setShowMappingModal(false)}
            onOk={() => setShowMappingModal(false)}
            width={600}
        >
            <p className="mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Map API fields to label slots. QR uses token/order_id.
            </p>
            <div className="d-flex flex-column gap-3">
                {LABEL_FIELDS.map(slot => (
                    <Row key={slot.key} align="middle" gutter={16}>
                        <Col span={10}>
                            <Space>{slot.icon}<span>{slot.label}</span></Space>
                        </Col>
                        <Col span={14}>
                            <Select
                                value={fieldMappings[slot.key] || undefined}
                                onChange={(val) => setFieldMappings(prev => ({ ...prev, [slot.key]: val }))}
                                placeholder="Select API field"
                                allowClear
                                style={{ width: '100%' }}
                                options={availableFields.map(f => ({ value: f, label: f }))}
                            />
                        </Col>
                    </Row>
                ))}
            </div>
        </Modal>
    );

    // Font Weight Options
    const WEIGHT_OPTIONS = [
        { value: 100, label: 'Thin (100)' },
        { value: 200, label: 'Extra Light (200)' },
        { value: 300, label: 'Light (300)' },
        { value: 400, label: 'Regular (400)' },
        { value: 500, label: 'Medium (500)' },
        { value: 600, label: 'Semi Bold (600)' },
        { value: 700, label: 'Bold (700)' },
        { value: 800, label: 'Extra Bold (800)' },
        { value: 900, label: 'Black (900)' },
    ];

    // Font Settings Modal
    const renderFontSettingsModal = () => (
        <Modal
            title={<><FontColorsOutlined /> Font Settings</>}
            open={showFontSettingsModal}
            onCancel={() => setShowFontSettingsModal(false)}
            onOk={() => setShowFontSettingsModal(false)}
            width={700}
        >
            <p className="mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Customize font family, weight, and style for each field. Settings are applied to thermal print commands.
            </p>

            {/* Global Font Family */}
            <Row align="middle" gutter={16} style={{ borderBottom: '1px solid #333', paddingBottom: 12, marginBottom: 12 }}>
                <Col span={6}>
                    <span style={{ fontWeight: 600 }}>Font Family</span>
                </Col>
                <Col span={18}>
                    <Select
                        value={fontFamily}
                        onChange={setFontFamily}
                        style={{ width: '100%' }}
                        options={FONT_FAMILIES.map(f => ({ value: f.value, label: f.label }))}
                    />
                </Col>
            </Row>

            <div className="d-flex flex-column gap-3">
                {LABEL_FIELDS.filter(f => f.key !== 'qrcode').map(field => (
                    <Row key={field.key} align="middle" gutter={16} style={{ borderBottom: '1px solid #333', paddingBottom: 12 }}>
                        <Col span={6}>
                            <Space>{field.icon}<span>{field.label}</span></Space>
                        </Col>
                        <Col span={10}>
                            <label className="d-block small lf-text-muted mb-1">Font Weight</label>
                            <Select
                                value={fieldWeights[field.key] || 400}
                                onChange={(val) => setFieldWeights(prev => ({ ...prev, [field.key]: val }))}
                                style={{ width: '100%' }}
                                size="small"
                                options={WEIGHT_OPTIONS}
                            />
                        </Col>
                        <Col span={4}>
                            <label className="d-block small lf-text-muted mb-1">Size</label>
                            <InputNumber
                                value={fieldSizes[field.key]}
                                onChange={(val) => setFieldSizes(prev => ({ ...prev, [field.key]: val }))}
                                min={8}
                                max={36}
                                size="small"
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col span={4}>
                            <label className="d-block small lf-text-muted mb-1">Italic</label>
                            <Switch
                                checked={fieldItalic[field.key] || false}
                                onChange={(checked) => setFieldItalic(prev => ({ ...prev, [field.key]: checked }))}
                                checkedChildren={<ItalicOutlined />}
                                unCheckedChildren="Off"
                                size="small"
                            />
                        </Col>
                    </Row>
                ))}

                {/* QR Code Size */}
                <Row align="middle" gutter={16} style={{ paddingTop: 8 }}>
                    <Col span={6}>
                        <Space><QrcodeOutlined /><span>QR Code</span></Space>
                    </Col>
                    <Col span={18}>
                        <label className="d-block small lf-text-muted mb-1">Size: {qrSize}px</label>
                        <Slider
                            value={qrSize}
                            onChange={setQrSize}
                            min={30}
                            max={120}
                            marks={{ 30: '30', 60: '60', 90: '90', 120: '120' }}
                        />
                    </Col>
                </Row>
            </div>
        </Modal>
    );

    // Command Preview Modal
    const renderCommandPreviewModal = () => (
        <Modal
            title={<><FileTextOutlined /> Printer Command Preview ({printerType.toUpperCase()})</>}
            open={showCommandPreview}
            onCancel={() => setShowCommandPreview(false)}
            onOk={() => setShowCommandPreview(false)}
            width={700}
            footer={[
                <Button key="copy" onClick={() => {
                    navigator.clipboard.writeText(getCommandPreviewText());
                    message.success('Commands copied to clipboard');
                }}>
                    Copy to Clipboard
                </Button>,
                <Button key="close" type="primary" onClick={() => setShowCommandPreview(false)}>
                    Close
                </Button>,
            ]}
        >
            <p className="mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
                These are the actual {printerType.toUpperCase()} commands that will be sent to the printer:
            </p>
            <div style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 4,
                padding: 16,
                fontFamily: 'Courier New, monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                maxHeight: 400,
                overflow: 'auto',
                color: '#0f0',
            }}>
                {getCommandPreviewText()}
            </div>
        </Modal>
    );

    return (
        <div className="p-4">
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'single', label: <><FileTextOutlined /> Single Label</> },
                    { key: 'bulk', label: <><CloudDownloadOutlined /> Bulk Print (API)</> },
                ]}
            />

            <Row gutter={[24, 24]} className="mt-3">
                {/* Left Column - Configuration */}
                <Col xs={24} lg={12}>
                    {/* Printer Connection Card */}
                    <Card
                        title={
                            <Space>
                                <PrinterOutlined />
                                <span>Printer Connection</span>
                                {isConnected && (
                                    <Tag color="success">Connected: {deviceName}</Tag>
                                )}
                            </Space>
                        }
                        className="mb-4"
                        size="small"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <label className="d-block small lf-text-muted mb-2">Connection Mode</label>
                                <Select
                                    value={connectionMode}
                                    onChange={setConnectionMode}
                                    style={{ width: '100%' }}
                                    options={[
                                        { value: 'usb', label: <><UsbOutlined /> USB</> },
                                        { value: 'bluetooth', label: <><WifiOutlined /> Bluetooth</> },
                                    ]}
                                />
                            </Col>
                            <Col span={12}>
                                <label className="d-block small lf-text-muted mb-2">Printer Type</label>
                                <Select
                                    value={printerType}
                                    onChange={setPrinterType}
                                    style={{ width: '100%' }}
                                    options={PRINTER_TYPES}
                                />
                            </Col>
                            <Col span={24}>
                                <Space>
                                    {!isConnected ? (
                                        <Button
                                            type="primary"
                                            icon={<WifiOutlined />}
                                            onClick={handleConnect}
                                        >
                                            Connect Printer
                                        </Button>
                                    ) : (
                                        <Button
                                            danger
                                            icon={<DisconnectOutlined />}
                                            onClick={handleDisconnect}
                                        >
                                            Disconnect
                                        </Button>
                                    )}
                                    <span className="small lf-text-muted">
                                        Status: {printerStatus || 'Not connected'}
                                    </span>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    {/* Label Size Configuration */}
                    <Card
                        title={<><SettingOutlined /> Label Configuration</>}
                        className="mb-4"
                        size="small"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <label className="d-block small lf-text-muted mb-2">Label Size</label>
                                <Select
                                    value={labelSize}
                                    onChange={setLabelSize}
                                    style={{ width: '100%' }}
                                    options={LABEL_SIZES}
                                />
                            </Col>

                            {labelSize === 'custom' && (
                                <>
                                    <Col span={12}>
                                        <label className="d-block small lf-text-muted mb-2">Width (mm)</label>
                                        <InputNumber
                                            value={customWidth}
                                            onChange={setCustomWidth}
                                            min={20}
                                            max={200}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <label className="d-block small lf-text-muted mb-2">Height (mm)</label>
                                        <InputNumber
                                            value={customHeight}
                                            onChange={setCustomHeight}
                                            min={20}
                                            max={200}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                </>
                            )}

                            <Col span={12}>
                                <label className="d-block small lf-text-muted mb-2">
                                    Font Size: {fontSizeMultiplier.toFixed(1)}x
                                </label>
                                <InputNumber
                                    value={fontSizeMultiplier}
                                    onChange={setFontSizeMultiplier}
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                            <Col span={12}>
                                <label className="d-block small lf-text-muted mb-2">
                                    Line Gap: {lineGapMultiplier.toFixed(1)}x
                                </label>
                                <InputNumber
                                    value={lineGapMultiplier}
                                    onChange={setLineGapMultiplier}
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                        </Row>

                        <Divider style={{ margin: '16px 0' }}>Fields to Display</Divider>

                        <div className="d-flex flex-wrap gap-2">
                            {LABEL_FIELDS.map(field => (
                                <Tag
                                    key={field.key}
                                    color={selectedFields.includes(field.key) ? 'red' : 'default'}
                                    style={{ cursor: 'pointer', padding: '4px 12px' }}
                                    onClick={() => handleFieldToggle(field.key)}
                                >
                                    {field.icon} {field.label}
                                </Tag>
                            ))}
                        </div>
                    </Card>

                    {/* Label Data Form - Single Mode */}
                    {activeTab === 'single' && (
                        <Card
                            title="Label Data"
                            size="small"
                            extra={
                                <Space>
                                    <Button
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={loadSampleData}
                                    >
                                        Load Sample
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<ClearOutlined />}
                                        onClick={clearForm}
                                    >
                                        Clear
                                    </Button>
                                </Space>
                            }
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                initialValues={SAMPLE_DATA}
                                onValuesChange={handleFormChange}
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="First Name" name="name">
                                            <Input prefix={<UserOutlined />} placeholder="Enter first name" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Surname" name="surname">
                                            <Input prefix={<UserOutlined />} placeholder="Enter surname" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item label="Company Name" name="company_name">
                                            <Input prefix={<BankOutlined />} placeholder="Enter company name" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Designation" name="designation">
                                            <Input prefix={<IdcardOutlined />} placeholder="Enter designation" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Phone Number" name="number">
                                            <Input prefix={<PhoneOutlined />} placeholder="Enter phone" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Stall Number" name="stall_number">
                                            <Input prefix={<ShopOutlined />} placeholder="Enter stall number" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="QR Code Data" name="qrcode">
                                            <Input prefix={<QrcodeOutlined />} placeholder="QR code content" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    )}

                    {/* Bulk Mode - API Data */}
                    {activeTab === 'bulk' && (
                        <Card
                            title={
                                <Space>
                                    <CloudDownloadOutlined />
                                    <span>Load Data from API</span>
                                    <Badge count={selectedRows.length} style={{ backgroundColor: '#b51515' }} />
                                </Space>
                            }
                            size="small"
                            extra={
                                <Space>
                                    <Button size="small" icon={<SwapOutlined />} onClick={() => setShowMappingModal(true)}>
                                        Field Mapping
                                    </Button>
                                    <Button size="small" icon={<ReloadOutlined />} onClick={fetchData} loading={isLoading}>
                                        Refresh
                                    </Button>
                                </Space>
                            }
                        >
                            <Row gutter={[16, 16]} className="mb-3">
                                <Col span={12}>
                                    <label className="d-block small lf-text-muted mb-2">Data Source</label>
                                    <Select
                                        value={dataSource}
                                        onChange={setDataSource}
                                        style={{ width: '100%' }}
                                        options={getDataSources().map(s => ({ value: s.value, label: s.label }))}
                                    />
                                </Col>
                                <Col span={12}>
                                    <label className="d-block small lf-text-muted mb-2">Search</label>
                                    <Input
                                        placeholder="Search..."
                                        prefix={<SearchOutlined />}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onPressEnter={fetchData}
                                    />
                                </Col>
                            </Row>

                            <Spin spinning={isLoading}>
                                <Table
                                    rowSelection={{
                                        selectedRowKeys: selectedRows,
                                        onChange: setSelectedRows,
                                    }}
                                    columns={tableColumns}
                                    dataSource={apiData}
                                    rowKey={(r) => r.id || r.token || r.orderId || r.sku}
                                    size="small"
                                    pagination={{ pageSize: 5, showSizeChanger: false }}
                                    scroll={{ x: true }}
                                />
                            </Spin>

                            {bulkPrintProgress.printing && (
                                <div className="mt-3">
                                    <Progress
                                        percent={Math.round((bulkPrintProgress.current / bulkPrintProgress.total) * 100)}
                                        status="active"
                                        format={() => `${bulkPrintProgress.current}/${bulkPrintProgress.total}`}
                                    />
                                </div>
                            )}
                        </Card>
                    )}
                </Col>

                {/* Right Column - Preview & Print */}
                <Col xs={24} lg={12}>
                    <Card
                        title="Label Preview"
                        className="mb-4"
                        size="small"
                        extra={
                            <Space>
                                <Button
                                    size="small"
                                    onClick={() => setShowCommandPreview(true)}
                                    icon={<FileTextOutlined />}
                                    title="View printer commands"
                                >
                                    {printerType.toUpperCase()} Code
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setShowFontSettingsModal(true)}
                                    icon={<FontColorsOutlined />}
                                >
                                    Font Settings
                                </Button>
                                <Button
                                    size="small"
                                    onClick={resetFieldSizes}
                                    icon={<ReloadOutlined />}
                                >
                                    Reset
                                </Button>
                            </Space>
                        }
                    >
                        <div
                            className="d-flex align-items-center justify-content-center p-4"
                            style={{
                                backgroundColor: '#1a1a1a',
                                borderRadius: 8,
                                minHeight: 300,
                            }}
                        >
                            {renderLabelPreview()}
                        </div>

                        <div className="mt-3 text-center">
                            <small className="lf-text-muted">
                                Label Size: {Math.round(labelDimensions.width * 10) / 10}mm x {Math.round(labelDimensions.height * 10) / 10}mm
                            </small>
                            <div className="mt-2" style={{ fontSize: 11 }}>
                                <span style={{ color: '#1890ff' }}>● Blue circle</span> = Drag to move field
                                <span className="mx-2">|</span>
                                <span style={{ color: '#b51515' }}>● Red circle</span> = Drag to resize
                                <span className="mx-2">|</span>
                                <span style={{ color: '#666' }}>◼ Corner</span> = Resize label
                            </div>
                        </div>

                        {/* Field Sizes Display */}
                        <Divider style={{ margin: '12px 0' }}>Current Field Sizes</Divider>
                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                            {selectedFields.filter(f => f !== 'qrcode').map(field => (
                                <Tag key={field} color="default" style={{ fontSize: 11 }}>
                                    {LABEL_FIELDS.find(f => f.key === field)?.label || field}: {Math.round(fieldSizes[field])}px
                                </Tag>
                            ))}
                            {selectedFields.includes('qrcode') && (
                                <Tag color="default" style={{ fontSize: 11 }}>
                                    QR Code: {Math.round(qrSize)}px
                                </Tag>
                            )}
                        </div>
                    </Card>

                    {/* Print Actions */}
                    <Card title="Print Actions" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {activeTab === 'single' ? (
                                <>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={<PictureOutlined />}
                                        loading={isPrinting}
                                        onClick={handleBitmapPrint}
                                        disabled={!selectedFields.length}
                                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                    >
                                        {isPrinting ? 'Printing...' : 'Print as Image (WYSIWYG)'}
                                    </Button>
                                    <Button
                                        size="large"
                                        block
                                        icon={<PrinterOutlined />}
                                        loading={isPrinting}
                                        onClick={handleDirectPrint}
                                        disabled={!selectedFields.length}
                                    >
                                        Direct Print (Text Commands)
                                    </Button>
                                    <Button
                                        size="large"
                                        block
                                        icon={<DesktopOutlined />}
                                        onClick={() => handleBrowserPrint()}
                                        disabled={!selectedFields.length}
                                    >
                                        Browser Print (Dialog)
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={<PrinterOutlined />}
                                        onClick={handleBulkDirectPrint}
                                        disabled={selectedRows.length === 0 || bulkPrintProgress.printing}
                                        loading={bulkPrintProgress.printing}
                                    >
                                        {bulkPrintProgress.printing
                                            ? `Printing ${bulkPrintProgress.current}/${bulkPrintProgress.total}...`
                                            : `Direct Print ${selectedRows.length} Labels`}
                                    </Button>
                                    <Button
                                        size="large"
                                        block
                                        icon={<DesktopOutlined />}
                                        onClick={handleBulkBrowserPrint}
                                        disabled={selectedRows.length === 0}
                                    >
                                        Browser Print {selectedRows.length} Labels
                                    </Button>
                                </>
                            )}

                            <Divider style={{ margin: '12px 0' }} />

                            <div className="text-center small lf-text-muted">
                                <strong style={{ color: '#52c41a' }}>Print as Image:</strong> WYSIWYG - exactly as preview (recommended)<br />
                                <strong>Direct Print:</strong> Text commands (faster, limited fonts)<br />
                                <strong>Browser Print:</strong> Opens print dialog (any printer)
                            </div>

                            {!isConnected && (
                                <div className="text-center">
                                    <Tag color="warning">
                                        Printer not connected - will auto-connect on direct print
                                    </Tag>
                                </div>
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Field Mapping Modal */}
            {renderMappingModal()}

            {/* Font Settings Modal */}
            {renderFontSettingsModal()}

            {/* Command Preview Modal */}
            {renderCommandPreviewModal()}

            {/* Hidden print frame */}
            <iframe ref={printFrameRef} style={{ display: 'none' }} title="Print Frame" />
        </div>
    );
};

export default DynamicLabelPrint;

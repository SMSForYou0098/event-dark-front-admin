import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Drawer, message, Space, Tag, Button, Modal } from 'antd';
import { PrinterOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useSelector, useDispatch } from 'react-redux';
import { useMyContext } from '../../../../Context/MyContextProvider';
import { usePrinter } from '../../../../Context/PrinterContext';
import {
    selectConnectionMode,
    selectPrinterType,
    selectAutoPrint,
    setPrinterConfig,
} from '../../../../store/slices/printerSlice';
import './POSPrintModal.css';
import printLoader from '../../../../assets/event/stock/print_loader.gif'
// Subcomponents
import PrinterConfigCard from './components/PrinterConfigCard';
import InvoicePreview from './components/InvoicePreview';

// Utils
import { generateQRCodeDataURL } from './utils/qrCodeUtils';
import { generateESCPOSNativeQR, generateESCPOSBitmapQR, generateTSPL } from './utils/printerCommands';
import Loader from 'utils/Loader';

// Helper function to detect if device is mobile
const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
};

const POSPrintModal = ({
    showPrintModel,
    closePrintModel,
    event,
    bookingData = [],
    subtotal,
    totalTax,
    discount,
    grandTotal,
    showConfig,
    setShowConfig,
    printerRef: externalPrinterRef
}) => {
    const { formatDateTime } = useMyContext();
    const dispatch = useDispatch();
    const printRef = useRef(null);

    // Get saved printer config from Redux
    const savedConnectionMode = useSelector(selectConnectionMode);
    const savedPrinterType = useSelector(selectPrinterType);
    const savedAutoPrint = useSelector(selectAutoPrint);

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

    const [isPrinting, setIsPrinting] = useState(false);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
    const [isAutoPrintEnabled, setIsAutoPrintEnabled] = useState(savedAutoPrint);
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');
    const [printerType, setPrinterType] = useState(savedPrinterType);
    const [connectionError, setConnectionError] = useState(null);
    const modeInitializedRef = useRef(false);

    // Initialize connection mode from Redux on mount
    useEffect(() => {
        if (savedConnectionMode && !modeInitializedRef.current) {
            setConnectionMode(savedConnectionMode);
        }
    }, [savedConnectionMode, setConnectionMode]);

    // Save printer config handler and connect to printer
    const handleSavePrintSettings = useCallback(async () => {
        // Save config to Redux
        dispatch(setPrinterConfig({
            connectionMode,
            printerType,
            autoPrint: isAutoPrintEnabled,
        }));

        // Browser mode doesn't need connection
        if (connectionMode === 'browser') {
            message.success('Printer settings saved successfully!');
            setShowConfig(false);
            return;
        }

        // Connect to thermal printer if not already connected
        if (!isConnected) {
            message.loading({ content: 'Connecting to printer...', key: 'connect' });
            try {
                let success = false;
                if (connectionMode === 'usb') {
                    success = await connectUSB();
                } else {
                    success = await connectBluetooth();
                }

                if (success) {
                    message.success({ content: 'Printer connected & settings saved!', key: 'connect' });
                } else {
                    message.warning({ content: 'Settings saved but printer connection failed', key: 'connect' });
                }
            } catch (err) {
                console.error('Connection error:', err);
                message.error({ content: `Settings saved but connection failed: ${err.message}`, key: 'connect' });
            }
        } else {
            message.success('Printer settings saved successfully!');
        }

        setShowConfig(false);
    }, [dispatch, connectionMode, printerType, isAutoPrintEnabled, setShowConfig, isConnected, connectUSB, connectBluetooth]);

    // Browser print handler
    const handleBrowserPrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Invoice-${bookingData?.[0]?.token || 'ticket'}`,
        pageStyle: `
            @page {
                size: 80mm auto;
                margin: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    });

    // Generate QR code data URL when modal opens
    useEffect(() => {
        const token = bookingData?.[0]?.token;
        if (showPrintModel && token) {
            generateQRCodeDataURL(token).then(setQrCodeDataURL);
        }
    }, [showPrintModel, bookingData]);

    // Connect and Print (handles browser, USB, and Bluetooth modes)
    const handleConnectAndPrint = useCallback(async () => {
        try {
            setConnectionError(null);

            // Browser print mode - use native browser print dialog
            if (connectionMode === 'browser') {
                handleBrowserPrint();
                return;
            }

            // Thermal printer modes (USB/Bluetooth)
            if (!isConnected) {
                message.loading({ content: 'Connecting to printer...', key: 'connect' });

                try {
                    if (connectionMode === 'usb') {
                        await connectUSB();
                    } else {
                        await connectBluetooth();
                    }
                } catch (err) {
                    console.error('Connection error:', err);
                    setConnectionError(err.message || 'Failed to connect to printer');
                    message.error({ content: err.message || 'Failed to connect to printer', key: 'connect' });
                    return;
                }

                message.success({ content: 'Printer connected!', key: 'connect', duration: 1 });
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setIsPrinting(true);
            message.loading({ content: 'Generating receipt...', key: 'print' });

            let commandBytes;
            if (printerType === 'tspl') {
                commandBytes = await generateTSPL(event, bookingData, totalTax, discount, grandTotal, formatDateTime);
            } else if (printerType === 'escpos-native') {
                commandBytes = await generateESCPOSNativeQR(event, bookingData, totalTax, discount, grandTotal, formatDateTime);
            } else {
                commandBytes = await generateESCPOSBitmapQR(event, bookingData, totalTax, discount, grandTotal, formatDateTime);
            }

            await sendRawBytes(commandBytes);

            message.success({ content: 'Print sent successfully!', key: 'print' });
            setConnectionError(null);

            // Auto-close drawer after successful print
            setTimeout(() => {
                closePrintModel();
            }, 1000);
        } catch (err) {
            console.error('Print error:', err);
            const errorMsg = err.message || 'Failed to print';
            setConnectionError(errorMsg);
        } finally {
            setIsPrinting(false);
        }
    }, [isConnected, connectionMode, printerType, connectUSB, connectBluetooth, event, bookingData, totalTax, discount, grandTotal, formatDateTime, sendRawBytes, closePrintModel, handleBrowserPrint]);

    // Auto-print effect - removed automatic browser print fallback
    useEffect(() => {
        if (isAutoPrintEnabled && showPrintModel && bookingData?.length > 0 && !hasAutoPrinted) {
            const timer = setTimeout(async () => {
                try {
                    await handleConnectAndPrint();
                    setHasAutoPrinted(true);
                } catch (error) {
                    console.error('Auto-print failed:', error);
                    setConnectionError('Auto-print failed. Please try connecting manually or use browser print.');
                    setHasAutoPrinted(true);
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isAutoPrintEnabled, showPrintModel, bookingData, hasAutoPrinted, handleConnectAndPrint]);

    useEffect(() => {
        if (!showPrintModel) {
            setHasAutoPrinted(false);
            setConnectionError(null);
        }
    }, [showPrintModel]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(isMobileDevice());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize connection mode - use saved config from Redux, only fallback to mobile detection if first time
    useEffect(() => {
        if (!modeInitializedRef.current) {
            // Use saved connection mode from Redux
            setConnectionMode(savedConnectionMode);
            modeInitializedRef.current = true;
        }
    }, [savedConnectionMode, setConnectionMode]);

    const handleDisconnect = async () => {
        await disconnect();
        setConnectionError(null);
        message.info('Printer disconnected');
    };

    return (
        <>
            {/* Loading Modal */}
            <Modal
                open={isPrinting}
                footer={null}
                closable={false}
                centered
                width={300}
                className="transparent-modal"
            >
                <Loader width={160} imgUrl={printLoader} />

            </Modal>


            {/* Main Drawer */}
            <Drawer
                title={
                    <Space>
                        <PrinterOutlined />
                        <span>Print Configuration</span>
                        {isConnected && <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>}
                    </Space>
                }
                placement={isMobile ? 'bottom' : "right"}
                open={showConfig}
                onClose={()=> setShowConfig(false)}
                height="auto"
                width={500}
                styles={{
                    body: { paddingBottom: 80 }
                }}
                footer={
                    <Button icon={<SaveOutlined />} className='w-100' type="primary" onClick={handleSavePrintSettings}>
                        Save Settings
                    </Button>
                }
            >
                {/* Printer Configuration Card - Always show config */}
                <PrinterConfigCard
                    connectionMode={connectionMode}
                    setConnectionMode={setConnectionMode}
                    printerType={printerType}
                    setPrinterType={setPrinterType}
                    isMobile={isMobile}
                    isConnected={isConnected}
                    isAutoPrintEnabled={isAutoPrintEnabled}
                    setIsAutoPrintEnabled={setIsAutoPrintEnabled}
                    deviceName={deviceName}
                    status={printerStatus}
                    onDisconnect={handleDisconnect}
                />
            </Drawer>
            
            <Drawer
                title={
                    <Space>
                        <PrinterOutlined />
                        <span>Print Invoice</span>
                    </Space>
                }
                placement={isMobile ? 'bottom' : "right"}
                open={showPrintModel}
                onClose={closePrintModel}
                closable
                height="85vh"
                footer={
                    <Button icon={<PrinterOutlined />} className='w-100' type="primary" onClick={handleConnectAndPrint} loading={isPrinting}>
                        Print
                    </Button>
                }
            >
                <InvoicePreview
                    printRef={printRef}
                    event={event}
                    qrCodeDataURL={qrCodeDataURL}
                    formatDateTime={formatDateTime}
                    bookingData={bookingData}
                    totalTax={totalTax}
                    discount={discount}
                    grandTotal={grandTotal}
                />
            </Drawer>
        </>
    );
};

export default POSPrintModal;

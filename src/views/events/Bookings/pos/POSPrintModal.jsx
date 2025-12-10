import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Drawer, Table, message, Space, Tag, Button, Modal, Spin } from 'antd';
import { PrinterOutlined, CheckCircleOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from '../../../../Context/MyContextProvider';
import { usePrinter } from '../../../../Context/PrinterContext';
import './POSPrintModal.css';
import printLoader from '../../../../assets/event/stock/print_loader.gif'
// Subcomponents
import PrinterConfigCard from './components/PrinterConfigCard';
import ConnectedStatusCard from './components/ConnectedStatusCard';
import InvoicePreview from './components/InvoicePreview';
import PrintFooter from './components/PrintFooter';

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
    autoPrint = false,
    printerRef: externalPrinterRef
}) => {
    const { formatDateTime } = useMyContext();
    const printRef = useRef(null);

    const {
        connectionMode,
        setConnectionMode,
        isConnected,
        connectUSB,
        connectBluetooth,
        disconnect,
        sendRawBytes,
    } = usePrinter();

    const [isPrinting, setIsPrinting] = useState(false);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');
    const [printerType, setPrinterType] = useState('escpos-native');
    const [connectionError, setConnectionError] = useState(null);
    const modeInitializedRef = useRef(false);

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

    // Connect and Print
    const handleConnectAndPrint = useCallback(async () => {
        try {
            setConnectionError(null);

            if (!isConnected) {
                message.loading({ content: 'Connecting to printer...', key: 'connect' });

                let success = false;
                try {
                    if (connectionMode === 'usb') {
                        success = await connectUSB();
                    } else {
                        success = await connectBluetooth();
                    }
                } catch (err) {
                    console.error('Connection error:', err);
                    setConnectionError(err.message || 'Failed to connect to printer');
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
    }, [isConnected, connectionMode, printerType, connectUSB, connectBluetooth, event, bookingData, totalTax, discount, grandTotal, formatDateTime, sendRawBytes, closePrintModel]);

    // Auto-print effect - removed automatic browser print fallback
    useEffect(() => {
        if (autoPrint && showPrintModel && bookingData?.length > 0 && !hasAutoPrinted) {
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
    }, [autoPrint, showPrintModel, bookingData, hasAutoPrinted, handleConnectAndPrint]);

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

    useEffect(() => {
        if (!modeInitializedRef.current) {
            if (isMobile) {
                setConnectionMode('ble');
            } else {
                setConnectionMode('usb');
            }
            modeInitializedRef.current = true;
        } else if (isMobile) {
            setConnectionMode('ble');
        }
    }, [isMobile, setConnectionMode]);

    const formatSeatNames = (eventSeatStatus) => {
        if (!eventSeatStatus || !Array.isArray(eventSeatStatus) || eventSeatStatus.length === 0) {
            return '-';
        }

        const seatsBySection = eventSeatStatus.reduce((acc, seat) => {
            const sectionName = seat.section?.name || 'Unknown Section';
            if (!acc[sectionName]) {
                acc[sectionName] = [];
            }
            acc[sectionName].push(seat.seat_name);
            return acc;
        }, {});

        const sections = Object.keys(seatsBySection);

        if (sections.length === 1) {
            return seatsBySection[sections[0]].join(', ');
        }

        return sections
            .map(sectionName => `${sectionName}: ${seatsBySection[sectionName].join(', ')}`)
            .join(' | ');
    };

    const hasSeatingData = useMemo(() => {
        return bookingData?.some(booking =>
            booking?.event_seat_status &&
            Array.isArray(booking.event_seat_status) &&
            booking.event_seat_status.length > 0
        );
    }, [bookingData]);

    const ticketColumns = useMemo(() => {
        const columns = [
            {
                title: 'Qty',
                dataIndex: 'quantity',
                key: 'quantity',
                width: '15%',
                align: 'center',
            },
            {
                title: 'Ticket Name',
                dataIndex: 'ticketName',
                key: 'ticketName',
                width: '50%',
                align: 'left',
            },
        ];

        if (hasSeatingData) {
            columns.push({
                title: 'Seat',
                dataIndex: 'seat',
                key: 'seat',
                width: '50%',
                align: 'left',
                render: (text) => (
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {text}
                    </span>
                ),
            });
        }

        columns.push({
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: '35%',
            align: 'right',
        });

        return columns;
    }, [hasSeatingData]);

    const ticketData = useMemo(() => {
        return bookingData?.map((booking, index) => ({
            key: index,
            quantity: booking.quantity || 0,
            seat: formatSeatNames(booking?.event_seat_status),
            ticketName: booking?.ticket?.name || 'N/A',
            price: `₹${(Number(booking.amount) * Number(booking.quantity)).toFixed(2) || '0.00'}`,
        }));
    }, [bookingData]);

    const summaryColumns = useMemo(() => [
        {
            dataIndex: 'label',
            key: 'label',
            align: 'right',
        },
        {
            dataIndex: 'value',
            key: 'value',
            align: 'right',
            width: '40%',
        },
    ], []);

    const summaryData = useMemo(() => {
        const safeTax = isNaN(parseFloat(totalTax)) ? 0 : parseFloat(totalTax);
        const safeDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
        const safeGrandTotal = isNaN(parseFloat(grandTotal)) ? 0 : parseFloat(grandTotal);

        return [
            {
                key: '1',
                label: 'TOTAL TAX',
                value: `₹${safeTax.toFixed(2)}`,
            },
            {
                key: '2',
                label: 'DISCOUNT',
                value: `₹${safeDiscount.toFixed(2)}`,
            },
            {
                key: '3',
                label: <strong>TOTAL</strong>,
                value: <strong>₹{safeGrandTotal.toFixed(2)}</strong>,
            },
        ];
    }, [totalTax, discount, grandTotal]);

    const handleDisconnect = async () => {
        await disconnect();
        setConnectionError(null);
        message.info('Printer disconnected');
    };

    // Custom loading icon

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
                maskStyle={{ backgroundColor: "rgba(0,0,0,0)" }} // optional (transparent/blur)
            >
                <Loader width={160} imgUrl={printLoader} />

            </Modal>


            {/* Main Drawer */}
            <Drawer
                title={
                    <Space>
                        <PrinterOutlined />
                        <span>Print Invoice</span>
                        {isConnected && <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>}
                    </Space>
                }
                placement="bottom"
                open={showPrintModel}
                onClose={closePrintModel}
                height="auto"
                styles={{
                    body: { paddingBottom: 80 }
                }}
                extra={
                    isConnected && (
                        <Button
                            danger
                            onClick={handleDisconnect}
                            icon={<CloseOutlined />}
                            size="large"
                        >
                            Disconnect
                        </Button>
                    )
                }
                footer={
                    <PrintFooter
                        onClose={closePrintModel}
                        onBrowserPrint={handleBrowserPrint}
                        onThermalPrint={handleConnectAndPrint}
                        onDisconnect={handleDisconnect}
                        isConnected={isConnected}
                        isPrinting={isPrinting}
                        printerType={printerType}
                    />
                }
            >
                {/* Printer Configuration Card - Only show when not connected */}
                {!isConnected ? (
                    <PrinterConfigCard
                        connectionMode={connectionMode}
                        setConnectionMode={setConnectionMode}
                        printerType={printerType}
                        setPrinterType={setPrinterType}
                        isMobile={isMobile}
                        isConnected={isConnected}
                    />
                ) : (
                    <InvoicePreview
                        printRef={printRef}
                        event={event}
                        qrCodeDataURL={qrCodeDataURL}
                        formatDateTime={formatDateTime}
                        bookingData={bookingData}
                        ticketColumns={ticketColumns}
                        ticketData={ticketData}
                        summaryColumns={summaryColumns}
                        summaryData={summaryData}
                    />
                )}
            </Drawer>
        </>
    );
};

export default POSPrintModal;

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal, Button, message, Segmented, Alert, Space, Tag } from 'antd';
import { PrinterOutlined, UsbOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from 'Context/MyContextProvider';
import { Bluetooth } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { usePrinter } from '../../../../Context/PrinterContext';
import {
    selectConnectionMode,
    selectAutoPrint,
    setPrinterConfig,
} from '../../../../store/slices/printerSlice';

const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

// Format date range - remove duplicate if same date
const formatDateRange = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];

    if (Array.isArray(dateString) && dateString.length === 2) {
        const [start, end] = dateString;
        const startDate = typeof start === 'string' ? start.split('T')[0] : start?.format?.('YYYY-MM-DD') || String(start).split('T')[0];
        const endDate = typeof end === 'string' ? end.split('T')[0] : end?.format?.('YYYY-MM-DD') || String(end).split('T')[0];

        if (startDate === endDate) return startDate;
        return `${startDate} to ${endDate}`;
    }

    if (typeof dateString === 'string') {
        const dates = dateString.split(',').map(d => d.trim());
        if (dates.length === 2 && dates[0] === dates[1]) {
            return dates[0];
        }
        return dateString;
    }

    return dateString;
};

// Helper function to detect if device is mobile
const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
};

// Generate ESC/POS commands for sales summary
const generateSummaryESCPOS = (counts, date, userEmail, ticketSales, paymentSummary) => {
    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A;

    const commands = [];

    // Initialize printer
    commands.push(ESC, 0x40); // Reset

    // Center alignment
    commands.push(ESC, 0x61, 0x01);

    // Title - Double width/height
    commands.push(ESC, 0x21, 0x30);
    commands.push(...new TextEncoder().encode('SALES SUMMARY\n'));
    commands.push(ESC, 0x21, 0x00); // Normal
    commands.push(...new TextEncoder().encode('REPORT\n'));
    commands.push(LF);

    // Left alignment
    commands.push(ESC, 0x61, 0x00);

    // User and Date
    commands.push(...new TextEncoder().encode(`${userEmail || 'N/A'}\n`));
    commands.push(...new TextEncoder().encode(`Date: ${formatDateRange(date)}\n`));
    commands.push(...new TextEncoder().encode('--------------------------------\n'));

    // Ticket Sales by Event
    if (ticketSales.length > 0) {
        ticketSales.forEach((eventItem) => {
            const filteredTickets = (eventItem?.tickets || []).filter(t => Number(t?.count) > 0);
            if (filteredTickets.length === 0) return;

            // Event name - centered and bold
            commands.push(ESC, 0x61, 0x01); // Center
            commands.push(ESC, 0x45, 0x01); // Bold on
            commands.push(...new TextEncoder().encode(`${eventItem?.name}\n`));
            commands.push(ESC, 0x45, 0x00); // Bold off
            commands.push(ESC, 0x61, 0x00); // Left

            // Table header
            commands.push(...new TextEncoder().encode('Ticket          Qty    Amount\n'));
            commands.push(...new TextEncoder().encode('--------------------------------\n'));

            // Ticket rows
            filteredTickets.forEach((ticket) => {
                const name = (ticket?.name || '').substring(0, 14).padEnd(14);
                const qty = String(ticket?.count || 0).padStart(4);
                const amount = formatCurrency(ticket?.total_amount).padStart(10);
                commands.push(...new TextEncoder().encode(`${name} ${qty} ${amount}\n`));
            });

            commands.push(...new TextEncoder().encode('--------------------------------\n'));
        });
    }

    // Payment Summary
    if (paymentSummary.length > 0) {
        commands.push(LF);
        commands.push(ESC, 0x45, 0x01); // Bold on
        commands.push(...new TextEncoder().encode('PAYMENT SUMMARY\n'));
        commands.push(ESC, 0x45, 0x00); // Bold off
        commands.push(...new TextEncoder().encode('--------------------------------\n'));

        paymentSummary.forEach((item) => {
            const label = (item.label || '').padEnd(20);
            const value = formatCurrency(item.value).padStart(10);
            commands.push(...new TextEncoder().encode(`${label} ${value}\n`));
        });

        commands.push(...new TextEncoder().encode('--------------------------------\n'));
    }

    // Booking Stats
    commands.push(LF);
    commands.push(ESC, 0x45, 0x01); // Bold on
    const bookingsLabel = 'Total Bookings'.padEnd(20);
    const bookingsValue = String(counts?.totalBookings ?? 0).padStart(10);
    commands.push(...new TextEncoder().encode(`${bookingsLabel} ${bookingsValue}\n`));

    const ticketsLabel = 'Total Tickets'.padEnd(20);
    const ticketsValue = String(counts?.totalTickets ?? 0).padStart(10);
    commands.push(...new TextEncoder().encode(`${ticketsLabel} ${ticketsValue}\n`));
    commands.push(ESC, 0x45, 0x00); // Bold off

    commands.push(...new TextEncoder().encode('--------------------------------\n'));

    // Footer
    commands.push(ESC, 0x61, 0x01); // Center
    commands.push(...new TextEncoder().encode('\nwww.getyourticket.co.in\n'));

    // Feed and cut
    commands.push(LF, LF, LF, LF);
    commands.push(GS, 0x56, 0x00); // Full cut

    return new Uint8Array(commands);
};

const SummaryPrintModal = ({ show, onClose, counts = {}, date, type }) => {
    const { UserData } = useMyContext();
    const dispatch = useDispatch();
    const printRef = useRef(null);

    // Get saved printer config from Redux
    const savedConnectionMode = useSelector(selectConnectionMode);
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
    } = usePrinter();

    const [isPrinting, setIsPrinting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const modeInitializedRef = useRef(false);

    // Initialize connection mode from Redux on mount
    useEffect(() => {
        if (savedConnectionMode && !modeInitializedRef.current) {
            setConnectionMode(savedConnectionMode);
            modeInitializedRef.current = true;
        }
    }, [savedConnectionMode, setConnectionMode]);

    // Browser print handler
    const handleBrowserPrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @page {
                size: 80mm 297mm;
                margin: 0mm;
            }

            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    font-size: 16px;
                }

                .pos-print-body {
                    width: 100%;
                    padding: 0px;
                    font-size: 16px;
                }

                .pos-print-body h5,
                .pos-print-body p,
                .pos-print-body span,
                .pos-print-body table,
                .pos-print-body th,
                .pos-print-body td {
                    font-size: 16px !important;
                }
            }
        `
    });

    // Build payment summary - only include if > 0
    const paymentSummary = [
        { label: 'Total Amount', value: counts?.totalAmount },
        { label: 'Total Discount', value: counts?.totalDiscount },
        { label: 'UPI', value: counts?.upi },
        { label: 'Cash', value: counts?.cash },
        { label: 'Net Banking', value: counts?.nb },
        { label: 'InstaMojo', value: counts?.instamojoTotalAmount },
        { label: 'Easebuzz', value: counts?.easebuzzTotalAmount },
        { label: 'Cashfree', value: counts?.cashfreeTotalAmount },
        { label: 'Razorpay', value: counts?.razorpayTotalAmount },
        { label: 'PhonePe', value: counts?.phonepeTotalAmount },
    ].filter((item) => Number(item.value) > 0);

    const ticketSales = counts?.ticketSales || [];

    // Save connection mode to Redux
    const handleConnectionModeChange = useCallback((mode) => {
        setConnectionMode(mode);
        dispatch(setPrinterConfig({
            connectionMode: mode,
            autoPrint: savedAutoPrint,
        }));
        setConnectionError(null);
    }, [setConnectionMode, dispatch, savedAutoPrint]);

    // Disconnect handler
    const handleDisconnect = async () => {
        await disconnect();
        setConnectionError(null);
        message.info('Printer disconnected');
    };

    // Print handler - handles browser, USB, and Bluetooth modes
    const handlePrint = useCallback(async () => {
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

            // Generate ESC/POS commands
            const commandBytes = generateSummaryESCPOS(counts, date, UserData?.email, ticketSales, paymentSummary);

            await sendRawBytes(commandBytes);

            message.success({ content: 'Print sent successfully!', key: 'print' });
            setConnectionError(null);

        } catch (err) {
            console.error('Print error:', err);
            const errorMsg = err.message || 'Failed to print';
            setConnectionError(errorMsg);
            message.error({ content: errorMsg, key: 'print' });
        } finally {
            setIsPrinting(false);
        }
    }, [isConnected, connectionMode, connectUSB, connectBluetooth, counts, date, UserData, ticketSales, paymentSummary, sendRawBytes, handleBrowserPrint]);

    return (
        <Modal
            open={show}
            onCancel={onClose}
            title={
                <Space>
                    <PrinterOutlined />
                    <span>Sales Summary</span>
                    {isConnected && connectionMode !== 'browser' && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>
                    )}
                </Space>
            }
            width={700}
            footer={[
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                <Button
                    key="settings"
                    icon={<SettingOutlined />}
                    onClick={() => setShowSettings(!showSettings)}
                >
                    {showSettings ? 'Hide Settings' : 'Settings'}
                </Button>,
                <Button
                    key="print"
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                    loading={isPrinting}
                >
                    {connectionMode === 'browser' ? 'Print Summary' : `Print via ${connectionMode === 'usb' ? 'USB' : 'Bluetooth'}`}
                </Button>
            ]}
        >
            {/* Printer Settings Panel */}
            {showSettings && (
                <div className="mb-4 p-3" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="fw-bold">Connection Mode</span>
                        {isConnected && connectionMode !== 'browser' && (
                            <Button size="small" danger onClick={handleDisconnect}>
                                Disconnect
                            </Button>
                        )}
                    </div>
                    <Segmented
                        block
                        value={connectionMode}
                        onChange={handleConnectionModeChange}
                        options={[
                            { label: <span><PrinterOutlined /> Browser</span>, value: 'browser' },
                            { label: <span><UsbOutlined /> USB</span>, value: 'usb' },
                            { label: <span><Bluetooth size={14} /> Bluetooth</span>, value: 'bluetooth' },
                        ]}
                    />

                    {connectionMode !== 'browser' && (
                        <div className="mt-3">
                            <Alert
                                type="info"
                                showIcon
                                message={
                                    isConnected
                                        ? `Connected to: ${deviceName || 'Thermal Printer'}`
                                        : `Click "Print" to connect via ${connectionMode === 'usb' ? 'USB' : 'Bluetooth'} and print directly (skips browser dialog)`
                                }
                            />
                        </div>
                    )}

                    {connectionError && (
                        <Alert
                            type="error"
                            className="mt-3"
                            message="Connection Error"
                            description={connectionError}
                            showIcon
                        />
                    )}
                </div>
            )}

            <div ref={printRef} className="pos-print-body" style={{ padding: '20px 30px', background: 'white' }}>
                <div style={{ color: 'black' }}>
                    <h5 className="fw-bold mb-3 text-center text-black">Sales Summary Report</h5>

                    <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '14px' }}>
                        <span className="d-flex align-items-center gap-2 text-black">
                            {UserData?.email || 'N/A'}
                        </span>
                        <span className="d-flex align-items-center gap-2 text-black">
                            {formatDateRange(date)}
                        </span>
                    </div>

                    {/* Ticket Sales by Event */}
                    {ticketSales.length > 0 && (
                        <>
                            {ticketSales.map((eventItem, index) => {
                                const filteredTickets = (eventItem?.tickets || []).filter(t => Number(t?.count) > 0);
                                if (filteredTickets.length === 0) return null;

                                return (
                                    <div key={index} className="mb-4">
                                        <p className="fw-bold text-black mb-2 text-center" style={{ width: '100%', fontSize: '14px' }}>{eventItem?.name}</p>
                                        <table
                                            className=""
                                            style={{
                                                fontSize: '14px',
                                                width: '100%',
                                                border: '1px solid #000',
                                                borderCollapse: 'collapse'
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th className="text-black py-2" style={{ width: '50%', fontWeight: '600', border: '1px solid #000' }}>Ticket</th>
                                                    <th className="text-center text-black py-2" style={{ width: '20%', fontWeight: '600', border: '1px solid #000' }}>Qty</th>
                                                    <th className="text-end text-black py-2" style={{ width: '30%', fontWeight: '600', border: '1px solid #000' }}>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTickets.map((ticket, i) => (
                                                    <tr key={i}>
                                                        <td className="text-black text-center py-2" style={{ border: '1px solid #000' }}>{ticket?.name}</td>
                                                        <td className="text-center text-black py-2" style={{ border: '1px solid #000' }}>{ticket?.count}</td>
                                                        <td className="text-center text-black py-2" style={{ border: '1px solid #000' }}>{formatCurrency(ticket?.total_amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Payment Summary */}
                    {paymentSummary.length > 0 && (
                        <div className="mb-4">
                            <p className="fw-bold text-black mb-3" style={{ fontSize: '14px' }}>Payment Summary</p>
                            {paymentSummary.map((item, idx) => (
                                <div key={idx} className="d-flex justify-content-between py-2" style={{ fontSize: '14px' }}>
                                    <span className="text-black">{item.label}</span>
                                    <span className="fw-bold text-black">{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Booking Stats */}
                    <div className="border-top pt-3">
                        <div className="d-flex justify-content-between" style={{ fontSize: '14px' }}>
                            <span className="text-black">Total Bookings</span>
                            <span className="fw-bold text-black">{counts?.totalBookings ?? 0}</span>
                        </div>
                        <div className="d-flex justify-content-between" style={{ fontSize: '14px' }}>
                            <span className="text-black">Total Tickets</span>
                            <span className="fw-bold text-black">{counts?.totalTickets ?? 0}</span>
                        </div>
                    </div>

                    <p className="mt-4 mb-0 text-center" style={{ fontSize: '12px', color: '#666' }}>
                        www.getyourticket.co.in
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default SummaryPrintModal;

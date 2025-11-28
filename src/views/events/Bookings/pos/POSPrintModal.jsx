import { QRCodeSVG } from 'qrcode.react';
import React, { useRef, useMemo } from 'react';
import { Modal, Button, Table } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from '../../../../Context/MyContextProvider';
import './POSPrintModal.css';

const POSPrintModal = ({
    showPrintModel,
    closePrintModel,
    event,
    bookingData = [],
    subtotal,
    totalTax,
    discount,
    grandTotal
}) => {
    const { formatDateTime } = useMyContext();
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
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

    /**
     * Format seat names from event_seat_status array
     * Groups by section and formats accordingly:
     * - If all seats in same section: "A1, A2, A3"
     * - If multiple sections: "Section 1: A1, A2 | Section 2: B1, B2"
     */
    const formatSeatNames = (eventSeatStatus) => {
        if (!eventSeatStatus || !Array.isArray(eventSeatStatus) || eventSeatStatus.length === 0) {
            return '-';
        }

        // Group seats by section
        const seatsBySection = eventSeatStatus.reduce((acc, seat) => {
            const sectionName = seat.section?.name || 'Unknown Section';
            if (!acc[sectionName]) {
                acc[sectionName] = [];
            }
            acc[sectionName].push(seat.seat_name);
            return acc;
        }, {});

        const sections = Object.keys(seatsBySection);

        // If only one section, just show seat names
        if (sections.length === 1) {
            return seatsBySection[sections[0]].join(', ');
        }

        // If multiple sections, show section name with seats
        return sections
            .map(sectionName => `${sectionName}: ${seatsBySection[sectionName].join(', ')}`)
            .join(' | ');
    };

    // Check if any booking has event_seat_status data
    const hasSeatingData = useMemo(() => {
        return bookingData?.some(booking =>
            booking?.event_seat_status &&
            Array.isArray(booking.event_seat_status) &&
            booking.event_seat_status.length > 0
        );
    }, [bookingData]);

    // Ticket columns configuration - conditionally include Seat column
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

        // Only add Seat column if seating data exists
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

    // Process ticket data with multi-ticket logic
    const ticketData = useMemo(() => {
        return bookingData?.map((booking, index) => ({
            key: index,
            quantity: booking.quantity || 0,
            seat: formatSeatNames(booking?.event_seat_status),
            ticketName: booking?.ticket?.name || 'N/A',
            price: `₹${(Number(booking.amount) * Number(booking.quantity)).toFixed(2) || '0.00'}`,
        }));
    }, [bookingData]);

    // Summary columns configuration
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

    // Summary data
    const summaryData = useMemo(() => [
        {
            key: '1',
            label: 'TOTAL TAX',
            value: `₹${Number(totalTax)?.toFixed(2) || '0.00'}`,
        },
        {
            key: '2',
            label: 'DISCOUNT',
            value: `₹${Number(discount)?.toFixed(2) || '0.00'}`,
        },
        {
            key: '3',
            label: <strong>TOTAL</strong>,
            value: <strong>₹{Number(grandTotal)?.toFixed(2) || '0.00'}</strong>,
        },
    ], [totalTax, discount, grandTotal]);

    return (
        <Modal
            title="Invoice"
            open={showPrintModel}
            onCancel={closePrintModel}
            width={400}
            footer={[
                <Button key="close" onClick={closePrintModel} icon={<CloseOutlined />}>
                    Close
                </Button>,
                <Button
                    key="print"
                    className='border-0'
                    type="primary"
                    onClick={handlePrint}
                    icon={<PrinterOutlined />}
                >
                    Print Invoice
                </Button>,
            ]}
        >
            <div ref={printRef} className="pos-print-body">
                <div className="text-center">
                    {/* Event Name */}
                    {event?.name && (
                        <h4 className="fw-bold mb-2">{event.name}</h4>
                    )}

                    {/* QR Code */}
                    {bookingData?.[0]?.token && (
                        <div className="d-flex justify-content-center my-2">
                            <QRCodeSVG
                                size={150}
                                value={bookingData[0].token}
                                level="H"
                            />
                        </div>
                    )}

                    {/* Date/Time */}
                    <p className="fw-bold mb-2" style={{ fontSize: '14px' }}>
                        {formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at}
                    </p>

                    {/* Tickets Table - Ant Design */}
                    <Table
                        columns={ticketColumns}
                        dataSource={ticketData}
                        pagination={false}
                        size="small"
                        bordered
                        className="ticket-table mb-2"
                    />

                    {/* Summary Table - Ant Design */}
                    <Table
                        columns={summaryColumns}
                        dataSource={summaryData}
                        pagination={false}
                        size="small"
                        showHeader={false}
                        bordered={false}
                        className="summary-table mb-2"
                    />

                    {/* Footer */}
                    <div className="footer-section">
                        <p className="mb-1" style={{ fontSize: '14px' }}>
                            Thank You for Payment
                        </p>
                        <p className="text-muted" style={{ fontSize: '12px' }}>
                            www.getyourticket.in
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default POSPrintModal;
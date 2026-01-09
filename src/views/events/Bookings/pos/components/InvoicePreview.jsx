import React, { useMemo } from 'react';
import { Table } from 'antd';

const InvoicePreview = ({
    printRef,
    event,
    qrCodeDataURL,
    formatDateTime,
    bookingData,
    totalTax,
    discount,
    grandTotal,
}) => {

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

    const ticketData = useMemo(() => {
        console.log("bookingData", bookingData);
        return bookingData?.map((booking, index) => ({
            key: index,
            quantity: booking.quantity || 0,
            seat: formatSeatNames(booking?.event_seat_status),
            ticketName: booking?.ticket?.name || 'N/A',
            price: `₹${Number(booking.amount).toFixed(2) || '0.00'}`,
        }));
    }, [bookingData]);

    return (
        <div
            ref={printRef}
            className="pos-print-body"
            style={{
                border: '1px solid #e8e8e8',
                borderRadius: '6px',
                padding: '16px',
                background: '#fff'
            }}
        >
            <div className="text-center">
                {/* Event Name */}
                {event?.name && (
                    <h4 className="fw-bold mb-2" style={{ fontSize: '18px', marginTop: 0 }}>
                        {event.name}
                    </h4>
                )}

                {/* QR Code */}
                {qrCodeDataURL && (
                    <div className="d-flex justify-content-center my-2">
                        <img
                            src={qrCodeDataURL}
                            alt="QR Code"
                            style={{
                                width: '150px',
                                height: '150px',
                                border: '2px solid #f0f0f0',
                                borderRadius: '8px',
                                padding: '8px'
                            }}
                        />
                    </div>
                )}

                {/* Date/Time */}
                <p className="fw-bold mb-2" style={{ fontSize: '14px', color: '#595959' }}>
                    {formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at}
                </p>

                {/* Tickets Table */}
                <Table
                    columns={ticketColumns}
                    dataSource={ticketData}
                    pagination={false}
                    size="small"
                    bordered
                    className="ticket-table mb-2"
                />

                {/* Summary Table */}
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
                <div className="footer-section" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e8e8e8' }}>
                    <p className="mb-1" style={{ fontSize: '14px', fontWeight: '500' }}>
                        Thank You for Payment
                    </p>
                    <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                        www.getyourticket.in
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InvoicePreview;








import React from 'react';
import { Table } from 'antd';

const InvoicePreview = ({
    printRef,
    event,
    qrCodeDataURL,
    formatDateTime,
    bookingData,
    ticketColumns,
    ticketData,
    summaryColumns,
    summaryData
}) => {
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


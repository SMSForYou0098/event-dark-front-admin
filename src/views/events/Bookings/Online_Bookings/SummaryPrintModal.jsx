import React, { useRef } from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from 'Context/MyContextProvider';
import { Calendar, User } from 'lucide-react';

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

const SummaryPrintModal = ({ show, onClose, counts = {}, date, type }) => {
    const { UserData } = useMyContext();
    const printRef = useRef(null);
    
    const handlePrint = useReactToPrint({
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

    return (
        <Modal
            open={show}
            onCancel={onClose}
            title="Sales Summary"
            width={700}
            footer={[
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                    Print Summary
                </Button>
            ]}
        >
            <div ref={printRef} className="pos-print-body" style={{ padding: '20px 30px', background: 'white' }}>
                <div style={{ color: 'black' }}>
                    <h5 className="fw-bold mb-3 text-center text-black">Sales Summary Report</h5>
                    
                    <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '14px' }}>
                        <span className="d-flex align-items-center gap-2 text-black">
                            {/* <User size={14} style={{ width: 14, height: 14, minWidth: 14 }} />  */}
                            {UserData?.email || 'N/A'}
                        </span>
                        <span className="d-flex align-items-center gap-2 text-black">
                            {/* <Calendar size={14} style={{ width: 14, height: 14, minWidth: 14 }} />  */}
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
                                    <div key={index}  className="mb-4">
                                        <p className="fw-bold text-black mb-2 text-center" style={{ width:'100%',fontSize: '14px' }}>{eventItem?.name}</p>
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

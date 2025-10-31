import { QRCodeSVG } from 'qrcode.react';
import React, { useRef, useMemo } from 'react';
import { Modal, Button, Table, Typography } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from '../../../../Context/MyContextProvider';
import './POSPrintModal.css';

const { Title, Text } = Typography;

const POSPrintModal = ({
    showPrintModel,
    closePrintModel,
    event,
    bookingData = [], // default to empty array
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
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    });

    const ticketColumns = useMemo(() => [
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '20%',
            align: 'left',
        },
        {
            title: 'Ticket Name',
            dataIndex: 'ticketName',
            key: 'ticketName',
            width: '50%',
            align: 'left',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: '30%',
            align: 'right',
        },
    ], []);

    // ✅ Fix: Extract ticket data from array
    const ticketData = useMemo(() => {
        return bookingData?.map((booking, index) => ({
            key: index,
            quantity: booking.quantity || 0,
            ticketName: booking?.ticket?.name || 'N/A',
            price: `₹${Number(booking.total_amount)?.toFixed(2) || '0.00'}`,
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

    const summaryData = useMemo(() => [
        {
            key: '1',
            label: 'SUBTOTAL',
            value: `₹${Number(subtotal)?.toFixed(2) || '0.00'}`,
        },
        {
            key: '2',
            label: 'TOTAL TAX',
            value: `₹${Number(totalTax)?.toFixed(2) || '0.00'}`,
        },
        {
            key: '3',
            label: 'DISCOUNT',
            value: `₹${Number(discount)?.toFixed(2) || '0.00'}`,
        },
        {
            key: '4',
            label: <h4 className='m-0 p-0'><strong>TOTAL</strong></h4>,
            value: <h4 className='m-0 p-0'><strong>₹{Number(grandTotal)?.toFixed(2) || '0.00'}</strong></h4>,
        },
    ], [subtotal, totalTax, discount, grandTotal]);

    return (
        <Modal
            title="Invoice"
            open={showPrintModel}
            onCancel={closePrintModel}
            width={400}
            footer={[
                <Button key="close" onClick={closePrintModel} icon={<CloseOutlined />}>Close</Button>,
                <Button key="print" className='border-0' type="primary" onClick={handlePrint} icon={<PrinterOutlined />}>Print Invoice</Button>,
            ]}
        >
            {/* <div ref={printRef} className="pos-print-body" style={{ padding: '20px 10px' }}> */}
            <div ref={printRef} className="pos-print-body">
                <div style={{ textAlign: 'center' }}>
                    {event?.name && (
                        <Title level={4} className='fw-bold m-0'>
                            {event.name}
                        </Title>
                    )}

                    {/* ✅ Fix: Use token from first ticket */}
                    {bookingData?.[0]?.token && (
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '1px 0' }}>
                            <QRCodeSVG
                                size={150}
                                value={bookingData[0].token}
                                level="H"
                            />
                        </div>
                    )}

                    {/* ✅ Fix: Use created_at from first ticket */}
                    <Text strong style={{ fontSize: '14px' }}>
                        {formatDateTime?.(bookingData?.[0]?.created_at) || bookingData?.[0]?.created_at}
                    </Text>

                    <Table
                        columns={ticketColumns}
                        dataSource={ticketData}
                        pagination={false}
                        size="small"
                        bordered
                        style={{ marginBottom: '13px' }}
                    />

                    <Table
                        columns={summaryColumns}
                        dataSource={summaryData}
                        pagination={false}
                        size="small"
                        showHeader={false}
                        bordered={false}
                        style={{ marginBottom: '13px' }}
                    />

                    <Text style={{ display: 'block', fontSize: '14px', marginTop: '0'  , marginBottom : '0'}}>
                        Thank You for Payment
                    </Text>

                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        www.getyourticket.in
                    </Text>
                </div>
            </div>
        </Modal>
    );
};


export default POSPrintModal;
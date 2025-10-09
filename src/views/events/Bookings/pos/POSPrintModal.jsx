import { QRCodeSVG } from 'qrcode.react';
import React, { useRef, useMemo } from 'react';
import { Modal, Button, Table, Typography, Divider } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from '../../../../Context/MyContextProvider';
import './POSPrintModal.css';

const { Title, Text } = Typography;

const POSPrintModal = ({
    showPrintModel,
    closePrintModel,
    event,
    bookingData,
    subtotal,
    totalTax,
    discount,
    grandTotal
}) => {
    const { formatDateTime } = useMyContext();
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Invoice-${bookingData?.token || 'ticket'}`,
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

    const ticketData = useMemo(() => [
        {
            key: '1',
            quantity: bookingData?.quantity || 0,
            ticketName: bookingData?.ticket?.name || 'N/A',
            price: `₹${Number(subtotal)?.toFixed(2) || '0.00'}`,
        },
    ], [bookingData, subtotal]);

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
            value: `₹${Number(subtotal)?.toFixed(2)|| '0.00'}`,
        },
        {
            key: '2',
            label: 'TOTAL TAX',
            value: `₹${totalTax || '0.00'}`,
        },
        {
            key: '3',
            label: 'DISCOUNT',
            value: `₹${Number(discount)?.toFixed(2) || '0.00'}`,
        },
        {
            key: '4',
            label: <strong>TOTAL</strong>,
            value: <strong>₹{Number(grandTotal)?.toFixed(2) || '0.00'}</strong>,
        },
    ], [subtotal, totalTax, discount, grandTotal]);

    return (
        <Modal
            title="Invoice"
            open={showPrintModel}
            onCancel={closePrintModel}
            width={400}
            centered
            footer={[
                <Button
                    key="close"
                    onClick={closePrintModel}
                    icon={<CloseOutlined />}
                >
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
            <div ref={printRef} className="pos-print-body" style={{ padding: '20px 10px' }}>
                <div style={{ textAlign: 'center' }}>
                    {event?.name && (
                        <Title level={4} style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                            {event.name}
                        </Title>
                    )}

                    {bookingData?.token && (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginBottom: '15px' 
                        }}>
                            <QRCodeSVG
                                size={150}
                                value={bookingData.token}
                                level="H"
                            />
                        </div>
                    )}

                    <Text strong style={{ fontSize: '14px' }}>
                        {formatDateTime?.(bookingData?.created_at) || bookingData?.created_at}
                    </Text>

                    {/* <Divider style={{ margin: '15px 0' }} /> */}

                    <Table
                        columns={ticketColumns}
                        dataSource={ticketData}
                        pagination={false}
                        size="small"
                        bordered
                        style={{ marginBottom: '15px' }}
                    />

                    <Table
                        columns={summaryColumns}
                        dataSource={summaryData}
                        pagination={false}
                        size="small"
                        showHeader={false}
                        bordered={false}
                    />

                    {/* <Divider style={{ margin: '15px 0' }} /> */}

                    <Text style={{ display: 'block', fontSize: '14px', marginTop: '5px'}}>
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
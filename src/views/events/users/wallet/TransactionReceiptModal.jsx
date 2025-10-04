import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Spin } from 'antd';
import { useReactToPrint } from 'react-to-print';
import { useMyContext } from '../../../../Context/MyContextProvider';
import axios from 'axios';
import { capitilize } from './Transaction';

const printStyles = `
    @media print {
        margin: 0;
        padding: 5mm;
        width: fit-content;
        @page {
            size: auto;
            margin: 0mm;
        }
        .ant-modal-header,
        .ant-modal-footer,
        .no-print {
            display: none !important;
        }
        .content-wrapper {
            width: fit-content !important;
            min-width: 58mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            word-wrap: break-word !important;
            white-space: normal !important;
        }
        div, span, p {
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
        }
        strong.me-2 {
            display: inline-block !important;
            width: 85px !important;
        }
        .content-row {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 2mm !important;
            margin-bottom: 2mm !important;
        }
        .content-value {
            flex: 1 !important;
            min-width: 0 !important;
        }
        hr {
            margin: 3mm 0 !important;
            width: 100% !important;
        }
        .mb-2 {
            margin-bottom: 2mm !important;
        }
        .mb-3 {
            margin-bottom: 3mm !important;
        }
    }
`;

const TransactionReceiptModal = ({ show, onHide, transactionId }) => {
    const { api, authToken } = useMyContext();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTransactionDetails = async () => {
            if (transactionId && show) {
                setLoading(true);
                try {
                    const response = await axios.get(`${api}transactions-data/${transactionId}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    setTransaction(response.data?.data);
                } catch (error) {
                    console.error('Error fetching transaction details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchTransactionDetails();
        return () => {
            setTransaction(null);
        };
    }, [transactionId, show, api, authToken]);

    const printRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });

    return (
        <Modal
            open={show}
            onCancel={onHide}
            footer={[
                <Button key="close" onClick={onHide} className="no-print">
                    Close
                </Button>,
                <Button key="print" type="primary" onClick={handlePrint} className="no-print">
                    Print
                </Button>
            ]}
            centered
            width={350}
            title="Transaction Receipt"
        >
            <style>{printStyles}</style>
            {loading ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div ref={printRef} className="content-wrapper">
                    <h5 className="mb-3" style={{ textAlign: 'center' }}>{transaction?.shop_name}</h5>
                    <div className="mb-2" style={{ textAlign: 'center' }}>
                        <small>Date: {transaction?.transaction_date ? new Date(transaction?.transaction_date).toLocaleString() : ''}</small>
                    </div>
                    <hr />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div>
                            <div className="mb-2">
                                <strong className="me-2">Customer:</strong>
                                <span>{capitilize(transaction?.user_name)}</span>
                            </div>
                            <div className="mb-2">
                                <strong className="me-2">Amount:</strong>
                                <span>₹{transaction?.credits}</span>
                            </div>
                            <div className="mb-2">
                                <strong className="me-2">Shop Owner:</strong>
                                <span>{transaction?.shop_user_name}</span>
                            </div>
                            {transaction?.description && (
                                <div className="mb-2">
                                    <strong className="me-2">Description:</strong>
                                    <span>{transaction?.description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <hr />
                    <div style={{ color: '#888', textAlign: 'center' }}>
                        <small>Thank you for your business!</small>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default TransactionReceiptModal;
import React, { useState } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { ArrowDownCircle, ArrowUpCircle, Printer } from 'lucide-react';
import { useMyContext } from '../../../../Context/MyContextProvider';
import useFetchTransactions from '../../../../utils/hooks/useFetchTransactions';
import TransactionReceiptModal from './TransactionReceiptModal';
import DataTable from '../../common/DataTable';

export const capitilize = (name) => {
    return name?.replace(/\b\w/g, (char) => char?.toUpperCase()) ?? 'N/A';
};

const Transactions = ({userId}) => {
    const { formatDateTime } = useMyContext();
    const { data: transactions = [], isLoading, refetch } = useFetchTransactions( userId);
    console.log('transactions', transactions);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState(null);

    const HandlePrint = (transactionId) => {
        setSelectedTransactionId(transactionId);
        setShowReceiptModal(true);
    };

    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            width: 70,
            align: 'center',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'User Name',
            dataIndex: ['user', 'name'],
            key: 'userName',
            align: 'center',
            searchable: true,
            render: (text, record) => capitilize(record.user?.name),
        },
        {
            title: 'Number',
            dataIndex: ['user', 'number'],
            key: 'userNumber',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Amount',
            dataIndex: 'new_credit',
            key: 'amount',
            align: 'center',
            sorter: (a, b) => parseFloat(a.new_credit) - parseFloat(b.new_credit),
        },
        {
            title: 'Payment Method',
            dataIndex: 'payment_method',
            key: 'paymentMethod',
            align: 'center',
            render: (text) => capitilize(text),
        },
        {
            title: 'Payment Type',
            dataIndex: 'payment_type',
            key: 'paymentType',
            align: 'center',
            render: (text) => (
                <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    color: text === 'credit' ? '#52c41a' : '#ff4d4f',
                    justifyContent: 'center'
                }}>
                    {text === 'credit' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                    {text === 'credit' ? 'Credit' : 'Debit'}
                </span>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'transaction_id',
            key: 'transactionId',
            align: 'center',
            searchable: true,
        },
        {
            title: 'Date & Time',
            dataIndex: 'created_at',
            key: 'createdAt',
            align: 'center',
            render: (text) => formatDateTime(text),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: 'Transferred By',
            dataIndex: ['assign_by', 'name'],
            key: 'assignBy',
            align: 'center',
            render: (text, record) => capitilize(record.assign_by?.name),
        },
        {
            title: 'Used At',
            dataIndex: ['shop_data', 'shop_name'],
            key: 'shopName',
            align: 'center',
            render: (text, record) => capitilize(record.shop_data?.shop_name),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (text, record) => {
                const status = text || (record.bookings && record.bookings[0]?.status);
                const statusInt = parseInt(status);
                return (
                    <Tag color={statusInt === 0 ? "warning" : "success"}>
                        {statusInt === 0 ? "Cancelled" : "Paid"}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            align: 'center',
            render: (text, record) => (
                <Tooltip 
                    title={record.payment_type === 'debit' 
                        ? 'Printing not available for debit transactions' 
                        : 'Send Receipt'
                    }
                >
                    <Button
                        type="primary"
                        size="small"
                        icon={<Printer size={16} />}
                        onClick={() => HandlePrint(record.id)}
                        disabled={record.payment_type === 'debit'}
                    />
                </Tooltip>
            ),
        }
    ];
    return (
        <>
            <TransactionReceiptModal
                show={showReceiptModal}
                onHide={() => setShowReceiptModal(false)}
                transactionId={selectedTransactionId}
            />
            <DataTable
                title="Transaction History"
                data={transactions.map((transaction, index) => ({
                    ...transaction,
                    key: transaction.id || index,
                }))}
                columns={columns}
                loading={isLoading}
                showDateRange={false}
                showRefresh={true}
                onRefresh={refetch}
                enableSearch={true}
                emptyText="No transactions found"
            />
        </>
    );
};

export default Transactions;
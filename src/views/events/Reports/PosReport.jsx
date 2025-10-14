import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Table, Input, DatePicker, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const PosReports = memo(() => {
    const { api, authToken, ErrorAlert } = useMyContext();
    const [report, setReport] = useState([]);
    const [dateRange, setDateRange] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    const GetBookings = useCallback(async () => {
        try {
            setLoading(true);
            const queryParams = dateRange ? `?date=${dateRange}` : '';
            const response = await axios.get(`${api}pos-report${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                }
            });

            if (response.data.data) {
                setReport(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching POS reports:', error);
            ErrorAlert('Failed to fetch POS reports');
        } finally {
            setLoading(false);
        }
    }, [api, authToken, dateRange, ErrorAlert]);

    useEffect(() => {
        GetBookings();
    }, [GetBookings]);

    const handleDateChange = (dates, dateStrings) => {
        if (dates && dates.length === 2) {
            const formattedRange = `${dateStrings[0]},${dateStrings[1]}`;
            setDateRange(formattedRange);
        } else {
            setDateRange('');
        }
    };

    const columns = useMemo(() => [
        {
            title: '#',
            key: 'index',
            width: 60,
            render: (text, record, index) => index + 1,
            fixed: 'left'
        },
        {
            title: 'POS User',
            dataIndex: 'pos_user_name',
            key: 'pos_user_name',
            sorter: (a, b) => a.pos_user_name.localeCompare(b.pos_user_name),
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value, record) => 
                record.pos_user_name.toLowerCase().includes(value.toLowerCase()),
            fixed: 'left',
            width: 150
        },
        {
            title: 'Total',
            dataIndex: 'booking_count',
            key: 'booking_count',
            sorter: (a, b) => a.booking_count - b.booking_count,
            width: 100
        },
        {
            title: 'Today',
            dataIndex: 'today_booking_count',
            key: 'today_booking_count',
            sorter: (a, b) => a.today_booking_count - b.today_booking_count,
            width: 100
        },
        {
            title: 'UPI',
            dataIndex: 'total_UPI_bookings',
            key: 'total_UPI_bookings',
            sorter: (a, b) => a.total_UPI_bookings - b.total_UPI_bookings,
            width: 80
        },
        {
            title: 'Cash',
            dataIndex: 'total_Cash_bookings',
            key: 'total_Cash_bookings',
            sorter: (a, b) => a.total_Cash_bookings - b.total_Cash_bookings,
            width: 80
        },
        {
            title: 'Net',
            dataIndex: 'total_Net_Banking_bookings',
            key: 'total_Net_Banking_bookings',
            sorter: (a, b) => a.total_Net_Banking_bookings - b.total_Net_Banking_bookings,
            width: 80
        },
        {
            title: 'UPI AMT',
            dataIndex: 'total_UPI_amount',
            key: 'total_UPI_amount',
            render: (text) => `₹${Number(text || 0).toFixed(2)}`,
            sorter: (a, b) => a.total_UPI_amount - b.total_UPI_amount,
            width: 120
        },
        {
            title: 'Cash AMT',
            dataIndex: 'total_Cash_amount',
            key: 'total_Cash_amount',
            render: (text) => `₹${Number(text || 0).toFixed(2)}`,
            sorter: (a, b) => a.total_Cash_amount - b.total_Cash_amount,
            width: 120
        },
        {
            title: 'Net AMT',
            dataIndex: 'total_Net_Banking_amount',
            key: 'total_Net_Banking_amount',
            render: (text) => `₹${Number(text || 0).toFixed(2)}`,
            sorter: (a, b) => a.total_Net_Banking_amount - b.total_Net_Banking_amount,
            width: 120
        },
        {
            title: 'Total Disc',
            dataIndex: 'total_discount',
            key: 'total_discount',
            render: (text) => `₹${Number(text || 0).toFixed(2)}`,
            sorter: (a, b) => a.total_discount - b.total_discount,
            width: 120
        },
        {
            title: 'Total AMT',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (text) => `₹${Number(text || 0).toFixed(2)}`,
            sorter: (a, b) => a.total_amount - b.total_amount,
            width: 120,
            fixed: 'right'
        }
    ], [searchText]);

    return (
        <div className="container-fluid p-4">
            <Card 
                title={<Title level={4} className="mb-0">POS Report</Title>}
                bordered={false}
            >
                <Space direction="vertical" size="middle" className="w-100">
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <RangePicker 
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                            className="flex-grow-1"
                            style={{ maxWidth: 300 }}
                        />
                        <Input
                            placeholder="Search POS users..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            className="flex-grow-1"
                            style={{ maxWidth: 300 }}
                        />
                    </div>
                    
                    <Table
                        columns={columns}
                        dataSource={report}
                        loading={loading}
                        rowKey="id"
                        scroll={{ x: 1500 }}
                        pagination={{
                            defaultPageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} items`,
                            pageSizeOptions: ['10', '20', '50', '100']
                        }}
                        bordered
                        size="small"
                    />
                </Space>
            </Card>
        </div>
    );
});

PosReports.displayName = "PosReports";
export default PosReports;
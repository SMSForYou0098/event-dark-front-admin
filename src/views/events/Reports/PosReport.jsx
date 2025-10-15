import React, { memo, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import DataTable from '../common/DataTable';
import api from 'auth/FetchInterceptor';

const PosReports = memo(() => {
  const { UserData } = useMyContext();
  const [dateRange, setDateRange] = useState(null);

  // Fetch POS reports using TanStack Query
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['posReports', UserData?.id, dateRange],
    queryFn: async () => {
      const queryParams = dateRange
        ? `?date=${dateRange.startDate},${dateRange.endDate}`
        : '';
      const url = `pos-report${queryParams}`;

      const response = await api.get(url);
        console.log('rrr',response)
      if (response.status && response.data) {
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to fetch POS reports');
      }
    },
    enabled: !!UserData?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleDateRangeChange = useCallback((dates) => {
    if (dates) {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setDateRange(null);
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 60,
        align: 'center',
        render: (_, __, index) => index + 1,
        fixed: 'left',
      },
      {
        title: 'POS User',
        dataIndex: 'pos_user_name',
        key: 'pos_user_name',
        align: 'left',
        searchable: true,
        width: 180,
        fixed: 'left',
        sorter: (a, b) => (a.pos_user_name || '').localeCompare(b.pos_user_name || ''),
      },
      {
        title: 'Total',
        dataIndex: 'booking_count',
        key: 'booking_count',
        align: 'center',
        width: 100,
        sorter: (a, b) => (a.booking_count || 0) - (b.booking_count || 0),
      },
      {
        title: 'Today',
        dataIndex: 'today_booking_count',
        key: 'today_booking_count',
        align: 'center',
        width: 100,
        sorter: (a, b) => (a.today_booking_count || 0) - (b.today_booking_count || 0),
      },
      {
        title: 'UPI',
        dataIndex: 'total_UPI_bookings',
        key: 'total_UPI_bookings',
        align: 'center',
        width: 80,
        sorter: (a, b) => (a.total_UPI_bookings || 0) - (b.total_UPI_bookings || 0),
      },
      {
        title: 'Cash',
        dataIndex: 'total_Cash_bookings',
        key: 'total_Cash_bookings',
        align: 'center',
        width: 80,
        sorter: (a, b) => (a.total_Cash_bookings || 0) - (b.total_Cash_bookings || 0),
      },
      {
        title: 'Net Banking',
        dataIndex: 'total_Net_Banking_bookings',
        key: 'total_Net_Banking_bookings',
        align: 'center',
        width: 120,
        sorter: (a, b) =>
          (a.total_Net_Banking_bookings || 0) - (b.total_Net_Banking_bookings || 0),
      },
      {
        title: 'UPI Amount',
        dataIndex: 'total_UPI_amount',
        key: 'total_UPI_amount',
        align: 'center',
        width: 130,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.total_UPI_amount || 0) - (b.total_UPI_amount || 0),
      },
      {
        title: 'Cash Amount',
        dataIndex: 'total_Cash_amount',
        key: 'total_Cash_amount',
        align: 'center',
        width: 130,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.total_Cash_amount || 0) - (b.total_Cash_amount || 0),
      },
      {
        title: 'Net Banking Amount',
        dataIndex: 'total_Net_Banking_amount',
        key: 'total_Net_Banking_amount',
        align: 'center',
        width: 160,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) =>
          (a.total_Net_Banking_amount || 0) - (b.total_Net_Banking_amount || 0),
      },
      {
        title: 'Total Discount',
        dataIndex: 'total_discount',
        key: 'total_discount',
        align: 'center',
        width: 130,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.total_discount || 0) - (b.total_discount || 0),
      },
      {
        title: 'Total Amount',
        dataIndex: 'total_amount',
        key: 'total_amount',
        align: 'center',
        width: 140,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
        fixed: 'right',
      },
    ],
    []
  );

  return (
    <DataTable
      title="POS Reports"
      data={reports}
      columns={columns}
      showDateRange={true}
      showRefresh={true}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
      loading={isLoading}
      error={isError ? error : null}
      enableSearch={true}
      showSearch={true}
      enableExport={true}
      exportRoute="export-pos-reports"
      ExportPermission={true}
      onRefresh={refetch}
      emptyText="No POS reports found"
    />
  );
});

PosReports.displayName = 'PosReports';
export default PosReports;
import React, { memo, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import api from 'auth/FetchInterceptor';

const AgentReports = memo(() => {
  const { UserData, UserPermissions } = useMyContext();
  const [dateRange, setDateRange] = useState(null);

  // Fetch agent reports using TanStack Query
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['agentReports', UserData?.id, dateRange],
    queryFn: async () => {
      const queryParams = dateRange
        ? `?date=${dateRange.startDate},${dateRange.endDate}`
        : '';
      const url = `agent-report${queryParams}`;

      const response = await api.get(url);

      if (response.data) {
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to fetch agent reports');
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
        title: 'Agent Name',
        dataIndex: 'agent_name',
        key: 'agent_name',
        align: 'left',
        searchable: true,
        width: 180,
        fixed: 'left',
        sorter: (a, b) => (a.agent_name || '').localeCompare(b.agent_name || ''),
      },
      {
        title: 'Total',
        dataIndex: 'total_bookings',
        key: 'total_bookings',
        align: 'center',
        width: 100,
        sorter: (a, b) => (a.total_bookings || 0) - (b.total_bookings || 0),
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
        title: 'Today Amount',
        dataIndex: 'today_total_amount',
        key: 'today_total_amount',
        align: 'center',
        width: 130,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.today_total_amount || 0) - (b.today_total_amount || 0),
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
      title="Agent Reports"
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
      exportRoute="export-agent-reports"
      ExportPermission={UserPermissions?.includes('Export Agent Reports')}
      onRefresh={refetch}
      emptyText="No agent reports found"

    />
  );
});

AgentReports.displayName = 'AgentReports';
export default AgentReports;
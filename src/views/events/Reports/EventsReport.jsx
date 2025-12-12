import React, { memo, useState, useCallback, useMemo } from 'react';
import { Switch, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import api from 'auth/FetchInterceptor';

const { Text } = Typography;

const EventReports = memo(() => {
  const { UserData, UserPermissions } = useMyContext();
  const [dateRange, setDateRange] = useState(null);
  const [type, setType] = useState('active');

  // Fetch event reports using TanStack Query
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['eventReports', UserData?.id, dateRange, type],
    queryFn: async () => {
      const queryParams = [];
      if (dateRange) {
        queryParams.push(`date=${dateRange.startDate},${dateRange.endDate}`);
      }
      if (type) {
        queryParams.push(`type=${type}`);
      }

      const url = `event-reports/${UserData.id}${queryParams.length ? `?${queryParams.join('&')}` : ''
        }`;

      const response = await api.get(url);
      return response.data;
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

  const handleTypeChange = useCallback((checked) => {
    setType(checked ? 'active' : 'inactive');
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
        title: 'Event',
        dataIndex: 'event_name',
        key: 'event_name',
        align: 'left',
        searchable: true,
        width: 200,
        fixed: 'left',
        sorter: (a, b) => (a.event_name || '').localeCompare(b.event_name || ''),
      },
      {
        title: 'Organizer',
        dataIndex: 'organizer',
        key: 'organizer',
        align: 'center',
        searchable: true,
        width: 150,
        sorter: (a, b) => (a.organizer || '').localeCompare(b.organizer || ''),
      },
      {
        title: 'Online',
        dataIndex: 'non_agent_bookings',
        key: 'non_agent_bookings',
        align: 'center',
        width: 100,
        sorter: (a, b) => (a.non_agent_bookings || 0) - (b.non_agent_bookings || 0),
      },
      {
        title: 'Online Amount',
        dataIndex: 'online_base_amount',
        key: 'online_base_amount',
        align: 'center',
        width: 130,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.online_base_amount || 0) - (b.online_base_amount || 0),
      },
      {
        title: 'Easebuzz',
        dataIndex: 'easebuzz_total_amount',
        key: 'easebuzz_total_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) =>
          (a.easebuzz_total_amount || 0) - (b.easebuzz_total_amount || 0),
      },
      {
        title: 'Instamojo',
        dataIndex: 'instamojo_total_amount',
        key: 'instamojo_total_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) =>
          (a.instamojo_total_amount || 0) - (b.instamojo_total_amount || 0),
      },
      // Razorpay PhonePe CashFree
      {
        title: 'Razorpay',
        dataIndex: 'razorpay_total_amount',
        key: 'razorpay_total_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) =>
          (a.razorpay_total_amount || 0) - (b.razorpay_total_amount || 0),
      },
      {
        title: 'PhonePe',
        dataIndex: 'phonepe_total_amount',
        key: 'phonepe_total_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) =>
          (a.phonepe_total_amount || 0) - (b.phonepe_total_amount || 0),
      }, 
      {
        title: 'CashFree',
        dataIndex: 'cashfree_total_amount',
        key: 'cashfree_total_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) =>
          (a.cashfree_total_amount || 0) - (b.cashfree_total_amount || 0),
      },
      //
      {
        title: 'Agent',
        dataIndex: 'agent_bookings',
        key: 'agent_bookings',
        align: 'center',
        width: 100,
        sorter: (a, b) => (a.agent_bookings || 0) - (b.agent_bookings || 0),
      },
      {
        title: 'Agent Sale',
        dataIndex: 'agent_base_amount',
        key: 'agent_base_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.agent_base_amount || 0) - (b.agent_base_amount || 0),
      },
      {
        title: 'POS',
        dataIndex: 'pos_bookings_quantity',
        key: 'pos_bookings_quantity',
        align: 'center',
        width: 100,
        sorter: (a, b) =>
          (a.pos_bookings_quantity || 0) - (b.pos_bookings_quantity || 0),
      },
      {
        title: 'POS Sale',
        dataIndex: 'pos_base_amount',
        key: 'pos_base_amount',
        align: 'center',
        width: 120,
        render: (val) => `₹${Number(val || 0).toFixed(2)}`,
        sorter: (a, b) => (a.pos_base_amount || 0) - (b.pos_base_amount || 0),
      },
      {
        title: 'Total Tickets',
        key: 'total_bookings',
        align: 'center',
        width: 120,
        render: (_, row) =>
          (row.non_agent_bookings || 0) +
          (row.agent_bookings || 0) +
          (row.pos_bookings_quantity || 0),
        sorter: (a, b) => {
          const totalA =
            (a.non_agent_bookings || 0) +
            (a.agent_bookings || 0) +
            (a.pos_bookings_quantity || 0);
          const totalB =
            (b.non_agent_bookings || 0) +
            (b.agent_bookings || 0) +
            (b.pos_bookings_quantity || 0);
          return totalA - totalB;
        },
      },
      {
        title: 'Discount',
        key: 'total_discount',
        align: 'center',
        width: 120,
        render: (_, row) =>
          `₹${(
            (row.online_discount || 0) +
            (row.pos_discount || 0) +
            (row.agent_discount || 0)
          ).toFixed(2)}`,
        sorter: (a, b) => {
          const discA =
            (a.online_discount || 0) + (a.pos_discount || 0) + (a.agent_discount || 0);
          const discB =
            (b.online_discount || 0) + (b.pos_discount || 0) + (b.agent_discount || 0);
          return discA - discB;
        },
      },
      {
        title: 'Avail Tickets',
        dataIndex: 'available_tickets',
        key: 'ticket_quantity',
        align: 'center',
        width: 120,
        sorter: (a, b) => (a.available_tickets || 0) - (b.available_tickets || 0),
        // sorter: (a, b) => (a.ticket_quantity || 0) - (b.ticket_quantity || 0),
      },
      {
        title: 'Check-ins',
        dataIndex: 'total_ins',
        key: 'total_ins',
        align: 'center',
        width: 100,
        sorter: (a, b) => (a.total_ins || 0) - (b.total_ins || 0),
      },
      {
        title: 'Conv. Fees',
        key: 'total_convenience_fee',
        align: 'center',
        width: 120,
        render: (_, row) =>
          `₹${(
            (row.total_convenience_fee || 0) + (row.pos_convenience_fee || 0) + (row.agent_convenience_fee || 0)
          ).toFixed(2)}`,
        sorter: (a, b) => {
          const feeA = (a.total_convenience_fee || 0) + (a.pos_convenience_fee || 0) + (a.agent_convenience_fee || 0);
          const feeB = (b.total_convenience_fee || 0) + (b.pos_convenience_fee || 0) + (b.agent_convenience_fee || 0);
          return feeA - feeB;
        },
      },
    ],
    []
  );

  // Extra header content with switch
  const extraHeaderContent = useMemo(
    () => (
      <Space>
        <Text>Show:</Text>
        <Switch
          checked={type === 'active'}
          onChange={handleTypeChange}
          checkedChildren="Active"
          unCheckedChildren="all"
        />
      </Space>
    ),
    [type, handleTypeChange]
  );

  return (
    <DataTable
      title="Events Report"
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
      exportRoute="export-event-reports"
      ExportPermission={UserPermissions?.includes('Export Event Reports')}
      onRefresh={refetch}
      emptyText="No event reports found"
      extraHeaderContent={extraHeaderContent}
    />
  );
});

EventReports.displayName = 'EventReports';
export default EventReports;

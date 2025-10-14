import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Spin, Typography, message } from 'antd';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useMyContext } from '../../../../Context/MyContextProvider';
import CommonDateRange from '../CustomHooks/CommonDateRange'; // Assuming AntD compatible

const { Title } = Typography;

const EventReports = memo(() => {
  const { api, UserData, authToken, ErrorAlert } = useMyContext();
  const [report, setReport] = useState([]);
  const [dateRange, setDateRange] = useState('');
  const [type, setType] = useState('active');
  const [loading, setLoading] = useState(true);

  const GetBookings = useCallback(async () => {
    if (!UserData?.id) return;

    try {
      setLoading(true);
      const queryParams = [];
      if (dateRange) queryParams.push(`date=${dateRange}`);
      if (type) queryParams.push(`type=${type}`);

      const url = `${api}event-reports/${UserData.id}${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.data) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [api, UserData?.id, authToken, dateRange, type]);

  // Debounce GetBookings to avoid rapid API calls
  const debouncedGetBookings = useMemo(() => debounce(GetBookings, 400), [GetBookings]);

  // Trigger fetch when filters change and UserData is available
  useEffect(() => {
    if (UserData?.id) {
      debouncedGetBookings();
      return () => debouncedGetBookings.cancel();
    }
  }, [debouncedGetBookings, UserData?.id]);

  const dataSource = useMemo(() => report || [], [report]);

  const columns = useMemo(() => [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Event',
      dataIndex: 'event_name',
      key: 'event_name',
    },
    {
      title: 'Online',
      dataIndex: 'non_agent_bookings',
      key: 'non_agent_bookings',
    },
    {
      title: 'Online Amount',
      dataIndex: 'online_base_amount',
      key: 'online_base_amount',
      render: (val) => `₹${Number(val || 0).toFixed(2)}`,
    },
    {
      title: 'Easebuzz',
      dataIndex: 'easebuzz_total_amount',
      key: 'easebuzz_total_amount',
      render: (val) => `₹${Number(val || 0).toFixed(2)}`,
    },
    {
      title: 'Instamojo',
      dataIndex: 'instamojo_total_amount',
      key: 'instamojo_total_amount',
      render: (val) => `₹${Number(val || 0).toFixed(2)}`,
    },
    {
      title: 'Agent',
      dataIndex: 'agent_bookings',
      key: 'agent_bookings',
    },
    {
      title: 'Agent Sale',
      dataIndex: 'agent_base_amount',
      key: 'agent_base_amount',
      render: (val) => `₹${Number(val || 0).toFixed(2)}`,
    },
    {
      title: 'POS',
      dataIndex: 'pos_bookings_quantity',
      key: 'pos_bookings_quantity',
    },
    {
      title: 'POS Sale',
      dataIndex: 'pos_base_amount',
      key: 'pos_base_amount',
      render: (val) => `₹${Number(val || 0).toFixed(2)}`,
    },
    {
      title: 'Total T',
      key: 'total_bookings',
      render: (_, row) =>
        (row.non_agent_bookings || 0) +
        (row.agent_bookings || 0) +
        (row.pos_bookings_quantity || 0),
    },
    {
      title: 'Disc',
      key: 'total_discount',
      render: (_, row) =>
        `₹${(
          (row.online_discount || 0) +
          (row.pos_discount || 0) +
          (row.agent_discount || 0)
        ).toFixed(2)}`,
    },
    {
      title: 'Organizer',
      dataIndex: 'organizer',
      key: 'organizer',
    },
    {
      title: 'Avail Ticket',
      dataIndex: 'ticket_quantity',
      key: 'ticket_quantity',
    },
    {
      title: 'Check-ins',
      dataIndex: 'total_ins',
      key: 'total_ins',
    },
    {
      title: 'Con Fees',
      key: 'total_convenience_fee',
      render: (_, row) =>
        `₹${(
          (row.online_convenience_fee || 0) +
          (row.pos_convenience_fee || 0)
        ).toFixed(2)}`,
    },
  ], []);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          <Title level={4}>Events Report</Title>

          <CommonDateRange
            setState={setDateRange}
            showSwitch={true}
            setType={setType}
            type={type}
          />

          <Spin spinning={loading}>
            <Table
              dataSource={dataSource}
              columns={columns}
              rowKey={(record) => record.id || `${record.event_name}-${record.organizer}`}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: loading ? 'Loading...' : 'No data available',
              }}
            />
          </Spin>
        </Card>
      </Col>
    </Row>
  );
});

EventReports.displayName = 'EventReports';
export default EventReports;

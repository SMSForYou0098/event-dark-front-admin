import React, { useState } from 'react';
import { Row, Col, Tag, Select, Space, Typography, Card } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMyContext } from 'Context/MyContextProvider';
import StatSection from 'views/events/Dashboard/components/StatSection';
import { useOrganizerEvents } from 'views/events/Settings/hooks/useBanners';
import DataTable from 'views/events/common/DataTable';
import api from 'auth/FetchInterceptor';
const { Text } = Typography;
const ScannerReport = () => {
  const { isMobile, UserData } = useMyContext();
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Fetch events for dropdown
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents(
    UserData?.id,
    UserData?.role
  );

  // Fetch scan statistics using TanStack Query
  const { data: response = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['scanStatistics', selectedEventId],
    queryFn: async () => {
      const params = new URLSearchParams();


      if (selectedEventId) {
        params.append('event_id', selectedEventId);
      }

      const url = params.toString() ? `scan-statistics?${params.toString()}` : 'scan-statistics';
      const res = await api.get(url);
      return res;
    },
    staleTime: 30000,
    retry: 1,
  });

  const stats = response?.statistics || {};

  // Stats cards data
  const statsData = [
    { title: "Total Scans", value: Number(stats.total_scans || 0), hideCurrency: true },
    { title: "Today", value: Number(stats.today_scans || 0), hideCurrency: true },
    { title: "Yesterday", value: Number(stats.yesterday_scans || 0), hideCurrency: true },
  ];

  // Booking type stats
  const bookingTypeStats = stats.scans_by_booking_type
    ? Object.entries(stats.scans_by_booking_type).map(([type, count]) => ({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: Number(count),
      hideCurrency: true,
    }))
    : [];

  // Checkpoint columns
  const checkpointColumns = [
    {
      title: '#',
      key: 'index',
      align: 'center',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Checkpoint',
      dataIndex: 'checkpoint_label',
      key: 'checkpoint_label',
      align: 'left',
      render: (label, record) => (
        <div>
          <Text strong>{label}</Text>
        </div>
      ),
    },
    {
      title: 'Scans',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      width: 80,
      render: (count) => <Text strong>{count}</Text>,
    },
  ];

  // Scanner columns
  const scannerColumns = [
    {
      title: '#',
      key: 'index',
      align: 'center',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Scanner',
      dataIndex: 'user_name',
      key: 'user_name',
      align: 'left',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.user_email && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.user_email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Scans',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      width: 80,
      render: (count) => <Text strong>{count}</Text>,
    },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Event Filter */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong>Filter by Event:</Text>
          <Select
            placeholder="All Events"
            allowClear
            showSearch
            loading={eventsLoading}
            value={selectedEventId}
            onChange={setSelectedEventId}
            style={{ minWidth: 250 }}
            optionFilterProp="label"
            options={events}
          />
        </Space>
      </Card>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <StatSection
          stats={[...statsData, ...bookingTypeStats]}
          colConfig={{ xs: 12, sm: 8, md: 6, lg: 4 }}
          isMobile={isMobile}
        />
      </Row>

      {/* Data Tables */}
      <Row gutter={[16, 16]}>
        {/* Checkpoint Stats */}
        <Col xs={24} md={12}>
          <DataTable
            title="Scans by Checkpoint"
            data={stats.scans_by_checkpoint || []}
            columns={checkpointColumns}
            loading={statsLoading}
            emptyText="No checkpoint data"
            showSearch={false}
            enableSearch={false}
            tableProps={{
              rowKey: (record) => record.checkpoint_id,
              pagination: false,
              size: 'small',
              scroll: { x: false },
            }}
          />
        </Col>

        {/* Scanner Stats */}
        <Col xs={24} md={12}>
          <DataTable
            title="Scans by Scanner"
            data={stats.scans_by_scanner || []}
            columns={scannerColumns}
            loading={statsLoading}
            emptyText="No scanner data"
            showSearch={false}
            enableSearch={false}
            tableProps={{
              rowKey: (record) => record.user_id,
              pagination: false,
              size: 'small',
              scroll: { x: false },
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ScannerReport;

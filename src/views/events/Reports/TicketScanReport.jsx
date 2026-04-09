import React, { useMemo } from 'react';
import { Card, Typography, Spin, Table, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const ticketScansQueryKey = (eventId) => ['ticketScans', String(eventId)];

const buildTicketScansUrl = (eventId) =>
  `scan/${encodeURIComponent(String(eventId))}/ticket-scans`;

const COLUMNS = [
  {
    title: 'Ticket',
    dataIndex: 'ticket_name',
    key: 'ticket_name',
    align: 'center',
    ellipsis: true
  },
  {
    title: 'Total bookings',
    dataIndex: 'total_bookings',
    key: 'total_bookings',
    align: 'center',
    render: (n) => Number(n ?? 0).toLocaleString(),
  },
  {
    title: 'Total scans',
    dataIndex: 'total_scans',
    key: 'total_scans',
    align: 'center',
    render: (n) => Number(n ?? 0).toLocaleString(),
  },
];

const parseRows = (body) => {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return [];
};

/**
 * Event-scoped ticket scan report. Parent mounts only when `eventId` is set.
 * Cached per eventId (staleTime) so switching events reuses prior fetches.
 */
const TicketScanReport = ({ eventId }) => {
  const id = eventId != null && eventId !== '' ? String(eventId) : null;

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ticketScansQueryKey(id),
    queryFn: () => api.get(buildTicketScansUrl(id)),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(() => parseRows(data), [data]);

  if (!id) return null;

  return (
    <Card size="small" title="Ticket scan report" bordered={false}>
      {isPending && !data ? (
        <div className="py-4 text-center">
          <Spin />
        </div>
      ) : isError ? (
        <Alert type="error" showIcon message={Utils.getErrorMessage(error)} />
      ) : !rows.length ? (
        <Typography.Text type="secondary">No ticket scan data for this event.</Typography.Text>
      ) : (
        <Table
          size="small"
          rowKey={(record) => record.ticket_id}
          columns={COLUMNS}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          loading={isFetching && !!data}
        />
      )}
    </Card>
  );
};

export default TicketScanReport;

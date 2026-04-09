import React, { useMemo } from 'react';
import { Drawer, Typography, Spin, Alert, Descriptions, Space, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const ATTENDEE_FIELDS_ENDPOINT = 'bookings/attendee-fields';

const bookingAttendeeQueryKey = (bookingId, isMaster) => [
  'bookingAttendeeFields',
  Number(bookingId),
  Boolean(isMaster),
];

const parseJsonSafe = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  if (!t) return null;
  if (
    (t.startsWith('{') && t.endsWith('}')) ||
    (t.startsWith('[') && t.endsWith(']'))
  ) {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  return null;
};

/** Field key from API → label, e.g. first_name → "first name" */
const keyToLabel = (key) => String(key).replace(/_/g, ' ').toLowerCase();

const formatFieldValue = (value) => {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

/** Plain attendee object(s) only; ignores booking / event metadata on the response. */
const extractAttendeeRecords = (res) => {
  if (!res || typeof res !== 'object') return [];

  const inner =
    res.data != null && typeof res.data === 'object' && !Array.isArray(res.data)
      ? res.data
      : res;

  let raw =
    inner.attendees !== undefined
      ? inner.attendees
      : inner.attendee !== undefined
        ? inner.attendee
        : null;

  if (raw == null && Array.isArray(res.data)) {
    raw = res.data;
  }

  if (raw == null) return [];

  let parsed = typeof raw === 'string' ? parseJsonSafe(raw) : raw;
  if (parsed == null && typeof raw === 'string') return [];

  const list = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

  return list
    .map((item) => {
      const o = typeof item === 'string' ? parseJsonSafe(item) : item;
      if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
      return o;
    })
    .filter(Boolean);
};

const compactDescLabelStyle = {
  width: '36%',
  padding: '4px 8px',
  fontSize: 12,
  lineHeight: 1.35,
};

const compactDescContentStyle = {
  padding: '4px 8px',
  fontSize: 12,
  lineHeight: 1.35,
  wordBreak: 'break-word',
};

const AttendeeFieldsBlock = ({ record, index, total }) => {
  const entries = useMemo(
    () =>
      Object.entries(record).filter(
        ([k]) => k !== 'key' && k !== 'id' && !k.startsWith('_'),
      ),
    [record],
  );

  if (!entries.length) return null;

  const heading =
    total > 1 ? (
      <Typography.Text
        strong
        className="d-block"
        style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.3 }}
      >
        Attendee {index + 1}
      </Typography.Text>
    ) : null;

  return (
    <div>
      {heading}
      <Descriptions
        size="small"
        column={1}
        bordered
        labelStyle={compactDescLabelStyle}
        contentStyle={compactDescContentStyle}
      >
        {entries.map(([fieldKey, value]) => (
          <Descriptions.Item key={fieldKey} label={keyToLabel(fieldKey)}>
            {formatFieldValue(value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

const AttendeeDetailDrawer = ({ open, onClose, bookingId, isMaster }) => {
  const idNum = bookingId != null ? Number(bookingId) : NaN;
  const canFetch = open && Number.isFinite(idNum) && idNum >= 1;

  const { data, isPending, isError, error } = useQuery({
    queryKey: bookingAttendeeQueryKey(idNum, isMaster),
    queryFn: async () => {
      const res = await api.post(ATTENDEE_FIELDS_ENDPOINT, {
        booking_id: idNum,
        is_master: Boolean(isMaster),
      });
      if (res && typeof res.status !== 'undefined' && res.status === false) {
        throw new Error(Utils.getErrorMessage(res, 'Failed to load attendee fields'));
      }
      return res;
    },
    enabled: canFetch,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const attendees = useMemo(() => extractAttendeeRecords(data), [data]);

  return (
    <Drawer
      title="Attendee details"
      placement="right"
      width={480}
      onClose={onClose}
      open={open}
      destroyOnClose
      styles={{
        header: { padding: '10px 14px' },
        body: {
          padding: '8px 12px 12px',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(100dvh - 64px)',
        },
      }}
    >
      {bookingId != null ? (
        <>
          {!canFetch ? null : isPending ? (
            <div className="py-4 text-center">
              <Spin size="small" />
            </div>
          ) : isError ? (
            <Alert
              type="error"
              showIcon
              message={Utils.getErrorMessage(error)}
              style={{ fontSize: 12, padding: '6px 10px' }}
            />
          ) : attendees.length > 0 ? (
            <Space direction="vertical" size={8} className="w-100">
              {attendees.map((record, index) => (
                <React.Fragment key={record.id != null ? String(record.id) : `attendee-${index}`}>
                  {index > 0 ? (
                    <Divider style={{ margin: '4px 0' }} />
                  ) : null}
                  <AttendeeFieldsBlock
                    record={record}
                    index={index}
                    total={attendees.length}
                  />
                </React.Fragment>
              ))}
            </Space>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              No attendee details returned.
            </Typography.Text>
          )}
        </>
      ) : null}
    </Drawer>
  );
};

export default AttendeeDetailDrawer;

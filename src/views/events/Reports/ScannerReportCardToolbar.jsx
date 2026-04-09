import React, { useState, useCallback } from 'react';
import { Select, DatePicker, Button, Tooltip, message, Modal, Checkbox, Space } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';
import Flex from 'components/shared-components/Flex';

const { RangePicker } = DatePicker;

export const SCAN_REPORT_EXPORT_ROUTE = 'export/scan-reports';

export const SCAN_REPORT_EXPORT_TYPES = [
  'summary',
  'scans_by_checkpoint',
  'ticket_scan_report',
  'scanners',
];

const EXPORT_TYPE_OPTIONS = [
  { label: 'Summary', value: 'summary' },
  { label: 'Scans by checkpoint', value: 'scans_by_checkpoint' },
  { label: 'Ticket scan report', value: 'ticket_scan_report' },
  { label: 'Scanners', value: 'scanners' },
];

const ScannerReportCardToolbar = ({
  events = [],
  eventsLoading,
  selectedEventId,
  onSelectedEventIdChange,
  dateRange,
  onDateRangeChange,
  checkpointSearch = '',
  scannerSearch = '',
  exportRoute = SCAN_REPORT_EXPORT_ROUTE,
  exportEnabled = false,
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportTypes, setSelectedExportTypes] = useState(() => []);

  const hasEventSelected = selectedEventId != null && selectedEventId !== '';

  const runExport = useCallback(
    async (types) => {
      if (!exportRoute || !exportEnabled || !hasEventSelected) return;
      if (!types?.length) {
        message.warning('Select at least one report type.');
        return;
      }
      setExportLoading(true);
      try {
        const body = {
          types: [...types],
          event_id:
            typeof selectedEventId === 'number' && !Number.isNaN(selectedEventId)
              ? selectedEventId
              : Number(selectedEventId),
        };

        if (Number.isNaN(body.event_id)) {
          message.error('Invalid event.');
          return;
        }

        if (dateRange?.[0] && dateRange?.[1]) {
          body.start_date = dateRange[0].format('YYYY-MM-DD');
          body.end_date = dateRange[1].format('YYYY-MM-DD');
        }

        const cpQ = String(checkpointSearch ?? '').trim();
        if (cpQ) body.c_search = cpQ;
        const scQ = String(scannerSearch ?? '').trim();
        if (scQ) body.s_search = scQ;

        const response = await api.post(exportRoute, body, { responseType: 'blob' });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        const contentDisposition =
          response.headers['content-disposition'] || response.headers['Content-Disposition'];
        let fileName = 'scan_report_export.zip';
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
          if (fileNameMatch?.[1]) fileName = fileNameMatch[1];
        } else {
          fileName = `scan_report_${new Date().toISOString().split('T')[0]}.zip`;
        }

        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setExportModalOpen(false);
      } catch (err) {
        message.error(Utils.getErrorMessage(err));
      } finally {
        setExportLoading(false);
      }
    },
    [
      exportRoute,
      exportEnabled,
      hasEventSelected,
      selectedEventId,
      dateRange,
      checkpointSearch,
      scannerSearch,
    ]
  );

  const openExportModal = useCallback(() => {
    setSelectedExportTypes([]);
    setExportModalOpen(true);
  }, []);

  const handleModalOk = useCallback(() => {
    runExport(selectedExportTypes);
  }, [runExport, selectedExportTypes]);

  return (
    <Flex gap={8} align="center" wrap="wrap">
      <Select
        placeholder="All Events"
        allowClear
        showSearch
        loading={eventsLoading}
        value={selectedEventId}
        onChange={onSelectedEventIdChange}
        style={{ minWidth: 250 }}
        optionFilterProp="label"
        options={events}
      />
      <RangePicker
        value={dateRange}
        onChange={onDateRangeChange}
        format="YYYY-MM-DD"
        allowClear
        style={{ minWidth: 260 }}
      />
      {exportEnabled && exportRoute ? (
        <Tooltip
          title={hasEventSelected ? 'Export scan report' : 'Select an event to export'}
        >
          <span className="d-inline-block">
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={openExportModal}
              loading={exportLoading && !exportModalOpen}
              disabled={(exportLoading && !exportModalOpen) || !hasEventSelected}
            />
          </span>
        </Tooltip>
      ) : null}

      <Modal
        title="Export scan report"
        open={exportModalOpen}
        onCancel={() => {
          if (!exportLoading) setExportModalOpen(false);
        }}
        onOk={handleModalOk}
        confirmLoading={exportLoading}
        okText="Export"
        okButtonProps={{ disabled: !selectedExportTypes.length }}
        destroyOnClose
      >
        <div className="mb-2 text-muted" style={{ fontSize: 13 }}>
          Choose which sections to include in the export.
        </div>
        <Checkbox.Group
          value={selectedExportTypes}
          onChange={(values) => setSelectedExportTypes(values)}
        >
          <Space direction="vertical" size="small">
            {EXPORT_TYPE_OPTIONS.map((opt) => (
              <Checkbox key={opt.value} value={opt.value}>
                {opt.label}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Modal>
    </Flex>
  );
};

export default ScannerReportCardToolbar;

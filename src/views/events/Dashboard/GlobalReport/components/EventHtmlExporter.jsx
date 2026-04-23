import React, { useMemo, useRef, useState } from 'react';
import { Button, Modal, Space, message } from 'antd';
import { DownloadOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import api from 'auth/FetchInterceptor';

const PRINT_COLOR_FIX = `
<style>
  html, body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
</style>
`;

const injectPrintFix = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  if (html.includes('</head>')) {
    return html.replace('</head>', `${PRINT_COLOR_FIX}</head>`);
  }

  return PRINT_COLOR_FIX + html;
};

const extractFileNameFromDisposition = (disposition, fallbackName = 'global-report.pdf') => {
  if (!disposition || typeof disposition !== 'string') {
    return fallbackName;
  }

  const utf8FileNameMatch = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1]);
  }

  const fileNameMatch = disposition.match(/filename="?([^";\n]+)"?/i);
  if (fileNameMatch?.[1]) {
    return fileNameMatch[1];
  }

  return fallbackName;
};

const EventHtmlExporter = ({
  eventData,
  buttonType = 'default',
  buttonSize = 'small',
  disabled = false,
}) => {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const iframeRef = useRef(null);

  const canExport = useMemo(() => !!eventData && !disabled, [eventData, disabled]);

  const getRequestPayload = () => ({
    ...(eventData || {}),
  });

  const fetchPreview = async () => {
    if (!canExport || isPreviewLoading) {
      return;
    }

    try {
      setIsPreviewLoading(true);

      const response = await api.post('/global-report/pdf/preview', getRequestPayload());
      const html = typeof response === 'string'
        ? response
        : response?.data || response?.html || '';

      if (!html) {
        message.error('No preview content returned from server.');
        return;
      }

      setPreviewHtml(injectPrintFix(html));
      setIsModalOpen(true);
    } catch (error) {
      console.error('PDF preview failed:', error);
      message.error('Failed to generate PDF preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!canExport || isDownloadLoading) {
      return;
    }

    try {
      setIsDownloadLoading(true);

      const response = await api.post('/global-report/pdf', getRequestPayload(), {
        responseType: 'blob',
      });

      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: 'application/pdf' });

      if (!blob || blob.size === 0) {
        message.error('No PDF file returned from server.');
        return;
      }

      const disposition = response?.headers?.['content-disposition'] || response?.headers?.['Content-Disposition'];
      const fallbackName = `${eventData?.name || 'global-report'}.pdf`;
      const fileName = extractFileNameFromDisposition(disposition, fallbackName);

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      message.success('PDF download started.');
    } catch (error) {
      console.error('PDF download failed:', error);
      message.error('Failed to download PDF.');
    } finally {
      setIsDownloadLoading(false);
    }
  };

  const printPreview = () => {
    const printWindow = iframeRef.current?.contentWindow;

    if (!printWindow) {
      message.error('Preview is not ready for printing.');
      return;
    }

    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error('Print failed:', error);
      message.error('Failed to print preview.');
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} role="presentation">
      <Button
        size={buttonSize}
        type={buttonType}
        icon={<EyeOutlined />}
        loading={isPreviewLoading}
        disabled={!canExport}
        onClick={(e) => {
          e.stopPropagation();
          fetchPreview();
        }}
      >
        Export
      </Button>

      <Modal
        title={`PDF Preview - ${eventData?.name || 'Event'}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        footer={(
          <Space>
            <Button icon={<PrinterOutlined />} onClick={printPreview}>
              Print
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={isDownloadLoading}
              onClick={downloadPdf}
            >
              Download PDF
            </Button>
          </Space>
        )}
        destroyOnClose
      >
        <div style={{ width: '100%', height: '70vh', border: '1px solid #f0f0f0' }}>
          <iframe
            ref={iframeRef}
            title="Global Report PDF Preview"
            srcDoc={previewHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EventHtmlExporter;

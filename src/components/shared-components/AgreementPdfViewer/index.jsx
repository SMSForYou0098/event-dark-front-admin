import React, { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { pdf } from '@react-pdf/renderer';
import { Button, Space, Spin, Typography } from 'antd';
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import AgreementPdfDocument from './AgreementPdfDocument';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const { Text } = Typography;

const AgreementPdfViewer = React.memo(({
  content,
  auto = false,
  defaultScale = 0.5,
  showDownload = true,
  showPrint = true,
  adminSignature,
  org,
  organizerSignature,
  title = 'Agreement',
  onLoadingChange,
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(0.5);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cache for PDF blobs to make switching instantaneous
  const blobCache = React.useRef(new Map());

  // Notify parent of loading state
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    setScale(defaultScale);
    return () => {
      setScale(0.5);
    };
  }, [defaultScale]);

  // Generate PDF blob URL
  useEffect(() => {
    // Create a stable key for caching
    const cacheKey = JSON.stringify({
      content,
      adminId: adminSignature?.id,
      orgId: org?.id,
      organizerSignature: !!organizerSignature,
      title
    });

    // Instant switch if cached
    if (blobCache.current.has(cacheKey)) {
      setPdfUrl(blobCache.current.get(cacheKey));
      setLoading(false);
      return;
    }

    const generatePdfBlob = async () => {
      if (!content) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const blob = await pdf(
          <AgreementPdfDocument
            content={content}
            org={org}
            adminSignature={adminSignature}
            organizerSignature={organizerSignature}
            title={title}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        blobCache.current.set(cacheKey, url);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      generatePdfBlob();
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [content, adminSignature, organizerSignature, title, org]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      blobCache.current.forEach(url => URL.revokeObjectURL(url));
      blobCache.current.clear();
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title || 'Agreement'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  if (loading && !pdfUrl) {
    return (
      <div className="text-center p-5">
        <Spin size="large" />
        <Text className="d-block mt-3">Generating PDF preview...</Text>
      </div>
    );
  }

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', position: 'relative' }}>
      {loading && pdfUrl && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          background: 'rgba(255,255,255,0.7)',
          padding: '10px 20px',
          borderRadius: 8
        }}>
          <Spin size="small" tip="Updating..." />
        </div>
      )}

      {/* Controls */}
      <div className="mb-3 p-2">
        <Space
          direction="horizontal"
          className="w-100"
          size="large"
          wrap
          justify="content-end"
        >
          {/* Left Controls */}
          <Space size="middle">
            <Space size="middle">
              <Button
                icon={<LeftOutlined />}
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                size="small"
              />
              <Text>
                Page {pageNumber} of {numPages || 1}
              </Text>
              <Button
                icon={<RightOutlined />}
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                size="small"
              />
            </Space>
            <Space size="middle">
              <Button
                icon={<ZoomOutOutlined />}
                onClick={zoomOut}
                size="small"
                disabled={scale <= 0.5}
              />
              <Text>{Math.round(scale * 100)}%</Text>
              <Button
                icon={<ZoomInOutlined />}
                onClick={zoomIn}
                size="small"
                disabled={scale >= 2.0}
              />
            </Space>
          </Space>

          <Space size="middle">
            {showDownload && (
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Download
              </Button>
            )}
            {showPrint && (
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Print
              </Button>
            )}
          </Space>
        </Space>
      </div>


      {/* PDF Viewer */}
      <div
        style={{
          maxHeight: auto ? 'auto' : 500,
          overflow: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          background: '#e0e0e0',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {!pdfUrl ? (
          <div className="text-center p-5">
            <Text type="secondary">No content to display</Text>
          </div>
        ) : (
          <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<Spin />}>
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        )}
      </div>
    </div>
  );
});

export default AgreementPdfViewer;

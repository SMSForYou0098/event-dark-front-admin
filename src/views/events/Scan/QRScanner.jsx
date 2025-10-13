import React, { useEffect, useRef, useState } from 'react';
import { Card, Alert, Spin, Empty, Typography, Space, Tag } from 'antd';
import { 
  CameraOutlined, 
  ScanOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined 
} from '@ant-design/icons';
import QrScanner from 'qr-scanner';
import PropTypes from 'prop-types';

const { Text } = Typography;

const QRScanner = ({ onScan, scanMode = 'camera', styles = {} }) => {
  const videoElementRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [scannerStatus, setScannerStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    if (scanMode === 'camera' && videoElementRef.current) {
      setScannerStatus('initializing');
      setError(null);

      const qrScanner = new QrScanner(
        videoElementRef.current,
        (result) => {
          if (result?.data) {
            setLastScan(result.data);
            setScannerStatus('success');
            onScan(result.data);
            
            // Reset success status after 2 seconds
            setTimeout(() => {
              if (scannerStatus === 'success') {
                setScannerStatus('scanning');
              }
            }, 2000);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
        }
      );

      qrScannerRef.current = qrScanner;

      qrScanner
        .start()
        .then(() => {
          setScannerStatus('scanning');
        })
        .catch((err) => {
          console.error('QR Scanner Error:', err);
          setScannerStatus('error');
          setError(err.message || 'Failed to start camera');
        });

      return () => {
        if (qrScannerRef.current) {
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
        }
      };
    }
  }, [scanMode, onScan]);

  const getStatusIcon = () => {
    switch (scannerStatus) {
      case 'scanning':
        return <ScanOutlined className="text-primary" />;
      case 'success':
        return <CheckCircleOutlined className="text-success" />;
      case 'error':
        return <CloseCircleOutlined className="text-danger" />;
      default:
        return <CameraOutlined />;
    }
  };

  const getStatusText = () => {
    switch (scannerStatus) {
      case 'initializing':
        return 'Initializing camera...';
      case 'scanning':
        return 'Point camera at QR code';
      case 'success':
        return 'QR code scanned successfully!';
      case 'error':
        return 'Camera initialization failed';
      default:
        return 'Ready to scan';
    }
  };

  const getStatusType = () => {
    switch (scannerStatus) {
      case 'scanning':
        return 'info';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  if (scanMode !== 'camera') {
    return (
      <Empty
        description="Camera mode is disabled"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Card
      className="qr-scanner-card"
      styles={{
        body: { padding: 0, position: 'relative' }
      }}
    >
      {/* Scanner Status Header */}
      <div className="p-3 border-bottom">
        <Space className="w-100 d-flex justify-content-between align-items-center">
          <Space>
            {getStatusIcon()}
            <Text strong>{getStatusText()}</Text>
          </Space>
          <Tag color={getStatusType() === 'success' ? 'success' : getStatusType() === 'error' ? 'error' : 'processing'}>
            {scannerStatus}
          </Tag>
        </Space>
      </div>

      {/* Video Container */}
      <div className="position-relative" style={{ backgroundColor: '#000' }}>
        <video
          ref={videoElementRef}
          style={{
            width: '100%',
            height: '70vh',
            objectFit: 'cover',
            display: 'block',
            ...styles
          }}
        />

        {/* Loading Overlay */}
        {scannerStatus === 'initializing' && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 10
            }}
          >
            <Space direction="vertical" align="center">
              <Spin size="large" />
              <Text style={{ color: '#fff' }}>Starting camera...</Text>
            </Space>
          </div>
        )}

        {/* Success Overlay */}
        {scannerStatus === 'success' && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: 'rgba(82, 196, 26, 0.2)',
              zIndex: 10,
              animation: 'fadeOut 2s ease-in-out'
            }}
          >
            <CheckCircleOutlined
              style={{
                fontSize: '64px',
                color: '#52c41a'
              }}
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3">
          <Alert
            message="Camera Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </div>
      )}

      {/* Last Scan Result */}
      {lastScan && (
        <div className="p-3 bg-light border-top">
          <Text type="secondary" className="d-block mb-2">Last scanned:</Text>
          <Text code copyable ellipsis>
            {lastScan}
          </Text>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </Card>
  );
};

QRScanner.propTypes = {
  onScan: PropTypes.func.isRequired,
  scanMode: PropTypes.oneOf(['camera', 'manual']),
  styles: PropTypes.object
};

export default QRScanner;
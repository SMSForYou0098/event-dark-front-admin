import React, { useEffect, useRef, useState } from 'react';
import { Card, Alert, Spin, Empty, Typography, Space, Tag, Button } from 'antd';
import {
  CameraOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import QrScanner from 'qr-scanner';
import PropTypes from 'prop-types';

const { Text } = Typography;

const QRScanner = ({ onScan, scanMode = 'camera', styles = {}, pauseScan = false }) => {
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
          if (result?.data && scannerStatus !== 'success' && !pauseScan) {
            setLastScan(result.data);
            setScannerStatus('success');
            onScan(result.data);
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
  }, [scanMode, onScan, pauseScan]); // Re-init scanner if scanMode or onScan changes

  // Update scanner state based on pauseScan prop
  useEffect(() => {
    if (qrScannerRef.current) {
      if (pauseScan) {
        qrScannerRef.current.pause();
      } else if (scannerStatus === 'scanning') {
        qrScannerRef.current.start().catch(console.error);
      }
    }
  }, [pauseScan, scannerStatus]);

  const handleScanAgain = () => {
    setScannerStatus('scanning');
    if (qrScannerRef.current) {
      qrScannerRef.current.start().catch(console.error);
    }
  };

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
        return 'Scan complete';
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
      className="qr-scanner-card overflow-hidden"
      styles={{
        body: { padding: 0, position: 'relative' }
      }}
    >
      {/* Scanner Status Header */}
      <div className="p-3 border-bottom bg-dark">
        <Space className="w-100 d-flex justify-content-between align-items-center">
          <Space>
            {getStatusIcon()}
            <Text strong className="text-white">{getStatusText()}</Text>
          </Space>
          <Space>
            {scannerStatus === 'success' && (
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleScanAgain}
                className="d-flex align-items-center"
              >
                Scan Again
              </Button>
            )}
            <Tag color={getStatusType() === 'success' ? 'success' : getStatusType() === 'error' ? 'error' : 'processing'}>
              {scannerStatus.toUpperCase()}
            </Tag>
          </Space>
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

        {/* Success Overlay with "Scan Again" button center */}
        {scannerStatus === 'success' && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              backdropFilter: 'blur(4px)'
            }}
          >
            <Space direction="vertical" align="center" size="large">
              <CheckCircleOutlined
                style={{
                  fontSize: '84px',
                  color: '#52c41a'
                }}
              />
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleScanAgain}
                style={{
                  height: '50px',
                  padding: '0 40px',
                  fontSize: '18px',
                  borderRadius: '25px',
                  boxShadow: '0 4px 15px rgba(24, 144, 255, 0.4)'
                }}
              >
                Scan Again
              </Button>
            </Space>
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
      {lastScan && scannerStatus !== 'success' && (
        <div className="p-3 bg-dark border-top">
          <Text type="secondary" className="d-block mb-2 text-white-50">Last scanned:</Text>
          <Text code copyable ellipsis className="text-white bg-secondary border-0">
            {lastScan}
          </Text>
        </div>
      )}

      <style jsx>{`
        .qr-scanner-card {
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
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
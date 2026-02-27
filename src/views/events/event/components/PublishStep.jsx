import React from 'react';
import { Card, Space, Typography, Alert, Divider, Modal, Button, Row, Col, message } from 'antd';
import QRCode from 'qrcode';
import {
  CheckCircleOutlined,
  ShareAltOutlined,
  QrcodeOutlined,
  LinkOutlined,
  DownloadOutlined,
  TwitterOutlined,
  FacebookOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import Utils from 'utils';

const { Title, Text, Paragraph } = Typography;

const PublishStep = ({ eventData, formData }) => {

  const { createSlug } = useMyContext();
  const slug = createSlug(eventData?.name || formData?.name || '');
  const canonicalUrl = `https://eventgyt.com/event/${eventData?.key || eventData?.event_key}/${slug}`;

  // Prefer backend-provided short URL if available
  const shortUrl =
    eventData?.short_url ||
    eventData?.shortUrl ||
    eventData?.data?.short_url ||
    eventData?.data?.shortUrl ||
    formData?.short_url ||
    formData?.shortUrl ||
    '';

  const urlToUse = shortUrl || canonicalUrl;

  const [qrVisible, setQrVisible] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState('');

  const generateQr = React.useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(urlToUse);
      setQrDataUrl(dataUrl);
      setQrVisible(true);
    } catch (err) {
      console.error('QR generation failed', err);
      message.error('Failed to generate QR code');
    }
  }, [urlToUse]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug || 'event'}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    message.success('QR code downloaded!');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(urlToUse);
      message.success('Event link copied to clipboard!');
    } catch (err) {
      message.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: formData.name || 'Event',
          text: `Check out this event: ${formData.name || ''}`,
          url: urlToUse
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      message.info('Sharing is not supported on this browser. Use the social media buttons below.');
    }
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out: ${formData.name || 'this event'}`
      )}&url=${encodeURIComponent(urlToUse)}`,
      '_blank'
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToUse)}`,
      '_blank'
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `Check out: ${formData.name || 'this event'} ${urlToUse}`
      )}`,
      '_blank'
    );
  };

  return (
    // Bootstrap container and padding
    <div className="container py-4 my-3">
      {/* Success Header */}
      <div className="text-center mb-4">
        <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
        <Title level={2} className="mb-2">Event Published Successfully! 🎉</Title>
        <Paragraph className="fs-5 text-secondary">
          Your event is now live and ready to be shared with the world.
        </Paragraph>
      </div>

      {/* Event Details Card */}
      <Card
        title={<span className="fs-5">📋 Event Details</span>}
        className="mb-4"
      >
        <Space direction="vertical" className="w-100" size="middle">
          <div>
            <Text type="secondary" className="d-block mb-1">Event Name</Text>
            <Text strong className="fs-5">{eventData?.name || 'N/A'}</Text>
          </div>

          <Divider className="my-2" />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Text type="secondary" className="d-block mb-1">Category</Text>
              <Text>{eventData.category?.title || 'N/A'}</Text>
            </Col>
            {/* <Col xs={24} sm={12}>
              <Text type="secondary" className="d-block mb-1">Venue</Text>
              <Text>{eventData.venue_id || 'N/A'}</Text>
            </Col> */}
          </Row>
          <Divider className="my-2" />

          <div>
            <Text type="secondary" className="d-block mb-2">Event Link</Text>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Text
                copyable
                className="flex-grow-1 min-w-200 p-2 px-3 bg-dark rounded text-light"
                style={{ wordBreak: 'break-all' }}
              >
                {urlToUse}
              </Text>
              {/* <Button
                icon={<LinkOutlined />}
                onClick={handleCopyUrl}
              >
                Copy Link
              </Button> */}
            </div>
          </div>
        </Space>
      </Card>

      {/* Share Section */}
      <Card
        title={<span className="fs-5">🚀 Share Your Event</span>}
        className="mb-4"
      >
        <Paragraph className="mb-3">
          Spread the word about your event through social media or QR code
        </Paragraph>

        <Space direction="vertical" className="w-100" size="middle">
          {/* Primary Actions */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                size="large"
                icon={<QrcodeOutlined />}
                onClick={generateQr}
                block
              >
                Generate QR Code
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                size="large"
                icon={<ShareAltOutlined />}
                onClick={handleNativeShare}
                block
              >
                Share Event
              </Button>
            </Col>
          </Row>

          <Divider className="my-2">or share on social media</Divider>

          {/* Social Media Buttons */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Button
                icon={<TwitterOutlined />}
                onClick={shareOnTwitter}
                block
                className="fw-bold"
                style={{ color: '#1DA1F2' }}
              >
                Twitter
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button
                icon={<FacebookOutlined />}
                onClick={shareOnFacebook}
                block
                className="fw-bold"
                style={{ color: '#4267B2' }}
              >
                Facebook
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button
                icon={<WhatsAppOutlined />}
                onClick={shareOnWhatsApp}
                block
                className="fw-bold"
                style={{ color: '#25D366' }}
              >
                WhatsApp
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Info Alert */}
      <Alert
        message="What's next?"
        description="You can view your event page by clicking the event name above. You can also edit event details anytime from your dashboard. Note that changes may affect existing bookings."
        type="info"
        showIcon
      />

      {/* QR Code Modal */}
      <Modal
        title={<span className="fs-5">📱 Event QR Code</span>}
        open={qrVisible}
        onCancel={() => setQrVisible(false)}
        footer={null}
        width={400}
      >
        <div className="text-center">
          {qrDataUrl ? (
            <>
              <div className="py-4 bg-white rounded mb-3">
                <img
                  src={qrDataUrl}
                  alt="Event QR Code"
                  className="w-100"
                  style={{ maxWidth: 280 }}
                />
              </div>
              <Paragraph type="secondary" className="mb-3">
                Scan this code to view the event page
              </Paragraph>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  size="large"
                >
                  Download QR Code
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleNativeShare}
                  size="large"
                >
                  Share
                </Button>
              </Space>
            </>
          ) : (
            <Text>Generating QR code…</Text>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PublishStep;

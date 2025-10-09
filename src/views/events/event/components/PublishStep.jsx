// PublishStep.jsx
import React from 'react';
import { Card, Space, Typography, Alert, Divider, Modal, Button, Tooltip } from 'antd';
import QRCode from 'qrcode';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';

const { Title, Text, Paragraph } = Typography;

const PublishStep = ({ eventData, formData }) => {
  const { createSlug } = useMyContext();
  const slug = createSlug(eventData?.name || formData?.name || '');
  const canonicalUrl = `https://eventgyt.com/event/${eventData?.key || eventData?.event_key}/${slug}`;

  // Prefer backend-provided short URL if available (check common keys)
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
  const [shareModalVisible, setShareModalVisible] = React.useState(false);

  const generateQr = React.useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(urlToUse);
      setQrDataUrl(dataUrl);
      setQrVisible(true);
    } catch (err) {
      console.error('QR generation failed', err);
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
  };

  const handleNativeShare = async () => {
    const shareTarget = urlToUse;
    if (navigator.share) {
      try {
        await navigator.share({ title: formData.name || 'Event', text: formData.name || '', url: shareTarget });
        return;
      } catch (err) {
        console.error('Share failed', err);
      }
    }
    // show in-app share modal when Web Share API not available
    setShareModalVisible(true);
  };

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a', marginBottom: 24 }} />

      <Title level={2}>Review & Publish Event</Title>

      <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
        Please review all the information you've entered before publishing your event.
        Once published, your event will be visible to all users on the platform.
      </Paragraph>

      <Alert
        message="Important Notice"
        description="Make sure all required fields are filled correctly. You can edit the event after publishing, but some changes may affect existing bookings and attendees."
        type="info"
        showIcon
        style={{ marginBottom: 32, textAlign: 'left', maxWidth: 700, margin: '0 auto 32px' }}
      />

      <Card title="Event Summary" size="small" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text strong>Event Name:</Text>{' '}
            <Text>
              {formData.name ? (
                <a href={canonicalUrl} target="_blank" rel="noopener noreferrer">
                  {formData.name}
                </a>
              ) : (
                'N/A'
              )}
            </Text>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>Category:</Text>{' '}
            <Text>{formData.category || 'N/A'}</Text>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="default" onClick={generateQr}>
              View QR Code
            </Button>

            <Tooltip title="Share (uses Web Share API when available)">
              <Button onClick={handleNativeShare}>Share</Button>
            </Tooltip>

            <Tooltip title={shortUrl ? 'Short URL from backend' : 'No short URL available'}>
              <Button disabled={!shortUrl}>
                {shortUrl ? 'Short URL Available' : 'No Short URL'}
              </Button>
            </Tooltip>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>Venue:</Text>{' '}
            <Text>{formData.venue_id || 'N/A'}</Text>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>Location:</Text>{' '}
            <Text>
              {formData.city || 'N/A'}, {formData.state || 'N/A'}
            </Text>
          </div>
        </Space>
      </Card>

      <Modal
        title="Event QR Code"
        visible={qrVisible}
        onCancel={() => setQrVisible(false)}
        footer={[
          <Button key="share" onClick={handleNativeShare}>
            Share
          </Button>,
          <Button key="download" type="primary" onClick={handleDownload} disabled={!qrDataUrl}>
            Download
          </Button>,
          <Button key="close" onClick={() => setQrVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Event QR" style={{ maxWidth: '100%' }} />
          ) : (
            <Text>Generating QR code…</Text>
          )}
          <div style={{ marginTop: 12 }}>
            <Button
              type="link"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    (formData.name ? formData.name + ' ' : '') + (urlToUse || canonicalUrl)
                  )}`,
                  '_blank'
                )
              }
            >
              Share on Twitter
            </Button>
            <Button
              type="link"
              onClick={() =>
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToUse || canonicalUrl)}`, '_blank')
              }
            >
              Share on Facebook
            </Button>
            <Button
              type="link"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent((formData.name ? formData.name + ' ' : '') + (urlToUse || canonicalUrl))}`,
                  '_blank'
                )
              }
            >
              Share on WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fallback share modal when navigator.share is not available */}
      <Modal
        title="Share Event"
        visible={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent((formData.name ? formData.name + ' ' : '') + (urlToUse || canonicalUrl))}`,
                '_blank'
              )
            }
          >
            Share on Twitter
          </Button>
          <Button
            onClick={() =>
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToUse || canonicalUrl)}`, '_blank')
            }
          >
            Share on Facebook
          </Button>
          <Button
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent((formData.name ? formData.name + ' ' : '') + (urlToUse || canonicalUrl))}`,
                '_blank'
              )
            }
          >
            Share on WhatsApp
          </Button>

          <Divider />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Text copyable={{ text: urlToUse || canonicalUrl }}>{urlToUse || canonicalUrl}</Text>
            <Button
              type="primary"
              onClick={() => {
                if (navigator.clipboard) navigator.clipboard.writeText(urlToUse || canonicalUrl);
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PublishStep;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Skeleton, Typography, message } from 'antd';
import { useParams } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import StadiumCanvasViewer from './StadiumCanvasViewer';
import { mapApiVenueToStadiumConfig } from '../StadiumBuilderAdmin';

const { Title, Text } = Typography;

const StadiumCanvasLayout = ({ mode = 'admin' }) => {
  const { id } = useParams();
  const { api, authToken, isMobile } = useMyContext();
  const [loading, setLoading] = useState(false);
  const [stadium, setStadium] = useState(null);
  const isUserView = mode === 'user';

  const fetchStadium = async () => {
    if (!id) {
      setStadium(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${api}venue-show/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = response.data?.data;
      if (data) {
        setStadium(mapApiVenueToStadiumConfig(data));
      }
    } catch (error) {
      console.error('Failed to load stadium layout', error);
      message.error('Unable to load stadium layout');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelection = (payload = []) => {
    if (!payload?.length) {
      message.info('Select at least one seat to proceed.');
      return;
    }
    console.log('Booking payload', payload);
    message.success(`Captured ${payload.length} seat(s) from canvas flow.`);
  };

  useEffect(() => {
    fetchStadium();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div
      style={{
        minHeight: '80vh',
        padding: isMobile ? '0 0 24px' : '5.5rem 24px 24px',
      }}
    >
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        {loading ? (
          <Skeleton active title paragraph={{ rows: 2 }} />
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
              {stadium?.stadiumName || 'Canvas Based Stadium Layout'}
            </Title>
            {stadium?.stadiumCapacity && (
              <Text type="secondary">
                Capacity:{' '}
                <Text strong>
                  {stadium.stadiumCapacity.toLocaleString()}
                </Text>
              </Text>
            )}
            {stadium?.location && (
              <Text type="secondary">
                Location: <Text strong>{stadium.location}</Text>
              </Text>
            )}
          </div>
        )}
      </Card>

      <Card style={{ borderRadius: 16, padding: isMobile ? 12 : 24 }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 12 }} />
        ) : (
          <StadiumCanvasViewer
            standsData={stadium?.stands}
            isUser={isUserView}
            handleSubmit={isUserView ? handleSeatSelection : undefined}
          />
        )}
      </Card>
    </div>
  );
};

export default StadiumCanvasLayout;


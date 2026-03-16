import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Skeleton, Typography } from 'antd';
import { mapApiVenueToStadiumConfig } from './StadiumBuilderAdmin';
import { useParams } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import StadiumSvgViewer from './stadium builder/StadiumSvgViewer';
import api from 'auth/FetchInterceptor';

const { Title, Text } = Typography;

const UsersBooking = () => {
  const { id } = useParams();
  const { isMobile } = useMyContext();

  const { data: stadiumData, isLoading: loading } = useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const response = await api.get(`venue-show/${id}`);
      const data = response?.data;
      return data ? mapApiVenueToStadiumConfig(data) : null;
    },
    enabled: !!id,
  });

  const handleBooking = (payload) => {
    try {
    } catch (error) {

    } finally {

    }
  };

  return (
    <div style={{
      minHeight: "80vh",
      margin: isMobile ? 0 : undefined,
      padding: isMobile ? 0 : 24,
      paddingTop: "5.5rem",
    }}>
      {loading ? (
        <Card style={{ marginBottom: 24, borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 4 }} />
          <div style={{
            height: '800px',
            backgroundColor: '#f3f4f6',
            marginTop: 16
          }} />
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 24, borderRadius: 8 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                  🏟️ {stadiumData?.stadiumName}
                </Title>
              </Col>
              <Col xs={24} md={8}>
                <Text type="secondary">
                  <Text strong>Capacity: </Text>
                  <Text>{stadiumData?.stadiumCapacity?.toLocaleString()}</Text>
                </Text>
              </Col>
              <Col xs={24} md={8}>
                <Text type="secondary">
                  <Text strong>Location: </Text>
                  <Text>{stadiumData?.location}</Text>
                </Text>
              </Col>
            </Row>
          </Card>
          <Card style={{ padding: 0, borderRadius: 8 }}>
            <StadiumSvgViewer standsData={stadiumData?.stands} handleSubmit={handleBooking} />
          </Card>
        </>
      )}
    </div>
  );
};

export default UsersBooking;

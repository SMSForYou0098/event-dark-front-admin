import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Skeleton, Typography } from 'antd';
import { mapApiVenueToStadiumConfig } from './StadiumBuilderAdmin';
import { useParams } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import StadiumSvgViewer from './stadium builder/StadiumSvgViewer';

const { Title, Text } = Typography;

const UsersBooking = () => {
  const { id } = useParams();
  const [stadiumData, setStadiumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { api, isMobile, authToken } = useMyContext();

  const getStadiumData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}venue-show/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = response.data?.data;
      if (data) {
        setStadiumData(mapApiVenueToStadiumConfig(data));
      }
    } catch (error) {
      console.error('❌ Error fetching stadium data:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStadiumData();
  }, []);

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

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Spin, Typography } from 'antd';
import axios from 'axios';
import { getTotalSeats, validateStadiumConfig } from './stadiumValidation';
import { useNavigate, useParams } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import StadiumSvgViewer from './stadium builder/StadiumSvgViewer';
import StadiumConfigForm from './stadium builder/StadiumConfigForm';

const { Title, Text } = Typography;

export function mapApiVenueToStadiumConfig(data) {
  const mapZones = (zones) =>
    (zones || []).filter(z => z.type === 'stand').map(stand => ({
      id: stand.id,
      name: stand.name,
      type: stand.type,
      isBlocked: Boolean(stand.is_blocked),
      visualWeight: Number(stand.visual_weight ?? stand.visualWeight ?? 1) || 1,
      tiers: (stand.tiers || []).map(tier => ({
        id: tier.id,
        name: tier.name,
        isBlocked: Boolean(tier.is_blocked),
        price: tier.price,
        sections: (tier.sections || []).map(section => ({
          id: section.id,
          name: section.name,
          isBlocked: Boolean(section.is_blocked),
          rows: (section.rows || []).map(row => ({
            id: row.id,
            label: row.label,
            isBlocked: Boolean(row.is_blocked),
            seats: (row.seats || []).length,
            seatList: (row.seats || []).map(seat => ({
              id: seat.id,
              number: seat.number,
              isBooked: seat.is_booked,
              status: seat.status,
              price: seat.price,
            })),
          })),
        })),
      })),
    }));

  return {
    stadiumName: data.name || '',
    stadiumCapacity: data.capacity || 0,
    location: data.location || '',
    stands: mapZones(data.zones),
  };
}

const StadiumBuilderAdmin = () => {
  const { id } = useParams();
  const [stadiumConfig, setStadiumConfig] = useState({
    stadiumName: '',
    stadiumCapacity: '',
    location: '',
    stands: [],
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { api, authToken, successAlert, ErrorAlert } = useMyContext();
  const navigate = useNavigate();

  const getStadiumData = async () => {
    setDataLoading(true);
    try {
      const response = await axios.get(`${api}venue-show/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = response.data?.data;
      if (data) {
        setStadiumConfig(mapApiVenueToStadiumConfig(data));
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching stadium data:", error);
      return null;
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const errorMsg = validateStadiumConfig(stadiumConfig);
      if (errorMsg) {
        ErrorAlert(errorMsg);
        return;
      }

      const payload = id
        ? { ...stadiumConfig, id: Number(id) }
        : stadiumConfig;

      const endpoint = id ? `venue-update/${id}` : `venue-store`;
      const response = await axios.post(
        `${api}${endpoint}`,
        { stadiumConfig: payload },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response?.data?.status) {
        if (!id) {
          setStadiumConfig({ stadiumName: '', stadiumCapacity: '', stands: [], location: '' });
          navigate(-1);
        } else {
          getStadiumData();
        }

        setShowConfigModal(false);
        successAlert("Saved!", "Stadium configuration saved successfully.");
      } else {
        ErrorAlert("Could not save. Please try again.");
      }

    } catch (err) {
      let message = "Network or server error";
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      ErrorAlert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (id) {
      setShowConfigModal(true);
      return;
    }

    setShowConfigModal(true);
    if (
      (stadiumConfig?.stands?.length || 0) === 0 &&
      !stadiumConfig?.stadiumName &&
      !stadiumConfig?.location
    ) {
      setStadiumConfig({ stadiumName: '', stadiumCapacity: '', stands: [], location: '' });
    }
  };

  useEffect(() => {
    if (id) {
      getStadiumData();
    }
  }, []);

  if (dataLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.7)',
        zIndex: 2000
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ marginTop: "5.5rem", padding: '24px' }}>
      <Row gutter={[16, 16]}>
        {/* SVG Viewer */}
        <Col xs={24} md={18}>
          <Card style={{ height: '100%' }}>
            <StadiumSvgViewer
              standsData={stadiumConfig.stands}
              isUser={false}
              enableDrilldown
            />
          </Card>
        </Col>

        {/* Config info / controls */}
        <Col xs={24} md={6}>
          <Card style={{ height: '100%' }}>
            {stadiumConfig.stadiumName ? (
              <>
                <Title level={5}>Configuration Info</Title>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Name: </Text>
                  <Text>{stadiumConfig?.stadiumName}</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Stands: </Text>
                  <Text>{stadiumConfig?.stands?.length}</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Capacity: </Text>
                  <Text>{stadiumConfig?.stadiumCapacity}</Text>
                </div>
                <Button
                  type="default"
                  block
                  onClick={() => setShowConfigModal(true)}
                >
                  Edit Configuration
                </Button>
              </>
            ) : (
              <>
                <Title level={5}>Stadium Builder Admin</Title>
                <Button type="primary" style={{ marginTop: 16 }} onClick={handleCreateNew}>
                  {id ? 'Update Stadium Config' : 'Create new Stadium Config'}
                </Button>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal for configuration */}
      <StadiumConfigForm
        config={stadiumConfig}
        setConfig={setStadiumConfig}
        onSubmit={handleSubmit}
        show={showConfigModal}
        onHide={() => setShowConfigModal(false)}
        loading={loading}
        mode={id ? 'edit' : 'add'}
      />

      {/* Global Loading Spinner */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 2000
        }}>
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default StadiumBuilderAdmin;

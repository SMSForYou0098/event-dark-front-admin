import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Spin,
  Modal,
  Select,
  Typography,
  Empty
} from "antd";
import { useMyContext } from "Context/MyContextProvider";

const { Title, Text } = Typography;
const { Option } = Select;

const CricketGroundIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: 8 }}
  >
    <circle
      cx="32"
      cy="32"
      r="30"
      stroke="#4CAF50"
      strokeWidth="4"
      fill="#C8E6C9"
    />
    <rect x="28" y="16" width="8" height="32" fill="#388E3C" />
  </svg>
);

const FootballGroundIcon = () => (
  <svg
    width="24"
    height="16"
    viewBox="0 0 64 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: 8 }}
  >
    <rect width="64" height="40" rx="6" fill="#2196F3" />
    <line x1="32" y1="0" x2="32" y2="40" stroke="white" strokeWidth="2" />
    <circle
      cx="32"
      cy="20"
      r="6"
      stroke="white"
      strokeWidth="2"
      fill="transparent"
    />
  </svg>
);

const options = [
  { key: "circle", label: "Circle", icon: <CricketGroundIcon /> },
  { key: "rectangle", label: "Rectangle", icon: <FootballGroundIcon /> },
];

const StadiumLayByUser = ({ eventId }) => {
  const { authToken, api } = useMyContext();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [layoutType, setLayoutType] = useState("circle");
  const [nextAction, setNextAction] = useState(null);
  const [selectedVenueId, setSelectedVenueId] = useState(null);

  const fetchLayoutByUser = async () => {
    try {
      const response = await axios.get(`${api}venue-byUser`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.data && response.data.data) {
        setVenues(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayoutByUser();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleAddNewClick = () => {
    setSelectedVenueId(null);
    setShowModal(true);
    setNextAction("addNew");
  };

  const handleGoToLayoutClick = (venueId) => {
    setSelectedVenueId(venueId);
    setShowModal(true);
    setNextAction("goToLayout");
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    if (nextAction === "addNew") {
      const path =
        layoutType === "rectangle"
          ? "/dashboard/events/theatre"
          : "/dashboard/events/stadium";
      navigate(path, { state: { eventId, layoutType } });
    } else if (nextAction === "goToLayout") {
      if (!selectedVenueId) return;
      const path = `/dashboard/events/stadium/${selectedVenueId}`;
      navigate(path, { state: { layoutType } });
    }
    setNextAction(null);
    setSelectedVenueId(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setNextAction(null);
    setSelectedVenueId(null);
  };

  return (
    <div style={{ padding: '24px', marginTop: '24px' }}>
      <Row justify="end" style={{ marginBottom: 24 }}>
        <Col>
          <Button type="primary" onClick={handleAddNewClick}>
            Add New Layout
          </Button>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        {venues.length > 0 ? (
          venues.map((venue) => (
            <Col xs={24} sm={12} md={8} key={venue.id}>
              <Card>
                <Title level={5}>{venue.name}</Title>
                <div style={{ marginBottom: 16 }}>
                  <Text><strong>Location:</strong> {venue.location}</Text>
                  <br />
                  <Text><strong>Type:</strong> {venue.venue_type}</Text>
                  <br />
                  <Text><strong>Capacity:</strong> {venue.capacity}</Text>
                </div>
                <Button
                  type="primary"
                  block
                  onClick={() => handleGoToLayoutClick(venue.id)}
                >
                  Go to Layout
                </Button>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Empty description="No venues found." />
          </Col>
        )}
      </Row>

      <Modal
        title="Select Layout Type"
        open={showModal}
        onOk={handleModalConfirm}
        onCancel={handleModalClose}
        okText="Confirm"
        cancelText="Cancel"
        centered
      >
        <div style={{ paddingTop: 16 }}>
          <Select
            value={layoutType}
            onChange={setLayoutType}
            style={{ width: '100%' }}
            size="large"
          >
            {options.map(({ key, label, icon }) => (
              <Option key={key} value={key}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {icon}
                  <span>{label}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default StadiumLayByUser;

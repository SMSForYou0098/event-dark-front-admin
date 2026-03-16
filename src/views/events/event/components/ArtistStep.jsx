// ArtistStep.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Modal, Input, Avatar, Empty, Space, Tag, Badge, Form, Divider, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, EditOutlined, StarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import ArtistCrewModal from 'views/events/Artist/artistModal';
import Flex from 'components/shared-components/Flex';
import Loader from 'utils/Loader';
import { X } from 'lucide-react';
import { useArtists, useEventInfluencers } from '../hooks/useEventOptions';

const { Title } = Typography;

const ArtistStep = ({ form, isEdit, artistList = [], eventId, id }) => {
  const { UserData, isMobile } = useMyContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInfluencerModalVisible, setIsInfluencerModalVisible] = useState(false);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedArtistForEdit, setSelectedArtistForEdit] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [influencerSearchText, setInfluencerSearchText] = useState('');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInfluencerInitialized, setIsInfluencerInitialized] = useState(false);

  // Check if approval is required from form (useWatch for reactivity, getFieldValue as fallback)
  const watchedApproval = Form.useWatch('is_approval_required', form);
  const isApprovalRequired = watchedApproval ?? form.getFieldValue('is_approval_required');

  // Fetch artists data - fetch immediately in edit mode, when modal opens, or when approval is required
  const { data: artistsData = [], isLoading, refetch } = useArtists(
    (isEdit || shouldFetch || isApprovalRequired) ? UserData?.id : null
  );

  // Fetch event influencers - only when is_approval_required is true and eventId exists
  const { data: eventInfluencersData = [], isLoading: isLoadingInfluencers, refetch: refetchInfluencers } = useEventInfluencers(
    id,
    isApprovalRequired && isEdit // Only fetch if approval is required and in edit mode
  );

  // Transform artist data helper
  const transformArtist = (artist) => ({
    id: artist.id,
    name: artist.name,
    role: artist.description || 'No description',
    image: artist.photo || 'https://i.pravatar.cc/150?img=12',
    genre: artist.category || 'General',
    type: artist.type,
    email: artist.email,
    number: artist.number,
    originalData: artist,
  });

  // Transform fetched artists data
  const allArtists = artistsData.map(transformArtist);

  // Filter artists by type - Artists and Crew only (exclude Influencer)
  const artistsAndCrew = useMemo(() =>
    allArtists.filter((artist) => artist.type === 'Artist' || artist.type === 'Crew'),
    [allArtists]
  );

  // Filter Influencers only
  const influencers = useMemo(() =>
    allArtists.filter((artist) => artist.type === 'Influencer'),
    [allArtists]
  );

  // Handle modal open - trigger fetch when opening
  const handleOpenModal = () => {
    setIsModalVisible(true);
    setShouldFetch(true);
  };

  // Handle influencer modal open
  const handleOpenInfluencerModal = () => {
    setIsInfluencerModalVisible(true);
    setShouldFetch(true);
  };

  // 🔹 Sync selected artists to form as numeric IDs
  useEffect(() => {
    const ids = selectedArtists.map((a) => Number(a.id));
    form.setFieldsValue({ artist_id: ids });
  }, [selectedArtists, form]);

  // 🔹 Sync selected influencers to form as numeric IDs
  useEffect(() => {
    const ids = selectedInfluencers.map((a) => Number(a.id));
    form.setFieldsValue({ influencer_ids: ids });
  }, [selectedInfluencers, form]);

  // 🔹 Initialize selected artists from artistList prop (for edit mode with full data)
  useEffect(() => {
    if (artistList && artistList.length > 0 && !isInitialized) {
      const transformedArtists = artistList.map(transformArtist);
      // Separate artists/crew from influencers
      const artistsCrew = transformedArtists.filter(a => a.type === 'Artist' || a.type === 'Crew');
      const influencersList = transformedArtists.filter(a => a.type === 'Influencer');
      setSelectedArtists(artistsCrew);
      setSelectedInfluencers(influencersList);
      setIsInitialized(true);
    }
  }, [artistList, isInitialized]);

  // 🔹 Initialize selected influencers from API response (for edit mode)
  // API returns just IDs like [6, 7], so we need to match with influencers list
  useEffect(() => {
    if (eventInfluencersData.length > 0 && !isInfluencerInitialized && isApprovalRequired && influencers.length > 0) {
      // eventInfluencersData is an array of IDs, match with influencers list
      const matchedInfluencers = eventInfluencersData
        .map(id => {
          // If it's already an object with id property, use it directly
          const influencerId = typeof id === 'object' ? id.id : id;
          return influencers.find(inf => Number(inf.id) === Number(influencerId));
        })
        .filter(Boolean); // Remove null/undefined

      if (matchedInfluencers.length > 0) {
        setSelectedInfluencers(matchedInfluencers);
        setIsInfluencerInitialized(true);
      }
    }
  }, [eventInfluencersData, isInfluencerInitialized, isApprovalRequired, influencers]);

  // 🔹 Load artists from form IDs when artistsData is available (for edit mode)
  useEffect(() => {
    if (isEdit && !isInitialized && artistsData.length > 0) {
      const existingIds = form.getFieldValue('artist_id');
      const existingInfluencerIds = form.getFieldValue('influencer_ids');

      if (Array.isArray(existingIds) && existingIds.length > 0) {
        // Match IDs with fetched artists data
        const matchedArtists = existingIds
          .map((id) => {
            const found = artistsData.find((artist) => Number(artist.id) === Number(id));
            return found ? transformArtist(found) : null;
          })
          .filter(Boolean); // Remove null values

        if (matchedArtists.length > 0) {
          // Separate by type
          const artistsCrew = matchedArtists.filter(a => a.type === 'Artist' || a.type === 'Crew');
          setSelectedArtists(artistsCrew);
        }
      }

      if (Array.isArray(existingInfluencerIds) && existingInfluencerIds.length > 0) {
        const matchedInfluencers = existingInfluencerIds
          .map((id) => {
            const found = artistsData.find((artist) => Number(artist.id) === Number(id));
            return found ? transformArtist(found) : null;
          })
          .filter(Boolean);

        if (matchedInfluencers.length > 0) {
          setSelectedInfluencers(matchedInfluencers);
        }
      }

      setIsInitialized(true);
    }
  }, [isEdit, artistsData, form, isInitialized]);

  const handleToggleArtist = (artist) => {
    setSelectedArtists((prev) => {
      const exists = prev.find((a) => a.id === artist.id);
      if (exists) return prev.filter((a) => a.id !== artist.id);
      return [...prev, artist];
    });
  };

  const handleToggleInfluencer = (influencer) => {
    setSelectedInfluencers((prev) => {
      const exists = prev.find((a) => a.id === influencer.id);
      if (exists) return prev.filter((a) => a.id !== influencer.id);
      return [...prev, influencer];
    });
  };

  const handleRemoveArtist = (artistId) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== artistId));
  };

  const handleRemoveInfluencer = (influencerId) => {
    setSelectedInfluencers((prev) => prev.filter((a) => a.id !== influencerId));
  };

  const handleCreateArtist = () => {
    setModalMode('create');
    setSelectedArtistForEdit(null);
    setIsArtistModalOpen(true);
  };

  const handleEditArtist = (artist, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedArtistForEdit(artist.originalData);
    setTimeout(() => setIsArtistModalOpen(true), 10);
  };

  const handleArtistModalClose = () => {
    setIsArtistModalOpen(false);
    setSelectedArtistForEdit(null);
    // Refetch artists after creating/editing
    refetch();
  };

  // Filtered artists for modal (Artists and Crew only)
  const filteredArtists = artistsAndCrew.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchText.toLowerCase()) ||
      artist.role.toLowerCase().includes(searchText.toLowerCase())
  );

  // Filtered influencers for modal
  const filteredInfluencers = influencers.filter(
    (influencer) =>
      influencer.name.toLowerCase().includes(influencerSearchText.toLowerCase()) ||
      (influencer.email && influencer.email.toLowerCase().includes(influencerSearchText.toLowerCase()))
  );

  const isSelected = (id) => selectedArtists.some((a) => a.id === id);
  const isInfluencerSelected = (id) => selectedInfluencers.some((a) => a.id === id);

  // Render artist/crew card
  const renderArtistCard = (artist, onRemove, showRemove = true) => (
    <Col xs={24} sm={12} md={8} lg={6} key={artist.id}>
      <Card className="text-center bg-dark border-secondary" hoverable>
        {showRemove && (
          <div className="position-absolute" style={{ top: 8, right: 8 }}>
            <Button
              type="text"
              icon={<X size={16} />}
              size="small"
              onClick={() => onRemove(artist.id)}
              danger
            />
          </div>
        )}
        <div className="d-flex flex-column align-items-center">
          <Avatar src={artist.image} size={120} className="mb-3" />
          <h5 className="text-white mb-1">{artist.name}</h5>
          <p className="text-muted mb-2">{artist.role}</p>
          <Space size={4}>
            <Tag color={artist.type === 'Artist' ? 'blue' : 'green'}>{artist.type}</Tag>
            <Tag color="cyan">{artist.genre}</Tag>
          </Space>
        </div>
      </Card>
    </Col>
  );

  // Render influencer card
  const renderInfluencerCard = (influencer, onRemove, showRemove = true) => (
    <Col xs={24} sm={12} md={8} lg={6} key={influencer.id}>
      <Card className="text-center bg-dark border-secondary" hoverable>
        {showRemove && (
          <div className="position-absolute" style={{ top: 8, right: 8 }}>
            <Button
              type="text"
              icon={<X size={16} />}
              size="small"
              onClick={() => onRemove(influencer.id)}
              danger
            />
          </div>
        )}
        <div className="d-flex flex-column align-items-center">
          <Avatar src={influencer.image} size={120} className="mb-3" icon={<StarOutlined />} />
          <h5 className="text-white mb-1">{influencer.name}</h5>
          {influencer.email && <p className="text-muted mb-1" style={{ fontSize: 12 }}>{influencer.email}</p>}
          {influencer.number && <p className="text-muted mb-2" style={{ fontSize: 12 }}>{influencer.number}</p>}
          <Tag color="purple">Influencer</Tag>
        </div>
      </Card>
    </Col>
  );

  return (
    <div>
      {/* Hidden fields to register in Form */}
      <Form.Item name="artist_id" hidden>
        <input />
      </Form.Item>
      <Form.Item name="influencer_ids" hidden>
        <input />
      </Form.Item>

      {/* Create/Edit Modal */}
      <ArtistCrewModal
        open={isArtistModalOpen}
        onCancel={handleArtistModalClose}
        mode={modalMode}
        initialValues={selectedArtistForEdit}
      />

      {/* Artists & Crew Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white mb-0">Event Crew & Casts</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          Add Artist / Crew
        </Button>
      </div>

      {/* Main content - Display selected artists */}
      {isEdit && isLoading && selectedArtists.length === 0 ? (
        <Loader />
      ) : selectedArtists.length > 0 ? (
        <Row gutter={[24, 24]}>
          {selectedArtists.map((artist) => renderArtistCard(artist, handleRemoveArtist))}
        </Row>
      ) : (
        <Empty
          description={<span className="text-muted">No crew members selected. Click "Add Artist / Crew" to get started.</span>}
          className="py-5"
        />
      )}

      {/* Influencers Section - Only show if is_approval_required is true */}
      {isApprovalRequired && (
        <>
          <Divider style={{ borderColor: '#303030' }} />
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Space>
              <StarOutlined style={{ fontSize: 24, color: '#a855f7' }} />
              <h2 className="text-white mb-0">Event Influencers</h2>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenInfluencerModal} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
              Add Influencer
            </Button>
          </div>

          {selectedInfluencers.length > 0 ? (
            <Row gutter={[24, 24]}>
              {selectedInfluencers.map((influencer) => renderInfluencerCard(influencer, handleRemoveInfluencer))}
            </Row>
          ) : (
            <Empty
              description={<span className="text-muted">No influencers selected. Click "Add Influencer" to get started.</span>}
              className="py-5"
            />
          )}
        </>
      )}

      {/* Artist/Crew Selection Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            <span className="fw-semibold">Select Artists & Crew</span>
          </Space>
        }
        open={isModalVisible}
        centered={isMobile}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => setIsModalVisible(false)}
        okText="Done"
        width={900}
      >
        <Space direction="vertical" className="w-100">
          <Flex justifyContent="between" gap="10px">
            <Input
              placeholder="Search by name or role..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-grow-1"
            />
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreateArtist}>
              New
            </Button>
          </Flex>

          {isLoading ? (
            <Loader />
          ) : filteredArtists.length > 0 ? (
            <Row gutter={[16, 16]} className="mt-3">
              {filteredArtists.map((artist) => (
                <Col xs={24} sm={12} md={8} key={artist.id}>
                  <Badge.Ribbon
                    text={<CheckCircleOutlined />}
                    className={isSelected(artist.id) ? 'd-block' : 'd-none'}
                  >
                    <Card
                      bodyStyle={{ padding: '0.5rem' }}
                      hoverable
                      onClick={() => handleToggleArtist(artist)}
                      className={`text-center position-relative ${isSelected(artist.id) ? 'border-primary bg-dark' : ''}`}
                    >
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        className="position-absolute"
                        style={{ top: 8, right: 8, zIndex: 10 }}
                        onClick={(e) => handleEditArtist(artist, e)}
                      />
                      <div className="d-flex flex-column align-items-center">
                        <Avatar src={artist.image} size={100} className="mb-3" />
                        <h5 className={`mb-1 ${isSelected(artist.id) ? 'text-white' : ''}`}>
                          {artist.name}
                        </h5>
                        <p className={`mb-2 ${isSelected(artist.id) ? 'text-muted' : 'text-secondary'}`}>
                          {artist.role}
                        </p>
                        <Space size={4}>
                          <Tag color={artist.type === 'Artist' ? 'blue' : 'green'}>{artist.type}</Tag>
                          <Tag color="cyan">{artist.genre}</Tag>
                        </Space>
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              className="py-4"
              description={
                <Space direction="vertical" align="center">
                  <span>No artists or crew members found</span>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateArtist}>
                    Add New Artist / Crew
                  </Button>
                </Space>
              }
            />
          )}
        </Space>
      </Modal>

      {/* Influencer Selection Modal */}
      <Modal
        title={
          <Space>
            <StarOutlined style={{ color: '#a855f7' }} />
            <span className="fw-semibold">Select Influencers</span>
          </Space>
        }
        open={isInfluencerModalVisible}
        centered={isMobile}
        onCancel={() => setIsInfluencerModalVisible(false)}
        onOk={() => setIsInfluencerModalVisible(false)}
        okText="Done"
        width={900}
      >
        <Space direction="vertical" className="w-100">
          <Flex justifyContent="between" gap="10px">
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined />}
              value={influencerSearchText}
              onChange={(e) => setInfluencerSearchText(e.target.value)}
              className="flex-grow-1"
            />
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreateArtist} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
              New
            </Button>
          </Flex>

          {isLoading ? (
            <Loader />
          ) : filteredInfluencers.length > 0 ? (
            <Row gutter={[16, 16]} className="mt-3">
              {filteredInfluencers.map((influencer) => (
                <Col xs={24} sm={12} md={8} key={influencer.id}>
                  <Badge.Ribbon
                    text={<CheckCircleOutlined />}
                    color="purple"
                    className={isInfluencerSelected(influencer.id) ? 'd-block' : 'd-none'}
                  >
                    <Card
                      bodyStyle={{ padding: '0.5rem' }}
                      hoverable
                      onClick={() => handleToggleInfluencer(influencer)}
                      className={`text-center position-relative ${isInfluencerSelected(influencer.id) ? 'border-primary bg-dark' : ''}`}
                    >
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        className="position-absolute"
                        style={{ top: 8, right: 8, zIndex: 10 }}
                        onClick={(e) => handleEditArtist(influencer, e)}
                      />
                      <div className="d-flex flex-column align-items-center">
                        <Avatar src={influencer.image} size={100} className="mb-3" icon={<StarOutlined />} />
                        <h5 className={`mb-1 ${isInfluencerSelected(influencer.id) ? 'text-white' : ''}`}>
                          {influencer.name}
                        </h5>
                        {influencer.email && (
                          <p className={`mb-1 ${isInfluencerSelected(influencer.id) ? 'text-muted' : 'text-secondary'}`} style={{ fontSize: 12 }}>
                            {influencer.email}
                          </p>
                        )}
                        {influencer.number && (
                          <p className={`mb-2 ${isInfluencerSelected(influencer.id) ? 'text-muted' : 'text-secondary'}`} style={{ fontSize: 12 }}>
                            {influencer.number}
                          </p>
                        )}
                        <Tag color="purple">Influencer</Tag>
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              className="py-4"
              description={
                <Space direction="vertical" align="center">
                  <span>No influencers found</span>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateArtist} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                    Add New Influencer
                  </Button>
                </Space>
              }
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default ArtistStep;
// ArtistStep.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Input, Avatar, Empty, Space, Tag, Badge,Form} from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import ArtistCrewModal from 'views/events/Artist/artistModal';
import Flex from 'components/shared-components/Flex';
import Loader from 'utils/Loader';
import { X } from 'lucide-react';
import { useArtists } from '../hooks/useEventOptions';

const ArtistStep = ({ form, isEdit, artistList = [] }) => {
  const { UserData , isMobile } = useMyContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedArtistForEdit, setSelectedArtistForEdit] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch artists data - fetch immediately in edit mode, or when modal opens
  const { data: artistsData = [], isLoading, refetch } = useArtists(
    (isEdit || shouldFetch) ? UserData?.id : null
  );

  // Transform artist data helper
  const transformArtist = (artist) => ({
    id: artist.id,
    name: artist.name,
    role: artist.description || 'No description',
    image: artist.photo || 'https://i.pravatar.cc/150?img=12',
    genre: artist.category || 'General',
    type: artist.type,
    originalData: artist,
  });

  // Transform fetched artists data
  const allArtists = artistsData.map(transformArtist);

  // Handle modal open - trigger fetch when opening
  const handleOpenModal = () => {
    setIsModalVisible(true);
    setShouldFetch(true);
  };

  // 🔹 Sync selected artists to form as numeric IDs
  useEffect(() => {
    const ids = selectedArtists.map((a) => Number(a.id));
    form.setFieldsValue({ artist_id: ids });
  }, [selectedArtists, form]);

  // 🔹 Initialize selected artists from artistList prop (for edit mode with full data)
  useEffect(() => {
    if (artistList && artistList.length > 0 && !isInitialized) {
      const transformedArtists = artistList.map(transformArtist);
      setSelectedArtists(transformedArtists);
      setIsInitialized(true);
    }
  }, [artistList, isInitialized]);

  // 🔹 Load artists from form IDs when artistsData is available (for edit mode)
  useEffect(() => {
    if (isEdit && !isInitialized && artistsData.length > 0) {
      const existingIds = form.getFieldValue('artist_id');

      if (Array.isArray(existingIds) && existingIds.length > 0) {
        // Match IDs with fetched artists data
        const matchedArtists = existingIds
          .map((id) => {
            const found = artistsData.find((artist) => Number(artist.id) === Number(id));
            return found ? transformArtist(found) : null;
          })
          .filter(Boolean); // Remove null values

        if (matchedArtists.length > 0) {
          setSelectedArtists(matchedArtists);
          setIsInitialized(true);
        }
      }
    }
  }, [isEdit, artistsData, form, isInitialized]);

  const handleToggleArtist = (artist) => {
    setSelectedArtists((prev) => {
      const exists = prev.find((a) => a.id === artist.id);
      if (exists) return prev.filter((a) => a.id !== artist.id);
      return [...prev, artist];
    });
  };

  const handleRemoveArtist = (artistId) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== artistId));
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

  const filteredArtists = allArtists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchText.toLowerCase()) ||
      artist.role.toLowerCase().includes(searchText.toLowerCase())
  );

  const isSelected = (id) => selectedArtists.some((a) => a.id === id);

  return (
    <div>
      {/* Hidden field to register in Form */}
      <Form.Item name="artist_id" hidden>
        <input />
      </Form.Item>

      {/* Create/Edit Modal */}
      <ArtistCrewModal
        open={isArtistModalOpen}
        onCancel={handleArtistModalClose}
        mode={modalMode}
        initialValues={selectedArtistForEdit}
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white mb-0">Event Crew & Casts</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          Add Artist
        </Button>
      </div>

      {/* Main content - Display selected artists */}
      {isEdit && isLoading && selectedArtists.length === 0 ? (
        <Loader />
      ) : selectedArtists.length > 0 ? (
        <Row gutter={[24, 24]} >
          {selectedArtists.map((artist) => (
            <Col xs={24} sm={12} md={8} lg={6} key={artist.id}>
              <Card className="text-center bg-dark border-secondary" hoverable>
                <div className="position-absolute" style={{ top: 8, right: 8 }}>
                  <Button
                    type="text"
                    icon={<X size={16} />}
                    size="small"
                    onClick={() => handleRemoveArtist(artist.id)}
                    danger
                  />
                </div>
                <div className="d-flex flex-column align-items-center">
                  <Avatar src={artist.image} size={120} className="mb-3" />
                  <h5 className="text-white mb-1">{artist.name}</h5>
                  <p className="text-muted mb-2">{artist.role}</p>
                  <Space size={4}>
                    <Tag color="blue">{artist.type}</Tag>
                    <Tag color="cyan">{artist.genre}</Tag>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={<span className="text-muted">No crew members selected. Click "Add Artist" to get started.</span>}
          className="py-5"
        />
      )}

      {/* Artist Selection Modal */}
      <Modal
        title={<span className="fw-semibold">Select Crew Members</span>}
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
            // style={{maxHeight: '25rem', overflowY: 'auto'}}
            <Row gutter={[16, 16]} className="mt-3" >
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
                      className={`text-center position-relative ${isSelected(artist.id) ? 'border-primary bg-dark' : ''
                        }`}
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
                          <Tag color="blue">{artist.type}</Tag>
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
                  <span>No crew members found</span>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateArtist}>
                    Add New Crew Member
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
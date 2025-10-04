import React, { useState } from 'react';
import { Row, Col, Card, Button, Modal, Input, Avatar, Empty, Space, Tag, Badge, Form, Alert } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const ArtistStep = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAddNewModalVisible, setIsAddNewModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [newArtistForm, setNewArtistForm] = useState({
        name: '',
        role: '',
        genre: '',
        email: '',
        phone: ''
    });

    // Dummy data for existing artists
    const [artists] = useState([
        {
            id: 1,
            name: 'John Doe',
            role: 'Event Director',
            image: 'https://i.pravatar.cc/150?img=12',
            genre: 'Production'
        },
        {
            id: 2,
            name: 'Sarah Smith',
            role: 'Production Manager',
            image: 'https://i.pravatar.cc/150?img=45',
            genre: 'Management'
        },
        {
            id: 3,
            name: 'Michael Johnson',
            role: 'Technical Director',
            image: 'https://i.pravatar.cc/150?img=33',
            genre: 'Technical'
        },
        {
            id: 4,
            name: 'Emily Brown',
            role: 'Stage Manager',
            image: 'https://i.pravatar.cc/150?img=47',
            genre: 'Operations'
        },
        {
            id: 5,
            name: 'David Wilson',
            role: 'Sound Engineer',
            image: 'https://i.pravatar.cc/150?img=15',
            genre: 'Technical'
        },
        {
            id: 6,
            name: 'Lisa Anderson',
            role: 'Lighting Designer',
            image: 'https://i.pravatar.cc/150?img=48',
            genre: 'Creative'
        },
    ]);

    const handleToggleArtist = (artist) => {
        setSelectedArtists(prev => {
            const isSelected = prev.find(a => a.id === artist.id);
            if (isSelected) {
                return prev.filter(a => a.id !== artist.id);
            } else {
                return [...prev, artist];
            }
        });
    };

    const handleRemoveArtist = (artistId) => {
        setSelectedArtists(selectedArtists.filter(artist => artist.id !== artistId));
    };

    const handleAddNewArtist = () => {
        // Submit new artist form
        console.log('New artist submitted:', newArtistForm);
        // Reset form
        setNewArtistForm({
            name: '',
            role: '',
            genre: '',
            email: '',
            phone: ''
        });
        setIsAddNewModalVisible(false);
        setIsModalVisible(false);
    };

    const handleFormChange = (field, value) => {
        setNewArtistForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredArtists = artists.filter(artist =>
        artist.name.toLowerCase().includes(searchText.toLowerCase()) ||
        artist.role.toLowerCase().includes(searchText.toLowerCase())
    );

    const isSelected = (artistId) => selectedArtists.find(a => a.id === artistId);

    return (
        <div className="">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white mb-0">Event Crew & Casts</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                >
                    Add Artist
                </Button>
            </div>

            {/* Selected Artists Grid */}
            {selectedArtists.length > 0 ? (
                <Row gutter={[24, 24]}>
                    {selectedArtists.map(artist => (
                        <Col xs={24} sm={12} md={8} lg={6} key={artist.id}>
                            <Card
                                className="text-center bg-dark border-secondary"
                                hoverable
                            >
                                <div className="position-absolute float-right">
                                    <Link to="#" onClick={() => handleRemoveArtist(artist.id)}><X /></Link>
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <Avatar src={artist.image} size={120} className="mb-3" />
                                    <h5 className="text-white mb-1">{artist.name}</h5>
                                    <p className="text-muted mb-2">{artist.role}</p>
                                    <Space size={4}>
                                        <Tag color="blue">{artist.role}</Tag>
                                        <Tag color="cyan">{artist.genre}</Tag>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty
                    description={<span className="text-muted">No crew members selected. Click "Add Attendee" to get started.</span>}
                    className="py-5"
                />
            )}

            {/* Artist Selection Modal */}
            <Modal
                title={<span className="fw-semibold">Select Crew Members</span>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => setIsModalVisible(false)}
                okText="Done"
                style={{ top: -200 }}
                width={900}
            >
                <Space direction="vertical" className="w-100" size="large">
                    <Input
                        placeholder="Search by name or role..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        size="large"
                    />

                    {filteredArtists.length > 0 ? (
                        <Row gutter={[16, 16]} className="mt-3">
                            {filteredArtists.map(artist => (
                                <Col xs={24} sm={12} md={8} key={artist.id}>
                                    <Badge.Ribbon
                                        text={<CheckCircleOutlined />}
                                        className={isSelected(artist.id) ? 'd-block' : 'd-none'}
                                    >
                                        <Card
                                            hoverable
                                            onClick={() => handleToggleArtist(artist)}
                                            className={`text-center ${isSelected(artist.id) ? 'border-primary bg-dark' : ''}`}
                                        >
                                            <div className="d-flex flex-column align-items-center">
                                                <Avatar src={artist.image} size={100} className="mb-3" />
                                                <h6 className={`mb-1 ${isSelected(artist.id) ? 'text-white' : ''}`}>
                                                    {artist.name}
                                                </h6>
                                                <p className={`mb-2 ${isSelected(artist.id) ? 'text-muted' : 'text-secondary'}`}>
                                                    {artist.role}
                                                </p>
                                                <Space size={4}>
                                                    <Tag color="blue">{artist.role}</Tag>
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
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setIsAddNewModalVisible(true);
                                        }}
                                    >
                                        Add New Crew Member
                                    </Button>
                                </Space>
                            }
                        />
                    )}
                </Space>
            </Modal>

            {/* Add New Artist Modal */}
            <Modal
                title={<span className="fw-semibold">Add New Crew Member</span>}
                open={isAddNewModalVisible}
                onCancel={() => setIsAddNewModalVisible(false)}
                onOk={handleAddNewArtist}
                okText="Submit"
                style={{ top: 0 }}
                width={600}
            >
                <Form layout="vertical" className="mt-3">
                    <Form.Item label="Full Name" required>
                        <Input
                            size="large"
                            placeholder="Enter full name"
                            prefix={<UserOutlined  class="text-primary"/>}
                            value={newArtistForm.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item label="Role / Position" required>
                        <Input
                            size="large"
                            placeholder="e.g., Sound Engineer, Stage Manager"
                            value={newArtistForm.role}
                            onChange={(e) => handleFormChange('role', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item label="Department / Category" required>
                        <Input
                            size="large"
                            placeholder="e.g., Artist, Technical, Production, Creative"
                            value={newArtistForm.genre}
                            onChange={(e) => handleFormChange('genre', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item label="Email Address" required>
                        <Input
                            size="large"
                            type="email"
                            placeholder="Enter email address"
                            prefix={<MailOutlined  class="text-primary"/>}
                            value={newArtistForm.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item label="Phone Number">
                        <Input
                            size="large"
                            placeholder="Enter phone number"
                            prefix={<PhoneOutlined  class="text-primary"/>}
                            value={newArtistForm.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                        />
                    </Form.Item>

                    <Alert
                        message="Verification Required"
                        description={
                            <>
                                Your submission will be reviewed by the{' '}
                                <span className="text-primary">Get Your Ticket</span> team.
                                The new crew member will appear in the selection list once their details have been verified.
                                Thank you for your patience.
                            </>
                        }
                        type="info"
                        showIcon
                        className="mt-3"
                    />
                </Form>
            </Modal>
        </div>
    );
};

export default ArtistStep;
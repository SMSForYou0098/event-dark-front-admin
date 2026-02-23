// components/VenueModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Row, Col, Space, Button, Image } from 'antd';
import { PlusOutlined, PictureOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import apiClient from 'auth/FetchInterceptor';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const { TextArea } = Input;

const VENUE_TYPES = [
    "Open Ground",
    "Arena",
    "Auditorium",
    "Conference Hall",
    "Exhibition Center",
    "Banquet Hall",
    "Stadium",
    "Club",
    "Theater",
    "Resort",
    "Convention Center",
    "Outdoor Park",
    "Hotel Ballroom",
    "Gallery",
    "Multipurpose Venue",
    "Virtual Venue"
];

const VenueModal = ({ open, onCancel, mode = 'create', venueData = null }) => {
    const { locationData, getCitiesByState, isMobile, UserData, userRole } = useMyContext();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);

    // Media selection state
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [venueImageUrls, setVenueImageUrls] = useState([]);

    // Media picker modal state
    const [thumbnailPickerOpen, setThumbnailPickerOpen] = useState(false);
    const [venueImagesPickerOpen, setVenueImagesPickerOpen] = useState(false);

    // Initialize form with venue data in edit mode
    useEffect(() => {
        if (open && mode === 'edit' && venueData) {
            // Set form values
            form.setFieldsValue({
                name: venueData.name,
                org_id: userRole === 'Organizer' ? UserData?.id : venueData.org_id,
                address: venueData.address,
                map_url: venueData.map_url || '',
                city: venueData.city,
                state: venueData.state,
                type: venueData.type,
                aembeded_code: venueData.aembeded_code || '',
                thumbnail: venueData.thumbnail || null,
                venue_images: venueData.venue_images || null,
            });

            // Load cities for the selected state
            if (venueData.state) {
                const stateCities = getCitiesByState(venueData.state);
                setCities(stateCities);
            }

            // Set existing thumbnail
            if (venueData.thumbnail) {
                setThumbnailUrl(venueData.thumbnail);
            }

            // Set existing venue images
            const vnimages = venueData?.venue_images?.split(',').filter(Boolean);
            if (vnimages && Array.isArray(vnimages)) {
                setVenueImageUrls(vnimages);
            }
        } else if (open && mode === 'create') {
            form.resetFields();
            setThumbnailUrl(null);
            setVenueImageUrls([]);
            setCities([]);
        }
    }, [open, mode, venueData, form, getCitiesByState, userRole, UserData]);

    const handleStateChange = (stateName) => {
        form.setFieldValue('city', null);
        const stateCities = getCitiesByState(stateName);
        setCities(stateCities);
    };

    const handleThumbnailSelect = (url) => {
        setThumbnailUrl(url);
        form.setFieldValue('thumbnail', url);
    };

    const handleRemoveThumbnail = () => {
        setThumbnailUrl(null);
        form.setFieldValue('thumbnail', null);
    };

    const handleVenueImagesSelect = (urls) => {
        // Limit to 5 images
        const limitedUrls = urls.slice(0, 5);
        setVenueImageUrls(limitedUrls);
        form.setFieldValue('venue_images', limitedUrls.join(','));
    };

    const handleRemoveVenueImage = (urlToRemove) => {
        const newUrls = venueImageUrls.filter(url => url !== urlToRemove);
        setVenueImageUrls(newUrls);
        form.setFieldValue('venue_images', newUrls.join(','));
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();

            // Append text fields
            formData.append('name', values.name);
            formData.append('org_id', UserData?.id);
            formData.append('address', values.address);
            formData.append('city', values.city);
            formData.append('state', values.state);
            formData.append('type', values.type);
            formData.append('aembeded_code', values.aembeded_code || '');
            formData.append('map_url', values.map_url || '');

            // Append thumbnail URL from gallery
            if (thumbnailUrl) {
                formData.append('thumbnail', thumbnailUrl);
            }

            // Append venue image URLs
            if (venueImageUrls.length > 0) {
                formData.append('venue_images', venueImageUrls.join(','));
            }

            // API call
            const endpoint = mode === 'edit'
                ? `/venue-update/${venueData.id}`
                : '/venue-store';

            const response = await apiClient.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status) {
                // message.success(`Venue ${mode === 'edit' ? 'updated' : 'created'} successfully`);
                message.success(`Venue ${mode === 'edit' ? 'updated' : 'created'} successfully`);
                handleCancel();
            }
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                `Failed to ${mode === 'edit' ? 'update' : 'create'} venue`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setThumbnailUrl(null);
        setVenueImageUrls([]);
        setCities([]);
        onCancel();
    };

    return (
        <>
            <Modal
                title={mode === 'edit' ? 'Edit Venue' : 'Create New Venue'}
                open={open}
                onCancel={handleCancel}
                onOk={() => form.submit()}
                confirmLoading={loading}
                width={900}
                style={{ top: 20 }}
                okText={mode === 'edit' ? 'Update' : 'Create'}
                className="compact-venue-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="compact-venue-form"
                >
                    <Row gutter={16} style={{ maxHeight: isMobile ? '30rem' : '100%', overflowX: 'auto' }}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Venue Name"
                                name="name"
                                rules={[{ required: true, message: 'Please enter venue name' }]}
                            >
                                <Input placeholder="Enter venue name" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Venue Type"
                                name="type"
                                rules={[{ required: true, message: 'Please select venue type' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select venue type"
                                    options={VENUE_TYPES.map(type => ({ value: type, label: type }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                label="State"
                                name="state"
                                rules={[{ required: true, message: 'Please select state' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select state"
                                    options={locationData?.states}
                                    onChange={handleStateChange}
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                label="City"
                                name="city"
                                rules={[{ required: true, message: 'Please select city' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select city"
                                    options={cities}
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Map URL"
                                name="map_url"
                            >
                                <Input placeholder="Enter map URL" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={24}>
                            <Form.Item
                                label="Address"
                                name="address"
                                rules={[{ required: true, message: 'Please enter address' }]}
                            >
                                <Input.TextArea placeholder="Enter full address" />
                            </Form.Item>
                        </Col>

                        {/* Thumbnail Image */}
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Thumbnail Image"
                                name="thumbnail"
                                rules={[
                                    {
                                        required: mode === 'create',
                                        message: 'Please select thumbnail'
                                    }
                                ]}
                            >
                                {thumbnailUrl ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: 12,
                                        background: '#1f1f1f',
                                        borderRadius: 8,
                                        border: '1px solid #303030'
                                    }}>
                                        <Image
                                            src={thumbnailUrl}
                                            alt="Thumbnail"
                                            width={60}
                                            height={60}
                                            style={{
                                                objectFit: 'cover',
                                                borderRadius: 6
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <Space size="small">
                                                <Button
                                                    size="small"
                                                    icon={<PictureOutlined />}
                                                    onClick={() => setThumbnailPickerOpen(true)}
                                                >
                                                    Change
                                                </Button>
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={handleRemoveThumbnail}
                                                />
                                            </Space>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        type="dashed"
                                        icon={<PictureOutlined />}
                                        onClick={() => setThumbnailPickerOpen(true)}
                                        style={{ width: '100%', height: 60 }}
                                    >
                                        Select Thumbnail
                                    </Button>
                                )}
                            </Form.Item>
                        </Col>

                        {/* Venue Images */}
                        <Col xs={24} md={16}>
                            <Form.Item
                                label="Venue Images (Maximum 5)"
                                name="venue_images"
                            >
                                <div style={{
                                    padding: 12,
                                    background: '#1f1f1f',
                                    borderRadius: 8,
                                    border: '1px solid #303030',
                                    minHeight: 60,
                                }}>
                                    {venueImageUrls.length > 0 ? (
                                        <Space wrap size={8}>
                                            {venueImageUrls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'relative',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    <Image
                                                        src={url}
                                                        alt={`Venue image ${index + 1}`}
                                                        width={60}
                                                        height={60}
                                                        style={{
                                                            objectFit: 'cover',
                                                            borderRadius: 6
                                                        }}
                                                    />
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        size="small"
                                                        icon={<CloseOutlined />}
                                                        onClick={() => handleRemoveVenueImage(url)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: -8,
                                                            right: -8,
                                                            width: 20,
                                                            height: 20,
                                                            minWidth: 20,
                                                            padding: 0,
                                                            borderRadius: '50%',
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            {venueImageUrls.length < 5 && (
                                                <Button
                                                    type="dashed"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => setVenueImagesPickerOpen(true)}
                                                    style={{ width: 60, height: 60 }}
                                                />
                                            )}
                                        </Space>
                                    ) : (
                                        <Button
                                            type="dashed"
                                            icon={<PictureOutlined />}
                                            onClick={() => setVenueImagesPickerOpen(true)}
                                            style={{ width: '100%', height: 40 }}
                                        >
                                            Select Venue Images
                                        </Button>
                                    )}
                                </div>
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item
                                label="Embedded Code"
                                name="aembeded_code"
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Enter embedded code (e.g., Google Maps iframe)"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
                <style>{`
                    .compact-venue-form .ant-form-item-label > label {
                        font-size: 12px !important;
                    }
                    .compact-venue-form .ant-input,
                    .compact-venue-form .ant-select-selector,
                    .compact-venue-form .ant-input-textarea textarea,
                    .compact-venue-form .ant-btn {
                        font-size: 12px !important;
                    }
                    .compact-venue-form .ant-select-selection-item {
                        font-size: 12px !important;
                    }
                    .compact-venue-form .ant-form-item {
                        margin-bottom: 12px;
                    }
                `}</style>
            </Modal>

            {/* Thumbnail Picker Modal */}
            <MediaGalleryPickerModal
                open={thumbnailPickerOpen}
                onCancel={() => setThumbnailPickerOpen(false)}
                onSelect={handleThumbnailSelect}
                multiple={false}
                title="Select Thumbnail Image"
                value={thumbnailUrl}
            />

            {/* Venue Images Picker Modal */}
            <MediaGalleryPickerModal
                open={venueImagesPickerOpen}
                onCancel={() => setVenueImagesPickerOpen(false)}
                onSelect={handleVenueImagesSelect}
                multiple={true}
                maxCount={5}
                title="Select Venue Images (Max 5)"
                value={venueImageUrls}
            />
        </>
    );
};

export default VenueModal;
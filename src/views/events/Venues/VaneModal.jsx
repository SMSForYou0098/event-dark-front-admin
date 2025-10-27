// components/VenueModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, message, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import apiClient from 'auth/FetchInterceptor';
import PermissionChecker from 'layouts/PermissionChecker';
import { OrganisationList } from 'utils/CommonInputs';

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
    const [thumbnailFileList, setThumbnailFileList] = useState([]);
    const [venueImagesFileList, setVenueImagesFileList] = useState([]);

    // Initialize form with venue data in edit mode
    useEffect(() => {
        if (open && mode === 'edit' && venueData) {
            // Set form values
            form.setFieldsValue({
                name: venueData.name,
                org_id: userRole==='Organizer' ? UserData?.id : venueData.org_id,
                address: venueData.address,
                city: venueData.city,
                state: venueData.state,
                type: venueData.type,
                aembeded_code: venueData.aembeded_code || '',
                map_url: venueData.map_url || '',
            });

            // Load cities for the selected state
            if (venueData.state) {
                const stateCities = getCitiesByState(venueData.state);
                setCities(stateCities);
            }

            // Set existing thumbnail
            if (venueData.thumbnail) {
                setThumbnailFileList([{
                    uid: '-1',
                    name: 'thumbnail.jpg',
                    status: 'done',
                    url: venueData.thumbnail,
                }]);
            }
            const vnimages = venueData?.venue_images?.split(',')
            // Set existing venue images
            if (vnimages && Array.isArray(vnimages)) {
                setVenueImagesFileList(vnimages?.map((url, index) => ({
                    uid: `-${index + 2}`,
                    name: `image-${index + 1}.jpg`,
                    status: 'done',
                    url: url,
                })));
            }
        }
    }, [open, mode, venueData, form, getCitiesByState]);

    const handleStateChange = (stateName) => {
        form.setFieldValue('city', null);
        const stateCities = getCitiesByState(stateName);
        setCities(stateCities);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();

            // Append text fields
            formData.append('name', values.name);
            formData.append('org_id', values.org_id);
            formData.append('address', values.address);
            formData.append('city', values.city);
            formData.append('state', values.state);
            formData.append('type', values.type);
            formData.append('aembeded_code', values.aembeded_code || '');
            formData.append('map_url', values.map_url || '');

            // Append thumbnail (only if new file uploaded)
            const newThumbnail = thumbnailFileList.find(file => file.originFileObj);
            if (newThumbnail) {
                formData.append('thumbnail', newThumbnail.originFileObj);
            }

            // Append venue images (only new files)
            const newVenueImages = venueImagesFileList.filter(file => file.originFileObj);
            newVenueImages.forEach((file) => {
                formData.append('venue_images', file.originFileObj);
            });

            // Keep existing images in edit mode
            if (mode === 'edit') {
                const existingImages = venueImagesFileList
                    .filter(file => !file.originFileObj)
                    .map(file => file.url);
                formData.append('existing_images', JSON.stringify(existingImages));
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
        setThumbnailFileList([]);
        setVenueImagesFileList([]);
        setCities([]);
        onCancel();
    };
    const thumbnailUploadProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
                return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Image must be smaller than 5MB!');
                return Upload.LIST_IGNORE;
            }
            return false;
        },
        onChange: ({ fileList }) => setThumbnailFileList(fileList.slice(-1)),
        onRemove: () => setThumbnailFileList([]),
        fileList: thumbnailFileList,
        maxCount: 1,
        listType: 'picture-card',
    };

    // Venue images upload props
    const venueImagesUploadProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
                return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Image must be smaller than 5MB!');
                return Upload.LIST_IGNORE;
            }
            // Check if limit reached
            if (venueImagesFileList.length >= 5) {
                message.warning('Maximum 5 images allowed');
                return Upload.LIST_IGNORE;
            }
            return false;
        },
        onChange: ({ fileList }) => setVenueImagesFileList(fileList.slice(0, 5)), // Ensure max 5
        onRemove: (file) => {
            setVenueImagesFileList(prev => prev.filter(f => f.uid !== file.uid));
        },
        fileList: venueImagesFileList,
        multiple: true,
        listType: 'picture-card',
        maxCount: 5, // Built-in max count
    };
    return (
        <Modal
            title={mode === 'edit' ? 'Edit Venue' : 'Create New Venue'}
            open={open}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={900}
            style={{ top: 0 }}
            okText={mode === 'edit' ? 'Update' : 'Create'}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
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
                    <PermissionChecker role="Admin">
                        <Col xs={24} md={12}>
                            <OrganisationList />
                        </Col>
                    </PermissionChecker>

                    <Col xs={24} md={8}>
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

                    <Col xs={24} md={8}>
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

                    <Col xs={24} md={8}>
                        <Form.Item
                            label="City"
                            name="city"
                            rules={[{ required: true, message: 'Please select city' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select city"
                                options={cities}
                                // disabled={!cities.length}
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Address"
                            name="address"
                            rules={[{ required: true, message: 'Please enter address' }]}
                        >
                            <Input.TextArea placeholder="Enter full address" />
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
                    <Col xs={12} md={4}>
                        <Form.Item
                            label="Thumbnail Image"
                            name="thumbnail"
                            rules={[
                                {
                                    required: mode === 'create',
                                    message: 'Please upload thumbnail'
                                }
                            ]}
                        >
                            <Upload {...thumbnailUploadProps}>
                                {thumbnailFileList?.length < 1 && (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={20}>
                        <Form.Item
                            label="Venue Images (Maximum 5)"
                            name="venue_images"
                        >
                            <Upload {...venueImagesUploadProps}>
                                {venueImagesFileList.length < 5 && ( // Hide uploader when 5 images uploaded
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                )}
                            </Upload>
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
        </Modal>
    );
};

export default VenueModal;
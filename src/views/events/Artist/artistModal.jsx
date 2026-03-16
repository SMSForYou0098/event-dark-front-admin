// components/ArtistCrewModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Radio, Row, Col, message, Space, Button, Image } from 'antd';
import { UserOutlined, TeamOutlined, StarOutlined, PictureOutlined, DeleteOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import apiClient from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';
import Utils from 'utils';

const { TextArea } = Input;

const PREDEFINED_CATEGORIES = [
    'Singer',
    'Dancer',
    'Musician',
    'Actor',
    'Comedian',
    'DJ',
    'Band',
    'Stage Manager',
    'Sound Engineer',
    'Lighting Technician',
    'Photographer',
    'Videographer',
    'Security',
    'Backstage Crew',
    'Technical Support'
];

const ArtistCrewModal = ({
    open,
    onCancel,
    onSuccess,
    mode = 'create',
    initialValues = null,
    eventOptions = []
}) => {
    const { UserData } = useMyContext();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('Artist'); // 'Artist' or 'Crew'
    const [selectedCategory, setSelectedCategory] = useState([]);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

    // Initialize form with data in edit mode
    useEffect(() => {
        if (open && mode === 'edit' && initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
                org_id: initialValues?.user_id,
                description: initialValues.description,
                category: [initialValues.category],
                event_id: initialValues.event_id,
                number: initialValues.number,
                photo: initialValues?.photo,
            });
            setSelectedCategory([initialValues.category]);
            setType(initialValues.type || 'Artist');
            setSelectedPhotoUrl(initialValues.photo || null);
        } else if (open && mode === 'create') {
            form.resetFields();
            setType('Artist');
            setSelectedCategory([]);
            setSelectedPhotoUrl(null);
        }
    }, [open, mode, initialValues, form]);

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);
        // Reset fields when switching types
        if (newType === 'Artist') {
            form.setFieldValue('number', undefined);
            form.setFieldValue('email', undefined);
        } else if (newType === 'Influencer') {
            form.setFieldValue('description', undefined);
            form.setFieldValue('category', undefined);
            setSelectedCategory([]);
        }
    };

    const handlePhotoSelect = (url) => {
        setSelectedPhotoUrl(url);
        form.setFieldValue('photo', url);
    };

    const handleRemovePhoto = () => {
        setSelectedPhotoUrl(null);
        form.setFieldValue('photo', null);
    };

    const handleSubmit = async (values) => {
        // Validate photo selection (required for Artist and Crew, optional for Influencer)
        if ((type === 'Artist' || type === 'Crew') && !selectedPhotoUrl) {
            message.error('Please select a photo');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('user_id', UserData?.id);
            formData.append('name', values.name);
            formData.append('type', type);

            // Add type-specific fields
            if (type === 'Influencer') {
                // Influencer: email, phone number, photo (all optional)
                if (values.email) formData.append('email', values.email);
                if (values.number) formData.append('number', values.number);
                if (selectedPhotoUrl) formData.append('photo', selectedPhotoUrl);
            } else {
                // Artist/Crew: description, category, photo (required)
                formData.append('description', values.description || '');
                formData.append('category', values.category);
                if (selectedPhotoUrl) formData.append('photo', selectedPhotoUrl);

                // Add contact number only for Crew
                if (type === 'Crew' && values.number) {
                    formData.append('number', values.number);
                }
            }

            // API call
            const endpoint = mode === 'edit'
                ? `/artist-update/${initialValues.id}`
                : '/artist-store';

            const response = await apiClient.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status || response.data?.status) {
                message.success(`${type} ${mode === 'edit' ? 'updated' : 'created'} successfully`);
                handleCancel();
                onSuccess?.();
            }
        } catch (error) {
            console.error('Error:', error);
            message.error(Utils.getErrorMessage(error, `Failed to ${mode === 'edit' ? 'update' : 'create'} ${type.toLowerCase()}`));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setType('Artist');
        setSelectedCategory([]);
        setSelectedPhotoUrl(null);
        onCancel();
    };

    return (
        <>
            <Modal
                title={mode === 'edit' ? `Edit ${type}` : `Create New ${type}`}
                style={{ top: 20 }}
                open={open}
                onCancel={handleCancel}
                onOk={() => form.submit()}
                confirmLoading={loading}
                width={700}
                okText={mode === 'edit' ? 'Update' : 'Create'}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <div className='d-flex justify-content-center w-100 py-3'>
                        <Radio.Group
                            value={type}
                            onChange={handleTypeChange}
                            buttonStyle="solid"
                            size="middle"
                        >
                            <Radio.Button value="Artist">
                                <UserOutlined style={{ marginRight: 6 }} />
                                Artist
                            </Radio.Button>
                            <Radio.Button value="Crew">
                                <TeamOutlined style={{ marginRight: 6 }} />
                                Crew
                            </Radio.Button>
                            <Radio.Button value="Influencer">
                                <StarOutlined style={{ marginRight: 6 }} />
                                Influencer
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                    <Row gutter={12}>
                        {/* Common Name field for all types */}
                        <Col xs={24} md={type === 'Influencer' ? 8 : (type === 'Crew' ? 8 : 12)}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder={`Enter ${type.toLowerCase()} name`}
                                />
                            </Form.Item>
                        </Col>

                        {/* Influencer specific fields */}
                        {type === 'Influencer' ? (
                            <>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[
                                            {
                                                type: 'email',
                                                message: 'Please enter a valid email'
                                            }
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined />}
                                            placeholder="Enter email address"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Phone Number"
                                        name="number"
                                        rules={[
                                            {
                                                pattern: /^\d{10,12}$/,
                                                message: 'Phone number must be 10-12 digits'
                                            }
                                        ]}
                                    >
                                        <Input
                                            prefix={<PhoneOutlined />}
                                            placeholder="Enter phone number"
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        ) : (
                            <>
                                {/* Artist/Crew fields */}
                                <Col xs={24} md={type === 'Crew' ? 8 : 12}>
                                    <Form.Item
                                        label="Category"
                                        name="category"
                                        rules={[{ required: true, message: 'Please select category' }]}
                                    >
                                        <Select
                                            showSearch
                                            value={selectedCategory}
                                            placeholder="Select category"
                                            options={PREDEFINED_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                                            mode="tags"
                                            maxTagCount={1}
                                            maxCount={1}
                                            onChange={(value) => {
                                                const newValue = value.length > 0 ? [value[value.length - 1]] : [];
                                                setSelectedCategory(newValue);
                                                form.setFieldValue('category', newValue);
                                            }}
                                            allowClear
                                            onClear={() => {
                                                setSelectedCategory([]);
                                                form.setFieldValue('category', []);
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                {/* Show contact number only for Crew */}
                                {type === 'Crew' && (
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Contact Number"
                                            name="number"
                                            rules={[
                                                {
                                                    pattern: /^\d{10,12}$/,
                                                    message: 'Contact number must be 10-12 digits'
                                                }
                                            ]}
                                        >
                                            <Input
                                                prefix={<PhoneOutlined />}
                                                placeholder="Enter contact number"
                                            />
                                        </Form.Item>
                                    </Col>
                                )}

                                <Col xs={24}>
                                    <Form.Item
                                        label="Description"
                                        name="description"
                                    >
                                        <TextArea
                                            rows={2}
                                            placeholder={`Enter ${type.toLowerCase()} description, bio, or responsibilities`}
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col xs={24}>
                            <Form.Item
                                label={type === 'Influencer' ? 'Image' : 'Photo'}
                                name="photo"
                                rules={[
                                    {
                                        required: type !== 'Influencer',
                                        message: 'Please select a photo'
                                    }
                                ]}
                            >
                                {selectedPhotoUrl ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        padding: 12,
                                        background: '#1f1f1f',
                                        borderRadius: 8,
                                        border: '1px solid #303030'
                                    }}>
                                        <Image
                                            src={selectedPhotoUrl}
                                            alt="Selected photo"
                                            width={80}
                                            height={80}
                                            style={{
                                                objectFit: 'cover',
                                                borderRadius: 8
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: 12,
                                                color: 'var(--primary-color)',
                                                marginBottom: 4
                                            }}>
                                                Photo selected
                                            </div>
                                            <Space>
                                                <Button
                                                    size="small"
                                                    icon={<PictureOutlined />}
                                                    onClick={() => setMediaPickerOpen(true)}
                                                >
                                                    Change
                                                </Button>
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={handleRemovePhoto}
                                                >
                                                    Remove
                                                </Button>
                                            </Space>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        type="dashed"
                                        icon={<PictureOutlined />}
                                        onClick={() => setMediaPickerOpen(true)}
                                        style={{ width: '100%', height: 80 }}
                                    >
                                        Select Photo from Gallery
                                    </Button>
                                )}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Media Gallery Picker Modal */}
            <MediaGalleryPickerModal
                open={mediaPickerOpen}
                onCancel={() => setMediaPickerOpen(false)}
                onSelect={handlePhotoSelect}
                multiple={false}
                title="Select Photo"
                value={selectedPhotoUrl}
            />
        </>
    );
};

export default ArtistCrewModal;
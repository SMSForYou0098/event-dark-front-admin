// components/ArtistCrewModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col, message, Space, Button, Image } from 'antd';
import { UserOutlined, TeamOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import apiClient from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

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
                contact_number: initialValues.contact_number,
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

    const handleTypeChange = (checked) => {
        setType(checked ? 'Crew' : 'Artist');
        if (!checked) {
            form.setFieldValue('contact_number', undefined);
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
        // Validate photo selection
        if (!selectedPhotoUrl) {
            message.error('Please select a photo');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('user_id', UserData?.id);
            formData.append('name', values.name);
            formData.append('description', values.description || '');
            formData.append('category', values.category);
            formData.append('type', type);

            // Add contact number only if Crew type
            if (type === 'Crew' && values.contact_number) {
                formData.append('contact_number', values.contact_number);
            }

            // Append photo URL from gallery
            if (selectedPhotoUrl) {
                formData.append('photo', selectedPhotoUrl);
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

            let errorMessage = `Failed to ${mode === 'edit' ? 'update' : 'create'} ${type.toLowerCase()}`;

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
            } else {
                errorMessage = error.message || errorMessage;
            }

            message.error(errorMessage);
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
                    <Space className='justify-content-center w-100 py-2'>
                        <UserOutlined style={{ color: !type || type === 'Artist' ? 'var(--primary-color)' : 'var(--text-white)' }} />
                        <Switch
                            checked={type === 'Crew'}
                            onChange={handleTypeChange}
                            checkedChildren="Crew"
                            style={{ width: '7rem' }}
                            unCheckedChildren="Artist"
                        />
                        <TeamOutlined style={{ color: type === 'Crew' ? 'var(--primary-color)' : 'var(--text-white)' }} />
                    </Space>
                    <Row gutter={12}>
                        <Col xs={24} md={type === 'Crew' ? 8 : 12}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input placeholder={`Enter ${type.toLowerCase()} name`} />
                            </Form.Item>
                        </Col>
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
                                    name="contact_number"
                                    rules={[
                                        {
                                            pattern: /^\d{10,12}$/,
                                            message: 'Contact number must be 10-12 digits'
                                        }
                                    ]}
                                >
                                    <Input placeholder="Enter contact number" />
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

                        <Col xs={24}>
                            <Form.Item
                                label="Photo"
                                name="photo"
                                rules={[
                                    {
                                        required: true,
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
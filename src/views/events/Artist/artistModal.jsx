// components/ArtistCrewModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Switch, Row, Col, message, Space } from 'antd';
import { PlusOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import apiClient from 'auth/FetchInterceptor';
import { useMyContext } from 'Context/MyContextProvider';
import PermissionChecker from 'layouts/PermissionChecker';
import { OrganisationList } from 'utils/CommonInputs';

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
    const [photoFileList, setPhotoFileList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState([]);


    // Initialize form with data in edit mode
    useEffect(() => {
        if (open && mode === 'edit' && initialValues) {
            console.log(initialValues.category)
            form.setFieldsValue({
                name: initialValues.name,
                org_id: initialValues?.user_id,
                description: initialValues.description,
                category: [initialValues.category], // Wrap in array for tags mode
                event_id: initialValues.event_id,
                contact_number: initialValues.contact_number,
                photo: initialValues?.photo,
            });
            setSelectedCategory([initialValues.category]); // Already correct
            setType(initialValues.type || 'Artist');

            // Set existing photo
            if (initialValues.photo) {
                setPhotoFileList([{
                    uid: '-1',
                    name: 'photo.jpg',
                    status: 'done',
                    url: initialValues.photo,
                }]);
            }
        } else if (open && mode === 'create') {
            // Reset for create mode
            form.resetFields();
            setType('Artist');
            setPhotoFileList([]);
            setSelectedCategory([]);
        }
    }, [open, mode, initialValues, form]);

    const handleTypeChange = (checked) => {
        setType(checked ? 'Crew' : 'Artist');
        // Clear contact number when switching to Artist
        if (!checked) {
            form.setFieldValue('contact_number', undefined);
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('user_id', values?.org_id || UserData?.id)
            formData.append('name', values.name);
            formData.append('description', values.description || '');
            formData.append('category', values.category);
            formData.append('type', type);

            // Add contact number only if Crew type
            if (type === 'Crew' && values.contact_number) {
                formData.append('contact_number', values.contact_number);
            }

            // Append photo (only if new file uploaded)
            const newPhoto = photoFileList.find(file => file.originFileObj);
            if (newPhoto) {
                formData.append('photo', newPhoto.originFileObj);
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

            // Better error handling
            let errorMessage = `Failed to ${mode === 'edit' ? 'update' : 'create'} ${type.toLowerCase()}`;

            if (error.response) {
                // Server responded with error
                console.log('Error response:', error.response.data);
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            } else if (error.request) {
                // Request made but no response
                console.log('No response received:', error.request);
                errorMessage = 'No response from server. Please check your connection.';
            } else {
                // Error in request setup
                console.log('Error message:', error.message);
                errorMessage = error.message || errorMessage;
            }

            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setPhotoFileList([]);
        setType('Artist');
        setSelectedCategory([]);
        onCancel();
    };

    // Photo upload props
    const photoUploadProps = {
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
        onChange: ({ fileList }) => setPhotoFileList(fileList.slice(-1)),
        onRemove: () => setPhotoFileList([]),
        fileList: photoFileList,
        maxCount: 1,
        listType: 'picture-card',
    };

    return (
        <Modal
            title={mode === 'edit' ? `Edit ${type}` : `Create New ${type}`}
            style={{ top: 0 }}
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
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: 'Please enter name' }]}
                        >
                            <Input placeholder={`Enter ${type.toLowerCase()} name`} />
                        </Form.Item>
                    </Col>
                    <PermissionChecker role="Admin">
                        <Col xs={24} md={12}>
                          <OrganisationList />
                        </Col>
                    </PermissionChecker>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Category"
                            name="category"
                            rules={[{ required: true, message: 'Please select or enter category' }]}
                        >
                            <Select
                                showSearch
                                value={selectedCategory}
                                placeholder="Select or type custom category"
                                options={PREDEFINED_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                                mode="tags"
                                maxTagCount={1}
                                maxCount={1}
                                onChange={(value) => {
                                    // Keep only the last selected value
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
                        <Col xs={24} md={12}>
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
                                    required: true, // Always required
                                    message: 'Please upload a photo'
                                }
                            ]}
                        >
                            <Upload {...photoUploadProps}>
                                {photoFileList.length < 1 && (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload Photo</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default ArtistCrewModal;
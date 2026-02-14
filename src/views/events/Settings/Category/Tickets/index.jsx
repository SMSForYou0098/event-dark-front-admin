import React, { useState } from 'react';
import {
    Card,
    Tabs,
    Button,
    Row,
    Col,
    message,
    Typography,
    Space,
    Spin,
    Empty,
    Image,
    Popconfirm,
    Radio,
} from 'antd';
import {
    SaveOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { useEventCategories } from 'views/events/event/hooks/useEventOptions';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const { Title, Text } = Typography;

const CategoryTickets = () => {
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [selectedMediaUrl, setSelectedMediaUrl] = useState(null);

    // Fetch categories using the hook
    const {
        data: categories = [],
        isLoading: catLoading,
    } = useEventCategories();

    // Fetch images for the active category
    const {
        data: categoryImages = [],
        isLoading: imagesLoading,
    } = useQuery({
        queryKey: ['fallback-tickets', activeCategory],
        queryFn: async () => {
            if (!activeCategory) return [];
            const res = await api.get(`fallback-tickets/category/${activeCategory}`);
            if (res?.data) {
                return Array.isArray(res.data) ? res.data : [res.data];
            }
            return [];
        },
        enabled: !!activeCategory,
        staleTime: 2 * 60 * 1000,
    });

    // Helper to update cache
    const updateImagesCache = (updater) => {
        queryClient.setQueryData(['fallback-tickets', activeCategory], updater);
    };

    // Handle tab change
    const handleTabChange = (categoryId) => {
        setActiveCategory(categoryId);
        setFileList([]);
        setSelectedMediaUrl(null);
    };

    // Handle delete
    const handleDelete = async (id) => {
        const previousImages = categoryImages;
        updateImagesCache((old) => old?.filter((img) => img.id !== id) || []);

        try {
            const res = await api.delete(`fallback-tickets/${id}`);
            if (res?.status) {
                message.success('Ticket deleted successfully!');
            } else {
                updateImagesCache(() => previousImages);
                message.error(res?.message || 'Failed to delete');
            }
        } catch (err) {
            updateImagesCache(() => previousImages);
            console.error('Delete failed:', err);
            message.error('Failed to delete ticket');
        }
    };

    // Handle mark as default
    const handleMarkDefault = async (id) => {
        const previousImages = categoryImages;
        updateImagesCache((old) =>
            old?.map((img) => ({
                ...img,
                default: img.id === id,
            })) || []
        );

        try {
            const res = await api.post(`fallback-tickets/${id}/set-default`);
            if (res?.status) {
                message.success('Default ticket updated successfully!');
            } else {
                updateImagesCache(() => previousImages);
                message.error(res?.message || 'Failed to update default');
            }
        } catch (err) {
            updateImagesCache(() => previousImages);
            console.error('Mark default failed:', err);
            message.error('Failed to set as default');
        }
    };

    // Handle media selection from gallery picker
    const handleMediaSelect = (url) => {
        setSelectedMediaUrl(url);
        setMediaPickerOpen(false);
    };

    // Handle upload submit
    const handleUpload = async () => {
        if (!activeCategory) {
            message.warning('Please select a category');
            return;
        }

        if (!selectedMediaUrl) {
            message.warning('Please select an image');
            return;
        }

        const formData = new FormData();
        formData.append('category_id', activeCategory);
        formData.append('image', selectedMediaUrl);

        try {
            const res = await api.post('fallback-tickets', formData);
            if (res?.status) {
                message.success('Ticket saved successfully!');
                setSelectedMediaUrl(null);
                if (res?.data) {
                    updateImagesCache((old) => [...(old || []), res.data]);
                }
            } else {
                message.error(res?.message || 'Save failed');
            }
        } catch (err) {
            console.error('Save failed:', err);
            message.error('Failed to save ticket');
        }
    };

    // Generate tab items from categories
    const tabItems = categories.map((cat) => ({
        key: String(cat.value),
        label: cat.label,
        children: (
            <div className="py-3">
                <Row gutter={[24, 24]}>
                    {/* Upload Section */}
                    <Col xs={24} lg={6}>
                        <Card
                            size="small"
                            className={selectedMediaUrl ? 'border-success border-2' : 'border-secondary border-2'}
                            style={{
                                borderStyle: selectedMediaUrl ? 'solid' : 'dashed',
                                background: selectedMediaUrl ? '#000' : '#000',
                            }}
                            styles={{
                                body: {
                                    padding: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: 280,
                                }
                            }}
                        >
                            {selectedMediaUrl ? (
                                <div className="text-center w-100">
                                    <Image
                                        src={selectedMediaUrl}
                                        alt="Selected ticket"
                                        preview={{ mask: <div>Preview</div> }}
                                        className="rounded-2 mw-100"
                                        style={{ maxHeight: 220, objectFit: 'contain' }}
                                    />
                                    <Space className="mt-3">
                                        <Button
                                            className="bg-warning"
                                            shape="circle"
                                            icon={<PictureOutlined />}
                                            onClick={() => setMediaPickerOpen(true)}
                                            title="Change Image"
                                        />
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<DeleteOutlined />}
                                            onClick={() => setSelectedMediaUrl(null)}
                                            title="Remove"
                                        />
                                    </Space>
                                </div>
                            ) : (
                                <div className="text-center bg-black w-100">
                                    {/* <PictureOutlined className="fs-2 text-primary mb-3 d-block" /> */}
                                    <Button
                                        type="primary"
                                        icon={<PictureOutlined />}
                                        onClick={() => setMediaPickerOpen(true)}
                                        size="large"
                                    >
                                        Select from Gallery
                                    </Button>
                                    <Text type="secondary" className="d-block mt-3 small">
                                        Recommended: 300x750px
                                    </Text>
                                </div>
                            )}
                        </Card>

                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleUpload}
                            disabled={!selectedMediaUrl}
                            block
                            size="large"
                            className="mt-3"
                        >
                            Save Ticket
                        </Button>
                    </Col>

                    {/* Images Display */}
                    <Col xs={24} lg={18}>
                        <Spin spinning={imagesLoading}>
                            {categoryImages.length > 0 ? (
                                <Radio.Group
                                    value={categoryImages.find(img => img.default)?.id}
                                    className="w-100"
                                >
                                    <Row gutter={[16, 16]}>
                                        {categoryImages.map((img, index) => (
                                            <Col
                                                key={img.id || index}
                                                xs={12}   // mobile → 2 columns
                                                sm={12}
                                                md={8}
                                                lg={6}    // large → 4 columns
                                                xl={6}
                                                style={{ flex: '0 0 180px', maxWidth: 180 }}
                                            >
                                                <Card
                                                    size="small"
                                                    hoverable
                                                    className={img.default ? 'border-success border-2 h-100' : 'h-100'}
                                                    styles={{ body: { padding: 0 } }}
                                                >
                                                    <div className="position-relative">
                                                        {img.default && (
                                                            <CheckCircleOutlined
                                                                className="position-absolute bg-white rounded-circle p-1"
                                                                style={{
                                                                    top: 8,
                                                                    right: 8,
                                                                    color: '#52c41a',
                                                                    fontSize: 24,
                                                                    zIndex: 10,
                                                                }}
                                                            />
                                                        )}
                                                        <Image
                                                            src={img.url || img.image || img}
                                                            alt={`Ticket ${index + 1}`}
                                                            preview={{ mask: <div>Preview</div> }}
                                                            className="w-100 d-block"
                                                            style={{ objectFit: 'contain' }}
                                                            fallback="https://placehold.co/300x750?text=No+Preview"
                                                        />
                                                    </div>
                                                    <div className="p-0 d-flex justify-content-between align-items-center border-top">
                                                        <Radio
                                                            value={img.id}
                                                            onChange={(e) => handleMarkDefault(e.target.value)}
                                                        >
                                                            {img.default ? <Text style={{ fontSize: '12px' }} strong type="success">Default</Text> : <Text style={{ fontSize: '12px' }} strong type="success">Set Default</Text>}
                                                        </Radio>
                                                        <Popconfirm
                                                            title="Delete ticket?"
                                                            description="This action cannot be undone."
                                                            onConfirm={() => handleDelete(img.id)}
                                                            okText="Delete"
                                                            cancelText="Cancel"
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button
                                                                type="primary"
                                                                danger
                                                                size="small"
                                                                icon={<DeleteOutlined />}
                                                            />
                                                        </Popconfirm>
                                                    </div>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Radio.Group>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="No tickets uploaded yet"
                                    className="py-5"
                                />
                            )}
                        </Spin>
                    </Col>
                </Row>
            </div>
        ),
    }));

    // Set first category as active
    React.useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(String(categories[0].value));
        }
    }, [categories, activeCategory]);

    return (
        <>
            <Card
                title={
                    <Space>
                        <CloudUploadOutlined />
                        <span>Category Tickets</span>
                    </Space>
                }
            >
                <Spin spinning={catLoading}>
                    {categories.length > 0 ? (
                        <Tabs
                            activeKey={activeCategory}
                            onChange={handleTabChange}
                            items={tabItems}
                        />
                    ) : (
                        <Empty description="No categories found" />
                    )}
                </Spin>
            </Card>

            {/* Media Gallery Picker Modal */}
            <MediaGalleryPickerModal
                open={mediaPickerOpen}
                onCancel={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={false}
                title="Select Ticket Image"
                value={selectedMediaUrl}
                dimensionValidation={{ width: 300, height: 750, strict: true }}
            />
        </>
    );
};

export default CategoryTickets;

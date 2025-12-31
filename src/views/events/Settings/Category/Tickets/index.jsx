import React, { useState } from 'react';
import {
    Card,
    Tabs,
    Upload,
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
    UploadOutlined,
    SaveOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { useEventCategories } from 'views/events/event/hooks/useEventOptions';

const { Title, Text } = Typography;

const CategoryTickets = () => {
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = useState(null);
    const [fileList, setFileList] = useState([]);

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
            // API returns single object, wrap in array for display
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
    };

    // Handle file change
    const handleFileChange = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1));
    };

    // Validate image dimensions
    const validateImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                if (img.width !== 300 || img.height !== 600) {
                    reject(`Image must be exactly 300px × 600px. Your image is ${img.width}px × ${img.height}px`);
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => reject('Failed to load image');
            img.src = URL.createObjectURL(file);
        });
    };

    // Upload props
    const uploadProps = {
        beforeUpload: async (file) => {
            const isValidType =
                file.type === 'image/jpeg' ||
                file.type === 'image/png' ||
                file.type === 'image/webp';
            if (!isValidType) {
                message.error('You can only upload JPG, PNG, or WebP files!');
                return Upload.LIST_IGNORE;
            }
            const isLt1M = file.size / 1024 / 1024 < 1;
            if (!isLt1M) {
                message.error('File must be smaller than 1MB!');
                return Upload.LIST_IGNORE;
            }
            // Validate dimensions
            try {
                await validateImageDimensions(file);
            } catch (err) {
                message.error(err);
                return Upload.LIST_IGNORE;
            }
            return false;
        },
        onChange: handleFileChange,
        maxCount: 1,
        fileList,
    };

    // Handle delete - optimistic update
    const handleDelete = async (id) => {
        // Optimistically remove from cache
        const previousImages = categoryImages;
        updateImagesCache((old) => old?.filter((img) => img.id !== id) || []);

        try {
            const res = await api.delete(`fallback-tickets/${id}`);
            if (res?.status) {
                message.success('Ticket deleted successfully!');
            } else {
                // Revert on failure
                updateImagesCache(() => previousImages);
                message.error(res?.message || 'Failed to delete');
            }
        } catch (err) {
            // Revert on error
            updateImagesCache(() => previousImages);
            console.error('Delete failed:', err);
            message.error('Failed to delete ticket');
        }
    };

    // Handle mark as default - optimistic update
    const handleMarkDefault = async (id) => {
        // Optimistically update default flag
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
                // Revert on failure
                updateImagesCache(() => previousImages);
                message.error(res?.message || 'Failed to update default');
            }
        } catch (err) {
            // Revert on error
            updateImagesCache(() => previousImages);
            console.error('Mark default failed:', err);
            message.error('Failed to set as default');
        }
    };

    // Handle upload submit - optimistic update
    const handleUpload = async () => {
        if (!activeCategory) {
            message.warning('Please select a category');
            return;
        }
        if (fileList.length === 0) {
            message.warning('Please upload a file');
            return;
        }

        const formData = new FormData();
        formData.append('category_id', activeCategory);

        if (fileList[0]?.originFileObj) {
            formData.append('image', fileList[0].originFileObj);
        }

        try {
            const res = await api.post('fallback-tickets', formData);
            if (res?.status) {
                message.success('File uploaded successfully!');
                setFileList([]);
                // Add new image to cache from response
                if (res?.data) {
                    updateImagesCache((old) => [...(old || []), res.data]);
                }
            } else {
                message.error(res?.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            message.error('Failed to upload file');
        }
    };

    // Generate tab items from categories
    const tabItems = categories.map((cat) => ({
        key: String(cat.value),
        label: cat.label,
        children: (
            <div className='p-3'>
                {/* Upload Section */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} lg={8}>
                        <Upload.Dragger
                            {...uploadProps}
                            listType="picture"
                            accept=".jpg,.jpeg,.png,.webp"
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text">Click or drag file</p>
                            <p className="ant-upload-hint">
                                JPG, PNG, WebP (300×600px, Max: 1MB)
                            </p>
                        </Upload.Dragger>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleUpload}
                            disabled={fileList.length === 0}
                            block
                            style={{ marginTop: 12, marginBottom: 16 }}
                        >
                            Upload
                        </Button>
                    </Col>

                    {/* Images Display */}
                    <Col xs={24} md={12} lg={16}>
                        <Spin spinning={imagesLoading}>
                            {categoryImages.length > 0 ? (
                                <Radio.Group
                                    value={categoryImages.find(img => img.default)?.id}
                                    onChange={(e) => handleMarkDefault(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <Row gutter={[12, 12]}>
                                        {categoryImages.map((img, index) => (
                                            <Col xs={12} sm={8} md={6} key={img.id || index}>
                                                <Card
                                                    size="small"
                                                    hoverable
                                                    cover={
                                                        <div style={{ position: 'relative' }}>
                                                            {img.default && (
                                                                <CheckCircleOutlined
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: 8,
                                                                        right: 8,
                                                                        color: '#52c41a',
                                                                        fontSize: 20,
                                                                        zIndex: 1,
                                                                        background: 'white',
                                                                        borderRadius: '50%',
                                                                    }}
                                                                />
                                                            )}
                                                            <Image
                                                                src={img.url || img.image || img}
                                                                alt={`Ticket ${index + 1}`}
                                                                style={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    objectFit: 'cover',
                                                                }}
                                                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesAK/kB9jIJjEcAAAAJcEhZcwAACxMAAAsTAQCanBgAAAOHSURBVHic7dZBjcMwEIXh2XoviJBiBILAOwg9tBxMx5Pp/kANlHCT8Xw78w8AAAAAAAAAAAAAAAAAAAAAAACAPszvLwB+Gl8vcA1fBkr4MlDCl4ESvgyU8GWghC8DJXwZKOHLQAlfBkr4MlDCl4ESvgyU8GWghC8DJXwZKOHLQAlfBkr4MlDCl4ESvgyU8GWghC8DJXwZKOHLQAlfBkr4MlDCl4ESvgyU8GWghC8DpUEYAQAAAABQ0RYAAP4fLvkTsIQvAyV8GSjhy0AJXwZK+DJQwpeBEr4MlPBloIQvAyV8GSjhy0AJXwZK+DJQ+gsYBvwxvgxU/mLGMuCf4ctA5c+Dj/gP+DJQ+Xvwkv8AXwYqfx58xn/Al4ESvgyU+Bl8xH/Al4ES/gF8w3+ALwMl/AN4w3+ALwMl/AN4w3+ALwMl/AN4w3+A/QAAAP//AwBtfZt4AAACBklEQVR4nOzd0U0DMRCF0Un1lEBFQCXQU4opx2HfLPv6nCN9xNLs7D/OBAAAAAAAAAAAAAAAAAAAAAAAME7z/QXAT+PrBa7hy0AJXwZK+DJQwpeBEr4MlPBloIQvAyV8GSjhy0AJXwZK+DJQwpeBEr4MlPBloIQvAyV8GSjhy0AJXwZK+DJQwpeBEr4MlPBloIQvAyV8GSjhy0AJXwZK+DJQwpeBEr4MlPBloIQvAyV8GSjhy0AJXwZK+DJQwpeBEr4MlPBloIQvAyV8GaiZhxEAAACgoi0AAPw/XPInYAlfBkr4MlDCl4ESvgyU8GWghC8DJXwZKOHLQAlfBkr4MlDCl4ESvgyU8GWg9BcwDPhj/BlQ+YsZy4B/hi8DlT8PPuI/4MtA5e/BS/4DfBmo/HnwGf8BXwZK+DJQ4mfwEf8BXwZK+AfwDf8BvgyU8A/gDf8BvgyU8A/gDf8BvgyU8A/gDf8B9gMAAPj/BwCs8m/g/gMBAAAAAElFTkSuQmCC"
                                                            />
                                                        </div>
                                                    }
                                                    styles={{
                                                        body: { padding: '8px 12px' },
                                                    }}
                                                    style={{
                                                        border: img.default ? '2px solid #52c41a' : undefined,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Radio value={img.id}>
                                                            {img.default ? 'Default' : 'Set Default'}
                                                        </Radio>
                                                        <Popconfirm
                                                            title="Delete this ticket?"
                                                            description="This action cannot be undone."
                                                            onConfirm={() => handleDelete(img.id)}
                                                            okText="Delete"
                                                            cancelText="Cancel"
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button
                                                                type="text"
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
                                />
                            )}
                        </Spin>
                    </Col>
                </Row>
            </div>
        ),
    }));

    // Set first category as active if not set
    React.useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(String(categories[0].value));
        }
    }, [categories, activeCategory]);

    return (
        <Card
            className='p-3'
            title={
                <Space>
                    <CloudUploadOutlined />
                    <span>Category Tickets</span>
                </Space>
            }
            style={{
                height: '100%',
            }}
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
    );
};

export default CategoryTickets;

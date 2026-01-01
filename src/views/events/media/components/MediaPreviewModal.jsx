import React, { useState, useEffect } from 'react';
import { Modal, Image, Typography, Space, Button, Descriptions } from 'antd';
import {
    LeftOutlined,
    RightOutlined,
    DownloadOutlined,
    DeleteOutlined,
    CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const MediaPreviewModal = ({
    open,
    onCancel,
    media = null,
    mediaList = [],
    onDelete,
    onNavigate,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Find current index when media changes
    useEffect(() => {
        if (media && mediaList.length > 0) {
            const index = mediaList.findIndex((m) => m.id === media.id);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [media, mediaList]);

    const currentMedia = mediaList[currentIndex] || media;

    // Get the media URL - use file_path from API
    const mediaUrl = currentMedia?.file_path || currentMedia?.url;

    const isVideo = currentMedia?.file_type === 'video' ||
        currentMedia?.mime_type?.startsWith('video') ||
        ['mp4', 'webm', 'mov', 'avi'].includes(currentMedia?.extension?.toLowerCase());

    const handlePrev = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : mediaList.length - 1;
        setCurrentIndex(newIndex);
        onNavigate?.(mediaList[newIndex]);
    };

    const handleNext = () => {
        const newIndex = currentIndex < mediaList.length - 1 ? currentIndex + 1 : 0;
        setCurrentIndex(newIndex);
        onNavigate?.(mediaList[newIndex]);
    };

    const handleDownload = () => {
        if (mediaUrl) {
            window.open(mediaUrl, '_blank');
        }
    };

    const handleDelete = () => {
        onDelete?.(currentMedia);
    };

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const showNavigation = mediaList.length > 1;

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width="90vw"
            style={{ top: 20, maxWidth: 1200 }}
            closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 18 }} />}
            styles={{
                content: {
                    background: '#0a0a0a',
                    padding: 0,
                },
                header: {
                    background: '#0a0a0a',
                    borderBottom: '1px solid #303030',
                    padding: '12px 16px',
                },
            }}
            title={
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text ellipsis style={{ maxWidth: 400, color: '#fff' }}>
                        {currentMedia?.title || currentMedia?.file_name || currentMedia?.name || 'Preview'}
                    </Text>
                    {/* <Space>
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={handleDownload}
                            style={{ color: '#fff' }}
                        >
                            Download
                        </Button>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </Space> */}
                </Space>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Preview Area */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        maxHeight: '70vh',
                        background: '#000',
                        overflow: 'hidden',
                    }}
                >
                    {/* Left Navigation */}
                    {showNavigation && (
                        <Button
                            type="text"
                            icon={<LeftOutlined style={{ fontSize: 24 }} />}
                            onClick={handlePrev}
                            style={{
                                position: 'absolute',
                                left: 16,
                                zIndex: 10,
                                height: 60,
                                width: 60,
                                background: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                borderRadius: '50%',
                            }}
                        />
                    )}

                    {/* Media Content */}
                    {isVideo ? (
                        <video
                            src={mediaUrl}
                            controls
                            autoPlay
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <Image
                            src={mediaUrl}
                            alt={currentMedia?.title || currentMedia?.file_name}
                            preview={false}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                objectFit: 'contain',
                            }}
                        />
                    )}

                    {/* Right Navigation */}
                    {showNavigation && (
                        <Button
                            type="text"
                            icon={<RightOutlined style={{ fontSize: 24 }} />}
                            onClick={handleNext}
                            style={{
                                position: 'absolute',
                                right: 16,
                                zIndex: 10,
                                height: 60,
                                width: 60,
                                background: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                borderRadius: '50%',
                            }}
                        />
                    )}

                    {/* Counter */}
                    {showNavigation && (
                        <Text
                            style={{
                                position: 'absolute',
                                bottom: 16,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                padding: '4px 12px',
                                borderRadius: 16,
                                color: '#fff',
                                fontSize: 13,
                            }}
                        >
                            {currentIndex + 1} / {mediaList.length}
                        </Text>
                    )}
                </div>

                {/* File Info */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #303030',
                        background: '#141414',
                    }}
                >
                    <Descriptions
                        size="small"
                        column={{ xs: 1, sm: 2, md: 4 }}
                        labelStyle={{ color: '#888' }}
                        contentStyle={{ color: '#fff' }}
                    >
                        <Descriptions.Item label="Type">
                            {currentMedia?.extension?.toUpperCase() || currentMedia?.mime_type || 'Unknown'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Size">
                            {formatSize(currentMedia?.file_size || currentMedia?.size)}
                        </Descriptions.Item>
                        {(currentMedia?.width && currentMedia?.height) && (
                            <Descriptions.Item label="Dimensions">
                                {currentMedia.width} × {currentMedia.height}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Uploaded">
                            {formatDate(currentMedia?.created_at)}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            </div>
        </Modal>
    );
};

export default MediaPreviewModal;

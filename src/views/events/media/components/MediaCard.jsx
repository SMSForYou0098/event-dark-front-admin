import React from 'react';
import { Card, Checkbox, Typography, Dropdown, Image, Tooltip } from 'antd';
import {
    PlayCircleFilled,
    FileImageOutlined,
    VideoCameraOutlined,
    DeleteOutlined,
    LinkOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

const { Text } = Typography;

const MediaCard = ({
    media,
    selected = false,
    onSelect,
    onPreview,
    onDelete,
    selectionMode = false,
    onDragStart, // Called when this media is dragged
    draggable = true,
    selectedMediaIds = [], // Array of all selected media IDs for multi-drag
}) => {
    // Determine if video based on file_type or mime_type
    const isVideo = media.file_type === 'video' ||
        media.mime_type?.startsWith('video') ||
        ['mp4', 'webm', 'mov', 'avi'].includes(media.extension?.toLowerCase());

    // Get the image/video URL - use file_path from API
    const mediaUrl = media.file_path || media.url || media.thumbnail;

    const handleCopyId = (e) => {
        e.domEvent.stopPropagation();
        navigator.clipboard.writeText(String(media.id));
        message.success('Media ID copied!');
    };

    const handleCopyLink = async (e) => {
        e.domEvent.stopPropagation();
        const linkToCopy = media.file_path || mediaUrl;

        if (!linkToCopy) {
            message.error('No link available');
            return;
        }

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(linkToCopy);
                message.success('Link copied!');
            } else {
                // Fallback for older browsers or non-HTTPS
                const textArea = document.createElement('textarea');
                textArea.value = linkToCopy;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                message.success('Link copied!');
            }
        } catch (err) {
            console.error('Copy failed:', err);
            message.error('Failed to copy link');
        }
    };

    const menuItems = [
        {
            key: 'copyLink',
            label: 'Copy Link',
            icon: <LinkOutlined />,
            onClick: handleCopyLink,
        },
        {
            type: 'divider',
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onDelete?.(media);
            },
        },
    ];

    const handleClick = () => {
        if (selectionMode) {
            onSelect?.(media);
        } else {
            onPreview?.(media);
        }
    };

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onSelect?.(media);
    };

    // Drag handler - includes all selected items if this item is selected
    const handleDragStart = (e) => {
        e.stopPropagation();

        // If this item is selected and there are multiple selections, drag all selected
        let idsToMove = [media.id];
        if (selected && selectedMediaIds.length > 1) {
            idsToMove = [...selectedMediaIds];
        }

        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'media',
            ids: idsToMove,
            id: media.id, // Keep single id for backward compatibility
            name: idsToMove.length > 1
                ? `${idsToMove.length} files`
                : (media.title || media.file_name),
            count: idsToMove.length,
        }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(media, idsToMove);
    };

    // Get display name - use title or file_name
    const displayName = media.title || media.file_name || media.name || 'Untitled';

    // Get mime type display
    const mimeDisplay = media.mime_type || `${media.file_type}/${media.extension}`;

    return (
        <Card
            hoverable
            className={`media-card ${selected ? 'selected' : ''}`}
            onClick={handleClick}
            draggable={draggable}
            onDragStart={handleDragStart}
            style={{
                overflow: 'hidden',
                borderRadius: 12,
                border: selected ? '2px solid var(--primary-color)' : '1px solid #303030',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selected ? '0 0 0 4px rgba(82, 196, 65, 0.15)' : '0 4px 12px rgba(0,0,0,0.2)',
                background: '#1f1f1f',
                cursor: draggable ? 'grab' : 'pointer',
                position: 'relative',
                transform: selected ? 'translateY(-2px)' : 'none',
            }}
            styles={{
                body: { padding: 0 },
            }}
        >
            {/* Checkbox overlay */}
            <div
                className="selection-checkbox"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    zIndex: 10,
                    opacity: selected || selectionMode ? 1 : 0,
                    transition: 'opacity 0.2s',
                    padding: 4,
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                }}
            >
                <Checkbox
                    checked={selected}
                    onChange={handleCheckboxChange}
                    style={{ transform: 'scale(1.1)' }}
                />
            </div>

            {/* Thumbnail Container */}
            <div
                style={{
                    position: 'relative',
                    height: 180,
                    width: '100%',
                    background: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                {isVideo ? (
                    <>
                        {media.thumbnail ? (
                            <Image
                                src={media.thumbnail}
                                alt={displayName}
                                preview={false}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: 0.8,
                                }}
                                draggable={false}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#1f1f1f'
                            }}>
                                <VideoCameraOutlined style={{ fontSize: 48, color: '#3f3f3f' }} />
                            </div>
                        )}
                        <PlayCircleFilled
                            style={{
                                position: 'absolute',
                                fontSize: 48,
                                color: 'rgba(255,255,255,0.85)',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                            }}
                        />
                    </>
                ) : (
                    <Image
                        src={mediaUrl}
                        alt={displayName}
                        preview={false}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                        placeholder={
                            <div style={{
                                width: '100%',
                                height: 180,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#1f1f1f'
                            }}>
                                <FileImageOutlined style={{ fontSize: 32, color: '#333' }} />
                            </div>
                        }
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                    />
                )}

                {/* Gradient overlay for better text contrast/visual depth */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* File Info */}
            <div style={{
                padding: '12px 16px',
                background: '#1f1f1f',
                borderTop: '1px solid #303030'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <Tooltip title={displayName}>
                            <Text
                                ellipsis
                                style={{
                                    display: 'block',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.85)',
                                    marginBottom: 4,
                                }}
                            >
                                {displayName}
                            </Text>
                        </Tooltip>
                        <Text
                            style={{
                                fontSize: 12,
                                background: 'rgba(82, 196, 65, 0.1)',
                                padding: '2px 6px',
                                borderRadius: 4,
                            }}
                        >
                            {mimeDisplay}
                        </Text>
                    </div>

                    {/* Actions dropdown */}
                    <Dropdown
                        menu={{
                            items: menuItems,
                            style: { minWidth: 120 }
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                        arrow
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="action-button"
                            style={{
                                padding: '4px',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.45)',
                                borderRadius: 4,
                                transition: 'all 0.2s',
                                marginTop: 2,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                        >
                            <MoreOutlined style={{ fontSize: 20 }} />
                        </div>
                    </Dropdown>
                </div>
            </div>

            <style jsx global>{`
                .media-card:hover .selection-checkbox {
                    opacity: 1 !important;
                }
            `}</style>
        </Card>
    );
};

export default MediaCard;

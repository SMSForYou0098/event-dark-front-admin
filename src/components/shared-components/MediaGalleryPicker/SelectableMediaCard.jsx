import React from 'react';
import { Card, Checkbox, Typography, Image, Tooltip } from 'antd';
import {
    PlayCircleFilled,
    FileImageOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * SelectableMediaCard - A simplified media card for selection mode
 * Used inside MediaGalleryPicker for selecting existing media
 */
const SelectableMediaCard = ({
    media,
    selected = false,
    onSelect,
}) => {
    // Determine if video based on file_type or mime_type
    const isVideo = media.file_type === 'video' ||
        media.mime_type?.startsWith('video') ||
        ['mp4', 'webm', 'mov', 'avi'].includes(media.extension?.toLowerCase());

    // Get the image/video URL
    const mediaUrl = media.file_path || media.url || media.thumbnail;

    // Get display name
    const displayName = media.title || media.file_name || media.name || 'Untitled';

    const handleClick = () => {
        onSelect?.(media);
    };

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onSelect?.(media);
    };

    return (
        <Card
            hoverable
            className={`selectable-media-card ${selected ? 'selected' : ''}`}
            onClick={handleClick}
            style={{
                overflow: 'hidden',
                borderRadius: 8,
                border: selected ? '2px solid var(--primary-color)' : '1px solid #303030',
                transition: 'all 0.2s ease',
                boxShadow: selected ? '0 0 0 3px rgba(82, 196, 65, 0.2)' : 'none',
                background: '#1f1f1f',
                cursor: 'pointer',
                position: 'relative',
                transform: selected ? 'scale(1.02)' : 'none',
            }}
            styles={{
                body: { padding: 0 },
            }}
        >
            {/* Checkbox overlay - always visible */}
            <div
                className="selection-checkbox"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 10,
                    padding: 2,
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                }}
            >
                <Checkbox
                    checked={selected}
                    onChange={handleCheckboxChange}
                />
            </div>

            {/* Thumbnail Container */}
            <div
                style={{
                    position: 'relative',
                    height: 120,
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
                                <VideoCameraOutlined style={{ fontSize: 32, color: '#3f3f3f' }} />
                            </div>
                        )}
                        <PlayCircleFilled
                            style={{
                                position: 'absolute',
                                fontSize: 36,
                                color: 'rgba(255,255,255,0.85)',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
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
                                height: 120,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#1f1f1f'
                            }}>
                                <FileImageOutlined style={{ fontSize: 24, color: '#333' }} />
                            </div>
                        }
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                    />
                )}
            </div>

            {/* File Name */}
            <div style={{
                padding: '8px',
                background: '#1f1f1f',
                borderTop: '1px solid #303030'
            }}>
                <Tooltip title={displayName}>
                    <Text
                        ellipsis
                        style={{
                            display: 'block',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.75)',
                        }}
                    >
                        {displayName}
                    </Text>
                </Tooltip>
            </div>
        </Card>
    );
};

export default SelectableMediaCard;

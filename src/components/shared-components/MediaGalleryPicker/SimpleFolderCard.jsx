import React from 'react';
import { Card, Typography, Badge } from 'antd';
import { FolderOpenFilled } from '@ant-design/icons';

const { Text } = Typography;

/**
 * SimpleFolderCard - A minimal folder card for navigation only
 * Used inside MediaGalleryPicker for browsing folders (read-only)
 */
const SimpleFolderCard = ({
    folder,
    onOpen,
}) => {
    const handleClick = () => {
        onOpen?.(folder);
    };

    return (
        <Card
            hoverable
            className="simple-folder-card"
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                border: '1px solid #303030',
                background: 'var(--card-bg, #1f1f1f)',
                transition: 'all 0.2s ease',
                borderRadius: 8,
            }}
            bodyStyle={{ padding: '12px' }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                {/* Folder Icon with Badge */}
                <Badge
                    count={folder.media_count || folder.children_count || 0}
                    size="small"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                >
                    <FolderOpenFilled
                        style={{
                            fontSize: 22,
                            color: 'var(--primary-color)',
                        }}
                    />
                </Badge>

                {/* Folder Name */}
                <Text
                    className='m-0 fw-bold'
                    ellipsis={{ tooltip: folder.name }}
                    style={{ fontSize: 13 }}
                >
                    {folder.name}
                </Text>
            </div>
        </Card>
    );
};

export default SimpleFolderCard;

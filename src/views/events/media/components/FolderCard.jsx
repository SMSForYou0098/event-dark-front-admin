import React, { useState } from 'react';
import { Card, Typography, Dropdown, Badge } from 'antd';
import {
    FolderFilled,
    FolderOpenFilled,
    EditOutlined,
    DeleteOutlined,
    DragOutlined,
    MoreOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const FolderCard = ({
    folder,
    onOpen,
    onEdit,
    onDelete,
    onDrop, // Called when items are dropped on this folder
    onDragStart, // Called when this folder is dragged
    draggable = true,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const menuItems = [
        {
            key: 'edit',
            label: 'Rename',
            icon: <EditOutlined />,
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onEdit?.(folder);
            },
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onDelete?.(folder);
            },
        },
    ];

    const handleDoubleClick = () => {
        onOpen?.(folder);
    };

    const handleClick = () => {
        onOpen?.(folder);
    };

    // Drag handlers for this folder (as draggable item)
    const handleDragStart = (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'folder',
            id: folder.id,
            name: folder.name,
        }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(folder);
    };

    // Drop handlers for receiving items
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if it's not dropping on itself
        try {
            const data = e.dataTransfer.types.includes('application/json');
            if (data) {
                e.dataTransfer.dropEffect = 'move';
                setIsDragOver(true);
            }
        } catch {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));

            // Don't allow dropping folder on itself
            if (data.type === 'folder' && data.id === folder.id) {
                return;
            }

            onDrop?.(data, folder);
        } catch (error) {
            console.error('Drop error:', error);
        }
    };

    return (
        <Card
            hoverable
            className={`folder-card ${isDragOver ? 'drag-over' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable={draggable}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                textAlign: 'center',
                cursor: 'pointer',
                border: isDragOver
                    ? '2px dashed #52c41a'
                    : '1px solid #303030',
                background: isDragOver
                    ? 'rgba(82, 196, 65, 0.1)'
                    : 'var(--card-bg, #1f1f1f)',
                transition: 'all 0.2s ease',
                transform: isDragOver ? 'scale(1.02)' : 'none',
            }}
            styles={{
                body: {
                    padding: '16px 12px',
                },
            }}
        >
            <div style={{ position: 'relative' }}>
                {/* Actions dropdown */}
                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: -8,
                            right: -4,
                            padding: 4,
                            cursor: 'pointer',
                            opacity: 0.7,
                        }}
                    >
                        <MoreOutlined style={{ fontSize: 16 }} />
                    </div>
                </Dropdown>

                {/* Folder Icon */}
                <Badge
                    count={folder.media_count || folder.children_count || 0}
                    size="small"
                    style={{ backgroundColor: isDragOver ? '#52c41a' : 'var(--primary-color)' }}
                    offset={[-5, 5]}
                >
                    {isDragOver ? (
                        <FolderOpenFilled
                            style={{
                                fontSize: 56,
                                color: '#52c41a',
                            }}
                        />
                    ) : (
                        <FolderFilled
                            style={{
                                fontSize: 56,
                                color: '#faad14',
                            }}
                        />
                    )}
                </Badge>

                {/* Folder Name */}
                <Text
                    ellipsis={{ tooltip: folder.name }}
                    style={{
                        display: 'block',
                        marginTop: 8,
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    {folder.name}
                </Text>

                {/* Drop hint */}
                {isDragOver && (
                    <Text
                        style={{
                            display: 'block',
                            marginTop: 4,
                            fontSize: 11,
                            color: '#52c41a',
                        }}
                    >
                        Drop here
                    </Text>
                )}
            </div>
        </Card>
    );
};

export default FolderCard;

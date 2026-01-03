import React, { useState } from 'react';
import { Card, Typography, Dropdown, Badge } from 'antd';
import {
    FolderFilled,
    FolderOpenFilled,
    EditOutlined,
    DeleteOutlined,
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
    pickerMode = false, // When true: simplified UI for picker (no edit/delete actions, no drag-drop)
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
            draggable={draggable && !pickerMode}
            onDragStart={pickerMode ? undefined : handleDragStart}
            onDragOver={pickerMode ? undefined : handleDragOver}
            onDragLeave={pickerMode ? undefined : handleDragLeave}
            onDrop={pickerMode ? undefined : handleDrop}
            style={{
                cursor: 'pointer',
                border: isDragOver
                    ? '2px dashed var(--primary-color)'
                    : '1px solid #303030',
                background: isDragOver
                    ? 'rgba(181, 21, 21, 0.1)'
                    : 'var(--card-bg, #1f1f1f)',
                transition: 'all 0.2s ease',
                transform: isDragOver ? 'scale(1.02)' : 'none',
            }}
            bodyStyle={{ padding: '12px 8px' }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
            }}>
                {/* Left side: Icon and Name */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                    minWidth: 0
                }}>
                    {/* Folder Icon with Badge */}
                    <Badge
                        count={folder.media_count || folder.children_count || 0}
                        size="small"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                        <FolderOpenFilled
                            style={{
                                fontSize: 24,
                                color: 'var(--primary-color)',
                            }}
                        />
                    </Badge>

                    {/* Folder Name */}
                    <Text className='m-0 fw-bold' ellipsis={{ tooltip: folder.name }}>
                        {folder.name}
                    </Text>
                </div>

                {/* Right side: Actions - hide in picker mode */}
                {!pickerMode && (
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                padding: 4,
                                cursor: 'pointer',
                                opacity: 0.7,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <MoreOutlined style={{ fontSize: 16 }} />
                        </div>
                    </Dropdown>
                )}
            </div>

            {/* Drop hint */}
            {isDragOver && (
                <Text
                    type="secondary"
                    style={{
                        display: 'block',
                        marginTop: 8,
                        fontSize: 11,
                        textAlign: 'center'
                    }}
                >
                    Drop here
                </Text>
            )}
        </Card>
    );
};

export default FolderCard;

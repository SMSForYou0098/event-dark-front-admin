import React, { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Dropdown, Badge } from 'antd';
import {
    FolderFilled,
    FolderOpenFilled,
    EditOutlined,
    DeleteOutlined,
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
    const [contextMenuOpen, setContextMenuOpen] = useState(false);

    const handleContextMenu = useCallback((e) => {
        if (pickerMode) return;
        e.preventDefault();
        e.stopPropagation();
        setContextMenuOpen(true);
    }, [pickerMode]);

    // Close context menu on scroll or click outside
    useEffect(() => {
        if (!contextMenuOpen) return;
        const handleClose = () => setContextMenuOpen(false);
        window.addEventListener('scroll', handleClose, true);
        window.addEventListener('click', handleClose, true);
        return () => {
            window.removeEventListener('scroll', handleClose, true);
            window.removeEventListener('click', handleClose, true);
        };
    }, [contextMenuOpen]);

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

    const cardContent = (
        <Card
            hoverable
            className={`folder-card ${isDragOver ? 'drag-over' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
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

    if (pickerMode) {
        return cardContent;
    }

    return (
        <Dropdown
            menu={{
                items: menuItems,
                style: { minWidth: 120 },
                onClick: () => setContextMenuOpen(false),
            }}
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
            getPopupContainer={() => document.body}
            overlayStyle={{ zIndex: 2000 }}
        >
            <div>
                {cardContent}
            </div>
        </Dropdown>
    );
};

export default FolderCard;

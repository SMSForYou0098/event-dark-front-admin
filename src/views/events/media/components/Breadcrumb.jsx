import React, { useState } from 'react';
import { Breadcrumb as AntBreadcrumb, Typography } from 'antd';
import { HomeOutlined, FolderOutlined } from '@ant-design/icons';

const { Text } = Typography;

const Breadcrumb = ({
    path = [], // Array of { id, name } objects
    onNavigate,
    onDropOnRoot, // Handler for dropping items on root
    onDropOnFolder, // Handler for dropping items on a folder in the path
}) => {
    const [isRootDragOver, setIsRootDragOver] = useState(false);
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    // Root drop handlers
    const handleRootDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setIsRootDragOver(true);
    };

    const handleRootDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRootDragOver(false);
    };

    const handleRootDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRootDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            onDropOnRoot?.(data);
        } catch (error) {
            console.error('Drop on root error:', error);
        }
    };

    // Folder drop handlers
    const handleFolderDragOver = (e, folder) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolderId(folder.id);
    };

    const handleFolderDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);
    };

    const handleFolderDrop = (e, folder) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            // Don't allow dropping folder on itself
            if (data.type === 'folder' && data.id === folder.id) {
                return;
            }
            onDropOnFolder?.(data, folder);
        } catch (error) {
            console.error('Drop on folder error:', error);
        }
    };

    const items = [
        {
            key: 'home',
            title: (
                <span
                    onClick={() => onNavigate?.(null)}
                    onDragOver={handleRootDragOver}
                    onDragLeave={handleRootDragLeave}
                    onDrop={handleRootDrop}
                    style={{
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: isRootDragOver ? 'rgba(82, 196, 65, 0.2)' : 'transparent',
                        border: isRootDragOver ? '2px dashed #52c41a' : '2px dashed transparent',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <HomeOutlined style={{ marginRight: 4, color: isRootDragOver ? '#52c41a' : undefined }} />
                    {isRootDragOver ? 'Drop here' : 'Media'}
                </span>
            ),
        },
        ...path.map((folder, index) => {
            const isLastItem = index === path.length - 1;
            const isDragOver = dragOverFolderId === folder.id;

            return {
                key: folder.id,
                title: (
                    <span
                        onClick={() => {
                            // Navigate to this folder (not last item)
                            if (!isLastItem) {
                                onNavigate?.(folder);
                            }
                        }}
                        onDragOver={!isLastItem ? (e) => handleFolderDragOver(e, folder) : undefined}
                        onDragLeave={!isLastItem ? handleFolderDragLeave : undefined}
                        onDrop={!isLastItem ? (e) => handleFolderDrop(e, folder) : undefined}
                        style={{
                            cursor: !isLastItem ? 'pointer' : 'default',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: isDragOver ? 'rgba(82, 196, 65, 0.2)' : 'transparent',
                            border: isDragOver ? '2px dashed #52c41a' : '2px dashed transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <FolderOutlined style={{ marginRight: 4, color: isDragOver ? '#52c41a' : '#faad14' }} />
                        {isDragOver ? 'Drop here' : folder.name}
                    </span>
                ),
            };
        }),
    ];

    return (
        <AntBreadcrumb
            items={items}
            style={{
                padding: '8px 0',
                marginBottom: 16,
            }}
        />
    );
};

export default Breadcrumb;

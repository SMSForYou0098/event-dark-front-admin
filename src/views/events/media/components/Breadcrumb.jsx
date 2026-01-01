import React, { useState } from 'react';
import { Breadcrumb as AntBreadcrumb, Typography, Space } from 'antd';
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
                <Space
                    size={4}
                    onClick={() => onNavigate?.(null)}
                    onDragOver={handleRootDragOver}
                    onDragLeave={handleRootDragLeave}
                    onDrop={handleRootDrop}
                    style={{
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: 4,
                        background: isRootDragOver ? 'rgba(82, 196, 65, 0.2)' : 'transparent',
                        border: isRootDragOver ? '2px dashed var(--primary-color)' : '2px dashed transparent',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                    }}
                >
                    <Space size="small">
                        <HomeOutlined style={{ color: isRootDragOver ? 'var(--primary-color)' : 'inherit', fontSize: 14 }} />
                        <Text>{isRootDragOver ? 'Drop here' : 'Media'}</Text>
                    </Space>
                </Space>
            ),
        },
        ...path.map((folder, index) => {
            const isLastItem = index === path.length - 1;
            const isDragOver = dragOverFolderId === folder.id;

            return {
                key: folder.id,
                title: (
                    <Space
                        size={4}
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
                            padding: '6px 12px',
                            borderRadius: 4,
                            background: isDragOver ? 'rgba(82, 196, 65, 0.2)' : 'transparent',
                            border: isDragOver ? '2px dashed var(--primary-color)' : '2px dashed transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Space size="small">
                            <FolderOutlined style={{ color: isDragOver ? 'var(--primary-color)' : 'var(--warning-color)', fontSize: 14 }} />
                            <Text>{isDragOver ? 'Drop here' : folder.name}</Text>
                        </Space>
                    </Space>
                ),
            };
        }),
    ];

    return (
        <AntBreadcrumb items={items} />
    );
};

export default Breadcrumb;

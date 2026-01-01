import React from 'react';
import { Space, Button, Input, Badge } from 'antd';
import {
    FolderAddOutlined,
    UploadOutlined,
    DeleteOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';

const Toolbar = ({
    onCreateFolder,
    onUpload,
    onDeleteSelected,
    selectedCount = 0,
    searchQuery = '',
    onSearchChange,
}) => {
    const {isMobile} = useMyContext();
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16,
            }}
        >
            {/* Left Actions */}
            <Space>
                <Button
                    type="primary"
                    icon={<FolderAddOutlined />}
                    onClick={onCreateFolder}
                >
                    {!isMobile && 'New Folder'}
                </Button>
                <Button
                    icon={<UploadOutlined />}
                    onClick={onUpload}
                >
                    {!isMobile && 'Upload'}
                </Button>
                {selectedCount > 0 && (
                    <Badge count={selectedCount} size="small">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onDeleteSelected}
                        >
                            {!isMobile && 'Delete Selected'}
                        </Button>
                    </Badge>
                )}
                <Input
                    placeholder="Search..."
                    prefix={<SearchOutlined style={{ color: '#666' }} />}
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    style={{ width: isMobile ? 150 : 200 }}
                    allowClear
                />
            </Space>
        </div>
    );
};

export default Toolbar;

import React from 'react';
import { Space, Button, Input, Tooltip, Badge } from 'antd';
import {
    FolderAddOutlined,
    UploadOutlined,
    DeleteOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    SearchOutlined,
} from '@ant-design/icons';

const Toolbar = ({
    onCreateFolder,
    onUpload,
    onDeleteSelected,
    onRefresh,
    selectedCount = 0,
    viewMode = 'grid', // 'grid' or 'list'
    onViewModeChange,
    searchQuery = '',
    onSearchChange,
    loading = false,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16,
            }}
        >
            {/* Left Actions */}
            <Space wrap>
                <Button
                    type="primary"
                    icon={<FolderAddOutlined />}
                    onClick={onCreateFolder}
                >
                    New Folder
                </Button>
                <Button
                    icon={<UploadOutlined />}
                    onClick={onUpload}
                >
                    Upload
                </Button>
                {selectedCount > 0 && (
                    <Badge count={selectedCount} size="small">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onDeleteSelected}
                        >
                            Delete Selected
                        </Button>
                    </Badge>
                )}
            </Space>

            {/* Right Actions */}
            <Space>
                {/* Search */}
                <Input
                    placeholder="Search..."
                    prefix={<SearchOutlined style={{ color: '#666' }} />}
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />

                {/* View Toggle */}
                {/* <Button.Group>
                    <Tooltip title="Grid View">
                        <Button
                            icon={<AppstoreOutlined />}
                            type={viewMode === 'grid' ? 'primary' : 'default'}
                            onClick={() => onViewModeChange?.('grid')}
                        />
                    </Tooltip>
                    <Tooltip title="List View">
                        <Button
                            icon={<UnorderedListOutlined />}
                            type={viewMode === 'list' ? 'primary' : 'default'}
                            onClick={() => onViewModeChange?.('list')}
                        />
                    </Tooltip>
                </Button.Group> */}

                {/* Refresh */}
                <Tooltip title="Refresh">
                    <Button
                        icon={<ReloadOutlined spin={loading} />}
                        onClick={onRefresh}
                    />
                </Tooltip>
            </Space>
        </div>
    );
};

export default Toolbar;

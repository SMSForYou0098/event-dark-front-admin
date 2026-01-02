import React, { useState } from 'react';
import { Upload, message, Progress, Typography, Space, Button } from 'antd';
import {
    InboxOutlined,
    FileImageOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons';

const { Dragger } = Upload;
const { Text } = Typography;

/**
 * UploadSection - Inline upload component for MediaGalleryPicker
 * Handles file validation and upload with progress indicator
 */
const UploadSection = ({
    onUpload,
    loading = false,
    compact = false,
}) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Allowed file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    const uploadProps = {
        multiple: true,
        fileList,
        beforeUpload: (file) => {
            // Check file type
            if (!allowedTypes.includes(file.type)) {
                message.error(`${file.name} is not a supported file type`);
                return Upload.LIST_IGNORE;
            }

            // Check file size (max 5MB for images)
            const maxSize = 5; // MB
            const isValidSize = file.size / 1024 / 1024 < maxSize;

            if (!isValidSize) {
                message.error(`${file.name} must be smaller than ${maxSize}MB`);
                return Upload.LIST_IGNORE;
            }

            return false; // Prevent auto upload
        },
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList);
        },
        onRemove: (file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
        },
        showUploadList: {
            showPreviewIcon: false,
            showRemoveIcon: true,
        },
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Please select files to upload');
            return;
        }

        setUploading(true);

        try {
            const files = fileList.map((f) => f.originFileObj);
            await onUpload?.(files);
            setFileList([]);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    // Calculate totals
    const totalSize = fileList.reduce((sum, f) => sum + (f.size || 0), 0);
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    if (compact) {
        return (
            <div style={{ marginBottom: 16 }}>
                <Dragger
                    {...uploadProps}
                    style={{
                        background: 'var(--card-bg, #1f1f1f)',
                        border: '1px dashed #404040',
                        borderRadius: 8,
                        padding: '8px 0',
                    }}
                    height={80}
                >
                    <p style={{ margin: 0 }}>
                        <CloudUploadOutlined style={{ fontSize: 24, color: 'var(--primary-color)' }} />
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                        Click or drag to upload
                    </p>
                </Dragger>

                {fileList.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {fileList.length} file(s) • {formatSize(totalSize)}
                        </Text>
                        <Button
                            type="primary"
                            size="small"
                            onClick={handleUpload}
                            loading={uploading || loading}
                            icon={<CloudUploadOutlined />}
                        >
                            Upload
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 16 }}>
            <Dragger
                {...uploadProps}
                style={{
                    background: 'var(--card-bg, #1f1f1f)',
                    border: '2px dashed #303030',
                    borderRadius: 8,
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 36, color: 'var(--primary-color)' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 14 }}>
                    Click or drag files to upload
                </p>
                <p className="ant-upload-hint" style={{ color: '#888', fontSize: 12 }}>
                    Supports JPG, PNG, GIF, WebP (Max 5MB)
                </p>
            </Dragger>

            {/* Upload summary and button */}
            {fileList.length > 0 && (
                <div style={{
                    marginTop: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Space split="•">
                        <Text>
                            {fileList.length} file{fileList.length !== 1 ? 's' : ''} selected
                        </Text>
                        <Text type="secondary">
                            Total: {formatSize(totalSize)}
                        </Text>
                    </Space>
                    <Button
                        type="primary"
                        onClick={handleUpload}
                        loading={uploading || loading}
                        icon={<CloudUploadOutlined />}
                    >
                        Upload Files
                    </Button>
                </div>
            )}
        </div>
    );
};

export default UploadSection;

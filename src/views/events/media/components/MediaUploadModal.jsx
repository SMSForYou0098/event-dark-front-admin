import React, { useState, useEffect } from 'react';
import { Modal, Upload, message, Progress, Typography, Space, Alert } from 'antd';
import {
    InboxOutlined,
    FileImageOutlined,
} from '@ant-design/icons';

const { Dragger } = Upload;
const { Text } = Typography;

const MediaUploadModal = ({
    open,
    onCancel,
    onUpload,
    categoryId = null,
    loading = false,
}) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);

    // Clear fileList and errors when modal is closed
    useEffect(() => {
        if (!open) {
            setFileList([]);
            setUploadProgress(0);
            setErrorMessage(null);
        }
    }, [open]);

    // Allowed file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    const uploadProps = {
        multiple: true,
        fileList,
        accept: 'image/*',
        beforeUpload: (file) => {
            // Clear previous errors
            setErrorMessage(null);

            // Check file type
            if (!allowedTypes.includes(file.type)) {
                setErrorMessage(`${file.name} is not a supported file type`);
                return Upload.LIST_IGNORE;
            }

            // Check file size (max 10MB for videos, 5MB for images)
            const isVideo = allowedVideoTypes.includes(file.type);
            const maxSize = isVideo ? 10 : 5; // MB
            const isValidSize = file.size / 1024 / 1024 < maxSize;

            if (!isValidSize) {
                setErrorMessage(`${file.name} must be smaller than ${maxSize}MB`);
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
            setErrorMessage('Please select files to upload');
            return;
        }

        setErrorMessage(null);
        setUploading(true);
        setUploadProgress(0);

        try {
            const files = fileList.map((f) => f.originFileObj);
            await onUpload?.(files, categoryId);

            setUploadProgress(100);
            setFileList([]);
            onCancel?.();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleCancel = () => {
        if (!uploading) {
            setFileList([]);
            onCancel?.();
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

    return (
        <Modal
            title="Upload Media"
            open={open}
            onCancel={handleCancel}
            onOk={handleUpload}
            confirmLoading={uploading || loading}
            okText={uploading ? 'Uploading...' : `Upload ${fileList.length} File${fileList.length !== 1 ? 's' : ''}`}
            okButtonProps={{ disabled: fileList.length === 0 }}
            cancelButtonProps={{ disabled: uploading }}
            width={600}
            maskClosable={!uploading}
            closable={!uploading}
            zIndex={1050}
            getContainer={false}
        >
            {/* Error Alert */}
            {errorMessage && (
                <Alert
                    message={errorMessage}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setErrorMessage(null)}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Dragger
                {...uploadProps}
                style={{
                    background: 'var(--card-bg, #1f1f1f)',
                    border: '2px dashed #303030',
                    borderRadius: 8,
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: 'var(--primary-color)' }} />
                </p>
                <p className="ant-upload-text">
                    Click or drag files to this area to upload
                </p>
                <p className="ant-upload-hint" style={{ color: '#888' }}>
                    Supports images (JPG, PNG, GIF, WebP, SVG)
                    {/* and videos (MP4, WebM, MOV) */}
                </p>
                <Space style={{ marginTop: 8 }}>
                    <Text type="secondary">
                        <FileImageOutlined /> Max 5MB
                    </Text>
                    {/* <Text type="secondary">•</Text>
                    <Text type="secondary">
                        <VideoCameraOutlined /> Max 10MB
                    </Text> */}
                </Space>
            </Dragger>

            {/* Upload summary */}
            {fileList.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <Space split="•">
                        <Text>
                            {fileList.length} file{fileList.length !== 1 ? 's' : ''} selected
                        </Text>
                        <Text type="secondary">
                            Total: {formatSize(totalSize)}
                        </Text>
                    </Space>
                </div>
            )}

            {/* Upload progress */}
            {uploading && (
                <div style={{ marginTop: 16 }}>
                    <Progress
                        percent={uploadProgress}
                        status={uploadProgress === 100 ? 'success' : 'active'}
                        strokeColor={{
                            '0%': 'var(--primary-color)',
                            '100%': '#52c41a',
                        }}
                    />
                </div>
            )}
        </Modal>
    );
};

export default MediaUploadModal;

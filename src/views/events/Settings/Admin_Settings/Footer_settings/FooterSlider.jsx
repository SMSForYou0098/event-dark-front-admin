import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    Card,
    Button,
    Upload,
    Image,
    Modal,
    Space,
    Tag,
    Alert,
    Checkbox,
    Row,
    Col,
    Typography,
    Spin,
    Empty,
    Progress,
    Tooltip,
    message,
} from "antd";
import {
    UploadOutlined,
    DeleteOutlined,
    EyeOutlined,
    CloseOutlined,
    InboxOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useMyContext } from "Context/MyContextProvider";
import api from "auth/FetchInterceptor";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FooterSlider = () => {
    const queryClient = useQueryClient();

    // Local state
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Maximum allowed images
    const MAX_IMAGES = 10;

    // Query key
    const IMAGES_QUERY_KEY = ["footerImages"];

    // Fetch images query
    const {
        data: images = [],
        isLoading: loading,
        error: queryError,
    } = useQuery({
        queryKey: IMAGES_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get(`successfulEvent`);

            if (response && response.eventData) {
                return response.eventData;
            }
            return [];
        },
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    // Upload images mutation
    const uploadMutation = useMutation({
        mutationFn: async (files) => {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append("thumbnail", file);
                formData.append("url", file);

                return api.post(`successfulEvent-store`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            });

            return Promise.all(uploadPromises);
        },
        onSuccess: (data, variables) => {
            message.success(`Successfully uploaded ${variables.length} image(s)!`);
            setSelectedFiles([]);
            queryClient.invalidateQueries({ queryKey: IMAGES_QUERY_KEY });
        },
        onError: (error) => {
            console.error("Error uploading images:", error);
            message.error("Failed to upload images. Please try again.");
        },
    });

    // Delete single image mutation
    const deleteMutation = useMutation({
        mutationFn: async (imageId) => {
            return api.delete(`successfulEvent-destroy/${imageId}`);
        },
        onSuccess: () => {
            message.success("Image deleted successfully!");
            queryClient.invalidateQueries({ queryKey: IMAGES_QUERY_KEY });
        },
        onError: (error) => {
            console.error("Error deleting image:", error);
            message.error("Failed to delete image. Please try again.");
        },
    });

    // Mass delete mutation
    const massDeleteMutation = useMutation({
        mutationFn: async (imageIds) => {
            const deletePromises = imageIds.map((imageId) =>
                api.delete(`successfulEvent-destroy/${imageId}`)
            );

            return Promise.all(deletePromises);
        },
        onSuccess: (data, variables) => {
            message.success(`${variables.length} image(s) deleted successfully!`);
            setSelectedImages([]);
            setSelectAll(false);
            queryClient.invalidateQueries({ queryKey: IMAGES_QUERY_KEY });
        },
        onError: (error) => {
            console.error("Error deleting images:", error);
            message.error("Failed to delete some images. Please try again.");
        },
    });

    // Calculate remaining slots
    const getRemainingSlots = () => {
        return Math.max(0, MAX_IMAGES - images.length);
    };

    const remainingSlots = getRemainingSlots();
    const uploadProgress = (images.length / MAX_IMAGES) * 100;

    // Handle individual image selection
    const handleImageSelect = (imageId) => {
        setSelectedImages((prev) => {
            if (prev.includes(imageId)) {
                return prev.filter((id) => id !== imageId);
            } else {
                return [...prev, imageId];
            }
        });
    };

    // Handle select all toggle
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedImages(images.map((img) => img.id));
            setSelectAll(true);
        } else {
            setSelectedImages([]);
            setSelectAll(false);
        }
    };

    // Mass delete function
    const massDeleteImages = () => {
        if (selectedImages.length === 0) {
            message.warning("Please select at least one image to delete.");
            return;
        }

        Modal.confirm({
            title: "Delete Selected Images?",
            icon: <ExclamationCircleOutlined />,
            content: `You are about to delete ${selectedImages.length} image(s). This action cannot be undone!`,
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: () => {
                massDeleteMutation.mutate(selectedImages);
            },
        });
    };

    // Upload props configuration
    const uploadProps = {
        multiple: true,
        accept: "image/*",
        beforeUpload: (file, fileList) => {
            const remainingSlots = getRemainingSlots();

            if (fileList.length > remainingSlots) {
                message.warning(
                    `You can only upload ${remainingSlots} more image(s). Maximum limit is ${MAX_IMAGES} images total.`
                );
                return false;
            }

            // Add file to selected files
            setSelectedFiles((prev) => [...prev, file]);
            return false; // Prevent auto upload
        },
        onRemove: (file) => {
            setSelectedFiles((prev) => prev.filter((f) => f.uid !== file.uid));
        },
        fileList: selectedFiles.map((file) => ({
            uid: file.uid || Math.random().toString(),
            name: file.name,
            status: "done",
            originFileObj: file,
        })),
        disabled: remainingSlots === 0,
    };

    // Upload images
    const handleUpload = () => {
        if (!selectedFiles.length) {
            message.warning("Please select at least one image to upload.");
            return;
        }

        uploadMutation.mutate(selectedFiles);
    };

    // Delete image with confirmation
    const deleteImage = (imageId) => {
        Modal.confirm({
            title: "Delete Image?",
            icon: <ExclamationCircleOutlined />,
            content: "You won't be able to recover this image!",
            okText: "Yes, Delete",
            cancelText: "Cancel",
            onOk: () => {
                deleteMutation.mutate(imageId);
            },
        });
    };

    // Preview image
    const handlePreviewImage = (image) => {
        setPreviewImage(image);
        setPreviewVisible(true);
    };

    return (
        <div className="p-4">
            {/* Header Card */}
            {/* <Card className="mb-4">
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div>
                        <Title level={3} style={{ marginBottom: 8 }}>
                            <UploadOutlined className="me-2" />
                            Footer Images Slider Management
                        </Title>
                        <Text type="secondary">
                            Manage your footer slider images with ease
                        </Text>
                    </div>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Card size="small" className="shadow-sm">
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Text strong>Upload Progress</Text>
                                        <Space>
                                            <Tag color={remainingSlots > 0 ? "success" : "error"}>
                                                {images.length}/{MAX_IMAGES}
                                            </Tag>
                                        </Space>
                                    </div>
                                    <Progress
                                        percent={Math.round(uploadProgress)}
                                        status={remainingSlots === 0 ? "exception" : "active"}
                                        strokeColor={{
                                            "0%": "#108ee9",
                                            "100%": remainingSlots === 0 ? "#ff4d4f" : "#87d068",
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {remainingSlots > 0 ? (
                                            <>
                                                <CheckCircleOutlined className="me-1" />
                                                {remainingSlots} slots available
                                            </>
                                        ) : (
                                            <>
                                                <ExclamationCircleOutlined className="me-1" />
                                                Upload limit reached
                                            </>
                                        )}
                                    </Text>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} md={12}>
                            <Card size="small" className="shadow-sm">
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <Text strong>Quick Stats</Text>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Tooltip title="Total Images">
                                                <Tag color="blue" style={{ width: "100%" }}>
                                                    📊 Total: {images.length}
                                                </Tag>
                                            </Tooltip>
                                        </Col>
                                        <Col span={12}>
                                            <Tooltip title="Available Slots">
                                                <Tag color="green" style={{ width: "100%" }}>
                                                    ✅ Available: {remainingSlots}
                                                </Tag>
                                            </Tooltip>
                                        </Col>
                                    </Row>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Space>
            </Card> */}

            {/* Upload Section */}
            <Card title="Upload New Images" className="mb-4">
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined style={{ color: "#1890ff" }} />
                        </p>
                        <p className="ant-upload-text">
                            Click or drag files to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                            Support for multiple uploads. You can upload {remainingSlots} more
                            image(s).
                            <br />
                            Supported formats: JPG, PNG, GIF, WebP
                        </p>
                    </Dragger>

                    {selectedFiles.length > 0 && (
                        <div>
                            <Alert
                                message={`${selectedFiles.length} file(s) ready to upload`}
                                type="info"
                                showIcon
                                closable
                                onClose={() => setSelectedFiles([])}
                            />
                        </div>
                    )}

                    <Button
                        type="primary"
                        size="large"
                        icon={<UploadOutlined />}
                        onClick={handleUpload}
                        loading={uploadMutation.isPending}
                        disabled={!selectedFiles.length || remainingSlots === 0}
                        block
                    >
                        {uploadMutation.isPending
                            ? "Uploading..."
                            : `Upload ${selectedFiles.length} Image(s)`}
                    </Button>
                </Space>
            </Card>

            {/* Images Grid Section */}
            <Card
                title={
                    <Space>
                        <span>Uploaded Images</span>
                        {images.length > 0 && (
                            <Tag color="processing">
                                {images.length}/{MAX_IMAGES}
                            </Tag>
                        )}
                    </Space>
                }
                extra={
                    images.length > 0 && (
                        <Space>
                            <Checkbox
                                checked={selectAll}
                                onChange={handleSelectAll}
                                disabled={loading}
                            >
                                Select All
                            </Checkbox>
                            {selectedImages.length > 0 && (
                                <>
                                    <Tag color="blue">{selectedImages.length} selected</Tag>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setSelectedImages([]);
                                            setSelectAll(false);
                                        }}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        type="primary"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={massDeleteImages}
                                        loading={massDeleteMutation.isPending}
                                    >
                                        Delete ({selectedImages.length})
                                    </Button>
                                </>
                            )}
                        </Space>
                    )
                }
            >
                {loading ? (
                    <div className="text-center py-5">
                        <Spin size="large" tip="Loading images..." />
                    </div>
                ) : images.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Space direction="vertical">
                                <Text>No images found</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Upload some images to get started! Maximum allowed: {MAX_IMAGES}{" "}
                                    images
                                </Text>
                            </Space>
                        }
                    />
                ) : (
                    <Row gutter={[16, 16]}>
                        {images.map((image) => (
                            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={image.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleImageSelect(image.id)}
                                    bodyStyle={{padding : '1px 0'}}
                                    style={{
                                        borderRadius: 8,
                                        position: 'relative',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                    }}
                                    cover={
                                        <div
                                            className="image-box d-flex justify-content-center align-items-center rounded position-relative"
                                            style={{overflow: 'hidden'}}
                                        >
                                            {/* Selection Overlay */}
                                            {selectedImages.includes(image.id) && (
                                                <div
                                                    className="position-absolute top-0 start-0 w-100 h-100"
                                                    style={{
                                                        backgroundColor: 'rgba(24, 144, 255, 0.15)',
                                                        zIndex: 1,
                                                    }}
                                                />
                                            )}

                                            {/* Checkbox */}
                                            <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 2 }}>
                                                <Checkbox
                                                    checked={selectedImages.includes(image.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleImageSelect(image.id);
                                                    }}
                                                />
                                            </div>

                                            {/* Image */}
                                            <Image
                                                src={image.thumbnail}
                                                alt="Footer slider"
                                                preview={false}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        </div>
                                    }
                                >
                                    <Card.Meta
                                        title={
                                            <div className="d-flex align-items-center justify-content-end">
                                                {/* Actions */}
                                                <div className="d-flex align-items-center">
                                                    <Tooltip title="Preview">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<EyeOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreviewImage(image);
                                                            }}
                                                        />
                                                    </Tooltip>

                                                    <Tooltip title="Delete">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteImage(image.id);
                                                            }}
                                                            loading={
                                                                deleteMutation.isPending &&
                                                                deleteMutation.variables === image.id
                                                            }
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card>

            {/* Preview Modal */}
            <Modal
                open={previewVisible}
                title="Image Preview"
                footer={[
                    <Button key="close" onClick={() => setPreviewVisible(false)}>
                        Close
                    </Button>,
                    previewImage && (
                        <Button
                            key="delete"
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                setPreviewVisible(false);
                                deleteImage(previewImage.id);
                            }}
                        >
                            Delete Image
                        </Button>
                    ),
                ]}
                onCancel={() => setPreviewVisible(false)}
                width={800}
                centered
            >
                {previewImage && (
                    <div className="text-center">
                        <Image
                            src={previewImage.thumbnail}
                            alt="Preview"
                        //   style={{ maxHeight: "70vh" }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FooterSlider;
import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    Tooltip,
    message,
    Form,
    Input,
    Divider,
} from "antd";
import {
    UploadOutlined,
    DeleteOutlined,
    EyeOutlined,
    InboxOutlined,
    ExclamationCircleOutlined,
    EditOutlined,
    PictureOutlined,
} from "@ant-design/icons";
import api from "auth/FetchInterceptor";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FooterSlider = () => {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    // Local state
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [newImageFile, setNewImageFile] = useState(null);

    // Maximum allowed images
    const MAX_IMAGES = 10;

    // Query key
    const IMAGES_QUERY_KEY = ["footerImages"];

    // Fetch images query
    const {
        data: images = [],
        isLoading: loading,
    } = useQuery({
        queryKey: IMAGES_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get(`successfulEvent?type=events`);

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
                formData.append("thumbnail", file.file);
                formData.append("title", file.title || "");
                formData.append("url", file.url || "");
                formData.append("type", "events" || "");

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

    // Update image mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, title, url, thumbnail }) => {
            const formData = new FormData();
            formData.append("title", title || "");
            formData.append("url", url || "");
            formData.append("type","events")
            if (thumbnail) {
                formData.append("thumbnail", thumbnail);
            }

            return api.post(`successfulEvent-update/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        },
        onSuccess: () => {
            message.success("Image updated successfully!");
            setEditModalVisible(false);
            setEditingImage(null);
            setNewImageFile(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: IMAGES_QUERY_KEY });
        },
        onError: (error) => {
            console.error("Error updating image:", error);
            message.error("Failed to update image. Please try again.");
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

    // Calculate remaining slots - memoized
    const remainingSlots = useMemo(() => {
        return Math.max(0, MAX_IMAGES - images.length);
    }, [images.length]);

    // Handle individual image selection - memoized
    const handleImageSelect = useCallback((imageId) => {
        setSelectedImages((prev) => {
            if (prev.includes(imageId)) {
                return prev.filter((id) => id !== imageId);
            } else {
                return [...prev, imageId];
            }
        });
    }, []);

    // Handle select all toggle - memoized
    const handleSelectAll = useCallback((e) => {
        if (e.target.checked) {
            setSelectedImages(images.map((img) => img.id));
            setSelectAll(true);
        } else {
            setSelectedImages([]);
            setSelectAll(false);
        }
    }, [images]);

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

    // Handle edit image - memoized
    const handleEditImage = useCallback((image) => {
        setEditingImage(image);
        setNewImageFile(null);
        form.setFieldsValue({
            title: image.title || "",
            url: image.url || "",
        });
        setEditModalVisible(true);
    }, [form]);

    // Handle update submit
    const handleUpdateSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            updateMutation.mutate({
                id: editingImage.id,
                title: values.title,
                url: values.url,
                thumbnail: newImageFile,
            });
        } catch (error) {
            console.error("Validation failed:", error);
        }
    }, [editingImage, newImageFile, form, updateMutation]);

    // Handle image replacement
    const handleImageReplace = useCallback((file) => {
        setNewImageFile(file);
        return false; // Prevent auto upload
    }, []);

    // Upload props configuration
    const uploadProps = {
        multiple: true,
        accept: "image/*",
        beforeUpload: (file, fileList) => {
            const currentRemaining = Math.max(0, MAX_IMAGES - images.length);

            if (fileList.length > currentRemaining) {
                message.warning(
                    `You can only upload ${currentRemaining} more image(s). Maximum limit is ${MAX_IMAGES} images total.`
                );
                return false;
            }

            // Add file to selected files with default values
            setSelectedFiles((prev) => [
                ...prev,
                {
                    file,
                    title: "",
                    url: "",
                },
            ]);
            return false; // Prevent auto upload
        },
        onRemove: (file) => {
            setSelectedFiles((prev) =>
                prev.filter((f) => f.file.uid !== file.uid)
            );
        },
        fileList: selectedFiles.map((item) => ({
            uid: item.file.uid || Math.random().toString(),
            name: item.file.name,
            status: "done",
            originFileObj: item.file,
        })),
        disabled: remainingSlots === 0,
    };

    // Update file metadata - memoized
    const updateFileMetadata = useCallback((fileUid, field, value) => {
        setSelectedFiles((prev) =>
            prev.map((item) =>
                item.file.uid === fileUid
                    ? { ...item, [field]: value }
                    : item
            )
        );
    }, []);

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

                            {/* File metadata inputs */}
                            <div className="mt-3">
                                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                                    {selectedFiles.map((item) => (
                                        <Card
                                            key={item.file.uid}
                                            size="small"
                                            title={item.file.name}
                                        >
                                            <Row gutter={[16, 16]}>
                                                <Col xs={24} md={12}>
                                                    <Input
                                                        placeholder="Enter title (optional)"
                                                        value={item.title}
                                                        onChange={(e) =>
                                                            updateFileMetadata(
                                                                item.file.uid,
                                                                "title",
                                                                e.target.value
                                                            )
                                                        }
                                                        prefix={<EditOutlined />}
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Input
                                                        placeholder="Enter URL (optional)"
                                                        value={item.url}
                                                        onChange={(e) =>
                                                            updateFileMetadata(
                                                                item.file.uid,
                                                                "url",
                                                                e.target.value
                                                            )
                                                        }
                                                        prefix="https://"
                                                    />
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))}
                                </Space>
                            </div>
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
                            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={image.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleImageSelect(image.id)}
                                    bodyStyle={{ padding: "8px" }}
                                    style={{
                                        borderRadius: 8,
                                        position: "relative",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        border: selectedImages.includes(image.id)
                                            ? "2px solid #1890ff"
                                            : "1px solid #d9d9d9",
                                    }}
                                    cover={
                                        <div
                                            className="image-box d-flex justify-content-center align-items-center rounded position-relative"
                                            style={{ overflow: "hidden", height: 280, minHeight: 280 }}
                                        >
                                            {/* Selection Overlay */}
                                            {selectedImages.includes(image.id) && (
                                                <div
                                                    className="position-absolute top-0 start-0 w-100 h-100"
                                                    style={{
                                                        backgroundColor: "rgba(24, 144, 255, 0.15)",
                                                        zIndex: 1,
                                                    }}
                                                />
                                            )}

                                            {/* Checkbox */}
                                            <div
                                                className="position-absolute top-0 start-0 m-2"
                                                style={{ zIndex: 2 }}
                                            >
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
                                                alt={image.title || "Footer slider"}
                                                preview={false}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </div>
                                    }
                                >
                                    {/* Title and URL Display */}
                                    <div className="mb-2">
                                        {image.title && (
                                            <Text strong ellipsis style={{ display: "block" }}>
                                                {image.title}
                                            </Text>
                                        )}
                                        {image.url && (
                                            <Text
                                                type="secondary"
                                                ellipsis
                                                style={{ display: "block", fontSize: 12 }}
                                            >
                                                {image.url}
                                            </Text>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                        <Tooltip title="Edit">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditImage(image);
                                                }}
                                            />
                                        </Tooltip>

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
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card>

            {/* Edit Modal */}
            <Modal
                open={editModalVisible}
                title="Edit Image Details"
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingImage(null);
                    setNewImageFile(null);
                    form.resetFields();
                }}
                onOk={handleUpdateSubmit}
                confirmLoading={updateMutation.isPending}
                okText="Update"
                width={600}
            >
                <Form form={form} layout="vertical">
                    {editingImage && (
                        <div className="mb-4">
                            <Text strong>Current Image:</Text>
                            <div className="mt-2" style={{ textAlign: "center" }}>
                                <Image
                                    src={newImageFile ? URL.createObjectURL(newImageFile) : editingImage.thumbnail}
                                    alt="Preview"
                                    style={{ 
                                        width: "100%", 
                                        maxHeight: 300, 
                                        objectFit: "cover",
                                        borderRadius: 8
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <Divider>Replace Image (Optional)</Divider>
                    
                    <Form.Item label="Upload New Image">
                        <Upload
                            accept="image/*"
                            beforeUpload={handleImageReplace}
                            showUploadList={false}
                            maxCount={1}
                        >
                            <Button icon={<PictureOutlined />} block>
                                {newImageFile ? "Change Image" : "Replace Image"}
                            </Button>
                        </Upload>
                        {newImageFile && (
                            <Alert
                                message={`New image selected: ${newImageFile.name}`}
                                type="info"
                                showIcon
                                closable
                                onClose={() => setNewImageFile(null)}
                                className="mt-2"
                            />
                        )}
                    </Form.Item>

                    <Divider>Image Details</Divider>

                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[
                            { max: 100, message: "Title cannot exceed 100 characters" },
                        ]}
                    >
                        <Input placeholder="Enter title" />
                    </Form.Item>

                    <Form.Item
                        label="URL"
                        name="url"
                        rules={[
                            { type: "url", message: "Please enter a valid URL" },
                            { max: 255, message: "URL cannot exceed 255 characters" },
                        ]}
                    >
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                </Form>
            </Modal>

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
                    <div>
                        <Image src={previewImage.thumbnail} alt="Preview" />
                        {previewImage.title && (
                            <Title level={4} className="mt-3">
                                {previewImage.title}
                            </Title>
                        )}
                        {previewImage.url && (
                            <a
                                href={previewImage.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {previewImage.url}
                            </a>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FooterSlider;
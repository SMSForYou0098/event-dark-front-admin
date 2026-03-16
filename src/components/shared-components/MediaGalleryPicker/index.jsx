import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
    Row,
    Col,
    Typography,
    Empty,
    Input,
    Button,
    Breadcrumb,
    Tabs,
    Modal,
    Alert,
    Drawer,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    HomeOutlined,
    FolderOutlined,
    FolderAddOutlined,
    PictureOutlined,
    CloudUploadOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

// Sub-components - reuse from media module
import MediaCard from 'views/events/media/components/MediaCard';
import FolderCard from 'views/events/media/components/FolderCard';
import FolderModal from 'views/events/media/components/FolderModal';
import UploadSection from './UploadSection';
import Loader from 'utils/Loader';

// Hooks from media module
import {
    useMediaCategories,
    useChildCategories,
    useCreateCategory,
    useDeleteCategory,
} from 'views/events/media/hooks/useMediaCategories';
import { useBulkUploadMedia, useMoveMedia, useDeleteMedia } from 'views/events/media/hooks/useMedia';

const { confirm } = Modal;

const { Text } = Typography;

/**
 * MediaGalleryPicker - A reusable media gallery picker component for modals
 * 
 * @param {boolean} multiple - Allow multiple selection (default: false)
 * @param {string|string[]} value - Current selected URL(s)
 * @param {function} onChange - Callback with selected URL(s)
 * @param {number} maxCount - Maximum selection count (for multiple mode)
 * @param {string} accept - Accepted file types hint (default: 'image')
 */
const MediaGalleryPicker = ({
    multiple = false,
    value,
    onChange,
    maxCount = 10,
    accept = 'image',
}) => {
    // State
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState([]); // Array of full media objects
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'upload'
    const [pendingAutoSelect, setPendingAutoSelect] = useState(null); // Track files to auto-select
    const [alertMessage, setAlertMessage] = useState(null); // { type: 'error'|'warning'|'success', text: string }

    // Queries
    const {
        data: rootData = { categories: [], media: [] },
        isLoading: rootLoading,
        refetch: refetchRoot
    } = useMediaCategories();

    const {
        data: childData = { categories: [], media: [] },
        isLoading: childLoading,
        refetch: refetchChild
    } = useChildCategories(currentFolder);

    // Modal states
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [folderError, setFolderError] = useState(null); // Error inside folder modal

    // Mutations
    const bulkUploadMutation = useBulkUploadMedia();
    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const moveMediaMutation = useMoveMedia();
    const deleteMediaMutation = useDeleteMedia();

    // Operation loading state (for overlay loader during move/delete)
    const isOperationLoading = moveMediaMutation.isPending || deleteCategoryMutation.isPending || deleteMediaMutation.isPending;

    const isLoading = rootLoading || childLoading;

    // Get current folders and media
    const currentFolders = useMemo(() => {
        if (currentFolder === null) {
            return rootData.categories || [];
        }
        return childData.categories || [];
    }, [currentFolder, rootData.categories, childData.categories]);

    const mediaFiles = useMemo(() => {
        if (currentFolder === null) {
            return rootData.media || [];
        }
        return childData.media || [];
    }, [currentFolder, rootData.media, childData.media]);

    // Filter by search query
    const filteredFolders = useMemo(() => {
        if (!searchQuery.trim()) return currentFolders;
        const query = searchQuery.toLowerCase();
        return currentFolders.filter((f) => f.name.toLowerCase().includes(query));
    }, [currentFolders, searchQuery]);

    const filteredMedia = useMemo(() => {
        if (!searchQuery.trim()) return mediaFiles;
        const query = searchQuery.toLowerCase();
        return mediaFiles.filter((m) =>
            (m.title || m.file_name || '').toLowerCase().includes(query)
        );
    }, [mediaFiles, searchQuery]);

    // Initialize selected media from value prop - use ref to prevent infinite loop
    const initializedRef = React.useRef(false);
    useEffect(() => {
        if (value && !initializedRef.current) {
            const urls = Array.isArray(value) ? value : [value];
            // Find media objects matching the URLs
            const allMedia = [...(rootData.media || []), ...(childData.media || [])];
            const matched = allMedia.filter(m => urls.includes(m.file_path || m.url));

            // Only update if we found matching media
            if (matched.length > 0) {
                setSelectedMedia(matched);
                initializedRef.current = true;
            }
        }

        // Reset initialization flag when value changes or modal closes
        if (!value) {
            initializedRef.current = false;
        }
    }, [value]);

    // Auto-select uploaded files when they appear in the media list
    useEffect(() => {
        if (pendingAutoSelect && pendingAutoSelect.length > 0 && mediaFiles.length > 0) {
            // Find the most recently uploaded files (they should be at the start of the list)
            const uploadedCount = pendingAutoSelect.length;
            const recentMedia = mediaFiles.slice(0, uploadedCount);

            if (recentMedia.length > 0) {
                if (multiple) {
                    // Multiple selection - add all uploaded files
                    setSelectedMedia(prev => {
                        const newSelection = [...prev];
                        recentMedia.forEach(media => {
                            const mediaUrl = media.file_path || media.url;
                            if (!newSelection.some(m => (m.file_path || m.url) === mediaUrl)) {
                                if (newSelection.length < maxCount) {
                                    newSelection.push(media);
                                }
                            }
                        });
                        const urls = newSelection.map(m => m.file_path || m.url);
                        onChange?.(urls);
                        return newSelection;
                    });
                } else {
                    // Single selection - select the first uploaded file
                    const media = recentMedia[0];
                    setSelectedMedia([media]);
                    onChange?.(media.file_path || media.url);
                }
                setPendingAutoSelect(null);
            }
        }
    }, [mediaFiles, pendingAutoSelect, multiple, maxCount, onChange]);

    // Handlers - memoized to prevent unnecessary re-renders
    const handleOpenFolder = useCallback((folder) => {
        setCurrentFolder(folder.id);
        setFolderPath((prev) => [...prev, folder]);
        setSearchQuery('');
    }, []);

    const handleBreadcrumbNavigate = useCallback((folder) => {
        if (folder === null) {
            setCurrentFolder(null);
            setFolderPath([]);
        } else {
            setFolderPath((prev) => {
                const index = prev.findIndex((f) => f.id === folder.id);
                if (index !== -1) {
                    setCurrentFolder(folder.id);
                    return prev.slice(0, index + 1);
                }
                return prev;
            });
        }
        setSearchQuery('');
    }, []);

    const handleMediaSelect = useCallback((media) => {
        const mediaUrl = media.file_path || media.url;

        if (multiple) {
            setSelectedMedia((prev) => {
                const isSelected = prev.some(m => (m.file_path || m.url) === mediaUrl);
                let newSelection;

                if (isSelected) {
                    newSelection = prev.filter(m => (m.file_path || m.url) !== mediaUrl);
                } else {
                    if (prev.length >= maxCount) {
                        setAlertMessage({ type: 'warning', text: `Maximum ${maxCount} files can be selected` });
                        return prev;
                    }
                    newSelection = [...prev, media];
                }

                // Notify parent - use setTimeout to defer callback
                const urls = newSelection.map(m => m.file_path || m.url);
                setTimeout(() => onChange?.(urls), 0);
                return newSelection;
            });
        } else {
            // Single selection mode
            setSelectedMedia([media]);
            setTimeout(() => onChange?.(mediaUrl), 0);
        }
    }, [multiple, maxCount, onChange]);

    const handleUploadFiles = useCallback(async (files) => {
        try {
            await bulkUploadMutation.mutateAsync({
                files,
                categoryId: currentFolder,
            });

            // Set pending auto-select to track uploaded files
            setPendingAutoSelect(files);

            // Refetch to get the new files
            if (currentFolder) {
                await refetchChild();
            } else {
                await refetchRoot();
            }

            // Switch to browse tab to show uploaded files
            setActiveTab('browse');
            setAlertMessage({ type: 'success', text: 'Files uploaded and selected!' });
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Upload failed';
            setAlertMessage({ type: 'error', text: msg });
        }
    }, [currentFolder, bulkUploadMutation, refetchChild, refetchRoot]);

    const handleRefresh = useCallback(() => {
        refetchRoot();
        if (currentFolder) {
            refetchChild();
        }
    }, [currentFolder, refetchRoot, refetchChild]);

    // --- Folder management handlers ---
    const handleCreateFolder = useCallback(() => {
        setFolderError(null);
        setFolderModalOpen(true);
    }, []);

    const handleFolderSubmit = useCallback(async (data) => {
        try {
            setFolderError(null);
            const payload = { ...data };
            if (currentFolder) {
                payload.parent_id = currentFolder;
            }
            await createCategoryMutation.mutateAsync(payload);
            setFolderModalOpen(false);
            handleRefresh();
            setAlertMessage({ type: 'success', text: 'Folder created successfully!' });
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Failed to create folder';
            setFolderError(msg);
        }
    }, [currentFolder, createCategoryMutation, handleRefresh]);

    const handleDeleteFolder = useCallback((folder) => {
        confirm({
            title: 'Delete Folder',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete "${folder.name}"? This will also delete all media inside.`,
            okText: 'Delete',
            okType: 'danger',
            zIndex: 1200,
            onOk: async () => {
                try {
                    await deleteCategoryMutation.mutateAsync(folder.id);
                    handleRefresh();
                    setAlertMessage({ type: 'success', text: `Folder "${folder.name}" deleted.` });
                } catch (error) {
                    const msg = error?.response?.data?.message || error?.message || 'Failed to delete folder';
                    setAlertMessage({ type: 'error', text: msg });
                }
            },
        });
    }, [deleteCategoryMutation, handleRefresh]);

    // --- Delete media handler ---
    const handleDeleteMedia = useCallback((media) => {
        confirm({
            title: 'Delete File',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete "${media.title || media.file_name || 'this file'}"?`,
            okText: 'Delete',
            okType: 'danger',
            zIndex: 1200,
            onOk: async () => {
                try {
                    await deleteMediaMutation.mutateAsync(media.id);
                    // Remove from selection if it was selected
                    const mediaUrl = media.file_path || media.url;
                    setSelectedMedia(prev => {
                        const filtered = prev.filter(m => (m.file_path || m.url) !== mediaUrl);
                        if (filtered.length !== prev.length) {
                            const urls = filtered.map(m => m.file_path || m.url);
                            setTimeout(() => onChange?.(multiple ? urls : urls[0] || null), 0);
                        }
                        return filtered;
                    });
                    handleRefresh();
                    setAlertMessage({ type: 'success', text: `File deleted successfully.` });
                } catch (error) {
                    const msg = error?.response?.data?.message || error?.message || 'Failed to delete file';
                    setAlertMessage({ type: 'error', text: msg });
                }
            },
        });
    }, [deleteMediaMutation, handleRefresh, multiple, onChange]);

    // --- Move media to folder handlers ---
    const handleDropOnFolder = useCallback(async (dragData, targetFolder) => {
        if (!dragData || !targetFolder) return;
        try {
            if (dragData.type === 'media') {
                const idsToMove = dragData.ids || [dragData.id];
                await moveMediaMutation.mutateAsync({
                    mediaIds: idsToMove,
                    categoryId: targetFolder.id,
                });
                handleRefresh();
                setAlertMessage({ type: 'success', text: `Moved to "${targetFolder.name}"` });
            }
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Failed to move file(s)';
            setAlertMessage({ type: 'error', text: msg });
        }
    }, [moveMediaMutation, handleRefresh]);

    // Create a Set of selected URLs for O(1) lookup - much faster than array.some()
    const selectedUrlsSet = useMemo(() => {
        return new Set(selectedMedia.map(m => m.file_path || m.url));
    }, [selectedMedia]);

    // Grid column config - memoized to prevent new object on every render
    const colSpan = useMemo(() => ({
        xs: 12,
        sm: 8,
        md: 6,
    }), []);

    const hasContent = filteredFolders.length > 0 || filteredMedia.length > 0;

    // Tab items - memoized to prevent recreation on every render
    const tabItems = useMemo(() => [
        {
            key: 'browse',
            label: (
                <span>
                    <PictureOutlined /> Gallery
                </span>
            ),
        },
        {
            key: 'upload',
            label: (
                <span>
                    <CloudUploadOutlined /> Upload New
                </span>
            ),
        },
    ], []);

    return (
        <div className="media-gallery-picker">
            {/* Selection info */}
            {selectedMedia.length > 0 && (
                <div style={{
                    marginBottom: 12,
                    padding: '8px 12px',
                    background: 'rgba(82, 196, 65, 0.1)',
                    borderRadius: 6,
                    border: '1px solid rgba(82, 196, 65, 0.3)',
                }}>
                    <Text style={{ color: 'var(--primary-color)' }}>
                        {selectedMedia.length} {multiple ? 'file(s)' : 'file'} selected
                    </Text>
                </div>
            )}

            {/* Alert Messages */}
            {alertMessage && (
                <Alert
                    message={alertMessage.text}
                    type={alertMessage.type}
                    showIcon
                    closable
                    onClose={() => setAlertMessage(null)}
                    style={{ marginBottom: 12 }}
                />
            )}

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="small"
                style={{ marginBottom: 12 }}
            />

            {activeTab === 'upload' ? (
                <UploadSection
                    onUpload={handleUploadFiles}
                    loading={bulkUploadMutation.isPending}
                />
            ) : (
                <>
                    {/* Toolbar */}
                    <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input
                            placeholder="Search..."
                            prefix={<SearchOutlined style={{ color: '#666' }} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                            size="small"
                            style={{ flex: 1, maxWidth: 200 }}
                        />
                        <Button
                            icon={<FolderAddOutlined />}
                            size="small"
                            onClick={handleCreateFolder}
                        >
                            New Folder
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            size="small"
                            onClick={handleRefresh}
                            loading={isLoading}
                        />
                    </div>

                    {/* Breadcrumb */}
                    <Breadcrumb
                        style={{ marginBottom: 12 }}
                        items={[
                            {
                                title: (
                                    <a onClick={() => handleBreadcrumbNavigate(null)}>
                                        <HomeOutlined /> Home
                                    </a>
                                ),
                            },
                            ...folderPath.map((folder) => ({
                                title: (
                                    <a onClick={() => handleBreadcrumbNavigate(folder)}>
                                        <FolderOutlined style={{ marginRight: 4 }} />
                                        {folder.name}
                                    </a>
                                ),
                            })),
                        ]}
                    />

                    {/* Content */}
                    <div style={{ position: 'relative' }}>
                        {/* Loading overlay */}
                        {(isLoading || isOperationLoading) && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.45)',
                                zIndex: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 8,
                            }}>
                                <Loader width={60} />
                            </div>
                        )}
                        <div style={{
                            maxHeight: 350,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            paddingRight: 4,
                        }}>
                            {!hasContent && !isLoading ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        searchQuery
                                            ? 'No results found'
                                            : 'No folders or files yet'
                                    }
                                    style={{ padding: '30px 0' }}
                                />
                            ) : (
                                <>
                                    {/* Folders */}
                                    {filteredFolders.length > 0 && (
                                        <>
                                            <Text type="secondary" style={{ fontSize: 11, marginBottom: 6, display: 'block' }}>
                                                FOLDERS
                                            </Text>
                                            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                                                {filteredFolders.map((folder) => (
                                                    <Col key={folder.id} xs={12} sm={8}>
                                                        <FolderCard
                                                            folder={folder}
                                                            onOpen={handleOpenFolder}
                                                            onDelete={handleDeleteFolder}
                                                            onDrop={handleDropOnFolder}
                                                            pickerMode={false}
                                                            draggable={false}
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                        </>
                                    )}

                                    {/* Media Files */}
                                    {filteredMedia.length > 0 && (
                                        <>
                                            <Text type="secondary" style={{ fontSize: 11, marginBottom: 6, display: 'block' }}>
                                                FILES
                                            </Text>
                                            <Row gutter={[8, 8]}>
                                                {filteredMedia.map((media) => (
                                                    <Col key={media.id} {...colSpan}>
                                                        <MemoizedMediaCard
                                                            media={media}
                                                            selected={selectedUrlsSet.has(media.file_path || media.url)}
                                                            onSelect={handleMediaSelect}
                                                            onDelete={handleDeleteMedia}
                                                            selectionMode={true}
                                                            pickerMode={false}
                                                            draggable={true}
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Create Folder Modal */}
            <FolderModal
                open={folderModalOpen}
                onCancel={() => { setFolderModalOpen(false); setFolderError(null); }}
                onSubmit={handleFolderSubmit}
                loading={createCategoryMutation.isPending}
                parentId={currentFolder}
                zIndex={1200}
                error={folderError}
                onErrorClear={() => setFolderError(null)}
            />

        </div>
    );
};

// Memoized MediaCard wrapper - only re-renders when props actually change
const MemoizedMediaCard = memo(({ ...props }) => {
    return <MediaCard {...props} />;
}, (prevProps, nextProps) => {
    return (
        prevProps.media.id === nextProps.media.id &&
        prevProps.selected === nextProps.selected &&
        prevProps.selectionMode === nextProps.selectionMode &&
        prevProps.pickerMode === nextProps.pickerMode &&
        prevProps.draggable === nextProps.draggable
    );
});

/**
 * MediaGalleryPickerModal - Drawer wrapper for MediaGalleryPicker
 * Use this when you want the picker to open in a side drawer
 * 
 * @param {boolean} open - Drawer visibility
 * @param {function} onCancel - Called when drawer is closed
 * @param {function} onSelect - Called with selected URL(s) when confirmed
 * @param {boolean} multiple - Allow multiple selection
 * @param {number} maxCount - Maximum selection count
 * @param {string} title - Drawer title
 * @param {object} dimensionValidation - Optional validation { width, height, strict } - strict=true means exact match
 */
export const MediaGalleryPickerModal = ({
    open,
    onCancel,
    onSelect,
    multiple = false,
    maxCount = 10,
    title = 'Select Media',
    value,
    dimensionValidation = null, // { width: 300, height: 600, strict: true }
}) => {
    const [tempSelection, setTempSelection] = useState(value);
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState(null);

    // Reset temp selection and errors when modal opens
    useEffect(() => {
        if (open) {
            setTempSelection(value);
            setValidationError(null);
        }
    }, [open, value]);

    // Memoized selection handler to prevent child re-renders
    const handleSelectionChange = useCallback((newValue) => {
        setTempSelection(newValue);
    }, []);

    // Validate image dimensions
    const validateImageDimensions = useCallback(async (imageUrl) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                const { width, height, strict = true } = dimensionValidation;
                if (strict) {
                    if (img.width !== width || img.height !== height) {
                        reject(`Image must be exactly ${width}px × ${height}px. Selected image is ${img.width}px × ${img.height}px`);
                    } else {
                        resolve(true);
                    }
                } else {
                    // Non-strict: just check minimum dimensions
                    if (img.width < width || img.height < height) {
                        reject(`Image must be at least ${width}px × ${height}px. Selected image is ${img.width}px × ${img.height}px`);
                    } else {
                        resolve(true);
                    }
                }
            };
            img.onerror = () => reject('Failed to load image for validation');
            img.src = imageUrl;
        });
    }, [dimensionValidation]);

    const handleConfirm = useCallback(async () => {
        // If dimension validation is required
        if (dimensionValidation && tempSelection) {
            setValidating(true);
            try {
                const urls = Array.isArray(tempSelection) ? tempSelection : [tempSelection];

                // Validate all selected images
                for (const url of urls) {
                    await validateImageDimensions(url);
                }

                // All validations passed
                onSelect?.(tempSelection);
                onCancel?.();
            } catch (err) {
                setValidationError(err);
            } finally {
                setValidating(false);
            }
        } else {
            // No validation needed
            onSelect?.(tempSelection);
            onCancel?.();
        }
    }, [dimensionValidation, tempSelection, validateImageDimensions, onSelect, onCancel]);

    const hasSelection = multiple
        ? (Array.isArray(tempSelection) && tempSelection.length > 0)
        : !!tempSelection;

    return (
        <Drawer
            title={title}
            open={open}
            onClose={onCancel}
            width={720}
            zIndex={1100}
            destroyOnClose
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={handleConfirm}
                        disabled={!hasSelection}
                        loading={validating}
                    >
                        Select
                    </Button>
                </div>
            }
        >
            {dimensionValidation && (
                <div style={{
                    marginBottom: 12,
                    padding: '8px 12px',
                    background: 'rgba(255,165,0,0.1)',
                    borderRadius: 6,
                    border: '1px solid rgba(255,165,0,0.3)'
                }}>
                    <Text type="warning" style={{ fontSize: 12 }}>
                        ⚠️ Required dimensions: {dimensionValidation.width}×{dimensionValidation.height}px
                    </Text>
                </div>
            )}

            {/* Validation Error Alert */}
            {validationError && (
                <Alert
                    message={validationError}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setValidationError(null)}
                    style={{ marginBottom: 12 }}
                />
            )}

            <MediaGalleryPicker
                multiple={multiple}
                maxCount={maxCount}
                value={tempSelection}
                onChange={handleSelectionChange}
            />
        </Drawer>
    );
};

export default MediaGalleryPicker;


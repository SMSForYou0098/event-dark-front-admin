import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Row,
    Col,
    Typography,
    Spin,
    Empty,
    Input,
    Button,
    Space,
    Breadcrumb,
    Tabs,
    Modal,
    message,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    HomeOutlined,
    FolderOutlined,
    PictureOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons';

// Sub-components
import SelectableMediaCard from './SelectableMediaCard';
import SimpleFolderCard from './SimpleFolderCard';
import UploadSection from './UploadSection';

// Hooks from media module
import {
    useMediaCategories,
    useChildCategories,
} from 'views/events/media/hooks/useMediaCategories';
import { useBulkUploadMedia } from 'views/events/media/hooks/useMedia';

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

    // Mutations
    const bulkUploadMutation = useBulkUploadMedia();

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

    // Initialize selected media from value prop
    useEffect(() => {
        if (value) {
            const urls = Array.isArray(value) ? value : [value];
            // Find media objects matching the URLs
            const allMedia = [...(rootData.media || []), ...(childData.media || [])];
            const matched = allMedia.filter(m => urls.includes(m.file_path || m.url));
            if (matched.length > 0) {
                setSelectedMedia(matched);
            }
        }
    }, [value, rootData.media, childData.media]);

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

    // Handlers
    const handleOpenFolder = (folder) => {
        setCurrentFolder(folder.id);
        setFolderPath((prev) => [...prev, folder]);
        setSearchQuery('');
    };

    const handleBreadcrumbNavigate = (folder) => {
        if (folder === null) {
            setCurrentFolder(null);
            setFolderPath([]);
        } else {
            const index = folderPath.findIndex((f) => f.id === folder.id);
            if (index !== -1) {
                setCurrentFolder(folder.id);
                setFolderPath(folderPath.slice(0, index + 1));
            }
        }
        setSearchQuery('');
    };

    const handleMediaSelect = (media) => {
        const mediaUrl = media.file_path || media.url;

        if (multiple) {
            setSelectedMedia((prev) => {
                const isSelected = prev.some(m => (m.file_path || m.url) === mediaUrl);
                let newSelection;

                if (isSelected) {
                    newSelection = prev.filter(m => (m.file_path || m.url) !== mediaUrl);
                } else {
                    if (prev.length >= maxCount) {
                        message.warning(`Maximum ${maxCount} files can be selected`);
                        return prev;
                    }
                    newSelection = [...prev, media];
                }

                // Notify parent
                const urls = newSelection.map(m => m.file_path || m.url);
                onChange?.(urls);
                return newSelection;
            });
        } else {
            // Single selection mode
            setSelectedMedia([media]);
            onChange?.(mediaUrl);
        }
    };

    const handleUploadFiles = async (files) => {
        try {
            const result = await bulkUploadMutation.mutateAsync({
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
            message.success('Files uploaded and selected!');
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleRefresh = () => {
        refetchRoot();
        if (currentFolder) {
            refetchChild();
        }
    };

    // Check if media is selected
    const isMediaSelected = (media) => {
        const mediaUrl = media.file_path || media.url;
        return selectedMedia.some(m => (m.file_path || m.url) === mediaUrl);
    };

    // Grid column config
    const getColSpan = () => ({
        xs: 12,
        sm: 8,
        md: 6,
    });

    const hasContent = filteredFolders.length > 0 || filteredMedia.length > 0;

    // Tab items
    const tabItems = [
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
    ];

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
                    <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
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
                                        <HomeOutlined /> Root
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
                    <Spin spinning={isLoading}>
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
                                                        <SimpleFolderCard
                                                            folder={folder}
                                                            onOpen={handleOpenFolder}
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
                                                    <Col key={media.id} {...getColSpan()}>
                                                        <SelectableMediaCard
                                                            media={media}
                                                            selected={isMediaSelected(media)}
                                                            onSelect={handleMediaSelect}
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </Spin>
                </>
            )}
        </div>
    );
};

/**
 * MediaGalleryPickerModal - Modal wrapper for MediaGalleryPicker
 * Use this when you want the picker to open in a modal dialog
 * 
 * @param {boolean} open - Modal visibility
 * @param {function} onCancel - Called when modal is closed
 * @param {function} onSelect - Called with selected URL(s) when confirmed
 * @param {boolean} multiple - Allow multiple selection
 * @param {number} maxCount - Maximum selection count
 * @param {string} title - Modal title
 */
export const MediaGalleryPickerModal = ({
    open,
    onCancel,
    onSelect,
    multiple = false,
    maxCount = 10,
    title = 'Select Media',
    value,
}) => {
    const [tempSelection, setTempSelection] = useState(value);

    // Reset temp selection when modal opens
    useEffect(() => {
        if (open) {
            setTempSelection(value);
        }
    }, [open, value]);

    const handleConfirm = () => {
        onSelect?.(tempSelection);
        onCancel?.();
    };

    const hasSelection = multiple
        ? (Array.isArray(tempSelection) && tempSelection.length > 0)
        : !!tempSelection;

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            okText="Select"
            okButtonProps={{ disabled: !hasSelection }}
            width={800}
            style={{ top: 20 }}
            styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
        >
            <MediaGalleryPicker
                multiple={multiple}
                maxCount={maxCount}
                value={tempSelection}
                onChange={setTempSelection}
            />
        </Modal>
    );
};

export default MediaGalleryPicker;

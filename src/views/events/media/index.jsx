import React, { useState, useMemo } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Spin,
    Empty,
    Modal,
    Skeleton,
    Divider,
} from 'antd';
import {
    ExclamationCircleOutlined,
} from '@ant-design/icons';

// Components
import FolderCard from './components/FolderCard';
import MediaCard from './components/MediaCard';
import FolderModal from './components/FolderModal';
import MediaUploadModal from './components/MediaUploadModal';
import MediaPreviewModal from './components/MediaPreviewModal';
import Breadcrumb from './components/Breadcrumb';
import Toolbar from './components/Toolbar';
import StorageStats from './components/StorageStats';

// Hooks
import {
    useMediaCategories,
    useChildCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useMoveCategory,
} from './hooks/useMediaCategories';
import {
    useBulkUploadMedia,
    useDeleteMedia,
    useBulkDeleteMedia,
    useMoveMedia,
} from './hooks/useMedia';
import { ROW_GUTTER } from 'constants/ThemeConstant';

const { Title, Text } = Typography;
const { confirm } = Modal;

const MediaGallery = () => {
    // State
    const [currentFolder, setCurrentFolder] = useState(null); // Current category ID
    const [folderPath, setFolderPath] = useState([]); // Breadcrumb path
    const [selectedMedia, setSelectedMedia] = useState([]); // Selected media IDs
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);

    // Queries - combined response with categories and media
    // Root level data (when currentFolder is null)
    const {
        data: rootData = { categories: [], media: [], parent: null },
        isLoading: rootLoading,
        refetch: refetchRoot
    } = useMediaCategories();

    // Child data (when inside a folder)
    const {
        data: childData = { categories: [], media: [], parent: null },
        isLoading: childLoading,
        refetch: refetchChild
    } = useChildCategories(currentFolder);

    // Mutations
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const moveCategoryMutation = useMoveCategory();
    const bulkUploadMutation = useBulkUploadMedia();
    const deleteMediaMutation = useDeleteMedia();
    const bulkDeleteMutation = useBulkDeleteMedia();
    const moveMediaMutation = useMoveMedia();

    const isLoading = rootLoading || childLoading;

    // Get current folders and media based on navigation state
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

    // Handlers
    const handleOpenFolder = (folder) => {
        setCurrentFolder(folder.id);
        setFolderPath((prev) => [...prev, folder]);
        setSelectedMedia([]);
        setSearchQuery('');
    };

    const handleBreadcrumbNavigate = (folder) => {
        if (folder === null) {
            // Go to root
            setCurrentFolder(null);
            setFolderPath([]);
        } else {
            // Go to specific folder
            const index = folderPath.findIndex((f) => f.id === folder.id);
            if (index !== -1) {
                setCurrentFolder(folder.id);
                setFolderPath(folderPath.slice(0, index + 1));
            }
        }
        setSelectedMedia([]);
        setSearchQuery('');
    };

    const handleCreateFolder = () => {
        setEditingFolder(null);
        setFolderModalOpen(true);
    };

    const handleEditFolder = (folder) => {
        setEditingFolder(folder);
        setFolderModalOpen(true);
    };

    const handleFolderSubmit = async (data, folderId) => {
        if (folderId) {
            // Update
            await updateCategoryMutation.mutateAsync({ id: folderId, data });
        } else {
            // Create
            const payload = { ...data };
            if (currentFolder) {
                payload.parent_id = currentFolder;
            }
            await createCategoryMutation.mutateAsync(payload);
        }
        setFolderModalOpen(false);
        setEditingFolder(null);
    };

    const handleDeleteFolder = (folder) => {
        confirm({
            title: 'Delete Folder',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete "${folder.name}"? This will also delete all media inside.`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                await deleteCategoryMutation.mutateAsync(folder.id);
            },
        });
    };

    const handleUpload = () => {
        setUploadModalOpen(true);
    };

    const handleUploadFiles = async (files) => {
        await bulkUploadMutation.mutateAsync({
            files,
            categoryId: currentFolder,
        });
        // Refresh data after upload
        handleRefresh();
    };

    const handleMediaSelect = (media) => {
        setSelectedMedia((prev) => {
            if (prev.includes(media.id)) {
                return prev.filter((id) => id !== media.id);
            }
            return [...prev, media.id];
        });
    };

    const handleMediaPreview = (media) => {
        setPreviewMedia(media);
        setPreviewModalOpen(true);
    };

    const handleDeleteMedia = (media) => {
        console.log(media);
        confirm({
            title: 'Delete File',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete "${media.file_name}"?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                await deleteMediaMutation.mutateAsync(media.id);
                setPreviewModalOpen(false);
                // Refresh data after delete
                handleRefresh();
            },
        });
    };

    const handleDeleteSelected = () => {
        if (selectedMedia.length === 0) return;

        confirm({
            title: 'Delete Selected Files',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to delete ${selectedMedia.length} file(s)?`,
            okText: 'Delete All',
            okType: 'danger',
            onOk: async () => {
                await bulkDeleteMutation.mutateAsync(selectedMedia);
                setSelectedMedia([]);
                // Refresh data after bulk delete
                handleRefresh();
            },
        });
    };

    const handleRefresh = () => {
        refetchRoot();
        if (currentFolder) {
            refetchChild();
        }
    };

    // Drag & Drop handlers
    const handleDropOnFolder = async (dragData, targetFolder) => {
        if (!dragData || !targetFolder) return;

        if (dragData.type === 'media') {
            // Moving media to folder - use ids array for multi-select
            const idsToMove = dragData.ids || [dragData.id];
            await moveMediaMutation.mutateAsync({
                mediaIds: idsToMove,
                categoryId: targetFolder.id,
            });
            // Clear selection after move
            setSelectedMedia([]);
        } else if (dragData.type === 'folder') {
            // Moving folder to another folder
            if (dragData.id === targetFolder.id) return; // Can't move to itself
            await moveCategoryMutation.mutateAsync({
                categoryId: dragData.id,
                parentId: targetFolder.id,
            });
        }
    };

    const handleDropOnRoot = async (dragData) => {
        if (!dragData) return;

        if (dragData.type === 'media') {
            // Moving media to root (null category) - use ids array for multi-select
            const idsToMove = dragData.ids || [dragData.id];
            await moveMediaMutation.mutateAsync({
                mediaIds: idsToMove,
                categoryId: null,
            });
            // Clear selection after move
            setSelectedMedia([]);
        } else if (dragData.type === 'folder') {
            // Moving folder to root (null parent)
            await moveCategoryMutation.mutateAsync({
                categoryId: dragData.id,
                parentId: null,
            });
        }
    };

    // Grid column config
    const getColSpan = () => ({
        xs: 12,
        sm: 8,
        md: 6,
        lg: 4,
        xl: 4,
    });

    const hasContent = filteredFolders.length > 0 || filteredMedia.length > 0;

    return (
        <Card
        className="media-gallery"
            // title="Media Gallery"
            // extra={
            // }
            // style={{ minHeight: 'calc(100vh - 180px)' }}
        >
                <Row gap={ROW_GUTTER}>
                    <Col xs={8} md={4}>
                      <Text>Media Gallery</Text>
                    </Col>
                    <Col xs={16} md={14}>
                    <Toolbar
                        onCreateFolder={handleCreateFolder}
                        onUpload={handleUpload}
                        onDeleteSelected={handleDeleteSelected}
                        onRefresh={handleRefresh}
                        selectedCount={selectedMedia.length}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        loading={isLoading}
                    />
                </Col>
                <Col xs={24} md={6}>
                    <StorageStats />
                </Col>
            </Row>
            <div className="d-block d-sm-none">
                <Divider className='mb-0'/>
            </div>
            {/* Breadcrumb */}
            <Breadcrumb
                path={folderPath}
                onNavigate={handleBreadcrumbNavigate}
                onDropOnRoot={handleDropOnRoot}
                onDropOnFolder={handleDropOnFolder}
            />

            {/* Content */}
            <Spin spinning={isLoading}>
                {!hasContent && !isLoading ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            searchQuery
                                ? 'No results found'
                                : 'No folders or files yet'
                        }
                        style={{ padding: '60px 0' }}
                    />
                ) : (
                    <>
                        {/* Folders Row */}
                        {filteredFolders && filteredFolders.length > 0 && (
                            <>
                                {/* add name with divider  , use antd divider*/}

                                <Divider> <Text className='fw-bold'>Folders</Text> </Divider>
                                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                    {filteredFolders.map((folder) => (
                                        <Col key={folder.id} {...getColSpan()}>
                                            <FolderCard
                                                folder={folder}
                                                onOpen={handleOpenFolder}
                                                onEdit={handleEditFolder}
                                                onDelete={handleDeleteFolder}
                                                onDrop={handleDropOnFolder}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}

                        {/* Media Files Row */}
                        {filteredMedia && filteredMedia.length > 0 && (
                            <>
                                <Divider> <Text className='fw-bold'>Media Files</Text> </Divider>
                                <Row gutter={[16, 16]}>
                                    {filteredMedia.map((media) => (
                                        <Col key={media.id} {...getColSpan()}>
                                            <MediaCard
                                                media={media}
                                                selected={selectedMedia.includes(media.id)}
                                                onSelect={handleMediaSelect}
                                                onPreview={handleMediaPreview}
                                                onDelete={handleDeleteMedia}
                                                selectionMode={selectedMedia.length > 0}
                                                selectedMediaIds={selectedMedia}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}

                        {/* Loading skeleton */}
                        {isLoading && (
                            <Row gutter={[16, 16]}>
                                {[1, 2, 3, 4].map((i) => (
                                    <Col key={`skeleton-${i}`} {...getColSpan()}>
                                        <Card style={{ background: '#1f1f1f' }}>
                                            <Skeleton active paragraph={{ rows: 2 }} />
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </>
                )}
            </Spin>

            {/* Modals */}
            <FolderModal
                open={folderModalOpen}
                onCancel={() => {
                    setFolderModalOpen(false);
                    setEditingFolder(null);
                }}
                onSubmit={handleFolderSubmit}
                folder={editingFolder}
                loading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                parentId={currentFolder}
            />

            <MediaUploadModal
                open={uploadModalOpen}
                onCancel={() => setUploadModalOpen(false)}
                onUpload={handleUploadFiles}
                categoryId={currentFolder}
                loading={bulkUploadMutation.isPending}
            />

            <MediaPreviewModal
                open={previewModalOpen}
                onCancel={() => {
                    setPreviewModalOpen(false);
                    setPreviewMedia(null);
                }}
                media={previewMedia}
                mediaList={filteredMedia}
                onDelete={handleDeleteMedia}
            />
        </Card>
    );
};

export default MediaGallery;

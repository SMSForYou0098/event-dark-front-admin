import React, { useState } from 'react';
import { Modal, List, Typography, Empty, Button } from 'antd';
import { FolderFilled, HomeFilled } from '@ant-design/icons';
import Loader from 'utils/Loader';
import { useMediaCategories } from '../hooks/useMediaCategories';

const { Text } = Typography;

/**
 * MoveToFolderModal - Lets user pick a destination folder to move selected media into.
 *
 * @param {boolean} open
 * @param {function} onCancel
 * @param {function} onConfirm - Called with targetFolderId (null for root)
 * @param {number} selectedCount - Number of files being moved
 * @param {boolean} loading - Whether the move operation is in progress
 * @param {number|null} currentFolderId - Current folder to exclude from the list
 */
const MoveToFolderModal = ({
    open,
    onCancel,
    onConfirm,
    selectedCount = 0,
    loading = false,
    currentFolderId = null,
}) => {
    const [selectedFolder, setSelectedFolder] = useState(undefined); // undefined = none picked, null = root
    const { data: rootData = { categories: [] }, isLoading: foldersLoading } = useMediaCategories();

    const folders = (rootData.categories || []).filter(f => f.id !== currentFolderId);

    const handleConfirm = () => {
        if (selectedFolder === undefined) return;
        onConfirm(selectedFolder);
    };

    // Reset selection when modal opens/closes
    React.useEffect(() => {
        if (open) {
            setSelectedFolder(undefined);
        }
    }, [open]);

    return (
        <Modal
            title={`Move ${selectedCount} file${selectedCount !== 1 ? 's' : ''} to folder`}
            open={open}
            onCancel={onCancel}
            width={420}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={handleConfirm}
                        disabled={selectedFolder === undefined}
                        loading={loading}
                    >
                        Move
                    </Button>
                </div>
            }
            destroyOnClose
        >
            {foldersLoading ? (
                <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                    <Loader width={50} />
                </div>
            ) : (
                <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                    {/* Root option */}
                    <div
                        onClick={() => setSelectedFolder(null)}
                        style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            borderRadius: 8,
                            marginBottom: 4,
                            border: selectedFolder === null
                                ? '2px solid var(--primary-color)'
                                : '1px solid #303030',
                            background: selectedFolder === null
                                ? 'rgba(82, 196, 65, 0.08)'
                                : 'transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        <HomeFilled style={{ fontSize: 20, color: '#faad14' }} />
                        <Text strong>Root (No Folder)</Text>
                    </div>

                    {folders.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No other folders available"
                            style={{ padding: '20px 0' }}
                        />
                    ) : (
                        folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                    borderRadius: 8,
                                    marginBottom: 4,
                                    border: selectedFolder === folder.id
                                        ? '2px solid var(--primary-color)'
                                        : '1px solid #303030',
                                    background: selectedFolder === folder.id
                                        ? 'rgba(82, 196, 65, 0.08)'
                                        : 'transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <FolderFilled style={{ fontSize: 20, color: 'var(--primary-color)' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text ellipsis={{ tooltip: folder.name }} strong>
                                        {folder.name}
                                    </Text>
                                    {folder.media_count > 0 && (
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                            ({folder.media_count} files)
                                        </Text>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Modal>
    );
};

export default MoveToFolderModal;

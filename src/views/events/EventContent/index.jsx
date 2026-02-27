import React, { useState, useMemo, useCallback } from 'react';
import { Button, Card, Input, Table, Space, Popconfirm, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
    useGetAllContentMaster,
    useDeleteContentMaster,
} from './useContentMaster';
import { useMyContext } from 'Context/MyContextProvider';
import ContentFormModal from './ContentFormModal';
import PermissionChecker from 'layouts/PermissionChecker';

const ContentMaster = () => {
    const { UserData, userRole } = useMyContext();

    // ========================= STATE =========================
    const [modalVisible, setModalVisible] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [searchText, setSearchText] = useState('');

    // ========================= TANSTACK QUERY HOOKS =========================
    const { data: contentList = [], isLoading } = useGetAllContentMaster(UserData?.id, userRole);

    // ========================= FILTERED DATA =========================
    const filteredContentList = useMemo(() => {
        if (!searchText.trim()) return contentList;
        return contentList.filter((item) =>
            item.title?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [contentList, searchText]);

    const deleteMutation = useDeleteContentMaster();

    // ========================= MODAL HANDLERS =========================
    const handleModalClose = useCallback(() => {
        setModalVisible(false);
        setEditRecord(null);
    }, []);

    const handleModalOpen = useCallback(() => {
        setEditRecord(null);
        setModalVisible(true);
    }, []);

    const handleModalSuccess = useCallback(() => {
        setModalVisible(false);
        setEditRecord(null);
    }, []);

    // ========================= DELETE =========================
    const handleDelete = useCallback(
        (id) => {
            deleteMutation.mutate(id);
        },
        [deleteMutation]
    );

    // ========================= EDIT =========================
    const handleEdit = useCallback((record) => {
        setEditRecord(record);
        setModalVisible(true);
    }, []);

    // ========================= TABLE COLUMNS =========================
    const columns = useMemo(
        () => [
            {
                title: '#',
                render: (_, __, i) => i + 1,
                width: 60,
            },
            {
                title: 'Title',
                dataIndex: 'title',
                sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
            },
            {
                title: 'Type',
                dataIndex: 'type',
                width: 120,
                render: (text) => (
                    <span style={{ textTransform: 'capitalize' }}>{text || '-'}</span>
                ),
                filters: [
                    { text: 'Note', value: 'note' },
                    { text: 'Description', value: 'description' },
                ],
                onFilter: (value, record) => record.type === value,
            },
            {
                title: 'Content',
                dataIndex: 'content',
                ellipsis: true,
                render: (text) => {
                    // Strip HTML tags and truncate
                    const plainText = text?.replace(/<[^>]*>/g, '') || '';
                    const truncated = plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
                    return truncated;
                },
            },
            {
                title: 'Action',
                align: 'center',
                width: 120,
                render: (_, record) => (
                    <Space>
                        <PermissionChecker permission="Update Content Master">
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            />
                        </PermissionChecker>
                        <PermissionChecker permission="Delete Content Master">
                            <Popconfirm
                                title="Delete this content?"
                                onConfirm={() => handleDelete(record.id)}
                            >
                                <Button danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </PermissionChecker>
                    </Space>
                ),
            },
        ],
        [handleEdit, handleDelete]
    );

    // ========================= RENDER =========================
    return (
        <Card
            bordered={false}
            title="Content Master"
            extra={
                <Space>
                    <Input.Search
                        placeholder="Search by title"
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <PermissionChecker permission="Create Content Master">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleModalOpen}
                        >
                            Add New Content
                        </Button>
                    </PermissionChecker>
                </Space>
            }
        >
            <Spin spinning={isLoading}>
                <Table
                    rowKey="id"
                    dataSource={filteredContentList}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                />
            </Spin>

            <ContentFormModal
                open={modalVisible}
                onClose={handleModalClose}
                editRecord={editRecord}
                onSuccess={handleModalSuccess}
            />
        </Card>
    );
};

export default ContentMaster;
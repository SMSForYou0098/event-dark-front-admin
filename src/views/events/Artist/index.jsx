import React, { useCallback, useMemo, useState } from 'react';
import { Button, Image, message, Modal, Space, Tooltip } from 'antd';
import { User, Trash2, Pencil } from 'lucide-react';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { PlusOutlined } from '@ant-design/icons';
import ArtistModal from './artistModal';
import PermissionChecker from 'layouts/PermissionChecker';

const Artist = () => {
  const { api: apiUrl, UserPermissions, authToken, UserData } = useMyContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedData, setSelectedData] = useState(null);
  const [error, setError] = useState(null);

  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Fetch artists with React Query
  const fetchData = async () => {
    const params = new URLSearchParams();

    // Pagination params
    params.set("page", currentPage.toString());
    params.set("per_page", pageSize.toString());

    // Search param
    if (searchText) {
      params.set("search", searchText);
    }

    // Sorting params
    if (sortField && sortOrder) {
      params.set("sort_by", sortField);
      params.set("sort_order", sortOrder === "ascend" ? "asc" : "desc");
    }

    const url = `/artist-list/${UserData?.id}?${params.toString()}`;
    const response = await api.get(url);

    // Extract pagination data from response
    const paginationData = response.pagination || {
      current_page: currentPage,
      per_page: pageSize,
      total: response.data?.length || 0,
      last_page: 1,
    };

    return { artists: response.data || [], pagination: paginationData };
  };

  const {
    data: artistsData = { artists: [], pagination: null },
    isLoading: loading,
    error: artistError,
    refetch
  } = useQuery({
    queryFn: fetchData,
    enabled: !!authToken && !!apiUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    queryKey: ['artists', UserData?.id, currentPage, pageSize, searchText, sortField, sortOrder],
    onError: (err) => {
      setError(err.response?.data?.error || err.message || "Failed to fetch artists");
      message.error(err.response?.data?.error || err.message || "Failed to fetch artists");
    }
  });

  // Extract artists and pagination from query data
  const artists = useMemo(() => artistsData.artists || [], [artistsData.artists]);
  const pagination = artistsData.pagination;

  // Handle pagination change (for backend pagination)
  const handlePaginationChange = useCallback((page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  }, [pageSize]);

  // Handle search change (for backend search)
  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  // Handle sort change (for backend sorting)
  const handleSortChange = useCallback((field, order) => {
    setSortField(field || null);
    setSortOrder(order || null);
  }, []);

  const columns = [
    {
      title: '#',
      width: 50,
      render: (_, __, index) => index + 1,
      searchable: false,
    },
    {
      title: 'Photo',
      dataIndex: 'photo',
      key: 'photo',
      width: 100,
      render: (photo) => photo ? <Image src={photo} alt="Thumbnail" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }} /> : 'N/A',
      searchable: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name?.localeCompare(b.name),
      searchable: true,
      render: (name) => (
        <div style={{ display: 'flex', alignItems: 'left', gap: 8, justifyContent: 'left' }}>
          <User size={16} className="text-primary" />
          <span>{name}</span>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      sorter: (a, b) => a.type?.localeCompare(b.type),
      searchable: true,
      render: (type) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <User size={16} className="text-primary" />
          <span>{type}</span>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      sorter: (a, b) => a.category?.localeCompare(b.category),
      searchable: true,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => {
        const isDisabled = record?.is_deleted || record?.status === "1";

        const actions = [
          {
            permission: "Update Artist",
            tooltip: "Update Artist",
            icon: <Pencil size={14} />,
            onClick: () => handleEdit(record),
            type: "default",
          },
          {
            permission: "Delete Artist",
            tooltip: "Delete Artist",
            icon: <Trash2 size={14} />,
            onClick: () => handleDelete(record.id),
            type: "primary",
            danger: true,
            // loading: deleteUserMutation.isPending,
          },
        ];

        return (
          <div className="action-btn">
            <Space>
              {actions.map((action, index) => (
                <PermissionChecker key={index} permission={action.permission}>
                  <Tooltip title={action.tooltip}>
                    <Button
                      size="small"
                      type={action.type}
                      danger={action.danger}
                      icon={action.icon}
                      onClick={action.onClick}
                      disabled={isDisabled}
                      loading={action.loading}
                    />
                  </Tooltip>
                </PermissionChecker>
              ))}
            </Space>
          </div>
        );
      }
    }
  ];


  // Delete user mutation
  const DeleteMethod = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`artist-destroy/${id}`);
      return res.data;
    },
    onSuccess: () => {
      refetch();
      message.success("Artist Deleted successfully.");
    },
    onError: (err) => {
      message.error(
        err.response?.data?.message || err.message || "An error occurred"
      );
    },
  });


  const handleDelete = useCallback((id) => {
    if (!id) return;

    Modal.confirm({
      title: 'Are you sure?',
      content: "You won't be able to revert this!",
      okText: 'Yes, delete it!',
      cancelText: 'Cancel',
      centered: true,
      confirmLoading: loading,
      onOk: () => {
        // loading(true);
        DeleteMethod.mutate(id);
      }
    });
  }, [loading, DeleteMethod]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (venue) => {
    setSelectedData(venue);
    setModalMode('edit');

    // Delay opening modal to ensure state is updated
    setTimeout(() => {
      setIsModalOpen(true);
    }, 10); // Even 10ms is enough
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedData(null);
    refetch()
  };

  return (
    <>
      <ArtistModal
        open={isModalOpen}
        onCancel={handleModalClose}
        mode={modalMode}
        initialValues={selectedData}
      />

      <DataTable
        title="Artist"
        data={artists}
        columns={columns}
        addButtonProps={null}
        enableExport={true}
        exportRoute={'export-artists'}
        ExportPermission={UserPermissions?.includes("Export Artists")}
        authToken={authToken}
        loading={loading}
        // Backend pagination props
        serverSide={true}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onSearch={handleSearchChange}
        onSortChange={handleSortChange}
        searchValue={searchText}
        extraHeaderContent={
          <PermissionChecker permission="Create Artist">
            <Tooltip title="Create Artist">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              />
            </Tooltip>
          </PermissionChecker>
        }
        error={artistError || error}
        tableProps={{
          scroll: { x: 1200 },
          size: "middle",
        }}
      >
      </DataTable>
    </>
  );
};

export default Artist;
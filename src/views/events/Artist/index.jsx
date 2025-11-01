import React, { useCallback, useState } from 'react';
import { Button, Image, message, Modal, Space, Tooltip } from 'antd';
import { User, Trash2, Pencil } from 'lucide-react';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { PlusOutlined } from '@ant-design/icons';
import ArtistModal from './artistModal';

const Artist = () => {
  const { api: apiUrl, UserPermissions, authToken, UserData } = useMyContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedData, setSelectedData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch organizers with React Query
  const fetchData = async () => {
    const url = `/artist-list/${UserData?.id}`;
    const response = await api.get(url);
    if (!response.status) {
      throw new Error('Failed to fetch organizers');
    }
    return response.data || [];
  };

  const {
    data: venues = [],
    isLoading: loading,
    error: organizersError,
    refetch
  } = useQuery({
    queryFn: fetchData,
    enabled: !!authToken && !!apiUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    queryKey: ['artists', UserData?.id],
    // refetchOnMount: "ifStale",
    // refetchOnWindowFocus: true,
    // refetchOnReconnect: true,
    onError: (err) => {
      setError(err.response?.data?.error || err.message || "Failed to fetch organizers");
      message.error(err.response?.data?.error || err.message || "Failed to fetch organizers");
    }
  });

  const columns = [
    {
      title: '#',
      render: (_, __, index) => index + 1,
      searchable: false,
    },
    {
      title: 'Photo',
      dataIndex: 'photo',
      key: 'photo',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <User size={16} className="text-primary" />
          <span>{name}</span>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => a.category?.localeCompare(b.category),
      searchable: true,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => {
        const isDisabled = record?.is_deleted || record?.status === "1";

        const actions = [
          {
            // permission: "Update Venue",
            tooltip: "Update Venue",
            icon: <Pencil size={14} />,
            onClick: () => handleEdit(record),
            type: "default",
          },
          {
            // permission: "Delete Venue",
            tooltip: "Delete Venue",
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
                // <PermissionChecker key={index} permission={action.permission}>
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
                // </PermissionChecker>
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
  }, [loading,DeleteMethod]);

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
        data={venues}
        columns={columns}
        addButtonProps={null}
        enableExport={true}
        exportRoute={'export-organizers'}
        ExportPermission={UserPermissions?.includes("Export Organizers")}
        authToken={authToken}
        loading={loading}
        extraHeaderContent={
          // <PermissionChecker permission="Create Venue">
          <Tooltip title="Create Artist">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            />
          </Tooltip>
          // </PermissionChecker>
        }
        error={organizersError || error}
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
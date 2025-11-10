import React, { useCallback, useState } from 'react';
import { Button, Image, message, Modal, Space, Tooltip } from 'antd';
import { User, Trash2, Pencil, Eye } from 'lucide-react';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { PlusOutlined } from '@ant-design/icons';
import VenueModal from './VaneModal';
import PermissionChecker from 'layouts/PermissionChecker';

const Venues = () => {
  const { api: apiUrl, UserPermissions, authToken, UserData , isMobile } = useMyContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [error, setError] = useState(null);
const [mapModalVisible, setMapModalVisible] = useState(false);
const [selectedMapUrl, setSelectedMapUrl] = useState('');

  // Fetch organizers with React Query
  const fetchVenue = async () => {
    const url = `/venue-list/${UserData?.id}`;
    const response = await api.get(url);
    if (!response.status) {
      throw new Error('Failed to fetch organizers');
    }
    return response.data || [];
  };
  const handleViewMap = (record) => {
  if (record.aembeded_code) {
    // Extract src URL from iframe string
    const srcMatch = record.aembeded_code.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      setSelectedMapUrl(srcMatch[1]);
      setMapModalVisible(true);
    } else {
      message.error('Invalid map code');
    }
  } else {
    message.warning('No map available for this location');
  }
};

  const {
    data: venues = [],
    isLoading: loading,
    error: organizersError,
    refetch
  } = useQuery({
    queryFn: fetchVenue,
    enabled: !!authToken && !!apiUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    queryKey: ['venue', UserData?.id],
    onError: (err) => {
      setError(err.response?.data?.error || err.message || "Failed to fetch organizers");
      message.error(err.response?.data?.error || err.message || "Failed to fetch organizers");
    }
  });
  const columns = [
    {
      title: '#',
      width: isMobile ? 20 : 50,
      render: (_, __, index) => index + 1,
      searchable: false,
    },
    {
      title: 'Thumb',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
       width: 80,
      render: (thumbnail) => thumbnail ? <Image src={thumbnail} alt="Thumbnail" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }} /> : 'N/A',
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
      title: 'Organisation',
      dataIndex: 'organisation',
      key: 'organisation',
      sorter: (a, b) => a.organisation?.localeCompare(b.organisation),
      searchable: true,
      render: (organisation) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <User size={16} className="text-primary" />
          <span>{organisation}</span>
        </div>
      )
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      searchable: true,
      render: (address) => address || 'N/A'
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      searchable: true,
      render: (city) => city || 'N/A'
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      searchable: true,
      render: (state) => state || 'N/A'
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
            permission: "View Location",
            tooltip: "View Location",
            icon: <Eye size={14} />,
            onClick: () => handleViewMap(record),
            type: "default",
          },
          {
            permission: "Update Venue",
            tooltip: "Update Venue",
            icon: <Pencil size={14} />,
            onClick: () => handleEdit(record),
            type: "default",
          },
          {
            permission: "Delete Venue",
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
      const res = await api.delete(`venue-destroy/${id}`);
      return res.data;
    },
    onSuccess: () => {
      refetch();
      message.success("Venue Deleted successfully.");
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
    setSelectedVenue(null);
    setIsModalOpen(true);
  };

  const handleEdit = (venue) => {
    setModalMode('edit');
    setSelectedVenue(venue);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVenue(null);
    refetch()
  };
  
  return (
    <>
     <Modal
      title="Location Map"
      open={mapModalVisible}
      onCancel={() => {
        setMapModalVisible(false);
        setSelectedMapUrl('');
      }}
      footer={null}
      width={900}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0 }
      }}
    >
      <div style={{ width: '100%', height: '500px' }}>
        <iframe
          src={selectedMapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Map Location"
        />
      </div>
    </Modal>
      <VenueModal
        open={isModalOpen}
        onCancel={handleModalClose}
        mode={modalMode}
        venueData={selectedVenue}
      />

      <DataTable
        title="Venues"
        data={venues}
        columns={columns}
        addButtonProps={null}
        enableExport={true}
        exportRoute={'export-venues'}
        ExportPermission={UserPermissions?.includes("Export Venues")}
        authToken={authToken}
        loading={loading}
        extraHeaderContent={
          <PermissionChecker permission="Create Venue">
          <Tooltip title="Create Venue">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            />
          </Tooltip>
           </PermissionChecker>
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

export default Venues;
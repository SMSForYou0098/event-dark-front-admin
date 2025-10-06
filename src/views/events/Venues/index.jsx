import React, { useState } from 'react';
import { Button, message, Space, Tooltip } from 'antd';
import { User, Trash2, Pencil } from 'lucide-react';
import { useMyContext } from '../../../Context/MyContextProvider';
import DataTable from '../common/DataTable';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';
import { PlusOutlined } from '@ant-design/icons';
import UseNavigation from 'utils/customNavigation';
import VenueModal from './VaneModal';

const Venues = () => {
    const {api: apiUrl,UserPermissions,authToken,UserData} = useMyContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [error, setError] = useState(null);

    // Fetch organizers with React Query
    const fetchOrganizers = async () => {
        const url = `/venue-list/${UserData?.id}`;
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
    } = useQuery({
        queryFn: fetchOrganizers,
        enabled: !!authToken && !!apiUrl,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        refetchOnMount: "ifStale",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
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
            title : 'Thumbnail',
            dataIndex: 'thumbnail',
            key: 'thumbnail',
            render: (thumbnail) => thumbnail ? <img src={thumbnail} alt="Thumbnail" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }} /> : 'N/A',
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
                // permission: "Update Venue",
                tooltip: "Update Venue",
                icon: <Pencil size={14} />,
                onClick : () => handleEdit(record),
                type: "default",
              },
              {
                // permission: "Delete Venue",
                tooltip: "Delete Venue",
                icon: <Trash2 size={14} />,
                // onClick: () => handleDelete(record.id),
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
    // Refresh your venue list here if needed
  };
    return (
        <>
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
                exportRoute={'export-organizers'}
                ExportPermission={UserPermissions?.includes("Export Organizers")}
                authToken={authToken}
                loading={loading}
                extraHeaderContent={
                    // <PermissionChecker permission="Create Venue">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                        >
                            Add Venue
                        </Button>
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

export default Venues;
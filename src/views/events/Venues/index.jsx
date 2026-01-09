import React, { useCallback, useMemo, useState } from 'react';
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
  const { api: apiUrl, UserPermissions, authToken, UserData, isMobile, userRole } = useMyContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [error, setError] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedMapUrl, setSelectedMapUrl] = useState('');
  const isAdmin = userRole === 'Admin';
  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Fetch venues with React Query
  const fetchVenue = async () => {
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

    const url = `/venues?${params.toString()}`;
    const response = await api.get(url);
    if (!response.status) {
      throw new Error('Failed to fetch venues');
    }

    // Extract pagination data from response
    const paginationData = response.pagination || {
      current_page: currentPage,
      per_page: pageSize,
      total: response.data?.length || 0,
      last_page: 1,
    };

    return { venues: response.data || [], pagination: paginationData };
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
    data: venuesData = { venues: [], pagination: null },
    isLoading: loading,
    error: venuesError,
    refetch
  } = useQuery({
    queryFn: fetchVenue,
    enabled: !!authToken && !!apiUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    queryKey: ['venue', UserData?.id, currentPage, pageSize, searchText, sortField, sortOrder],
    onError: (err) => {
      setError(err.response?.data?.error || err.message || "Failed to fetch venues");
      message.error(err.response?.data?.error || err.message || "Failed to fetch venues");
    }
  });

  // Extract venues and pagination from query data
  const venues = useMemo(() => venuesData.venues || [], [venuesData.venues]);
  const pagination = venuesData.pagination;

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
    ...(isAdmin ? [{
      title: 'Organisation',
      dataIndex: ['user', 'organisation'],
      key: 'organisation',
      sorter: (a, b) => a.user?.organisation?.localeCompare(b.user?.organisation),
      searchable: true,
      render: (organisation) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <User size={16} className="text-primary" />
          <span>{organisation || 'N/A'}</span>
        </div>
      )
    }] : []),
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
        const isDeleted = record?.is_deleted || record?.status === "1";
        // Check if user owns this venue (admin can access all, others only their org's venues)
        const isOwnVenue = isAdmin || String(record?.org_id) === String(UserData?.id);
        const isDisabled = isDeleted || !isOwnVenue;

        const actions = [
          {
            permission: null,
            tooltip: "View Location",
            icon: <Eye size={14} />,
            onClick: () => handleViewMap(record),
            type: "default",
            disabled: false, // View is always allowed
          },
          {
            permission: "Update Venue",
            tooltip: isOwnVenue ? "Update Venue" : "You can only edit your own venues",
            icon: <Pencil size={14} />,
            onClick: () => handleEdit(record),
            type: "default",
            disabled: isDisabled,
          },
          {
            permission: "Delete Venue",
            tooltip: isOwnVenue ? "Delete Venue" : "You can only delete your own venues",
            icon: <Trash2 size={14} />,
            onClick: () => handleDelete(record.id),
            type: "primary",
            danger: true,
            disabled: isDisabled,
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
                      disabled={action.disabled}
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
  }, [loading, DeleteMethod]);

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
        ExportPermission={userRole === "Admin" || UserPermissions?.includes("Export Venues")}
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
        error={venuesError || error}
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
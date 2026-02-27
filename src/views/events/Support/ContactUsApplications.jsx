import React, { useState, useCallback } from 'react';
import { Button, Space, Modal, Image, Tag, Descriptions, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyContext } from '../../../Context/MyContextProvider';
import { Eye, Trash2, AlertCircle } from 'lucide-react';
import DataTable from '../common/DataTable';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const ContactUsApplications = () => {
  const { UserData, formatDateTime, truncateString, UserPermissions } = useMyContext();
  const [dateRange, setDateRange] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const queryClient = useQueryClient();

  // Fetch contact applications using TanStack Query
  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contactApplications', UserData?.id, dateRange],
    queryFn: async () => {
      const queryParams = dateRange
        ? `?date=${dateRange.startDate},${dateRange.endDate}`
        : '';
      const url = `contac-list${queryParams}`;

      const response = await api.get(url);

      if (response.status) {
        const data = response.data || [];
        // Sort by latest first
        data.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        return data;
      } else {
        throw new Error(response?.message || 'Failed to fetch contact applications');
      }
    },
    enabled: !!UserData?.id,
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`contact-application/${id}`);
    },
    onSuccess: (res) => {
      if (res.status) {
        queryClient.invalidateQueries(['contactApplications']);
        Modal.success({
          title: 'Deleted Successfully',
          content: 'Contact application deleted successfully.',
        });
      } else {
        message.error(Utils.getErrorMessage(res) || 'Failed to delete application');
      }
    },
    onError: (err) => {
      message.error(Utils.getErrorMessage(err) || 'Failed to delete application');
    },
  });

  const handleView = useCallback((application) => {
    setSelectedApplication(application);
    setShowViewModal(true);
  }, []);

  const handleImagePreview = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  }, []);

  const handleDelete = useCallback(
    (id, name) => {
      Modal.confirm({
        title: 'Delete Application?',
        content: `Are you sure you want to delete the application from "${name}"?`,
        icon: <AlertCircle size={24} color="#ff4d4f" />,
        okText: 'Yes, Delete',
        cancelText: 'Cancel',
        onOk: () => {
          deleteMutation.mutate(id);
        },
      });
    },
    [deleteMutation]
  );

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setDateRange(null);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      searchable: true,
      render: (name) => name || 'N/A',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
      searchable: true,
      render: (email) => email || 'N/A',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Phone',
      dataIndex: 'number',
      key: 'number',
      align: 'center',
      searchable: true,
      render: (number) => number || 'N/A',
    },
    {
      title: 'Query Type',
      dataIndex: ['query_relation', 'title'],
      key: 'queryType',
      align: 'center',
      searchable: true,
      render: (_, record) => (
        <Tag color="blue">{record?.query_relation?.title || 'N/A'}</Tag>
      ),
      sorter: (a, b) =>
        (a?.query_relation?.title || '').localeCompare(
          b?.query_relation?.title || ''
        ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      align: 'center',
      searchable: true,
      render: (message) => (
        <span title={message}>{truncateString(message, 50) || 'N/A'}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center',
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      align: 'center',
      render: (image) =>
        image ? (
          <Image
            src={image}
            alt="Contact"
            width={50}
            height={50}
            style={{
              objectFit: 'cover',
              borderRadius: 4,
              cursor: 'pointer',
              border: '1px solid #ddd',
            }}
            preview={false}
            onClick={() => handleImagePreview(image)}
          />
        ) : (
          <Tag color="default">No Image</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => handleView(record)}
            title="View Details"
          />
          <Button
            danger
            size="small"
            icon={<Trash2 size={14} />}
            onClick={() => handleDelete(record.id, record.name)}
            loading={deleteMutation.isPending}
            title="Delete Application"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Customer Inquiries"
        data={applications}
        columns={columns}
        showDateRange={true}
        showRefresh={true}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        loading={isLoading || deleteMutation.isPending}
        error={isError ? error : null}
        enableSearch={true}
        showSearch={true}
        enableExport={true}
        exportRoute="contact-applications-export"
        ExportPermission={UserPermissions?.includes('Export Contact Applications')}
        onRefresh={refetch}
        emptyText="No contact applications found"
      />

      {/* Full Application View Modal */}
      <Modal
        title="Application Details"
        open={showViewModal}
        onCancel={() => setShowViewModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowViewModal(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedApplication && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Name">
              {selectedApplication.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedApplication.email || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedApplication.number || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {selectedApplication.address || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Query Type">
              <Tag color="blue">
                {selectedApplication.query_relation?.title || 'N/A'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Message">
              {selectedApplication.message || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {formatDateTime(selectedApplication.created_at)}
            </Descriptions.Item>
            {selectedApplication.image && (
              <Descriptions.Item label="Image">
                <Image
                  src={selectedApplication.image}
                  alt="Application"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: 8,
                  }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        title="Image Preview"
        open={showImageModal}
        onCancel={() => setShowImageModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowImageModal(false)}>
            Close
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedImage && (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={selectedImage}
              alt="Contact Submission"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ContactUsApplications;

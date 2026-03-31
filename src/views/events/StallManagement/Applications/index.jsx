import React, { useState } from 'react';
import { Card, Button, Space, Tag, Modal, Tooltip, Badge, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import DataTable from 'views/events/common/DataTable';
import { useStallApplications, useApproveApplication, useRejectApplication } from '../hooks/useStallHooks';
import dayjs from 'dayjs';
import { PERMISSIONS } from 'constants/PermissionConstant';
import usePermission from 'utils/hooks/usePermission';

const StallApplications = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: '', order: '' });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const canUpdate = usePermission(PERMISSIONS.UPDATE_STALL_APPLICATIONS);

  const { data, isLoading, isError, error, refetch } = useStallApplications({
    page: pagination.current,
    pageSize: pagination.pageSize,
    search,
    sortField: sort.field,
    sortOrder: sort.order,
  });

  const { mutate: approve, isLoading: isApproving } = useApproveApplication();
  const { mutate: reject, isLoading: isRejecting } = useRejectApplication();

  const handleApprove = (id) => {
    Modal.confirm({
      title: 'Approve Application',
      content: 'Are you sure you want to approve this stall application?',
      onOk: () => approve(id),
      okText: 'Approve',
      okType: 'primary',
    });
  };

  const handleReject = (id) => {
    let reason = '';
    Modal.confirm({
      title: 'Reject Application',
      content: (
        <div className="mt-3">
          <p>Are you sure you want to reject this stall application?</p>
          <div className="mt-2 text-muted small uppercase font-weight-bold">Rejection Reason</div>
          <Input.TextArea
            rows={3}
            placeholder="Enter reason for rejection..."
            onChange={(e) => reason = e.target.value}
          />
        </div>
      ),
      onOk: () => {
        if (!reason.trim()) {
          message.warning('Please provide a reason for rejection');
          return Promise.reject();
        }
        reject({ id, reason });
      },
      okText: 'Reject',
      okType: 'danger',
    });
  };

  const showDetails = (record) => {
    setSelectedApplication(record);
    setIsDetailsModalVisible(true);
  };

  const columns = [
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendor_name',
      render: (text, record) => (
        <div>
          <div className="font-weight-bold">{record.vendor?.name || 'N/A'}</div>
          <div className="text-muted small">
            {record.vendor?.email} <br />
            {record.vendor?.number}
          </div>
        </div>
      ),
    },
    {
      title: 'Event',
      dataIndex: ['event', 'name'],
      key: 'event_name',
    },
    {
      title: 'Stall',
      dataIndex: ['stall_slot', 'slot_name'],
      key: 'slot_name',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD-MM-YYYY HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold';
        if (status === 'approved') color = 'green';
        if (status === 'rejected') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'pending' && canUpdate && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record.id)}
                  loading={isApproving}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record.id)}
                  loading={isRejecting}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="View Details">
            <Button
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => showDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Stall Applications"
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        error={error}
        serverSide={true}
        pagination={data?.pagination}
        onPaginationChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        onSearch={(value) => {
          setSearch(value);
          setPagination(prev => ({ ...prev, current: 1 }));
        }}
        onSortChange={(field, order) => {
          setSort({ field, order });
        }}
        onRefresh={refetch}
        showRefresh={true}
      />

      <Modal
        title="Application Details"
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedApplication && (
          <div className="py-2">
            <div className="mb-3">
              <div className="text-muted small uppercase font-weight-bold">Vendor Info</div>
              <div>{selectedApplication.vendor?.name} ({selectedApplication.vendor?.email})</div>
              <div>Phone: {selectedApplication.vendor?.number}</div>
            </div>

            <div className="mb-3">
              <div className="text-muted small uppercase font-weight-bold">Stall & Event</div>
              <div>Event: {selectedApplication.event?.name}</div>
              <div>Stall: {selectedApplication.stall_slot?.slot_name}</div>
            </div>

            <div className="mb-3">
              <div className="text-muted small uppercase font-weight-bold">Description</div>
              <div>{selectedApplication.product_description || 'No description provided'}</div>
            </div>

            {selectedApplication.notes && (
              <div className="mb-3">
                <div className="text-muted small uppercase font-weight-bold">Notes</div>
                <div>{selectedApplication.notes}</div>
              </div>
            )}

            <div className="mb-3">
              <div className="text-muted small uppercase font-weight-bold">Status</div>
              <Tag color={selectedApplication.status === 'approved' ? 'green' : selectedApplication.status === 'rejected' ? 'red' : 'gold'}>
                {selectedApplication.status.toUpperCase()}
              </Tag>
            </div>

            {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
              <div className="mt-3 p-3 bg-light border rounded">
                <div className="text-danger small uppercase font-weight-bold">Rejection Reason</div>
                <div>{selectedApplication.rejection_reason}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default StallApplications;

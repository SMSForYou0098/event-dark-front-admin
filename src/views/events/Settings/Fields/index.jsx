import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Table, Space, Tag, Modal, Typography, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HolderOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AddFields from './AddFields';
import { useMyContext } from 'Context/MyContextProvider';

const { confirm } = Modal;

// Draggable Row Component
const DraggableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style = {
    ...props.style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, (child) => {
        if (child.key === 'sort') {
          return React.cloneElement(child, {
            children: (
              <HolderOutlined
                ref={setActivatorNodeRef}
                style={{ cursor: 'grab', color: '#999' }}
                {...listeners}
              />
            ),
          });
        }
        return child;
      })}
    </tr>
  );
};

const AttendeeFields = () => {
  const { api, authToken } = useMyContext();
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState(null);
  const [editState, setEditState] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch fields with TanStack Query
  const { data: fieldsList = [], isLoading, isFetching } = useQuery({
    queryKey: ['attendee-fields'],
    queryFn: async () => {
      const response = await axios.get(`${api}fields-list`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data.customFields || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fieldId) => {
      const response = await axios.delete(`${api}field-delete/${fieldId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return response.data;
    },
    onSuccess: (data, fieldId) => {
      // Optimistically update the cache
      queryClient.setQueryData(['attendee-fields'], (old) =>
        old?.filter((item) => item.id !== fieldId) || []
      );
      message.success('The field has been deleted.');
    },
    onError: (error) => {
      console.error('Error deleting field:', error);
      message.error(error.response?.data?.message || 'Failed to delete field');
    },
  });

  // Rearrange mutation
  const rearrangeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(
        `${api}rearrange-CustomField`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Fields rearranged successfully');
    },
    onError: (error) => {
      console.error('Error rearranging fields:', error);
      message.error('Failed to save new order');
      // Refetch to revert changes
      queryClient.invalidateQueries(['attendee-fields']);
    },
  });

  const handleEdit = useCallback((item) => {
    setEditData(item);
    setEditState(true);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((fieldId) => {
    confirm({
      title: 'Are you sure?',
      icon: <ExclamationCircleOutlined />,
      content: "You won't be able to revert this!",
      okText: 'Yes, delete it!',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(fieldId),
    });
  }, [deleteMutation]);

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (!over || active.id === over.id) return;

      const oldIndex = fieldsList.findIndex((item) => item.id === active.id);
      const newIndex = fieldsList.findIndex((item) => item.id === over.id);

      const newList = arrayMove(fieldsList, oldIndex, newIndex);

      // Update sr_no for all items
      const updatedList = newList.map((item, index) => ({
        ...item,
        sr_no: index + 1,
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['attendee-fields'], updatedList);

      // Send to backend
      const backendData = updatedList.map((item) => ({
        id: item.id,
        sr_no: item.sr_no,
      }));

      rearrangeMutation.mutate(backendData);
    },
    [fieldsList, queryClient, rearrangeMutation]
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditState(false);
    setEditData(null);
  }, []);

  const handleSuccess = useCallback(() => {
    // Refetch in background without showing loading state
    queryClient.refetchQueries(['attendee-fields']);
  }, [queryClient]);

  const sortedFields = useMemo(
    () => [...fieldsList].sort((a, b) => (a.sr_no || 0) - (b.sr_no || 0)),
    [fieldsList]
  );

  const columns = useMemo(
    () => [
      {
        key: 'sort',
        align: 'center',
      },
      {
        title: 'Field Name',
        dataIndex: 'field_name',
        key: 'field_name',
        render: (text) => (
          <Typography.Text strong style={{ textTransform: 'capitalize' }}>
            {text}
          </Typography.Text>
        ),
      },
      {
        title: 'Required',
        dataIndex: 'field_required',
        key: 'field_required',
        align: 'center',
        render: (required) =>
          required === true ? (
            <Tag color="green">Yes</Tag>
          ) : (
            <Tag color="red">No</Tag>
          ),
      },
      {
        title: 'Fixed',
        dataIndex: 'fixed',
        key: 'fixed',
        align: 'center',
        render: (fixed) =>
          fixed === 1 ? (
            <Tag color="blue">Yes</Tag>
          ) : (
            <Tag color="orange">No</Tag>
          ),
      },
      {
        title: 'Field Type',
        dataIndex: 'field_type',
        key: 'field_type',
        render: (text) => (
          <Typography.Text type="secondary" style={{ textTransform: 'capitalize' }}>
            {text}
          </Typography.Text>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        render: (_, record) =>
          record.fixed !== 1 ? (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                loading={deleteMutation.isPending}
              />
            </Space>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
    ],
    [handleEdit, handleDelete, deleteMutation.isPending]
  );

  return (
    <>
      <AddFields
        open={modalOpen}
        onClose={handleModalClose}
        editData={editData}
        editState={editState}
        onSuccess={handleSuccess}
      />

      <Card
        title="Attendee Fields"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Add New Field
          </Button>
        }
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedFields.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={{
                body: {
                  row: DraggableRow,
                },
              }}
              rowKey="id"
              columns={columns}
              dataSource={sortedFields}
              loading={isLoading && !isFetching} // Only show loading on initial load
              pagination={false}
              locale={{
                emptyText: 'No fields found',
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>
    </>
  );
};

export default AttendeeFields;
import React, { useState } from 'react';
import { Avatar, Card, Typography, Button, Spin, Popconfirm, message, Row, Col } from 'antd';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CreatePromoteOrgModal from './CreatePromoteOrgModal';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';
import { PERMISSIONS } from 'constants/PermissionConstant';
import PermissionChecker from 'layouts/PermissionChecker';

const { Text } = Typography;

function SortableOrg({ id, name, thumbnail, index, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        // boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
        // background: isDragging ? 'var(--ant-color-fill-tertiary, #fafafa)' : undefined,
        transition,
        transform: CSS.Transform.toString(transform)
    };

    return (
        <Card ref={setNodeRef} style={style} {...attributes} classNames={{ body: 'py-2' }}>
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <span {...listeners} className="cursor-grab fs-5 text-muted mr-2">
                        <HolderOutlined />
                    </span>
                    <Avatar shape="square" size={48} src={thumbnail} alt={name} className='mr-2' />
                    <div className="d-flex flex-column">
                        <Text strong ellipsis>{name}</Text>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(id)}
                        size="small"
                    />
                    <Popconfirm
                        title="Remove Sponsored Organization"
                        description="Are you sure you want to remove this organization from sponsors?"
                        onConfirm={() => onDelete(id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        />
                    </Popconfirm>
                </div>
            </div>
        </Card>
    );
}

export default function PromoteOrgs() {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const queryClient = useQueryClient();

    // Fetch organizations
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['promote-orgs'],
        queryFn: async () => {
            const response = await api.get('/promote-orgs');
            return Array.isArray(response?.data) ? response.data : [];
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/promote-org/delete/${id}`, {
                is_deleted: 1
            });
        },
        onSuccess: () => {
            message.success('Organization removed from sponsors successfully');
            queryClient.invalidateQueries({ queryKey: ['promote-orgs'] });
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
        },
    });

    // Reorder mutation
    const reorderMutation = useMutation({
        mutationFn: async (newOrder) => {
            // Send array with {id, sr_no} format
            await api.post('/promote-org/reorder', {
                data: newOrder.map((item, index) => ({
                    id: item.id,
                    sr_no: index + 1  // sr_no starts from 1
                }))
            });
        },
        onSuccess: () => {
            message.success('Order updated successfully');
            queryClient.invalidateQueries({ queryKey: ['promote-orgs'] });
        },
        onError: (error) => {
            message.error(Utils.getErrorMessage(error));
        },
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Optimistically update UI
            queryClient.setQueryData(['promote-orgs'], newItems);

            // Save new order to backend
            reorderMutation.mutate(newItems);
        }
    };

    const handleEdit = (id) => {
        const org = items.find(item => item.id === id);
        setEditingOrg(org);
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingOrg(null);
    };

    const handleModalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['promote-orgs'] });
        handleModalClose();
    };

    return (
        <PermissionChecker permission={PERMISSIONS.VIEW_PROMOTE_ORGS}>
            <Card
                title="Promoted Organizations (drag card handle to reorder)"
                extra={<Button type="primary" onClick={() => setModalOpen(true)}>Create New</Button>}
                className="mb-4"
            >
                {isLoading ? (
                    <div className="text-center">
                        <Spin />
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                            <Row gutter={[16, 16]}>
                                {items.map((item, idx) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                                        <SortableOrg
                                            id={item.id}
                                            name={item?.org?.organisation}
                                            thumbnail={item.image}
                                            index={idx}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </SortableContext>
                    </DndContext>
                )}
            </Card>
            <CreatePromoteOrgModal
                visible={modalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                editingOrg={editingOrg}
            />
        </PermissionChecker>
    );
}
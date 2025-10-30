import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Card, Typography, Button, Spin } from 'antd';
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
import { HolderOutlined } from '@ant-design/icons';
import CreatePromoteOrgModal from './CreatePromoteOrgModal';
import api from 'auth/FetchInterceptor';

const { Text } = Typography;

function SortableOrg({ id, name, thumbnail, index }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        border: '1px solid var(--ant-color-border)',
        borderRadius: 8,
        boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
        background: isDragging ? 'var(--ant-color-fill-tertiary, #fafafa)' : undefined,
        userSelect: 'none',
        touchAction: 'pan-x pan-y',
        minHeight: 68,
        minWidth: 0,
        transition,
        transform: CSS.Transform.toString(transform),
    };

    return (
        <Card ref={setNodeRef} style={style} {...attributes}>
            <span {...listeners} style={{ cursor: 'grab', fontSize: 22, marginRight: 6, color: '#bbb', lineHeight: 0 }}>
                <HolderOutlined />
            </span>
            <Avatar shape="square" size={48} src={thumbnail} alt={name} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Text strong ellipsis>{name}</Text>
                <Text type="secondary">Position: {index + 1}</Text>
            </div>
        </Card>
    );
}

export default function PromoteOrgs() {
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/promote-orgs'); // Expected [{id, name, thumbnail}]
            setItems(Array.isArray(data?.data) ? data?.data : []);
            console.log('data',data)
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
            // Optionally: Send new order to backend here
        }
    };

    return (
        <>
            <Card
                title="Promoted Organizations (drag card handle to reorder)"
                extra={<Button type="primary" onClick={() => setModalOpen(true)}>Create New</Button>}
                style={{ marginBottom: 24 }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', minHeight: 150 }}><Spin /></div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 16,
                                    width: '100%',
                                }}
                            >
                                {items.map((item, idx) => (
                                    <SortableOrg key={item.id} id={item.id} name={item.name} thumbnail={item.image} index={idx} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </Card>
            <CreatePromoteOrgModal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchOrgs}
            />
        </>
    );
}



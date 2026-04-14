import { Button, Card, Space } from 'antd';
import Flex from 'components/shared-components/Flex';
import React from 'react'
import {
    PlusOutlined,
    DeleteOutlined,
    CopyOutlined,
    HolderOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SortableDndWrapper from 'components/shared-components/dnd/SortableDndWrapper';

const SortableRowItem = ({
    row,
    sectionId,
    sortableId,
    selectedElement,
    selectedType,
    setSelectedElement,
    setSelectedType,
    deleteRow
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId,
        data: { sectionId, rowId: row.id }
    });

    const style = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 4px',
        cursor: 'pointer',
        marginBottom: 2,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 'auto',
        opacity: isDragging ? 0.7 : 1
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            className={`structure-item nested ${selectedElement?.id === row.id && selectedType === 'row' ? 'selected' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedElement({ ...row, sectionId });
                setSelectedType('row');
            }}
            style={style}
        >
            <Space>
                <span
                    ref={setActivatorNodeRef}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        color: '#999',
                        display: 'inline-flex',
                        alignItems: 'center',
                        touchAction: 'none'
                    }}
                >
                    <HolderOutlined />
                </span>
                {/* <span>Row {row.title} ({row.seats.length} seats)</span> */}
                <span>{row.title} ({row.seats.length} seats)</span>
            </Space>
            <Button
                size="small"
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                    e.stopPropagation();
                    deleteRow(sectionId, row.id);
                }}
            />
        </div>
    );
};

const LeftBar = (props) => {
    const { sections, selectedType, setSelectedElement, stage, setSelectedType, duplicateSection, deleteSection, selectedElement, deleteRow, addRowToSection, moveRow } = props

    return (
        <div className="left-panel">
            <div>
                <h5 className='mb-3'>Layout Structure</h5>
                {/* Stage / Screen */}
                <div
                    className={`structure-item ${selectedType === 'stage' ? 'selected' : ''}`}
                    onClick={() => {
                        setSelectedElement(stage);
                        setSelectedType('stage');
                    }}
                    style={{ cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}
                >
                    <Space>
                        <span>🎭</span>
                        <span>{stage.name || 'Stage / Screen'}</span>
                    </Space>
                </div>

                {/* Sections Tree */}
                <SortableDndWrapper
                    items={sections.flatMap((section) => section.rows.map((row) => `${section.id}::${row.id}`))}
                    onDragEnd={({ active, over }) => {
                        if (!over || active.id === over.id) return;
                        const activeData = active.data.current;
                        const overData = over.data.current;
                        if (!activeData || !overData) return;
                        if (activeData.sectionId !== overData.sectionId) return;
                        moveRow(activeData.sectionId, activeData.rowId, overData.rowId);
                    }}
                >
                    {sections.map(section => (
                        <Card
                            key={section.id}
                            size="small"
                            type="inner"
                            title={
                                <Flex justifyContent='space-between' alignItems='center' width='100%'>
                                    <span>{section.name}</span>
                                    <Space size={4}>
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<CopyOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateSection(section.id);
                                            }}
                                            title="Duplicate Section"
                                        />
                                        <Button
                                            size="small"
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSection(section.id);
                                            }}
                                            title="Delete Section"
                                        />
                                    </Space>
                                </Flex>
                            }
                            style={{ marginBottom: 8 }}
                            onClick={() => {
                                setSelectedElement(section);
                                setSelectedType('section');
                            }}
                        >
                            {section.rows.map(row => (
                                <SortableRowItem
                                    key={row.id}
                                    row={row}
                                    sectionId={section.id}
                                    sortableId={`${section.id}::${row.id}`}
                                    selectedElement={selectedElement}
                                    selectedType={selectedType}
                                    setSelectedElement={setSelectedElement}
                                    setSelectedType={setSelectedType}
                                    deleteRow={deleteRow}
                                />
                            ))}

                            <Button
                                type="dashed"
                                size="small"
                                className='w-100'
                                icon={<PlusOutlined />}
                                onClick={() => addRowToSection(section.id)}
                            >
                                Add Row
                            </Button>
                        </Card>
                    ))}
                </SortableDndWrapper>

            </div>
        </div>
    )
}

export default LeftBar

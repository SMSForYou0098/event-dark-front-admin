import { Button, Card, Collapse, Space } from 'antd';
import Flex from 'components/shared-components/Flex';
import React from 'react';
import {
    PlusOutlined,
    DeleteOutlined,
    CopyOutlined,
    HolderOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PiChair } from 'react-icons/pi';
import { PRIMARY } from 'utils/consts';
import SortableDndWrapper from 'components/shared-components/dnd/SortableDndWrapper';

const SortableRowItem = ({
    row,
    section,
    setActiveSectionKeys,
    setSelectedSeatIds,
    selectedElement,
    selectedType,
    setSelectedElement,
    setSelectedType,
    duplicateRow,
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
        id: row.id,
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            title={`Row ${row.title} · ${row.seats.length} seats`}
            className={`d-flex justify-content-between align-items-center px-2 py-1 mb-1 rounded 
                ${selectedElement?.id === row.id && selectedType === 'row'
                    ? 'text-white'
                    : ''}`}
            style={{
                cursor: 'pointer',
                backgroundColor:
                    selectedElement?.id === row.id && selectedType === 'row'
                        ? PRIMARY
                        : 'transparent',
                transform: CSS.Transform.toString(transform),
                transition,
                ...(isDragging ? { position: 'relative', zIndex: 9999, opacity: 0.8 } : {})
            }}
            onClick={(e) => {
                e.stopPropagation();
                setActiveSectionKeys([String(section.id)]);
                setSelectedSeatIds?.([]);
                setSelectedElement({ ...row, sectionId: section.id });
                setSelectedType('row');
            }}
        >
            <span className={selectedElement?.id === row.id ? 'text-white' : ''}>
                <span
                    ref={setActivatorNodeRef}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginRight: 8,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        color: selectedElement?.id === row.id && selectedType === 'row' ? '#fff' : '#999'
                    }}
                >
                    <HolderOutlined />
                </span>
                {row.title}{' '}
                (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        verticalAlign: 'middle',
                        marginLeft: 1,
                        marginRight: 1
                    }}
                >
                    {row.seats.length}
                    <PiChair
                        style={{
                            fontSize: 12,
                            flexShrink: 0,
                            color: selectedElement?.id === row.id ? '#fff' : 'rgba(255,255,255,0.55)'
                        }}
                        aria-label="seats"
                    />
                </span>
                )
            </span>

            <Space size={0} onClick={(e) => e.stopPropagation()}>
                <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        duplicateRow?.(section.id, row.id);
                    }}
                />
                <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteRow(section.id, row.id);
                    }}
                />
            </Space>
        </div>
    );
};

const LeftBar = (props) => {
    const {
        sections,
        selectedType,
        setSelectedElement,
        stage,
        setSelectedType,
        duplicateSection,
        duplicateRow,
        deleteSection,
        selectedElement,
        deleteRow,
        addRowToSection,
        moveRow,
        setSelectedSeatIds
    } = props;
    const { Panel } = Collapse;
    const [activeSectionKeys, setActiveSectionKeys] = React.useState([]);

    React.useEffect(() => {
        if (!sections?.length) {
            setActiveSectionKeys([]);
            return;
        }

        setActiveSectionKeys((prevKeys) => {
            const available = new Set(sections.map((section) => String(section.id)));
            const filtered = prevKeys.filter((key) => available.has(String(key)));
            if (filtered.length > 0) {
                return filtered;
            }
            return [String(sections[0].id)];
        });
    }, [sections]);

    return (
        <div className="left-panel">
            <div>

                <h5 className="mb-3">Layout Structure</h5>

                {/* Stage / Screen */}
                <div
                    className={`d-flex justify-content-between align-items-center p-2 mb-2 rounded 
                        ${selectedType === 'stage' ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        setSelectedSeatIds?.([]);
                        setSelectedElement(stage);
                        setSelectedType('stage');
                    }}
                >
                    <Space>
                        <span>🎭</span>
                        <span>{stage.name || 'Stage / Screen'}</span>
                    </Space>
                </div>

                {/* Sections as accordion */}
                <Collapse
                    accordion
                    activeKey={activeSectionKeys[0]}
                    onChange={(key) => {
                        const normalized = key ? [String(key)] : [];
                        setActiveSectionKeys(normalized);
                    }}
                    className="bg-transparent"
                    bordered={false}
                >
                    {sections.map((section) => (
                        <Panel
                            key={String(section.id)}
                            header={
                                <Flex
                                    justifyContent="space-between"
                                    alignItems="center"
                                    className=""
                                    width="100%"
                                    onClick={() => {
                                        setActiveSectionKeys([String(section.id)]);
                                        setSelectedSeatIds?.([]);
                                        setSelectedElement(section);
                                        setSelectedType('section');
                                    }}
                                >
                                    <span>{section.name}</span>
                                    <Space size={4} onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<CopyOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateSection(section.id);
                                            }}
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
                                        />
                                    </Space>
                                </Flex>
                            }
                        >
                            <Card
                                size="small"
                                type="inner"
                                className={`mb-2 ${selectedElement?.id === section.id && selectedType === 'section'
                                    ? 'border-primary border-opacity-50 border-primary bg-opacity-10'
                                    : ''}`}
                                onClick={() => {
                                    setSelectedElement(section);
                                    setSelectedType('section');
                                }}
                            >
                                {section.type !== 'Standing' && (
                                    <SortableDndWrapper
                                        items={section.rows.map((row) => row.id)}
                                        onDragEnd={({ active, over }) => {
                                            if (!over || active.id === over.id) return;
                                            moveRow?.(section.id, active.id, over.id);
                                        }}
                                    >
                                        {section.rows.map(row => (
                                            <SortableRowItem
                                                key={row.id}
                                                row={row}
                                                section={section}
                                                setActiveSectionKeys={setActiveSectionKeys}
                                                setSelectedSeatIds={setSelectedSeatIds}
                                                selectedElement={selectedElement}
                                                selectedType={selectedType}
                                                setSelectedElement={setSelectedElement}
                                                setSelectedType={setSelectedType}
                                                duplicateRow={duplicateRow}
                                                deleteRow={deleteRow}
                                            />
                                        ))}
                                    </SortableDndWrapper>
                                )}

                                {section.type !== 'Standing' && (
                                    <Button
                                        type="dashed"
                                        size="small"
                                        className="w-100 mt-1"
                                        icon={<PlusOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addRowToSection(section.id);
                                        }}
                                    >
                                        Add Row
                                    </Button>
                                )}
                            </Card>
                        </Panel>
                    ))}
                </Collapse>
            </div>
        </div>
    );
};

export default LeftBar;

import { Button, Card, Space } from 'antd';
import Flex from 'components/shared-components/Flex';
import React from 'react'
import {
    PlusOutlined,
    DeleteOutlined,
    CopyOutlined,
} from '@ant-design/icons';

const LeftBar = (props) => {
    const { sections, selectedType, setSelectedElement, stage, setSelectedType, duplicateSection, deleteSection, selectedElement, deleteRow, addRowToSection } = props
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
                        {/* Rows */}
                        {section.rows.map(row => (
                            <div
                                key={row.id}
                                className={`structure-item nested ${selectedElement?.id === row.id && selectedType === 'row' ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement({ ...row, sectionId: section.id });
                                    setSelectedType('row');
                                }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px', cursor: 'pointer', marginBottom: 2 }}
                            >
                                <Space>
                                    <span>↔️</span>
                                    <span>Row {row.title} ({row.seats.length} seats)</span>
                                </Space>
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteRow(section.id, row.id);
                                    }}
                                />
                            </div>
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

            </div>
        </div>
    )
}

export default LeftBar

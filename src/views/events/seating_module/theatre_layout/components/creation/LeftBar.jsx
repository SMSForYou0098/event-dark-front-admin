import { Alert, Button, Card, Space } from 'antd';
import Flex from 'components/shared-components/Flex';
import React from 'react';
import {
    PlusOutlined,
    DeleteOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { PRIMARY } from 'utils/consts';

const LeftBar = (props) => {
    const {
        sections,
        selectedType,
        setSelectedElement,
        stage,
        setSelectedType,
        duplicateSection,
        deleteSection,
        selectedElement,
        deleteRow,
        addRowToSection,
        isAssignMode
    } = props;

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
                        setSelectedElement(stage);
                        setSelectedType('stage');
                    }}
                >
                    <Space>
                        <span>🎭</span>
                        <span>{stage.name || 'Stage / Screen'}</span>
                    </Space>
                </div>

                {/* Sections */}
                {sections.map(section => (
                    <Card
                        key={section.id}
                        size="small"
                        type="inner"
                        className={`mb-2 ${selectedElement?.id === section.id && selectedType === 'section'
                            ? 'border-primary border-opacity-50 border-primary bg-opacity-10'
                            : ''}`}
                        title={
                            <Flex justifyContent="space-between" alignItems="center" width="100%">
                                <span>{section.name}</span>

                                {!isAssignMode && (
                                    <Space size={4}>
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
                                )}
                            </Flex>
                        }
                        onClick={() => {
                            setSelectedElement(section);
                            setSelectedType('section');
                        }}
                    >

                        {/* Rows */}
                        {section.rows.map(row => (
                            <div
                                key={row.id}
                                className={`d-flex justify-content-between align-items-center px-2 py-1 mb-1 rounded 
                                    ${selectedElement?.id === row.id && selectedType === 'row'
                                        ? 'text-white'
                                        : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor:
                                        selectedElement?.id === row.id && selectedType === 'row'
                                            ? PRIMARY
                                            : 'transparent'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement({ ...row, sectionId: section.id });
                                    setSelectedType('row');
                                }}
                            >
                                <Space>
                                    <span>↔️</span>
                                    <span className={selectedElement?.id === row.id ? 'text-white' : ''}>
                                        Row {row.title} ({row.seats.length} seats)
                                    </span>
                                </Space>

                                {!isAssignMode && (
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteRow(section.id, row.id);
                                        }}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Add Row Button */}
                        {!isAssignMode && (
                            <Button
                                type="dashed"
                                size="small"
                                className="w-100 mt-1"
                                icon={<PlusOutlined />}
                                onClick={() => addRowToSection(section.id)}
                            >
                                Add Row
                            </Button>
                        )}

                    </Card>
                ))}
                {isAssignMode &&
                    <Alert
                        message="You can zoom and drag sections for better visibility while assigning tickets, but section positions can’t be changed here. To rearrange sections, please use the Edit option in Layouts from the main menu."
                        type="warning"
                    />
                }
            </div>
        </div>
    );
};

export default LeftBar;

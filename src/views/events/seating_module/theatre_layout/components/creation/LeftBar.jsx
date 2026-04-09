import { Button, Card, Collapse, Space } from 'antd';
import Flex from 'components/shared-components/Flex';
import React from 'react';
import {
    PlusOutlined,
    DeleteOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { PiChair } from 'react-icons/pi';
import { PRIMARY } from 'utils/consts';

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
        addRowToSection
    } = props;
    const { Panel } = Collapse;
    const [activeSectionKeys, setActiveSectionKeys] = React.useState([]);

    React.useEffect(() => {
        if (!sections?.length) {
            setActiveSectionKeys([]);
            return;
        }

        if (selectedType === 'section' && selectedElement?.id) {
            setActiveSectionKeys([String(selectedElement.id)]);
            return;
        }

        if (selectedType === 'row' && selectedElement?.sectionId) {
            setActiveSectionKeys([String(selectedElement.sectionId)]);
            return;
        }

        // Keep first section open by default when nothing specific is selected
        if (activeSectionKeys.length === 0) {
            setActiveSectionKeys([String(sections[0].id)]);
        }
    }, [sections, selectedType, selectedElement]);

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
                                {section.type !== 'Standing' && section.rows.map(row => (
                                    <div
                                        key={row.id}
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
                                                    : 'transparent'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedElement({ ...row, sectionId: section.id });
                                            setSelectedType('row');
                                        }}
                                    >
                                        <span className={selectedElement?.id === row.id ? 'text-white' : ''}>
                                            Row {row.title}
                                            {' '}
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
                                ))}

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

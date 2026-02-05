// Sidebar Component for Label Forge

import React from 'react';
import { Select, InputNumber, Button, Tag, Tooltip, Empty } from 'antd';
import {
    PlusCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    VerticalAlignTopOutlined,
    VerticalAlignBottomOutlined
} from '@ant-design/icons';
import { Type, Barcode, QrCode, Square } from 'lucide-react';
import { PRESETS } from '../constants';

/**
 * Left sidebar with toolbox and layers
 */
const Sidebar = ({
    activeSidebarTab,
    setActiveSidebarTab,
    labelSize,
    setLabelSize,
    activeTab,
    addElement,
    allVariables,
    onOpenVarModal,
    elements,
    selectedIds,
    onSelect,
    onMoveLayer
}) => {
    // Get icon for element type
    const getElementIcon = (type) => {
        switch (type) {
            case 'text': return <Type size={14} />;
            case 'barcode': return <Barcode size={14} />;
            case 'qrcode': return <QrCode size={14} />;
            case 'box': return <Square size={14} />;
            default: return null;
        }
    };

    return (
        <div 
            className="bg-white border-end h-100 d-flex flex-column"
            style={{ width: 280 }}
        >
            {/* Tabs */}
            <div className="border-bottom">
                <div className="d-flex">
                    <button
                        className={`flex-fill py-2 border-0 bg-transparent small fw-semibold text-uppercase ${
                            activeSidebarTab === 'create' 
                                ? 'text-primary border-bottom border-2 border-primary' 
                                : 'text-muted'
                        }`}
                        onClick={() => setActiveSidebarTab('create')}
                        style={{ letterSpacing: '0.5px' }}
                    >
                        Create
                    </button>
                    <button
                        className={`flex-fill py-2 border-0 bg-transparent small fw-semibold text-uppercase ${
                            activeSidebarTab === 'layers' 
                                ? 'text-primary border-bottom border-2 border-primary' 
                                : 'text-muted'
                        }`}
                        onClick={() => setActiveSidebarTab('layers')}
                        style={{ letterSpacing: '0.5px' }}
                    >
                        Layers
                    </button>
                </div>
            </div>

            {/* Create Tab */}
            {activeSidebarTab === 'create' && (
                <>
                    {/* Label Configuration */}
                    <div className="p-3 border-bottom">
                        <h6 className="text-muted small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                            Label Configuration
                        </h6>
                        <Select
                            className="w-100 mb-3"
                            value={labelSize.name}
                            onChange={(value) => {
                                const preset = PRESETS.find(p => p.name === value);
                                if (preset) setLabelSize(preset);
                            }}
                            disabled={activeTab === 'preview'}
                            options={PRESETS.map(p => ({ value: p.name, label: p.name }))}
                        />
                        <div className="row g-2">
                            <div className="col-6">
                                <label className="d-block small text-muted mb-1" style={{ fontSize: 10 }}>
                                    WIDTH (MM)
                                </label>
                                <InputNumber
                                    className="w-100"
                                    size="small"
                                    value={labelSize.width}
                                    onChange={(value) => setLabelSize({ ...labelSize, width: value })}
                                    disabled={activeTab === 'preview'}
                                    min={10}
                                    max={500}
                                />
                            </div>
                            <div className="col-6">
                                <label className="d-block small text-muted mb-1" style={{ fontSize: 10 }}>
                                    HEIGHT (MM)
                                </label>
                                <InputNumber
                                    className="w-100"
                                    size="small"
                                    value={labelSize.height}
                                    onChange={(value) => setLabelSize({ ...labelSize, height: value })}
                                    disabled={activeTab === 'preview'}
                                    min={10}
                                    max={500}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Toolbox / Preview Data */}
                    <div className="p-3 flex-fill overflow-auto">
                        {activeTab === 'editor' ? (
                            <>
                                <h6 className="text-muted small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                                    Toolbox
                                </h6>
                                <div className="row g-2 mb-4">
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 border"
                                            style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
                                            onClick={() => addElement('text')}
                                        >
                                            <Type size={24} className="mb-2 text-primary" />
                                            <span className="small fw-semibold text-primary">Text</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 border"
                                            style={{ backgroundColor: '#f9f0ff', borderColor: '#d3adf7' }}
                                            onClick={() => addElement('barcode')}
                                        >
                                            <Barcode size={24} className="mb-2" style={{ color: '#722ed1' }} />
                                            <span className="small fw-semibold" style={{ color: '#722ed1' }}>Barcode</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 border"
                                            style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
                                            onClick={() => addElement('qrcode')}
                                        >
                                            <QrCode size={24} className="mb-2" style={{ color: '#52c41a' }} />
                                            <span className="small fw-semibold" style={{ color: '#52c41a' }}>QR Code</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 border"
                                            style={{ backgroundColor: '#fafafa', borderColor: '#d9d9d9' }}
                                            onClick={() => addElement('box')}
                                        >
                                            <Square size={24} className="mb-2 text-secondary" />
                                            <span className="small fw-semibold text-secondary">Box</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Variables */}
                                <div 
                                    className="p-3 rounded"
                                    style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0 small fw-bold" style={{ color: '#d48806' }}>
                                            Variables
                                        </h6>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<PlusCircleOutlined />}
                                            onClick={onOpenVarModal}
                                            style={{ color: '#d48806' }}
                                        />
                                    </div>
                                    <div className="d-flex flex-wrap gap-1">
                                        {Object.keys(allVariables).map(tag => (
                                            <Tag
                                                key={tag}
                                                className="cursor-pointer"
                                                style={{ 
                                                    fontFamily: 'monospace', 
                                                    fontSize: 10,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => addElement('text', { content: tag })}
                                            >
                                                {tag}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h6 className="text-muted small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                                    Preview Data
                                </h6>
                                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    {Object.entries(allVariables).map(([key, value]) => (
                                        <div key={key} className="border-bottom pb-2 mb-2">
                                            <div className="small fw-bold text-muted" style={{ fontSize: 10 }}>
                                                {key}
                                            </div>
                                            <div 
                                                className="text-truncate" 
                                                style={{ fontFamily: 'monospace', fontSize: 13 }}
                                                title={value}
                                            >
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Layers Tab */}
            {activeSidebarTab === 'layers' && (
                <div className="flex-fill overflow-auto p-2">
                    {elements.length > 0 ? (
                        <div className="d-flex flex-column gap-1">
                            {[...elements].reverse().map((el) => (
                                <div
                                    key={el.id}
                                    className={`d-flex align-items-center gap-2 p-2 rounded cursor-pointer border ${
                                        selectedIds.includes(el.id) 
                                            ? 'bg-primary bg-opacity-10 border-primary' 
                                            : 'bg-white border-light'
                                    }`}
                                    onClick={(e) => onSelect(el.id, e.ctrlKey || e.metaKey)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="text-muted">
                                        {getElementIcon(el.type)}
                                    </div>
                                    <div className="flex-fill min-w-0">
                                        <div 
                                            className="small fw-medium text-truncate" 
                                            style={{ fontSize: 12 }}
                                        >
                                            {el.content || el.type}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: 10 }}>
                                            ID: {el.id}
                                        </div>
                                    </div>
                                    {selectedIds.includes(el.id) && (
                                        <div className="d-flex gap-1">
                                            <Tooltip title="Bring to Front">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<VerticalAlignTopOutlined style={{ fontSize: 10 }} />}
                                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'front'); }}
                                                    style={{ width: 20, height: 20, minWidth: 20 }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Move Up">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<ArrowUpOutlined style={{ fontSize: 10 }} />}
                                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'up'); }}
                                                    style={{ width: 20, height: 20, minWidth: 20 }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Move Down">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<ArrowDownOutlined style={{ fontSize: 10 }} />}
                                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'down'); }}
                                                    style={{ width: 20, height: 20, minWidth: 20 }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Send to Back">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<VerticalAlignBottomOutlined style={{ fontSize: 10 }} />}
                                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'back'); }}
                                                    style={{ width: 20, height: 20, minWidth: 20 }}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No layers found"
                            className="py-5"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;

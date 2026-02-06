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
            className="lf-sidebar border-end h-100 d-flex flex-column"
            style={{ width: 280, borderColor: 'var(--lf-border-secondary)' }}
        >
            {/* Tabs */}
            <div className="border-bottom" style={{ borderColor: 'var(--lf-border-secondary)' }}>
                <div className="d-flex">
                    <button
                        className={`flex-fill py-2 border-0 bg-transparent small fw-semibold text-uppercase lf-tab-btn ${
                            activeSidebarTab === 'create' ? 'active' : ''
                        }`}
                        onClick={() => setActiveSidebarTab('create')}
                        style={{ letterSpacing: '0.5px' }}
                    >
                        Create
                    </button>
                    <button
                        className={`flex-fill py-2 border-0 bg-transparent small fw-semibold text-uppercase lf-tab-btn ${
                            activeSidebarTab === 'layers' ? 'active' : ''
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
                    <div className="p-3 border-bottom" style={{ borderColor: 'var(--lf-border-secondary)' }}>
                        <h6 className="lf-text-muted small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
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
                                <label className="d-block small lf-text-muted mb-1" style={{ fontSize: 10 }}>
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
                                <label className="d-block small lf-text-muted mb-1" style={{ fontSize: 10 }}>
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
                                <h6 className="lf-text-muted small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                                    Toolbox
                                </h6>
                                <div className="row g-2 mb-4">
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 lf-toolbox-btn lf-btn-text"
                                            onClick={() => addElement('text')}
                                        >
                                            <Type size={24} className="mb-2" style={{ color: '#b51515' }} />
                                            <span className="small fw-semibold" style={{ color: '#b51515' }}>Text</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 lf-toolbox-btn lf-btn-barcode"
                                            onClick={() => addElement('barcode')}
                                        >
                                            <Barcode size={24} className="mb-2" style={{ color: '#a855f7' }} />
                                            <span className="small fw-semibold" style={{ color: '#a855f7' }}>Barcode</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 lf-toolbox-btn lf-btn-qrcode"
                                            onClick={() => addElement('qrcode')}
                                        >
                                            <QrCode size={24} className="mb-2" style={{ color: '#04d182' }} />
                                            <span className="small fw-semibold" style={{ color: '#04d182' }}>QR Code</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            className="btn w-100 d-flex flex-column align-items-center py-3 lf-toolbox-btn lf-btn-box"
                                            onClick={() => addElement('box')}
                                        >
                                            <Square size={24} className="mb-2 lf-text-muted" />
                                            <span className="small fw-semibold lf-text-muted">Box</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Variables */}
                                <div 
                                    className="p-3 rounded lf-variables-section"
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0 small fw-bold" style={{ color: '#ffc542' }}>
                                            Variables
                                        </h6>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<PlusCircleOutlined />}
                                            onClick={onOpenVarModal}
                                            style={{ color: '#ffc542' }}
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
                                <h6 className="lf-text-muted small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                                    Preview Data
                                </h6>
                                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    {Object.entries(allVariables).map(([key, value]) => (
                                        <div key={key} className="border-bottom pb-2 mb-2" style={{ borderColor: 'var(--lf-border-secondary)' }}>
                                            <div className="small fw-bold lf-text-muted" style={{ fontSize: 10 }}>
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
                                    className={`d-flex align-items-center gap-2 p-2 rounded cursor-pointer border lf-layer-item ${
                                        selectedIds.includes(el.id) ? 'selected' : ''
                                    }`}
                                    onClick={(e) => onSelect(el.id, e.ctrlKey || e.metaKey)}
                                    style={{ cursor: 'pointer', borderColor: 'var(--lf-border-secondary)' }}
                                >
                                    <div className="lf-text-muted">
                                        {getElementIcon(el.type)}
                                    </div>
                                    <div className="flex-fill min-w-0">
                                        <div 
                                            className="small fw-medium text-truncate lf-text" 
                                            style={{ fontSize: 12 }}
                                        >
                                            {el.content || el.type}
                                        </div>
                                        <div className="lf-text-muted" style={{ fontSize: 10 }}>
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

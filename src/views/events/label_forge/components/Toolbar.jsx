// Toolbar Component for Label Forge

import React from 'react';
import { Button, Tooltip, Select } from 'antd';
import {
    MinusOutlined,
    PlusOutlined,
    ExpandOutlined,
} from '@ant-design/icons';
import {
    Magnet,
    Grid,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    AlignHorizontalDistributeCenter,
    AlignVerticalDistributeCenter
} from 'lucide-react';
import { GRID_SIZES } from '../constants';

/**
 * Canvas toolbar for alignment, grid, and zoom controls
 */
const Toolbar = ({
    snapEnabled,
    setSnapEnabled,
    gridSize,
    setGridSize,
    showGrid,
    setShowGrid,
    selectedIds,
    onAlign,
    viewTransform,
    setViewTransform,
    centerView
}) => {
    const IconButton = ({ icon, active, onClick, title, disabled }) => (
        <Tooltip title={title}>
            <Button
                type="text"
                size="small"
                icon={icon}
                onClick={onClick}
                disabled={disabled}
                style={{
                    backgroundColor: active ? '#e6f7ff' : 'transparent',
                    color: active ? '#1890ff' : '#666',
                    width: 32,
                    height: 32
                }}
            />
        </Tooltip>
    );

    const hasSelection = selectedIds.length > 0;

    return (
        <div 
            className="position-absolute d-flex align-items-center gap-2 bg-white border rounded shadow-sm p-2"
            style={{ 
                top: 16, 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 50 
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Grid & Snap Controls */}
            <div className="d-flex align-items-center gap-1 pe-2 border-end">
                <IconButton
                    icon={<Magnet size={16} />}
                    active={snapEnabled}
                    onClick={() => setSnapEnabled(!snapEnabled)}
                    title="Snap to Grid"
                />
                <Select
                    size="small"
                    value={gridSize}
                    onChange={setGridSize}
                    style={{ width: 70 }}
                    options={GRID_SIZES.map(s => ({ value: s, label: `${s}mm` }))}
                />
                <IconButton
                    icon={<Grid size={16} />}
                    active={showGrid}
                    onClick={() => setShowGrid(!showGrid)}
                    title="Toggle Grid"
                />
            </div>

            {/* Alignment Controls */}
            <div 
                className={`d-flex gap-1 px-2 border-end ${!hasSelection ? 'opacity-50' : ''}`}
                style={{ pointerEvents: hasSelection ? 'auto' : 'none' }}
            >
                <IconButton
                    icon={<AlignStartVertical size={16} />}
                    onClick={() => onAlign('left')}
                    title="Align Left"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignCenterVertical size={16} />}
                    onClick={() => onAlign('center')}
                    title="Align Center"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignEndVertical size={16} />}
                    onClick={() => onAlign('right')}
                    title="Align Right"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignStartHorizontal size={16} />}
                    onClick={() => onAlign('top')}
                    title="Align Top"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignCenterHorizontal size={16} />}
                    onClick={() => onAlign('middle')}
                    title="Align Middle"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignEndHorizontal size={16} />}
                    onClick={() => onAlign('bottom')}
                    title="Align Bottom"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignVerticalDistributeCenter size={16} />}
                    onClick={() => onAlign('distribute-v')}
                    title="Distribute Vertically"
                    disabled={!hasSelection}
                />
                <IconButton
                    icon={<AlignHorizontalDistributeCenter size={16} />}
                    onClick={() => onAlign('distribute-h')}
                    title="Distribute Horizontally"
                    disabled={!hasSelection}
                />
            </div>

            {/* Zoom Controls */}
            <div className="d-flex align-items-center gap-1 ps-1">
                <IconButton
                    icon={<MinusOutlined />}
                    onClick={() => setViewTransform(prev => ({ 
                        ...prev, 
                        scale: Math.max(0.2, prev.scale - 0.2) 
                    }))}
                    title="Zoom Out"
                />
                <div 
                    className="text-center px-2 small fw-medium"
                    style={{ width: 48, fontFamily: 'monospace', cursor: 'pointer' }}
                    onClick={centerView}
                >
                    {Math.round(viewTransform.scale * 100)}%
                </div>
                <IconButton
                    icon={<PlusOutlined />}
                    onClick={() => setViewTransform(prev => ({ 
                        ...prev, 
                        scale: Math.min(5, prev.scale + 0.2) 
                    }))}
                    title="Zoom In"
                />
                <IconButton
                    icon={<ExpandOutlined />}
                    onClick={centerView}
                    title="Reset View"
                />
            </div>
        </div>
    );
};

export default Toolbar;

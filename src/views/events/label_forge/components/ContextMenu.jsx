// Context Menu Component for Label Forge

import React from 'react';
import { 
    CopyOutlined, 
    DeleteOutlined, 
    VerticalAlignTopOutlined,
    VerticalAlignBottomOutlined,
    FontSizeOutlined,
    BarcodeOutlined,
    QrcodeOutlined,
    BorderOutlined,
    ExpandOutlined
} from '@ant-design/icons';

/**
 * Context menu for canvas and elements
 */
const ContextMenu = ({ 
    contextMenu, 
    onDuplicate, 
    onMoveLayer, 
    onDelete,
    onAddElement,
    onCenterView,
    onClose
}) => {
    if (!contextMenu) return null;

    const menuItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: 13,
        transition: 'background-color 0.2s'
    };

    const MenuItem = ({ icon, label, onClick, danger }) => (
        <div
            style={{
                ...menuItemStyle,
                color: danger ? '#ff6b72' : '#b4bed2'
            }}
            className="context-menu-item"
            onClick={() => { onClick(); onClose(); }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = danger ? 'rgba(255, 107, 114, 0.1)' : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            {icon}
            <span>{label}</span>
        </div>
    );

    const Divider = () => (
        <div style={{ height: 1, backgroundColor: '#2c2f34', margin: '4px 0' }} />
    );

    return (
        <div
            style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid #2c2f34',
                borderRadius: 8,
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                zIndex: 1000,
                minWidth: 160,
                padding: '4px 0'
            }}
            className="lf-context-menu"
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.type === 'element' ? (
                <>
                    <MenuItem 
                        icon={<CopyOutlined />} 
                        label="Duplicate" 
                        onClick={onDuplicate}
                    />
                    <Divider />
                    <MenuItem 
                        icon={<VerticalAlignTopOutlined />} 
                        label="Bring to Front" 
                        onClick={() => onMoveLayer(contextMenu.id, 'front')}
                    />
                    <MenuItem 
                        icon={<VerticalAlignBottomOutlined />} 
                        label="Send to Back" 
                        onClick={() => onMoveLayer(contextMenu.id, 'back')}
                    />
                    <Divider />
                    <MenuItem 
                        icon={<DeleteOutlined />} 
                        label="Delete" 
                        onClick={onDelete}
                        danger
                    />
                </>
            ) : (
                <>
                    <MenuItem 
                        icon={<FontSizeOutlined />} 
                        label="Add Text" 
                        onClick={() => onAddElement('text')}
                    />
                    <MenuItem 
                        icon={<BarcodeOutlined />} 
                        label="Add Barcode" 
                        onClick={() => onAddElement('barcode')}
                    />
                    <MenuItem 
                        icon={<QrcodeOutlined />} 
                        label="Add QR Code" 
                        onClick={() => onAddElement('qrcode')}
                    />
                    <MenuItem 
                        icon={<BorderOutlined />} 
                        label="Add Box" 
                        onClick={() => onAddElement('box')}
                    />
                    <Divider />
                    <MenuItem 
                        icon={<ExpandOutlined />} 
                        label="Reset View" 
                        onClick={onCenterView}
                    />
                </>
            )}
        </div>
    );
};

export default ContextMenu;

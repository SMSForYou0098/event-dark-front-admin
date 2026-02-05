// Resize Handle Component for Label Forge

import React from 'react';

/**
 * Resize handle for resizable elements
 */
const ResizeHandle = ({ cursor, onMouseDown, position }) => {
    const style = {
        width: '8px',
        height: '8px',
        backgroundColor: 'white',
        border: '1px solid #1890ff',
        position: 'absolute',
        cursor: cursor,
        zIndex: 60,
        borderRadius: '2px',
        ...position
    };

    return (
        <div 
            onMouseDown={onMouseDown} 
            style={style}
            className="resize-handle"
        />
    );
};

export default ResizeHandle;

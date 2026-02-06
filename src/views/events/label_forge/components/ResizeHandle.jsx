// Resize Handle Component for Label Forge

import React from 'react';

/**
 * Resize handle for resizable elements
 */
const ResizeHandle = ({ cursor, onMouseDown, position }) => {
    const style = {
        width: '8px',
        height: '8px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #b51515',
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

// Preview Element Component for Label Forge

import React from 'react';
import { resolveVariable } from '../utils';
import { SCREEN_SCALE } from '../constants';

/**
 * Preview element for the preview mode (non-interactive)
 */
const PreviewElement = ({ element, variableMap }) => {
    const resolvedContent = resolveVariable(element.content, variableMap);

    const baseStyle = {
        left: `${element.x * SCREEN_SCALE}px`,
        top: `${element.y * SCREEN_SCALE}px`,
        position: 'absolute',
        zIndex: 10,
        color: '#222',
    };

    switch (element.type) {
        case 'text':
            return (
                <div
                    style={{
                        ...baseStyle,
                        fontSize: `${element.fontSize}px`,
                        fontWeight: element.fontWeight,
                        fontFamily: element.fontFamily,
                        textShadow: '0 0 0.5px rgba(0,0,0,0.4)',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        opacity: 0.9
                    }}
                >
                    {resolvedContent}
                </div>
            );

        case 'qrcode':
            return (
                <div
                    style={{
                        ...baseStyle,
                        width: `${element.width * SCREEN_SCALE}px`,
                        height: `${element.height * SCREEN_SCALE}px`,
                        padding: `${(element.padding || 0) * SCREEN_SCALE}px`,
                        borderWidth: element.showBorder ? '1px' : '0px',
                        borderStyle: 'solid',
                        borderColor: '#222',
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        mixBlendMode: 'multiply'
                    }}
                >
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(resolvedContent)}`}
                        alt="QR"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            opacity: 0.9,
                            filter: 'grayscale(1) contrast(1.25)'
                        }}
                    />
                </div>
            );

        case 'barcode':
            return (
                <div
                    style={{
                        ...baseStyle,
                        width: `${element.width * SCREEN_SCALE}px`,
                        height: `${element.height * SCREEN_SCALE}px`,
                        backgroundColor: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        mixBlendMode: 'multiply',
                        opacity: 0.9
                    }}
                >
                    <div style={{ 
                        display: 'flex', 
                        width: '100%', 
                        height: '100%', 
                        alignItems: 'stretch', 
                        justifyContent: 'space-between',
                        padding: '0 4px'
                    }}>
                        {[...Array(25)].map((_, i) => (
                            <div 
                                key={i} 
                                style={{ 
                                    width: Math.random() > 0.5 ? '4px' : '2px', 
                                    backgroundColor: '#222' 
                                }} 
                            />
                        ))}
                    </div>
                    <div style={{ 
                        fontSize: '10px', 
                        fontFamily: 'monospace', 
                        marginTop: '2px', 
                        color: '#222',
                        lineHeight: 1
                    }}>
                        {resolvedContent}
                    </div>
                </div>
            );

        case 'box':
            return (
                <div
                    style={{
                        ...baseStyle,
                        width: `${element.width * SCREEN_SCALE}px`,
                        height: `${element.height * SCREEN_SCALE}px`,
                        borderWidth: `${Math.max(1, element.strokeWidth * SCREEN_SCALE)}px`,
                        borderStyle: 'solid',
                        borderColor: '#222',
                        opacity: 0.9,
                        mixBlendMode: 'multiply'
                    }}
                />
            );

        default:
            return null;
    }
};

export default PreviewElement;

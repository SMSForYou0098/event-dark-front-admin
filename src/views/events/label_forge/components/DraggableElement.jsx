// Draggable Element Component for Label Forge

import React, { useState, useRef, useEffect, useLayoutEffect, memo } from 'react';
import ResizeHandle from './ResizeHandle';
import { resolveVariable } from '../utils';
import { SCREEN_SCALE } from '../constants';

/**
 * Draggable and resizable element on the canvas
 */
const DraggableElement = memo(({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onInteractionEnd,
    onMeasure,
    onContextMenu,
    zoomLevel,
    snapEnabled,
    gridSize,
    variableMap
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const elementRef = useRef(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
    const hasMoved = useRef(false);
    const resizeDir = useRef(null);

    // Measure element dimensions
    useLayoutEffect(() => {
        if (elementRef.current && onMeasure) {
            const { offsetWidth, offsetHeight } = elementRef.current;
            onMeasure(element.id, {
                width: offsetWidth / SCREEN_SCALE,
                height: offsetHeight / SCREEN_SCALE
            });
        }
    }, [element.content, element.fontSize, element.fontFamily, element.width, element.height, element.padding, element.showBorder, onMeasure, variableMap, element.id]);

    // Handle mouse down for dragging
    const handleMouseDown = (e) => {
        e.stopPropagation();
        if (e.button !== 0) return;

        const isGroupSelection = isSelected && !e.ctrlKey && !e.metaKey && !e.shiftKey;

        if (!isGroupSelection) {
            onSelect(element.id, e.ctrlKey || e.metaKey);
        }

        setIsDragging(true);
        hasMoved.current = false;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elX: element.x,
            elY: element.y
        };
    };

    // Handle context menu
    const handleContext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, element.id);
    };

    // Handle resize start
    const handleResizeStart = (e, direction) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeDir.current = direction;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elX: element.x,
            elY: element.y,
            elW: element.width,
            elH: element.height
        };
    };

    // Handle mouse move and mouse up
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing) return;
            e.preventDefault();

            const deltaX = (e.clientX - dragStart.current.mouseX) / (SCREEN_SCALE * zoomLevel);
            const deltaY = (e.clientY - dragStart.current.mouseY) / (SCREEN_SCALE * zoomLevel);

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                hasMoved.current = true;
            }

            if (isDragging) {
                let nextX = Math.max(0, dragStart.current.elX + deltaX);
                let nextY = Math.max(0, dragStart.current.elY + deltaY);

                if (snapEnabled && !e.shiftKey) {
                    nextX = Math.round(nextX / gridSize) * gridSize;
                    nextY = Math.round(nextY / gridSize) * gridSize;
                }
                onUpdate(element.id, { x: nextX, y: nextY }, true);
            } else if (isResizing) {
                const updates = {};
                const { elW, elH } = dragStart.current;
                const dir = resizeDir.current;

                if (dir.includes('e')) updates.width = Math.max(1, elW + deltaX);
                if (dir.includes('s')) updates.height = Math.max(1, elH + deltaY);

                if (snapEnabled && !e.shiftKey) {
                    if (updates.width) updates.width = Math.round(updates.width / gridSize) * gridSize;
                    if (updates.height) updates.height = Math.round(updates.height / gridSize) * gridSize;
                }

                onUpdate(element.id, updates, false);
            }
        };

        const handleMouseUp = (e) => {
            if (isDragging || isResizing) {
                setIsDragging(false);
                setIsResizing(false);
                onInteractionEnd();

                if (isSelected && !hasMoved.current && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isResizing) {
                    onSelect(element.id, false);
                }
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, element.id, onUpdate, zoomLevel, snapEnabled, gridSize, onInteractionEnd, isSelected, onSelect]);

    const style = {
        left: `${element.x * SCREEN_SCALE}px`,
        top: `${element.y * SCREEN_SCALE}px`,
        zIndex: isSelected ? 50 : 10,
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
    };

    const resolvedContent = resolveVariable(element.content, variableMap);

    // Render content based on element type
    const renderContent = () => {
        switch (element.type) {
            case 'text':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            fontSize: `${element.fontSize}px`,
                            fontWeight: element.fontWeight,
                            fontFamily: element.fontFamily,
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                            color: '#1a1a1a',
                            pointerEvents: 'none'
                        }}
                    >
                        {element.content}
                    </div>
                );
            case 'qrcode':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            width: `${element.width * SCREEN_SCALE}px`,
                            height: `${element.height * SCREEN_SCALE}px`,
                            padding: `${(element.padding || 0) * SCREEN_SCALE}px`,
                            borderWidth: element.showBorder ? '1px' : '0px',
                            borderStyle: 'solid',
                            borderColor: '#111827',
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            pointerEvents: 'none'
                        }}
                    >
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(resolvedContent)}`}
                            alt="QR"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            draggable={false}
                        />
                    </div>
                );
            case 'barcode':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            width: `${element.width * SCREEN_SCALE}px`,
                            height: `${element.height * SCREEN_SCALE}px`,
                            backgroundColor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            border: '1px solid transparent',
                            pointerEvents: 'none',
                            padding: '0 4px'
                        }}
                    >
                        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'stretch', justifyContent: 'space-between' }}>
                            {[...Array(25)].map((_, i) => (
                                <div key={i} style={{ width: Math.random() > 0.5 ? '4px' : '2px', backgroundColor: 'black' }} />
                            ))}
                        </div>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', lineHeight: 1, marginTop: '2px' }}>
                            {element.content}
                        </div>
                    </div>
                );
            case 'box':
                return (
                    <div
                        ref={elementRef}
                        style={{
                            width: `${element.width * SCREEN_SCALE}px`,
                            height: `${element.height * SCREEN_SCALE}px`,
                            borderWidth: `${Math.max(1, element.strokeWidth * SCREEN_SCALE)}px`,
                            borderStyle: 'solid',
                            borderColor: 'black',
                            pointerEvents: 'none'
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={handleContext}
            style={style}
            className="draggable-element"
        >
            {renderContent()}
            {/* Selection border */}
            <div
                style={{
                    position: 'absolute',
                    inset: '-4px',
                    border: `2px solid ${isSelected ? '#b51515' : 'transparent'}`,
                    borderRadius: '4px',
                    transition: 'border-color 0.2s',
                    pointerEvents: 'none',
                    backgroundColor: isSelected ? 'rgba(181, 21, 21, 0.05)' : 'transparent'
                }}
            />
            {/* Position indicator */}
            {isSelected && (
                <>
                    <div
                        style={{
                            transform: `scale(${1 / zoomLevel})`,
                            transformOrigin: 'bottom left',
                            position: 'absolute',
                            top: '-24px',
                            left: 0,
                            backgroundColor: '#b51515',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            fontFamily: 'monospace',
                            pointerEvents: 'none'
                        }}
                    >
                        x:{element.x.toFixed(1)} y:{element.y.toFixed(1)}
                    </div>
                    {/* Resize handles for resizable elements */}
                    {(element.type === 'box' || element.type === 'barcode' || element.type === 'qrcode') && (
                        <>
                            <ResizeHandle 
                                cursor="se-resize" 
                                position={{ bottom: '-5px', right: '-5px' }} 
                                onMouseDown={(e) => handleResizeStart(e, 'se')} 
                            />
                            <ResizeHandle 
                                cursor="e-resize" 
                                position={{ top: '50%', right: '-5px', transform: 'translateY(-50%)' }} 
                                onMouseDown={(e) => handleResizeStart(e, 'e')} 
                            />
                            <ResizeHandle 
                                cursor="s-resize" 
                                position={{ bottom: '-5px', left: '50%', transform: 'translateX(-50%)' }} 
                                onMouseDown={(e) => handleResizeStart(e, 's')} 
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
});

DraggableElement.displayName = 'DraggableElement';

export default DraggableElement;

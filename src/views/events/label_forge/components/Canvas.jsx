// Canvas Component for Label Forge

import React, { useEffect, useCallback } from 'react';
import DraggableElement from './DraggableElement';
import PreviewElement from './PreviewElement';
import Toolbar from './Toolbar';
import { SCREEN_SCALE } from '../constants';

/**
 * Main canvas area for label design and preview
 */
const Canvas = ({
    activeTab,
    labelSize,
    elements,
    selectedIds,
    viewTransform,
    setViewTransform,
    isPanning,
    setIsPanning,
    marquee,
    setMarquee,
    panStart,
    containerRef,
    mainRef,
    elementDimensions,
    showGrid,
    setShowGrid,
    snapEnabled,
    setSnapEnabled,
    gridSize,
    setGridSize,
    handleSelect,
    updateElement,
    handleInteractionEnd,
    handleMeasure,
    setSelectedIds,
    setContextMenu,
    handleAlign,
    centerView,
    allVariables
}) => {
    // Get canvas coordinates from mouse event
    const getCanvasCoordinates = useCallback((e) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / viewTransform.scale,
            y: (e.clientY - rect.top) / viewTransform.scale
        };
    }, [viewTransform.scale, containerRef]);

    // Handle mouse down on canvas
    const handleCanvasMouseDown = useCallback((e) => {
        // Middle Click -> Pan
        if (e.button === 1 || (e.button === 0 && e.code === 'Space')) {
            if (e.target === e.currentTarget || e.target.closest('.canvas-transform-wrapper')) {
                setSelectedIds([]);
            }
            setIsPanning(true);
            panStart.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // Left Click on canvas (empty space) -> Marquee
        if (e.button === 0) {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                setSelectedIds([]);
            }
            const { x, y } = getCanvasCoordinates(e);
            setMarquee({ startX: x, startY: y, currentX: x, currentY: y });
        }
    }, [getCanvasCoordinates, panStart, setIsPanning, setMarquee, setSelectedIds]);

    // Handle mouse move
    const handleCanvasMouseMove = useCallback((e) => {
        if (isPanning) {
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            panStart.current = { x: e.clientX, y: e.clientY };
            setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        } else if (marquee) {
            const { x, y } = getCanvasCoordinates(e);
            setMarquee(prev => ({ ...prev, currentX: x, currentY: y }));
        }
    }, [isPanning, marquee, panStart, getCanvasCoordinates, setViewTransform, setMarquee]);

    // Handle mouse up
    const handleCanvasMouseUp = useCallback((e) => {
        if (isPanning) setIsPanning(false);

        if (marquee) {
            const x1 = Math.min(marquee.startX, marquee.currentX);
            const x2 = Math.max(marquee.startX, marquee.currentX);
            const y1 = Math.min(marquee.startY, marquee.currentY);
            const y2 = Math.max(marquee.startY, marquee.currentY);

            const newSelected = [];

            elements.forEach(el => {
                const elX = el.x * SCREEN_SCALE;
                const elY = el.y * SCREEN_SCALE;
                const dims = elementDimensions.current[el.id] || { 
                    width: (el.width || 0) * SCREEN_SCALE, 
                    height: (el.height || 0) * SCREEN_SCALE 
                };
                const elW = dims.width * SCREEN_SCALE;
                const elH = dims.height * SCREEN_SCALE;

                if (x1 < elX + elW && x2 > elX && y1 < elY + elH && y2 > elY) {
                    newSelected.push(el.id);
                }
            });

            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                setSelectedIds(prev => [...new Set([...prev, ...newSelected])]);
            } else {
                setSelectedIds(prev => [...new Set([...prev, ...newSelected])]);
            }
            setMarquee(null);
        }
    }, [isPanning, marquee, elements, elementDimensions, setIsPanning, setMarquee, setSelectedIds]);

    // Handle context menu
    const onCanvasContextMenu = useCallback((e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' });
    }, [setContextMenu]);

    // Handle element context menu
    const onElementContextMenu = useCallback((e, id) => {
        if (!selectedIds.includes(id)) {
            handleSelect(id, false);
        }
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'element', id });
    }, [selectedIds, handleSelect, setContextMenu]);

    // Wheel zoom and pan
    useEffect(() => {
        const container = mainRef.current;
        if (!container) return;

        const handleWheelNative = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                setViewTransform(prev => ({ 
                    ...prev, 
                    scale: Math.min(Math.max(0.1, prev.scale - e.deltaY * 0.001), 5) 
                }));
            } else if (e.shiftKey) {
                e.preventDefault();
                setViewTransform(prev => ({ ...prev, x: prev.x - e.deltaY }));
            } else {
                e.preventDefault();
                setViewTransform(prev => ({ 
                    ...prev, 
                    x: prev.x - e.deltaX, 
                    y: prev.y - e.deltaY 
                }));
            }
        };

        container.addEventListener('wheel', handleWheelNative, { passive: false });
        return () => container.removeEventListener('wheel', handleWheelNative);
    }, [mainRef, setViewTransform]);

    return (
        <div
            ref={mainRef}
            className="flex-fill position-relative overflow-hidden d-flex align-items-center justify-content-center"
            style={{ 
                backgroundColor: '#e8e8e8',
                cursor: isPanning ? 'grabbing' : 'default'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onContextMenu={onCanvasContextMenu}
        >
            {/* Toolbar - Editor only */}
            {activeTab === 'editor' && (
                <Toolbar
                    snapEnabled={snapEnabled}
                    setSnapEnabled={setSnapEnabled}
                    gridSize={gridSize}
                    setGridSize={setGridSize}
                    showGrid={showGrid}
                    setShowGrid={setShowGrid}
                    selectedIds={selectedIds}
                    onAlign={handleAlign}
                    viewTransform={viewTransform}
                    setViewTransform={setViewTransform}
                    centerView={centerView}
                />
            )}

            {/* Background dots */}
            <div 
                className="position-absolute w-100 h-100"
                style={{ 
                    backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', 
                    backgroundSize: '20px 20px', 
                    backgroundPosition: `${viewTransform.x}px ${viewTransform.y}px`,
                    opacity: 0.2,
                    pointerEvents: 'none'
                }} 
            />

            {/* Transform wrapper */}
            <div 
                className="canvas-transform-wrapper"
                style={{ 
                    transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, 
                    transformOrigin: 'center center', 
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                    willChange: 'transform'
                }}
            >
                {activeTab === 'editor' ? (
                    /* Editor Canvas */
                    <div 
                        ref={containerRef} 
                        className="bg-white position-relative"
                        style={{ 
                            width: `${labelSize.width * SCREEN_SCALE}px`, 
                            height: `${labelSize.height * SCREEN_SCALE}px`,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            backgroundImage: showGrid 
                                ? 'radial-gradient(#e5e7eb 1px, transparent 1px)' 
                                : 'none', 
                            backgroundSize: `${gridSize * SCREEN_SCALE}px ${gridSize * SCREEN_SCALE}px`
                        }}
                    >
                        {/* Elements */}
                        {elements.map(el => (
                            <DraggableElement
                                key={el.id}
                                element={el}
                                isSelected={selectedIds.includes(el.id)}
                                onSelect={handleSelect}
                                onUpdate={updateElement}
                                onInteractionEnd={handleInteractionEnd}
                                onMeasure={handleMeasure}
                                onContextMenu={onElementContextMenu}
                                zoomLevel={viewTransform.scale}
                                snapEnabled={snapEnabled}
                                gridSize={gridSize}
                                variableMap={allVariables}
                            />
                        ))}

                        {/* Marquee selection */}
                        {marquee && (
                            <div 
                                style={{
                                    position: 'absolute',
                                    border: '1px solid #1890ff',
                                    backgroundColor: 'rgba(24, 144, 255, 0.1)',
                                    left: Math.min(marquee.startX, marquee.currentX),
                                    top: Math.min(marquee.startY, marquee.currentY),
                                    width: Math.abs(marquee.currentX - marquee.startX),
                                    height: Math.abs(marquee.currentY - marquee.startY),
                                    zIndex: 100,
                                    pointerEvents: 'none'
                                }} 
                            />
                        )}

                        {/* Rulers */}
                        <div 
                            className="position-absolute d-flex justify-content-between text-muted"
                            style={{ 
                                top: -28, 
                                left: 0, 
                                width: '100%', 
                                fontSize: 10, 
                                fontFamily: 'monospace',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        >
                            <span>0</span>
                            <span>{labelSize.width}mm</span>
                        </div>
                        <div 
                            className="position-absolute d-flex flex-column justify-content-between text-muted"
                            style={{ 
                                top: 0, 
                                left: -28, 
                                height: '100%', 
                                fontSize: 10, 
                                fontFamily: 'monospace',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        >
                            <span>0</span>
                            <span>{labelSize.height}mm</span>
                        </div>
                    </div>
                ) : (
                    /* Preview Canvas */
                    <div className="position-relative d-flex flex-column align-items-center">
                        {/* Label paper effect */}
                        <div 
                            className="position-absolute rounded" 
                            style={{ 
                                top: -10, 
                                left: -10, 
                                right: -10, 
                                bottom: -10,
                                backgroundColor: '#f0f4f8',
                                border: '1px solid #cbd5e1',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }} 
                        />
                        <div 
                            className="position-relative overflow-hidden"
                            style={{ 
                                width: `${labelSize.width * SCREEN_SCALE}px`, 
                                height: `${labelSize.height * SCREEN_SCALE}px`,
                                backgroundColor: '#fffdf9',
                                filter: 'contrast(1.05) brightness(0.98)',
                                borderRadius: 2,
                                zIndex: 1
                            }}
                        >
                            {/* Paper texture */}
                            <div 
                                className="position-absolute w-100 h-100"
                                style={{
                                    opacity: 0.06,
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                    backgroundSize: '150px 150px',
                                    mixBlendMode: 'multiply',
                                    pointerEvents: 'none',
                                    zIndex: 20
                                }} 
                            />
                            {/* Preview elements */}
                            {elements.map(el => (
                                <PreviewElement 
                                    key={el.id} 
                                    element={el} 
                                    variableMap={allVariables} 
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Canvas;

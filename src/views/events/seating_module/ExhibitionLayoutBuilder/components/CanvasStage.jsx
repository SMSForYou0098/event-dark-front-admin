import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Switch, Typography } from 'antd';
import { Layer, Line, Stage, Transformer } from 'react-konva';
import ShapeRenderer from './ShapeRenderer';

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const SCALE_BY = 1.08;

const CanvasStage = ({
  elements,
  selectedIds,
  onSelect,
  onClearSelection,
  onDropShape,
  onElementsUpdate,
  snapToGrid,
  snapEnabled,
  gridEnabled,
  onToggleGrid,
  onToggleSnap,
  stageRef,
}) => {
  const wrapperRef = useRef(null);
  const transformerRef = useRef(null);
  const nodeMapRef = useRef({});

  const [size, setSize] = useState({ width: 900, height: 620 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const stageTransformRef = useRef({ scale: 1, position: { x: 0, y: 0 } });

  const elementById = useMemo(() => {
    const map = {};
    elements.forEach((element) => {
      map[element.id] = element;
    });
    return map;
  }, [elements]);

  const selectedElements = useMemo(
    () => selectedIds.map((id) => elementById[id]).filter(Boolean),
    [selectedIds, elementById]
  );

  const isSingleLineSelected = selectedElements.length === 1 && selectedElements[0]?.type === 'line';

  useEffect(() => {
    if (!wrapperRef.current) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(500, entry.contentRect.width);
      const height = Math.max(450, window.innerHeight - 230);
      setSize({ width, height });
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!transformerRef.current) return;
    const nodes = selectedIds
      .map((id) => ({ node: nodeMapRef.current[id], element: elementById[id] }))
      .filter(({ node, element }) => !!node && !!element && (element.entityType !== 'walkway' || element.type === 'line'))
      .map(({ node }) => node)
      .filter(Boolean);

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  useEffect(() => {
    if (!editingId) return;
    const target = elementById[editingId];
    if (!target || target.type !== 'text') {
      setEditingId(null);
      setEditingValue('');
      return;
    }
    setEditingValue(target.text || '');
  }, [editingId, elementById]);

  const handleWheel = (evt) => {
    evt.evt.preventDefault();

    const stage = stageRef?.current || evt.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stageTransformRef.current.scale;
    const oldPosition = stageTransformRef.current.position;
    const mousePointTo = {
      x: (pointer.x - oldPosition.x) / oldScale,
      y: (pointer.y - oldPosition.y) / oldScale,
    };

    const direction = evt.evt.deltaY > 0 ? -1 : 1;
    const nextScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    };

    stageTransformRef.current = {
      scale: clamped,
      position: newPos,
    };
    setStageScale(clamped);
    setStagePosition(newPos);
  };

  const handleDrop = (evt) => {
    evt.preventDefault();

    const shapeType = evt.dataTransfer.getData('shapeType');
    const entityType = evt.dataTransfer.getData('entityType') || undefined;
    if (!shapeType) return;

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointer = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };

    const position = {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    };

    onDropShape(
      shapeType,
      {
        x: snapToGrid(position.x, snapEnabled),
        y: snapToGrid(position.y, snapEnabled),
      },
      { entityType }
    );
  };

  const handleCanvasMouseDown = (evt) => {
    const isStage = evt.target === evt.target.getStage();
    if (!isStage) return;

    if (!evt.evt.shiftKey) {
      onClearSelection();
    }
  };

  const startTextEdit = (id) => {
    const target = elementById[id];
    if (!target || target.type !== 'text') return;
    setEditingId(id);
    setEditingValue(target.text || '');
  };

  const commitTextEdit = () => {
    if (!editingId) return;
    const target = elementById[editingId];
    if (!target) {
      setEditingId(null);
      setEditingValue('');
      return;
    }

    const measuredWidth = Math.max((editingValue || '').length * (target.fontSize || 16) * 0.6 + 20, 80);
    onElementsUpdate([
      {
        id: editingId,
        updates: {
          text: editingValue,
          width: measuredWidth,
          meta: {
            ...(target.meta || {}),
            name: editingValue,
          },
        },
      },
    ]);

    setEditingId(null);
    setEditingValue('');
  };

  const registerNode = (id, node) => {
    if (!node) {
      delete nodeMapRef.current[id];
      return;
    }
    nodeMapRef.current[id] = node;
  };

  const zoomAtPoint = (nextScale, focalPoint) => {
    const oldScale = stageTransformRef.current.scale;
    const oldPosition = stageTransformRef.current.position;

    const mousePointTo = {
      x: (focalPoint.x - oldPosition.x) / oldScale,
      y: (focalPoint.y - oldPosition.y) / oldScale,
    };

    const newPosition = {
      x: focalPoint.x - mousePointTo.x * nextScale,
      y: focalPoint.y - mousePointTo.y * nextScale,
    };

    stageTransformRef.current = {
      scale: nextScale,
      position: newPosition,
    };
    setStageScale(nextScale);
    setStagePosition(newPosition);
  };

  const zoomIn = () => {
    const targetScale = Math.min(MAX_SCALE, stageTransformRef.current.scale + 0.1);
    zoomAtPoint(targetScale, { x: size.width / 2, y: size.height / 2 });
  };

  const zoomOut = () => {
    const targetScale = Math.max(MIN_SCALE, stageTransformRef.current.scale - 0.1);
    zoomAtPoint(targetScale, { x: size.width / 2, y: size.height / 2 });
  };

  const resetView = () => {
    stageTransformRef.current = {
      scale: 1,
      position: { x: 0, y: 0 },
    };
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const getElementCenter = (element) => {
    if (!element) return null;

    if (element.type === 'rect' || element.type === 'square' || element.type === 'text') {
      return {
        x: element.x + (element.width || 0) / 2,
        y: element.y + (element.height || 0) / 2,
      };
    }

    if (element.type === 'line') {
      const points = element.points || [0, 0, 120, 0];
      return {
        x: element.x + (points[0] + points[2]) / 2,
        y: element.y + (points[1] + points[3]) / 2,
      };
    }

    return { x: element.x, y: element.y };
  };

  const focusSelected = () => {
    if (!selectedIds.length) return;

    const targetId = selectedIds[selectedIds.length - 1];
    const targetElement = elementById[targetId];
    const center = getElementCenter(targetElement);
    if (!center) return;

    const currentScale = stageTransformRef.current.scale;
    const nextPosition = {
      x: size.width / 2 - center.x * currentScale,
      y: size.height / 2 - center.y * currentScale,
    };

    stageTransformRef.current = {
      scale: currentScale,
      position: nextPosition,
    };
    setStagePosition(nextPosition);
  };

  const renderGrid = () => {
    if (!gridEnabled) return null;

    const lines = [];
    const gridSize = 20;
    const worldLimit = 4000;

    for (let x = -worldLimit; x <= worldLimit; x += gridSize) {
      lines.push(
        <Line
          key={`grid-x-${x}`}
          points={[x, -worldLimit, x, worldLimit]}
          stroke="#e8e8e8"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    for (let y = -worldLimit; y <= worldLimit; y += gridSize) {
      lines.push(
        <Line
          key={`grid-y-${y}`}
          points={[-worldLimit, y, worldLimit, y]}
          stroke="#e8e8e8"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return lines;
  };

  const handleTransformEnd = () => {
    if (!transformerRef.current) return;

    const nodes = transformerRef.current.nodes() || [];
    const updates = [];

    nodes.forEach((node) => {
      const id = node.id();
      const element = elementById[id];
      if (!element) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      const next = {
        id,
        updates: {
          x: snapToGrid(node.x(), snapEnabled),
          y: snapToGrid(node.y(), snapEnabled),
          rotation: node.rotation(),
        },
      };

      if (element.type === 'rect' || element.type === 'square') {
        next.updates.width = Math.max(20, node.width() * scaleX);
        next.updates.height = Math.max(20, node.height() * scaleY);
      } else if (element.type === 'circle') {
        const radius = Math.max(10, element.radius * Math.max(scaleX, scaleY));
        next.updates.radius = radius;
      } else if (element.type === 'text') {
        const nextFontSize = Math.max(12, (element.fontSize || node.fontSize() || 16) * scaleX);
        const measuredTextWidth = Number(node.getTextWidth?.() || 0);
        const nextWidth = Math.max((measuredTextWidth * scaleX) + 20, 80);
        next.updates.fontSize = nextFontSize;
        next.updates.width = nextWidth;
      } else if (element.type === 'line') {
        const points = node.points() || [0, 0, 120, 0];
        const baseLength = Math.abs((points[2] || 120) - (points[0] || 0));
        const lineLength = Math.max(20, baseLength * Math.abs(scaleX));
        next.updates.points = [0, 0, lineLength, 0];
      } else if (element.type === 'polygon') {
        next.updates.radius = Math.max(10, element.radius * Math.max(scaleX, scaleY));
      }

      updates.push(next);

      node.scaleX(1);
      node.scaleY(1);
    });

    if (updates.length) {
      onElementsUpdate(updates);
    }
  };

  const editingElement = editingId ? elementById[editingId] : null;
  const editorStyle = editingElement ? {
    position: 'absolute',
    left: stagePosition.x + editingElement.x * stageScale,
    top: stagePosition.y + editingElement.y * stageScale,
    width: Math.max((editingElement.width || 120) * stageScale, 80),
    fontSize: (editingElement.fontSize || 16) * stageScale,
    padding: '2px 6px',
    border: '1px solid #1677ff',
    borderRadius: 4,
    background: '#fff',
    color: editingElement.style?.textColor || editingElement.style?.fill || '#202020',
    outline: 'none',
    zIndex: 20,
  } : null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button size="small" onClick={zoomOut}>Zoom -</Button>
          <Button size="small" onClick={zoomIn}>Zoom +</Button>
          <Button size="small" onClick={focusSelected} disabled={!selectedIds.length}>Focus Selected</Button>
          <Button size="small" onClick={resetView}>Reset</Button>
        </Space>
        <Space>
          <Typography.Text>Grid</Typography.Text>
          <Switch checked={gridEnabled} onChange={onToggleGrid} />
          <Typography.Text>Snap</Typography.Text>
          <Switch checked={snapEnabled} onChange={onToggleSnap} />
        </Space>
      </div>

      <div
        ref={wrapperRef}
        onDragOver={(evt) => evt.preventDefault()}
        onDrop={handleDrop}
        style={{
          width: '100%',
          position: 'relative',
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable
          onDragEnd={(evt) => {
            const stage = evt.target.getStage();
            if (evt.target !== stage) return;

            const nextPosition = { x: stage.x(), y: stage.y() };
            stageTransformRef.current = {
              scale: stageTransformRef.current.scale,
              position: nextPosition,
            };
            setStagePosition(nextPosition);
          }}
          onMouseDown={handleCanvasMouseDown}
          onTouchStart={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          <Layer listening={false}>{renderGrid()}</Layer>
          <Layer>
            {elements.map((element) => (
              <ShapeRenderer
                key={element.id}
                element={element}
                isSelected={selectedIds.includes(element.id)}
                isEditingText={editingId === element.id}
                snapToGrid={snapToGrid}
                snapEnabled={snapEnabled}
                registerNode={registerNode}
                onSelect={(id, isShift) => onSelect(id, isShift)}
                onChange={(id, updates) => onElementsUpdate([{ id, updates }])}
                onStartTextEdit={startTextEdit}
              />
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={isSingleLineSelected
                ? ['middle-left', 'middle-right']
                : [
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                  'middle-left',
                  'middle-right',
                  'top-center',
                  'bottom-center',
                ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (isSingleLineSelected) {
                  if (Math.abs(newBox.width) < 20) {
                    return oldBox;
                  }
                  return newBox;
                }

                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                return newBox;
              }}
              onTransformEnd={handleTransformEnd}
              onDragEnd={handleTransformEnd}
            />
          </Layer>
        </Stage>
        {editingElement && editorStyle && (
          <input
            value={editingValue}
            autoFocus
            style={editorStyle}
            onChange={(evt) => setEditingValue(evt.target.value)}
            onBlur={commitTextEdit}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                evt.preventDefault();
                commitTextEdit();
              }
              if (evt.key === 'Escape') {
                evt.preventDefault();
                setEditingId(null);
                setEditingValue('');
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasStage;

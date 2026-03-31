import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Switch, Typography } from 'antd';
import { Layer, Line, Stage, Transformer } from 'react-konva';
import ShapeRenderer from './ShapeRenderer';
import { createTempId } from '../utils/layoutReducer';

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const SCALE_BY = 1.08;

const CanvasStage = ({
  elements,
  selectedIds,
  onSelect,
  onSetSelection,
  onClearSelection,
  onDropShape,
  onAddElements,
  onGroupSelected,
  onUngroupSelected,
  onElementsUpdate,
  snapToGrid,
  snapEnabled,
  gridEnabled,
  onToggleGrid,
  onToggleSnap,
  stageRef,
  activeTool = 'select',
  onSetTool,
}) => {
  const wrapperRef = useRef(null);
  const transformerRef = useRef(null);
  const nodeMapRef = useRef({});

  const [size, setSize] = useState({ width: 900, height: 620 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [dragGuides, setDragGuides] = useState(null);
  const [rotationHint, setRotationHint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const stageTransformRef = useRef({ scale: 1, position: { x: 0, y: 0 } });
  const clipboardRef = useRef([]);
  const pasteCountRef = useRef(0);
  const groupDragRef = useRef(null);

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
  const elementIdsByGroup = useMemo(() => {
    const map = {};
    elements.forEach((element) => {
      if (!element.groupId) return;
      if (!map[element.groupId]) map[element.groupId] = [];
      map[element.groupId].push(element.id);
    });
    return map;
  }, [elements]);

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
  }, [selectedIds, elements, elementById]);

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
    // Only clear selection if we directly click the stage background
    const isStage = evt.target === evt.target.getStage();
    if (!isStage) return;

    if (activeTool === 'select') {
      if (!evt.evt.shiftKey) {
        onClearSelection();
      }
      return;
    }

    // Drawing Logic
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const pos = {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    };

    setIsDrawing(true);

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      setCurrentLine({
        id: createTempId(),
        type: 'freedraw',
        points: [pos.x, pos.y],
        stroke: activeTool === 'eraser' ? '#ffffff' : (elements[0]?.style?.stroke || '#1f1f1f'),
        strokeWidth: activeTool === 'eraser' ? 20 : 2,
        globalCompositeOperation: activeTool === 'eraser' ? 'destination-out' : 'source-over',
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      });
    } else if (activeTool === 'line_draw') {
      setCurrentLine({
        id: createTempId(),
        type: 'line',
        x: pos.x,
        y: pos.y,
        points: [0, 0, 0, 0], // x1, y1, x2, y2 relative to x,y
        stroke: elements[0]?.style?.stroke || '#1f1f1f',
        strokeWidth: 2,
      });
    }
  };

  const handleCanvasMouseMove = (evt) => {
    if (!isDrawing || !currentLine) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const pos = {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    };

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      setCurrentLine(prev => ({
        ...prev,
        points: [...prev.points, pos.x, pos.y],
      }));
    } else if (activeTool === 'line_draw') {
      setCurrentLine(prev => ({
        ...prev,
        points: [0, 0, pos.x - prev.x, pos.y - prev.y],
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentLine) return;

    // Add element to layout
    if (currentLine.points.length > 2 || activeTool === 'line_draw') {
        const finalElement = {
            ...currentLine,
            entityType: activeTool === 'eraser' ? 'annotation' : 'walkway',
            style: {
                stroke: currentLine.stroke,
                strokeWidth: currentLine.strokeWidth,
            },
            meta: {
                name: activeTool === 'eraser' ? 'Eraser Stroke' : (activeTool === 'pencil' ? 'Pencil Stroke' : 'Line'),
                bookable: false,
            }
        };

        if (activeTool === 'eraser') {
            finalElement.type = 'freedraw';
            finalElement.eraser = true;
        }

        onAddElements([finalElement], []);
    }

    setIsDrawing(false);
    setCurrentLine(null);
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

  const createClientId = () => createTempId();

  const getElementBounds = (element) => {
    if (!element) return null;
    if (element.type === 'rect' || element.type === 'square' || element.type === 'text') {
      const width = Number(element.width || 0);
      const height = Number(element.height || 0);
      return {
        left: Number(element.x || 0),
        top: Number(element.y || 0),
        right: Number(element.x || 0) + width,
        bottom: Number(element.y || 0) + height,
      };
    }
    if (element.type === 'circle') {
      const radius = Number(element.radius || 0);
      return {
        left: Number(element.x || 0) - radius,
        top: Number(element.y || 0) - radius,
        right: Number(element.x || 0) + radius,
        bottom: Number(element.y || 0) + radius,
      };
    }
    if (element.type === 'polygon') {
      const radius = Number(element.radius || 0);
      return {
        left: Number(element.x || 0) - radius,
        top: Number(element.y || 0) - radius,
        right: Number(element.x || 0) + radius,
        bottom: Number(element.y || 0) + radius,
      };
    }
    if (element.type === 'line') {
      const points = element.points || [0, 0, 120, 0];
      const x1 = Number(element.x || 0) + Number(points[0] || 0);
      const y1 = Number(element.y || 0) + Number(points[1] || 0);
      const x2 = Number(element.x || 0) + Number(points[2] || 0);
      const y2 = Number(element.y || 0) + Number(points[3] || 0);
      return {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        right: Math.max(x1, x2),
        bottom: Math.max(y1, y2),
      };
    }
    return null;
  };

  const updateGuidesForElement = (draggingId, nextPosition) => {
    const draggingElement = elementById[draggingId];
    if (!draggingElement) return;

    const shiftedElement = { ...draggingElement, ...nextPosition };
    const bounds = getElementBounds(shiftedElement);
    if (!bounds) return;

    const candidatesX = [bounds.left, (bounds.left + bounds.right) / 2, bounds.right];
    const candidatesY = [bounds.top, (bounds.top + bounds.bottom) / 2, bounds.bottom];

    const threshold = 6;
    let matchX = null;
    let matchY = null;

    elements.forEach((element) => {
      if (element.id === draggingId) return;
      const targetBounds = getElementBounds(element);
      if (!targetBounds) return;
      const targetsX = [targetBounds.left, (targetBounds.left + targetBounds.right) / 2, targetBounds.right];
      const targetsY = [targetBounds.top, (targetBounds.top + targetBounds.bottom) / 2, targetBounds.bottom];

      candidatesX.forEach((candidateX) => {
        targetsX.forEach((targetX) => {
          const distance = Math.abs(candidateX - targetX);
          if (distance <= threshold && (!matchX || distance < matchX.distance)) {
            matchX = { value: targetX, distance };
          }
        });
      });

      candidatesY.forEach((candidateY) => {
        targetsY.forEach((targetY) => {
          const distance = Math.abs(candidateY - targetY);
          if (distance <= threshold && (!matchY || distance < matchY.distance)) {
            matchY = { value: targetY, distance };
          }
        });
      });
    });

    if (!matchX && !matchY) {
      setDragGuides(null);
      return;
    }

    const guideExtent = 4000;
    setDragGuides({
      vertical: matchX ? [matchX.value, -guideExtent, matchX.value, guideExtent] : null,
      horizontal: matchY ? [-guideExtent, matchY.value, guideExtent, matchY.value] : null,
    });
  };

  const handleElementDragMove = (id, position) => {
    const activeGroupDrag = groupDragRef.current;
    if (activeGroupDrag?.leaderId === id && activeGroupDrag.memberStarts?.length) {
      const dx = position.x - activeGroupDrag.leaderStart.x;
      const dy = position.y - activeGroupDrag.leaderStart.y;
      activeGroupDrag.memberStarts.forEach((member) => {
        if (member.id === id) return;
        const memberNode = nodeMapRef.current[member.id];
        if (!memberNode) return;
        memberNode.position({
          x: member.x + dx,
          y: member.y + dy,
        });
      });
      nodeMapRef.current[id]?.getLayer?.()?.batchDraw();
    }

    updateGuidesForElement(id, position);
  };

  const handleElementDragStart = (id) => {
    const element = elementById[id];
    if (!element?.groupId) {
      groupDragRef.current = null;
      return;
    }

    const groupMemberIds = elementIdsByGroup[element.groupId] || [];
    if (groupMemberIds.length < 2) {
      groupDragRef.current = null;
      return;
    }

    const leaderNode = nodeMapRef.current[id];
    if (!leaderNode) {
      groupDragRef.current = null;
      return;
    }

    const memberStarts = groupMemberIds
      .map((memberId) => {
        const memberNode = nodeMapRef.current[memberId];
        if (!memberNode) return null;
        return {
          id: memberId,
          x: memberNode.x(),
          y: memberNode.y(),
        };
      })
      .filter(Boolean);

    groupDragRef.current = {
      leaderId: id,
      leaderStart: {
        x: leaderNode.x(),
        y: leaderNode.y(),
      },
      memberStarts,
    };
  };

  const handleElementDragEnd = (id, updates) => {
    setDragGuides(null);
    const activeGroupDrag = groupDragRef.current;
    if (activeGroupDrag?.leaderId === id && activeGroupDrag.memberStarts?.length) {
      const groupUpdates = activeGroupDrag.memberStarts
        .map((member) => {
          const memberNode = nodeMapRef.current[member.id];
          if (!memberNode) return null;
          return {
            id: member.id,
            updates: {
              x: snapToGrid(memberNode.x(), snapEnabled),
              y: snapToGrid(memberNode.y(), snapEnabled),
            },
          };
        })
        .filter(Boolean);
      groupDragRef.current = null;
      if (groupUpdates.length) {
        onElementsUpdate(groupUpdates);
        return;
      }
    }

    groupDragRef.current = null;
    onElementsUpdate([{ id, updates }]);
  };

  useEffect(() => {
    const listener = (evt) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(activeTag) || document.activeElement?.isContentEditable;
      if (isTyping) return;

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'c') {
        const liveSelectedIds = (transformerRef.current?.nodes?.() || [])
          .map((node) => node.id?.())
          .filter(Boolean);
        const activeSelectionIds = liveSelectedIds.length ? liveSelectedIds : selectedIds;
        if (!activeSelectionIds.length) return;
        evt.preventDefault();
        const selected = activeSelectionIds
          .map((id) => elementById[id])
          .filter(Boolean)
          .map((item) => JSON.parse(JSON.stringify(item)));
        clipboardRef.current = selected;
        pasteCountRef.current = 0;
      }

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'v') {
        if (!clipboardRef.current.length || typeof onAddElements !== 'function') return;
        evt.preventDefault();
        pasteCountRef.current += 1;
        const offset = 20 * pasteCountRef.current;
        const pastedGroupMap = {};
        const clones = clipboardRef.current.map((item) => ({
          ...item,
          id: createTempId(),
          groupId: item.groupId
            ? (pastedGroupMap[item.groupId] || (pastedGroupMap[item.groupId] = `group_${Date.now()}_${Math.floor(Math.random() * 100000)}`))
            : undefined,
          x: Number(item.x || 0) + offset,
          y: Number(item.y || 0) + offset,
        }));
        onAddElements(clones, clones.map((item) => item.id));
      }

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'g' && !evt.shiftKey) {
        if (selectedIds.length < 2 || typeof onGroupSelected !== 'function') return;
        evt.preventDefault();
        onGroupSelected();
      }

      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'g' && evt.shiftKey) {
        if (!selectedIds.length || typeof onUngroupSelected !== 'function') return;
        evt.preventDefault();
        onUngroupSelected();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [selectedIds, elementById, onAddElements, onGroupSelected, onUngroupSelected]);

  const handleElementSelect = (id, isShift) => {
    const element = elementById[id];
    const groupIds = element?.groupId ? (elementIdsByGroup[element.groupId] || [id]) : [id];

    if (!isShift) {
      if (groupIds.length > 1 && typeof onSetSelection === 'function') {
        onSetSelection(groupIds);
        return;
      }
      onSelect(id, false);
      return;
    }

    if (groupIds.length === 1) {
      onSelect(id, true);
      return;
    }

    const isFullySelected = groupIds.every((groupId) => selectedIds.includes(groupId));
    if (typeof onSetSelection === 'function') {
      if (isFullySelected) {
        onSetSelection(selectedIds.filter((selectedId) => !groupIds.includes(selectedId)));
      } else {
        onSetSelection(Array.from(new Set([...selectedIds, ...groupIds])));
      }
      return;
    }

    groupIds.forEach((groupId) => onSelect(groupId, true));
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
          strokeWidth={0.1}
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
          strokeWidth={0.1}
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
      const isFlippedX = scaleX < 0;
      const isFlippedY = scaleY < 0;

      const next = {
        id,
        updates: {
          x: snapToGrid(node.x(), snapEnabled),
          y: snapToGrid(node.y(), snapEnabled),
          rotation: node.rotation(),
          scaleX: isFlippedX ? -1 : 1,
          scaleY: isFlippedY ? -1 : 1,
        },
      };

      const absScaleX = Math.abs(scaleX);
      const absScaleY = Math.abs(scaleY);

      if (element.type === 'rect' || element.type === 'square') {
        next.updates.width = Math.max(20, node.width() * absScaleX);
        next.updates.height = Math.max(20, node.height() * absScaleY);
      } else if (element.type === 'circle') {
        const radius = Math.max(10, element.radius * Math.max(absScaleX, absScaleY));
        next.updates.radius = radius;
      } else if (element.type === 'text') {
        const nextFontSize = Math.max(12, (element.fontSize || node.fontSize() || 16) * absScaleX);
        const measuredTextWidth = Number(node.getTextWidth?.() || 0);
        const nextWidth = Math.max((measuredTextWidth * absScaleX) + 20, 80);
        next.updates.fontSize = nextFontSize;
        next.updates.width = nextWidth;
      } else if (element.type === 'line') {
        const points = node.points() || [0, 0, 120, 0];
        const baseLength = Math.abs((points[2] || 120) - (points[0] || 0));
        const lineLength = Math.max(20, baseLength * Math.abs(scaleX));
        next.updates.points = [0, 0, lineLength, 0];
      } else if (element.type === 'polygon') {
        next.updates.radius = Math.max(10, element.radius * Math.max(absScaleX, absScaleY));
      } else if (element.type === 'L_shape' || element.type === 'T_shape') {
        next.updates.width = Math.max(20, (element.width || 120) * absScaleX);
        next.updates.height = Math.max(20, (element.height || 120) * absScaleY);
      }

      updates.push(next);

      node.scaleX(isFlippedX ? -1 : 1);
      node.scaleY(isFlippedY ? -1 : 1);
    });

    if (updates.length) {
      onElementsUpdate(updates);
    }
    setRotationHint(null);
  };

  const updateRotationHint = () => {
    const transformer = transformerRef.current;
    if (!transformer) {
      setRotationHint(null);
      return;
    }
    const activeAnchor = transformer.getActiveAnchor?.();
    if (activeAnchor !== 'rotater') {
      setRotationHint(null);
      return;
    }

    const nodes = transformer.nodes() || [];
    const targetNode = nodes[0];
    if (!targetNode) {
      setRotationHint(null);
      return;
    }

    const rect = targetNode.getClientRect({ skipShadow: true, skipStroke: false });
    const worldX = rect.x + (rect.width / 2);
    const worldY = rect.y - 18;
    const angle = Number(targetNode.rotation?.() || 0);
    const normalizedAngle = ((Math.round(angle) % 360) + 360) % 360;

    setRotationHint({
      angle: normalizedAngle,
      left: stagePosition.x + (worldX * stageScale),
      top: stagePosition.y + (worldY * stageScale),
    });
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
        className='border-secondary'
        style={{
          width: '100%',
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          //background: '#fff',
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
          draggable={activeTool === 'select'}
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
          onMouseMove={handleCanvasMouseMove}
          onTouchMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onTouchEnd={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          <Layer listening={false}>{renderGrid()}</Layer>
          <Layer listening={false}>
            {dragGuides?.vertical && (
              <Line
                points={dragGuides.vertical}
                stroke="#1677ff"
                strokeWidth={1}
                dash={[6, 6]}
              />
            )}
            {dragGuides?.horizontal && (
              <Line
                points={dragGuides.horizontal}
                stroke="#1677ff"
                strokeWidth={1}
                dash={[6, 6]}
              />
            )}
          </Layer>
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
                onSelect={handleElementSelect}
                onChange={(id, updates) => onElementsUpdate([{ id, updates }])}
                onDragStart={handleElementDragStart}
                onDragMove={handleElementDragMove}
                onDragEnd={handleElementDragEnd}
                onStartTextEdit={setEditingId}
                activeTool={activeTool}
              />
            ))}
            {currentLine && (
              <ShapeRenderer 
                element={currentLine} 
                isSelected={false} 
                activeTool={activeTool}
                isDrawing={true}
              />
            )}
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
              onTransformStart={updateRotationHint}
              onTransform={updateRotationHint}
              onDragEnd={handleTransformEnd}
            />
          </Layer>
        </Stage>
        {rotationHint && (
          <div
            style={{
              position: 'absolute',
              left: rotationHint.left,
              top: rotationHint.top,
              transform: 'translate(-50%, -100%)',
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(0, 0, 0, 0.78)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
              pointerEvents: 'none',
              zIndex: 25,
              userSelect: 'none',
            }}
          >
            {rotationHint.angle}deg
          </div>
        )}
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

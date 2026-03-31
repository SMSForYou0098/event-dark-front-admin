import React from 'react';
import {
  Rect,
  Circle,
  Text,
  Line,
  RegularPolygon,
  Group,
} from 'react-konva';

const getReadableTextColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return '#000000';
  const clean = hexColor.replace('#', '').trim();
  const normalized = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  if (normalized.length !== 6) return '#000000';

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((val) => Number.isNaN(val))) return '#000000';

  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
  return luminance < 150 ? '#ffffff' : '#000000';
};

const ShapeRenderer = ({
  element,
  isSelected,
  isEditingText,
  snapToGrid,
  snapEnabled,
  onSelect,
  onDragStart,
  onChange,
  onDragMove,
  onStartTextEdit,
  registerNode,
  activeTool = 'select',
  isDrawing = false,
}) => {
  const style = element.style || {};
  const isEditable = !isDrawing && (activeTool === 'select' || isSelected) && (element.entityType !== 'walkway' || element.type === 'line' || element.type === 'freedraw');

  const handleSelect = (evt) => {
    if (activeTool !== 'select') return;
    const isShift = evt?.evt?.shiftKey;
    onSelect(element.id, isShift);
  };

  const handleDragEnd = (evt) => {
    const x = evt.target.x();
    const y = evt.target.y();

    onChange(element.id, {
      x: snapToGrid(x, snapEnabled),
      y: snapToGrid(y, snapEnabled),
    });
  };

  const handleDragStart = (evt) => {
    if (!onDragStart) return;
    onDragStart(element.id, {
      x: evt.target.x(),
      y: evt.target.y(),
    });
  };

  const handleDragMove = (evt) => {
    if (!onDragMove) return;
    onDragMove(element.id, {
      x: evt.target.x(),
      y: evt.target.y(),
    });
  };

  const commonProps = {
    ref: (node) => registerNode?.(element.id, node),
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    scaleX: element.scaleX || 1,
    scaleY: element.scaleY || 1,
    draggable: isEditable,
    onClick: handleSelect,
    onTap: handleSelect,
    onDragStart: isEditable ? handleDragStart : undefined,
    onDragEnd: isEditable ? handleDragEnd : undefined,
    onDragMove: isEditable ? handleDragMove : undefined,
    stroke: element.stroke || style.stroke || '#1f1f1f',
    strokeWidth: element.strokeWidth || style.strokeWidth || 1,
    listening: !isDrawing,
    shadowColor: isSelected ? '#1677ff' : undefined,
    shadowBlur: isSelected ? 8 : 0,
    shadowOpacity: isSelected ? 0.4 : 0,
    globalCompositeOperation: element.globalCompositeOperation || 'source-over',
  };

  const getCenteredLabelPosition = () => {
    if (element.type === 'circle') {
      return { x: element.x, y: element.y };
    }

    if (element.type === 'polygon') {
      return { x: element.x, y: element.y };
    }

    if (element.type === 'line' || element.type === 'freedraw') {
      const points = element.points || [0, 0, 120, 0];
      // simplified center for complex paths
      return {
        x: element.x + (points[0] + (points[points.length - 2] || 0)) / 2,
        y: element.y + (points[1] + (points[points.length - 1] || 0)) / 2,
      };
    }

    return {
      x: element.x + (element.width || 0) / 2,
      y: element.y + (element.height || 0) / 2,
    };
  };

  const shouldShowEntityLabel = element.type !== 'text' && element.display?.showLabel;
  const entityLabel = element.meta?.name || '';
  const centeredLabel = getCenteredLabelPosition();
  const labelColor = style.textColor || getReadableTextColor(style.fill || '#cfcfcf');

  if (element.type === 'rect' || element.type === 'square') {
    return (
      <>
        <Rect
          {...commonProps}
          width={element.width}
          height={element.height}
          fill={style.fill}
        />
        {shouldShowEntityLabel && !!entityLabel && (
          <Text
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            text={entityLabel}
            fontSize={14}
            fill={labelColor}
            align="center"
            verticalAlign="middle"
            width={Math.max((element.width || 120) - 8, 40)}
            height={Math.max(element.height || 60, 24)}
            listening={false}
            wrap="none"
            ellipsis
          />
        )}
      </>
    );
  }

  if (element.type === 'circle') {
    return (
      <>
        <Circle
          {...commonProps}
          radius={element.radius || 50}
          fill={style.fill}
        />
        {shouldShowEntityLabel && !!entityLabel && (
          <Text
            x={centeredLabel.x}
            y={centeredLabel.y}
            rotation={element.rotation || 0}
            text={entityLabel}
            fontSize={14}
            fill={labelColor}
            align="center"
            verticalAlign="middle"
            width={Math.max((element.radius || 50) * 2 - 8, 40)}
            offsetX={Math.max((element.radius || 50) * 2 - 8, 40) / 2}
            offsetY={7}
            listening={false}
            wrap="none"
            ellipsis
          />
        )}
      </>
    );
  }

  if (element.type === 'line' || element.type === 'freedraw') {
    return (
      <>
        <Line
          {...commonProps}
          points={element.points || [0, 0, 120, 0]}
          hitStrokeWidth={12}
          lineCap={element.lineCap || "round"}
          lineJoin={element.lineJoin || "round"}
          tension={element.type === 'freedraw' ? (element.tension ?? 0.5) : 0}
          fill={style.fill}
          closed={element.closed}
        />
        {shouldShowEntityLabel && !!entityLabel && (
          <Text
            x={centeredLabel.x}
            y={centeredLabel.y - 16}
            rotation={element.rotation || 0}
            text={entityLabel}
            fontSize={13}
            fill={labelColor}
            align="center"
            width={Math.max((element.points?.[2] || 120), 40)}
            offsetX={Math.max((element.points?.[2] || 120), 40) / 2}
            listening={false}
            wrap="none"
            ellipsis
          />
        )}
      </>
    );
  }

  if (element.type === 'L_shape' || element.type === 'T_shape') {
    const w = element.width || 120;
    const h = element.height || 120;
    const ix = element.insetX ?? element.inset ?? 0.35;
    const iy = element.insetY ?? element.inset ?? 0.35;
    
    const points = element.type === 'L_shape' 
        ? [0, 0, w * ix, 0, w * ix, h * (1 - iy), w, h * (1 - iy), w, h, 0, h]
        : [0, 0, w, 0, w, h * iy, w * (1 - ix), h * iy, w * (1 - ix), h, w * ix, h, w * ix, h * iy, 0, h * iy];

    const showHandles = isSelected && !isDrawing && activeTool === 'select';

    return (
      <Group {...commonProps} draggable={isEditable}>
        <Line
          points={points}
          fill={style.fill}
          stroke={element.stroke || style.stroke || '#1f1f1f'}
          strokeWidth={element.strokeWidth || style.strokeWidth || 1}
          closed={true}
        />
        {shouldShowEntityLabel && !!entityLabel && (
          <>
            {/* Label in Vertical Bar (Rotated) */}
            <Text
              text={entityLabel}
              fontSize={14}
              fill="#000000"
              align="center"
              verticalAlign="middle"
              x={(w * ix) / 2}
              y={h / 2}
              width={h}
              height={w * ix}
              rotation={-90}
              offsetX={h / 2}
              offsetY={(w * ix) / 2}
              scaleX={element.scaleX < 0 ? -1 : 1}
              scaleY={element.scaleY < 0 ? -1 : 1}
              listening={false}
              wrap="none"
              ellipsis
            />
            {/* Label in Horizontal Bar (L-shape only) */}
            {element.type === 'L_shape' && (
              <Text
                text={entityLabel}
                fontSize={14}
                fill="#000000"
                align="center"
                verticalAlign="middle"
                x={w * ix}
                y={h * (1 - iy)}
                width={w * (1 - ix)}
                height={h * iy}
                scaleX={element.scaleX < 0 ? -1 : 1}
                scaleY={element.scaleY < 0 ? -1 : 1}
                offsetX={element.scaleX < 0 ? w * (1 - ix) : 0}
                offsetY={element.scaleY < 0 ? h * iy : 0}
                listening={false}
                wrap="none"
                ellipsis
              />
            )}
          </>
        )}
        
        {showHandles && (
          <>
            {/* L-Shape Specific Handles */}
            {element.type === 'L_shape' && (
              <>
                {/* Horizontal Bar Width (Top Inner) */}
                <Rect
                  x={w * ix}
                  y={0}
                  width={10}
                  height={10}
                  offsetX={5}
                  offsetY={5}
                  fill="#1677ff"
                  stroke="#fff"
                  strokeWidth={1}
                  draggable
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const newIx = Math.max(0.1, Math.min(0.9, e.target.x() / w));
                    onChange(element.id, { insetX: newIx });
                  }}
                  onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'ew-resize'; }}
                  onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
                />
                {/* Vertical Bar Height (Right Inner) */}
                <Rect
                  x={w}
                  y={h * (1 - iy)}
                  width={10}
                  height={10}
                  offsetX={5}
                  offsetY={5}
                  fill="#1677ff"
                  stroke="#fff"
                  strokeWidth={1}
                  draggable
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const newIy = Math.max(0.1, Math.min(0.9, 1 - (e.target.y() / h)));
                    onChange(element.id, { insetY: newIy });
                  }}
                  onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'ns-resize'; }}
                  onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
                />
                {/* Corner Joint (Middle Inner) */}
                <Rect
                  x={w * ix}
                  y={h * (1 - iy)}
                  width={12}
                  height={12}
                  offsetX={6}
                  offsetY={6}
                  fill="#1677ff"
                  stroke="#fff"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const newIx = Math.max(0.1, Math.min(0.9, e.target.x() / w));
                    const newIy = Math.max(0.1, Math.min(0.9, 1 - (e.target.y() / h)));
                    onChange(element.id, { insetX: newIx, insetY: newIy });
                  }}
                  onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'move'; }}
                  onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
                />
              </>
            )}

            {/* T-Shape Specific Handles */}
            {element.type === 'T_shape' && (
              <>
                {/* Bar Height Handle */}
                <Rect
                  x={w / 2}
                  y={h * iy}
                  width={10}
                  height={10}
                  offsetX={5}
                  offsetY={5}
                  fill="#1677ff"
                  stroke="#fff"
                  strokeWidth={1}
                  draggable
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const newIy = Math.max(0.1, Math.min(0.9, e.target.y() / h));
                    onChange(element.id, { insetY: newIy });
                  }}
                  onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'ns-resize'; }}
                  onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
                />
                {/* Stem Width Handle (Left) */}
                <Rect
                  x={w * ix}
                  y={h * iy}
                  width={10}
                  height={10}
                  offsetX={5}
                  offsetY={5}
                  fill="#1677ff"
                  stroke="#fff"
                  strokeWidth={1}
                  draggable
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const newIx = Math.max(0.1, Math.min(0.45, e.target.x() / w));
                    onChange(element.id, { insetX: newIx });
                  }}
                  onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'ew-resize'; }}
                  onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
                />
              </>
            )}
          </>
        )}
      </Group>
    );
  }

  if (element.type === 'polygon') {
    return (
      <>
        <RegularPolygon
          {...commonProps}
          sides={element.sides || 5}
          radius={element.radius || 55}
          fill={style.fill}
        />
        {shouldShowEntityLabel && !!entityLabel && (
          <Text
            x={centeredLabel.x}
            y={centeredLabel.y}
            rotation={element.rotation || 0}
            text={entityLabel}
            fontSize={14}
            fill={labelColor}
            align="center"
            verticalAlign="middle"
            width={Math.max((element.radius || 55) * 2 - 8, 40)}
            offsetX={Math.max((element.radius || 55) * 2 - 8, 40) / 2}
            offsetY={7}
            listening={false}
            wrap="none"
            ellipsis
          />
        )}
      </>
    );
  }

  return (
    <Text
      {...commonProps}
      text={element.text || element.name || 'Label'}
      fontSize={element.fontSize || 20}
      fill={style.textColor || style.fill || '#202020'}
      width={Math.max(element.width || 100, 80)}
      wrap="none"
      visible={!isEditingText}
      onDblClick={() => onStartTextEdit?.(element.id)}
      onDblTap={() => onStartTextEdit?.(element.id)}
    />
  );
};

export default ShapeRenderer;

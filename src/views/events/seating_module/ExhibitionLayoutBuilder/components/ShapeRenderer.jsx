import React from 'react';
import {
  Rect,
  Circle,
  Text,
  Line,
  RegularPolygon,
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
}) => {
  const style = element.style || {};
  const isEditable = element.entityType !== 'walkway' || element.type === 'line';

  const handleSelect = (evt) => {
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
    ref: (node) => registerNode(element.id, node),
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    draggable: isEditable,
    onClick: handleSelect,
    onTap: handleSelect,
    onDragStart: isEditable ? handleDragStart : undefined,
    onDragEnd: isEditable ? handleDragEnd : undefined,
    onDragMove: isEditable ? handleDragMove : undefined,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth || 1,
    listening: true,
    shadowColor: isSelected ? '#1677ff' : undefined,
    shadowBlur: isSelected ? 8 : 0,
    shadowOpacity: isSelected ? 0.4 : 0,
  };

  const getCenteredLabelPosition = () => {
    if (element.type === 'circle') {
      return { x: element.x, y: element.y };
    }

    if (element.type === 'polygon') {
      return { x: element.x, y: element.y };
    }

    if (element.type === 'line') {
      const points = element.points || [0, 0, 120, 0];
      return {
        x: element.x + (points[0] + points[2]) / 2,
        y: element.y + (points[1] + points[3]) / 2,
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
  const labelColor = style.textColor || getReadableTextColor(style.fill);

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

  if (element.type === 'line') {
    return (
      <>
        <Line
          {...commonProps}
          points={element.points || [0, 0, 120, 0]}
          hitStrokeWidth={12}
          lineCap="round"
          lineJoin="round"
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

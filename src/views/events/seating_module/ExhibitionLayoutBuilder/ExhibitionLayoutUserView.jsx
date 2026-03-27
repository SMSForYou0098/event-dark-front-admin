import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Drawer, Empty, Space, Spin, Tag, Typography } from 'antd';
import { Circle, Layer, Line, Rect, RegularPolygon, Stage, Text } from 'react-konva';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const SCALE_BY = 1.08;

const getElementStyle = (element = {}) => ({
  fill: element?.style?.fill ?? element?.fill ?? '#cfcfcf',
  stroke: element?.style?.stroke ?? element?.stroke ?? '#1f1f1f',
  strokeWidth: Number(element?.style?.strokeWidth ?? element?.strokeWidth ?? 1),
  textColor: element?.style?.textColor ?? element?.textColor ?? '#000000',
});

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

const isStallElement = (element = {}) => element?.entityType === 'stall';

const getLabelText = (element = {}) => element?.meta?.name || element?.name || '';

const ExhibitionLayoutUserView = () => {
  const { id } = useParams();

  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const stageTransformRef = useRef({ scale: 1, position: { x: 0, y: 0 } });

  const [size, setSize] = useState({ width: 900, height: 620 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [selectedStall, setSelectedStall] = useState(null);

  const { data: layoutData, isLoading, error } = useQuery({
    queryKey: ['stall-layout-user-view', id],
    queryFn: async () => {
      const res = await api.get(`stall-layout/${id}`);
      if (res?.status === false) {
        throw new Error(Utils.getErrorMessage(res, 'Failed to fetch layout'));
      }
      return res?.data || res;
    },
    enabled: !!id,
    staleTime: 0,
  });

  const elements = useMemo(() => {
    const rawCanvas = layoutData?.canvas;
    if (!rawCanvas) return [];

    try {
      const parsed = typeof rawCanvas === 'string' ? JSON.parse(rawCanvas) : rawCanvas;
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      return [];
    }
  }, [layoutData]);

  useEffect(() => {
    if (!wrapperRef.current) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(500, entry.contentRect.width);
      const height = Math.max(420, window.innerHeight - 240);
      setSize({ width, height });
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

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

  const resetView = () => {
    stageTransformRef.current = {
      scale: 1,
      position: { x: 0, y: 0 },
    };
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    const targetScale = Math.min(MAX_SCALE, stageTransformRef.current.scale + 0.1);
    zoomAtPoint(targetScale, { x: size.width / 2, y: size.height / 2 });
  };

  const zoomOut = () => {
    const targetScale = Math.max(MIN_SCALE, stageTransformRef.current.scale - 0.1);
    zoomAtPoint(targetScale, { x: size.width / 2, y: size.height / 2 });
  };

  const handleStallClick = (element) => {
    if (!isStallElement(element)) return;
    setSelectedStall(element);
  };

  const renderElement = (element) => {
    const style = getElementStyle(element);
    const label = getLabelText(element);
    const showLabel = element?.type !== 'text' && element?.display?.showLabel !== false;
    const labelColor = style.textColor || getReadableTextColor(style.fill);
    const commonProps = {
      key: element.id,
      id: element.id,
      x: Number(element.x || 0),
      y: Number(element.y || 0),
      rotation: Number(element.rotation || 0),
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      listening: true,
      onClick: () => handleStallClick(element),
      onTap: () => handleStallClick(element),
    };

    if (element.type === 'rect' || element.type === 'square') {
      const width = Number(element.width || 100);
      const height = Number(element.height || 100);
      return (
        <React.Fragment key={element.id}>
          <Rect {...commonProps} width={width} height={height} fill={style.fill} />
          {showLabel && !!label && (
            <Text
              x={Number(element.x || 0)}
              y={Number(element.y || 0) + (height / 2) - 7}
              text={label}
              fontSize={14}
              fill={labelColor}
              align="center"
              width={Math.max(width - 8, 40)}
              listening={false}
              wrap="none"
              ellipsis
            />
          )}
        </React.Fragment>
      );
    }

    if (element.type === 'circle') {
      const radius = Number(element.radius || 50);
      return (
        <React.Fragment key={element.id}>
          <Circle {...commonProps} radius={radius} fill={style.fill} />
          {showLabel && !!label && (
            <Text
              x={Number(element.x || 0) - radius}
              y={Number(element.y || 0) - 7}
              text={label}
              fontSize={14}
              fill={labelColor}
              align="center"
              width={Math.max(radius * 2, 40)}
              listening={false}
              wrap="none"
              ellipsis
            />
          )}
        </React.Fragment>
      );
    }

    if (element.type === 'line') {
      const points = Array.isArray(element.points) ? element.points : [0, 0, 120, 0];
      return (
        <React.Fragment key={element.id}>
          <Line {...commonProps} points={points} hitStrokeWidth={12} lineCap="round" lineJoin="round" />
          {showLabel && !!label && (
            <Text
              x={Number(element.x || 0)}
              y={Number(element.y || 0) - 16}
              text={label}
              fontSize={13}
              fill={labelColor}
              align="center"
              width={Math.max(Number(points?.[2] || 120), 40)}
              listening={false}
              wrap="none"
              ellipsis
            />
          )}
        </React.Fragment>
      );
    }

    if (element.type === 'polygon') {
      const radius = Number(element.radius || 55);
      return (
        <React.Fragment key={element.id}>
          <RegularPolygon
            {...commonProps}
            sides={Number(element.sides || 5)}
            radius={radius}
            fill={style.fill}
          />
          {showLabel && !!label && (
            <Text
              x={Number(element.x || 0) - radius}
              y={Number(element.y || 0) - 7}
              text={label}
              fontSize={14}
              fill={labelColor}
              align="center"
              width={Math.max(radius * 2, 40)}
              listening={false}
              wrap="none"
              ellipsis
            />
          )}
        </React.Fragment>
      );
    }

    return (
      <Text
        {...commonProps}
        text={element.text || element.name || 'Label'}
        fontSize={Number(element.fontSize || 20)}
        fill={style.textColor || style.fill || '#202020'}
        width={Math.max(Number(element.width || 100), 80)}
        wrap="none"
      />
    );
  };

  return (
    <div className="container-fluid" style={{ padding: 12 }}>
      <Spin spinning={isLoading}>
        <Card
          title={layoutData?.name || 'Exhibition Layout'}
          size="small"
          extra={(
            <Space>
              <Button size="small" onClick={zoomOut}>Zoom -</Button>
              <Button size="small" onClick={zoomIn}>Zoom +</Button>
              <Button size="small" onClick={resetView}>Reset</Button>
            </Space>
          )}
        >
          {error && (
            <Typography.Text type="danger">
              {Utils.getErrorMessage(error, 'Failed to load layout')}
            </Typography.Text>
          )}

          {!error && !elements.length && (
            <Empty description="No layout data available" />
          )}

          {!error && !!elements.length && (
            <div
              ref={wrapperRef}
              style={{
                width: '100%',
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
                onWheel={handleWheel}
              >
                <Layer>
                  {elements.map((element) => renderElement(element))}
                </Layer>
              </Stage>
            </div>
          )}
        </Card>
      </Spin>

      <Drawer
        title={selectedStall?.meta?.name || selectedStall?.name || 'Stall Details'}
        placement="right"
        width={360}
        open={!!selectedStall}
        onClose={() => setSelectedStall(null)}
      >
        {selectedStall ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Entity Type">
              <Tag color="blue">{selectedStall?.entityType || 'N/A'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {selectedStall?.meta?.name || selectedStall?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {selectedStall?.meta?.price ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Bookable">
              <Tag color={selectedStall?.meta?.bookable ? 'green' : 'default'}>
                {selectedStall?.meta?.bookable ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
};

export default ExhibitionLayoutUserView;
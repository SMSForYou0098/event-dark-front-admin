import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Badge,
  Button,
  Empty,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  InfoCircleOutlined,
  BankOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { SAMPLE_STADIUM_LAYOUT, DEFAULT_SPECIAL_ZONES } from './sampleLayout';
import SeatsGrid from '../stadium builder/SeatsGrid';
import TierViewer from '../stadium builder/TierViewer';
import SectionViewer from '../stadium builder/SectionViewer';
import SelectedSeatsModal from '../stadium builder/SelectedSeatsModal';
import { useMyContext } from 'Context/MyContextProvider';

const { Text, Title } = Typography;

const TWO_PI = Math.PI * 2;
const DEGREE_OFFSET = -Math.PI / 2;
const STAND_COLORS = [
  '#56CCF2',
  '#2F80ED',
  '#F2994A',
  '#F2C94C',
  '#27AE60',
  '#9B51E0',
  '#EB5757',
  '#F299CE',
];
const TIER_COLORS = ['#ff9f43', '#1dd1a1', '#54a0ff', '#c56cf0'];
const SECTION_COLORS = ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.32)'];

const BACKGROUND_COLOR = '#030712';
const GRID_COLOR = 'rgba(255,255,255,0.03)';
const BORDER_COLOR = 'rgba(255,255,255,0.2)';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const drawArcSegment = (ctx, {
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  stroke = BORDER_COLOR,
  lineWidth = 1,
  shadowBlur = 0,
  shadowColor = 'rgba(0,0,0,0.4)',
}) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, startAngle, endAngle, false);
  ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowColor = shadowColor;
  ctx.fill();

  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.restore();
};

const drawTextAlongArc = (ctx, text, {
  cx,
  cy,
  radius,
  angle,
  color = '#f5f5f5',
  font = '13px Poppins, sans-serif',
}) => {
  ctx.save();
  ctx.translate(
    cx + Math.cos(angle) * radius,
    cy + Math.sin(angle) * radius,
  );
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
};

const createGeometry = (stands, { width, height }) => {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;
  const outerRadius = radius * 0.92;
  const standThickness = clamp(outerRadius * 0.16, 55, 95);
  const tierThickness = clamp(outerRadius * 0.08, 26, 42);
  const tierGap = clamp(outerRadius * 0.009, 4, 8);
  const standGapRatio = 0.08;

  const totalWeight = stands.reduce(
    (sum, s) => sum + (Number(s.visualWeight) || 1),
    0,
  ) || 1;
  const standCount = stands.length || 1;
  const baseGap = (TWO_PI / standCount) * standGapRatio;
  const anglesAvailable = TWO_PI - baseGap * standCount;

  const maxTiers = Math.max(
    ...stands.map((stand) => (stand.tiers?.length || 0)),
    1,
  );

  const innermostRadius =
    outerRadius - standThickness - (maxTiers * (tierThickness + tierGap)) - 12;

  const geometry = {
    cx,
    cy,
    outerRadius,
    standThickness,
    tierThickness,
    tierGap,
    innermostRadius,
    stands: [],
  };

  let cursorAngle = 0;

  stands.forEach((stand, index) => {
    const weight = Number(stand.visualWeight) || 1;
    const spanAngle = anglesAvailable * (weight / totalWeight);
    const relativeStart = cursorAngle + baseGap / 2;
    const relativeEnd = relativeStart + spanAngle;
    const startAngle = DEGREE_OFFSET + relativeStart;
    const endAngle = DEGREE_OFFSET + relativeEnd;
    cursorAngle = relativeEnd + baseGap / 2;

    const standColor = STAND_COLORS[index % STAND_COLORS.length];
    const standInnerRadius = outerRadius - standThickness;

    const standGeometry = {
      id: stand.id || `stand-${index}`,
      name: stand.name || `Stand ${index + 1}`,
      color: stand.color || standColor,
      index,
      startAngle,
      endAngle,
      relativeStart,
      relativeEnd,
      outerRadius,
      innerRadius: standInnerRadius,
      tiers: [],
    };

    let tierCursor = standInnerRadius - tierGap;
    (stand.tiers || []).forEach((tier, tierIndex) => {
      const tierOuter = tierCursor;
      const tierInner = tierCursor - tierThickness;
      const tierColor = TIER_COLORS[tierIndex % TIER_COLORS.length];
      const tierGeometry = {
        id: tier.id || `${standGeometry.id}-tier-${tierIndex}`,
        name: tier.name || `Tier ${tierIndex + 1}`,
        color: tier.color || tierColor,
        outerRadius: tierOuter,
        innerRadius: tierInner,
        relativeStart,
        relativeEnd,
        startAngle,
        endAngle,
        sections: [],
      };

      const sections = tier.sections || [];
      if (sections.length) {
        const availableAngle = relativeEnd - relativeStart;
        const sectionGap = availableAngle * 0.012;
        const sectionAngle =
          (availableAngle - sectionGap * sections.length) / sections.length;
        let sectionCursor = relativeStart;

        sections.forEach((section, sectionIndex) => {
          sectionCursor += sectionGap / 2;
          const sectionStart = sectionCursor;
          const sectionEnd = sectionCursor + sectionAngle;
          sectionCursor = sectionEnd + sectionGap / 2;

          tierGeometry.sections.push({
            id: section.id || `${tierGeometry.id}-section-${sectionIndex}`,
            name: section.name || `${sectionIndex + 1}`,
            startAngle: DEGREE_OFFSET + sectionStart,
            endAngle: DEGREE_OFFSET + sectionEnd,
            relativeStart: sectionStart,
            relativeEnd: sectionEnd,
            color: SECTION_COLORS[sectionIndex % SECTION_COLORS.length],
            innerRadius: tierInner + 3,
            outerRadius: tierOuter - 3,
          });
        });
      }

      tierCursor = tierInner - tierGap;
      standGeometry.tiers.push(tierGeometry);
    });

    standGeometry.innerMostRadius = tierCursor;
    geometry.stands.push(standGeometry);
  });

  geometry.coreRadius = Math.min(
    ...geometry.stands.map((stand) => stand.innerMostRadius),
  );

  return geometry;
};

const drawGrid = (ctx, geometry) => {
  const { cx, cy, outerRadius } = geometry;
  ctx.save();
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);

  for (let radius = outerRadius; radius > 40; radius -= 40) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TWO_PI);
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (TWO_PI / 8) * i;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
  }
  ctx.stroke();
  ctx.restore();
};

const drawSpecialZones = (ctx, geometry, zones) => {
  const { cx, cy, coreRadius } = geometry;
  let cursor = coreRadius - 12;

  zones.forEach((zone) => {
    const thickness = 20;
    const innerRadius = cursor - thickness;
    drawArcSegment(ctx, {
      cx,
      cy,
      innerRadius,
      outerRadius: cursor,
      startAngle: 0,
      endAngle: TWO_PI,
      fill: zone.color,
      stroke: 'rgba(255,255,255,0.05)',
      lineWidth: 1,
    });
    drawTextAlongArc(ctx, zone.label, {
      cx,
      cy,
      radius: innerRadius + thickness / 2,
      angle: DEGREE_OFFSET,
      color: '#e5e7eb',
      font: '12px Poppins, sans-serif',
    });
    cursor = innerRadius - 6;
  });

  ctx.save();
  ctx.fillStyle = '#1f8e46';
  ctx.beginPath();
  ctx.arc(cx, cy, cursor, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = '#d7c497';
  const pitchWidth = cursor * 0.2;
  const pitchHeight = cursor * 0.55;
  ctx.fillRect(cx - pitchWidth / 2, cy - pitchHeight / 2, pitchWidth, pitchHeight);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - pitchWidth / 2, cy - pitchHeight / 2, pitchWidth, pitchHeight);

  ctx.beginPath();
  ctx.arc(cx, cy - pitchHeight / 2, pitchWidth, 0, TWO_PI);
  ctx.arc(cx, cy + pitchHeight / 2, pitchWidth, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
};

const drawStadium = (ctx, geometry, { detailLevel, highlight }) => {
  const highlightStandId = highlight?.stand?.id;
  const highlightTierId = highlight?.tier?.id;
  const highlightSectionId = highlight?.section?.id;

  drawGrid(ctx, geometry);

  geometry.stands.forEach((stand) => {
    const isHighlighted = highlightStandId === stand.id;
    const opacity = detailLevel === 'stands'
      ? 1
      : isHighlighted ? 1 : 0.35;

    drawArcSegment(ctx, {
      cx: geometry.cx,
      cy: geometry.cy,
      innerRadius: stand.innerRadius,
      outerRadius: stand.outerRadius,
      startAngle: stand.startAngle,
      endAngle: stand.endAngle,
      fill: `${stand.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      shadowBlur: isHighlighted ? 14 : 0,
      shadowColor: isHighlighted ? stand.color : 'transparent',
    });
  });

  geometry.stands.forEach((stand) => {
    const showTiers = detailLevel !== 'stands' && highlightStandId === stand.id;
    if (!showTiers) return;

    stand.tiers.forEach((tier) => {
      const isTierHighlighted = highlightTierId === tier.id;
      drawArcSegment(ctx, {
        cx: geometry.cx,
        cy: geometry.cy,
        innerRadius: tier.innerRadius,
        outerRadius: tier.outerRadius,
        startAngle: tier.startAngle,
        endAngle: tier.endAngle,
        fill: `${tier.color}${isTierHighlighted ? 'aa' : '55'}`,
        shadowBlur: isTierHighlighted ? 8 : 0,
        shadowColor: tier.color,
      });

      if (detailLevel === 'sections' && isTierHighlighted) {
        tier.sections.forEach((section) => {
          const highlighted = highlightSectionId === section.id;
          drawArcSegment(ctx, {
            cx: geometry.cx,
            cy: geometry.cy,
            innerRadius: section.innerRadius,
            outerRadius: section.outerRadius,
            startAngle: section.startAngle,
            endAngle: section.endAngle,
            fill: highlighted ? '#ffffff44' : section.color,
            stroke: 'rgba(0,0,0,0.25)',
            lineWidth: 0.5,
          });
        });
      }
    });
  });

  geometry.stands.forEach((stand) => {
    const angle = (stand.startAngle + stand.endAngle) / 2;
    const radius =
      (stand.outerRadius + stand.innerRadius) / 2;
    drawTextAlongArc(ctx, stand.name, {
      cx: geometry.cx,
      cy: geometry.cy,
      radius,
      angle,
      color: '#fff',
      font: 'bold 13px Poppins, sans-serif',
    });
  });
};

const getHitInfo = (
  x,
  y,
  geometry,
  detailLevel,
  selectedStand,
  selectedTier,
) => {
  if (!geometry) return null;
  const { cx, cy } = geometry;
  const dx = x - cx;
  const dy = y - cy;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += TWO_PI;
  const relativeAngle = (angle - DEGREE_OFFSET + TWO_PI) % TWO_PI;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);

  const stand = geometry.stands.find(
    (item) =>
      relativeAngle >= item.relativeStart &&
      relativeAngle <= item.relativeEnd &&
      distance <= item.outerRadius &&
      distance >= item.innerMostRadius - geometry.tierGap * 2,
  );

  if (!stand) return null;

  if (detailLevel === 'stands') {
    return { type: 'stand', stand };
  }

  const tier = stand.tiers.find(
    (item) =>
      distance <= item.outerRadius &&
      distance >= item.innerRadius &&
      relativeAngle >= item.relativeStart &&
      relativeAngle <= item.relativeEnd,
  );

  if (detailLevel === 'tiers') {
    if (stand.id !== selectedStand?.id) {
      return { type: 'stand', stand };
    }
    if (tier) {
      return { type: 'tier', stand, tier };
    }
    return { type: 'stand', stand };
  }

  if (detailLevel === 'sections') {
    if (stand.id !== selectedStand?.id) {
      return { type: 'stand', stand };
    }
    if (!tier) return { type: 'stand', stand };
    if (selectedTier && tier.id !== selectedTier.id) {
      return { type: 'tier', stand, tier };
    }
    const section = tier.sections.find(
      (item) =>
        distance <= item.outerRadius &&
        distance >= item.innerRadius &&
        relativeAngle >= item.relativeStart &&
        relativeAngle <= item.relativeEnd,
    );
    if (section) {
      return {
        type: 'section',
        stand,
        tier,
        section,
      };
    }
    return { type: 'tier', stand, tier };
  }

  return { type: 'stand', stand };
};

const TooltipCard = ({ info }) => {
  if (!info) return null;

  const lines = [
    { label: 'Stand', value: info.stand?.name },
  ];

  if (info.tier) {
    lines.push({ label: 'Tier', value: info.tier.name });
  }

  if (info.section) {
    lines.push({ label: 'Section', value: info.section.name });
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: info.position.x + 12,
        top: info.position.y + 12,
        background: 'rgba(3, 7, 18, 0.94)',
        color: '#f5f5f5',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '10px 14px',
        zIndex: 9999,
        pointerEvents: 'none',
        minWidth: 180,
        boxShadow: '0 10px 35px rgba(0,0,0,0.35)',
      }}
    >
      <Space direction="vertical" size={4}>
        {lines.map((line) => (
          <div
            key={`${line.label}-${line.value}`}
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Text style={{ color: '#94a3b8' }}>{line.label}</Text>
            <Text strong style={{ color: '#fff' }}>
              {line.value}
            </Text>
          </div>
        ))}
      </Space>
    </div>
  );
};

const Legend = ({ stands }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.45rem',
    }}
  >
    {stands.slice(0, 18).map((stand) => (
      <Tag
        key={stand.id}
        color="rgba(255,255,255,0.08)"
        style={{
          borderColor: stand.color,
          color: '#e5e7eb',
          padding: '2px 10px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: stand.color,
            marginRight: 8,
          }}
        />
        {stand.name}
      </Tag>
    ))}
  </div>
);

const StadiumCanvasViewer = ({
  standsData = [],
  specialZones = DEFAULT_SPECIAL_ZONES,
  handleSubmit = () => {},
  height = 780,
  isUser = true,
}) => {
  const layout = useMemo(
    () => (standsData.length ? standsData : SAMPLE_STADIUM_LAYOUT),
    [standsData],
  );
  const { isMobile } = useMyContext();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const geometryRef = useRef(null);
  const [size, setSize] = useState({ width: 900, height });
  const [hoverInfo, setHoverInfo] = useState(null);
  const [detailLevel, setDetailLevel] = useState('stands');
  const [selectedStand, setSelectedStand] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [viewMode, setViewMode] = useState('stands');
  const [showModal, setShowModal] = useState(false);
  const [showSeatsModal, setSeatsShowModal] = useState(false);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      setSize({ width, height });
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, size.width, size.height);

    if (!layout.length) {
      return;
    }

    const geometry = createGeometry(layout, size);
    geometryRef.current = geometry;

    drawStadium(ctx, geometry, {
      detailLevel,
      highlight: {
        stand: selectedStand,
        tier: selectedTier,
        section: selectedSection,
      },
    });
    drawSpecialZones(ctx, geometry, specialZones);
  }, [layout, size, specialZones, detailLevel, selectedStand, selectedTier, selectedSection]);

  useEffect(() => {
    draw();
  }, [draw]);

  const resetToStands = () => {
    setDetailLevel('stands');
    setSelectedStand(null);
    setSelectedTier(null);
    setSelectedSection(null);
    setShowModal(false);
    setViewMode('stands');
  };

  const enterStand = (stand) => {
    setSelectedStand(stand);
    setSelectedTier(null);
    setSelectedSection(null);
    setDetailLevel('tiers');
    setViewMode('tiers');
    setShowModal(true);
  };

  const enterTier = (tier, stand = selectedStand) => {
    setSelectedStand(stand);
    setSelectedTier(tier);
    setSelectedSection(null);
    setDetailLevel('sections');
    setViewMode('sections');
  };

  const enterSection = (section, stand = selectedStand, tier = selectedTier) => {
    setSelectedStand(stand);
    setSelectedTier(tier);
    setSelectedSection(section);
    setDetailLevel('sections');
    setViewMode('seats');
  };

  const handlePointerMove = (event) => {
    if (!geometryRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hitInfo = getHitInfo(
      x,
      y,
      geometryRef.current,
      detailLevel,
      selectedStand,
      selectedTier,
    );
    if (hitInfo) {
      setHoverInfo({
        ...hitInfo,
        position: { x: event.clientX, y: event.clientY },
      });
    } else if (hoverInfo) {
      setHoverInfo(null);
    }
  };

  const handleLeave = () => setHoverInfo(null);

  const handleClick = (event) => {
    if (!geometryRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hitInfo = getHitInfo(
      x,
      y,
      geometryRef.current,
      detailLevel,
      selectedStand,
      selectedTier,
    );
    if (!hitInfo) return;

    if (hitInfo.type === 'stand') {
      enterStand(hitInfo.stand);
      return;
    }
    if (hitInfo.type === 'tier') {
      enterTier(hitInfo.tier, hitInfo.stand);
      return;
    }
    if (hitInfo.type === 'section') {
      enterSection(hitInfo.section, hitInfo.stand, hitInfo.tier);
    }
  };

  if (!layout.length) {
    return <Empty description="No stands to render" />;
  }

  const renderModalContent = () => {
    switch (viewMode) {
      case 'tiers':
        return (
          <div className="bg-dark border border-secondary rounded p-3 p-md-4 text-center">
            <Space direction="vertical" align="center" size="middle" className="w-100">
              <Title level={4} className="m-0 d-flex align-items-center justify-content-center text-white">
                <BankOutlined className="mr-2 text-primary" />
                <span>{selectedStand?.name}</span>
              </Title>
              <Text className="text-muted">Select a tier to view sections</Text>
              <TierViewer
                tiers={selectedStand?.tiers || []}
                onSelectTier={(tier) => {
                  enterTier(tier, selectedStand);
                }}
                isUser={isUser}
                className="mt-4"
              />
            </Space>
          </div>
        );

      case 'sections':
        return (
          <div className="bg-dark border border-secondary rounded p-3 p-md-4 text-center">
            <Space direction="vertical" align="center" size="middle" className="w-100">
              <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} align-items-center justify-content-center`} style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <Space align="center">
                  <BankOutlined className="text-primary" style={{ fontSize: 20 }} />
                  <Text strong className="text-white" style={{ fontSize: 16 }}>{selectedStand?.name}</Text>
                </Space>
                <Space align="center">
                  <AppstoreOutlined className="text-info" style={{ fontSize: 20, color: '#17c0eb' }} />
                  <Text strong style={{ fontSize: 16, color: '#17c0eb' }}>{selectedTier?.name}</Text>
                </Space>
              </div>
              <Text className="text-muted">Select a section to view seats</Text>
              <SectionViewer
                sections={selectedTier?.sections || []}
                onSelectSection={(section) => {
                  enterSection(section);
                }}
                isUser={isUser}
                className="mt-4"
              />
            </Space>
          </div>
        );

      case 'seats':
        return (
          <div className={`p-${isMobile ? 3 : 4}`}>
            <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} justify-content-between align-items-center mb-4`} style={{ gap: '0.75rem' }}>
              <div className="d-flex flex-wrap justify-content-center" style={{ gap: '0.5rem' }}>
                <Badge
                  count={(
                    <Space size={4} className="px-3 py-1">
                      <BankOutlined />
                      <span>{selectedStand?.name}</span>
                    </Space>
                  )}
                  style={{
                    backgroundColor: 'rgba(181, 21, 21, 0.1)',
                    color: 'var(--primary-color)',
                    border: '1px solid var(--primary-color)',
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 16,
                  }}
                />
                <Badge
                  count={(
                    <Space size={4} className="px-3 py-1">
                      <AppstoreOutlined />
                      <span>{selectedTier?.name}</span>
                    </Space>
                  )}
                  style={{
                    backgroundColor: 'rgba(4, 209, 130, 0.1)',
                    color: 'var(--success-color)',
                    border: '1px solid var(--success-color)',
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 16,
                  }}
                />
                <Badge
                  count={(
                    <Space size={4} className="px-3 py-1">
                      <LayoutOutlined />
                      <span>{selectedSection?.name}</span>
                    </Space>
                  )}
                  style={{
                    backgroundColor: 'rgba(255, 197, 66, 0.12)',
                    color: 'var(--warning-color)',
                    border: '1px solid var(--warning-color)',
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 16,
                  }}
                />
              </div>
              <Button
                type="default"
                size={isMobile ? 'middle' : 'large'}
                icon={<EyeOutlined />}
                onClick={() => setSeatsShowModal(!showSeatsModal)}
                className="font-weight-semibold"
                style={{
                  borderWidth: 2,
                  backgroundColor: 'rgba(181, 21, 21, 0.1)',
                  color: 'var(--primary-color)',
                  borderColor: 'var(--primary-color)',
                }}
              >
                View Selected
              </Button>
            </div>
            <SeatsGrid
              selectedSection={selectedSection}
              tier={selectedTier}
              stand={selectedStand}
              selectedSeats={selectedSeats}
              setSelectedSeats={setSelectedSeats}
              isMobile={isMobile}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooterButtons = () => {
    const buttonSize = isMobile ? 'middle' : 'large';

    switch (viewMode) {
      case 'tiers':
        return (
          <Button
            type="primary"
            size={buttonSize}
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              resetToStands();
            }}
            className="bg-primary"
          >
            Back to stands
          </Button>
        );
      case 'sections':
        return (
          <Button
            type="primary"
            size={buttonSize}
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              setViewMode('tiers');
              setDetailLevel('tiers');
              setSelectedSection(null);
              setSelectedTier(null);
            }}
            className="bg-primary"
          >
            Tiers
          </Button>
        );
      case 'seats':
        return (
          <>
            {selectedSeats?.length > 0 && (
              <div className="w-100 d-flex justify-content-center align-items-center">
                <Text className="text-white">
                  Selected <Text strong className="text-white">{selectedSeats.length}</Text> seat(s), Total Price:{' '}
                  <Text strong className="text-success">
                    ₹
                    {selectedSeats
                      ?.reduce((sum, seat) => sum + parseFloat(seat.price || 0), 0)
                      .toFixed(2)}
                  </Text>
                </Text>
              </div>
            )}
            <div className="w-100 d-flex flex-row justify-content-between align-items-center" style={{ gap: '0.75rem' }}>
              <Button
                type="primary"
                size={buttonSize}
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setViewMode('sections');
                  setSelectedSection(null);
                }}
                className="bg-primary"
              >
                Sections
              </Button>
              {isUser && (
                <Button
                  type="primary"
                  size={buttonSize}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleSubmit(selectedSeats);
                    setShowModal(false);
                  }}
                  className="bg-success"
                  style={{ backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                  disabled={!selectedSeats.length}
                >
                  Confirm
                </Button>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="position-relative border border-secondary rounded overflow-hidden d-flex flex-column"
        style={{
          height,
          background: 'var(--component-bg)',
        }}
      >
        <div className="position-absolute d-flex shadow-sm rounded p-2"
          style={{
            top: 12,
            right: 12,
            zIndex: 20,
            gap: 10,
            backgroundColor: 'rgba(252,252,252,0.03)',
            border: '1px solid var(--border-secondary)',
          }}
        >
          <Button
            type={detailLevel === 'stands' ? 'primary' : 'info'}
            size="small"
            onClick={() => resetToStands()}
            className="font-weight-semibold"
            style={{ minWidth: 90 }}
          >
            Stands
          </Button>
          <Button
            type={detailLevel === 'tiers' ? 'primary' : 'info'}
            size="small"
            onClick={() => {
              if (selectedStand) {
                setDetailLevel('tiers');
                setViewMode('tiers');
                setShowModal(true);
              }
            }}
            disabled={!selectedStand}
            className="font-weight-semibold"
            style={{ minWidth: 110 }}
          >
            Tiers
          </Button>
          <Button
            type={detailLevel === 'sections' ? 'primary' : 'info'}
            size="small"
            onClick={() => {
              if (selectedStand && selectedTier) {
                setDetailLevel('sections');
                setViewMode(selectedSection ? 'seats' : 'sections');
                setShowModal(true);
              }
            }}
            disabled={!selectedStand || !selectedTier}
            className="font-weight-semibold"
            style={{ minWidth: 105 }}
          >
            Full Detail
          </Button>
        </div>

        <div ref={containerRef} className="flex-grow-1 position-relative" style={{ minHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%' }}
            onMouseMove={handlePointerMove}
            onMouseLeave={handleLeave}
            onClick={handleClick}
          />
          <TooltipCard info={hoverInfo} />

          {showModal && (
            <div
              className="position-absolute bg-dark border border-3 border-dark d-flex flex-column rounded shadow-lg"
              style={{
                inset: 0,
                zIndex: 1050,
                backgroundColor: 'var(--body-bg)',
                borderColor: 'var(--border-secondary)',
              }}
            >
              <div
                className={`d-flex justify-content-between align-items-center border-bottom position-sticky ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}
                style={{
                  top: 0,
                  zIndex: 1,
                  backgroundColor: 'var(--component-bg)',
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <Title level={5} className={`m-0 text-white ${isMobile ? 'font-size-base' : 'font-size-lg'}`}>
                  {viewMode === 'seats' ? 'Pick Seats' : 'Book Tickets'}
                </Title>
                <Button
                  type="text"
                  icon={<CloseOutlined className="text-white" />}
                  onClick={() => resetToStands()}
                  className="ml-2"
                />
              </div>

              <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
                {renderModalContent()}
              </div>

              <div
                className="border-top position-sticky d-flex flex-wrap justify-content-between align-items-center rounded-bottom p-3 shadow-sm"
                style={{
                  bottom: 0,
                  gap: '1rem',
                  backgroundColor: 'var(--component-bg)',
                  borderTopColor: 'var(--border-secondary)',
                }}
              >
                {renderFooterButtons()}
              </div>
            </div>
          )}
        </div>
      </div>

      <Space
        direction="vertical"
        size="large"
        style={{ marginTop: 24, width: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          <InfoCircleOutlined />
          <span>
            Hover any wedge to inspect stands, tiers, and sections. Click through
            to drill down – the modal guides seat selection just like the SVG viewer.
          </span>
        </div>
        <Legend stands={geometryRef.current?.stands || []} />
      </Space>

      <SelectedSeatsModal
        isMobile={isMobile}
        selectedSeats={selectedSeats}
        setSelectedSeats={setSelectedSeats}
        show={showSeatsModal}
        onHide={() => setSeatsShowModal(false)}
      />
    </>
  );
};

export default StadiumCanvasViewer;


import React from 'react';
import { describeArc, polarToCartesian } from './helperFuntion';

const StandsViewer = ({
  standsData,
  isUser,
  onSelectStand,
  onSelectSection,
  onSelectTier,
  viewDetail = 'stands',
  cx = 250,
  cy = 250,
  innerRadius = 100,
  outerRadius = 200,
  onMouseEnter,
  onMouseLeave,
}) => {
  const totalStands = standsData?.length || 0;
  if (totalStands === 0) return null;

  const normalizedStands = standsData.map((stand) => ({
    ...stand,
    tiers: Array.isArray(stand.tiers) ? stand.tiers : [],
    visualWeight: Math.max(Number(stand?.visualWeight) || 1, 0.1),
  }));

  const totalWeight =
    normalizedStands.reduce((sum, stand) => sum + stand.visualWeight, 0) || 1;
  let angleCursor = 0;

  const standSegments = normalizedStands.map((stand, index) => {
    const span = (stand.visualWeight / totalWeight) * 360;
    const startAngle = angleCursor;
    const endAngle = startAngle + span;
    angleCursor = endAngle;
    const hue = (index * 360) / Math.min(normalizedStands.length, 20);
    return {
      ...stand,
      startAngle,
      endAngle,
      span,
      hue,
      index,
    };
  });

  const rotationOffset = standSegments.length
    ? -(standSegments[0].span / 2)
    : 0;

  const paths = [];
  const getHSL = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;

  standSegments.forEach((stand) => {
    const { startAngle, endAngle, hue } = stand;
    const baseColor = getHSL(hue, 60, 65);
    const fillColor = stand.isBlocked ? 'var(--gray-color)' : baseColor;
    const opacity = stand.isBlocked ? 0.6 : 0.9;

    const path =
      totalStands === 1
        ? describeArc(cx, cy, innerRadius, outerRadius, 0.01, 359.99)
        : describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle);

    if (viewDetail === 'stands' || viewDetail === 'tiers') {
      paths.push(
        <path
          key={`stand-${stand.index}`}
          d={path}
          fill={fillColor}
          stroke="var(--border-secondary)"
          strokeWidth="0.8"
          onMouseEnter={(e) => onMouseEnter?.(stand.name, e)}
          onMouseLeave={onMouseLeave}
          onClick={() => !stand.isBlocked && isUser && onSelectStand?.(stand)}
          className={stand.isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}
          style={{
            opacity,
            transition: 'all 0.2s ease-in-out',
            filter: 'brightness(1)',
          }}
          onMouseOver={(e) => {
            if (!stand.isBlocked) {
              e.currentTarget.style.filter = 'brightness(1.15)';
              e.currentTarget.style.strokeWidth = '1.2';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.strokeWidth = '0.8';
          }}
        />
      );

      const middleAngle = (startAngle + endAngle) / 2;
      const labelPos = polarToCartesian(
        cx,
        cy,
        (innerRadius + outerRadius) / 2,
        middleAngle
      );

      paths.push(
        <text
          key={`stand-label-${stand.index}`}
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={stand.isBlocked ? 'var(--text-muted)' : 'var(--text-white)'}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: stand.isBlocked ? 'none' : '0 1px 3px rgba(0,0,0,0.5)',
            letterSpacing: '0.3px',
          }}
        >
          {stand.name}
        </text>
      );
    }

    if (viewDetail === 'tiers' || viewDetail === 'sections') {
      const tierWeights = stand.tiers.map(
        (tier) => Math.max(Number(tier?.visualWeight) || 1, 0.1)
      );
      const totalTierWeight =
        tierWeights.reduce((sum, weight) => sum + weight, 0) || 1;

      let tierInnerCursor = innerRadius;

      stand.tiers.forEach((tier, tierIndex) => {
        const tierPortion = tierWeights[tierIndex] / totalTierWeight;
        const tierHeight = (outerRadius - innerRadius) * tierPortion;
        const tierInner = tierInnerCursor;
        const tierOuter = tierInner + tierHeight;
        tierInnerCursor = tierOuter;

        const brightness = 65 - tierIndex * 8;
        const tierColor = getHSL(hue, 70, brightness);
        const arc = describeArc(cx, cy, tierInner, tierOuter, startAngle, endAngle);

        if (viewDetail === 'tiers') {
          const isBlocked = tier?.isBlocked || stand.isBlocked;

          paths.push(
            <path
              key={`tier-${stand.index}-${tierIndex}`}
              d={arc}
              fill={isBlocked ? 'var(--gray-color)' : tierColor}
              stroke="var(--border-secondary)"
              strokeWidth="0.5"
              className={isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}
              style={{
                opacity: isBlocked ? 0.5 : 0.85,
                transition: 'all 0.2s ease-in-out',
                filter: 'brightness(1)',
              }}
              onClick={() => !isBlocked && isUser && onSelectTier?.(tier, stand)}
              onMouseOver={(e) => {
                if (!isBlocked) {
                  e.currentTarget.style.filter = 'brightness(1.2)';
                  e.currentTarget.style.strokeWidth = '0.8';
                  e.currentTarget.style.opacity = '0.95';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.strokeWidth = '0.5';
                e.currentTarget.style.opacity = isBlocked ? '0.5' : '0.85';
              }}
            />
          );

          const labelAngle = (startAngle + endAngle) / 2;
          const labelRadius = tierInner + tierHeight / 2;
          const pos = polarToCartesian(cx, cy, labelRadius, labelAngle);

          paths.push(
            <text
              key={`tier-label-${stand.index}-${tierIndex}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={isBlocked ? 'var(--text-muted)' : 'var(--text-white)'}
              style={{
                pointerEvents: 'none',
                textShadow: isBlocked ? 'none' : '0 0 4px rgba(0,0,0,0.8)',
                userSelect: 'none',
                letterSpacing: '0.2px',
              }}
            >
              {tier.name}
            </text>
          );
        }

        if (viewDetail === 'sections') {
          const sections = tier.sections || [];
          if (!sections.length) return;

          const sectionWeights = sections.map(
            (section) => Math.max(Number(section?.visualWeight) || 1, 0.1)
          );
          const totalSectionWeight =
            sectionWeights.reduce((sum, weight) => sum + weight, 0) || 1;

          let sectionCursor = startAngle;

          sections.forEach((section, sectionIndex) => {
            const sectionPortion =
              sectionWeights[sectionIndex] / totalSectionWeight;
            const sectionSpan = (endAngle - startAngle) * sectionPortion;
            const sStart = sectionCursor;
            const sEnd = sStart + sectionSpan;
            sectionCursor = sEnd;

            const sectionHue = (hue + sectionIndex * 8) % 360;
            const sectionColor = getHSL(sectionHue, 70, 68 - sectionIndex * 3);

            const sectionArc = describeArc(cx, cy, tierInner, tierOuter, sStart, sEnd);
            const isBlocked =
              stand?.isBlocked || tier?.isBlocked || section?.isBlocked;

            paths.push(
              <path
                key={`section-${stand.index}-${tierIndex}-${sectionIndex}`}
                d={sectionArc}
                fill={isBlocked ? 'var(--gray-color)' : sectionColor}
                stroke="var(--border-secondary)"
                strokeWidth="0.5"
                className={isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                style={{
                  opacity: isBlocked ? 0.4 : 0.85,
                  transition: 'all 0.2s ease-in-out',
                  filter: 'brightness(1)',
                }}
                onClick={() =>
                  !isBlocked && isUser && onSelectSection?.(section, stand, tier)
                }
                onMouseOver={(e) => {
                  if (!isBlocked) {
                    e.currentTarget.style.filter = 'brightness(1.25)';
                    e.currentTarget.style.strokeWidth = '0.8';
                    e.currentTarget.style.opacity = '0.95';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.strokeWidth = '0.5';
                  e.currentTarget.style.opacity = isBlocked ? '0.4' : '0.85';
                }}
              />
            );

            const midAngle = (sStart + sEnd) / 2;
            const labelPos = polarToCartesian(
              cx,
              cy,
              tierInner + tierHeight / 2,
              midAngle
            );

            paths.push(
              <text
                key={`section-label-${stand.index}-${tierIndex}-${sectionIndex}`}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={isBlocked ? 'var(--text-muted)' : 'var(--text-white)'}
                style={{
                  pointerEvents: 'none',
                  textShadow: isBlocked ? 'none' : '0 0 4px rgba(0,0,0,0.9)',
                  userSelect: 'none',
                  letterSpacing: '0.2px',
                }}
              >
                {section.name}
              </text>
            );
          });
        }
      });
    }
  });

  if (viewDetail === 'stands' && standSegments.length > 1) {
    standSegments.forEach((segment, idx) => {
      const angle = segment.startAngle;
      const p1 = polarToCartesian(cx, cy, innerRadius, angle);
      const p2 = polarToCartesian(cx, cy, outerRadius, angle);

      paths.push(
        <line
          key={`divider-${idx}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="var(--border-secondary)"
          strokeWidth="1"
          style={{ opacity: 0.6 }}
        />
      );
    });
  }

  return <g transform={`rotate(${rotationOffset}, ${cx}, ${cy})`}>{paths}</g>;
};

export default StandsViewer;

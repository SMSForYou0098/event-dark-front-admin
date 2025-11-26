import React, { useState, useMemo } from 'react';
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
  innerRadius = 80,
  outerRadius = 200,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [hoveredStand, setHoveredStand] = useState(null);
  const [hoveredTier, setHoveredTier] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  const totalStands = standsData?.length || 0;
  
  // Calculate total visual weight for proportional sizing
  const totalWeight = useMemo(() => {
    if (!standsData) return 0;
    return standsData.reduce((sum, stand) => sum + (stand.visualWeight || 1), 0);
  }, [standsData]);

  if (totalStands === 0) return null;

  // Color palette - rich, vibrant colors
  const standColors = [
    { primary: '#6366f1', secondary: '#818cf8', accent: '#a5b4fc' },
    { primary: '#ec4899', secondary: '#f472b6', accent: '#f9a8d4' },
    { primary: '#14b8a6', secondary: '#2dd4bf', accent: '#5eead4' },
    { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fcd34d' },
    { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c4b5fd' },
    { primary: '#ef4444', secondary: '#f87171', accent: '#fca5a5' },
    { primary: '#06b6d4', secondary: '#22d3ee', accent: '#67e8f9' },
    { primary: '#84cc16', secondary: '#a3e635', accent: '#bef264' },
  ];

  const getStandColor = (index) => standColors[index % standColors.length];

  const paths = [];

  // Calculate angles based on visual weight
  let currentAngle = 0;
  const standAngles = standsData.map((stand) => {
    const weight = stand.visualWeight || 1;
    const angleSpan = (weight / totalWeight) * 360;
    const start = currentAngle;
    currentAngle += angleSpan;
    return { start, end: currentAngle, span: angleSpan };
  });

  standsData.forEach((stand, standIndex) => {
    const { start: startAngle, end: endAngle, span: angleSpan } = standAngles[standIndex];
    const colors = getStandColor(standIndex);
    const isStandHovered = hoveredStand === standIndex;

    const baseOpacity = stand.isBlocked ? 0.4 : 0.9;
    const hoverOpacity = 0.98;

    // Stand path
    const standPath =
      totalStands === 1
        ? describeArc(cx, cy, innerRadius, outerRadius, 0.01, 359.99)
        : describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle);

    if (viewDetail === 'stands') {
      const fillColor = stand.isBlocked ? '#4b5563' : colors.primary;

      paths.push(
        <path
          key={`stand-${standIndex}`}
          d={standPath}
          fill={fillColor}
          stroke={isStandHovered && !stand.isBlocked ? '#fff' : 'rgba(255,255,255,0.15)'}
          strokeWidth={isStandHovered && !stand.isBlocked ? 2.5 : 1}
          onMouseEnter={(e) => {
            if (!stand.isBlocked) {
              setHoveredStand(standIndex);
              onMouseEnter?.(stand.name, e);
            }
          }}
          onMouseLeave={() => {
            setHoveredStand(null);
            onMouseLeave?.();
          }}
          onClick={() => !stand.isBlocked && isUser && onSelectStand?.(stand)}
          style={{
            cursor: stand.isBlocked ? 'not-allowed' : 'pointer',
            opacity: isStandHovered && !stand.isBlocked ? hoverOpacity : baseOpacity,
            transition: 'all 0.2s ease-out',
            filter: isStandHovered && !stand.isBlocked 
              ? 'brightness(1.15) drop-shadow(0 4px 12px rgba(0,0,0,0.4))' 
              : 'none',
          }}
        />
      );

      // Stand label
      const middleAngle = (startAngle + endAngle) / 2;
      const labelRadius = (innerRadius + outerRadius) / 2;
      const labelPos = polarToCartesian(cx, cy, labelRadius, middleAngle);

      paths.push(
        <text
          key={`stand-label-${standIndex}`}
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="700"
          fill="#fff"
          style={{ 
            pointerEvents: 'none',
            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
            letterSpacing: '0.5px'
          }}
        >
          {stand.name}
        </text>
      );

      // Blocked indicator
      if (stand.isBlocked) {
        const iconPos = polarToCartesian(cx, cy, labelRadius + 20, middleAngle);
        paths.push(
          <g key={`blocked-${standIndex}`} transform={`translate(${iconPos.x - 8}, ${iconPos.y - 8})`}>
            <circle cx="8" cy="8" r="10" fill="rgba(0,0,0,0.6)" />
            <text x="8" y="12" textAnchor="middle" fontSize="10" fill="#fff">🔒</text>
          </g>
        );
      }
    }

    // Tiers view
    if (viewDetail === 'tiers' || viewDetail === 'sections') {
      const tierCount = stand.tiers?.length || 0;
      if (tierCount === 0) return;

      const tierHeight = (outerRadius - innerRadius) / tierCount;

      stand.tiers.forEach((tier, tierIndex) => {
        const tierInner = innerRadius + tierIndex * tierHeight;
        const tierOuter = tierInner + tierHeight - 2; // Gap between tiers
        const isTierHovered = hoveredTier === `${standIndex}-${tierIndex}`;
        const isBlocked = tier?.isBlocked || stand.isBlocked;

        // Calculate tier color based on stand color but with variation
        const brightness = 100 - tierIndex * 15;
        const tierColor = isBlocked 
          ? '#4b5563' 
          : `color-mix(in srgb, ${colors.primary} ${brightness}%, ${colors.secondary})`;

        const tierArc = describeArc(cx, cy, tierInner, tierOuter, startAngle, endAngle);

        if (viewDetail === 'tiers') {
          paths.push(
            <path
              key={`tier-${standIndex}-${tierIndex}`}
              d={tierArc}
              fill={isBlocked ? '#4b5563' : colors.secondary}
              stroke={isTierHovered && !isBlocked ? '#fff' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isTierHovered && !isBlocked ? 2 : 0.8}
              onMouseEnter={() => !isBlocked && setHoveredTier(`${standIndex}-${tierIndex}`)}
              onMouseLeave={() => setHoveredTier(null)}
              onClick={() => !isBlocked && isUser && onSelectTier?.(tier, stand)}
              style={{ 
                cursor: isBlocked ? 'not-allowed' : 'pointer',
                opacity: isBlocked ? 0.4 : (isTierHovered ? 0.98 : 0.85),
                transition: 'all 0.2s ease-out',
                filter: isTierHovered && !isBlocked 
                  ? 'brightness(1.2) drop-shadow(0 3px 8px rgba(0,0,0,0.3))' 
                  : 'none',
              }}
            />
          );

          // Tier label
          const labelAngle = (startAngle + endAngle) / 2;
          const labelRadius = tierInner + tierHeight / 2;
          const pos = polarToCartesian(cx, cy, labelRadius, labelAngle);

          paths.push(
            <text
              key={`tier-label-${standIndex}-${tierIndex}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="700"
              fill="#fff"
              style={{ 
                pointerEvents: 'none',
                textShadow: '0 1px 3px rgba(0,0,0,0.7)',
              }}
            >
              {tier.name}
            </text>
          );
        }

        // Sections view
        if (viewDetail === 'sections') {
          const sections = tier.sections || [];
          const sectionCount = sections.length;
          if (sectionCount === 0) return;

          const sectionAngle = angleSpan / sectionCount;

          sections.forEach((section, sectionIndex) => {
            const sStart = startAngle + sectionIndex * sectionAngle + 0.5;
            const sEnd = sStart + sectionAngle - 1;
            const isSectionHovered = hoveredSection === `${standIndex}-${tierIndex}-${sectionIndex}`;
            const isSectionBlocked = stand?.isBlocked || tier?.isBlocked || section?.isBlocked;

            // Section colors with variation
            const sectionHue = (standIndex * 45 + sectionIndex * 20) % 360;
            const sectionColor = isSectionBlocked 
              ? '#4b5563' 
              : `hsl(${sectionHue}, 65%, ${55 - tierIndex * 8}%)`;

            const sectionArc = describeArc(cx, cy, tierInner, tierOuter, sStart, sEnd);

            paths.push(
              <path
                key={`section-${standIndex}-${tierIndex}-${sectionIndex}`}
                d={sectionArc}
                fill={sectionColor}
                stroke={isSectionHovered && !isSectionBlocked ? '#fff' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isSectionHovered && !isSectionBlocked ? 2 : 0.5}
                onMouseEnter={() => !isSectionBlocked && setHoveredSection(`${standIndex}-${tierIndex}-${sectionIndex}`)}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => !isSectionBlocked && isUser && onSelectSection?.(section, stand, tier)}
                style={{ 
                  cursor: isSectionBlocked ? 'not-allowed' : 'pointer',
                  opacity: isSectionBlocked ? 0.35 : (isSectionHovered ? 0.98 : 0.8),
                  transition: 'all 0.2s ease-out',
                  filter: isSectionHovered && !isSectionBlocked 
                    ? 'brightness(1.25) drop-shadow(0 2px 6px rgba(0,0,0,0.3))' 
                    : 'none',
                }}
              />
            );

            // Section label (only if enough space)
            if (sectionAngle > 8) {
              const midAngle = (sStart + sEnd) / 2;
              const labelPos = polarToCartesian(cx, cy, tierInner + tierHeight / 2, midAngle);

              paths.push(
                <text
                  key={`section-label-${standIndex}-${tierIndex}-${sectionIndex}`}
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#fff"
                  style={{ 
                    pointerEvents: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {section.name}
                </text>
              );
            }
          });
        }
      });
    }
  });

  // Add radial partition lines for stands view
  if (viewDetail === 'stands' && totalStands > 1) {
    let lineAngle = 0;
    standsData.forEach((stand, i) => {
      const weight = stand.visualWeight || 1;
      const angleSpan = (weight / totalWeight) * 360;
      
      if (i > 0) {
        const p1 = polarToCartesian(cx, cy, innerRadius, lineAngle);
        const p2 = polarToCartesian(cx, cy, outerRadius, lineAngle);

        paths.push(
          <line
            key={`divider-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
        );
      }
      lineAngle += angleSpan;
    });
  }

  return <g>{paths}</g>;
};

export default StandsViewer;

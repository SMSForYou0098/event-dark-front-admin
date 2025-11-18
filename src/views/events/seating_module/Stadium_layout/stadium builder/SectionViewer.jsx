import React from 'react';
import { areAllSeatsBooked, describeArc, polarToCartesian } from "./helperFuntion";
import { Card } from "antd";
import { useMyContext } from 'Context/MyContextProvider';

const SectionViewer = ({ sections, onSelectSection, isUser, className = "" }) => {
  const cx = 250;
  const cy = 250;
  // Match TierViewer
  const arcSpan = 120;
  const startAngleOffset = -arcSpan / 2;
  const totalSections = sections?.length || 0;
  const anglePerSegment = arcSpan / totalSections;

  // Match TierViewer's inner/outer radius
  const innerRadius = 70;
  const sectionThickness = 40; // same as tier thickness
  const outerRadius = innerRadius + sectionThickness; // 70 + 40 = 110
  const centerCircleRadius = 55; // should match TierViewer's inner circle

  // Responsive sizing, if needed
  const { isMobile } = useMyContext?.() || { isMobile: false };

  if (totalSections === 0) return null;

  const paths = [];
  sections.forEach((section, index) => {
    const startAngle = startAngleOffset + index * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;
    const isSectionBooked = areAllSeatsBooked(section);

    // Arc path (same thickness as a tier arc)
    paths.push(
      <path
        key={`section-${index}`}
        d={describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
        fill={
          section.isBlocked ? "#6c757d"
          : isSectionBooked ? "#000"
          : `hsl(${index * 90}, 40%, 85%)`
        }
        stroke="#000"
        strokeWidth="1"
        onClick={() =>
          !section.isBlocked &&
          !isSectionBooked &&
          isUser &&
          onSelectSection(section)
        }
        style={{
          cursor: section.isBlocked || isSectionBooked ? "not-allowed" : "pointer",
          opacity: section.isBlocked ? 0.6 : 1,
          transition: "all 0.2s ease-in-out"
        }}
      />
    );

    // Label (same logic as tier)
    const middleAngle = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(cx, cy, (innerRadius + outerRadius) / 2, middleAngle);

    paths.push(
      <text
        key={`section-label-${index}`}
        x={labelPos.x}
        y={labelPos.y}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill={section.isBlocked || isSectionBooked ? "#fff" : "#000"}
        style={{ pointerEvents: "none" }}
      >
        {section.name || `S${index + 1}`}
      </text>
    );
  });

  return (
    <div 
      className={className} 
      style={{ 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width="100%"
        height="600px"
        viewBox="0 0 500 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          display: "block",
          maxWidth: isMobile ? '100%' : '80%',
          margin: '0 auto'
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={centerCircleRadius}
          fill="#16610E"
          stroke="#ccc"
        />
        <g>{paths}</g>
      </svg>
    </div>
  );
};

export default SectionViewer;
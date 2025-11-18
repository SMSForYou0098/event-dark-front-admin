import React from "react";
import { describeArc, polarToCartesian } from "./helperFuntion";
import { useMyContext } from "Context/MyContextProvider";

const TierViewer = ({ tiers, onSelectTier, isUser, className = "" }) => {
  const cx = 250;
  const cy = 250;
  const arcSpan = 120;
  const startAngle = -arcSpan / 2;
  const endAngle = arcSpan / 2;
  const tierThickness = 40;
  const innerRadiusStart = 70;
  const { isMobile } = useMyContext();
  const paths = [];

  tiers.forEach((tier, index) => {
    const innerRadius = innerRadiusStart + index * tierThickness;
    const outerRadius = innerRadius + tierThickness;

    const isBlocked = tier.isBlocked;
    const hue = (index * 60) % 360;
    const fillColor = isBlocked ? "var(--gray-color)" : `hsl(${hue}, 40%, 85%)`;

    // Arc path
    paths.push(
      <path
        key={`tier-${index}`}
        d={describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
        fill={fillColor}
        stroke="var(--border-secondary)"
        strokeWidth="1.2"
        onClick={() => !isBlocked && isUser && onSelectTier(tier)}
        className={isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}
        style={{
          opacity: isBlocked ? 0.5 : 0.9,
          transition: "all 0.2s ease-in-out",
          filter: 'brightness(1)',
        }}
        onMouseOver={(e) => {
          if (!isBlocked) {
            e.currentTarget.style.filter = 'brightness(1.2)';
            e.currentTarget.style.strokeWidth = '1.5';
            e.currentTarget.style.stroke = 'var(--primary-color)';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
          e.currentTarget.style.strokeWidth = '1.2';
          e.currentTarget.style.stroke = 'var(--border-secondary)';
        }}
      />
    );

    // Label position
    const labelAngle = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(cx, cy, (innerRadius + outerRadius) / 2, labelAngle);

    paths.push(
      <text
        key={`tier-label-${index}`}
        x={labelPos.x}
        y={labelPos.y}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={isBlocked ? "var(--text-muted)" : "var(--text-white)"}
        style={{ 
          pointerEvents: "none",
          userSelect: "none",
          textShadow: isBlocked ? 'none' : '0 1px 4px rgba(0,0,0,0.8)',
          letterSpacing: '0.3px'
        }}
      >
        {tier.name || `Tier ${index + 1}`}
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
        justifyContent: 'center',
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
          margin: '0 auto',
        }}
      >
        <circle 
          cx={cx} 
          cy={cy} 
          r={innerRadiusStart - 15} 
          fill="var(--success-color)" 
          stroke="var(--border-secondary)"
          strokeWidth="1.5"
        />
        <g>{paths}</g>
      </svg>
    </div>
  );
};

export default TierViewer;
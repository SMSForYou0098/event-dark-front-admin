/**
 * Canvas Drawing Utilities for Stadium Rendering
 * Supports multi-ring stadium layouts
 */

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Convert polar coordinates to cartesian
 */
export const polarToCartesian = (cx, cy, radius, angleInRadians) => ({
  x: cx + radius * Math.cos(angleInRadians),
  y: cy + radius * Math.sin(angleInRadians),
});

/**
 * Draw an arc segment (wedge shape)
 */
export const drawArcSegment = (ctx, {
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  stroke = 'rgba(255,255,255,0.2)',
  lineWidth = 1,
  shadowBlur = 0,
  shadowColor = 'rgba(0,0,0,0.3)',
}) => {
  ctx.save();
  ctx.beginPath();
  
  // Outer arc (clockwise)
  ctx.arc(cx, cy, outerRadius, startAngle, endAngle, false);
  
  // Inner arc (counter-clockwise)
  ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
  
  ctx.closePath();
  
  // Shadow
  if (shadowBlur > 0) {
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = shadowColor;
  }
  
  // Fill
  ctx.fillStyle = fill;
  ctx.fill();
  
  // Stroke
  if (lineWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
};

/**
 * Draw text along an arc
 */
export const drawTextOnArc = (ctx, text, {
  cx,
  cy,
  radius,
  angle,
  fontSize = 13,
  fontFamily = 'Inter, system-ui, sans-serif',
  color = '#ffffff',
  fontWeight = '600',
}) => {
  const pos = polarToCartesian(cx, cy, radius, angle);
  
  ctx.save();
  ctx.translate(pos.x, pos.y);
  
  // Rotate text to follow arc
  // Add 90 degrees so text is readable
  ctx.rotate(angle + HALF_PI);
  
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  
  ctx.restore();
};

/**
 * Draw centered text (no rotation)
 */
export const drawCenteredText = (ctx, text, {
  x,
  y,
  fontSize = 13,
  fontFamily = 'Inter, system-ui, sans-serif',
  color = '#ffffff',
  fontWeight = '600',
  maxWidth = null,
}) => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
  
  ctx.restore();
};

/**
 * Draw a circle
 */
export const drawCircle = (ctx, {
  cx,
  cy,
  radius,
  fill,
  stroke = null,
  lineWidth = 1,
}) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TWO_PI);
  
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
};

/**
 * Draw cricket pitch in center
 */
export const drawCricketPitch = (ctx, { cx, cy, radius }) => {
  // Green field
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, '#2d5a27');
  gradient.addColorStop(1, '#1e4620');
  
  drawCircle(ctx, { cx, cy, radius, fill: gradient });
  
  // Pitch rectangle
  const pitchWidth = radius * 0.15;
  const pitchHeight = radius * 0.5;
  
  ctx.save();
  ctx.fillStyle = '#c9a86c';
  ctx.fillRect(
    cx - pitchWidth / 2,
    cy - pitchHeight / 2,
    pitchWidth,
    pitchHeight
  );
  
  // Pitch outline
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    cx - pitchWidth / 2,
    cy - pitchHeight / 2,
    pitchWidth,
    pitchHeight
  );
  
  // Crease lines
  const creaseWidth = pitchWidth * 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - creaseWidth / 2, cy - pitchHeight / 2 + 5);
  ctx.lineTo(cx + creaseWidth / 2, cy - pitchHeight / 2 + 5);
  ctx.moveTo(cx - creaseWidth / 2, cy + pitchHeight / 2 - 5);
  ctx.lineTo(cx + creaseWidth / 2, cy + pitchHeight / 2 - 5);
  ctx.stroke();
  
  // 30-yard circle (dashed)
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.7, 0, TWO_PI);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.restore();
};

/**
 * Draw grid pattern for background
 */
export const drawGrid = (ctx, { width, height, spacing = 40, color = 'rgba(255,255,255,0.03)' }) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  ctx.restore();
};

/**
 * Calculate geometry for multi-ring stadium
 */
export const calculateMultiRingGeometry = (rings, { width, height, padding = 40 }) => {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2 - padding;
  
  // Sort rings by level (outer first for drawing order)
  const sortedRings = [...rings].sort((a, b) => b.level - a.level);
  const ringCount = sortedRings.length;
  
  // Calculate ring thickness
  const pitchRadius = maxRadius * 0.25;
  const availableRadius = maxRadius - pitchRadius - 10;
  const ringGap = 6;
  const ringThickness = (availableRadius - (ringGap * (ringCount - 1))) / ringCount;
  
  const geometry = {
    cx,
    cy,
    maxRadius,
    pitchRadius,
    rings: [],
    allItems: [], // Flat list for hit testing
  };
  
  sortedRings.forEach((ring, ringIndex) => {
    // Calculate radius for this ring (outer rings have larger radius)
    const ringLevel = ring.level;
    const outerRadius = maxRadius - (ringLevel * (ringThickness + ringGap));
    const innerRadius = outerRadius - ringThickness;
    
    const blocks = ring.blocks || [];
    const totalWeight = blocks.reduce((sum, b) => sum + (b.visualWeight || 1), 0);
    
    // Gap between blocks
    const blockGap = 0.015; // radians
    const totalGap = blockGap * blocks.length;
    const availableAngle = TWO_PI - totalGap;
    
    const ringGeom = {
      ...ring,
      outerRadius,
      innerRadius,
      blocks: [],
    };
    
    let currentAngle = -HALF_PI; // Start from top
    
    blocks.forEach((block, blockIndex) => {
      const weight = block.visualWeight || 1;
      const angleSpan = availableAngle * (weight / totalWeight);
      const startAngle = currentAngle + blockGap / 2;
      const endAngle = startAngle + angleSpan;
      
      const blockGeom = {
        ...block,
        type: 'block',
        ringId: ring.id,
        ringLevel: ring.level,
        index: blockIndex,
        startAngle,
        endAngle,
        midAngle: (startAngle + endAngle) / 2,
        innerRadius,
        outerRadius,
        sections: [],
      };
      
      // Calculate section geometry within block
      const sections = block.sections || [];
      if (sections.length > 0) {
        const sectionGap = 0.008;
        const sectionAvailable = angleSpan - (sectionGap * sections.length);
        const sectionAngle = sectionAvailable / sections.length;
        
        let sectionCursor = startAngle;
        
        sections.forEach((section, sectionIndex) => {
          const secStart = sectionCursor + sectionGap / 2;
          const secEnd = secStart + sectionAngle;
          
          const sectionGeom = {
            ...section,
            type: 'section',
            blockId: block.id,
            ringId: ring.id,
            ringLevel: ring.level,
            index: sectionIndex,
            startAngle: secStart,
            endAngle: secEnd,
            midAngle: (secStart + secEnd) / 2,
            innerRadius: innerRadius + 2,
            outerRadius: outerRadius - 2,
          };
          
          blockGeom.sections.push(sectionGeom);
          geometry.allItems.push(sectionGeom);
          
          sectionCursor = secEnd + sectionGap / 2;
        });
      }
      
      ringGeom.blocks.push(blockGeom);
      geometry.allItems.push(blockGeom);
      
      currentAngle = endAngle + blockGap / 2;
    });
    
    geometry.rings.push(ringGeom);
  });
  
  return geometry;
};

/**
 * Legacy: Calculate geometry for single-ring stadium (stands)
 */
export const calculateStadiumGeometry = (stands, { width, height, padding = 40 }) => {
  // Convert to multi-ring format
  const rings = [{
    id: 'ring-0',
    name: 'Main Ring',
    level: 0,
    blocks: stands.map(stand => ({
      ...stand,
      sections: stand.tiers?.[0]?.sections || stand.sections || [],
    })),
  }];
  
  return calculateMultiRingGeometry(rings, { width, height, padding });
};

/**
 * Check if a point is inside an arc segment
 */
export const isPointInArc = (x, y, { cx, cy, innerRadius, outerRadius, startAngle, endAngle }) => {
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Check radius
  if (distance < innerRadius || distance > outerRadius) {
    return false;
  }
  
  // Check angle
  let angle = Math.atan2(dy, dx);
  
  // Normalize angles to [0, 2π)
  const normalizeAngle = (a) => {
    while (a < 0) a += TWO_PI;
    while (a >= TWO_PI) a -= TWO_PI;
    return a;
  };
  
  angle = normalizeAngle(angle);
  const start = normalizeAngle(startAngle);
  const end = normalizeAngle(endAngle);
  
  // Handle wrap-around
  if (start <= end) {
    return angle >= start && angle <= end;
  } else {
    return angle >= start || angle <= end;
  }
};

/**
 * Lighten a color
 */
export const lightenColor = (color, amount = 0.2) => {
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
};

/**
 * Darken a color
 */
export const darkenColor = (color, amount = 0.2) => {
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
};

/**
 * Add alpha to a color
 */
export const withAlpha = (color, alpha) => {
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  return color;
};

/**
 * Stadium Renderer - Calculates geometry for the new hierarchical schema
 * 
 * Hierarchy: Stadium → Stands → Tiers → Sections → Rows → Seats
 */

const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees) => degrees * DEG_TO_RAD;

/**
 * Convert polar to cartesian coordinates
 */
export const polarToCartesian = (cx, cy, radius, angleRad) => ({
  x: cx + radius * Math.cos(angleRad),
  y: cy + radius * Math.sin(angleRad),
});

/**
 * Calculate full stadium geometry from schema
 */
export const calculateStadiumLayout = (stadium, { width, height, padding = 40 }) => {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2 - padding;
  
  // Field radius
  const fieldRadiusPercent = stadium.geometry?.field?.radiusPercent || 0.25;
  const fieldRadius = maxRadius * fieldRadiusPercent;
  
  // Available radius for seating
  const seatingRadius = maxRadius - fieldRadius - 15;
  
  // Calculate max tiers across all stands
  const maxTiers = Math.max(
    ...stadium.stands.map(s => s.tiers?.length || 0),
    1
  );
  
  // Tier dimensions
  const tierGap = 4;
  const tierThickness = (seatingRadius - (tierGap * (maxTiers - 1))) / maxTiers;
  
  const layout = {
    cx,
    cy,
    width,
    height,
    maxRadius,
    fieldRadius,
    seatingRadius,
    tierThickness,
    stands: [],
    allItems: [], // Flat list for hit-testing
  };
  
  // Process each stand
  stadium.stands.forEach((stand, standIndex) => {
    const standGeom = calculateStandGeometry(stand, {
      cx,
      cy,
      fieldRadius,
      tierThickness,
      tierGap,
      standIndex,
      totalStands: stadium.stands.length,
    });
    
    layout.stands.push(standGeom);
    
    // Add to flat list
    layout.allItems.push({
      type: 'stand',
      ...standGeom,
    });
    
    // Add tiers to flat list
    standGeom.tiers.forEach(tier => {
      layout.allItems.push({
        type: 'tier',
        ...tier,
        stand: standGeom,
      });
      
      // Add sections to flat list
      tier.sections.forEach(section => {
        layout.allItems.push({
          type: 'section',
          ...section,
          tier,
          stand: standGeom,
        });
      });
    });
  });
  
  return layout;
};

/**
 * Calculate geometry for a single stand
 */
const calculateStandGeometry = (stand, { cx, cy, fieldRadius, tierThickness, tierGap, standIndex, totalStands }) => {
  // Get angles from schema (in degrees) or calculate from position
  let startAngle, endAngle;
  
  if (stand.geometry?.startAngle != null && stand.geometry?.endAngle != null) {
    startAngle = toRadians(stand.geometry.startAngle - 90); // -90 to start from top
    endAngle = toRadians(stand.geometry.endAngle - 90);
  } else {
    // Default: divide evenly
    const anglePerStand = TWO_PI / totalStands;
    const gap = 0.02; // Small gap between stands
    startAngle = standIndex * anglePerStand + gap / 2 - Math.PI / 2;
    endAngle = (standIndex + 1) * anglePerStand - gap / 2 - Math.PI / 2;
  }
  
  const midAngle = (startAngle + endAngle) / 2;
  
  // Calculate tier geometries
  const tiers = (stand.tiers || []).map((tier, tierIndex) => {
    return calculateTierGeometry(tier, {
      cx,
      cy,
      fieldRadius,
      tierThickness,
      tierGap,
      tierIndex,
      startAngle,
      endAngle,
      standId: stand.id,
    });
  });
  
  // Stand's outer bounds (outermost tier)
  const outerTier = tiers[tiers.length - 1];
  const innerTier = tiers[0];
  
  return {
    ...stand,
    startAngle,
    endAngle,
    midAngle,
    innerRadius: innerTier?.innerRadius || fieldRadius + 15,
    outerRadius: outerTier?.outerRadius || fieldRadius + tierThickness + 15,
    tiers,
    cx,
    cy,
  };
};

/**
 * Calculate geometry for a single tier
 */
const calculateTierGeometry = (tier, { cx, cy, fieldRadius, tierThickness, tierGap, tierIndex, startAngle, endAngle, standId }) => {
  // Calculate radius based on tier level (0 = closest to field)
  const level = tier.level ?? tierIndex;
  const innerRadius = fieldRadius + 15 + (level * (tierThickness + tierGap));
  const outerRadius = innerRadius + tierThickness;
  
  const midAngle = (startAngle + endAngle) / 2;
  
  // Calculate section geometries
  const sections = (tier.sections || []).map((section, sectionIndex) => {
    return calculateSectionGeometry(section, {
      cx,
      cy,
      innerRadius: innerRadius + 2,
      outerRadius: outerRadius - 2,
      startAngle,
      endAngle,
      sectionIndex,
      totalSections: tier.sections.length,
      tierId: tier.id,
      standId,
    });
  });
  
  return {
    ...tier,
    startAngle,
    endAngle,
    midAngle,
    innerRadius,
    outerRadius,
    sections,
    cx,
    cy,
  };
};

/**
 * Calculate geometry for a single section
 */
const calculateSectionGeometry = (section, { cx, cy, innerRadius, outerRadius, startAngle, endAngle, sectionIndex, totalSections, tierId, standId }) => {
  // Divide the tier's arc among sections
  const totalAngle = endAngle - startAngle;
  const sectionGap = 0.01; // Small gap between sections
  const availableAngle = totalAngle - (sectionGap * totalSections);
  const sectionAngle = availableAngle / totalSections;
  
  const secStartAngle = startAngle + (sectionIndex * (sectionAngle + sectionGap)) + sectionGap / 2;
  const secEndAngle = secStartAngle + sectionAngle;
  const midAngle = (secStartAngle + secEndAngle) / 2;
  
  // Debug: ensure rows are preserved
  if (sectionIndex === 0) {
    // console.log('calculateSectionGeometry:', section.name, 'rows:', section.rows?.length, 'has rows:', !!section.rows);
  }
  
  return {
    ...section,
    startAngle: secStartAngle,
    endAngle: secEndAngle,
    midAngle,
    innerRadius,
    outerRadius,
    cx,
    cy,
  };
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
  
  // Normalize to [0, 2π)
  const normalize = (a) => {
    while (a < 0) a += TWO_PI;
    while (a >= TWO_PI) a -= TWO_PI;
    return a;
  };
  
  angle = normalize(angle);
  const start = normalize(startAngle);
  const end = normalize(endAngle);
  
  // Handle wrap-around
  if (start <= end) {
    return angle >= start && angle <= end;
  } else {
    return angle >= start || angle <= end;
  }
};

/**
 * Find item at position in layout
 */
export const findItemAtPosition = (x, y, layout, viewLevel = 'stands') => {
  if (!layout) return null;
  
  // Filter items based on view level
  let items = [];
  
  if (viewLevel === 'stands') {
    items = layout.allItems.filter(i => i.type === 'stand');
  } else if (viewLevel === 'tiers') {
    items = layout.allItems.filter(i => i.type === 'tier');
  } else if (viewLevel === 'sections') {
    items = layout.allItems.filter(i => i.type === 'section');
  }
  
  // Check each item (reverse order so top items are checked first)
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (isPointInArc(x, y, {
      cx: layout.cx,
      cy: layout.cy,
      innerRadius: item.innerRadius,
      outerRadius: item.outerRadius,
      startAngle: item.startAngle,
      endAngle: item.endAngle,
    })) {
      return item;
    }
  }
  
  return null;
};

/**
 * Draw functions
 */
export const drawArc = (ctx, { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, stroke, lineWidth = 1 }) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, startAngle, endAngle, false);
  ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  
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

export const drawText = (ctx, text, { x, y, fontSize = 12, color = '#fff', align = 'center', baseline = 'middle' }) => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
};

export const drawField = (ctx, { cx, cy, radius, type = 'cricket' }) => {
  // Green field
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, '#2d5a27');
  gradient.addColorStop(1, '#1e4620');
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TWO_PI);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  if (type === 'cricket') {
    // Pitch
    const pitchW = radius * 0.12;
    const pitchH = radius * 0.45;
    ctx.fillStyle = '#c9a86c';
    ctx.fillRect(cx - pitchW / 2, cy - pitchH / 2, pitchW, pitchH);
    
    // 30-yard circle
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.65, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  ctx.restore();
};

/**
 * Color utilities
 */
export const lightenColor = (color, amount = 0.15) => {
  if (!color?.startsWith('#')) return color;
  const num = parseInt(color.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `rgb(${r}, ${g}, ${b})`;
};

export const withAlpha = (color, alpha) => {
  if (!color?.startsWith('#')) return color;
  const num = parseInt(color.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


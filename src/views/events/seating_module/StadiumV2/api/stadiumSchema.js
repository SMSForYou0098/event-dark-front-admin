/**
 * Stadium Data Schema - Hierarchical Structure
 * =============================================
 * 
 * Hierarchy:
 * Stadium → Stands/Wings → Tiers → Sections/Blocks → Rows → Seats
 * 
 * Each level includes:
 * - Identifiers (id, name, code)
 * - Parent-child relationships (parentId, children array)
 * - Geometric info (position, rotation, shape, coordinates)
 * - Business info (price, status, capacity)
 */

// ============================================
// SCHEMA DEFINITIONS
// ============================================

/**
 * @typedef {Object} Stadium
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} code - Short code (e.g., "NMS" for Narendra Modi Stadium)
 * @property {string} venueId - Reference to venue
 * @property {StadiumGeometry} geometry - Shape and layout info
 * @property {Stand[]} stands - Array of stands/wings
 * @property {number} capacity - Total calculated capacity
 * @property {Object} metadata - Additional info (created, updated, etc.)
 */

/**
 * @typedef {Object} StadiumGeometry
 * @property {'oval'|'rectangle'|'horseshoe'|'custom'} shape - Stadium shape
 * @property {number} width - Canvas/SVG width
 * @property {number} height - Canvas/SVG height
 * @property {number} rotation - Overall rotation in degrees
 * @property {Object} field - Field/pitch dimensions
 */

/**
 * @typedef {Object} Stand
 * @property {string} id - Unique identifier
 * @property {string} stadiumId - Parent stadium ID
 * @property {string} name - Display name (e.g., "North Stand")
 * @property {string} code - Short code (e.g., "NS")
 * @property {number} order - Display order (0 = top/north)
 * @property {StandGeometry} geometry - Position and shape
 * @property {Tier[]} tiers - Array of tiers
 * @property {StandStatus} status - Availability status
 * @property {Object} style - Visual styling
 */

/**
 * @typedef {Object} StandGeometry
 * @property {number} startAngle - Start angle in degrees (0 = top)
 * @property {number} endAngle - End angle in degrees
 * @property {number} visualWeight - Relative size (0.5 to 2.0)
 * @property {'arc'|'straight'|'custom'} shape - Stand shape
 * @property {Point[]} [customPath] - For custom shapes
 */

/**
 * @typedef {Object} Tier
 * @property {string} id - Unique identifier
 * @property {string} standId - Parent stand ID
 * @property {string} name - Display name (e.g., "Lower Tier")
 * @property {string} code - Short code (e.g., "LT")
 * @property {number} level - 0 = closest to field, higher = further
 * @property {TierGeometry} geometry - Position info
 * @property {Section[]} sections - Array of sections
 * @property {TierStatus} status - Availability status
 * @property {number} basePrice - Default price for this tier
 * @property {Object} style - Visual styling
 */

/**
 * @typedef {Object} TierGeometry
 * @property {number} radiusOffset - Distance from field center
 * @property {number} thickness - Radial thickness
 * @property {number} elevation - Height above ground (for 3D)
 */

/**
 * @typedef {Object} Section
 * @property {string} id - Unique identifier
 * @property {string} tierId - Parent tier ID
 * @property {string} standId - Grandparent stand ID (denormalized for queries)
 * @property {string} name - Display name (e.g., "Section A" or "Block 1")
 * @property {string} code - Short code (e.g., "A", "1")
 * @property {number} order - Position within tier (left to right)
 * @property {SectionGeometry} geometry - Position and shape
 * @property {Row[]} rows - Array of rows
 * @property {SectionStatus} status - Availability status
 * @property {number} [priceOverride] - Override tier price
 * @property {Object} style - Visual styling
 */

/**
 * @typedef {Object} SectionGeometry
 * @property {number} startAngle - Start angle within parent tier
 * @property {number} endAngle - End angle within parent tier
 * @property {number} [curve] - Curvature amount (0 = straight)
 */

/**
 * @typedef {Object} Row
 * @property {string} id - Unique identifier
 * @property {string} sectionId - Parent section ID
 * @property {string} tierId - Grandparent tier ID (denormalized)
 * @property {string} standId - Great-grandparent stand ID (denormalized)
 * @property {string} label - Row label (e.g., "A", "1", "AA")
 * @property {number} order - Position within section (0 = front/closest to field)
 * @property {RowGeometry} geometry - Position and shape
 * @property {Seat[]} seats - Array of seats (can be generated or explicit)
 * @property {number} seatCount - Number of seats (for generation)
 * @property {RowStatus} status - Availability status
 * @property {number} [priceOverride] - Override section/tier price
 */

/**
 * @typedef {Object} RowGeometry
 * @property {number} curve - Curvature (0 = straight, positive = curved toward field)
 * @property {number} spacing - Space between seats
 * @property {number} offsetX - Horizontal offset from center
 * @property {number} offsetY - Vertical offset from default position
 */

/**
 * @typedef {Object} Seat
 * @property {string} id - Unique identifier (e.g., "NS-LT-A-1-15")
 * @property {string} rowId - Parent row ID
 * @property {string} sectionId - Grandparent section ID (denormalized)
 * @property {string} tierId - (denormalized)
 * @property {string} standId - (denormalized)
 * @property {number} number - Seat number within row
 * @property {string} label - Display label (usually same as number)
 * @property {SeatGeometry} geometry - Exact position
 * @property {SeatStatus} status - Current status
 * @property {SeatType} type - Seat type
 * @property {number} [priceOverride] - Override row/section/tier price
 * @property {Object} [accessibility] - Accessibility features
 */

/**
 * @typedef {Object} SeatGeometry
 * @property {number} x - X coordinate on canvas
 * @property {number} y - Y coordinate on canvas
 * @property {number} rotation - Rotation in degrees (facing field)
 * @property {number} [width] - Seat width (for variable sizing)
 * @property {number} [depth] - Seat depth
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

// ============================================
// STATUS ENUMS
// ============================================

export const StandStatus = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  MAINTENANCE: 'maintenance',
  HIDDEN: 'hidden',
};

export const TierStatus = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  CLOSED: 'closed',
};

export const SectionStatus = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  RESERVED: 'reserved', // For VIP, corporate, etc.
};

export const RowStatus = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
};

export const SeatStatus = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
  LOCKED: 'locked',      // Temporarily held during checkout
  RESERVED: 'reserved',  // Pre-reserved (VIP, sponsors)
  MAINTENANCE: 'maintenance',
};

export const SeatType = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  VIP: 'vip',
  WHEELCHAIR: 'wheelchair',
  COMPANION: 'companion', // Next to wheelchair
  RESTRICTED_VIEW: 'restricted_view',
  AISLE: 'aisle',
};

// ============================================
// SHAPE TYPES
// ============================================

export const StadiumShape = {
  OVAL: 'oval',           // Cricket, athletics
  RECTANGLE: 'rectangle', // Football, hockey
  HORSESHOE: 'horseshoe', // Open end
  CUSTOM: 'custom',       // Irregular shape
};

export const StandShape = {
  ARC: 'arc',             // Curved section
  STRAIGHT: 'straight',   // Flat section
  CUSTOM: 'custom',       // Irregular
};

// ============================================
// FACTORY FUNCTIONS
// ============================================

let idCounter = 0;
const generateId = (prefix) => `${prefix}-${Date.now()}-${++idCounter}`;

/**
 * Create a new stadium
 */
export const createStadium = (name, shape = StadiumShape.OVAL) => ({
  id: generateId('stadium'),
  name,
  code: name.split(' ').map(w => w[0]).join('').toUpperCase(),
  venueId: null,
  geometry: {
    shape,
    width: 800,
    height: 800,
    rotation: 0,
    field: {
      type: shape === StadiumShape.OVAL ? 'cricket' : 'football',
      radiusPercent: 0.25, // Field takes 25% of total radius
    },
  },
  stands: [],
  capacity: 0,
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

/**
 * Create a new stand
 */
export const createStand = (stadiumId, name, startAngle, endAngle) => ({
  id: generateId('stand'),
  stadiumId,
  name,
  code: name.split(' ').map(w => w[0]).join('').toUpperCase(),
  order: 0,
  geometry: {
    startAngle,
    endAngle,
    visualWeight: 1,
    shape: StandShape.ARC,
  },
  tiers: [],
  status: StandStatus.ACTIVE,
  style: {
    color: '#3b82f6',
    hoverColor: '#60a5fa',
  },
});

/**
 * Create a new tier
 */
export const createTier = (standId, name, level) => ({
  id: generateId('tier'),
  standId,
  name,
  code: name.split(' ').map(w => w[0]).join('').toUpperCase(),
  level,
  geometry: {
    radiusOffset: 0, // Calculated based on level
    thickness: 40,
    elevation: level * 5, // For 3D
  },
  sections: [],
  status: TierStatus.ACTIVE,
  basePrice: 500 + (level * 200),
  style: {
    color: null, // Inherit from stand
  },
});

/**
 * Create a new section
 */
export const createSection = (tierId, standId, name, order) => ({
  id: generateId('section'),
  tierId,
  standId,
  name,
  code: name,
  order,
  geometry: {
    startAngle: 0, // Calculated
    endAngle: 0,   // Calculated
    curve: 0,
  },
  rows: [],
  status: SectionStatus.ACTIVE,
  priceOverride: null,
  style: {
    color: null, // Inherit from tier
  },
});

/**
 * Create a new row
 */
export const createRow = (sectionId, tierId, standId, label, seatCount) => ({
  id: generateId('row'),
  sectionId,
  tierId,
  standId,
  label,
  order: label.charCodeAt(0) - 65, // A=0, B=1, etc.
  geometry: {
    curve: 3,
    spacing: 2,
    offsetX: 0,
    offsetY: 0,
  },
  seats: [], // Will be generated
  seatCount,
  status: RowStatus.ACTIVE,
  priceOverride: null,
});

/**
 * Create a new seat
 */
export const createSeat = (rowId, sectionId, tierId, standId, number, x, y) => ({
  id: `${standId}-${tierId}-${sectionId}-${rowId}-${number}`,
  rowId,
  sectionId,
  tierId,
  standId,
  number,
  label: String(number),
  geometry: {
    x,
    y,
    rotation: 0,
  },
  status: SeatStatus.AVAILABLE,
  type: SeatType.STANDARD,
  priceOverride: null,
  accessibility: null,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get full path for any item
 */
export const getItemPath = (item, stadium) => {
  const path = { stadium };
  
  if (item.standId) {
    path.stand = stadium.stands.find(s => s.id === item.standId);
  }
  if (item.tierId && path.stand) {
    path.tier = path.stand.tiers.find(t => t.id === item.tierId);
  }
  if (item.sectionId && path.tier) {
    path.section = path.tier.sections.find(s => s.id === item.sectionId);
  }
  if (item.rowId && path.section) {
    path.row = path.section.rows.find(r => r.id === item.rowId);
  }
  
  return path;
};

/**
 * Get effective price for a seat
 */
export const getSeatPrice = (seat, row, section, tier) => {
  if (seat?.priceOverride != null) return seat.priceOverride;
  if (row?.priceOverride != null) return row.priceOverride;
  if (section?.priceOverride != null) return section.priceOverride;
  if (tier?.basePrice != null) return tier.basePrice;
  return 0;
};

/**
 * Calculate stadium capacity
 */
export const calculateStadiumCapacity = (stadium) => {
  let total = 0;
  
  for (const stand of stadium.stands || []) {
    if (stand.status === StandStatus.BLOCKED) continue;
    
    for (const tier of stand.tiers || []) {
      if (tier.status === TierStatus.BLOCKED) continue;
      
      for (const section of tier.sections || []) {
        if (section.status === SectionStatus.BLOCKED) continue;
        
        for (const row of section.rows || []) {
          if (row.status === RowStatus.BLOCKED) continue;
          
          // Use explicit seats if available, otherwise seatCount
          if (row.seats?.length) {
            total += row.seats.filter(s => s.status !== SeatStatus.BLOCKED).length;
          } else {
            total += row.seatCount || 0;
          }
        }
      }
    }
  }
  
  return total;
};

/**
 * Generate seats for a row based on geometry
 */
export const generateRowSeats = (row, section, tier, stand, centerX, startY) => {
  const seats = [];
  const count = row.seatCount || 0;
  const spacing = row.geometry?.spacing || 2;
  const curve = row.geometry?.curve || 0;
  const seatSize = 20;
  
  const totalWidth = count * (seatSize + spacing) - spacing;
  const startX = centerX - totalWidth / 2;
  
  for (let i = 0; i < count; i++) {
    const progress = count > 1 ? i / (count - 1) : 0.5;
    const curveOffset = Math.sin(progress * Math.PI) * curve;
    
    const x = startX + i * (seatSize + spacing) + seatSize / 2;
    const y = startY + curveOffset;
    
    seats.push(createSeat(
      row.id,
      section.id,
      tier.id,
      stand.id,
      i + 1,
      x,
      y
    ));
  }
  
  return seats;
};

/**
 * Generate unique seat ID
 */
export const generateSeatId = (stand, tier, section, row, seatNumber) => {
  return `${stand.code}-${tier.code}-${section.code}-${row.label}-${seatNumber}`;
};


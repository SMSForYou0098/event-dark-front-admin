/**
 * Stadium Data Structure - Multi-Ring Support
 * This is the contract between Frontend and Backend (Laravel)
 * 
 * Backend dev: Build APIs that return data in this exact format
 */

// ============================================
// DATA STRUCTURE DEFINITION
// ============================================

/**
 * Stadium Schema:
 * {
 *   id: string,
 *   name: string,
 *   venue_id: string,
 *   capacity: number,
 *   rings: Ring[]  // Multiple concentric rings
 * }
 * 
 * Ring Schema:
 * {
 *   id: string,
 *   name: string,
 *   level: number (0 = innermost, higher = outer),
 *   color: string (default color for blocks in this ring),
 *   blocks: Block[]
 * }
 * 
 * Block Schema (replaces Stand):
 * {
 *   id: string,
 *   name: string,
 *   color: string,
 *   visualWeight: number (1-3, affects arc size),
 *   startAngle: number (optional, for precise positioning),
 *   isBlocked: boolean,
 *   sections: Section[]
 * }
 * 
 * Section Schema:
 * {
 *   id: string,
 *   name: string,
 *   isBlocked: boolean,
 *   rows: Row[]
 * }
 * 
 * Row Schema:
 * {
 *   id: string,
 *   label: string (e.g., "A", "B", "Row 1"),
 *   seats: number (count),
 *   isBlocked: boolean,
 *   curve: number (0 = straight, positive = curved toward stage)
 * }
 */

// ============================================
// EMPTY STADIUM TEMPLATE
// ============================================

export const EMPTY_STADIUM = {
  id: null,
  name: '',
  venue_id: null,
  capacity: 0,
  rings: [],
  // Legacy support
  stands: [],
};

// ============================================
// DEFAULT TEMPLATES
// ============================================

export const createRing = (level) => ({
  id: `ring-${Date.now()}-${level}`,
  name: level === 0 ? 'Inner Ring' : level === 1 ? 'Middle Ring' : `Ring ${level + 1}`,
  level,
  color: RING_COLORS[level % RING_COLORS.length],
  blocks: [],
});

export const createBlock = (index, ringLevel = 0) => ({
  id: `block-${Date.now()}-${index}`,
  name: `Block ${String.fromCharCode(65 + index)}`, // A, B, C...
  color: STAND_COLORS[index % STAND_COLORS.length],
  visualWeight: 1,
  isBlocked: false,
  sections: [createSection(0)],
});

export const createStand = (index) => createBlock(index, 0);

export const createTier = (index) => ({
  id: `tier-${Date.now()}-${index}`,
  name: `Tier ${index + 1}`,
  price: 500 + (index * 200),
  isBlocked: false,
  sections: [createSection(0)],
});

export const createSection = (index) => ({
  id: `section-${Date.now()}-${index}`,
  name: `Section ${index + 1}`,
  isBlocked: false,
  rows: [createRow(0), createRow(1)],
});

export const createRow = (index) => ({
  id: `row-${Date.now()}-${index}`,
  label: String.fromCharCode(65 + index), // A, B, C...
  seats: 10 + index * 2,
  price: null, // null = inherit from tier
  isBlocked: false,
  curve: 0,
});

// ============================================
// COLOR PALETTES
// ============================================

export const RING_COLORS = [
  '#f59e0b', // Inner - Amber/Orange (premium)
  '#3b82f6', // Middle - Blue
  '#06b6d4', // Outer - Cyan/Light Blue
  '#8b5cf6', // Extra - Purple
];

export const STAND_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#a855f7', // Purple
];

export const TIER_COLORS = [
  '#ff9f43',
  '#1dd1a1', 
  '#54a0ff',
  '#c56cf0',
  '#ff6b6b',
];

// ============================================
// MULTI-RING SAMPLE STADIUM (Like Gujarat Titans)
// ============================================

export const MULTI_RING_STADIUM = {
  id: 'stadium-gt',
  name: 'Narendra Modi Stadium',
  venue_id: 'venue-ahmedabad',
  capacity: 132000,
  rings: [
    // Inner Ring - Premium/VIP sections (closest to field)
    {
      id: 'ring-inner',
      name: 'Premium Ring',
      level: 0,
      color: '#f59e0b',
      blocks: [
        { id: 'inner-n', name: 'N', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'in-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-ne', name: 'NE', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'ine-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-e', name: 'E', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'ie-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-se', name: 'SE', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'ise-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-s', name: 'S', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'is-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-sw', name: 'SW', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'isw-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-w', name: 'W', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'iw-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
        { id: 'inner-nw', name: 'NW', color: '#f59e0b', visualWeight: 1, isBlocked: false, sections: [{ id: 'inw-s1', name: '1', isBlocked: false, rows: generateRows(5, 15) }] },
      ],
    },
    // Middle Ring - General sections with numbered blocks
    {
      id: 'ring-middle',
      name: 'General Ring',
      level: 1,
      color: '#3b82f6',
      blocks: [
        { id: 'mid-a', name: 'Block A', color: '#3b82f6', visualWeight: 0.8, isBlocked: false, sections: generateSections(3, 'A') },
        { id: 'mid-b', name: 'Block B', color: '#3b82f6', visualWeight: 0.8, isBlocked: false, sections: generateSections(3, 'B') },
        { id: 'mid-c', name: 'Block C', color: '#3b82f6', visualWeight: 0.8, isBlocked: false, sections: generateSections(3, 'C') },
        { id: 'mid-d', name: 'Block D', color: '#3b82f6', visualWeight: 0.6, isBlocked: false, sections: generateSections(2, 'D') },
        { id: 'mid-e', name: 'Block E', color: '#3b82f6', visualWeight: 0.6, isBlocked: false, sections: generateSections(2, 'E') },
        { id: 'mid-f', name: 'Block F', color: '#3b82f6', visualWeight: 0.8, isBlocked: false, sections: generateSections(3, 'F') },
        { id: 'mid-g', name: 'Block G', color: '#3b82f6', visualWeight: 0.8, isBlocked: false, sections: generateSections(3, 'G') },
        { id: 'mid-h', name: 'Block H', color: '#3b82f6', visualWeight: 0.8, isBlocked: false, sections: generateSections(3, 'H') },
      ],
    },
    // Outer Ring - Large blocks (J, K, L, M, N, P, Q, R)
    {
      id: 'ring-outer',
      name: 'Upper Ring',
      level: 2,
      color: '#06b6d4',
      blocks: [
        { id: 'out-j', name: 'Block J', color: '#67e8f9', visualWeight: 1.2, isBlocked: false, sections: generateSections(5, 'J') },
        { id: 'out-k', name: 'Block K', color: '#67e8f9', visualWeight: 1.2, isBlocked: false, sections: generateSections(5, 'K') },
        { id: 'out-l', name: 'Block L', color: '#67e8f9', visualWeight: 1, isBlocked: false, sections: generateSections(4, 'L') },
        { id: 'out-m', name: 'Block M', color: '#67e8f9', visualWeight: 1, isBlocked: false, sections: generateSections(4, 'M') },
        { id: 'out-n', name: 'Block N', color: '#67e8f9', visualWeight: 1, isBlocked: false, sections: generateSections(4, 'N') },
        { id: 'out-p', name: 'Block P', color: '#67e8f9', visualWeight: 1, isBlocked: false, sections: generateSections(4, 'P') },
        { id: 'out-q', name: 'Block Q', color: '#67e8f9', visualWeight: 1.2, isBlocked: false, sections: generateSections(5, 'Q') },
        { id: 'out-r', name: 'Block R', color: '#67e8f9', visualWeight: 1.2, isBlocked: false, sections: generateSections(5, 'R') },
      ],
    },
  ],
  // Legacy format (for backward compatibility)
  stands: [],
};

// Helper to generate rows
function generateRows(count, seatsPerRow) {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
    label: String.fromCharCode(65 + i),
    seats: seatsPerRow + i * 2,
    price: null,
    isBlocked: false,
    curve: 3,
  }));
}

// Helper to generate sections
function generateSections(count, blockPrefix) {
  return Array.from({ length: count }, (_, i) => ({
    id: `section-${blockPrefix}-${i + 1}-${Math.random().toString(36).substr(2, 5)}`,
    name: `${i + 1}`,
    isBlocked: false,
    rows: generateRows(4, 12 + i * 2),
  }));
}

// ============================================
// SIMPLE SAMPLE STADIUM (Original)
// ============================================

export const SAMPLE_STADIUM = {
  id: 'stadium-001',
  name: 'National Cricket Stadium',
  venue_id: 'venue-001',
  capacity: 45000,
  rings: [
    {
      id: 'ring-0',
      name: 'Main Ring',
      level: 0,
      color: '#3b82f6',
      blocks: [
        {
          id: 'stand-north',
          name: 'North Stand',
          color: '#6366f1',
          visualWeight: 1.2,
          isBlocked: false,
          sections: [
            {
              id: 'north-s1',
              name: 'Section 1',
              isBlocked: false,
              rows: [
                { id: 'n-s1-r1', label: 'A', seats: 20, price: null, isBlocked: false, curve: 5 },
                { id: 'n-s1-r2', label: 'B', seats: 22, price: null, isBlocked: false, curve: 5 },
                { id: 'n-s1-r3', label: 'C', seats: 24, price: null, isBlocked: false, curve: 5 },
                { id: 'n-s1-r4', label: 'D', seats: 26, price: null, isBlocked: false, curve: 5 },
              ],
            },
            {
              id: 'north-s2',
              name: 'Section 2',
              isBlocked: false,
              rows: [
                { id: 'n-s2-r1', label: 'A', seats: 20, price: null, isBlocked: false, curve: 5 },
                { id: 'n-s2-r2', label: 'B', seats: 22, price: null, isBlocked: false, curve: 5 },
                { id: 'n-s2-r3', label: 'C', seats: 24, price: null, isBlocked: false, curve: 5 },
              ],
            },
          ],
        },
        {
          id: 'stand-east',
          name: 'East Stand',
          color: '#ec4899',
          visualWeight: 1,
          isBlocked: false,
          sections: [
            {
              id: 'east-s1',
              name: 'Section 1',
              isBlocked: false,
              rows: [
                { id: 'e-s1-r1', label: 'A', seats: 18, price: null, isBlocked: false, curve: 3 },
                { id: 'e-s1-r2', label: 'B', seats: 20, price: null, isBlocked: false, curve: 3 },
                { id: 'e-s1-r3', label: 'C', seats: 22, price: null, isBlocked: false, curve: 3 },
              ],
            },
          ],
        },
        {
          id: 'stand-south',
          name: 'South Stand',
          color: '#14b8a6',
          visualWeight: 1.2,
          isBlocked: false,
          sections: [
            {
              id: 'south-s1',
              name: 'Section 1',
              isBlocked: false,
              rows: [
                { id: 's-s1-r1', label: 'A', seats: 20, price: null, isBlocked: false, curve: 5 },
                { id: 's-s1-r2', label: 'B', seats: 22, price: null, isBlocked: false, curve: 5 },
                { id: 's-s1-r3', label: 'C', seats: 24, price: null, isBlocked: false, curve: 5 },
              ],
            },
            {
              id: 'south-s2',
              name: 'Section 2',
              isBlocked: false,
              rows: [
                { id: 's-s2-r1', label: 'A', seats: 20, price: null, isBlocked: false, curve: 5 },
                { id: 's-s2-r2', label: 'B', seats: 22, price: null, isBlocked: false, curve: 5 },
              ],
            },
          ],
        },
        {
          id: 'stand-west',
          name: 'West Stand',
          color: '#f59e0b',
          visualWeight: 1,
          isBlocked: false,
          sections: [
            {
              id: 'west-s1',
              name: 'VIP Section',
              isBlocked: false,
              rows: [
                { id: 'w-s1-r1', label: 'A', seats: 15, price: 2000, isBlocked: false, curve: 2 },
                { id: 'w-s1-r2', label: 'B', seats: 15, price: 1800, isBlocked: false, curve: 2 },
                { id: 'w-s1-r3', label: 'C', seats: 15, price: 1500, isBlocked: false, curve: 2 },
              ],
            },
          ],
        },
      ],
    },
  ],
  stands: [], // Legacy
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate total capacity of a stadium
 */
export const calculateCapacity = (stadium) => {
  let total = 0;
  
  // New ring-based structure
  if (stadium?.rings?.length) {
    stadium.rings.forEach(ring => {
      if (!ring.blocks) return;
      ring.blocks.forEach(block => {
        if (block.isBlocked) return;
        (block.sections || []).forEach(section => {
          if (section.isBlocked) return;
          (section.rows || []).forEach(row => {
            if (!row.isBlocked) {
              total += row.seats || 0;
            }
          });
        });
      });
    });
  }
  
  // Legacy stand-based structure
  if (stadium?.stands?.length) {
    stadium.stands.forEach(stand => {
      if (stand.isBlocked) return;
      (stand.tiers || []).forEach(tier => {
        if (tier.isBlocked) return;
        (tier.sections || []).forEach(section => {
          if (section.isBlocked) return;
          (section.rows || []).forEach(row => {
            if (!row.isBlocked) {
              total += row.seats || 0;
            }
          });
        });
      });
    });
  }
  
  return total;
};

/**
 * Get price for a specific location
 */
export const getPrice = (block, section, row) => {
  if (row?.price != null) return row.price;
  if (section?.price != null) return section.price;
  if (block?.price != null) return block.price;
  return 0;
};

/**
 * Generate unique ID
 */
export const generateId = (prefix = 'item') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert legacy stands to rings format
 */
export const convertStandsToRings = (stands) => {
  if (!stands?.length) return [];
  
  return [{
    id: 'ring-converted',
    name: 'Main Ring',
    level: 0,
    color: '#3b82f6',
    blocks: stands.map(stand => ({
      id: stand.id,
      name: stand.name,
      color: stand.color,
      visualWeight: stand.visualWeight || 1,
      isBlocked: stand.isBlocked || false,
      sections: stand.tiers?.[0]?.sections || stand.sections || [],
    })),
  }];
};

/**
 * Sample Stadiums using the proper hierarchical schema
 * 
 * Hierarchy: Stadium → Stands → Tiers → Sections → Rows → Seats
 */

import {
  StandStatus,
  TierStatus,
  SectionStatus,
  RowStatus,
  SeatStatus,
  SeatType,
  StadiumShape,
  StandShape,
} from './stadiumSchema';

// ============================================
// HELPER FUNCTIONS
// ============================================

let idSeq = 0;
const uid = (prefix) => `${prefix}-${++idSeq}`;

const createRows = (count, seatsPerRow, sectionId, tierId, standId) => {
  return Array.from({ length: count }, (_, i) => ({
    id: uid('row'),
    sectionId,
    tierId,
    standId,
    label: String.fromCharCode(65 + i), // A, B, C...
    order: i,
    geometry: {
      curve: 3 + i * 0.5, // Increasing curve for back rows
      spacing: 2,
      offsetX: 0,
      offsetY: 0,
    },
    seats: [], // Generated on demand
    seatCount: seatsPerRow + (i * 2), // Back rows have more seats
    status: RowStatus.ACTIVE,
    priceOverride: null,
  }));
};

const createSections = (count, rowsPerSection, seatsPerRow, tierId, standId, prefix = '') => {
  return Array.from({ length: count }, (_, i) => {
    const sectionId = uid('section');
    return {
      id: sectionId,
      tierId,
      standId,
      name: prefix ? `${prefix}${i + 1}` : `Section ${i + 1}`,
      code: prefix ? `${prefix}${i + 1}` : `S${i + 1}`,
      order: i,
      geometry: {
        startAngle: 0, // Calculated by renderer
        endAngle: 0,
        curve: 0,
      },
      rows: createRows(rowsPerSection, seatsPerRow, sectionId, tierId, standId),
      status: SectionStatus.ACTIVE,
      priceOverride: null,
      style: { color: null },
    };
  });
};

const createTiers = (tierConfigs, standId) => {
  return tierConfigs.map((config, level) => {
    const tierId = uid('tier');
    return {
      id: tierId,
      standId,
      name: config.name,
      code: config.name.split(' ').map(w => w[0]).join(''),
      level,
      geometry: {
        radiusOffset: level * 50,
        thickness: config.thickness || 40,
        elevation: level * 5,
      },
      sections: createSections(
        config.sectionCount,
        config.rowsPerSection,
        config.seatsPerRow,
        tierId,
        standId,
        config.sectionPrefix
      ),
      status: TierStatus.ACTIVE,
      basePrice: config.price,
      style: { color: config.color },
    };
  });
};

// ============================================
// NARENDRA MODI STADIUM (Gujarat Titans Style)
// ============================================

export const NARENDRA_MODI_STADIUM = {
  id: 'nms-001',
  name: 'Narendra Modi Stadium',
  code: 'NMS',
  venueId: 'venue-ahmedabad',
  geometry: {
    shape: StadiumShape.OVAL,
    width: 800,
    height: 800,
    rotation: 0,
    field: {
      type: 'cricket',
      radiusPercent: 0.22,
    },
  },
  stands: [
    // North Stand
    {
      id: 'stand-north',
      stadiumId: 'nms-001',
      name: 'North Stand',
      code: 'N',
      order: 0,
      geometry: {
        startAngle: -45,
        endAngle: 45,
        visualWeight: 1.2,
        shape: StandShape.ARC,
      },
      tiers: createTiers([
        { name: 'Premium', sectionCount: 3, rowsPerSection: 4, seatsPerRow: 15, price: 2500, color: '#f59e0b', thickness: 35 },
        { name: 'Lower Tier', sectionCount: 5, rowsPerSection: 6, seatsPerRow: 18, price: 1200, color: '#3b82f6', thickness: 45 },
        { name: 'Upper Tier', sectionCount: 5, rowsPerSection: 8, seatsPerRow: 22, price: 600, color: '#06b6d4', thickness: 50 },
      ], 'stand-north'),
      status: StandStatus.ACTIVE,
      style: { color: '#3b82f6', hoverColor: '#60a5fa' },
    },
    
    // East Stand
    {
      id: 'stand-east',
      stadiumId: 'nms-001',
      name: 'East Stand',
      code: 'E',
      order: 1,
      geometry: {
        startAngle: 45,
        endAngle: 135,
        visualWeight: 1,
        shape: StandShape.ARC,
      },
      tiers: createTiers([
        { name: 'Premium', sectionCount: 2, rowsPerSection: 4, seatsPerRow: 12, price: 2500, color: '#f59e0b', thickness: 35 },
        { name: 'Lower Tier', sectionCount: 4, rowsPerSection: 6, seatsPerRow: 16, price: 1200, color: '#3b82f6', thickness: 45 },
        { name: 'Upper Tier', sectionCount: 4, rowsPerSection: 8, seatsPerRow: 20, price: 600, color: '#06b6d4', thickness: 50 },
      ], 'stand-east'),
      status: StandStatus.ACTIVE,
      style: { color: '#ec4899', hoverColor: '#f472b6' },
    },
    
    // South Stand
    {
      id: 'stand-south',
      stadiumId: 'nms-001',
      name: 'South Stand',
      code: 'S',
      order: 2,
      geometry: {
        startAngle: 135,
        endAngle: 225,
        visualWeight: 1.2,
        shape: StandShape.ARC,
      },
      tiers: createTiers([
        { name: 'Pavilion', sectionCount: 2, rowsPerSection: 3, seatsPerRow: 10, price: 5000, color: '#8b5cf6', thickness: 30 },
        { name: 'Premium', sectionCount: 3, rowsPerSection: 4, seatsPerRow: 14, price: 2500, color: '#f59e0b', thickness: 35 },
        { name: 'Lower Tier', sectionCount: 5, rowsPerSection: 6, seatsPerRow: 18, price: 1200, color: '#3b82f6', thickness: 45 },
        { name: 'Upper Tier', sectionCount: 5, rowsPerSection: 8, seatsPerRow: 22, price: 600, color: '#06b6d4', thickness: 50 },
      ], 'stand-south'),
      status: StandStatus.ACTIVE,
      style: { color: '#14b8a6', hoverColor: '#2dd4bf' },
    },
    
    // West Stand (Pavilion End)
    {
      id: 'stand-west',
      stadiumId: 'nms-001',
      name: 'West Stand',
      code: 'W',
      order: 3,
      geometry: {
        startAngle: 225,
        endAngle: 315,
        visualWeight: 1,
        shape: StandShape.ARC,
      },
      tiers: createTiers([
        { name: 'VIP Box', sectionCount: 2, rowsPerSection: 2, seatsPerRow: 8, price: 10000, color: '#dc2626', thickness: 25 },
        { name: 'Premium', sectionCount: 2, rowsPerSection: 4, seatsPerRow: 12, price: 2500, color: '#f59e0b', thickness: 35 },
        { name: 'Lower Tier', sectionCount: 4, rowsPerSection: 6, seatsPerRow: 16, price: 1200, color: '#3b82f6', thickness: 45 },
        { name: 'Upper Tier', sectionCount: 4, rowsPerSection: 8, seatsPerRow: 20, price: 600, color: '#06b6d4', thickness: 50 },
      ], 'stand-west'),
      status: StandStatus.ACTIVE,
      style: { color: '#f59e0b', hoverColor: '#fbbf24' },
    },
  ],
  capacity: 0, // Calculated
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    city: 'Ahmedabad',
    country: 'India',
  },
};

// ============================================
// SIMPLE STADIUM (4 Stands, 2 Tiers each)
// ============================================

export const SIMPLE_STADIUM = {
  id: 'simple-001',
  name: 'City Cricket Ground',
  code: 'CCG',
  venueId: 'venue-city',
  geometry: {
    shape: StadiumShape.OVAL,
    width: 700,
    height: 700,
    rotation: 0,
    field: {
      type: 'cricket',
      radiusPercent: 0.28,
    },
  },
  stands: [
    {
      id: 'simple-north',
      stadiumId: 'simple-001',
      name: 'North Stand',
      code: 'N',
      order: 0,
      geometry: { startAngle: -45, endAngle: 45, visualWeight: 1, shape: StandShape.ARC },
      tiers: createTiers([
        { name: 'Lower', sectionCount: 3, rowsPerSection: 5, seatsPerRow: 15, price: 500, color: '#3b82f6' },
        { name: 'Upper', sectionCount: 3, rowsPerSection: 6, seatsPerRow: 18, price: 300, color: '#06b6d4' },
      ], 'simple-north'),
      status: StandStatus.ACTIVE,
      style: { color: '#3b82f6' },
    },
    {
      id: 'simple-east',
      stadiumId: 'simple-001',
      name: 'East Stand',
      code: 'E',
      order: 1,
      geometry: { startAngle: 45, endAngle: 135, visualWeight: 1, shape: StandShape.ARC },
      tiers: createTiers([
        { name: 'Lower', sectionCount: 2, rowsPerSection: 5, seatsPerRow: 12, price: 500, color: '#3b82f6' },
        { name: 'Upper', sectionCount: 2, rowsPerSection: 6, seatsPerRow: 15, price: 300, color: '#06b6d4' },
      ], 'simple-east'),
      status: StandStatus.ACTIVE,
      style: { color: '#ec4899' },
    },
    {
      id: 'simple-south',
      stadiumId: 'simple-001',
      name: 'South Stand',
      code: 'S',
      order: 2,
      geometry: { startAngle: 135, endAngle: 225, visualWeight: 1, shape: StandShape.ARC },
      tiers: createTiers([
        { name: 'Lower', sectionCount: 3, rowsPerSection: 5, seatsPerRow: 15, price: 500, color: '#3b82f6' },
        { name: 'Upper', sectionCount: 3, rowsPerSection: 6, seatsPerRow: 18, price: 300, color: '#06b6d4' },
      ], 'simple-south'),
      status: StandStatus.ACTIVE,
      style: { color: '#14b8a6' },
    },
    {
      id: 'simple-west',
      stadiumId: 'simple-001',
      name: 'West Stand',
      code: 'W',
      order: 3,
      geometry: { startAngle: 225, endAngle: 315, visualWeight: 1, shape: StandShape.ARC },
      tiers: createTiers([
        { name: 'VIP', sectionCount: 1, rowsPerSection: 3, seatsPerRow: 10, price: 2000, color: '#f59e0b' },
        { name: 'Lower', sectionCount: 2, rowsPerSection: 5, seatsPerRow: 12, price: 500, color: '#3b82f6' },
        { name: 'Upper', sectionCount: 2, rowsPerSection: 6, seatsPerRow: 15, price: 300, color: '#06b6d4' },
      ], 'simple-west'),
      status: StandStatus.ACTIVE,
      style: { color: '#f59e0b' },
    },
  ],
  capacity: 0,
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

// ============================================
// CALCULATE CAPACITY
// ============================================

const calculateCapacity = (stadium) => {
  let total = 0;
  for (const stand of stadium.stands) {
    for (const tier of stand.tiers) {
      for (const section of tier.sections) {
        for (const row of section.rows) {
          total += row.seatCount || row.seats?.length || 0;
        }
      }
    }
  }
  return total;
};

// Set capacities
NARENDRA_MODI_STADIUM.capacity = calculateCapacity(NARENDRA_MODI_STADIUM);
SIMPLE_STADIUM.capacity = calculateCapacity(SIMPLE_STADIUM);

// ============================================
// EXPORTS
// ============================================

export const SAMPLE_STADIUMS = {
  'nms-001': NARENDRA_MODI_STADIUM,
  'simple-001': SIMPLE_STADIUM,
};

export const getStadiumById = (id) => SAMPLE_STADIUMS[id] || null;

export const getAllStadiums = () => Object.values(SAMPLE_STADIUMS);


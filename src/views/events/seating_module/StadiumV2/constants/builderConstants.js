import { DEFAULT_STADIUM_LAYOUT } from '../../../../../utils/consts.jsx';

export const STAND_COLORS = [
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#22c55e',
  '#06b6d4',
  '#f97316',
  '#6366f1',
];

export const TIER_COLORS = [
  '#dc2626',
  '#f59e0b',
  '#3b82f6',
  '#06b6d4',
  '#8b5cf6',
  '#22c55e',
];

export const DEFAULT_STADIUM_TEMPLATE = DEFAULT_STADIUM_LAYOUT;

export const DEFAULT_BLUEPRINT = {
  stand: {
    name: 'Stand',
    codePrefix: 'S',
    geometry: {
      startAngle: 0,
      endAngle: 0,
      visualWeight: 1,
      shape: 'arc',
    },
    status: 'active',
  },
  tier: {
    name: 'Lower Bowl',
    code: 'T1',
    geometry: { radiusOffset: 0, thickness: 40, elevation: 0 },
    basePrice: 750,
    status: 'active',
  },
  section: {
    name: 'Section 1',
    code: 'SEC1',
    geometry: { startAngle: 0, endAngle: 0, curve: 0 },
    status: 'active',
  },
  row: {
    label: 'A',
    seatCount: 24,
    geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
    status: 'active',
    priceOverride: null,
  },
};

/**
 * Utility map to keep builder labels consistent.
 */
export const BUILDER_STEPS = [
  { key: 'stands', title: 'Stands', hint: 'Place arena slices' },
  { key: 'tiers', title: 'Tiers', hint: 'Add vertical levels' },
  { key: 'sections', title: 'Sections', hint: 'Split tiers into blocks' },
  { key: 'rows', title: 'Rows', hint: 'Define seat batches' },
];


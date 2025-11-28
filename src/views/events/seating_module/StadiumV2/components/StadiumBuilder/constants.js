// Generate unique ID
export const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

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

export const STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
};

export const cascadeRowStatus = (row, status) => ({
  ...row,
  status,
  seats: row.seats?.map(seat => ({ ...seat, status })) || row.seats,
});

export const cascadeSectionStatus = (section, status) => ({
  ...section,
  status,
  rows: section.rows?.map(row => cascadeRowStatus(row, status)) || [],
});

export const cascadeTierStatus = (tier, status) => ({
  ...tier,
  status,
  sections: tier.sections?.map(section => cascadeSectionStatus(section, status)) || [],
});

export const cascadeStandStatus = (stand, status) => ({
  ...stand,
  status,
  tiers: stand.tiers?.map(tier => cascadeTierStatus(tier, status)) || [],
});


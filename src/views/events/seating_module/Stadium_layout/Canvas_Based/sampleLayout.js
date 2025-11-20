const createSections = (prefix, count) =>
  Array.from({ length: count }, (_, idx) => ({
    id: `${prefix}-S${idx + 1}`,
    name: `${idx + 1}`,
    rows: [],
  }));

const createStand = (name, lowerCount, upperCount, visualWeight = 1) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  visualWeight,
  tiers: [
    {
      id: `${name}-lower`,
      name: 'Lower',
      sections: createSections(`${name}-L`, lowerCount),
    },
    {
      id: `${name}-upper`,
      name: 'Upper',
      sections: createSections(`${name}-U`, upperCount),
    },
  ],
});

export const SAMPLE_STADIUM_LAYOUT = [
  createStand('BLOCK J', 7, 7, 1.5),
  createStand('BLOCK K', 7, 7, 1),
  createStand('BLOCK L', 5, 5, 1),
  createStand('BLOCK M', 5, 5, 1),

];

export const DEFAULT_SPECIAL_ZONES = [
  {
    id: 'south-west-premium',
    label: 'South Premium West',
    color: 'rgba(142, 68, 173, 0.35)',
  },
  {
    id: 'south-premium-centre',
    label: 'South Premium Centre',
    color: 'rgba(243, 156, 18, 0.38)',
  },
  {
    id: 'south-premium-east',
    label: 'South Premium East',
    color: 'rgba(26, 188, 156, 0.38)',
  },
  {
    id: 'president-gallery',
    label: 'President Gallery',
    color: 'rgba(236, 240, 241, 0.08)',
  },
  {
    id: 'presidential-suites',
    label: 'Presidential Suites 4th Floor',
    color: 'rgba(241, 196, 15, 0.07)',
  },
  {
    id: 'premium-suites',
    label: 'Premium Suites 5th Floor',
    color: 'rgba(155, 89, 182, 0.08)',
  },
];

export default SAMPLE_STADIUM_LAYOUT;


import { useState, useMemo, useCallback, useEffect } from 'react';
import { BUILDER_STEPS, DEFAULT_BLUEPRINT, STAND_COLORS, TIER_COLORS } from '../constants/builderConstants';

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

const cloneBlueprint = (type) => JSON.parse(JSON.stringify(DEFAULT_BLUEPRINT[type]));

const getStandColor = (index) => STAND_COLORS[index % STAND_COLORS.length];
const getTierColor = (level) => TIER_COLORS[level % TIER_COLORS.length];

const buildQuickStand = (stadium, index) => {
  const standId = uid('stand');
  const tierId = uid('tier');
  const sectionId = uid('section');
  const rowId = uid('row');

  const standBlueprint = cloneBlueprint('stand');
  const tierBlueprint = cloneBlueprint('tier');
  const sectionBlueprint = cloneBlueprint('section');
  const rowBlueprint = cloneBlueprint('row');

  return {
    id: standId,
    stadiumId: stadium.id,
    name: `${standBlueprint.name} ${String.fromCharCode(65 + index)}`,
    code: String.fromCharCode(65 + index),
    order: index,
    geometry: standBlueprint.geometry,
    tiers: [
      {
        ...tierBlueprint,
        id: tierId,
        standId,
        code: 'T1',
        level: 0,
        style: { color: getTierColor(0) },
        sections: [
          {
            ...sectionBlueprint,
            id: sectionId,
            tierId,
            standId,
            order: 0,
            rows: [
              {
                ...rowBlueprint,
                id: rowId,
                sectionId,
                tierId,
                standId,
                seats: [],
              },
            ],
          },
        ],
      },
    ],
    status: 'active',
    style: { color: getStandColor(index) },
  };
};

const useStadiumBuilderState = ({ stadium, onChange }) => {
  const [standFilter, setStandFilter] = useState('');
  const [viewMode, setViewMode] = useState('guided');
  const [selectedStandId, setSelectedStandId] = useState(stadium?.stands?.[0]?.id || null);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  useEffect(() => {
    if (!stadium?.stands?.length) {
      setSelectedStandId(null);
      setSelectedTierId(null);
      setSelectedSectionId(null);
      return;
    }

    const selectedStandExists = stadium.stands.some((stand) => stand.id === selectedStandId);
    if (!selectedStandExists) {
      setSelectedStandId(stadium.stands[0].id);
      setSelectedTierId(stadium.stands[0].tiers?.[0]?.id || null);
      setSelectedSectionId(stadium.stands[0].tiers?.[0]?.sections?.[0]?.id || null);
      return;
    }

    const activeStand = stadium.stands.find((s) => s.id === selectedStandId);
    const selectedTierExists = activeStand?.tiers?.some((tier) => tier.id === selectedTierId);
    if (!selectedTierExists) {
      setSelectedTierId(activeStand?.tiers?.[0]?.id || null);
      setSelectedSectionId(activeStand?.tiers?.[0]?.sections?.[0]?.id || null);
      return;
    }

    const activeTier = activeStand?.tiers?.find((t) => t.id === selectedTierId);
    const selectedSectionExists = activeTier?.sections?.some((section) => section.id === selectedSectionId);
    if (!selectedSectionExists) {
      setSelectedSectionId(activeTier?.sections?.[0]?.id || null);
    }
  }, [stadium, selectedStandId, selectedTierId, selectedSectionId]);

  const stands = stadium?.stands || [];

  const filteredStands = useMemo(() => {
    if (!standFilter.trim()) return stands;
    const keyword = standFilter.toLowerCase();
    return stands.filter(
      (stand) => stand.name?.toLowerCase().includes(keyword) || stand.code?.toLowerCase().includes(keyword)
    );
  }, [stands, standFilter]);

  const stats = useMemo(() => {
    const tiers = stands.reduce((sum, stand) => sum + (stand.tiers?.length || 0), 0);
    const sections = stands.reduce(
      (sum, stand) =>
        sum +
        (stand.tiers?.reduce((tierSum, tier) => tierSum + (tier.sections?.length || 0), 0) || 0),
      0
    );
    const rows = stands.reduce(
      (sum, stand) =>
        sum +
        (stand.tiers?.reduce(
          (tierSum, tier) =>
            tierSum +
            (tier.sections?.reduce((secSum, sec) => secSum + (sec.rows?.length || 0), 0) || 0),
          0
        ) || 0),
      0
    );
    const seats = stands.reduce(
      (sum, stand) =>
        sum +
        (stand.tiers?.reduce(
          (tierSum, tier) =>
            tierSum +
            (tier.sections?.reduce(
              (secSum, sec) =>
                secSum +
                (sec.rows?.reduce((rowSum, row) => rowSum + (row.seatCount || 0), 0) || 0),
              0
            ) || 0),
          0
        ) || 0),
      0
    );
    return { stands: stands.length, tiers, sections, rows, seats };
  }, [stands]);

  const updateStadium = useCallback(
    (updates) => {
      onChange({ ...stadium, ...updates });
    },
    [stadium, onChange]
  );

  const updateStandCollection = useCallback(
    (updater) => {
      updateStadium({ stands: updater(stands) });
    },
    [stands, updateStadium]
  );

  const addStand = useCallback(() => {
    const index = stands.length;
    const anglePerStand = 360 / (index + 1 || 1);
    const standId = uid('stand');
    const newStand = {
      id: standId,
      stadiumId: stadium.id,
      name: `Stand ${String.fromCharCode(65 + index)}`,
      code: String.fromCharCode(65 + index),
      order: index,
      geometry: {
        startAngle: index * anglePerStand,
        endAngle: (index + 1) * anglePerStand - 5,
        visualWeight: 1,
        shape: 'arc',
      },
      tiers: [],
      status: 'active',
      style: { color: getStandColor(index) },
    };
    updateStandCollection((prev) => [...prev, newStand]);
    setSelectedStandId(standId);
  }, [stands.length, stadium.id, updateStandCollection]);

  const quickAddStand = useCallback(() => {
    const index = stands.length;
    const stand = buildQuickStand(stadium, index);
    updateStandCollection((prev) => [...prev, stand]);
    setSelectedStandId(stand.id);
    setSelectedTierId(stand.tiers[0].id);
    setSelectedSectionId(stand.tiers[0].sections[0].id);
  }, [stands.length, stadium, updateStandCollection]);

  const updateStand = useCallback(
    (standId, updates) => {
      updateStandCollection((prev) => prev.map((stand) => (stand.id === standId ? { ...stand, ...updates } : stand)));
    },
    [updateStandCollection]
  );

  const deleteStand = useCallback(
    (standId) => {
      updateStandCollection((prev) => prev.filter((stand) => stand.id !== standId));
      if (selectedStandId === standId) {
        setSelectedStandId(stands[0]?.id || null);
      }
    },
    [updateStandCollection, selectedStandId, stands]
  );

  const addTier = useCallback(
    (standId) => {
      const stand = stands.find((s) => s.id === standId);
      const level = stand?.tiers?.length || 0;
      const tierId = uid('tier');
      const tier = {
        id: tierId,
        standId,
        name: level === 0 ? 'Lower Tier' : level === 1 ? 'Upper Tier' : `Tier ${level + 1}`,
        code: `T${level + 1}`,
        level,
        geometry: { radiusOffset: level * 50, thickness: 40, elevation: level * 5 },
        sections: [],
        status: 'active',
        basePrice: 500 + level * 300,
        style: { color: getTierColor(level) },
      };
      updateStand(standId, { tiers: [...(stand?.tiers || []), tier] });
      setSelectedTierId(tierId);
      setSelectedSectionId(null);
    },
    [stands, updateStand]
  );

  const updateTier = useCallback(
    (standId, tierId, updates) => {
      updateStandCollection((prev) =>
        prev.map((stand) =>
          stand.id === standId
            ? {
                ...stand,
                tiers: stand.tiers.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier)),
              }
            : stand
        )
      );
    },
    [updateStandCollection]
  );

  const deleteTier = useCallback(
    (standId, tierId) => {
      updateStandCollection((prev) =>
        prev.map((stand) =>
          stand.id === standId ? { ...stand, tiers: stand.tiers.filter((tier) => tier.id !== tierId) } : stand
        )
      );
      if (selectedTierId === tierId) {
        setSelectedTierId(null);
        setSelectedSectionId(null);
      }
    },
    [updateStandCollection, selectedTierId]
  );

  const addSection = useCallback(
    (standId, tierId) => {
      const stand = stands.find((s) => s.id === standId);
      const tier = stand?.tiers.find((t) => t.id === tierId);
      const order = tier?.sections?.length || 0;
      const sectionId = uid('section');
      const section = {
        id: sectionId,
        tierId,
        standId,
        name: `Section ${order + 1}`,
        code: `S${order + 1}`,
        order,
        geometry: { startAngle: 0, endAngle: 0, curve: 0 },
        rows: [],
        status: 'active',
        priceOverride: null,
        style: { color: null },
      };
      updateTier(standId, tierId, { sections: [...(tier?.sections || []), section] });
      setSelectedSectionId(sectionId);
    },
    [stands, updateTier]
  );

  const updateSection = useCallback(
    (standId, tierId, sectionId, updates) => {
      updateStandCollection((prev) =>
        prev.map((stand) =>
          stand.id === standId
            ? {
                ...stand,
                tiers: stand.tiers.map((tier) =>
                  tier.id === tierId
                    ? {
                        ...tier,
                        sections: tier.sections.map((section) =>
                          section.id === sectionId ? { ...section, ...updates } : section
                        ),
                      }
                    : tier
                ),
              }
            : stand
        )
      );
    },
    [updateStandCollection]
  );

  const deleteSection = useCallback(
    (standId, tierId, sectionId) => {
      updateStandCollection((prev) =>
        prev.map((stand) =>
          stand.id === standId
            ? {
                ...stand,
                tiers: stand.tiers.map((tier) =>
                  tier.id === tierId ? { ...tier, sections: tier.sections.filter((sec) => sec.id !== sectionId) } : tier
                ),
              }
            : stand
        )
      );
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
    },
    [updateStandCollection, selectedSectionId]
  );

  const addRow = useCallback(
    (standId, tierId, sectionId) => {
      const stand = stands.find((s) => s.id === standId);
      const tier = stand?.tiers.find((t) => t.id === tierId);
      const section = tier?.sections.find((sec) => sec.id === sectionId);
      const order = section?.rows?.length || 0;
      const rowId = uid('row');
      const row = {
        id: rowId,
        sectionId,
        tierId,
        standId,
        label: String.fromCharCode(65 + order),
        order,
        geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
        seats: [],
        seatCount: 20,
        status: 'active',
        priceOverride: null,
      };
      updateSection(standId, tierId, sectionId, { rows: [...(section?.rows || []), row] });
    },
    [stands, updateSection]
  );

  const updateRow = useCallback(
    (standId, tierId, sectionId, rowId, updates) => {
      updateStandCollection((prev) =>
        prev.map((stand) =>
          stand.id === standId
            ? {
                ...stand,
                tiers: stand.tiers.map((tier) =>
                  tier.id === tierId
                    ? {
                        ...tier,
                        sections: tier.sections.map((section) =>
                          section.id === sectionId
                            ? {
                                ...section,
                                rows: section.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
                              }
                            : section
                        ),
                      }
                    : tier
                ),
              }
            : stand
        )
      );
    },
    [updateStandCollection]
  );

  const deleteRow = useCallback(
    (standId, tierId, sectionId, rowId) => {
      updateStandCollection((prev) =>
        prev.map((stand) =>
          stand.id === standId
            ? {
                ...stand,
                tiers: stand.tiers.map((tier) =>
                  tier.id === tierId
                    ? {
                        ...tier,
                        sections: tier.sections.map((section) =>
                          section.id === sectionId ? { ...section, rows: section.rows.filter((row) => row.id !== rowId) } : section
                        ),
                      }
                    : tier
                ),
              }
            : stand
        )
      );
    },
    [updateStandCollection]
  );

  const selectedStand = stands.find((stand) => stand.id === selectedStandId) || null;
  const selectedTier = selectedStand?.tiers?.find((tier) => tier.id === selectedTierId) || null;
  const selectedSection =
    selectedTier?.sections?.find((section) => section.id === selectedSectionId) || null;

  return {
    stats,
    standFilter,
    setStandFilter,
    viewMode,
    setViewMode,
    filteredStands,
    selectedStandId,
    selectedTierId,
    selectedSectionId,
    setSelectedStandId,
    setSelectedTierId,
    setSelectedSectionId,
    selectedStand,
    selectedTier,
    selectedSection,
    addStand,
    quickAddStand,
    addTier,
    addSection,
    addRow,
    updateStand,
    deleteStand,
    updateTier,
    deleteTier,
    updateSection,
    deleteSection,
    updateRow,
    deleteRow,
    steps: BUILDER_STEPS,
  };
};

export default useStadiumBuilderState;


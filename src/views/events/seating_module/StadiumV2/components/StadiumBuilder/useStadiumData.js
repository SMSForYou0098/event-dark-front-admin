/**
 * useStadiumData - Custom hook for stadium data management
 * Handles all CRUD operations for stands, tiers, sections, and rows
 */

import { useCallback } from 'react';
import { message } from 'antd';
import { uid, STAND_COLORS, TIER_COLORS } from './constants';

export const useStadiumData = (stadium, onChange, selectedStand, setSelectedStand, selectedTier, setSelectedTier, selectedSection, setSelectedSection, selectedRow, setSelectedRow, setNavLevel) => {
  
  // ============================================
  // STADIUM UPDATE HELPERS
  // ============================================
  const updateStadium = useCallback((updates) => {
    onChange({ ...stadium, ...updates });
  }, [stadium, onChange]);

  // ============================================
  // CREATE DEFAULT STAND STRUCTURE
  // ============================================
  const createDefaultStandStructure = useCallback((standId, tierCount = 2, sectionsPerTier = 8, rowsPerSection = 15) => {
    const tiers = [];

    for (let tierLevel = 0; tierLevel < tierCount; tierLevel++) {
      const tierId = uid('tier');
      const sections = [];

      for (let sectionOrder = 0; sectionOrder < sectionsPerTier; sectionOrder++) {
        const sectionId = uid('section');
        const rows = [];

        for (let rowOrder = 0; rowOrder < rowsPerSection; rowOrder++) {
          rows.push({
            id: uid('row'),
            sectionId,
            tierId,
            standId,
            label: String.fromCharCode(65 + rowOrder),
            order: rowOrder,
            geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
            seats: [],
            seatCount: 20 + rowOrder,
            status: 'active',
            priceOverride: null,
          });
        }

        sections.push({
          id: sectionId,
          tierId,
          standId,
          name: `Section ${sectionOrder + 1}`,
          code: `S${sectionOrder + 1}`,
          order: sectionOrder,
          geometry: { startAngle: 0, endAngle: 0, curve: 0 },
          rows,
          status: 'active',
          priceOverride: null,
          style: { color: null },
        });
      }

      tiers.push({
        id: tierId,
        standId,
        name: tierLevel === 0 ? 'Lower Tier' : 'Upper Tier',
        code: `T${tierLevel + 1}`,
        level: tierLevel,
        geometry: { radiusOffset: tierLevel * 50, thickness: 40, elevation: tierLevel * 5 },
        sections,
        status: 'active',
        basePrice: 500 + (tierLevel * 300),
        style: { color: TIER_COLORS[tierLevel % TIER_COLORS.length] },
      });
    }

    return tiers;
  }, []);

  // ============================================
  // STAND HANDLERS
  // ============================================
  const addStand = useCallback(() => {
    const stands = stadium?.stands || [];
    const index = stands.length;
    const totalStands = index + 1;
    const anglePerStand = 360 / totalStands;
    const gap = 2;
    const standId = uid('stand');

    const tiers = createDefaultStandStructure(standId);

    const newStand = {
      id: standId,
      stadiumId: stadium.id,
      name: `Stand ${String.fromCharCode(65 + index)}`,
      code: String.fromCharCode(65 + index),
      order: index,
      geometry: {
        startAngle: index * anglePerStand,
        endAngle: (index + 1) * anglePerStand - gap,
        visualWeight: 1,
        shape: 'arc',
      },
      tiers,
      status: 'active',
      style: { color: STAND_COLORS[index % STAND_COLORS.length] },
    };

    // Redistribute all stands
    const allStands = [...stands, newStand];
    const redistributedStands = allStands.map((stand, idx) => ({
      ...stand,
      order: idx,
      geometry: {
        ...stand.geometry,
        startAngle: idx * (360 / totalStands),
        endAngle: (idx + 1) * (360 / totalStands) - gap,
      },
    }));

    updateStadium({ stands: redistributedStands });
    message.success('Stand added');
  }, [stadium, updateStadium, createDefaultStandStructure]);

  const updateStand = useCallback((standId, updates) => {
    updateStadium({
      stands: stadium.stands.map(s =>
        s.id === standId ? { ...s, ...updates } : s
      ),
    });
    // Update selected stand if it's the one being updated
    if (selectedStand?.id === standId) {
      setSelectedStand(prev => ({ ...prev, ...updates }));
    }
  }, [stadium, updateStadium, selectedStand, setSelectedStand]);

  const deleteStand = useCallback((standId) => {
    const newStands = stadium.stands.filter(s => s.id !== standId);

    // Redistribute remaining stands
    const totalStands = newStands.length || 1;
    const anglePerStand = 360 / totalStands;
    const gap = 2;

    const redistributedStands = newStands.map((stand, idx) => ({
      ...stand,
      order: idx,
      geometry: {
        ...stand.geometry,
        startAngle: idx * anglePerStand,
        endAngle: (idx + 1) * anglePerStand - gap,
      },
    }));

    updateStadium({ stands: redistributedStands });

    // If deleted stand was selected, go back
    if (selectedStand?.id === standId) {
      setNavLevel('stands');
      setSelectedStand(null);
    }
    message.success('Stand deleted');
  }, [stadium, updateStadium, selectedStand, setSelectedStand, setNavLevel]);

  const redistributeStands = useCallback(() => {
    const stands = stadium.stands || [];
    if (stands.length === 0) return;

    const totalStands = stands.length;
    const anglePerStand = 360 / totalStands;
    const gap = 2;

    const redistributedStands = stands.map((stand, index) => ({
      ...stand,
      order: index,
      geometry: {
        ...stand.geometry,
        startAngle: index * anglePerStand,
        endAngle: (index + 1) * anglePerStand - gap,
      },
    }));

    updateStadium({ stands: redistributedStands });
    message.success('Stands redistributed evenly');
  }, [stadium, updateStadium]);

  // ============================================
  // TIER HANDLERS
  // ============================================
  const addTier = useCallback(() => {
    if (!selectedStand) return;

    const level = selectedStand.tiers?.length || 0;
    const tierId = uid('tier');

    // Create sections for new tier
    const sections = [];
    for (let i = 0; i < 8; i++) {
      const sectionId = uid('section');
      const rows = [];
      for (let j = 0; j < 15; j++) {
        rows.push({
          id: uid('row'),
          sectionId,
          tierId,
          standId: selectedStand.id,
          label: String.fromCharCode(65 + j),
          order: j,
          geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
          seats: [],
          seatCount: 20 + j,
          status: 'active',
        });
      }
      sections.push({
        id: sectionId,
        tierId,
        standId: selectedStand.id,
        name: `Section ${i + 1}`,
        code: `S${i + 1}`,
        order: i,
        rows,
        status: 'active',
      });
    }

    const newTier = {
      id: tierId,
      standId: selectedStand.id,
      name: level === 0 ? 'Lower Tier' : level === 1 ? 'Upper Tier' : `Tier ${level + 1}`,
      code: `T${level + 1}`,
      level,
      geometry: { radiusOffset: level * 50, thickness: 40, elevation: level * 5 },
      sections,
      status: 'active',
      basePrice: 500 + (level * 300),
      style: { color: TIER_COLORS[level % TIER_COLORS.length] },
    };

    const updatedStand = {
      ...selectedStand,
      tiers: [...(selectedStand.tiers || []), newTier],
    };

    updateStand(selectedStand.id, { tiers: updatedStand.tiers });
    setSelectedStand(updatedStand);
    message.success('Tier added');
  }, [selectedStand, updateStand, setSelectedStand]);

  const updateTier = useCallback((tierId, updates) => {
    if (!selectedStand) return;

    const updatedTiers = selectedStand.tiers.map(t =>
      t.id === tierId ? { ...t, ...updates } : t
    );

    updateStand(selectedStand.id, { tiers: updatedTiers });

    const updatedStand = { ...selectedStand, tiers: updatedTiers };
    setSelectedStand(updatedStand);

    if (selectedTier?.id === tierId) {
      setSelectedTier(prev => ({ ...prev, ...updates }));
    }
  }, [selectedStand, selectedTier, updateStand, setSelectedStand, setSelectedTier]);

  const deleteTier = useCallback((tierId) => {
    if (!selectedStand) return;

    const updatedTiers = selectedStand.tiers.filter(t => t.id !== tierId);
    updateStand(selectedStand.id, { tiers: updatedTiers });

    setSelectedStand(prev => ({ ...prev, tiers: updatedTiers }));

    if (selectedTier?.id === tierId) {
      setNavLevel('tiers');
      setSelectedTier(null);
    }
    message.success('Tier deleted');
  }, [selectedStand, selectedTier, updateStand, setSelectedStand, setSelectedTier, setNavLevel]);

  // ============================================
  // SECTION HANDLERS
  // ============================================
  const addSection = useCallback(() => {
    if (!selectedStand || !selectedTier) return;

    const order = selectedTier.sections?.length || 0;
    const sectionId = uid('section');

    // Create rows for new section
    const rows = [];
    for (let j = 0; j < 15; j++) {
      rows.push({
        id: uid('row'),
        sectionId,
        tierId: selectedTier.id,
        standId: selectedStand.id,
        label: String.fromCharCode(65 + j),
        order: j,
        geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
        seats: [],
        seatCount: 20 + j,
        status: 'active',
      });
    }

    const newSection = {
      id: sectionId,
      tierId: selectedTier.id,
      standId: selectedStand.id,
      name: `Section ${order + 1}`,
      code: `S${order + 1}`,
      order,
      rows,
      status: 'active',
    };

    const updatedSections = [...(selectedTier.sections || []), newSection];
    updateTier(selectedTier.id, { sections: updatedSections });
    setSelectedTier(prev => ({ ...prev, sections: updatedSections }));
    message.success('Section added');
  }, [selectedStand, selectedTier, updateTier, setSelectedTier]);

  const updateSection = useCallback((sectionId, updates) => {
    if (!selectedTier) return;

    const updatedSections = selectedTier.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    );

    updateTier(selectedTier.id, { sections: updatedSections });
    setSelectedTier(prev => ({ ...prev, sections: updatedSections }));

    if (selectedSection?.id === sectionId) {
      setSelectedSection(prev => ({ ...prev, ...updates }));
    }
  }, [selectedTier, selectedSection, updateTier, setSelectedTier, setSelectedSection]);

  const deleteSection = useCallback((sectionId) => {
    if (!selectedTier) return;

    const updatedSections = selectedTier.sections.filter(s => s.id !== sectionId);
    updateTier(selectedTier.id, { sections: updatedSections });
    setSelectedTier(prev => ({ ...prev, sections: updatedSections }));

    if (selectedSection?.id === sectionId) {
      setNavLevel('sections');
      setSelectedSection(null);
    }
    message.success('Section deleted');
  }, [selectedTier, selectedSection, updateTier, setSelectedTier, setSelectedSection, setNavLevel]);

  // ============================================
  // ROW HANDLERS
  // ============================================
  const addRow = useCallback(() => {
    if (!selectedSection) return;

    const order = selectedSection.rows?.length || 0;

    const newRow = {
      id: uid('row'),
      sectionId: selectedSection.id,
      tierId: selectedTier?.id,
      standId: selectedStand?.id,
      label: String.fromCharCode(65 + order),
      order,
      geometry: { curve: 3, spacing: 2, offsetX: 0, offsetY: 0 },
      seats: [],
      seatCount: 20,
      status: 'active',
    };

    const updatedRows = [...(selectedSection.rows || []), newRow];
    updateSection(selectedSection.id, { rows: updatedRows });
    setSelectedSection(prev => ({ ...prev, rows: updatedRows }));
    message.success('Row added');
  }, [selectedStand, selectedTier, selectedSection, updateSection, setSelectedSection]);

  const updateRow = useCallback((rowId, updates) => {
    if (!selectedSection) return;

    const updatedRows = selectedSection.rows.map(r =>
      r.id === rowId ? { ...r, ...updates } : r
    );

    updateSection(selectedSection.id, { rows: updatedRows });
    setSelectedSection(prev => ({ ...prev, rows: updatedRows }));

    if (selectedRow?.id === rowId) {
      setSelectedRow(prev => ({ ...prev, ...updates }));
    }
  }, [selectedSection, selectedRow, updateSection, setSelectedSection, setSelectedRow]);

  const deleteRow = useCallback((rowId) => {
    if (!selectedSection) return;

    const updatedRows = selectedSection.rows.filter(r => r.id !== rowId);
    updateSection(selectedSection.id, { rows: updatedRows });
    setSelectedSection(prev => ({ ...prev, rows: updatedRows }));

    if (selectedRow?.id === rowId) {
      setNavLevel('rows');
      setSelectedRow(null);
    }
    message.success('Row deleted');
  }, [selectedSection, selectedRow, updateSection, setSelectedSection, setSelectedRow, setNavLevel]);

  return {
    updateStadium,
    // Stand operations
    addStand,
    updateStand,
    deleteStand,
    redistributeStands,
    // Tier operations
    addTier,
    updateTier,
    deleteTier,
    // Section operations
    addSection,
    updateSection,
    deleteSection,
    // Row operations
    addRow,
    updateRow,
    deleteRow,
  };
};

export default useStadiumData;

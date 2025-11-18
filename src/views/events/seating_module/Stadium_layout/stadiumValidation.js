export const validateStadiumConfig = (config) => {
  if (!config.stadiumName || !config.stadiumName.trim()) {
    return "Stadium name is required.";
  }
  if (!config.stadiumCapacity || isNaN(config.stadiumCapacity) || Number(config.stadiumCapacity) <= 0) {
    return "Stadium capacity must be a positive number.";
  }
  if (!config.location || !config.location.trim()) {
    return "Location is required.";
  }
  if (!config.stands || !Array.isArray(config.stands) || config.stands.length === 0) {
    return "At least one stand is required.";
  }
  for (let s = 0; s < config.stands.length; s++) {
    const stand = config.stands[s];
    if (!stand.name || !stand.name.trim()) return `Each stand must have a name (error in stand ${s + 1}).`;
    if (!stand.tiers || !Array.isArray(stand.tiers) || stand.tiers.length === 0) {
      return `Stand "${stand.name}" must have at least one tier.`;
    }
    for (let t = 0; t < stand.tiers.length; t++) {
      const tier = stand.tiers[t];
      if (!tier.name || !tier.name.trim()) return `Each tier must have a name (in stand "${stand.name}").`;
      if (!tier.sections || !Array.isArray(tier.sections) || tier.sections.length === 0) {
        return `Tier "${tier.name}" in stand "${stand.name}" must have at least one section.`;
      }
      for (let sc = 0; sc < tier.sections.length; sc++) {
        const section = tier.sections[sc];
        if (!section.name || !section.name.trim()) return `Each section must have a name (in tier "${tier.name}").`;
        if (!section.rows || !Array.isArray(section.rows) || section.rows.length === 0) {
          return `Section "${section.name}" in tier "${tier.name}" must have at least one row.`;
        }
        for (let r = 0; r < section.rows.length; r++) {
          const row = section.rows[r];
          if (!row.label || !row.label.trim()) return `Each row must have a label (error in section "${section.name}").`;
          if (!row.seats || isNaN(row.seats) || Number(row.seats) <= 0) {
            return `Row "${row.label}" in section "${section.name}" must have a positive seat count.`;
          }
        }
      }
    }
  }
  return null;
};


export const getTotalSeats = (config) => {
  let total = 0;
  if(config.stands) {
    for(const stand of config.stands) {
      if(stand.tiers) {
        for(const tier of stand.tiers) {
          if(tier.sections) {
            for(const section of tier.sections) {
              if(section.rows) {
                for(const row of section.rows) {
                  total += Number(row.seats || 0);
                }
              }
            }
          }
        }
      }
    }
  }
  return total;
};

export const LOCATION_TIERS = {
  TIER_1: { name: 'River Panning', color: '#87CEEB', unlockLevel: 0 },
  TIER_1_B: { name: 'Ozark Hills', color: '#228B22', unlockLevel: 1 },
  TIER_1_C: { name: 'Bavarian Fields', color: '#DAA520', unlockLevel: 2 },
  TIER_2_A: { name: 'Ural Shores', color: '#8B4513', unlockLevel: 3 },
  TIER_2_B: { name: 'Bahia Mines', color: '#2F4F4F', unlockLevel: 5 },
  TIER_2_C: { name: 'Montana Streambed', color: '#4682B4', unlockLevel: 7 },
  TIER_3_A: { name: 'Minas Gerais', color: '#9932CC', unlockLevel: 10 },
  TIER_3_B: { name: 'Mogok Valley', color: '#DC143C', unlockLevel: 15 },
  TIER_3_C: { name: 'Sri Lanka Fields', color: '#FF8C00', unlockLevel: 20 },
  TIER_4_A: { name: 'Muzo Highlands', color: '#00FF7F', unlockLevel: 25 },
  TIER_4_B: { name: 'Kashmir Heights', color: '#4169E1', unlockLevel: 30 },
  TIER_4_C: { name: 'Argyle Caverns', color: '#FF1493', unlockLevel: 40 },
  TIER_5_A: { name: 'Golconda Depths', color: '#FFD700', unlockLevel: 50 },
  TIER_5_B: { name: 'Androy Dunes', color: '#9400D3', unlockLevel: 60 },
  TIER_5_C: { name: 'Mogok Hidden', color: '#FF0000', unlockLevel: 75 },
};

export const getLocationForTier = (tierKey) => LOCATION_TIERS[tierKey];
export const getUnlockedLocations = (level) => {
  return Object.entries(LOCATION_TIERS)
    .filter(([_, loc]) => loc.unlockLevel <= level)
    .map(([key, _]) => key);
};

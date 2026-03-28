export const MOHSCALE = {
  talc: 1,
  gypsum: 2,
  calcite: 3,
  fluorite: 4,
  apatite: 5,
  orthoclase: 6,
  quartz: 7,
  topaz: 8,
  corundum: 9,
  diamond: 10
};

export const GEM_TIERS = {
  COMMON: { name: 'Common', color: '#A0A0A0', weight: 60 },
  UNCOMMON: { name: 'Uncommon', color: '#4CAF50', weight: 25 },
  RARE: { name: 'Rare', color: '#2196F3', weight: 10 },
  EPIC: { name: 'Epic', color: '#9C27B0', weight: 4 },
  LEGENDARY: { name: 'Legendary', color: '#FF9800', weight: 1 }
};

export const GAME_CONFIG = {
  GRID_SIZE: 6,
  CELL_SIZE: 64,
  MATCH_MIN: 3,
  CASCADE_DELAY: 300,
  SCORE_POPUP_DURATION: 800
};

export const GAME_PHASES = {
  MENU: 'menu',
  DISCOVER: 'discover',
  PROCESS: 'process',
  CRAFT: 'craft',
  SELL: 'sell',
  MINIGAME: 'minigame'
};

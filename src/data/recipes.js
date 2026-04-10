/**
 * Crafting Recipes Data
 * Contains all jewelry recipes, types, settings, and findings
 */

export const JEWELRY_TYPES = {
  ring: { slots: 1, minMetal: 'copper', multiplier: 2.5, complexity: 'simple' },
  pendant: { slots: 1, minMetal: 'silver', multiplier: 3.0, complexity: 'simple' },
  earrings: { slots: 2, minMetal: 'silver', multiplier: 2.8, complexity: 'medium' },
  bracelet: { slots: 3, minMetal: 'silver', multiplier: 3.5, complexity: 'medium' },
  necklace: { slots: 4, minMetal: 'gold', multiplier: 5.0, complexity: 'complex' },
  crown: { slots: 6, minMetal: 'platinum', multiplier: 8.0, complexity: 'expert' }
};

export const SETTINGS = {
  prong: { name: 'Prong', multiplier: 1.0, description: 'Classic claw setting' },
  bezel: { name: 'Bezel', multiplier: 1.2, description: 'Metal rim around gem' },
  pave: { name: 'Pavé', multiplier: 1.5, description: 'Tiny gems set in metal' },
  channel: { name: 'Channel', multiplier: 1.3, description: 'Gems in metal channel' },
  illusion: { name: 'Illusion', multiplier: 1.4, description: 'Enhanced sparkle' }
};

export const FINDINGS = {
  band: { name: 'Ring Band', value: 5 },
  ear_wires: { name: 'Ear Wires', value: 3 },
  jump_ring: { name: 'Jump Ring', value: 1 },
  chain: { name: 'Necklace Chain', value: 15 },
  bail: { name: 'Bail', value: 5 },
  clasp: { name: 'Bracelet Clasp', value: 10 }
};

export const CRAFT_TIERS = [
  { id: 'apprentice', name: 'Apprentice', xpRequired: 0 },
  { id: 'journeyman', name: 'Journeyman', xpRequired: 500 },
  { id: 'expert', name: 'Expert', xpRequired: 2000 },
  { id: 'master', name: 'Master', xpRequired: 5000 },
  { id: 'legendary', name: 'Legendary', xpRequired: 10000 }
];

export const RECIPES = [
  {
    id: 'simple_copper_ring',
    name: 'Simple Copper Ring',
    type: 'ring',
    design: 'Basic',
    difficulty: 1,
    xpRequired: 0,
    requirements: {
      gems: [{ id: 'clear_quartz', qualityMin: 0 }],
      metal: { id: 'copper', qualityMin: 0 },
      findings: ['band']
    },
    settings: ['prong', 'bezel'],
    baseValue: 50,
    multiplier: 2.5
  },
  {
    id: 'silver_amethyst_pendant',
    name: 'Silver Amethyst Pendant',
    type: 'pendant',
    design: 'Classic',
    difficulty: 2,
    xpRequired: 0,
    requirements: {
      gems: [{ id: 'amethyst', qualityMin: 0 }],
      metal: { id: 'silver', qualityMin: 0 },
      findings: ['bail', 'chain']
    },
    settings: ['prong', 'bezel'],
    baseValue: 200,
    multiplier: 3.0
  },
  {
    id: 'gold_ruby_earrings',
    name: 'Gold Ruby Earrings',
    type: 'earrings',
    design: 'Elegant',
    difficulty: 3,
    xpRequired: 500,
    requirements: {
      gems: [{ id: 'ruby', qualityMin: 50 }, { id: 'ruby', qualityMin: 50 }],
      metal: { id: 'gold', qualityMin: 60 },
      findings: ['ear_wires', 'jump_ring']
    },
    settings: ['prong', 'bezel'],
    baseValue: 800,
    multiplier: 2.8
  },
  {
    id: 'platinum_diamond_bracelet',
    name: 'Platinum Diamond Bracelet',
    type: 'bracelet',
    design: 'Luxury',
    difficulty: 4,
    xpRequired: 2000,
    requirements: {
      gems: [{ id: 'diamond', qualityMin: 70 }, { id: 'diamond', qualityMin: 65 }, { id: 'diamond', qualityMin: 65 }],
      metal: { id: 'platinum', qualityMin: 75 },
      findings: ['clasp', 'jump_ring']
    },
    settings: ['pave', 'channel'],
    baseValue: 5000,
    multiplier: 3.5
  },
  {
    id: 'emerald_gold_necklace',
    name: 'Emerald Gold Necklace',
    type: 'necklace',
    design: 'Royal',
    difficulty: 5,
    xpRequired: 5000,
    requirements: {
      gems: [{ id: 'emerald', qualityMin: 75 }, { id: 'diamond', qualityMin: 60 }, { id: 'diamond', qualityMin: 55 }, { id: 'diamond', qualityMin: 55 }],
      metal: { id: 'gold', qualityMin: 70 },
      findings: ['chain', 'bail']
    },
    settings: ['prong', 'illusion'],
    baseValue: 8000,
    multiplier: 5.0
  }
];

export function getRecipesByType(type) {
  return RECIPES.filter(r => r.type === type);
}

export function getRecipeById(id) {
  return RECIPES.find(r => r.id === id);
}

export function canCraft(recipe, playerXP) {
  return playerXP >= recipe.xpRequired;
}

export function calculateCraftValue(recipe, gems, metal, settings) {
  const gemValue = gems.reduce((sum, gem) => {
    const itemData = getItemById(gem.id || gem.gemId);
    return sum + (itemData?.value || 10) * (gem.quality || 50) / 100;
  }, 0);
  
  const metalValue = (metal.value || 10) * (metal.quality || 50) / 100;
  const settingMultiplier = SETTINGS[settings]?.multiplier || 1.0;
  const jewelryMultiplier = JEWELRY_TYPES[recipe.type]?.multiplier || 1.0;
  
  return Math.round((gemValue + metalValue) * jewelryMultiplier * settingMultiplier * recipe.multiplier);
}

function getItemById(id) {
  // Simple lookup - will be enhanced when items are loaded
  const itemValues = {
    diamond: 5000, ruby: 800, sapphire: 700, emerald: 600,
    amethyst: 20, citrine: 40, tourmaline: 120, peridot: 90,
    clear_quartz: 5, rose_quartz: 8, obsidian: 3, moonstone: 10,
    copper: 5, silver: 25, gold: 100, platinum: 500
  };
  return { value: itemValues[id] || 10 };
}
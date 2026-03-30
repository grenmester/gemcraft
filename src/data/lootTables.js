import { items, itemsById } from '../loaders/items.js';
import { EQUIPMENT } from '../loaders/equipment.js';

// ============================================
// ITEM LOOKUP (replaces gems.json dependency)
// ============================================

export const getItemById = (itemId) => itemsById[itemId];

// ============================================
// EQUIPMENT BONUS CALCULATION
// ============================================

/**
 * Calculate total equipment bonuses from equipped items
 * @param {string[]} equipmentIds - Array of equipment IDs the player has equipped
 * @returns {{ dropRateBonus: number, extraItems: number }}
 */
export const calculateEquipmentBonus = (equipmentIds = []) => {
  let dropRateBonus = 0;
  let extraItems = 0;

  for (const eqId of equipmentIds) {
    const equipment = EQUIPMENT[eqId];
    if (equipment?.effect) {
      dropRateBonus += equipment.effect.dropRateBonus || 0;
      extraItems += equipment.effect.extraItems || 0;
    }
  }

  return { dropRateBonus, extraItems };
};

// ============================================
// RARITY TIER DEFINITIONS
// ============================================

export const RARITY_TIERS = {
  COMMON: { name: 'Common', baseChance: 0.60, color: '#9CA3AF' },
  UNCOMMON: { name: 'Uncommon', baseChance: 0.25, color: '#22C55E' },
  RARE: { name: 'Rare', baseChance: 0.10, color: '#3B82F6' },
  EPIC: { name: 'Epic', baseChance: 0.04, color: '#A855F7' },
  LEGENDARY: { name: 'Legendary', baseChance: 0.01, color: '#F59E0B' },
};

// Reward multipliers by difficulty
export const REWARD_MULTIPLIERS = {
  1: { coins: 1.0, items: 1.0 },
  2: { coins: 1.5, items: 1.5 },
  3: { coins: 2.0, items: 2.0 },
};

// ============================================
// MAIN LOOT TABLES
// ============================================

export const LOOT_TABLES = {
  TIER_1: {
    name: 'River Panning',
    color: '#87CEEB',
    unlockLevel: 0,
    type: 'mixed',
    description: 'Beginner waters with common gems and minerals',
    areas: {
      area_1: {
        name: 'Shallow Waters',
        difficulty: 1,
        items: [
          { id: 'clear_quartz', weight: 45, rarity: 'COMMON' },
          { id: 'amethyst', weight: 25, rarity: 'COMMON' },
          { id: 'calcite', weight: 25, rarity: 'COMMON' },
          { id: 'citrine', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 50, items: 1 },
      },
      area_2: {
        name: 'Pebble Banks',
        difficulty: 1,
        items: [
          { id: 'clear_quartz', weight: 35, rarity: 'COMMON' },
          { id: 'amethyst', weight: 30, rarity: 'COMMON' },
          { id: 'calcite', weight: 25, rarity: 'COMMON' },
          { id: 'rose_quartz', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 60, items: 1 },
      },
      area_3: {
        name: 'Sandy Flats',
        difficulty: 2,
        items: [
          { id: 'amethyst', weight: 35, rarity: 'COMMON' },
          { id: 'calcite', weight: 30, rarity: 'COMMON' },
          { id: 'clear_quartz', weight: 25, rarity: 'COMMON' },
          { id: 'fluorite', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 75, items: 1 },
      },
    },
  },

  TIER_1_B: {
    name: 'Ozark Hills',
    color: '#228B22',
    unlockLevel: 1,
    type: 'mixed',
    description: 'Hilly terrain with varied mineral deposits',
    areas: {
      area_1: {
        name: 'Crystal Creek',
        difficulty: 1,
        items: [
          { id: 'amethyst', weight: 40, rarity: 'COMMON' },
          { id: 'tsavorite', weight: 20, rarity: 'RARE' },
          { id: 'citrine', weight: 20, rarity: 'UNCOMMON' },
          { id: 'rose_quartz', weight: 15, rarity: 'COMMON' },
          { id: 'hematite', weight: 5, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 65, items: 1 },
      },
      area_2: {
        name: 'Rose Valley',
        difficulty: 1,
        items: [
          { id: 'rose_quartz', weight: 35, rarity: 'COMMON' },
          { id: 'amethyst', weight: 30, rarity: 'COMMON' },
          { id: 'citrine', weight: 18, rarity: 'UNCOMMON' },
          { id: 'hematite', weight: 12, rarity: 'COMMON' },
          { id: 'tsavorite', weight: 5, rarity: 'RARE' },
        ],
        baseRewards: { coins: 70, items: 1 },
      },
      area_3: {
        name: 'Golden Ridge',
        difficulty: 2,
        items: [
          { id: 'citrine', weight: 30, rarity: 'UNCOMMON' },
          { id: 'tsavorite', weight: 25, rarity: 'RARE' },
          { id: 'amethyst', weight: 20, rarity: 'COMMON' },
          { id: 'hematite', weight: 15, rarity: 'COMMON' },
          { id: 'rose_quartz', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 85, items: 2 },
      },
    },
  },

  TIER_1_C: {
    name: 'Bavarian Fields',
    color: '#DAA520',
    unlockLevel: 2,
    type: 'mineral',
    description: 'Historic mining fields with volcanic and feldspar minerals',
    areas: {
      area_1: {
        name: 'Misty Meadow',
        difficulty: 1,
        items: [
          { id: 'obsidian', weight: 45, rarity: 'COMMON' },
          { id: 'clear_quartz', weight: 30, rarity: 'COMMON' },
          { id: 'moonstone', weight: 15, rarity: 'COMMON' },
          { id: 'fluorite', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 70, items: 1 },
      },
      area_2: {
        name: 'Stone Valley',
        difficulty: 2,
        items: [
          { id: 'obsidian', weight: 35, rarity: 'COMMON' },
          { id: 'moonstone', weight: 30, rarity: 'COMMON' },
          { id: 'clear_quartz', weight: 20, rarity: 'COMMON' },
          { id: 'labradorite', weight: 15, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 90, items: 1 },
      },
      area_3: {
        name: 'Moonlit Peak',
        difficulty: 2,
        items: [
          { id: 'moonstone', weight: 40, rarity: 'COMMON' },
          { id: 'obsidian', weight: 30, rarity: 'COMMON' },
          { id: 'labradorite', weight: 20, rarity: 'UNCOMMON' },
          { id: 'celestite', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 100, items: 2 },
      },
    },
  },

  TIER_2_A: {
    name: 'Ural Shores',
    color: '#8B4513',
    unlockLevel: 3,
    type: 'gem',
    description: 'Coastal regions with beryl and topaz deposits',
    areas: {
      area_1: {
        name: 'Coastal Drift',
        difficulty: 2,
        items: [
          { id: 'amethyst', weight: 40, rarity: 'COMMON' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
          { id: 'tsavorite', weight: 15, rarity: 'RARE' },
          { id: 'citrine', weight: 15, rarity: 'UNCOMMON' },
          { id: 'peridot', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 120, items: 2 },
      },
      area_2: {
        name: 'Amber Shore',
        difficulty: 2,
        items: [
          { id: 'imperial_topaz', weight: 35, rarity: 'RARE' },
          { id: 'amethyst', weight: 30, rarity: 'COMMON' },
          { id: 'citrine', weight: 20, rarity: 'UNCOMMON' },
          { id: 'tsavorite', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 130, items: 2 },
      },
      area_3: {
        name: 'Topaz Cove',
        difficulty: 3,
        items: [
          { id: 'imperial_topaz', weight: 45, rarity: 'RARE' },
          { id: 'citrine', weight: 25, rarity: 'UNCOMMON' },
          { id: 'amethyst', weight: 15, rarity: 'COMMON' },
          { id: 'tsavorite', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 150, items: 2 },
      },
    },
  },

  TIER_2_B: {
    name: 'Bahia Mines',
    color: '#2F4F4F',
    unlockLevel: 5,
    type: 'gem',
    description: 'Deep mines with rare tourmaline and beryl',
    areas: {
      area_1: {
        name: 'Tourmaline Depths',
        difficulty: 2,
        items: [
          { id: 'tourmaline', weight: 40, rarity: 'UNCOMMON' },
          { id: 'aquamarine', weight: 30, rarity: 'UNCOMMON' },
          { id: 'parba_tourmaline', weight: 20, rarity: 'EPIC' },
          { id: 'peridot', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 160, items: 2 },
      },
      area_2: {
        name: 'Beryl Veins',
        difficulty: 2,
        items: [
          { id: 'aquamarine', weight: 40, rarity: 'UNCOMMON' },
          { id: 'parba_tourmaline', weight: 25, rarity: 'EPIC' },
          { id: 'tourmaline', weight: 25, rarity: 'UNCOMMON' },
          { id: 'peridot', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 175, items: 2 },
      },
      area_3: {
        name: 'Bahia Deep',
        difficulty: 3,
        items: [
          { id: 'aquamarine', weight: 35, rarity: 'UNCOMMON' },
          { id: 'tourmaline', weight: 30, rarity: 'UNCOMMON' },
          { id: 'parba_tourmaline', weight: 25, rarity: 'EPIC' },
          { id: 'peridot', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 200, items: 3 },
      },
    },
  },

  TIER_2_C: {
    name: 'Montana Streambed',
    color: '#4682B4',
    unlockLevel: 7,
    type: 'mixed',
    description: 'Mountain streams with corundum deposits and pyrite',
    areas: {
      area_1: {
        name: 'Sapphire Falls',
        difficulty: 2,
        items: [
          { id: 'sapphire', weight: 30, rarity: 'RARE' },
          { id: 'spinel', weight: 20, rarity: 'RARE' },
          { id: 'tsavorite', weight: 25, rarity: 'RARE' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
          { id: 'pyrite', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 180, items: 2 },
      },
      area_2: {
        name: 'Blue River',
        difficulty: 3,
        items: [
          { id: 'sapphire', weight: 35, rarity: 'RARE' },
          { id: 'spinel', weight: 25, rarity: 'RARE' },
          { id: 'tourmaline', weight: 20, rarity: 'UNCOMMON' },
          { id: 'pyrite', weight: 10, rarity: 'COMMON' },
          { id: 'tsavorite', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 220, items: 2 },
      },
      area_3: {
        name: 'Montana Ridge',
        difficulty: 3,
        items: [
          { id: 'sapphire', weight: 40, rarity: 'RARE' },
          { id: 'spinel', weight: 30, rarity: 'RARE' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
          { id: 'pyrite', weight: 8, rarity: 'COMMON' },
          { id: 'tsavorite', weight: 7, rarity: 'RARE' },
        ],
        baseRewards: { coins: 250, items: 3 },
      },
    },
  },

  TIER_3_A: {
    name: 'Minas Gerais',
    color: '#9932CC',
    unlockLevel: 10,
    type: 'gem',
    description: 'Legendary Brazilian mines with precious gems',
    areas: {
      area_1: {
        name: 'Emerald Valley',
        difficulty: 3,
        items: [
          { id: 'emerald', weight: 30, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
          { id: 'tourmaline', weight: 25, rarity: 'UNCOMMON' },
          { id: 'aquamarine', weight: 20, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 280, items: 3 },
      },
      area_2: {
        name: 'Topaz Plains',
        difficulty: 3,
        items: [
          { id: 'imperial_topaz', weight: 40, rarity: 'RARE' },
          { id: 'emerald', weight: 25, rarity: 'RARE' },
          { id: 'aquamarine', weight: 20, rarity: 'UNCOMMON' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 300, items: 3 },
      },
      area_3: {
        name: 'Imperial Depths',
        difficulty: 3,
        items: [
          { id: 'imperial_topaz', weight: 45, rarity: 'RARE' },
          { id: 'emerald', weight: 30, rarity: 'RARE' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
          { id: 'aquamarine', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 350, items: 3 },
      },
    },
  },

  TIER_3_B: {
    name: 'Mogok Valley',
    color: '#DC143C',
    unlockLevel: 15,
    type: 'gem',
    description: 'Burmese valley of rubies and spinels',
    areas: {
      area_1: {
        name: 'Ruby Hills',
        difficulty: 3,
        items: [
          { id: 'ruby', weight: 35, rarity: 'EPIC' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'spinel', weight: 20, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
        ],
        baseRewards: { coins: 320, items: 3 },
      },
      area_2: {
        name: 'Burmese Deep',
        difficulty: 3,
        items: [
          { id: 'ruby', weight: 45, rarity: 'EPIC' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
          { id: 'spinel', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 380, items: 3 },
      },
      area_3: {
        name: 'Mogok Peak',
        difficulty: 3,
        items: [
          { id: 'ruby', weight: 50, rarity: 'EPIC' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'spinel', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 400, items: 4 },
      },
    },
  },

  TIER_3_C: {
    name: 'Sri Lanka Fields',
    color: '#FF8C00',
    unlockLevel: 20,
    type: 'mixed',
    description: 'Island gem mines with diverse precious stones and lapis lazuli',
    areas: {
      area_1: {
        name: 'Ceylon South',
        difficulty: 3,
        items: [
          { id: 'ruby', weight: 25, rarity: 'EPIC' },
          { id: 'sapphire', weight: 30, rarity: 'RARE' },
          { id: 'emerald', weight: 20, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
          { id: 'lapis_lazuli', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 350, items: 3 },
      },
      area_2: {
        name: 'Ratnapura',
        difficulty: 3,
        items: [
          { id: 'sapphire', weight: 35, rarity: 'RARE' },
          { id: 'ruby', weight: 25, rarity: 'EPIC' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
          { id: 'emerald', weight: 12, rarity: 'RARE' },
          { id: 'lapis_lazuli', weight: 8, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 400, items: 4 },
      },
      area_3: {
        name: 'Island Deep',
        difficulty: 3,
        items: [
          { id: 'emerald', weight: 28, rarity: 'RARE' },
          { id: 'ruby', weight: 25, rarity: 'EPIC' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
          { id: 'lapis_lazuli', weight: 7, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 450, items: 4 },
      },
    },
  },

  TIER_4_A: {
    name: 'Muzo Highlands',
    color: '#00FF7F',
    unlockLevel: 25,
    type: 'gem',
    description: 'Colombian highlands with world-class emeralds',
    areas: {
      area_1: {
        name: 'Emerald Heart',
        difficulty: 3,
        items: [
          { id: 'emerald', weight: 50, rarity: 'RARE' },
          { id: 'ruby', weight: 20, rarity: 'EPIC' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 480, items: 4 },
      },
      area_2: {
        name: 'Muzo Core',
        difficulty: 3,
        items: [
          { id: 'emerald', weight: 60, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
          { id: 'ruby', weight: 12, rarity: 'EPIC' },
          { id: 'sapphire', weight: 8, rarity: 'RARE' },
        ],
        baseRewards: { coins: 520, items: 4 },
      },
      area_3: {
        name: 'Chivor Deep',
        difficulty: 3,
        items: [
          { id: 'emerald', weight: 55, rarity: 'EPIC' },
          { id: 'ruby', weight: 20, rarity: 'EPIC' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 580, items: 5 },
      },
    },
  },

  TIER_4_B: {
    name: 'Kashmir Heights',
    color: '#4169E1',
    unlockLevel: 30,
    type: 'gem',
    description: 'Himalayan mines with legendary sapphires',
    areas: {
      area_1: {
        name: 'Kashmir Valley',
        difficulty: 3,
        items: [
          { id: 'sapphire', weight: 45, rarity: 'RARE' },
          { id: 'ruby', weight: 25, rarity: 'EPIC' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 550, items: 4 },
      },
      area_2: {
        name: 'Padder Peaks',
        difficulty: 3,
        items: [
          { id: 'sapphire', weight: 50, rarity: 'EPIC' },
          { id: 'ruby', weight: 25, rarity: 'EPIC' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 620, items: 5 },
      },
      area_3: {
        name: 'Snow Leopard Trail',
        difficulty: 3,
        items: [
          { id: 'sapphire', weight: 55, rarity: 'EPIC' },
          { id: 'ruby', weight: 20, rarity: 'EPIC' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 700, items: 5 },
      },
    },
  },

  TIER_4_C: {
    name: 'Argyle Caverns',
    color: '#FF1493',
    unlockLevel: 40,
    type: 'gem',
    description: 'Australian caves with rare pink diamonds and opals',
    areas: {
      area_1: {
        name: 'Pink Pit',
        difficulty: 3,
        items: [
          { id: 'diamond', weight: 35, rarity: 'EPIC' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'ruby', weight: 20, rarity: 'EPIC' },
          { id: 'opal', weight: 15, rarity: 'UNCOMMON' },
          { id: 'tourmaline', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 750, items: 5 },
      },
      area_2: {
        name: 'Argyle Depths',
        difficulty: 3,
        items: [
          { id: 'diamond', weight: 45, rarity: 'EPIC' },
          { id: 'ruby', weight: 25, rarity: 'EPIC' },
          { id: 'black_opal', weight: 15, rarity: 'RARE' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
          { id: 'opal', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 850, items: 5 },
      },
      area_3: {
        name: 'Diamond Heart',
        difficulty: 3,
        items: [
          { id: 'diamond', weight: 55, rarity: 'EPIC' },
          { id: 'ruby', weight: 20, rarity: 'EPIC' },
          { id: 'black_opal', weight: 12, rarity: 'RARE' },
          { id: 'sapphire', weight: 8, rarity: 'RARE' },
          { id: 'opal', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 1000, items: 6 },
      },
    },
  },

  TIER_5_A: {
    name: 'Golconda Depths',
    color: '#FFD700',
    unlockLevel: 50,
    type: 'gem',
    description: 'Legendary Indian diamond mines',
    areas: {
      area_1: {
        name: 'Kollur Mine',
        difficulty: 3,
        items: [
          { id: 'diamond', weight: 50, rarity: 'EPIC' },
          { id: 'emerald', weight: 20, rarity: 'RARE' },
          { id: 'ruby', weight: 15, rarity: 'EPIC' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 1200, items: 6 },
      },
      area_2: {
        name: 'Golconda Core',
        difficulty: 3,
        items: [
          { id: 'diamond', weight: 60, rarity: 'LEGENDARY' },
          { id: 'emerald', weight: 18, rarity: 'RARE' },
          { id: 'ruby', weight: 12, rarity: 'EPIC' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 1500, items: 6 },
      },
      area_3: {
        name: 'Legendary Vault',
        difficulty: 3,
        items: [
          { id: 'diamond', weight: 70, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 12, rarity: 'EPIC' },
          { id: 'emerald', weight: 10, rarity: 'RARE' },
          { id: 'sapphire', weight: 8, rarity: 'RARE' },
        ],
        baseRewards: { coins: 2000, items: 7 },
      },
    },
  },

  TIER_5_B: {
    name: 'Androy Dunes',
    color: '#9400D3',
    unlockLevel: 60,
    type: 'gem',
    description: 'Madagascar deserts with rare tanzanite',
    areas: {
      area_1: {
        name: 'Tanzanite Fields',
        difficulty: 3,
        items: [
          { id: 'tanzanite', weight: 45, rarity: 'EPIC' },
          { id: 'diamond', weight: 25, rarity: 'EPIC' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'ruby', weight: 15, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 1800, items: 6 },
      },
      area_2: {
        name: 'Merelani Hills',
        difficulty: 3,
        items: [
          { id: 'tanzanite', weight: 55, rarity: 'EPIC' },
          { id: 'diamond', weight: 20, rarity: 'EPIC' },
          { id: 'ruby', weight: 15, rarity: 'EPIC' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 2200, items: 7 },
      },
      area_3: {
        name: 'Deep Desert',
        difficulty: 3,
        items: [
          { id: 'tanzanite', weight: 65, rarity: 'EPIC' },
          { id: 'diamond', weight: 18, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 10, rarity: 'EPIC' },
          { id: 'sapphire', weight: 7, rarity: 'RARE' },
        ],
        baseRewards: { coins: 2800, items: 7 },
      },
    },
  },

  TIER_5_C: {
    name: 'Mogok Hidden',
    color: '#FF0000',
    unlockLevel: 75,
    type: 'gem',
    description: 'Secret Burmese mines with the rarest gems on Earth',
    areas: {
      area_1: {
        name: 'Secret Valley',
        difficulty: 3,
        items: [
          { id: 'alexandrite', weight: 30, rarity: 'LEGENDARY' },
          { id: 'taaffeite', weight: 20, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 25, rarity: 'LEGENDARY' },
          { id: 'tanzanite', weight: 15, rarity: 'EPIC' },
          { id: 'ruby', weight: 10, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 3000, items: 7 },
      },
      area_2: {
        name: 'Hidden Palace',
        difficulty: 3,
        items: [
          { id: 'taaffeite', weight: 35, rarity: 'LEGENDARY' },
          { id: 'alexandrite', weight: 30, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 20, rarity: 'LEGENDARY' },
          { id: 'tanzanite', weight: 10, rarity: 'EPIC' },
          { id: 'ruby', weight: 5, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 4000, items: 8 },
      },
      area_3: {
        name: 'Dragon\'s Hoard',
        difficulty: 3,
        items: [
          { id: 'taaffeite', weight: 40, rarity: 'LEGENDARY' },
          { id: 'alexandrite', weight: 35, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 15, rarity: 'LEGENDARY' },
          { id: 'tanzanite', weight: 7, rarity: 'EPIC' },
          { id: 'ruby', weight: 3, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 5000, items: 8 },
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Roll for loot in a specific area
 * @param {string} locationKey - The location tier (e.g., 'TIER_1')
 * @param {string} areaKey - The area within that location (e.g., 'area_1')
 * @param {number} itemCount - Number of items to roll for (default: 1)
 * @param {number} difficulty - Difficulty multiplier (1-3)
 * @param {Object} options - Optional settings
 * @param {string[]} options.equipmentIds - Array of equipment IDs for bonus calculation
 * @param {number} options.dropRateBonus - Direct drop rate bonus (overrides equipmentIds if provided)
 * @param {number} options.extraItems - Direct extra items count (overrides equipmentIds if provided)
 * @returns {object} Object containing coins and items array
 */
export const rollLoot = (locationKey, areaKey, itemCount = 1, difficulty = 1, options = {}) => {
  const location = LOOT_TABLES[locationKey];
  if (!location) {
    throw new Error(`Invalid location: ${locationKey}`);
  }

  const area = location.areas[areaKey];
  if (!area) {
    throw new Error(`Invalid area: ${areaKey} in ${locationKey}`);
  }

  const multipliers = REWARD_MULTIPLIERS[difficulty] || REWARD_MULTIPLIERS[1];

  // Calculate equipment bonuses
  let dropRateBonus = options.dropRateBonus ?? 0;
  let extraItems = options.extraItems ?? 0;

  // If equipmentIds provided, calculate bonuses from them
  if (options.equipmentIds && options.equipmentIds.length > 0) {
    const equipmentBonus = calculateEquipmentBonus(options.equipmentIds);
    dropRateBonus = Math.max(dropRateBonus, equipmentBonus.dropRateBonus);
    extraItems = Math.max(extraItems, equipmentBonus.extraItems);
  }

  // Calculate base rewards with multipliers
  const coins = Math.floor(area.baseRewards.coins * multipliers.coins);

  // Apply equipment bonuses to item count
  // dropRateBonus is a percentage multiplier (e.g., 0.10 = 10% more items)
  // extraItems is a flat addition
  const bonusItemCount = Math.ceil(itemCount * dropRateBonus);
  const totalItemCount = itemCount + bonusItemCount + extraItems;

  // Roll for items based on weighted chances
  const items = [];
  const totalWeight = area.items.reduce((sum, item) => sum + item.weight, 0);

  for (let i = 0; i < totalItemCount; i++) {
    let roll = Math.random() * totalWeight;

    for (const itemEntry of area.items) {
      roll -= itemEntry.weight;
      if (roll <= 0) {
        const itemData = getItemById(itemEntry.id);
        if (itemData) {
          items.push({
            ...itemData,
            rarity: itemEntry.rarity,
            rarityTier: RARITY_TIERS[itemEntry.rarity],
            source: {
              location: locationKey,
              area: areaKey,
            },
          });
        }
        break;
      }
    }
  }

  return {
    coins,
    items,
    location: location.name,
    area: area.name,
    // Include bonus info for debugging/display
    bonusesApplied: {
      dropRateBonus,
      extraItems,
      baseItemCount: itemCount,
      totalItemCount,
    },
  };
};

/**
 * Get all sources where a specific item can be found
 * @param {string} itemId - The item ID to search for
 * @returns {Array} Array of {location, area, rarity, weight} objects
 */
export const getItemSources = (itemId) => {
  const sources = [];

  for (const [locationKey, location] of Object.entries(LOOT_TABLES)) {
    for (const [areaKey, area] of Object.entries(location.areas)) {
      const itemEntry = area.items.find((i) => i.id === itemId);
      if (itemEntry) {
        sources.push({
          location: {
            key: locationKey,
            name: location.name,
            color: location.color,
            unlockLevel: location.unlockLevel,
            type: location.type,
          },
          area: {
            key: areaKey,
            name: area.name,
            difficulty: area.difficulty,
          },
          rarity: itemEntry.rarity,
          weight: itemEntry.weight,
          rarityTier: RARITY_TIERS[itemEntry.rarity],
        });
      }
    }
  }

  // Sort by rarity (Legendary first, then Epic, Rare, etc.)
  const rarityOrder = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
  sources.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

  return sources;
};

/**
 * Get all available items from a specific location
 * @param {string} locationKey - The location tier
 * @returns {Array} Array of item objects with rarity info
 */
export const getItemsAtLocation = (locationKey) => {
  const location = LOOT_TABLES[locationKey];
  if (!location) return [];

  const itemMap = new Map();

  for (const area of Object.values(location.areas)) {
    for (const itemEntry of area.items) {
      if (!itemMap.has(itemEntry.id)) {
        const itemData = getItemById(itemEntry.id);
        if (itemData) {
          itemMap.set(itemEntry.id, {
            ...itemData,
            rarity: itemEntry.rarity,
            rarityTier: RARITY_TIERS[itemEntry.rarity],
            rarityWeight: itemEntry.weight,
          });
        }
      }
    }
  }

  return Array.from(itemMap.values());
};

/**
 * Get summary of all available locations
 * @returns {Array} Array of location summaries with item counts
 */
export const getAllLocations = () => {
  return Object.entries(LOOT_TABLES).map(([key, location]) => ({
    key,
    name: location.name,
    color: location.color,
    unlockLevel: location.unlockLevel,
    type: location.type,
    description: location.description,
    areas: Object.entries(location.areas).map(([areaKey, area]) => ({
      key: areaKey,
      name: area.name,
      difficulty: area.difficulty,
      itemCount: area.items.length,
      baseRewards: area.baseRewards,
    })),
    itemTypes: getItemsAtLocation(key).length,
  }));
};

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================

/** @deprecated Use getItemById instead */
export const getGemById = getItemById;

/** @deprecated Use getItemSources instead */
export const getGemSources = getItemSources;

/** @deprecated Use getItemsAtLocation instead */
export const getGemsAtLocation = getItemsAtLocation;

export default LOOT_TABLES;

import gemsData from './gems.json';

// Rarity tier definitions with base percentages
export const RARITY_TIERS = {
  COMMON: { name: 'Common', baseChance: 0.60, color: '#9CA3AF' },
  UNCOMMON: { name: 'Uncommon', baseChance: 0.25, color: '#22C55E' },
  RARE: { name: 'Rare', baseChance: 0.10, color: '#3B82F6' },
  EPIC: { name: 'Epic', baseChance: 0.04, color: '#A855F7' },
  LEGENDARY: { name: 'Legendary', baseChance: 0.01, color: '#F59E0B' },
};

// Reward multipliers by difficulty
export const REWARD_MULTIPLIERS = {
  1: { coins: 1.0, gems: 1.0 },
  2: { coins: 1.5, gems: 1.5 },
  3: { coins: 2.0, gems: 2.0 },
};

// Main loot tables organized by location tier
export const LOOT_TABLES = {
  TIER_1: {
    name: 'River Panning',
    color: '#87CEEB',
    unlockLevel: 0,
    description: 'Beginner waters with common gems',
    areas: {
      area_1: {
        name: 'Shallow Waters',
        difficulty: 1,
        gems: [
          { id: 'quartz_clear', weight: 70, rarity: 'COMMON' },
          { id: 'amethyst', weight: 25, rarity: 'COMMON' },
          { id: 'garnet', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 50, gems: 1 },
      },
      area_2: {
        name: 'Pebble Banks',
        difficulty: 1,
        gems: [
          { id: 'quartz_clear', weight: 60, rarity: 'COMMON' },
          { id: 'amethyst', weight: 30, rarity: 'COMMON' },
          { id: 'garnet', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 60, gems: 1 },
      },
      area_3: {
        name: 'Sandy Flats',
        difficulty: 2,
        gems: [
          { id: 'quartz_clear', weight: 50, rarity: 'COMMON' },
          { id: 'amethyst', weight: 35, rarity: 'COMMON' },
          { id: 'garnet', weight: 15, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 75, gems: 1 },
      },
    },
  },

  TIER_1_B: {
    name: 'Ozark Hills',
    color: '#228B22',
    unlockLevel: 1,
    description: 'Hilly terrain with varied mineral deposits',
    areas: {
      area_1: {
        name: 'Crystal Creek',
        difficulty: 1,
        gems: [
          { id: 'amethyst', weight: 45, rarity: 'COMMON' },
          { id: 'garnet', weight: 35, rarity: 'COMMON' },
          { id: 'citrine', weight: 15, rarity: 'UNCOMMON' },
          { id: 'rose_quartz', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 65, gems: 1 },
      },
      area_2: {
        name: 'Rose Valley',
        difficulty: 1,
        gems: [
          { id: 'rose_quartz', weight: 40, rarity: 'COMMON' },
          { id: 'amethyst', weight: 35, rarity: 'COMMON' },
          { id: 'citrine', weight: 20, rarity: 'UNCOMMON' },
          { id: 'garnet', weight: 5, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 70, gems: 1 },
      },
      area_3: {
        name: 'Golden Ridge',
        difficulty: 2,
        gems: [
          { id: 'citrine', weight: 35, rarity: 'COMMON' },
          { id: 'garnet', weight: 30, rarity: 'COMMON' },
          { id: 'amethyst', weight: 25, rarity: 'COMMON' },
          { id: 'rose_quartz', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 85, gems: 2 },
      },
    },
  },

  TIER_1_C: {
    name: 'Bavarian Fields',
    color: '#DAA520',
    unlockLevel: 2,
    description: 'Historic mining fields with unique quartz varieties',
    areas: {
      area_1: {
        name: 'Misty Meadow',
        difficulty: 1,
        gems: [
          { id: 'smoky_quartz', weight: 50, rarity: 'COMMON' },
          { id: 'quartz_clear', weight: 30, rarity: 'COMMON' },
          { id: 'moonstone', weight: 15, rarity: 'UNCOMMON' },
          { id: 'amethyst', weight: 5, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 70, gems: 1 },
      },
      area_2: {
        name: 'Stone Valley',
        difficulty: 2,
        gems: [
          { id: 'smoky_quartz', weight: 40, rarity: 'COMMON' },
          { id: 'moonstone', weight: 30, rarity: 'UNCOMMON' },
          { id: 'quartz_clear', weight: 20, rarity: 'COMMON' },
          { id: 'amethyst', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 90, gems: 1 },
      },
      area_3: {
        name: 'Moonlit Peak',
        difficulty: 2,
        gems: [
          { id: 'moonstone', weight: 45, rarity: 'UNCOMMON' },
          { id: 'smoky_quartz', weight: 35, rarity: 'COMMON' },
          { id: 'amethyst', weight: 15, rarity: 'COMMON' },
          { id: 'quartz_clear', weight: 5, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 100, gems: 2 },
      },
    },
  },

  TIER_2_A: {
    name: 'Ural Shores',
    color: '#8B4513',
    unlockLevel: 3,
    description: 'Coastal regions with beryl and topaz deposits',
    areas: {
      area_1: {
        name: 'Coastal Drift',
        difficulty: 2,
        gems: [
          { id: 'amethyst', weight: 40, rarity: 'COMMON' },
          { id: 'topaz', weight: 35, rarity: 'UNCOMMON' },
          { id: 'garnet', weight: 15, rarity: 'COMMON' },
          { id: 'citrine', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 120, gems: 2 },
      },
      area_2: {
        name: 'Amber Shore',
        difficulty: 2,
        gems: [
          { id: 'topaz', weight: 45, rarity: 'UNCOMMON' },
          { id: 'amethyst', weight: 30, rarity: 'COMMON' },
          { id: 'citrine', weight: 15, rarity: 'UNCOMMON' },
          { id: 'garnet', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 130, gems: 2 },
      },
      area_3: {
        name: 'Topaz Cove',
        difficulty: 3,
        gems: [
          { id: 'topaz', weight: 50, rarity: 'UNCOMMON' },
          { id: 'citrine', weight: 25, rarity: 'UNCOMMON' },
          { id: 'amethyst', weight: 15, rarity: 'COMMON' },
          { id: 'garnet', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 150, gems: 2 },
      },
    },
  },

  TIER_2_B: {
    name: 'Bahia Mines',
    color: '#2F4F4F',
    unlockLevel: 5,
    description: 'Deep mines with rare tourmaline and beryl',
    areas: {
      area_1: {
        name: 'Tourmaline Depths',
        difficulty: 2,
        gems: [
          { id: 'tourmaline', weight: 40, rarity: 'UNCOMMON' },
          { id: 'aquamarine', weight: 30, rarity: 'UNCOMMON' },
          { id: 'morganite', weight: 20, rarity: 'UNCOMMON' },
          { id: 'topaz', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 160, gems: 2 },
      },
      area_2: {
        name: 'Beryl Veins',
        difficulty: 2,
        gems: [
          { id: 'aquamarine', weight: 40, rarity: 'UNCOMMON' },
          { id: 'morganite', weight: 30, rarity: 'UNCOMMON' },
          { id: 'tourmaline', weight: 20, rarity: 'UNCOMMON' },
          { id: 'topaz', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 175, gems: 2 },
      },
      area_3: {
        name: 'Bahia Deep',
        difficulty: 3,
        gems: [
          { id: 'aquamarine', weight: 35, rarity: 'UNCOMMON' },
          { id: 'tourmaline', weight: 30, rarity: 'UNCOMMON' },
          { id: 'morganite', weight: 25, rarity: 'UNCOMMON' },
          { id: 'topaz', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 200, gems: 3 },
      },
    },
  },

  TIER_2_C: {
    name: 'Montana Streambed',
    color: '#4682B4',
    unlockLevel: 7,
    description: 'Mountain streams with corundum deposits',
    areas: {
      area_1: {
        name: 'Sapphire Falls',
        difficulty: 2,
        gems: [
          { id: 'sapphire', weight: 35, rarity: 'RARE' },
          { id: 'yogo_sapphire', weight: 15, rarity: 'RARE' },
          { id: 'garnet', weight: 30, rarity: 'COMMON' },
          { id: 'tourmaline', weight: 20, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 180, gems: 2 },
      },
      area_2: {
        name: 'Blue River',
        difficulty: 3,
        gems: [
          { id: 'yogo_sapphire', weight: 35, rarity: 'RARE' },
          { id: 'sapphire', weight: 35, rarity: 'RARE' },
          { id: 'tourmaline', weight: 20, rarity: 'UNCOMMON' },
          { id: 'garnet', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 220, gems: 2 },
      },
      area_3: {
        name: 'Montana Ridge',
        difficulty: 3,
        gems: [
          { id: 'yogo_sapphire', weight: 45, rarity: 'RARE' },
          { id: 'sapphire', weight: 30, rarity: 'RARE' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
          { id: 'garnet', weight: 10, rarity: 'COMMON' },
        ],
        baseRewards: { coins: 250, gems: 3 },
      },
    },
  },

  TIER_3_A: {
    name: 'Minas Gerais',
    color: '#9932CC',
    unlockLevel: 10,
    description: 'Legendary Brazilian mines with precious gems',
    areas: {
      area_1: {
        name: 'Emerald Valley',
        difficulty: 3,
        gems: [
          { id: 'emerald', weight: 30, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
          { id: 'tourmaline', weight: 25, rarity: 'UNCOMMON' },
          { id: 'aquamarine', weight: 20, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 280, gems: 3 },
      },
      area_2: {
        name: 'Topaz Plains',
        difficulty: 3,
        gems: [
          { id: 'imperial_topaz', weight: 40, rarity: 'RARE' },
          { id: 'emerald', weight: 25, rarity: 'RARE' },
          { id: 'aquamarine', weight: 20, rarity: 'UNCOMMON' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 300, gems: 3 },
      },
      area_3: {
        name: 'Imperial Depths',
        difficulty: 3,
        gems: [
          { id: 'imperial_topaz', weight: 45, rarity: 'RARE' },
          { id: 'emerald', weight: 30, rarity: 'RARE' },
          { id: 'tourmaline', weight: 15, rarity: 'UNCOMMON' },
          { id: 'aquamarine', weight: 10, rarity: 'UNCOMMON' },
        ],
        baseRewards: { coins: 350, gems: 3 },
      },
    },
  },

  TIER_3_B: {
    name: 'Mogok Valley',
    color: '#DC143C',
    unlockLevel: 15,
    description: 'Burmese valley of rubies and spinels',
    areas: {
      area_1: {
        name: 'Ruby Hills',
        difficulty: 3,
        gems: [
          { id: 'ruby', weight: 35, rarity: 'RARE' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'yogo_sapphire', weight: 20, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
        ],
        baseRewards: { coins: 320, gems: 3 },
      },
      area_2: {
        name: 'Burmese Deep',
        difficulty: 3,
        gems: [
          { id: 'ruby', weight: 45, rarity: 'RARE' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
          { id: 'yogo_sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 380, gems: 3 },
      },
      area_3: {
        name: 'Mogok Peak',
        difficulty: 3,
        gems: [
          { id: 'ruby', weight: 50, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'yogo_sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 400, gems: 4 },
      },
    },
  },

  TIER_3_C: {
    name: 'Sri Lanka Fields',
    color: '#FF8C00',
    unlockLevel: 20,
    description: 'Island gem mines with diverse precious stones',
    areas: {
      area_1: {
        name: 'Ceylon South',
        difficulty: 3,
        gems: [
          { id: 'ruby', weight: 25, rarity: 'RARE' },
          { id: 'sapphire', weight: 30, rarity: 'RARE' },
          { id: 'emerald', weight: 20, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
        ],
        baseRewards: { coins: 350, gems: 3 },
      },
      area_2: {
        name: 'Ratnapura',
        difficulty: 3,
        gems: [
          { id: 'sapphire', weight: 35, rarity: 'RARE' },
          { id: 'ruby', weight: 25, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 25, rarity: 'RARE' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 400, gems: 4 },
      },
      area_3: {
        name: 'Island Deep',
        difficulty: 3,
        gems: [
          { id: 'emerald', weight: 30, rarity: 'RARE' },
          { id: 'ruby', weight: 25, rarity: 'RARE' },
          { id: 'sapphire', weight: 25, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
        ],
        baseRewards: { coins: 450, gems: 4 },
      },
    },
  },

  TIER_4_A: {
    name: 'Muzo Highlands',
    color: '#00FF7F',
    unlockLevel: 25,
    description: 'Colombian highlands with world-class emeralds',
    areas: {
      area_1: {
        name: 'Emerald Heart',
        difficulty: 3,
        gems: [
          { id: 'emerald', weight: 50, rarity: 'RARE' },
          { id: 'ruby', weight: 20, rarity: 'RARE' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 480, gems: 4 },
      },
      area_2: {
        name: 'Muzo Core',
        difficulty: 3,
        gems: [
          { id: 'emerald', weight: 60, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 20, rarity: 'RARE' },
          { id: 'ruby', weight: 12, rarity: 'RARE' },
          { id: 'sapphire', weight: 8, rarity: 'RARE' },
        ],
        baseRewards: { coins: 520, gems: 4 },
      },
      area_3: {
        name: 'Chivor Deep',
        difficulty: 3,
        gems: [
          { id: 'emerald', weight: 55, rarity: 'EPIC' },
          { id: 'ruby', weight: 20, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 580, gems: 5 },
      },
    },
  },

  TIER_4_B: {
    name: 'Kashmir Heights',
    color: '#4169E1',
    unlockLevel: 30,
    description: 'Himalayan mines with legendary sapphires',
    areas: {
      area_1: {
        name: 'Kashmir Valley',
        difficulty: 3,
        gems: [
          { id: 'sapphire', weight: 45, rarity: 'RARE' },
          { id: 'ruby', weight: 25, rarity: 'RARE' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 550, gems: 4 },
      },
      area_2: {
        name: 'Padder Peaks',
        difficulty: 3,
        gems: [
          { id: 'sapphire', weight: 50, rarity: 'EPIC' },
          { id: 'ruby', weight: 25, rarity: 'RARE' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 620, gems: 5 },
      },
      area_3: {
        name: 'Snow Leopard Trail',
        difficulty: 3,
        gems: [
          { id: 'sapphire', weight: 55, rarity: 'EPIC' },
          { id: 'ruby', weight: 20, rarity: 'RARE' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
          { id: 'imperial_topaz', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 700, gems: 5 },
      },
    },
  },

  TIER_4_C: {
    name: 'Argyle Caverns',
    color: '#FF1493',
    unlockLevel: 40,
    description: 'Australian caves with rare pink diamonds',
    areas: {
      area_1: {
        name: 'Pink Pit',
        difficulty: 3,
        gems: [
          { id: 'diamond', weight: 35, rarity: 'EPIC' },
          { id: 'sapphire', weight: 30, rarity: 'RARE' },
          { id: 'ruby', weight: 20, rarity: 'RARE' },
          { id: 'emerald', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 750, gems: 5 },
      },
      area_2: {
        name: 'Argyle Depths',
        difficulty: 3,
        gems: [
          { id: 'diamond', weight: 45, rarity: 'EPIC' },
          { id: 'ruby', weight: 25, rarity: 'RARE' },
          { id: 'sapphire', weight: 18, rarity: 'RARE' },
          { id: 'emerald', weight: 12, rarity: 'RARE' },
        ],
        baseRewards: { coins: 850, gems: 5 },
      },
      area_3: {
        name: 'Diamond Heart',
        difficulty: 3,
        gems: [
          { id: 'diamond', weight: 55, rarity: 'EPIC' },
          { id: 'ruby', weight: 20, rarity: 'RARE' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'emerald', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 1000, gems: 6 },
      },
    },
  },

  TIER_5_A: {
    name: 'Golconda Depths',
    color: '#FFD700',
    unlockLevel: 50,
    description: 'Legendary Indian diamond mines',
    areas: {
      area_1: {
        name: 'Kollur Mine',
        difficulty: 3,
        gems: [
          { id: 'diamond', weight: 50, rarity: 'EPIC' },
          { id: 'emerald', weight: 20, rarity: 'RARE' },
          { id: 'ruby', weight: 15, rarity: 'RARE' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 1200, gems: 6 },
      },
      area_2: {
        name: 'Golconda Core',
        difficulty: 3,
        gems: [
          { id: 'diamond', weight: 60, rarity: 'LEGENDARY' },
          { id: 'emerald', weight: 18, rarity: 'RARE' },
          { id: 'ruby', weight: 12, rarity: 'RARE' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 1500, gems: 6 },
      },
      area_3: {
        name: 'Legendary Vault',
        difficulty: 3,
        gems: [
          { id: 'diamond', weight: 70, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 12, rarity: 'RARE' },
          { id: 'emerald', weight: 10, rarity: 'RARE' },
          { id: 'sapphire', weight: 8, rarity: 'RARE' },
        ],
        baseRewards: { coins: 2000, gems: 7 },
      },
    },
  },

  TIER_5_B: {
    name: 'Androy Dunes',
    color: '#9400D3',
    unlockLevel: 60,
    description: 'Madagascar deserts with rare tanzanite',
    areas: {
      area_1: {
        name: 'Tanzanite Fields',
        difficulty: 3,
        gems: [
          { id: 'tanzanite', weight: 45, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 25, rarity: 'EPIC' },
          { id: 'sapphire', weight: 15, rarity: 'RARE' },
          { id: 'ruby', weight: 15, rarity: 'RARE' },
        ],
        baseRewards: { coins: 1800, gems: 6 },
      },
      area_2: {
        name: 'Merelani Hills',
        difficulty: 3,
        gems: [
          { id: 'tanzanite', weight: 55, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 20, rarity: 'EPIC' },
          { id: 'ruby', weight: 15, rarity: 'RARE' },
          { id: 'sapphire', weight: 10, rarity: 'RARE' },
        ],
        baseRewards: { coins: 2200, gems: 7 },
      },
      area_3: {
        name: 'Deep Desert',
        difficulty: 3,
        gems: [
          { id: 'tanzanite', weight: 65, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 18, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 10, rarity: 'RARE' },
          { id: 'sapphire', weight: 7, rarity: 'RARE' },
        ],
        baseRewards: { coins: 2800, gems: 7 },
      },
    },
  },

  TIER_5_C: {
    name: 'Mogok Hidden',
    color: '#FF0000',
    unlockLevel: 75,
    description: 'Secret Burmese mines with the rarest gems on Earth',
    areas: {
      area_1: {
        name: 'Secret Valley',
        difficulty: 3,
        gems: [
          { id: 'alexandrite', weight: 30, rarity: 'LEGENDARY' },
          { id: 'painite', weight: 20, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 25, rarity: 'LEGENDARY' },
          { id: 'tanzanite', weight: 15, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 10, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 3000, gems: 7 },
      },
      area_2: {
        name: 'Hidden Palace',
        difficulty: 3,
        gems: [
          { id: 'painite', weight: 35, rarity: 'LEGENDARY' },
          { id: 'alexandrite', weight: 30, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 20, rarity: 'LEGENDARY' },
          { id: 'tanzanite', weight: 10, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 5, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 4000, gems: 8 },
      },
      area_3: {
        name: 'Dragon\'s Hoard',
        difficulty: 3,
        gems: [
          { id: 'painite', weight: 40, rarity: 'LEGENDARY' },
          { id: 'alexandrite', weight: 35, rarity: 'LEGENDARY' },
          { id: 'diamond', weight: 15, rarity: 'LEGENDARY' },
          { id: 'tanzanite', weight: 7, rarity: 'LEGENDARY' },
          { id: 'ruby', weight: 3, rarity: 'EPIC' },
        ],
        baseRewards: { coins: 5000, gems: 8 },
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a gem object by its ID
 * @param {string} gemId - The gem ID to look up
 * @returns {object|undefined} The gem object from gems.json
 */
export const getGemById = (gemId) => {
  return gemsData.gems.find((gem) => gem.id === gemId);
};

/**
 * Roll for loot in a specific area
 * @param {string} locationKey - The location tier (e.g., 'TIER_1')
 * @param {string} areaKey - The area within that location (e.g., 'area_1')
 * @param {number} gemCount - Number of gems to roll for (default: 1)
 * @param {number} difficulty - Difficulty multiplier (1-3)
 * @returns {object} Object containing coins and gems array
 */
export const rollLoot = (locationKey, areaKey, gemCount = 1, difficulty = 1) => {
  const location = LOOT_TABLES[locationKey];
  if (!location) {
    throw new Error(`Invalid location: ${locationKey}`);
  }

  const area = location.areas[areaKey];
  if (!area) {
    throw new Error(`Invalid area: ${areaKey} in ${locationKey}`);
  }

  const multipliers = REWARD_MULTIPLIERS[difficulty] || REWARD_MULTIPLIERS[1];

  // Calculate base rewards with multipliers
  const coins = Math.floor(area.baseRewards.coins * multipliers.coins);

  // Roll for gems based on weighted chances
  const gems = [];
  const totalWeight = area.gems.reduce((sum, gem) => sum + gem.weight, 0);

  for (let i = 0; i < gemCount; i++) {
    let roll = Math.random() * totalWeight;
    
    for (const gemEntry of area.gems) {
      roll -= gemEntry.weight;
      if (roll <= 0) {
        const gemData = getGemById(gemEntry.id);
        if (gemData) {
          gems.push({
            ...gemData,
            rarity: gemEntry.rarity,
            rarityTier: RARITY_TIERS[gemEntry.rarity],
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
    gems,
    location: location.name,
    area: area.name,
  };
};

/**
 * Get all sources where a specific gem can be found
 * @param {string} gemId - The gem ID to search for
 * @returns {Array} Array of {location, area, rarity, weight} objects
 */
export const getGemSources = (gemId) => {
  const sources = [];

  for (const [locationKey, location] of Object.entries(LOOT_TABLES)) {
    for (const [areaKey, area] of Object.entries(location.areas)) {
      const gemEntry = area.gems.find((g) => g.id === gemId);
      if (gemEntry) {
        sources.push({
          location: {
            key: locationKey,
            name: location.name,
            color: location.color,
            unlockLevel: location.unlockLevel,
          },
          area: {
            key: areaKey,
            name: area.name,
            difficulty: area.difficulty,
          },
          rarity: gemEntry.rarity,
          weight: gemEntry.weight,
          rarityTier: RARITY_TIERS[gemEntry.rarity],
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
 * Get all available gems from a specific location
 * @param {string} locationKey - The location tier
 * @returns {Array} Array of gem objects with rarity info
 */
export const getGemsAtLocation = (locationKey) => {
  const location = LOOT_TABLES[locationKey];
  if (!location) return [];

  const gemMap = new Map();

  for (const area of Object.values(location.areas)) {
    for (const gemEntry of area.gems) {
      if (!gemMap.has(gemEntry.id)) {
        const gemData = getGemById(gemEntry.id);
        if (gemData) {
          gemMap.set(gemEntry.id, {
            ...gemData,
            rarity: gemEntry.rarity,
            rarityTier: RARITY_TIERS[gemEntry.rarity],
            rarityWeight: gemEntry.weight,
          });
        }
      }
    }
  }

  return Array.from(gemMap.values());
};

/**
 * Get summary of all available locations
 * @returns {Array} Array of location summaries with gem counts
 */
export const getAllLocations = () => {
  return Object.entries(LOOT_TABLES).map(([key, location]) => ({
    key,
    name: location.name,
    color: location.color,
    unlockLevel: location.unlockLevel,
    description: location.description,
    areas: Object.entries(location.areas).map(([areaKey, area]) => ({
      key: areaKey,
      name: area.name,
      difficulty: area.difficulty,
      gemCount: area.gems.length,
      baseRewards: area.baseRewards,
    })),
    gemTypes: getGemsAtLocation(key).length,
  }));
};

export default LOOT_TABLES;

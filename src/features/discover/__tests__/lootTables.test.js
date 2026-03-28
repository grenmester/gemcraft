import { describe, it, expect } from 'vitest';
import {
  RARITY_TIERS,
  REWARD_MULTIPLIERS,
  LOOT_TABLES,
  getGemById,
  rollLoot,
  getGemSources,
  getGemsAtLocation,
  getAllLocations,
} from '../../../data/lootTables';

describe('lootTables', () => {
  describe('RARITY_TIERS', () => {
    it('should have all required rarity tiers', () => {
      expect(RARITY_TIERS.COMMON).toBeDefined();
      expect(RARITY_TIERS.UNCOMMON).toBeDefined();
      expect(RARITY_TIERS.RARE).toBeDefined();
      expect(RARITY_TIERS.EPIC).toBeDefined();
      expect(RARITY_TIERS.LEGENDARY).toBeDefined();
    });

    it('should have valid baseChance values', () => {
      expect(RARITY_TIERS.COMMON.baseChance).toBeCloseTo(0.60);
      expect(RARITY_TIERS.UNCOMMON.baseChance).toBeCloseTo(0.25);
      expect(RARITY_TIERS.RARE.baseChance).toBeCloseTo(0.10);
      expect(RARITY_TIERS.EPIC.baseChance).toBeCloseTo(0.04);
      expect(RARITY_TIERS.LEGENDARY.baseChance).toBeCloseTo(0.01);
    });

    it('should have color values', () => {
      expect(RARITY_TIERS.COMMON.color).toBe('#9CA3AF');
      expect(RARITY_TIERS.UNCOMMON.color).toBe('#22C55E');
      expect(RARITY_TIERS.RARE.color).toBe('#3B82F6');
      expect(RARITY_TIERS.EPIC.color).toBe('#A855F7');
      expect(RARITY_TIERS.LEGENDARY.color).toBe('#F59E0B');
    });
  });

  describe('REWARD_MULTIPLIERS', () => {
    it('should have multipliers for all difficulty levels', () => {
      expect(REWARD_MULTIPLIERS[1]).toBeDefined();
      expect(REWARD_MULTIPLIERS[2]).toBeDefined();
      expect(REWARD_MULTIPLIERS[3]).toBeDefined();
    });

    it('should have correct coin and gem multipliers', () => {
      expect(REWARD_MULTIPLIERS[1].coins).toBe(1.0);
      expect(REWARD_MULTIPLIERS[2].coins).toBe(1.5);
      expect(REWARD_MULTIPLIERS[3].coins).toBe(2.0);
    });

    it('should have correct shift multipliers', () => {
      expect(REWARD_MULTIPLIERS[1].shift).toBe(1);
      expect(REWARD_MULTIPLIERS[2].shift).toBe(2);
      expect(REWARD_MULTIPLIERS[3].shift).toBe(3);
    });
  });

  describe('LOOT_TABLES', () => {
    it('should have TIER_1 defined', () => {
      expect(LOOT_TABLES.TIER_1).toBeDefined();
      expect(LOOT_TABLES.TIER_1.name).toBe('River Panning');
      expect(LOOT_TABLES.TIER_1.unlockLevel).toBe(0);
    });

    it('should have areas within TIER_1', () => {
      expect(LOOT_TABLES.TIER_1.areas.area_1).toBeDefined();
      expect(LOOT_TABLES.TIER_1.areas.area_2).toBeDefined();
      expect(LOOT_TABLES.TIER_1.areas.area_3).toBeDefined();
    });

    it('should have gem definitions in areas', () => {
      const gems = LOOT_TABLES.TIER_1.areas.area_1.gems;
      expect(gems.length).toBeGreaterThan(0);
      expect(gems[0]).toHaveProperty('id');
      expect(gems[0]).toHaveProperty('weight');
      expect(gems[0]).toHaveProperty('rarity');
    });

    it('should have baseRewards in areas', () => {
      const area = LOOT_TABLES.TIER_1.areas.area_1;
      expect(area.baseRewards).toHaveProperty('coins');
      expect(area.baseRewards).toHaveProperty('gems');
      expect(area.baseRewards).toHaveProperty('shift');
    });

    it('should have tier keys following naming convention', () => {
      expect(LOOT_TABLES.TIER_1).toBeDefined();
      expect(LOOT_TABLES.TIER_1_B).toBeDefined();
      expect(LOOT_TABLES.TIER_2_A).toBeDefined();
    });
  });

  describe('getGemById', () => {
    it('should return gem data for valid gem ID', () => {
      const gem = getGemById('quartz_clear');
      expect(gem).toBeDefined();
      expect(gem.id).toBe('quartz_clear');
      expect(gem.name).toBe('Clear Quartz');
    });

    it('should return gem with value and type', () => {
      const gem = getGemById('amethyst');
      expect(gem.value).toBe(15);
      expect(gem.type).toBe('quartz');
    });

    it('should return undefined for invalid gem ID', () => {
      const gem = getGemById('invalid_gem');
      expect(gem).toBeUndefined();
    });

    it('should return diamond gem data', () => {
      const gem = getGemById('diamond');
      expect(gem).toBeDefined();
      expect(gem.name).toBe('Diamond');
      expect(gem.value).toBe(500);
    });
  });

  describe('rollLoot', () => {
    it('should return loot object with coins, gems, and shift', () => {
      const loot = rollLoot('TIER_1', 'area_1');
      expect(loot).toHaveProperty('coins');
      expect(loot).toHaveProperty('gems');
      expect(loot).toHaveProperty('shift');
      expect(loot).toHaveProperty('location');
      expect(loot).toHaveProperty('area');
    });

    it('should throw error for invalid location', () => {
      expect(() => rollLoot('INVALID', 'area_1')).toThrow('Invalid location: INVALID');
    });

    it('should throw error for invalid area', () => {
      expect(() => rollLoot('TIER_1', 'invalid_area')).toThrow('Invalid area: invalid_area in TIER_1');
    });

    it('should accept gemCount parameter', () => {
      const loot = rollLoot('TIER_1', 'area_1', 3);
      expect(loot.gems.length).toBe(3);
    });

    it('should apply difficulty multipliers', () => {
      const loot = rollLoot('TIER_1', 'area_3', 1, 2);
      expect(loot.shift).toBeDefined();
    });

    it('should include rarity info in gems', () => {
      const loot = rollLoot('TIER_1', 'area_1', 1);
      if (loot.gems.length > 0) {
        expect(loot.gems[0]).toHaveProperty('rarity');
        expect(loot.gems[0]).toHaveProperty('rarityTier');
      }
    });
  });

  describe('getGemSources', () => {
    it('should return sources for a valid gem', () => {
      const sources = getGemSources('quartz_clear');
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should include location and area info', () => {
      const sources = getGemSources('amethyst');
      if (sources.length > 0) {
        expect(sources[0]).toHaveProperty('location');
        expect(sources[0]).toHaveProperty('area');
        expect(sources[0].location).toHaveProperty('name');
        expect(sources[0].area).toHaveProperty('name');
      }
    });

    it('should include rarity info', () => {
      const sources = getGemSources('garnet');
      if (sources.length > 0) {
        expect(sources[0]).toHaveProperty('rarity');
        expect(sources[0]).toHaveProperty('weight');
      }
    });

    it('should return empty array for unknown gem', () => {
      const sources = getGemSources('nonexistent_gem');
      expect(sources).toEqual([]);
    });

    it('should return sources for rare gems like diamond', () => {
      const sources = getGemSources('diamond');
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('getGemsAtLocation', () => {
    it('should return gems for a valid location', () => {
      const gems = getGemsAtLocation('TIER_1');
      expect(Array.isArray(gems)).toBe(true);
      expect(gems.length).toBeGreaterThan(0);
    });

    it('should return gems with rarity info', () => {
      const gems = getGemsAtLocation('TIER_1');
      if (gems.length > 0) {
        expect(gems[0]).toHaveProperty('rarity');
        expect(gems[0]).toHaveProperty('rarityTier');
      }
    });

    it('should return empty array for invalid location', () => {
      const gems = getGemsAtLocation('INVALID');
      expect(gems).toEqual([]);
    });

    it('should return unique gems (no duplicates)', () => {
      const gems = getGemsAtLocation('TIER_1');
      const ids = gems.map(g => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getAllLocations', () => {
    it('should return array of location summaries', () => {
      const locations = getAllLocations();
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);
    });

    it('should include key, name, color, and unlockLevel', () => {
      const locations = getAllLocations();
      const location = locations[0];
      expect(location).toHaveProperty('key');
      expect(location).toHaveProperty('name');
      expect(location).toHaveProperty('color');
      expect(location).toHaveProperty('unlockLevel');
    });

    it('should include areas for each location', () => {
      const locations = getAllLocations();
      const location = locations[0];
      expect(location).toHaveProperty('areas');
      expect(Array.isArray(location.areas)).toBe(true);
    });

    it('should include gemTypes count', () => {
      const locations = getAllLocations();
      const location = locations[0];
      expect(location).toHaveProperty('gemTypes');
    });

    it('should include difficulty in areas', () => {
      const locations = getAllLocations();
      const location = locations[0];
      const area = location.areas[0];
      expect(area).toHaveProperty('difficulty');
    });

    it('should include baseRewards in areas', () => {
      const locations = getAllLocations();
      const location = locations[0];
      const area = location.areas[0];
      expect(area).toHaveProperty('baseRewards');
    });
  });
});
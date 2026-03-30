import { describe, it, expect } from 'vitest';
import {
  RARITY_TIERS,
  REWARD_MULTIPLIERS,
  LOOT_TABLES,
  getItemById,
  getGemById,
  rollLoot,
  getItemSources,
  getGemSources,
  getItemsAtLocation,
  getGemsAtLocation,
  getAllLocations,
  calculateEquipmentBonus,
} from '../../../data/lootTables';
import { EQUIPMENT } from '../../../loaders/equipment';

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

    it('should have correct coin and item multipliers', () => {
      expect(REWARD_MULTIPLIERS[1].coins).toBe(1.0);
      expect(REWARD_MULTIPLIERS[2].coins).toBe(1.5);
      expect(REWARD_MULTIPLIERS[3].coins).toBe(2.0);
      expect(REWARD_MULTIPLIERS[1].items).toBe(1.0);
      expect(REWARD_MULTIPLIERS[2].items).toBe(1.5);
      expect(REWARD_MULTIPLIERS[3].items).toBe(2.0);
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

    it('should have item definitions in areas', () => {
      const items = LOOT_TABLES.TIER_1.areas.area_1.items;
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty('id');
      expect(items[0]).toHaveProperty('weight');
      expect(items[0]).toHaveProperty('rarity');
    });

    it('should have baseRewards in areas', () => {
      const area = LOOT_TABLES.TIER_1.areas.area_1;
      expect(area.baseRewards).toHaveProperty('coins');
      expect(area.baseRewards).toHaveProperty('items');
    });

    it('should have tier keys following naming convention', () => {
      expect(LOOT_TABLES.TIER_1).toBeDefined();
      expect(LOOT_TABLES.TIER_1_B).toBeDefined();
      expect(LOOT_TABLES.TIER_2_A).toBeDefined();
    });
  });

  describe('getItemById', () => {
    it('should return item data for valid item ID', () => {
      const item = getItemById('clear_quartz');
      expect(item).toBeDefined();
      expect(item.id).toBe('clear_quartz');
      expect(item.name).toBe('Clear Quartz');
    });

    it('should return item with value and category', () => {
      const item = getItemById('amethyst');
      expect(item.value).toBe(20);
      expect(item.category).toBe('Gem');
    });

    it('should return undefined for invalid item ID', () => {
      const item = getItemById('invalid_item');
      expect(item).toBeUndefined();
    });

    it('should return diamond item data', () => {
      const item = getItemById('diamond');
      expect(item).toBeDefined();
      expect(item.name).toBe('Diamond');
      expect(item.value).toBe(5000);
      expect(item.category).toBe('Gem');
    });

    it('should return mineral data with correct category', () => {
      const item = getItemById('hematite');
      expect(item).toBeDefined();
      expect(item.category).toBe('Mineral');
    });
  });

  describe('getGemById (alias)', () => {
    it('should be an alias for getItemById', () => {
      expect(getGemById).toBe(getItemById);
    });
  });

  describe('rollLoot', () => {
    it('should return loot object with coins, items, location, and area', () => {
      const loot = rollLoot('TIER_1', 'area_1');
      expect(loot).toHaveProperty('coins');
      expect(loot).toHaveProperty('items');
      expect(loot).toHaveProperty('location');
      expect(loot).toHaveProperty('area');
      expect(loot).toHaveProperty('bonusesApplied');
    });

    it('should throw error for invalid location', () => {
      expect(() => rollLoot('INVALID', 'area_1')).toThrow('Invalid location: INVALID');
    });

    it('should throw error for invalid area', () => {
      expect(() => rollLoot('TIER_1', 'invalid_area')).toThrow('Invalid area: invalid_area in TIER_1');
    });

    it('should accept itemCount parameter', () => {
      const loot = rollLoot('TIER_1', 'area_1', 3);
      expect(loot.items.length).toBe(3);
    });

    it('should apply difficulty multipliers', () => {
      const loot = rollLoot('TIER_1', 'area_3', 1, 2);
      expect(loot.coins).toBeDefined();
      expect(loot.items).toBeDefined();
    });

    it('should include rarity info in items', () => {
      const loot = rollLoot('TIER_1', 'area_1', 1);
      if (loot.items.length > 0) {
        expect(loot.items[0]).toHaveProperty('rarity');
        expect(loot.items[0]).toHaveProperty('rarityTier');
        expect(loot.items[0]).toHaveProperty('category');
      }
    });

    it('should include category field in items', () => {
      const loot = rollLoot('TIER_1', 'area_1', 3);
      loot.items.forEach(item => {
        expect(item.category).toBeDefined();
        expect(['Gem', 'Mineral']).toContain(item.category);
      });
    });

    it('should apply equipment drop rate bonus', () => {
      const lootNoBonus = rollLoot('TIER_1', 'area_1', 2);
      const lootWithBonus = rollLoot('TIER_1', 'area_1', 2, 1, {
        dropRateBonus: 0.50, // 50% bonus
      });

      expect(lootWithBonus.bonusesApplied.dropRateBonus).toBe(0.50);
      // With 50% bonus on 2 items, should get 1 bonus item (2 * 0.5 = 1)
      expect(lootWithBonus.bonusesApplied.totalItemCount).toBe(3);
    });

    it('should apply equipment extraItems bonus', () => {
      const loot = rollLoot('TIER_1', 'area_1', 2, 1, {
        extraItems: 3,
      });

      expect(loot.bonusesApplied.extraItems).toBe(3);
      expect(loot.bonusesApplied.totalItemCount).toBe(5); // 2 base + 3 extra
    });

    it('should calculate bonuses from equipmentIds', () => {
      const loot = rollLoot('TIER_1', 'area_1', 2, 1, {
        equipmentIds: ['BASIC_PICKAXE'], // +10% drop rate
      });

      expect(loot.bonusesApplied.dropRateBonus).toBe(0.10);
      // 2 items * 0.10 = 0.2, ceiling = 1 bonus
      expect(loot.bonusesApplied.totalItemCount).toBe(3);
    });

    it('should combine multiple equipment bonuses', () => {
      // If player has both BASIC_PICKAXE and STEEL_DRILL
      // This shouldn't normally happen, but test the calculation
      const equipmentIds = ['BASIC_PICKAXE', 'IRON_PICKAXE'];
      const bonus = calculateEquipmentBonus(equipmentIds);
      // BASIC_PICKAXE: +10%, IRON_PICKAXE: +20% = +30%
      expect(bonus.dropRateBonus).toBeCloseTo(0.30);
    });

    it('should include source info in items', () => {
      const loot = rollLoot('TIER_1', 'area_1', 1);
      if (loot.items.length > 0) {
        expect(loot.items[0].source).toBeDefined();
        expect(loot.items[0].source.location).toBe('TIER_1');
        expect(loot.items[0].source.area).toBe('area_1');
      }
    });
  });

  describe('calculateEquipmentBonus', () => {
    it('should return zero bonus for empty equipment', () => {
      const bonus = calculateEquipmentBonus([]);
      expect(bonus.dropRateBonus).toBe(0);
      expect(bonus.extraItems).toBe(0);
    });

    it('should calculate bonus for BASIC_PICKAXE', () => {
      const bonus = calculateEquipmentBonus(['BASIC_PICKAXE']);
      expect(bonus.dropRateBonus).toBe(0.10);
      expect(bonus.extraItems).toBe(0);
    });

    it('should calculate bonus for STEEL_DRILL', () => {
      const bonus = calculateEquipmentBonus(['STEEL_DRILL']);
      expect(bonus.dropRateBonus).toBe(0.30);
      expect(bonus.extraItems).toBe(1);
    });

    it('should ignore invalid equipment IDs', () => {
      const bonus = calculateEquipmentBonus(['INVALID_EQUIPMENT']);
      expect(bonus.dropRateBonus).toBe(0);
      expect(bonus.extraItems).toBe(0);
    });
  });

  describe('getItemSources', () => {
    it('should return sources for a valid item', () => {
      const sources = getItemSources('clear_quartz');
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should include location and area info', () => {
      const sources = getItemSources('amethyst');
      if (sources.length > 0) {
        expect(sources[0]).toHaveProperty('location');
        expect(sources[0]).toHaveProperty('area');
        expect(sources[0].location).toHaveProperty('name');
        expect(sources[0].area).toHaveProperty('name');
      }
    });

    it('should include rarity info', () => {
      const sources = getItemSources('amethyst');
      if (sources.length > 0) {
        expect(sources[0]).toHaveProperty('rarity');
        expect(sources[0]).toHaveProperty('weight');
      }
    });

    it('should return empty array for unknown item', () => {
      const sources = getItemSources('nonexistent_item');
      expect(sources).toEqual([]);
    });

    it('should return sources for rare items like diamond', () => {
      const sources = getItemSources('diamond');
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('getGemSources (alias)', () => {
    it('should be an alias for getItemSources', () => {
      expect(getGemSources).toBe(getItemSources);
    });
  });

  describe('getItemsAtLocation', () => {
    it('should return items for a valid location', () => {
      const items = getItemsAtLocation('TIER_1');
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should return items with rarity info', () => {
      const items = getItemsAtLocation('TIER_1');
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('rarity');
        expect(items[0]).toHaveProperty('rarityTier');
      }
    });

    it('should return empty array for invalid location', () => {
      const items = getItemsAtLocation('INVALID');
      expect(items).toEqual([]);
    });

    it('should return unique items (no duplicates)', () => {
      const items = getItemsAtLocation('TIER_1');
      const ids = items.map(i => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getGemsAtLocation (alias)', () => {
    it('should be an alias for getItemsAtLocation', () => {
      expect(getGemsAtLocation).toBe(getItemsAtLocation);
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

    it('should include itemTypes count', () => {
      const locations = getAllLocations();
      const location = locations[0];
      expect(location).toHaveProperty('itemTypes');
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

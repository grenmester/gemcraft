import { describe, it, expect } from 'vitest';
import {
  getItems,
  getGems,
  getMinerals,
  getItemsByCategory,
  getItemById,
  getItemsByRarity,
  getItemCount,
} from '../items';

describe('items.js', () => {
  describe('getItems()', () => {
    it('returns all items from items.json', () => {
      const items = getItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(40);
    });

    it('returns items with correct structure', () => {
      const items = getItems();
      const firstItem = items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('category');
      expect(firstItem).toHaveProperty('hardness');
      expect(firstItem).toHaveProperty('value');
      expect(firstItem).toHaveProperty('rarity');
    });

    it('returns the same array reference on multiple calls', () => {
      const items1 = getItems();
      const items2 = getItems();
      expect(items1).toBe(items2);
    });
  });

  describe('getGems()', () => {
    it('returns only items with category Gem', () => {
      const gems = getGems();
      expect(Array.isArray(gems)).toBe(true);
      gems.forEach(gem => {
        expect(gem.category).toBe('Gem');
      });
    });

    it('returns 24 gems', () => {
      const gems = getGems();
      expect(gems.length).toBe(24);
    });

    it('includes expected gems like Diamond and Ruby', () => {
      const gems = getGems();
      const diamond = gems.find(g => g.id === 'diamond');
      const ruby = gems.find(g => g.id === 'ruby');
      expect(diamond).toBeDefined();
      expect(diamond.name).toBe('Diamond');
      expect(ruby).toBeDefined();
      expect(ruby.name).toBe('Ruby');
    });
  });

  describe('getMinerals()', () => {
    it('returns only items with category Mineral', () => {
      const minerals = getMinerals();
      expect(Array.isArray(minerals)).toBe(true);
      minerals.forEach(mineral => {
        expect(mineral.category).toBe('Mineral');
      });
    });

    it('returns 16 minerals', () => {
      const minerals = getMinerals();
      expect(minerals.length).toBe(16);
    });

    it('includes expected minerals like Clear Quartz and Hematite', () => {
      const minerals = getMinerals();
      const quartz = minerals.find(m => m.id === 'clear_quartz');
      const hematite = minerals.find(m => m.id === 'hematite');
      expect(quartz).toBeDefined();
      expect(quartz.name).toBe('Clear Quartz');
      expect(hematite).toBeDefined();
      expect(hematite.name).toBe('Hematite');
    });
  });

  describe('getItemsByCategory()', () => {
    it('returns items filtered by Gem category', () => {
      const gems = getItemsByCategory('Gem');
      expect(gems.length).toBe(24);
      gems.forEach(item => {
        expect(item.category).toBe('Gem');
      });
    });

    it('returns items filtered by Mineral category', () => {
      const minerals = getItemsByCategory('Mineral');
      expect(minerals.length).toBe(16);
      minerals.forEach(item => {
        expect(item.category).toBe('Mineral');
      });
    });

    it('returns empty array for non-existent category', () => {
      const items = getItemsByCategory('NonExistent');
      expect(items).toEqual([]);
    });
  });

  describe('getItemById()', () => {
    it('returns correct item for valid id', () => {
      const diamond = getItemById('diamond');
      expect(diamond).toBeDefined();
      expect(diamond.id).toBe('diamond');
      expect(diamond.name).toBe('Diamond');
      expect(diamond.category).toBe('Gem');
      expect(diamond.rarity).toBe('Legendary');
      expect(diamond.value).toBe(5000);
    });

    it('returns correct item for mineral id', () => {
      const quartz = getItemById('clear_quartz');
      expect(quartz).toBeDefined();
      expect(quartz.id).toBe('clear_quartz');
      expect(quartz.name).toBe('Clear Quartz');
      expect(quartz.category).toBe('Mineral');
    });

    it('returns undefined for invalid id', () => {
      const item = getItemById('nonexistent_item');
      expect(item).toBeUndefined();
    });

    it('returns undefined for null id', () => {
      const item = getItemById(null);
      expect(item).toBeUndefined();
    });

    it('returns undefined for undefined id', () => {
      const item = getItemById(undefined);
      expect(item).toBeUndefined();
    });
  });

  describe('getItemsByRarity()', () => {
    it('returns items filtered by Common rarity', () => {
      const commonItems = getItemsByRarity('Common');
      expect(commonItems.length).toBeGreaterThan(0);
      commonItems.forEach(item => {
        expect(item.rarity).toBe('Common');
      });
    });

    it('returns items filtered by Legendary rarity', () => {
      const legendaryItems = getItemsByRarity('Legendary');
      expect(legendaryItems.length).toBeGreaterThan(0);
      legendaryItems.forEach(item => {
        expect(item.rarity).toBe('Legendary');
      });
    });

    it('returns expected count for each rarity', () => {
      const common = getItemsByRarity('Common');
      const uncommon = getItemsByRarity('Uncommon');
      const rare = getItemsByRarity('Rare');
      const epic = getItemsByRarity('Epic');
      const legendary = getItemsByRarity('Legendary');

      // Verify all items are accounted for
      const total = common.length + uncommon.length + rare.length + epic.length + legendary.length;
      expect(total).toBe(40);
    });

    it('returns empty array for non-existent rarity', () => {
      const items = getItemsByRarity('NonExistent');
      expect(items).toEqual([]);
    });

    it('returns correct legendary gems', () => {
      const legendary = getItemsByRarity('Legendary');
      const legendaryIds = legendary.map(i => i.id);
      expect(legendaryIds).toContain('diamond');
      expect(legendaryIds).toContain('blue_diamond');
      expect(legendaryIds).toContain('alexandrite');
      expect(legendaryIds).toContain('taaffeite');
      expect(legendaryIds).toContain('musgravite');
      expect(legendaryIds).toContain('red_beryl');
    });
  });

  describe('getItemCount()', () => {
    it('returns total count of all items', () => {
      const count = getItemCount();
      expect(count).toBe(40);
    });

    it('matches the length of getItems()', () => {
      const count = getItemCount();
      const items = getItems();
      expect(count).toBe(items.length);
    });
  });
});

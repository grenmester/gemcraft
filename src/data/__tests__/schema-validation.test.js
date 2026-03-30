import { describe, it, expect } from 'vitest';
import { items } from '../../loaders/items.js';
import { workers } from '../../loaders/workers.js';
import { upgrades } from '../../loaders/upgrades.js';
import { locationsData } from '../../loaders/locations.js';
import { equipmentData } from '../../loaders/equipment.js';
import { itemsDataSchema, itemSchema } from '../../schemas/items.js';
import { workersDataSchema } from '../../schemas/workers.js';
import { upgradesDataSchema } from '../../schemas/upgrades.js';
import { locationsDataSchema } from '../../schemas/locations.js';
import { equipmentDataSchema } from '../../schemas/equipment.js';

describe('Schema Validation', () => {
  describe('Items', () => {
    it('items are loaded successfully', () => {
      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('validates all items against schema', () => {
      const data = { items };
      const result = itemsDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('has valid rarity values', () => {
      const validRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
      items.forEach(item => {
        expect(validRarities).toContain(item.rarity);
      });
    });

    it('has valid hardness values (1-10)', () => {
      items.forEach(item => {
        expect(item.hardness).toBeGreaterThanOrEqual(1);
        expect(item.hardness).toBeLessThanOrEqual(10);
      });
    });

    it('has valid processing difficulty (1-5)', () => {
      items.forEach(item => {
        expect(item.processing.processDifficulty).toBeGreaterThanOrEqual(1);
        expect(item.processing.processDifficulty).toBeLessThanOrEqual(5);
      });
    });

    it('has unique item IDs', () => {
      const ids = items.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('has canFacet false for opal and turquoise', () => {
      const opal = items.find(i => i.id === 'opal');
      const turquoise = items.find(i => i.id === 'turquoise');
      expect(opal.processing.canFacet).toBe(false);
      expect(turquoise.processing.canFacet).toBe(false);
    });
  });

  describe('Workers', () => {
    it('workers are loaded successfully', () => {
      expect(workers).toBeDefined();
      expect(Array.isArray(workers)).toBe(true);
      expect(workers.length).toBe(5);
    });

    it('validates all workers against schema', () => {
      const data = { workers };
      const result = workersDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('has valid stats (0-100)', () => {
      workers.forEach(worker => {
        expect(worker.stats.efficiency).toBeGreaterThanOrEqual(0);
        expect(worker.stats.efficiency).toBeLessThanOrEqual(100);
        expect(worker.stats.luck).toBeGreaterThanOrEqual(0);
        expect(worker.stats.luck).toBeLessThanOrEqual(100);
        expect(worker.stats.speed).toBeGreaterThanOrEqual(0);
        expect(worker.stats.speed).toBeLessThanOrEqual(100);
      });
    });

    it('has unique worker IDs', () => {
      const ids = workers.map(w => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Upgrades', () => {
    it('upgrades are loaded successfully', () => {
      expect(upgrades).toBeDefined();
      expect(Array.isArray(upgrades)).toBe(true);
      expect(upgrades.length).toBeGreaterThan(0);
    });

    it('validates all upgrades against schema', () => {
      const data = { upgrades };
      const result = upgradesDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('has valid upgrade categories', () => {
      const validCategories = ['processing', 'discovery', 'storage', 'marketplace'];
      upgrades.forEach(upgrade => {
        expect(validCategories).toContain(upgrade.category);
      });
    });

    it('has unique upgrade IDs', () => {
      const ids = upgrades.map(u => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Locations', () => {
    it('locations are loaded successfully', () => {
      expect(locationsData).toBeDefined();
      expect(Object.keys(locationsData).length).toBeGreaterThan(0);
    });

    it('validates all locations against schema', () => {
      const result = locationsDataSchema.safeParse(locationsData);
      expect(result.success).toBe(true);
    });

    it('has valid hex color codes', () => {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.values(locationsData).forEach(location => {
        expect(location.color).toMatch(colorRegex);
      });
    });
  });

  describe('Equipment', () => {
    it('equipment is loaded successfully', () => {
      expect(equipmentData).toBeDefined();
      expect(Object.keys(equipmentData).length).toBeGreaterThan(0);
    });

    it('validates all equipment against schema', () => {
      const result = equipmentDataSchema.safeParse(equipmentData);
      expect(result.success).toBe(true);
    });

    it('has valid drop rate bonus (0-1)', () => {
      Object.values(equipmentData).forEach(eq => {
        expect(eq.effect.dropRateBonus).toBeGreaterThanOrEqual(0);
        expect(eq.effect.dropRateBonus).toBeLessThanOrEqual(1);
      });
    });
  });
});

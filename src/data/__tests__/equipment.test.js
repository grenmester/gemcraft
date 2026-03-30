import { describe, it, expect } from 'vitest';
import {
  EQUIPMENT,
  getEquipmentById,
  getOwnedEquipment,
  canAffordEquipment,
  canCraftEquipment,
  getEquipmentForZone,
} from '../../loaders/equipment.js';

describe('equipment.js', () => {
  describe('EQUIPMENT constant', () => {
    it('has NONE equipment with cost 0', () => {
      expect(EQUIPMENT.NONE).toBeDefined();
      expect(EQUIPMENT.NONE.id).toBe('NONE');
      expect(EQUIPMENT.NONE.cost).toBe(0);
      expect(EQUIPMENT.NONE.unlockLevel).toBe(0);
    });

    it('has BASIC_PICKAXE with correct properties', () => {
      expect(EQUIPMENT.BASIC_PICKAXE).toBeDefined();
      expect(EQUIPMENT.BASIC_PICKAXE.id).toBe('BASIC_PICKAXE');
      expect(EQUIPMENT.BASIC_PICKAXE.cost).toBe(100);
      expect(EQUIPMENT.BASIC_PICKAXE.unlockLevel).toBe(2);
      expect(EQUIPMENT.BASIC_PICKAXE.effect.dropRateBonus).toBe(0.10);
    });

    it('has ELITE_OPERATIONS as the most expensive equipment', () => {
      expect(EQUIPMENT.ELITE_OPERATIONS).toBeDefined();
      expect(EQUIPMENT.ELITE_OPERATIONS.cost).toBe(50000);
      expect(EQUIPMENT.ELITE_OPERATIONS.unlockLevel).toBe(50);
    });

    it('has craftRecipe on appropriate equipment', () => {
      expect(EQUIPMENT.IRON_PICKAXE.craftRecipe).toBeDefined();
      expect(EQUIPMENT.IRON_PICKAXE.craftRecipe.materials).toHaveProperty('hematite');
      expect(EQUIPMENT.IRON_PICKAXE.craftRecipe.coins).toBe(200);
    });

    it('has null craftRecipe for purchase-only equipment', () => {
      expect(EQUIPMENT.NONE.craftRecipe).toBeNull();
      expect(EQUIPMENT.BASIC_PICKAXE.craftRecipe).toBeNull();
    });
  });

  describe('getEquipmentById()', () => {
    it('returns correct equipment for valid id', () => {
      const basicPickaxe = getEquipmentById('BASIC_PICKAXE');
      expect(basicPickaxe).toBeDefined();
      expect(basicPickaxe.id).toBe('BASIC_PICKAXE');
      expect(basicPickaxe.name).toBe('Basic Pickaxe');
    });

    it('returns correct equipment for NONE id', () => {
      const none = getEquipmentById('NONE');
      expect(none).toBeDefined();
      expect(none.id).toBe('NONE');
      expect(none.name).toBe('None');
    });

    it('returns undefined for invalid id', () => {
      const equipment = getEquipmentById('INVALID_ID');
      expect(equipment).toBeUndefined();
    });

    it('returns equipment with all expected properties', () => {
      const drill = getEquipmentById('STEEL_DRILL');
      expect(drill).toHaveProperty('id');
      expect(drill).toHaveProperty('name');
      expect(drill).toHaveProperty('cost');
      expect(drill).toHaveProperty('unlockLevel');
      expect(drill).toHaveProperty('effect');
      expect(drill).toHaveProperty('unlocks');
      expect(drill).toHaveProperty('description');
    });
  });

  describe('getOwnedEquipment()', () => {
    it('returns NONE for level 0 with no owned equipment', () => {
      const owned = getOwnedEquipment(0, []);
      expect(owned.length).toBe(1);
      expect(owned[0].id).toBe('NONE');
    });

    it('returns NONE and owned equipment at appropriate levels', () => {
      const owned = getOwnedEquipment(5, ['BASIC_PICKAXE']);
      const ownedIds = owned.map(e => e.id);
      expect(ownedIds).toContain('NONE');
      expect(ownedIds).toContain('BASIC_PICKAXE');
    });

    it('filters out equipment above player level', () => {
      const owned = getOwnedEquipment(1, ['ELITE_OPERATIONS']);
      const ownedIds = owned.map(e => e.id);
      expect(ownedIds).not.toContain('ELITE_OPERATIONS');
    });

    it('returns equipment that meets level and ownership requirements', () => {
      const owned = getOwnedEquipment(10, ['IRON_PICKAXE']);
      const ironPickaxe = owned.find(e => e.id === 'IRON_PICKAXE');
      expect(ironPickaxe).toBeDefined();
    });

    it('handles empty ownedIds array', () => {
      const owned = getOwnedEquipment(50, []);
      expect(owned.length).toBe(1);
      expect(owned[0].id).toBe('NONE');
    });

    it('includes NONE in all results', () => {
      const owned = getOwnedEquipment(100, ['ELITE_OPERATIONS']);
      const none = owned.find(e => e.id === 'NONE');
      expect(none).toBeDefined();
    });
  });

  describe('canAffordEquipment()', () => {
    it('returns true when player has enough coins', () => {
      const canAfford = canAffordEquipment(500, 'BASIC_PICKAXE');
      expect(canAfford).toBe(true);
    });

    it('returns true when player has exactly the required coins', () => {
      const canAfford = canAffordEquipment(100, 'BASIC_PICKAXE');
      expect(canAfford).toBe(true);
    });

    it('returns false when player has insufficient coins', () => {
      const canAfford = canAffordEquipment(50, 'BASIC_PICKAXE');
      expect(canAfford).toBe(false);
    });

    it('returns true for NONE equipment (cost 0)', () => {
      const canAfford = canAffordEquipment(0, 'NONE');
      expect(canAfford).toBe(true);
    });

    it('handles expensive equipment correctly', () => {
      expect(canAffordEquipment(49999, 'ELITE_OPERATIONS')).toBe(false);
      expect(canAffordEquipment(50000, 'ELITE_OPERATIONS')).toBe(true);
      expect(canAffordEquipment(50001, 'ELITE_OPERATIONS')).toBe(true);
    });
  });

  describe('canCraftEquipment()', () => {
    it('returns false for equipment without craftRecipe', () => {
      const inventory = { minerals: [], currency: { coins: 1000 } };
      const canCraft = canCraftEquipment(inventory, 'BASIC_PICKAXE');
      expect(canCraft).toBe(false);
    });

    it('returns false when missing required materials', () => {
      const inventory = {
        minerals: [],
        currency: { coins: 1000 },
      };
      const canCraft = canCraftEquipment(inventory, 'IRON_PICKAXE');
      expect(canCraft).toBe(false);
    });

    it('returns false when materials insufficient', () => {
      const inventory = {
        minerals: [{ id: 'hematite', quantity: 2 }],
        currency: { coins: 1000 },
      };
      const canCraft = canCraftEquipment(inventory, 'IRON_PICKAXE');
      expect(canCraft).toBe(false);
    });

    it('returns false when coins insufficient', () => {
      const inventory = {
        minerals: [{ id: 'hematite', quantity: 10 }],
        currency: { coins: 100 },
      };
      const canCraft = canCraftEquipment(inventory, 'IRON_PICKAXE');
      expect(canCraft).toBe(false);
    });

    it('returns true when all requirements met', () => {
      const inventory = {
        minerals: [{ id: 'hematite', quantity: 5 }],
        currency: { coins: 500 },
      };
      const canCraft = canCraftEquipment(inventory, 'IRON_PICKAXE');
      expect(canCraft).toBe(true);
    });

    it('handles equipment with multiple materials', () => {
      const inventory = {
        minerals: [
          { id: 'hematite', quantity: 10 },
          { id: 'pyrite', quantity: 5 },
        ],
        currency: { coins: 1000 },
      };
      const canCraft = canCraftEquipment(inventory, 'STEEL_DRILL');
      expect(canCraft).toBe(true);
    });

    it('returns false when missing one of multiple materials', () => {
      const inventory = {
        minerals: [{ id: 'hematite', quantity: 10 }],
        currency: { coins: 1000 },
      };
      const canCraft = canCraftEquipment(inventory, 'STEEL_DRILL');
      expect(canCraft).toBe(false);
    });

    it('handles missing inventory gracefully', () => {
      const inventory = {};
      const canCraft = canCraftEquipment(inventory, 'IRON_PICKAXE');
      expect(canCraft).toBe(false);
    });
  });

  describe('getEquipmentForZone()', () => {
    it('returns equipment that unlocks TIER_1_B', () => {
      const equipment = getEquipmentForZone('TIER_1_B');
      const ids = equipment.map(e => e.id);
      expect(ids).toContain('BASIC_PICKAXE');
    });

    it('returns equipment that unlocks TIER_2_A', () => {
      const equipment = getEquipmentForZone('TIER_2_A');
      const ids = equipment.map(e => e.id);
      expect(ids).toContain('IRON_PICKAXE');
    });

    it('returns equipment that unlocks TIER_5_C', () => {
      const equipment = getEquipmentForZone('TIER_5_C');
      const ids = equipment.map(e => e.id);
      expect(ids).toContain('ELITE_OPERATIONS');
    });

    it('returns NONE equipment that unlocks TIER_1', () => {
      const equipment = getEquipmentForZone('TIER_1');
      expect(equipment.length).toBe(1);
      expect(equipment[0].id).toBe('NONE');
    });

    it('returns empty array for invalid zone', () => {
      const equipment = getEquipmentForZone('INVALID_ZONE');
      expect(equipment).toEqual([]);
    });

    it('returns correct equipment for zones requiring specific tools', () => {
      const tier2cEquipment = getEquipmentForZone('TIER_2_C');
      expect(tier2cEquipment.length).toBe(1);
      expect(tier2cEquipment[0].id).toBe('STEEL_DRILL');
    });
  });
});

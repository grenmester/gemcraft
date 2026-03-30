import { describe, it, expect } from 'vitest';
import {
  canUnlockZone,
  getZoneRequirements,
  getZoneStatus,
} from '../zoneUnlock';

describe('zoneUnlock.js', () => {
  describe('canUnlockZone()', () => {
    describe('TIER_1 (River Panning)', () => {
      it('unlocks with level 0 and no requirements', () => {
        const player = { level: 0, inventory: {} };
        const result = canUnlockZone(player, 'TIER_1');
        expect(result.unlocked).toBe(true);
        expect(result.requirements).toEqual([]);
      });

      it('unlocks with level 1', () => {
        const player = { level: 1, inventory: {} };
        const result = canUnlockZone(player, 'TIER_1');
        expect(result.unlocked).toBe(true);
      });
    });

    describe('TIER_1_B (Ozark Hills)', () => {
      it('unlocks with level 2 and BASIC_PICKAXE', () => {
        const player = {
          level: 2,
          inventory: { equipment: ['BASIC_PICKAXE'] },
        };
        const result = canUnlockZone(player, 'TIER_1_B');
        expect(result.unlocked).toBe(true);
        expect(result.requirements).toEqual([]);
      });

      it('fails with insufficient level', () => {
        const player = {
          level: 1,
          inventory: { equipment: ['BASIC_PICKAXE'] },
        };
        const result = canUnlockZone(player, 'TIER_1_B');
        expect(result.unlocked).toBe(false);
        expect(result.requirements.length).toBe(1);
        expect(result.requirements[0].type).toBe('level');
        expect(result.requirements[0].required).toBe(2);
        expect(result.requirements[0].current).toBe(1);
      });

      it('fails without required equipment', () => {
        const player = {
          level: 5,
          inventory: { equipment: [] },
        };
        const result = canUnlockZone(player, 'TIER_1_B');
        expect(result.unlocked).toBe(false);
        const eqRequirement = result.requirements.find(r => r.type === 'equipment');
        expect(eqRequirement).toBeDefined();
        expect(eqRequirement.required).toBe('BASIC_PICKAXE');
      });
    });

    describe('TIER_2_B (Bahia Mines - requires materials)', () => {
      it('unlocks with level, equipment, and materials', () => {
        const player = {
          level: 7,
          inventory: {
            equipment: ['IRON_PICKAXE'],
            minerals: [{ id: 'clear_quartz', quantity: 10 }],
          },
        };
        const result = canUnlockZone(player, 'TIER_2_B');
        expect(result.unlocked).toBe(true);
      });

      it('fails with insufficient materials', () => {
        const player = {
          level: 10,
          inventory: {
            equipment: ['IRON_PICKAXE'],
            minerals: [{ id: 'clear_quartz', quantity: 5 }],
          },
        };
        const result = canUnlockZone(player, 'TIER_2_B');
        expect(result.unlocked).toBe(false);
        const materialReq = result.requirements.find(r => r.type === 'material');
        expect(materialReq).toBeDefined();
        expect(materialReq.id).toBe('clear_quartz');
        expect(materialReq.required).toBe(10);
        expect(materialReq.current).toBe(5);
      });

      it('fails when material is completely missing', () => {
        const player = {
          level: 10,
          inventory: {
            equipment: ['IRON_PICKAXE'],
            minerals: [],
          },
        };
        const result = canUnlockZone(player, 'TIER_2_B');
        expect(result.unlocked).toBe(false);
        const materialReq = result.requirements.find(r => r.type === 'material');
        expect(materialReq.current).toBe(0);
      });
    });

    describe('TIER_5_C (Mogok Hidden - hardest zone)', () => {
      it('fails with insufficient level even with all equipment and materials', () => {
        const player = {
          level: 50,
          inventory: {
            equipment: ['ELITE_OPERATIONS'],
            minerals: [
              { id: 'lapis_lazuli', quantity: 3 },
              { id: 'malachite', quantity: 3 },
              { id: 'azurite', quantity: 3 },
            ],
          },
        };
        const result = canUnlockZone(player, 'TIER_5_C');
        expect(result.unlocked).toBe(false);
        const levelReq = result.requirements.find(r => r.type === 'level');
        expect(levelReq.required).toBe(75);
      });

      it('unlocks with all requirements met', () => {
        const player = {
          level: 75,
          inventory: {
            equipment: ['ELITE_OPERATIONS'],
            minerals: [
              { id: 'lapis_lazuli', quantity: 5 },
              { id: 'malachite', quantity: 5 },
              { id: 'azurite', quantity: 5 },
            ],
          },
        };
        const result = canUnlockZone(player, 'TIER_5_C');
        expect(result.unlocked).toBe(true);
      });
    });

    describe('invalid zones', () => {
      it('returns unlocked: false for invalid zone key', () => {
        const player = { level: 100, inventory: {} };
        const result = canUnlockZone(player, 'INVALID_ZONE');
        expect(result.unlocked).toBe(false);
        expect(result.requirements.length).toBe(1);
        expect(result.requirements[0].type).toBe('invalid_zone');
      });

      it('handles null zone key', () => {
        const player = { level: 100, inventory: {} };
        const result = canUnlockZone(player, null);
        expect(result.unlocked).toBe(false);
        expect(result.requirements[0].type).toBe('invalid_zone');
      });
    });

    describe('edge cases', () => {
      it('handles missing inventory gracefully', () => {
        const player = { level: 10 };
        const result = canUnlockZone(player, 'TIER_1_B');
        expect(result.unlocked).toBe(false);
        expect(result.requirements.some(r => r.type === 'equipment')).toBe(true);
      });

      it('handles missing equipment array', () => {
        const player = { level: 5, inventory: {} };
        const result = canUnlockZone(player, 'TIER_1_B');
        expect(result.unlocked).toBe(false);
      });

      it('handles missing minerals array', () => {
        const player = {
          level: 10,
          inventory: { equipment: ['IRON_PICKAXE'] },
        };
        const result = canUnlockZone(player, 'TIER_2_B');
        expect(result.unlocked).toBe(false);
      });
    });
  });

  describe('getZoneRequirements()', () => {
    it('returns requirements for TIER_1', () => {
      const reqs = getZoneRequirements('TIER_1');
      expect(reqs).toEqual({
        level: 0,
        equipment: 'NONE',
        materials: null,
      });
    });

    it('returns requirements for TIER_2_B with materials', () => {
      const reqs = getZoneRequirements('TIER_2_B');
      expect(reqs.level).toBe(7);
      expect(reqs.equipment).toBe('IRON_PICKAXE');
      expect(reqs.materials).toEqual({ clear_quartz: 10 });
    });

    it('returns requirements for TIER_5_A', () => {
      const reqs = getZoneRequirements('TIER_5_A');
      expect(reqs.level).toBe(50);
      expect(reqs.equipment).toBe('ELITE_OPERATIONS');
      expect(reqs.materials).toEqual({ hematite: 20, pyrite: 10 });
    });

    it('returns null for invalid zone', () => {
      const reqs = getZoneRequirements('INVALID_ZONE');
      expect(reqs).toBeNull();
    });

    it('returns null for null zone key', () => {
      const reqs = getZoneRequirements(null);
      expect(reqs).toBeNull();
    });

    it('returns correct structure for all valid zones', () => {
      const zones = [
        'TIER_1', 'TIER_1_B', 'TIER_1_C',
        'TIER_2_A', 'TIER_2_B', 'TIER_2_C',
        'TIER_3_A', 'TIER_3_B', 'TIER_3_C',
        'TIER_4_A', 'TIER_4_B', 'TIER_4_C',
        'TIER_5_A', 'TIER_5_B', 'TIER_5_C',
      ];

      zones.forEach(zone => {
        const reqs = getZoneRequirements(zone);
        expect(reqs).not.toBeNull();
        expect(reqs).toHaveProperty('level');
        expect(reqs).toHaveProperty('equipment');
        expect(reqs).toHaveProperty('materials');
      });
    });
  });

  describe('getZoneStatus()', () => {
    it('combines canUnlockZone result with locationKey', () => {
      const player = {
        level: 2,
        inventory: { equipment: ['BASIC_PICKAXE'] },
      };
      const status = getZoneStatus(player, 'TIER_1_B');
      expect(status.unlocked).toBe(true);
      expect(status.requirements).toEqual([]);
      expect(status.locationKey).toBe('TIER_1_B');
    });

    it('includes locationKey in failed unlock status', () => {
      const player = { level: 1, inventory: {} };
      const status = getZoneStatus(player, 'TIER_1_B');
      expect(status.unlocked).toBe(false);
      expect(status.locationKey).toBe('TIER_1_B');
      expect(status.requirements.length).toBeGreaterThan(0);
    });

    it('includes locationKey for invalid zones', () => {
      const player = { level: 100, inventory: {} };
      const status = getZoneStatus(player, 'INVALID_ZONE');
      expect(status.unlocked).toBe(false);
      expect(status.locationKey).toBe('INVALID_ZONE');
    });

    it('spreads all properties from canUnlockZone', () => {
      const player = {
        level: 5,
        inventory: { equipment: [] },
      };
      const status = getZoneStatus(player, 'TIER_1_B');
      
      // Verify both level and equipment requirements are present
      expect(status.requirements.some(r => r.type === 'equipment')).toBe(true);
      expect(status.locationKey).toBe('TIER_1_B');
    });

    it('returns correct status for fully unlocked zone', () => {
      const player = {
        level: 75,
        inventory: {
          equipment: ['ELITE_OPERATIONS'],
          minerals: [
            { id: 'lapis_lazuli', quantity: 10 },
            { id: 'malachite', quantity: 10 },
            { id: 'azurite', quantity: 10 },
          ],
        },
      };
      const status = getZoneStatus(player, 'TIER_5_C');
      expect(status.unlocked).toBe(true);
      expect(status.requirements).toEqual([]);
      expect(status.locationKey).toBe('TIER_5_C');
    });
  });
});

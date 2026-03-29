import { describe, it, expect } from 'vitest';
import {
  PROCESS_EQUIPMENT,
  getProcessEquipmentById,
  getOwnedProcessEquipment,
  getEquipmentForProcess,
  getAvailableProcessEquipment,
  canAffordProcessEquipment,
} from '../processEquipment';

describe('processEquipment.js', () => {
  describe('PROCESS_EQUIPMENT constant', () => {
    it('has cleaning equipment types', () => {
      expect(PROCESS_EQUIPMENT.BASIC_TUMBLER).toBeDefined();
      expect(PROCESS_EQUIPMENT.VIBRATING_TUMBLER).toBeDefined();
      expect(PROCESS_EQUIPMENT.SONIC_CLEANER).toBeDefined();
      expect(PROCESS_EQUIPMENT.INDUSTRIAL_CLEANER).toBeDefined();
    });

    it('has cutting equipment types', () => {
      expect(PROCESS_EQUIPMENT.BASIC_CUTTER).toBeDefined();
      expect(PROCESS_EQUIPMENT.PRECISION_CUTTER).toBeDefined();
      expect(PROCESS_EQUIPMENT.DIAMOND_CUTTER).toBeDefined();
      expect(PROCESS_EQUIPMENT.QUANTUM_CUTTER).toBeDefined();
    });

    it('has faceting equipment types', () => {
      expect(PROCESS_EQUIPMENT.HAND_FACETER).toBeDefined();
      expect(PROCESS_EQUIPMENT.AUTOMATIC_FACETER).toBeDefined();
      expect(PROCESS_EQUIPMENT.MASTER_FACETER).toBeDefined();
      expect(PROCESS_EQUIPMENT.BRILLIANCE_ENGINE).toBeDefined();
    });

    it('has correct properties for each equipment', () => {
      const tumbler = PROCESS_EQUIPMENT.BASIC_TUMBLER;
      expect(tumbler).toHaveProperty('id');
      expect(tumbler).toHaveProperty('name');
      expect(tumbler).toHaveProperty('type');
      expect(tumbler).toHaveProperty('description');
      expect(tumbler).toHaveProperty('effects');
      expect(tumbler).toHaveProperty('cost');
      expect(tumbler).toHaveProperty('unlockLevel');
    });

    it('has correct properties for cutting equipment', () => {
      const cutter = PROCESS_EQUIPMENT.PRECISION_CUTTER;
      expect(cutter).toHaveProperty('id');
      expect(cutter).toHaveProperty('name');
      expect(cutter).toHaveProperty('type');
      expect(cutter).toHaveProperty('effects');
      expect(cutter).toHaveProperty('cost');
      expect(cutter).toHaveProperty('unlockLevel');
    });

    it('has correct properties for faceting equipment', () => {
      const faceter = PROCESS_EQUIPMENT.MASTER_FACETER;
      expect(faceter).toHaveProperty('id');
      expect(faceter).toHaveProperty('name');
      expect(faceter).toHaveProperty('type');
      expect(faceter).toHaveProperty('effects');
      expect(faceter).toHaveProperty('cost');
      expect(faceter).toHaveProperty('unlockLevel');
    });

    it('has increasing costs and unlock levels for cleaning', () => {
      expect(PROCESS_EQUIPMENT.BASIC_TUMBLER.cost).toBe(500);
      expect(PROCESS_EQUIPMENT.VIBRATING_TUMBLER.cost).toBe(2000);
      expect(PROCESS_EQUIPMENT.SONIC_CLEANER.cost).toBe(8000);
      expect(PROCESS_EQUIPMENT.INDUSTRIAL_CLEANER.cost).toBe(25000);
    });

    it('has increasing costs and unlock levels for cutting', () => {
      expect(PROCESS_EQUIPMENT.BASIC_CUTTER.cost).toBe(1000);
      expect(PROCESS_EQUIPMENT.PRECISION_CUTTER.cost).toBe(4000);
      expect(PROCESS_EQUIPMENT.DIAMOND_CUTTER.cost).toBe(15000);
      expect(PROCESS_EQUIPMENT.QUANTUM_CUTTER.cost).toBe(50000);
    });

    it('has increasing costs and unlock levels for faceting', () => {
      expect(PROCESS_EQUIPMENT.HAND_FACETER.cost).toBe(1500);
      expect(PROCESS_EQUIPMENT.AUTOMATIC_FACETER.cost).toBe(6000);
      expect(PROCESS_EQUIPMENT.MASTER_FACETER.cost).toBe(20000);
      expect(PROCESS_EQUIPMENT.BRILLIANCE_ENGINE.cost).toBe(60000);
    });

    it('has sonic_cleaner with autoMatrixRemoval effect', () => {
      const sonicCleaner = PROCESS_EQUIPMENT.SONIC_CLEANER;
      expect(sonicCleaner.effects.autoMatrixRemoval).toBe(true);
    });

    it('has industrial_cleaner with autoMatrixRemoval effect', () => {
      const industrialCleaner = PROCESS_EQUIPMENT.INDUSTRIAL_CLEANER;
      expect(industrialCleaner.effects.autoMatrixRemoval).toBe(true);
    });

    it('basic tumbler has zero bonuses', () => {
      const basicTumbler = PROCESS_EQUIPMENT.BASIC_TUMBLER;
      expect(basicTumbler.effects.idleSpeedBonus).toBe(0);
      expect(basicTumbler.effects.idleQualityBonus).toBe(0);
      expect(basicTumbler.effects.activeQualityBonus).toBe(0);
    });

    it('basic cutter has zero bonuses', () => {
      const basicCutter = PROCESS_EQUIPMENT.BASIC_CUTTER;
      expect(basicCutter.effects.cutSpeedBonus).toBe(0);
      expect(basicCutter.effects.cutQualityBonus).toBe(0);
      expect(basicCutter.effects.facetEfficiencyBonus).toBe(0);
    });

    it('basic faceter has zero bonuses', () => {
      const basicFaceter = PROCESS_EQUIPMENT.HAND_FACETER;
      expect(basicFaceter.effects.facetSpeedBonus).toBe(0);
      expect(basicFaceter.effects.facetQualityBonus).toBe(0);
      expect(basicFaceter.effects.brillianceBonus).toBe(0);
    });

    it('has 12 total equipment items', () => {
      expect(Object.keys(PROCESS_EQUIPMENT).length).toBe(12);
    });
  });

  describe('getProcessEquipmentById()', () => {
    it('returns correct equipment for valid cleaning id', () => {
      const equipment = getProcessEquipmentById('basic_tumbler');
      expect(equipment).toBeDefined();
      expect(equipment.id).toBe('basic_tumbler');
      expect(equipment.name).toBe('Basic Tumbler');
      expect(equipment.type).toBe('cleaning');
    });

    it('returns correct equipment for valid cutting id', () => {
      const equipment = getProcessEquipmentById('precision_cutter');
      expect(equipment).toBeDefined();
      expect(equipment.id).toBe('precision_cutter');
      expect(equipment.name).toBe('Precision Cutter');
      expect(equipment.type).toBe('cutting');
    });

    it('returns correct equipment for valid faceting id', () => {
      const equipment = getProcessEquipmentById('master_faceter');
      expect(equipment).toBeDefined();
      expect(equipment.id).toBe('master_faceter');
      expect(equipment.name).toBe('Master Faceter');
      expect(equipment.type).toBe('faceting');
    });

    it('returns null for invalid id', () => {
      const equipment = getProcessEquipmentById('nonexistent_equipment');
      expect(equipment).toBeNull();
    });

    it('returns null for empty string id', () => {
      const equipment = getProcessEquipmentById('');
      expect(equipment).toBeNull();
    });

    it('returns equipment with all expected properties', () => {
      const equipment = getProcessEquipmentById('diamond_cutter');
      expect(equipment).toHaveProperty('id');
      expect(equipment).toHaveProperty('name');
      expect(equipment).toHaveProperty('type');
      expect(equipment).toHaveProperty('description');
      expect(equipment).toHaveProperty('effects');
      expect(equipment).toHaveProperty('cost');
      expect(equipment).toHaveProperty('unlockLevel');
    });

    it('can find sonic cleaner by id', () => {
      const equipment = getProcessEquipmentById('sonic_cleaner');
      expect(equipment).toBeDefined();
      expect(equipment.cost).toBe(8000);
      expect(equipment.unlockLevel).toBe(15);
    });

    it('can find brilliance engine by id', () => {
      const equipment = getProcessEquipmentById('brilliance_engine');
      expect(equipment).toBeDefined();
      expect(equipment.cost).toBe(60000);
      expect(equipment.unlockLevel).toBe(50);
    });
  });

  describe('getOwnedProcessEquipment()', () => {
    it('returns empty array for empty ownedIds', () => {
      const owned = getOwnedProcessEquipment([]);
      expect(owned).toEqual([]);
    });

    it('returns single equipment for single owned id', () => {
      const owned = getOwnedProcessEquipment(['basic_tumbler']);
      expect(owned.length).toBe(1);
      expect(owned[0].id).toBe('basic_tumbler');
    });

    it('returns multiple equipment for multiple owned ids', () => {
      const owned = getOwnedProcessEquipment(['basic_tumbler', 'precision_cutter', 'hand_faceter']);
      expect(owned.length).toBe(3);
      const ids = owned.map(e => e.id);
      expect(ids).toContain('basic_tumbler');
      expect(ids).toContain('precision_cutter');
      expect(ids).toContain('hand_faceter');
    });

    it('filters out invalid ids', () => {
      const owned = getOwnedProcessEquipment(['basic_tumbler', 'invalid_id', 'hand_faceter']);
      expect(owned.length).toBe(2);
    });

    it('handles all equipment types', () => {
      const owned = getOwnedProcessEquipment([
        'basic_tumbler',
        'vibrating_tumbler',
        'sonic_cleaner',
        'industrial_cleaner',
        'basic_cutter',
        'precision_cutter',
        'diamond_cutter',
        'quantum_cutter',
        'hand_faceter',
        'automatic_faceter',
        'master_faceter',
        'brilliance_engine',
      ]);
      expect(owned.length).toBe(12);
    });

    it('returns equipment in order of ids provided', () => {
      const owned = getOwnedProcessEquipment(['hand_faceter', 'basic_tumbler', 'precision_cutter']);
      expect(owned[0].id).toBe('hand_faceter');
      expect(owned[1].id).toBe('basic_tumbler');
      expect(owned[2].id).toBe('precision_cutter');
    });
  });

  describe('getEquipmentForProcess()', () => {
    it('returns 4 cleaning equipment items', () => {
      const cleaningEquipment = getEquipmentForProcess('cleaning');
      expect(cleaningEquipment.length).toBe(4);
    });

    it('returns 4 cutting equipment items', () => {
      const cuttingEquipment = getEquipmentForProcess('cutting');
      expect(cuttingEquipment.length).toBe(4);
    });

    it('returns 4 faceting equipment items', () => {
      const facetingEquipment = getEquipmentForProcess('faceting');
      expect(facetingEquipment.length).toBe(4);
    });

    it('returns empty array for invalid process type', () => {
      const equipment = getEquipmentForProcess('invalid_process');
      expect(equipment).toEqual([]);
    });

    it('returns empty array for empty string process type', () => {
      const equipment = getEquipmentForProcess('');
      expect(equipment).toEqual([]);
    });

    it('cleaning equipment all have cleaning type', () => {
      const cleaningEquipment = getEquipmentForProcess('cleaning');
      cleaningEquipment.forEach(eq => {
        expect(eq.type).toBe('cleaning');
      });
    });

    it('cutting equipment all have cutting type', () => {
      const cuttingEquipment = getEquipmentForProcess('cutting');
      cuttingEquipment.forEach(eq => {
        expect(eq.type).toBe('cutting');
      });
    });

    it('faceting equipment all have faceting type', () => {
      const facetingEquipment = getEquipmentForProcess('faceting');
      facetingEquipment.forEach(eq => {
        expect(eq.type).toBe('faceting');
      });
    });

    it('returns cleaning equipment sorted by unlock level', () => {
      const cleaningEquipment = getEquipmentForProcess('cleaning');
      for (let i = 1; i < cleaningEquipment.length; i++) {
        expect(cleaningEquipment[i].unlockLevel).toBeGreaterThanOrEqual(
          cleaningEquipment[i - 1].unlockLevel
        );
      }
    });

    it('returns cutting equipment sorted by unlock level', () => {
      const cuttingEquipment = getEquipmentForProcess('cutting');
      for (let i = 1; i < cuttingEquipment.length; i++) {
        expect(cuttingEquipment[i].unlockLevel).toBeGreaterThanOrEqual(
          cuttingEquipment[i - 1].unlockLevel
        );
      }
    });

    it('returns faceting equipment sorted by unlock level', () => {
      const facetingEquipment = getEquipmentForProcess('faceting');
      for (let i = 1; i < facetingEquipment.length; i++) {
        expect(facetingEquipment[i].unlockLevel).toBeGreaterThanOrEqual(
          facetingEquipment[i - 1].unlockLevel
        );
      }
    });
  });

  describe('getAvailableProcessEquipment()', () => {
    it('returns basic tumbler at level 1', () => {
      const available = getAvailableProcessEquipment(1);
      const ids = available.map(e => e.id);
      expect(ids).toContain('basic_tumbler');
    });

    it('returns cleaning equipment up to vibrating tumbler at level 5', () => {
      const available = getAvailableProcessEquipment(5);
      const ids = available.map(e => e.id);
      expect(ids).toContain('basic_tumbler');
      expect(ids).toContain('vibrating_tumbler');
      expect(ids).not.toContain('sonic_cleaner');
    });

    it('returns sonic_cleaner at level 15', () => {
      const available = getAvailableProcessEquipment(15);
      const ids = available.map(e => e.id);
      expect(ids).toContain('sonic_cleaner');
    });

    it('returns all equipment at level 50', () => {
      const available = getAvailableProcessEquipment(50);
      expect(available.length).toBe(12);
    });

    it('returns empty array at level 0', () => {
      const available = getAvailableProcessEquipment(0);
      expect(available).toEqual([]);
    });

    it('excludes equipment above player level', () => {
      const available = getAvailableProcessEquipment(10);
      const ids = available.map(e => e.id);
      expect(ids).not.toContain('sonic_cleaner');
      expect(ids).not.toContain('industrial_cleaner');
      expect(ids).not.toContain('diamond_cutter');
      expect(ids).not.toContain('brilliance_engine');
    });

    it('includes basic equipment at level 1', () => {
      const available = getAvailableProcessEquipment(1);
      const ids = available.map(e => e.id);
      expect(ids).toContain('basic_tumbler');
      expect(ids).toContain('basic_cutter');
      expect(ids).toContain('hand_faceter');
    });
  });

  describe('canAffordProcessEquipment()', () => {
    it('returns true when player has enough coins', () => {
      const canAfford = canAffordProcessEquipment(5000, 'vibrating_tumbler');
      expect(canAfford).toBe(true);
    });

    it('returns true when player has exactly the required coins', () => {
      const canAfford = canAffordProcessEquipment(500, 'basic_tumbler');
      expect(canAfford).toBe(true);
    });

    it('returns false when player has insufficient coins', () => {
      const canAfford = canAffordProcessEquipment(100, 'basic_tumbler');
      expect(canAfford).toBe(false);
    });

    it('returns false for invalid equipment id', () => {
      const canAfford = canAffordProcessEquipment(100000, 'invalid_equipment');
      expect(canAfford).toBe(false);
    });

    it('handles expensive equipment correctly', () => {
      expect(canAffordProcessEquipment(59999, 'brilliance_engine')).toBe(false);
      expect(canAffordProcessEquipment(60000, 'brilliance_engine')).toBe(true);
      expect(canAffordProcessEquipment(60001, 'brilliance_engine')).toBe(true);
    });

    it('returns true for cheap equipment with many coins', () => {
      const canAfford = canAffordProcessEquipment(100000, 'basic_tumbler');
      expect(canAfford).toBe(true);
    });

    it('works for cutting equipment', () => {
      expect(canAffordProcessEquipment(999, 'precision_cutter')).toBe(false);
      expect(canAffordProcessEquipment(4000, 'precision_cutter')).toBe(true);
    });

    it('works for faceting equipment', () => {
      expect(canAffordProcessEquipment(5999, 'automatic_faceter')).toBe(false);
      expect(canAffordProcessEquipment(6000, 'automatic_faceter')).toBe(true);
    });

    it('returns false for empty string id', () => {
      const canAfford = canAffordProcessEquipment(100000, '');
      expect(canAfford).toBe(false);
    });
  });
});

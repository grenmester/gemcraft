import { describe, it, expect } from 'vitest';
import { checkLocationRequirements, getRequirementIcon } from '../requirements';

describe('checkLocationRequirements', () => {
  it('returns met: false when location is null', () => {
    const result = checkLocationRequirements(null, { shiftPoints: 0 });
    expect(result.met).toBe(false);
    expect(result.requirements).toEqual([]);
  });

  it('returns met: false when playerState is null', () => {
    const result = checkLocationRequirements({ unlockLevel: 1 }, null);
    expect(result.met).toBe(false);
    expect(result.requirements).toEqual([]);
  });

  it('returns met: true when player level meets requirement', () => {
    const location = { unlockLevel: 2 };
    const playerState = { shiftPoints: 200 }; // Level 2
    const result = checkLocationRequirements(location, playerState);
    expect(result.met).toBe(true);
    expect(result.requirements[0]).toMatchObject({
      type: 'level',
      needed: 2,
      current: 2,
      met: true
    });
  });

  it('returns met: false when player level is insufficient', () => {
    const location = { unlockLevel: 3 };
    const playerState = { shiftPoints: 150 }; // Level 1
    const result = checkLocationRequirements(location, playerState);
    expect(result.met).toBe(false);
    expect(result.requirements[0].met).toBe(false);
  });

  it('checks equipment requirement when present', () => {
    const location = { unlockLevel: 1, requiredEquipment: 'pickaxe' };
    const playerState = { shiftPoints: 100, equipment: ['pickaxe'] };
    const result = checkLocationRequirements(location, playerState);
    expect(result.met).toBe(true);
    expect(result.requirements[1]).toMatchObject({
      type: 'equipment',
      equipmentId: 'pickaxe',
      met: true
    });
  });

  it('returns met: false when player lacks required equipment', () => {
    const location = { unlockLevel: 1, requiredEquipment: 'drill' };
    const playerState = { shiftPoints: 100, equipment: ['pickaxe'] };
    const result = checkLocationRequirements(location, playerState);
    expect(result.met).toBe(false);
    expect(result.requirements[1].met).toBe(false);
  });

  it('handles player with no equipment array', () => {
    const location = { unlockLevel: 1, requiredEquipment: 'drill' };
    const playerState = { shiftPoints: 100 };
    const result = checkLocationRequirements(location, playerState);
    expect(result.met).toBe(false);
  });

  it('handles player with no shiftPoints', () => {
    const location = { unlockLevel: 1 };
    const playerState = {};
    const result = checkLocationRequirements(location, playerState);
    expect(result.met).toBe(false);
    expect(result.requirements[0].current).toBe(0);
  });
});

describe('getRequirementIcon', () => {
  it('returns star icon for level type', () => {
    expect(getRequirementIcon('level')).toBe('⭐');
  });

  it('returns wrench icon for equipment type', () => {
    expect(getRequirementIcon('equipment')).toBe('🔧');
  });

  it('returns diamond icon for resource type', () => {
    expect(getRequirementIcon('resource')).toBe('💎');
  });

  it('returns timer icon for time type', () => {
    expect(getRequirementIcon('time')).toBe('⏱️');
  });

  it('returns target icon for score type', () => {
    expect(getRequirementIcon('score')).toBe('🎯');
  });

  it('returns clipboard icon for unknown type', () => {
    expect(getRequirementIcon('unknown')).toBe('📋');
  });

  it('returns clipboard icon when type is undefined', () => {
    expect(getRequirementIcon(undefined)).toBe('📋');
  });
});

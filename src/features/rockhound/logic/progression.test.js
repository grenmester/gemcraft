import { describe, it, expect } from 'vitest';
import {
  reputationTier, familiarityFactor, FAMILIARITY_BONUS,
  localitySetComplete, completedLocalityIds,
  familyComplete, completedFamilies,
  isLocalityUnlocked, earnedGear, describeGate
} from './progression.js';
import { species, speciesById } from '../../../loaders/species.js';
import { localities, localitiesById } from '../../../loaders/localities.js';

describe('reputationTier', () => {
  it('maps reputation to the highest reached tier', () => {
    expect(reputationTier(0)).toBe(0);
    expect(reputationTier(49)).toBe(0);
    expect(reputationTier(50)).toBe(1);
    expect(reputationTier(120)).toBe(2);
    expect(reputationTier(9999)).toBe(4);
  });
});

describe('familiarityFactor', () => {
  it('boosts a completed family, leaves others at 1', () => {
    expect(familiarityFactor('quartz', ['quartz'])).toBeCloseTo(1 + FAMILIARITY_BONUS, 5);
    expect(familiarityFactor('corundum', ['quartz'])).toBe(1);
  });
});

describe('set completion', () => {
  it('detects a completed locality find pool', () => {
    const pool = localitiesById.hidden_creek.findPool.map((e) => e.species);
    expect(localitySetComplete(localitiesById.hidden_creek, new Set(pool))).toBe(true);
    expect(localitySetComplete(localitiesById.hidden_creek, new Set(['quartz']))).toBe(false);
  });
  it('lists fully-collected localities', () => {
    const creekPool = localitiesById.hidden_creek.findPool.map((e) => e.species);
    expect(completedLocalityIds(localities, creekPool)).toContain('hidden_creek');
    expect(completedLocalityIds(localities, [])).toEqual([]);
  });
  it('detects a completed family', () => {
    const quartzIds = species.filter((s) => s.family === 'quartz').map((s) => s.id);
    expect(familyComplete('quartz', species, new Set(quartzIds))).toBe(true);
    expect(familyComplete('quartz', species, new Set(['quartz']).valueOf())).toBe(false);
    expect(completedFamilies(species, quartzIds)).toContain('quartz');
  });
});

describe('gate evaluation', () => {
  const baseCtx = { reputation: 0, gear: [], completedLocalities: [], completedFamilies: [] };

  it('unlocks a starter locality with an empty gate', () => {
    expect(isLocalityUnlocked(localitiesById.hidden_creek, baseCtx)).toBe(true);
  });
  it('keeps a gear-gated locality locked until the gear is owned', () => {
    expect(isLocalityUnlocked(localitiesById.gravel_bar, baseCtx)).toBe(false); // needs sieve
    expect(isLocalityUnlocked(localitiesById.gravel_bar, { ...baseCtx, gear: ['sieve'] })).toBe(true);
  });
  it('opens a setComplete-gated locality when the set is done', () => {
    expect(isLocalityUnlocked(localitiesById.amethyst_vug, baseCtx)).toBe(false);
    expect(isLocalityUnlocked(localitiesById.amethyst_vug, { ...baseCtx, completedLocalities: ['hidden_creek'] })).toBe(true);
  });
  it('opens an anyOf locality via either branch', () => {
    // old_quarry: anyOf [reputation tier 2, gear rock_hammer]
    expect(isLocalityUnlocked(localitiesById.old_quarry, baseCtx)).toBe(false);
    expect(isLocalityUnlocked(localitiesById.old_quarry, { ...baseCtx, reputation: 120 })).toBe(true);
    expect(isLocalityUnlocked(localitiesById.old_quarry, { ...baseCtx, gear: ['rock_hammer'] })).toBe(true);
  });
});

describe('earnedGear milestones', () => {
  it('grants sieve at reputation tier 1 and rock_hammer on the creek set', () => {
    expect(earnedGear({ reputation: 0, gear: [], completedLocalities: [], completedFamilies: [] })).toEqual([]);
    expect(earnedGear({ reputation: 50, gear: [], completedLocalities: [], completedFamilies: [] })).toContain('sieve');
    expect(earnedGear({ reputation: 0, gear: [], completedLocalities: ['hidden_creek'], completedFamilies: [] })).toContain('rock_hammer');
  });
});

describe('describeGate', () => {
  it('produces a non-empty hint for a gated locality', () => {
    expect(describeGate(localitiesById.gravel_bar.unlockGate).length).toBeGreaterThan(0);
    expect(describeGate(localitiesById.hidden_creek.unlockGate)).toMatch(/open|available|unlocked/i);
  });
});

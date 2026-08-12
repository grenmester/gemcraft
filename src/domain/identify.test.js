import { describe, it, expect } from 'vitest';
import { seedCandidates } from './candidates.js';
import { identifyReward } from './identifyResult.js';
import { speciesById } from '../data/species/loader.js';
import { localitiesById } from '../data/localities/loader.js';

describe('seedCandidates', () => {
  it('returns the unique find-pool species for a locality', () => {
    const c = seedCandidates(localitiesById.hidden_creek);
    expect([...c].sort()).toEqual(['almandine_garnet', 'quartz', 'sapphire', 'topaz']);
  });
});

describe('identifyReward', () => {
  it('scales with rarity', () => {
    expect(identifyReward(speciesById.quartz)).toBe(5);      // Common
    expect(identifyReward(speciesById.sapphire)).toBe(35);   // Epic
  });
});

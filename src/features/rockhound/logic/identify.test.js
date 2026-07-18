import { describe, it, expect } from 'vitest';
import { seedCandidates } from './candidates.js';
import { identifyReward, commitIdentification } from './identifyResult.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';
import { createRough } from './rollRough.js';

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

describe('commitIdentification', () => {
  const rough = createRough(
    { trueSpeciesId: 'sapphire', caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'hidden_creek' },
    () => 'i1'
  );
  it('marks a correct guess as identified', () => {
    const { correct, specimen } = commitIdentification(rough, 'sapphire');
    expect(correct).toBe(true);
    expect(specimen.stage).toBe('identified');
    expect(specimen.identifiedAs).toBe('sapphire');
  });
  it('leaves a wrong guess as rough for retry', () => {
    const { correct, specimen } = commitIdentification(rough, 'quartz');
    expect(correct).toBe(false);
    expect(specimen.stage).toBe('rough');
    expect(specimen.identifiedAs).toBe('quartz');
  });
});

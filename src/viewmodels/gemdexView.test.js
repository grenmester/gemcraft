import { describe, it, expect } from 'vitest';
import { familyGroups, localitiesForSpecies, collectionProgress } from './gemdexView.js';

const SPECIES = [
  { id: 'quartz', family: 'quartz' },
  { id: 'ruby', family: 'corundum' },
  { id: 'amethyst', family: 'quartz' },
  { id: 'sapphire', family: 'corundum' }
];

const LOCALITIES = [
  { id: 'creek', findPool: [{ species: 'quartz' }, { species: 'sapphire' }] },
  { id: 'mogok', findPool: [{ species: 'ruby' }, { species: 'sapphire' }] }
];

describe('familyGroups', () => {
  it('groups members by family in first-appearance order', () => {
    const groups = familyGroups(SPECIES, []);
    expect(groups.map((g) => g.family)).toEqual(['quartz', 'corundum']);
    expect(groups[0].members.map((m) => m.id)).toEqual(['quartz', 'amethyst']);
  });

  it('counts discovered members and flags a complete family', () => {
    const groups = familyGroups(SPECIES, ['ruby', 'sapphire', 'quartz']);
    const quartz = groups.find((g) => g.family === 'quartz');
    const corundum = groups.find((g) => g.family === 'corundum');
    expect(quartz).toMatchObject({ discovered: 1, total: 2, complete: false });
    expect(corundum).toMatchObject({ discovered: 2, total: 2, complete: true });
  });

  it('treats an empty gemdex as nothing discovered', () => {
    expect(familyGroups(SPECIES, []).every((g) => g.discovered === 0)).toBe(true);
  });
});

describe('localitiesForSpecies', () => {
  it('returns every locality whose find pool contains the species', () => {
    expect(localitiesForSpecies(LOCALITIES, 'sapphire').map((l) => l.id)).toEqual(['creek', 'mogok']);
  });

  it('returns an empty list for a species nothing pools', () => {
    expect(localitiesForSpecies(LOCALITIES, 'diamond')).toEqual([]);
  });
});

describe('collectionProgress', () => {
  it('counts discovered against the full roster', () => {
    expect(collectionProgress(SPECIES, ['ruby', 'ruby'])).toEqual({ discovered: 1, total: 4 });
  });

  it('ignores gemdex entries not in the roster', () => {
    expect(collectionProgress(SPECIES, ['ghost'])).toEqual({ discovered: 0, total: 4 });
  });
});

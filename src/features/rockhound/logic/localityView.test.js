import { describe, it, expect } from 'vitest';
import {
  findPoolView, rarityCeiling, localitySetProgress, localitiesGatedBy, titleizeWords,
  requirementText
} from './localityView.js';

const SPECIES_BY_ID = {
  quartz: { id: 'quartz', name: 'Clear Quartz', rarity: 'Common' },
  sapphire: { id: 'sapphire', name: 'Sapphire', rarity: 'Epic' },
  topaz: { id: 'topaz', name: 'Topaz', rarity: 'Rare' }
};

const CREEK = {
  id: 'creek',
  findPool: [
    { species: 'quartz', weight: 50 },
    { species: 'sapphire', weight: 20 },
    { species: 'topaz', weight: 5 }
  ]
};

describe('findPoolView', () => {
  it('names discovered species and silhouettes undiscovered ones', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, ['quartz']);
    expect(view[0]).toMatchObject({ speciesId: 'quartz', name: 'Clear Quartz', discovered: true });
    expect(view[1]).toMatchObject({ speciesId: 'sapphire', name: null, discovered: false });
  });

  it('withholds rarity the same way it withholds the name (spoiler rule)', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, ['quartz']);
    expect(view[0]).toMatchObject({ speciesId: 'quartz', rarity: 'Common', discovered: true });
    expect(view[1]).toMatchObject({ speciesId: 'sapphire', rarity: null, discovered: false });
  });

  it('orders the pool by descending weight', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    expect(view.map((e) => e.speciesId)).toEqual(['quartz', 'sapphire', 'topaz']);
  });

  it('reports each species chance as an exact percentage of the pool', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    // total 75: 50 -> 66.7%, 20 -> 26.7%, 5 -> 6.7%
    expect(view.map((e) => e.chance)).toEqual(['66.7%', '26.7%', '6.7%']);
    // the raw authoring weight stays internal
    view.forEach((e) => expect(e.weight).toBeUndefined());
  });

  it('drops the decimal when the odds are a whole percent', () => {
    const flat = { findPool: [{ species: 'quartz', weight: 1 }, { species: 'sapphire', weight: 3 }] };
    expect(findPoolView(flat, SPECIES_BY_ID, []).map((e) => e.chance)).toEqual(['75%', '25%']);
  });

  it('percentages across a pool sum to 100', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    const sum = view.reduce((t, e) => t + parseFloat(e.chance), 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.15);
  });
});

describe('rarityCeiling', () => {
  it('reports the highest rarity in the pool', () => {
    expect(rarityCeiling(CREEK, SPECIES_BY_ID)).toBe('Epic');
  });

  it('ignores species missing from the roster', () => {
    const pool = { findPool: [{ species: 'quartz', weight: 1 }, { species: 'ghost', weight: 1 }] };
    expect(rarityCeiling(pool, SPECIES_BY_ID)).toBe('Common');
  });
});

describe('localitySetProgress', () => {
  it('counts discovered pool species', () => {
    expect(localitySetProgress(CREEK, ['quartz', 'topaz'])).toEqual({ found: 2, total: 3, complete: false });
  });

  it('flags a complete set', () => {
    expect(localitySetProgress(CREEK, ['quartz', 'sapphire', 'topaz'])).toEqual({ found: 3, total: 3, complete: true });
  });

  it('ignores gemdex ids outside the pool', () => {
    expect(localitySetProgress(CREEK, ['diamond'])).toEqual({ found: 0, total: 3, complete: false });
  });
});

describe('localitiesGatedBy', () => {
  const LOCALITIES = [
    { id: 'creek', unlockGate: {} },
    { id: 'vug', unlockGate: { allOf: [{ type: 'setComplete', setType: 'locality', id: 'creek' }] } },
    { id: 'quarry', unlockGate: { anyOf: [{ type: 'reputation', tier: 2 }, { type: 'gear', id: 'rock_hammer' }] } },
    {
      id: 'pipe',
      unlockGate: {
        allOf: [
          { type: 'reputation', tier: 4 },
          { anyOf: [{ type: 'setComplete', setType: 'locality', id: 'creek' }] }
        ]
      }
    },
    { id: 'other', unlockGate: { allOf: [{ type: 'setComplete', setType: 'family', id: 'creek' }] } }
  ];

  it('finds localities whose gate needs this locality set, including nested gates', () => {
    expect(localitiesGatedBy(LOCALITIES, 'creek').map((l) => l.id)).toEqual(['vug', 'pipe']);
  });

  it('does not confuse a family set with a locality set of the same id', () => {
    expect(localitiesGatedBy(LOCALITIES, 'creek').map((l) => l.id)).not.toContain('other');
  });

  it('returns an empty list when nothing depends on it', () => {
    expect(localitiesGatedBy(LOCALITIES, 'quarry')).toEqual([]);
  });
});

describe('titleizeWords', () => {
  it('turns snake_case into title case', () => {
    expect(titleizeWords('north_america')).toBe('North America');
    expect(titleizeWords('pyrope_garnet')).toBe('Pyrope Garnet');
  });
});

describe('requirementText', () => {
  // The locality card and the field guide both render this string; it lives
  // here, once, so they can never drift from each other.
  it('names the unmet requirement, locked', () => {
    const gate = { allOf: [{ type: 'gear', id: 'sieve' }] };
    expect(requirementText(gate, false)).toBe('🔒 Needs the sieve');
  });

  it('names the satisfied requirement as a noun phrase, unlocked', () => {
    const gate = { allOf: [{ type: 'gear', id: 'sieve' }] };
    expect(requirementText(gate, true)).toBe('✓ Unlocked with the sieve');
  });

  it('reads as always-open for an empty gate, unlocked', () => {
    expect(requirementText({}, true)).toBe('✓ Open from the start');
  });
});

import { describe, it, expect } from 'vitest';
import {
  findPoolView, rarityCeiling, localitySetProgress, localitiesGatedBy, titleizeWords
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

  it('orders the pool by descending weight', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    expect(view.map((e) => e.speciesId)).toEqual(['quartz', 'sapphire', 'topaz']);
  });

  it('describes frequency in words rather than raw weights', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    // 50/75 = 0.67 -> common; 20/75 = 0.27 -> uncommon; 5/75 = 0.07 -> rare
    expect(view.map((e) => e.frequency)).toEqual(['common here', 'uncommon here', 'rare here']);
    view.forEach((e) => expect(e.weight).toBeUndefined());
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

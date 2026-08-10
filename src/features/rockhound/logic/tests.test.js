import { describe, it, expect } from 'vitest';
import { bandWidth, BASE_ERROR, HAND_LIVE_PLAY, AUTO_LIVE_PLAY } from './precision.js';
import { runTest, TEST_DEFS, consistentWithSpecies, consistentSpecies } from './tests.js';
import { speciesById } from '../../../loaders/species.js';
import { familiarityFactor } from './progression.js';

describe('precision', () => {
  it('narrows the band as mastery rises', () => {
    const low = bandWidth({ property: 'hardness', mastery: 10, livePlay: 0.6 });
    const high = bandWidth({ property: 'hardness', mastery: 100, livePlay: 1.0 });
    expect(high).toBeLessThan(low);
    expect(high).toBeCloseTo(BASE_ERROR.hardness, 5); // mastery 1, all factors 1
  });
});

describe('runTest + consistency', () => {
  const ids = ['quartz', 'topaz', 'sapphire']; // colorless look-alikes: 7 / 8 / 9

  it('a sharp scratch test on sapphire narrows the pool to sapphire alone', () => {
    const reading = runTest('scratch', speciesById.sapphire, { mastery: 100, livePlay: 1.0 });
    const survivors = consistentSpecies(ids, speciesById, [reading]);
    expect(survivors).toEqual(['sapphire']);
  });

  it('a fuzzy scratch test narrows nothing', () => {
    const reading = runTest('scratch', speciesById.sapphire, { mastery: 10, livePlay: 0.6 });
    const survivors = consistentSpecies(ids, speciesById, [reading]);
    expect(survivors).toEqual(ids);
  });

  it('the true species always stays consistent with its own reading', () => {
    const reading = runTest('heft', speciesById.topaz, { mastery: 100, livePlay: 1.0 });
    expect(consistentWithSpecies(speciesById.topaz, reading)).toBe(true);
  });

  it('UV is categorical: fluorite (fluorescent) is separated from inert quartz', () => {
    const reading = runTest('uv', speciesById.fluorite, { mastery: 50, livePlay: 0.8 });
    const survivors = consistentSpecies(['quartz', 'amethyst', 'fluorite'], speciesById, [reading]);
    expect(survivors).toEqual(['fluorite']);
  });

  it('exposes the three slice tests', () => {
    expect(Object.keys(TEST_DEFS).sort()).toEqual(['heft', 'scratch', 'uv']);
  });
});

describe('runTest familiarity', () => {
  it('a familiar family narrows the band (and the surviving pool) more than an unfamiliar one', () => {
    // topaz(8) vs sapphire(9): at mastery 40, livePlay 0.8, familiarity sharpens the band
    const ids = ['topaz', 'sapphire'];
    const plain = runTest('scratch', speciesById.sapphire, { mastery: 40, livePlay: 0.8, familiarity: 1 });
    const familiar = runTest('scratch', speciesById.sapphire, { mastery: 40, livePlay: 0.8, familiarity: familiarityFactor('corundum', ['corundum']) });
    expect(familiar.band).toBeLessThan(plain.band);
    // the sharper familiar reading narrows out topaz; assert it is at least as discriminating
    expect(consistentSpecies(ids, speciesById, [familiar]).length).toBeLessThanOrEqual(consistentSpecies(ids, speciesById, [plain]).length);
  });
});

describe('consistency', () => {
  it('accepts a species whose value sits inside the band, and rejects one outside', () => {
    const reading = { kind: 'numeric', property: 'hardness', center: 9, band: 0.5 };
    expect(consistentWithSpecies(speciesById.ruby, reading)).toBe(true);      // hardness 9
    expect(consistentWithSpecies(speciesById.quartz, reading)).toBe(false);   // hardness 7
  });

  it('accepts a value exactly on the band edge', () => {
    // A stone must never be excluded by a reading it sits precisely at.
    const reading = { kind: 'numeric', property: 'hardness', center: 7.5, band: 0.5 };
    expect(consistentWithSpecies(speciesById.quartz, reading)).toBe(true);
  });

  it('requires an exact match on a categorical reading', () => {
    const inert = { kind: 'categorical', property: 'fluorescence', key: 'inert' };
    expect(consistentWithSpecies(speciesById.quartz, inert)).toBe(true);
    expect(consistentWithSpecies(speciesById.ruby, inert)).toBe(false);       // red under LW
  });

  it('accepts a hue the species can show, and rejects one it cannot', () => {
    const red = { kind: 'hue', value: 'red' };
    expect(consistentWithSpecies(speciesById.ruby, red)).toBe(true);
    expect(consistentWithSpecies(speciesById.aquamarine, red)).toBe(false);
  });

  it('matches transparency exactly — this is what separates opal from obsidian', () => {
    const translucent = { kind: 'transparency', value: 'translucent' };
    expect(consistentWithSpecies(speciesById.opal, translucent)).toBe(true);
    expect(consistentWithSpecies(speciesById.obsidian, translucent)).toBe(false);
  });
});

describe('consistentSpecies', () => {
  const pool = ['ruby', 'sapphire', 'spinel', 'tanzanite'];

  it('returns the whole pool when nothing has been observed', () => {
    expect(consistentSpecies(pool, speciesById, []).sort()).toEqual([...pool].sort());
  });

  it('narrows as observations accumulate', () => {
    const red = [{ kind: 'hue', value: 'red' }];
    const narrowed = consistentSpecies(pool, speciesById, red);
    // Ruby and spinel are both red — the classic confusion. Sight alone
    // must not resolve this.
    expect(narrowed).toContain('ruby');
    expect(narrowed).toContain('spinel');
    expect(narrowed).not.toContain('tanzanite');
  });

  it('resolves to one when the readings are decisive', () => {
    const readings = [
      { kind: 'hue', value: 'red' },
      { kind: 'numeric', property: 'specificGravity', center: 4.0, band: 0.3 }
    ];
    // Spinel's SG is 3.6, outside the band around corundum's 4.0.
    expect(consistentSpecies(pool, speciesById, readings)).toEqual(['ruby']);
  });
});

describe('precision constants', () => {
  it('rewards working by hand over the shortcut', () => {
    expect(HAND_LIVE_PLAY).toBeGreaterThan(AUTO_LIVE_PLAY);
  });

  it('produces a narrower band by hand than by shortcut', () => {
    const byHand = bandWidth({ property: 'hardness', mastery: 50, livePlay: HAND_LIVE_PLAY });
    const auto = bandWidth({ property: 'hardness', mastery: 50, livePlay: AUTO_LIVE_PLAY });
    expect(byHand).toBeLessThan(auto);
  });
});

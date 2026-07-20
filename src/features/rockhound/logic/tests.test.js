import { describe, it, expect } from 'vitest';
import { bandWidth, livePlayFromRng, BASE_ERROR } from './precision.js';
import { runTest, survivesReading, eliminate, TEST_DEFS } from './tests.js';
import { speciesById } from '../../../loaders/species.js';
import { familiarityFactor } from './progression.js';

describe('precision', () => {
  it('narrows the band as mastery rises', () => {
    const low = bandWidth({ property: 'hardness', mastery: 10, livePlay: 0.6 });
    const high = bandWidth({ property: 'hardness', mastery: 100, livePlay: 1.0 });
    expect(high).toBeLessThan(low);
    expect(high).toBeCloseTo(BASE_ERROR.hardness, 5); // mastery 1, all factors 1
  });
  it('maps rng into the [0.6, 1.0] live-play range', () => {
    expect(livePlayFromRng(() => 0)).toBeCloseTo(0.6, 5);
    expect(livePlayFromRng(() => 1)).toBeCloseTo(1.0, 5);
  });
});

describe('runTest + elimination', () => {
  const ids = ['quartz', 'topaz', 'sapphire']; // colorless look-alikes: 7 / 8 / 9

  it('a sharp scratch test on sapphire eliminates quartz and topaz', () => {
    const reading = runTest('scratch', speciesById.sapphire, { mastery: 100, livePlay: 1.0 });
    const survivors = eliminate(ids, speciesById, reading);
    expect(survivors).toEqual(['sapphire']);
  });

  it('a fuzzy scratch test eliminates nothing', () => {
    const reading = runTest('scratch', speciesById.sapphire, { mastery: 10, livePlay: 0.6 });
    const survivors = eliminate(ids, speciesById, reading);
    expect(survivors).toEqual(ids);
  });

  it('the true species always survives its own reading', () => {
    const reading = runTest('heft', speciesById.topaz, { mastery: 100, livePlay: 1.0 });
    expect(survivesReading(speciesById.topaz, reading)).toBe(true);
  });

  it('UV is categorical: fluorite (fluorescent) is separated from inert quartz', () => {
    const reading = runTest('uv', speciesById.fluorite, { mastery: 50, livePlay: 0.8 });
    const survivors = eliminate(['quartz', 'amethyst', 'fluorite'], speciesById, reading);
    expect(survivors).toEqual(['fluorite']);
  });

  it('exposes the three slice tests', () => {
    expect(Object.keys(TEST_DEFS).sort()).toEqual(['heft', 'scratch', 'uv']);
  });
});

describe('runTest familiarity', () => {
  it('a familiar family narrows the band (eliminates more) than an unfamiliar one', () => {
    // topaz(8) vs sapphire(9): at mastery 40, livePlay 0.8, familiarity sharpens the band
    const ids = ['topaz', 'sapphire'];
    const plain = runTest('scratch', speciesById.sapphire, { mastery: 40, livePlay: 0.8, familiarity: 1 });
    const familiar = runTest('scratch', speciesById.sapphire, { mastery: 40, livePlay: 0.8, familiarity: familiarityFactor('corundum', ['corundum']) });
    expect(familiar.band).toBeLessThan(plain.band);
    // the sharper familiar reading eliminates topaz; assert it is at least as discriminating
    expect(eliminate(ids, speciesById, familiar).length).toBeLessThanOrEqual(eliminate(ids, speciesById, plain).length);
  });
});

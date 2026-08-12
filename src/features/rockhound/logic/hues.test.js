import { describe, it, expect } from 'vitest';
import { hueOf, huesForSpecies, HUE_BY_COLOUR } from './hues.js';
import { species, speciesById } from '../../../data/species/loader.js';

describe('hueOf', () => {
  it('collapses shades of one colour onto a single hue', () => {
    // What an untrained eye reports is "red", not "pinkish-red".
    expect(hueOf('red')).toBe('red');
    expect(hueOf('pinkish-red')).toBe('red');
    expect(hueOf('brownish-red')).toBe('red');
  });

  it('keeps genuinely different colours apart', () => {
    expect(hueOf('blue')).not.toBe(hueOf('green'));
    expect(hueOf('purple')).not.toBe(hueOf('red'));
  });

  it('maps every colour word in the roster', () => {
    // An unmapped word would make a species unobservable.
    for (const s of species) {
      for (const c of s.colors) {
        expect(HUE_BY_COLOUR[c], `unmapped colour word: ${c}`).toBeDefined();
      }
    }
  });
});

describe('huesForSpecies', () => {
  it('dedupes shades that collapse to the same hue', () => {
    // Ruby is red and pinkish-red — one hue, not two.
    expect(huesForSpecies(speciesById.ruby)).toEqual(['red']);
  });

  it('keeps a species that really does appear in several hues', () => {
    expect(huesForSpecies(speciesById.sapphire).length).toBeGreaterThan(1);
  });

  it('is sorted, so two callers never disagree on order', () => {
    const h = huesForSpecies(speciesById.sapphire);
    expect(h).toEqual([...h].sort());
  });
});

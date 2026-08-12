import { describe, it, expect } from 'vitest';
import { revealedReadings, mergeReading, isRevealed } from './traits.js';
import { speciesById } from '../data/species/loader.js';

const wide = { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 1.0 };
const tight = { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.3 };

describe('mergeReading', () => {
  it('records a trait measured for the first time', () => {
    expect(isRevealed(mergeReading({}, wide), 'scratch')).toBe(true);
  });

  it('keeps the narrower reading when a trait is measured again', () => {
    // Re-measuring with better mastery should improve what you know.
    expect(mergeReading({ scratch: wide }, tight).scratch.band).toBe(0.3);
  });

  it('never lets a sloppier reading undo a careful one', () => {
    // Otherwise a stone could become less resolved than it already was.
    expect(mergeReading({ scratch: tight }, wide).scratch.band).toBe(0.3);
  });

  it('does not mutate the record it was given', () => {
    const before = { scratch: tight };
    mergeReading(before, wide);
    expect(before.scratch.band).toBe(0.3);
  });

  it('replaces a categorical reading, which has no band to compare', () => {
    // A categorical reading is exact — there is no "narrower" version of it, so
    // re-measuring simply replaces it. Without this the band comparison would
    // have to cope with undefined on both sides.
    const inert = { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'inert' };
    const red = { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'red/none' };
    expect(mergeReading({ uv: inert }, red).uv.key).toBe('red/none');
  });

  it('keeps a numeric reading recorded under a different trait untouched', () => {
    // Merging one trait must never disturb another.
    const merged = mergeReading({ scratch: tight }, { testId: 'uv', kind: 'categorical', key: 'inert' });
    expect(merged.scratch).toBe(tight);
    expect(merged.uv.key).toBe('inert');
  });
});

describe('revealedReadings', () => {
  const stone = { hue: 'red', trueSpeciesId: 'ruby', revealed: {} };

  it('always includes the two free observations', () => {
    const kinds = revealedReadings(stone, speciesById.ruby).map((r) => r.kind);
    expect(kinds).toContain('hue');
    expect(kinds).toContain('transparency');
  });

  it('reads transparency from the species, since it is not rolled per stone', () => {
    const t = revealedReadings(stone, speciesById.ruby).find((r) => r.kind === 'transparency');
    expect(t.value).toBe(speciesById.ruby.transparency);
  });

  it('includes measured readings alongside the free ones', () => {
    const measured = { ...stone, revealed: { scratch: tight } };
    expect(revealedReadings(measured, speciesById.ruby)).toHaveLength(3);
  });

  it('omits an unknown hue rather than filtering every species out', () => {
    // Specimens saved before hues existed carry 'unknown'; treating that as a
    // real observation would make them permanently unidentifiable.
    const legacy = { ...stone, hue: 'unknown' };
    expect(revealedReadings(legacy, speciesById.ruby).some((r) => r.kind === 'hue')).toBe(false);
  });
});

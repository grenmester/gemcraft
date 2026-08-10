import { describe, it, expect } from 'vitest';
import { traitPanel } from './identifyView.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

// foundDepth 3 is not incidental: ruby has minDepth 3 at Mogok Marble, so a
// depth-1 ruby there is a stone that cannot exist — and seedCandidates would
// drop ruby from its own candidate pool, making every assertion below test
// the wrong thing while still looking plausible.
const stone = (over = {}) => ({
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble',
  foundDepth: 3, hue: 'red', revealed: {}, ...over
});
const panel = (s) => traitPanel(s, speciesById[s.trueSpeciesId], speciesById, localitiesById[s.origin]);

describe('traitPanel', () => {
  it('lists every trait, so nothing is ever pressed blind', () => {
    const ids = panel(stone()).rows.map((r) => r.id);
    expect(ids).toContain('hue');
    expect(ids).toContain('transparency');
    expect(ids).toContain('scratch');
    expect(ids).toContain('heft');
    expect(ids).toContain('uv');
  });

  it('marks the two free observations as already made', () => {
    const free = panel(stone()).rows.filter((r) => r.free);
    expect(free.map((r) => r.id).sort()).toEqual(['hue', 'transparency']);
    expect(free.every((r) => r.measured)).toBe(true);
  });

  it('shows an untested trait as unmeasured with no value', () => {
    const row = panel(stone()).rows.find((r) => r.id === 'scratch');
    expect(row.measured).toBe(false);
    expect(row.value).toBe(null);
  });

  it('shows a measured reading with its value and uncertainty', () => {
    const measured = stone({
      revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } }
    });
    const row = panel(measured).rows.find((r) => r.id === 'scratch');
    expect(row.measured).toBe(true);
    expect(row.value).toBe(9);
    expect(row.uncertainty).toBe(0.5);
  });

  it('reports who is still in the running', () => {
    // A red stone at Mogok Marble is ruby or spinel — the classic confusion.
    const c = panel(stone()).consistent;
    expect(c).toContain('ruby');
    expect(c).toContain('spinel');
  });

  it('is not resolved while more than one species fits', () => {
    expect(panel(stone()).resolved).toBe(false);
  });

  it('is resolved once exactly one fits', () => {
    // A UV reading cannot do this: ruby, spinel AND sapphire all key to
    // 'red/none'. Specific gravity is what separates them — ruby 4.00 against
    // spinel 3.60, so a band of 0.3 admits ruby and excludes spinel.
    const measured = stone({
      revealed: { heft: { testId: 'heft', kind: 'numeric', property: 'specificGravity', center: 4.0, band: 0.3 } }
    });
    const p = panel(measured);
    expect(p.consistent).toEqual(['ruby']);
    expect(p.resolved).toBe(true);
  });

  it('is not resolved by a reading its rivals also produce', () => {
    // The trap the test above avoids, pinned so nobody reintroduces it: every
    // corundum-or-spinel red stone fluoresces red under longwave, so UV alone
    // proves nothing here.
    const measured = stone({
      revealed: { uv: { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'red/none' } }
    });
    expect(panel(measured).resolved).toBe(false);
  });

  it('falls back to the stone\'s own species when the locality is unknown', () => {
    // A stale save could name a locality that no longer exists.
    const p = traitPanel(stone(), speciesById.ruby, speciesById, undefined);
    // toEqual, not toContain: a fallback that seeded the whole roster would
    // still contain ruby and pass, so containment proves nothing here.
    expect(p.consistent).toEqual(['ruby']);
  });
});

import { describe, it, expect } from 'vitest';
import { traitPanel, benchStrip } from './identifyView.js';
import { speciesById } from '../../../data/species/loader.js';
import { localitiesById } from '../../../data/localities/loader.js';

// foundDepth 3 is not incidental: ruby has minDepth 3 at Mogok Marble, so a
// depth-1 ruby there is a stone that cannot exist — and seedCandidates would
// drop ruby from its own candidate pool, making every assertion below test
// the wrong thing while still looking plausible.
const stone = (over = {}) => ({
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble',
  foundDepth: 3, hue: 'red', revealed: {}, ...over
});
const panel = (s) => traitPanel(s, speciesById[s.trueSpeciesId], speciesById, localitiesById[s.origin], false);
const panelAt = (s, identified) =>
  traitPanel(s, speciesById[s.trueSpeciesId], speciesById, localitiesById[s.origin], identified);

describe('traitPanel', () => {
  it('lists every trait, so nothing is ever pressed blind', () => {
    const ids = panel(stone()).diagnostics.map((r) => r.id);
    expect(ids).toContain('hue');
    expect(ids).toContain('transparency');
    expect(ids).toContain('scratch');
    expect(ids).toContain('heft');
    expect(ids).toContain('uv');
  });

  it('marks the two free observations as already made', () => {
    const free = panel(stone()).diagnostics.filter((r) => r.free);
    expect(free.map((r) => r.id).sort()).toEqual(['hue', 'transparency']);
    expect(free.every((r) => r.measured)).toBe(true);
  });

  it('shows an untested trait as unmeasured with no value', () => {
    const row = panel(stone()).diagnostics.find((r) => r.id === 'scratch');
    expect(row.measured).toBe(false);
    expect(row.value).toBe(null);
  });

  it('shows a measured reading with its value and uncertainty', () => {
    const measured = stone({
      revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } }
    });
    const row = panel(measured).diagnostics.find((r) => r.id === 'scratch');
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

describe('the sheet has two sections', () => {
  const s = stone();

  it('separates what identifies a stone from what grades it', () => {
    // The distinction is the answer to "why don't Cut's stats match the tests":
    // diagnostics identify, grades appraise.
    const p = panel(s);
    expect(p.diagnostics.map((r) => r.id)).toEqual(['hue', 'transparency', 'scratch', 'heft', 'uv']);
    expect(p.qualities.map((r) => r.id)).toEqual(['weigh', 'colour', 'clarity']);
  });

  it('shows an ungraded quality row as unmeasured', () => {
    const row = panel(s).qualities.find((r) => r.id === 'weigh');
    expect(row.measured).toBe(false);
    expect(row.value).toBe(null);
  });

  it('shows an exact grade without an uncertainty', () => {
    const measured = stone({
      revealed: { weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 } }
    });
    const row = panel(measured).qualities.find((r) => r.id === 'weigh');
    expect(row.value).toBe(2.4);
    expect(row.uncertainty).toBe(null);
  });

  it('shows an uncertain grade with its band', () => {
    const measured = stone({
      revealed: { colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 } }
    });
    const row = panel(measured).qualities.find((r) => r.id === 'colour');
    expect(row.value).toBe(78);
    expect(row.uncertainty).toBe(5);
  });
});

describe('the sheet reports which rung a stone is on', () => {
  it('is unidentified before the diagnostics settle it', () => {
    expect(panelAt(stone(), false).rung).toBe('unidentified');
  });

  it('is identified but ungraded once named', () => {
    expect(panelAt(stone(), true).rung).toBe('identified');
  });

  it('carries a label the screen can render', () => {
    expect(panelAt(stone(), true).rungLabel.length).toBeGreaterThan(0);
  });
});

describe('benchStrip', () => {
  const a = { instanceId: 'a', trueSpeciesId: 'quartz', hue: 'colorless', revealed: {}, identifiedAs: null };
  const b = { instanceId: 'b', trueSpeciesId: 'ruby', hue: 'red', revealed: {}, identifiedAs: 'ruby' };

  it('lists every stone so the player can choose one', () => {
    // The playtest could only ever reach the head of the pile.
    expect(benchStrip([a, b], speciesById).map((e) => e.instanceId)).toEqual(['a', 'b']);
  });

  it('withholds the species of a stone not yet identified', () => {
    const [first] = benchStrip([a, b], speciesById);
    expect(first.speciesId).toBe(null);
    expect(first.hue).toBe('colorless');
  });

  it('names a stone that has been identified', () => {
    expect(benchStrip([a, b], speciesById)[1].speciesId).toBe('ruby');
  });

  it('shows how complete each sheet is', () => {
    const [first] = benchStrip([a, b], speciesById);
    expect(first.measured).toBe(0);
    expect(first.total).toBeGreaterThan(0);
  });
});

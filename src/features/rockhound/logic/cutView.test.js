import { describe, it, expect } from 'vitest';
import { techniqueView, expectedCarat } from './cutView.js';
import { cutSuccessProbability } from './cut.js';

const RUBY = { id: 'ruby', name: 'Ruby', transparency: 'transparent', cleavage: 'none', cutDifficulty: 4, suitableCuts: ['cabochon', 'princess'], phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }] };
const TOPAZ = { id: 'topaz', name: 'Topaz', transparency: 'transparent', cleavage: 'perfect', cutDifficulty: 3, suitableCuts: ['princess'], phenomena: [] };

const CABOCHON = { id: 'cabochon', name: 'Cabochon', cutQualityRange: [50, 100], yieldRange: [0.7, 0.9], catastrophicOnFail: false, successCurve: { base: 0.65, perLevel: 0.035, maxLevel: 10 } };
const PRINCESS = { id: 'princess', name: 'Princess / Boxed Cut', cutQualityRange: [65, 105], yieldRange: [0.65, 0.85], catastrophicOnFail: true, successCurve: { base: 0.40, perLevel: 0.050, maxLevel: 10 } };

describe('techniqueView', () => {
  it('reports the TRUE success odds, not the technique base rate', () => {
    const view = techniqueView(RUBY, CABOCHON, 4);
    // cabochon Lv4 base is 75.5%, but ruby's cutDifficulty 4 scales it down
    expect(view.successPct).toBe(Math.round(cutSuccessProbability(RUBY, CABOCHON, 4) * 100));
    expect(view.successPct).toBeLessThan(70);
  });

  it('has no success figure for a technique that is not learned', () => {
    expect(techniqueView(RUBY, CABOCHON, 0)).toMatchObject({ unlocked: false, successPct: null });
  });

  it('names the phenomenon a cut would reveal', () => {
    expect(techniqueView(RUBY, CABOCHON, 1).reveals).toEqual(['asterism']);
    expect(techniqueView(RUBY, PRINCESS, 1).reveals).toEqual([]);
  });

  it('flags shatter risk only when the cut is catastrophic AND the stone cleaves', () => {
    // topaz has perfect cleavage and princess is catastrophic -> real risk
    expect(techniqueView(TOPAZ, PRINCESS, 1).shatterRisk).toBe(true);
    // ruby does not cleave, so princess cannot shatter it
    expect(techniqueView(RUBY, PRINCESS, 1).shatterRisk).toBe(false);
    // cabochon is never catastrophic
    expect(techniqueView(TOPAZ, CABOCHON, 1).shatterRisk).toBe(false);
  });

  it('reports suitability and explains an unsuitable pairing', () => {
    const ok = techniqueView(RUBY, CABOCHON, 1);
    expect(ok.suitable).toBe(true);
    expect(ok.unsuitableReason).toBeNull();

    const no = techniqueView(TOPAZ, CABOCHON, 1);
    expect(no.suitable).toBe(false);
    expect(no.unsuitableReason).toMatch(/Topaz/);
  });

  it('reports what fraction of the stone the cut keeps, and the quality band', () => {
    const view = techniqueView(RUBY, CABOCHON, 1);
    expect(view.keepsPct).toEqual([70, 90]);
    expect(view.qualityRange).toEqual([50, 100]);
  });

  it('tolerates no selected species', () => {
    const view = techniqueView(null, CABOCHON, 3);
    expect(view).toMatchObject({ unlocked: true, suitable: false, successPct: null, shatterRisk: false });
  });
});

describe('expectedCarat', () => {
  it('scales the yield range by the stone weight', () => {
    expect(expectedCarat({ caratWeight: 2 }, CABOCHON)).toEqual([1.4, 1.8]);
  });
});

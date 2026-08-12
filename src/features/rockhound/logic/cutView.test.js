import { describe, it, expect } from 'vitest';
import { techniqueView, expectedCarat } from './cutView.js';
import { cutSuccessProbability } from '../../../domain/cut.js';

const RUBY = { id: 'ruby', name: 'Ruby', transparency: 'transparent', cleavage: 'none', cutDifficulty: 4, suitableCuts: ['cabochon', 'princess'], phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }] };
const TOPAZ = { id: 'topaz', name: 'Topaz', transparency: 'transparent', cleavage: 'perfect', cutDifficulty: 3, suitableCuts: ['princess'], phenomena: [] };

const CABOCHON = { id: 'cabochon', name: 'Cabochon', style: 'cabochon', cutQualityRange: [50, 100], yieldRange: [0.7, 0.9], catastrophicOnFail: false, successCurve: { base: 0.65, perLevel: 0.035, maxLevel: 10 } };
const PRINCESS = { id: 'princess', name: 'Princess / Boxed Cut', style: 'faceted', cutQualityRange: [65, 105], yieldRange: [0.65, 0.85], catastrophicOnFail: true, successCurve: { base: 0.40, perLevel: 0.050, maxLevel: 10 } };

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

  it('makes a faceted technique unsuitable because of habit even when the species allows it', () => {
    // Ruby's suitableCuts includes 'princess' -> species alone permits this
    // cut. A druzy cavity permits only a cabochon, so the habit must be what
    // blocks it, and the player needs to be told which fact applies.
    const druzy = { form: 'druzy' };
    const view = techniqueView(RUBY, PRINCESS, 1, druzy);
    expect(view.suitable).toBe(false);
    expect(view.unsuitableReason).not.toMatch(/Ruby/);
    expect(view.unsuitableReason).toMatch(/druzy cavity/);
    expect(view.unsuitableReason).toMatch(/cabochon/);
  });

  it('still allows a cabochon on that same druzy stone', () => {
    const druzy = { form: 'druzy' };
    const view = techniqueView(RUBY, CABOCHON, 1, druzy);
    expect(view.suitable).toBe(true);
    expect(view.unsuitableReason).toBeNull();
  });

  it('defaults to no habit constraint when no specimen is given', () => {
    // Same pairing that habit would otherwise block, but no specimen passed.
    expect(techniqueView(RUBY, PRINCESS, 1).suitable).toBe(true);
  });
});

const weighed = (caratWeight, extra = {}) => ({
  caratWeight,
  ...extra,
  revealed: {
    weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: caratWeight }
  }
});

describe('expectedCarat', () => {
  it('scales the yield range by the stone weight', () => {
    // The estimate is only meaningful once the stone has actually been
    // weighed — a full `revealed.weigh` record is what makes that so here.
    expect(expectedCarat(weighed(2), CABOCHON)).toEqual([1.4, 1.8]);
  });

  it('scales a faceted band by crystal habit, so waterworn quotes lower than crystal', () => {
    // Same stone, same faceted technique — only the habit differs. Waterworn
    // scales carat retention down (0.9x) and a terminated crystal scales it
    // up (1.1x), so applyCut will deliver a lower band for the waterworn
    // stone. Quoting the same band for both would promise carat the Cut
    // screen will not pay out.
    const waterworn = expectedCarat(weighed(2, { form: 'waterworn' }), PRINCESS);
    const crystal = expectedCarat(weighed(2, { form: 'crystal' }), PRINCESS);
    expect(waterworn).toEqual([1.17, 1.53]);
    expect(crystal).toEqual([1.43, 1.87]);
    expect(waterworn[0]).toBeLessThan(crystal[0]);
    expect(waterworn[1]).toBeLessThan(crystal[1]);
  });

  it('does not yield a carat-based estimate from an unweighed stone\'s true weight', () => {
    // No `revealed` record at all: the true caratWeight (2) is known only to
    // the game. Quoting a real range from it would leak exactly the number
    // the player has not measured.
    expect(expectedCarat({ caratWeight: 2 }, CABOCHON)).toEqual([0, 0]);
  });
});

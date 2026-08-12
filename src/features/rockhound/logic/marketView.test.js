import { describe, it, expect } from 'vitest';
import { stonePrice, roughPrice, bestCutEstimate } from './marketView.js';
import { stoneValue, identifiedValue } from './market.js';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';

const RUBY = { id: 'ruby', name: 'Ruby', baseValue: 900, suitableCuts: ['cabochon'], phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }] };
const AGATE = { id: 'agate', name: 'Agate', baseValue: 15, suitableCuts: [], phenomena: [] };
const CABOCHON = { id: 'cabochon', cutQualityRange: [50, 100], yieldRange: [0.7, 0.9] };

const STONE = { trueSpeciesId: 'ruby', caratRetained: 1.4, cutQuality: 88, colorGrade: 91, clarity: 82, phenomena: ['asterism'], score: 88 };
// Value now follows what was MEASURED, so an ungraded ROUGH would price at
// the floor and defeat every test below that exercises a real colour/clarity
// multiplier. Carry a full revealed record matching its true values.
const ROUGH = {
  trueSpeciesId: 'ruby', caratWeight: 1.8, colorGrade: 91, clarity: 82,
  revealed: {
    weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 1.8 },
    colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 91, band: 5 },
    clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 82, band: 5 }
  }
};

describe('stonePrice', () => {
  it('agrees with the value rule it explains', () => {
    expect(stonePrice(STONE, RUBY).total).toBe(stoneValue(STONE, RUBY));
  });

  it('exposes the base value, the grade multiplier and the score parts', () => {
    const p = stonePrice(STONE, RUBY);
    expect(p.base).toBe(900);
    expect(p.multiplier).toBeCloseTo(0.5 + 88 / 100, 5);
    expect(p.parts.map((x) => x.key)).toEqual(['carat', 'color', 'clarity', 'cut']);
    expect(p.traitBonus).toBe(15);
  });

  it('shows arithmetic that reconciles to the price it explains', () => {
    const p = stonePrice(STONE, RUBY);
    expect(Math.round(p.base * p.multiplier)).toBe(p.total);
  });

  it('reports a score and a multiplier that agree, even for an unscored stone', () => {
    const { score, ...rest } = STONE;
    const p = stonePrice(rest, RUBY);
    // the multiplier must be derived from the score actually shown, not from
    // a missing field standing in as zero
    expect(Math.round(p.base * p.multiplier)).toBe(p.total);
    expect(p.multiplier).toBeGreaterThan(0.5);
  });
});

describe('roughPrice', () => {
  it('agrees with the value rule it explains', () => {
    expect(roughPrice(ROUGH, RUBY).total).toBe(identifiedValue(ROUGH, RUBY));
  });

  it('exposes the uncut penalty', () => {
    expect(roughPrice(ROUGH, RUBY).uncutDiscount).toBe(0.5);
  });

  it('exposes the grade multiplier the colour, clarity and carat produce', () => {
    // The multiplier prices the APPRAISED edge, not the centre: colour 91 and
    // clarity 82 each carry a band of 5, so they price at 86 and 77. carat
    // 1.8/5 * 100 = 36 (of the 5-ct saturation, and exact — no band to
    // discount); (36 + 86 + 77) / 3 = 66.333 -> 0.5 + 0.66333 = 1.16333
    expect(roughPrice(ROUGH, RUBY).multiplier).toBeCloseTo(0.5 + (36 + 86 + 77) / 3 / 100, 10);
  });

  it('shows arithmetic that reconciles to the price it explains', () => {
    // This is the drift guard. roughPrice mirrors a grade expression that
    // identifiedValue keeps private; if the two ever diverge, the modal would
    // explain a price with arithmetic that does not produce it. Reconciling
    // against the real total catches that the moment it happens.
    const p = roughPrice(ROUGH, RUBY);
    expect(Math.round(p.base * p.multiplier * p.uncutDiscount)).toBe(p.total);
  });
});

describe('bestCutEstimate', () => {
  it('estimates above the rough price, so cutting reads as worthwhile', () => {
    const estimate = bestCutEstimate(ROUGH, RUBY, [CABOCHON]);
    expect(estimate).toBeGreaterThan(identifiedValue(ROUGH, RUBY));
  });

  it('is null when no technique suits the species', () => {
    expect(bestCutEstimate({ caratWeight: 3, colorGrade: 50, clarity: 50 }, AGATE, [CABOCHON])).toBeNull();
  });

  it('ignores techniques the species cannot take', () => {
    const other = { id: 'fancy', cutQualityRange: [70, 110], yieldRange: [0.5, 0.8] };
    expect(bestCutEstimate(ROUGH, RUBY, [other])).toBeNull();
  });
});

describe('bestCutEstimate respects crystal habit', () => {
  const ruby = speciesById.ruby;
  const base = { instanceId: 'r1', trueSpeciesId: 'ruby', caratWeight: 4, clarity: 90, colorGrade: 95 };

  it('quotes nothing for a stone that can never be cut', () => {
    // A matrix specimen is sold as a mineral specimen; the Cut screen refuses
    // every technique. Advertising a cut value would promise a price the rest
    // of the game will not honour.
    expect(bestCutEstimate({ ...base, form: 'matrix' }, ruby, cutTechniques)).toBe(null);
  });

  it('quotes only the cuts the habit can actually take', () => {
    // Emerald takes step and round_brilliant, but no cabochon. A nodule takes
    // ONLY a cabochon. So a nodule emerald can take no cut at all and must
    // quote nothing, while the same stone as a fragment quotes a real price.
    // Ruby is the wrong stone for this assertion: its cabochon reveals
    // asterism, making the cabochon its best cut anyway, so restricting to it
    // changes no number and the test would pass without the filter working.
    const emerald = speciesById.emerald;
    const asNodule = bestCutEstimate({ ...base, trueSpeciesId: 'emerald', form: 'nodule' }, emerald, cutTechniques);
    const asFragment = bestCutEstimate({ ...base, trueSpeciesId: 'emerald', form: 'fragment' }, emerald, cutTechniques);
    expect(asNodule).toBe(null);
    expect(asFragment).toBeGreaterThan(0);
  });

  it('is unchanged for rough that predates crystal habit', () => {
    expect(bestCutEstimate(base, ruby, cutTechniques)).toBeGreaterThan(0);
  });

  it('quotes a lower estimate for a waterworn stone than the same stone as a crystal', () => {
    // Emerald's suitable cuts (step, round_brilliant) are both faceted, so its
    // best cut is always faceted — unlike ruby, whose cabochon reveals
    // asterism and wins regardless of habit. That makes emerald the stone
    // where formYield's 0.9x (waterworn) vs 1.1x (crystal) carat scaling
    // actually reaches the estimate: same species, same carat/colour/clarity,
    // only the habit differs.
    const emerald = speciesById.emerald;
    const waterworn = bestCutEstimate({ ...base, trueSpeciesId: 'emerald', form: 'waterworn' }, emerald, cutTechniques);
    const crystal = bestCutEstimate({ ...base, trueSpeciesId: 'emerald', form: 'crystal' }, emerald, cutTechniques);
    expect(waterworn).toBeLessThan(crystal);
  });
});

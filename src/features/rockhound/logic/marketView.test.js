import { describe, it, expect } from 'vitest';
import { stonePrice, roughPrice, bestCutEstimate } from './marketView.js';
import { stoneValue, identifiedValue, gradeFactor } from './market.js';

const RUBY = { id: 'ruby', name: 'Ruby', baseValue: 900, suitableCuts: ['cabochon'], phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }] };
const AGATE = { id: 'agate', name: 'Agate', baseValue: 15, suitableCuts: [], phenomena: [] };
const CABOCHON = { id: 'cabochon', cutQualityRange: [50, 100], yieldRange: [0.7, 0.9] };

const STONE = { trueSpeciesId: 'ruby', caratRetained: 1.4, cutQuality: 88, colorGrade: 91, clarity: 82, phenomena: ['asterism'], score: 88 };
const ROUGH = { trueSpeciesId: 'ruby', caratWeight: 1.8, colorGrade: 91, clarity: 82 };

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
    expect(p.multiplier).toBeCloseTo(gradeFactor(p.score), 10);
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

  it('exposes the grade multiplier the colour and clarity produce', () => {
    // (91 + 82) / 2 = 86.5 -> 0.5 + 0.865
    expect(roughPrice(ROUGH, RUBY).multiplier).toBeCloseTo(1.365, 10);
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

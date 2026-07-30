import { describe, it, expect } from 'vitest';
import { canApply, cutSuccessProbability, applyCut, specimenScore, scoreBreakdown, SCORE_WEIGHTS } from './cut.js';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniquesById } from '../../../loaders/cutTechniques.js';

const rough = (over = {}) => ({
  instanceId: 'c1', stage: 'identified', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire',
  caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek', ...over
});

describe('canApply', () => {
  it('respects a species suitableCuts', () => {
    expect(canApply(speciesById.sapphire, cutTechniquesById.cabochon)).toBe(true);
    expect(canApply(speciesById.agate, cutTechniquesById.round_brilliant)).toBe(false); // agate: cabochon only
  });
});

describe('cutSuccessProbability', () => {
  it('drops with material difficulty and clamps', () => {
    const easy = cutSuccessProbability(speciesById.quartz, cutTechniquesById.round_brilliant, 5);   // cutDifficulty 1
    const hard = cutSuccessProbability(speciesById.sapphire, cutTechniquesById.round_brilliant, 5); // cutDifficulty 4
    expect(hard).toBeLessThan(easy);
    expect(cutSuccessProbability(speciesById.sapphire, cutTechniquesById.fancy, 1)).toBeGreaterThanOrEqual(0.05);
  });
});

describe('applyCut', () => {
  it('a winning roll produces a cut stone with stats', () => {
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.round_brilliant, 10, () => 0);
    expect(res.outcome).toBe('success');
    expect(res.specimen.stage).toBe('cut');
    expect(res.specimen.cut).toBe('round_brilliant');
    expect(res.specimen.cutQuality).toBeGreaterThan(0);
    expect(res.specimen.caratRetained).toBeGreaterThan(0);
    expect(res.specimen.caratRetained).toBeLessThanOrEqual(rough().caratWeight);
  });

  it('reveals asterism when a sapphire is cut as a cabochon', () => {
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.cabochon, 10, () => 0);
    expect(res.outcome).toBe('success');
    expect(res.specimen.phenomena).toContain('asterism');
  });

  it('does NOT reveal asterism when the same sapphire is faceted', () => {
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.round_brilliant, 10, () => 0);
    expect(res.specimen.phenomena).toEqual([]);
  });

  it('a losing roll on a non-cleavable stone fails without shattering', () => {
    // round_brilliant is not catastrophicOnFail; sapphire cleavage 'none'
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.round_brilliant, 1, () => 0.999);
    expect(res.outcome).toBe('fail');
    expect(res.specimen).not.toBeNull();
  });

  it('a bad roll on a cleavable stone with a catastrophic cut shatters it', () => {
    // topaz cleavage 'perfect'; princess is catastrophicOnFail
    const res = applyCut(rough({ trueSpeciesId: 'topaz' }), speciesById.topaz, cutTechniquesById.princess, 1, () => 0.999);
    expect(res.outcome).toBe('shattered');
    expect(res.specimen).toBeNull();
  });
});

describe('specimenScore', () => {
  it('rewards higher cut quality and phenomena', () => {
    const base = { caratRetained: 1, clarity: 60, colorGrade: 60, cutQuality: 60, phenomena: [] };
    const better = { ...base, cutQuality: 95 };
    const starred = { ...base, phenomena: ['asterism'] };
    expect(specimenScore(better, speciesById.sapphire)).toBeGreaterThan(specimenScore(base, speciesById.sapphire));
    expect(specimenScore(starred, speciesById.sapphire)).toBeGreaterThan(specimenScore(base, speciesById.sapphire));
  });
});

describe('scoreBreakdown', () => {
  const SPECIES = { id: 'ruby', baseValue: 900, phenomena: [] };
  const STONE = { caratRetained: 1.4, cutQuality: 88, colorGrade: 91, clarity: 82, phenomena: ['asterism'] };

  it('totals to exactly what specimenScore returns', () => {
    expect(scoreBreakdown(STONE, SPECIES).total).toBe(specimenScore(STONE, SPECIES));
  });

  it('splits the score into the four graded parts plus a trait bonus', () => {
    const b = scoreBreakdown(STONE, SPECIES);
    expect(b.parts.map((p) => p.key)).toEqual(['carat', 'color', 'clarity', 'cut']);
    expect(b.traitBonus).toBe(15); // phenomena revealed
    const sum = b.parts.reduce((t, p) => t + p.points, 0) + b.traitBonus;
    expect(Math.round(sum)).toBe(b.total);
  });

  it('weights each part as SCORE_WEIGHTS declares', () => {
    const b = scoreBreakdown(STONE, SPECIES);
    expect(b.parts.find((p) => p.key === 'cut').weight).toBe(SCORE_WEIGHTS.cut);
  });
});

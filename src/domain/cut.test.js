import { describe, it, expect } from 'vitest';
import {
  canApply, cutSuccessProbability, applyCut, specimenScore, scoreBreakdown, SCORE_WEIGHTS, canShatter,
  formAllows, canApplyToSpecimen, formYield
} from './cut.js';
import { speciesById } from '../data/species/loader.js';
import { cutTechniquesById, cutTechniques } from '../data/cutTechniques/loader.js';

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

describe('canShatter', () => {
  it('is true for a cleaving species with a catastrophic technique', () => {
    // topaz cleavage 'perfect'; princess is catastrophicOnFail
    expect(canShatter(speciesById.topaz, cutTechniquesById.princess)).toBe(true);
  });

  it('is false for a non-cleaving species with a catastrophic technique', () => {
    // ruby cleavage 'none'; princess is catastrophicOnFail
    expect(canShatter(speciesById.ruby, cutTechniquesById.princess)).toBe(false);
  });

  it('is false for a cleaving species with a non-catastrophic technique', () => {
    // topaz cleavage 'perfect'; cabochon is not catastrophicOnFail
    expect(canShatter(speciesById.topaz, cutTechniquesById.cabochon)).toBe(false);
  });

  it('is false and does not throw for a null or undefined species', () => {
    expect(canShatter(null, cutTechniquesById.princess)).toBe(false);
    expect(canShatter(undefined, cutTechniquesById.princess)).toBe(false);
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

describe('crystal habit constrains the cut', () => {
  const cab = cutTechniques.find((t) => t.id === 'cabochon');
  const brilliant = cutTechniques.find((t) => t.id === 'round_brilliant');
  const rough = (form) => ({ instanceId: 'x', trueSpeciesId: 'quartz', caratWeight: 2, clarity: 70, colorGrade: 70, form });

  it('admits no cut at all for a crystal still on its matrix', () => {
    expect(formAllows('matrix', cab)).toBe(false);
    expect(formAllows('matrix', brilliant)).toBe(false);
  });

  it('lets a druzy cavity take a cabochon but never facets', () => {
    expect(formAllows('druzy', cab)).toBe(true);
    expect(formAllows('druzy', brilliant)).toBe(false);
  });

  it('lets a broken fragment take either', () => {
    expect(formAllows('fragment', cab)).toBe(true);
    expect(formAllows('fragment', brilliant)).toBe(true);
  });

  it('imposes no constraint on rough that predates forms', () => {
    // Saves written before the Dive carry no form; those stones must stay
    // cuttable exactly as they were.
    expect(formAllows(undefined, brilliant)).toBe(true);
  });

  it('combines the species rule and the form rule without replacing either', () => {
    const quartz = speciesById.quartz;
    // Same species, same technique, different habit -> different answer.
    expect(canApplyToSpecimen(rough('fragment'), quartz, cab)).toBe(canApply(quartz, cab));
    expect(canApplyToSpecimen(rough('matrix'), quartz, cab)).toBe(false);
  });

  it('scales faceted carat retention by habit but leaves cabochons alone', () => {
    expect(formYield('crystal', brilliant)).toBeGreaterThan(1);
    expect(formYield('waterworn', brilliant)).toBeLessThan(1);
    expect(formYield('crystal', cab)).toBe(1);
    expect(formYield('waterworn', cab)).toBe(1);
  });

  it('carries the habit through into the carat a cut actually keeps', () => {
    const species = speciesById.quartz;
    const asCrystal = applyCut(rough('crystal'), species, brilliant, 10, () => 0.01);
    const asPebble = applyCut(rough('waterworn'), species, brilliant, 10, () => 0.01);
    expect(asCrystal.outcome).toBe('success');
    expect(asPebble.outcome).toBe('success');
    expect(asCrystal.specimen.caratRetained).toBeGreaterThan(asPebble.specimen.caratRetained);
  });

  it('carries the habit through a botched cut too, not just a clean one', () => {
    // applyCut applies the habit modifier in two places. Testing only the
    // success branch would let a regression drop it from the failure branch
    // silently. quartz + round_brilliant at level 10 succeeds ~90% of the
    // time, so a roll of 0.95 fails; round_brilliant is not catastrophic and
    // quartz does not cleave, so this fails rather than shatters.
    const species = speciesById.quartz;
    const asCrystal = applyCut(rough('crystal'), species, brilliant, 10, () => 0.95);
    const asPebble = applyCut(rough('waterworn'), species, brilliant, 10, () => 0.95);
    expect(asCrystal.outcome).toBe('fail');
    expect(asPebble.outcome).toBe('fail');
    expect(asCrystal.specimen.caratRetained).toBeGreaterThan(asPebble.specimen.caratRetained);
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

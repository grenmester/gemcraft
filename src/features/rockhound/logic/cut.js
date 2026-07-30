import { cutSuccessAtLevel } from '../../../loaders/cutTechniques.js';

export const CUT_DIFFICULTY_STEP = 0.08;

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const lerp = ([lo, hi], t) => lo + (hi - lo) * t;
const round2 = (n) => Math.round(n * 100) / 100;

export function canApply(species, technique) {
  return species.suitableCuts.includes(technique.id);
}

export function cutSuccessProbability(species, technique, level) {
  const base = cutSuccessAtLevel(technique, level);
  const difficulty = 1 - (species.cutDifficulty - 1) * CUT_DIFFICULTY_STEP;
  return clamp(base * difficulty, 0.05, 0.98);
}

export function applyCut(specimen, species, technique, level, rng = Math.random) {
  const p = cutSuccessProbability(species, technique, level);
  const roll = rng();
  const qualityRoll = rng();

  if (roll < p) {
    const cutQuality = Math.round(lerp(technique.cutQualityRange, qualityRoll));
    const caratRetained = round2(specimen.caratWeight * lerp(technique.yieldRange, qualityRoll));
    const phenomena = (species.phenomena ?? [])
      .filter((ph) => ph.revealedBy === technique.id)
      .map((ph) => ph.type);
    return {
      outcome: 'success',
      specimen: { ...specimen, stage: 'cut', cut: technique.id, cutQuality, caratRetained, symmetry: cutQuality, phenomena }
    };
  }

  const cleaves = species.cleavage === 'perfect' || species.cleavage === 'good';
  if (technique.catastrophicOnFail && cleaves && roll > 0.9) {
    return { outcome: 'shattered', specimen: null };
  }

  const floor = technique.cutQualityRange[0];
  const cutQuality = Math.max(10, Math.round(lerp([floor - 20, floor], qualityRoll)));
  const caratRetained = round2(specimen.caratWeight * lerp([0.3, technique.yieldRange[0]], qualityRoll));
  return {
    outcome: 'fail',
    specimen: { ...specimen, stage: 'cut', cut: technique.id, cutQuality, caratRetained, symmetry: cutQuality, phenomena: [] }
  };
}

export const SCORE_WEIGHTS = { carat: 0.25, color: 0.25, clarity: 0.2, cut: 0.3 };

/**
 * The score with its parts exposed, so the Market can show a player why a
 * stone is worth what it is. This is the single computation — specimenScore
 * delegates to it so the two can never drift apart.
 */
export function scoreBreakdown(specimen, species) {
  const carat = specimen.caratRetained ?? specimen.caratWeight ?? 0;
  const caratNorm = clamp(carat / 5, 0, 1) * 100; // 5 ct saturates
  const raws = {
    carat: { raw: carat, normalised: caratNorm, label: 'Carat' },
    color: { raw: specimen.colorGrade ?? 0, normalised: specimen.colorGrade ?? 0, label: 'Colour' },
    clarity: { raw: specimen.clarity ?? 0, normalised: specimen.clarity ?? 0, label: 'Clarity' },
    cut: { raw: specimen.cutQuality ?? 0, normalised: specimen.cutQuality ?? 0, label: 'Cut' }
  };
  const parts = Object.entries(raws).map(([key, v]) => ({
    key,
    label: v.label,
    raw: v.raw,
    normalised: v.normalised,
    weight: SCORE_WEIGHTS[key],
    points: SCORE_WEIGHTS[key] * v.normalised
  }));
  const traitBonus = (specimen.phenomena?.length ? 15 : 0) + (specimen.untreated ? 5 : 0);
  const total = Math.round(parts.reduce((t, p) => t + p.points, 0) + traitBonus);
  return { parts, traitBonus, total };
}

export function specimenScore(specimen, species) {
  return scoreBreakdown(specimen, species).total;
}

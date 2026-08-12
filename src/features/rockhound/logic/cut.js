import { cutSuccessAtLevel } from '../../../loaders/cutTechniques.js';
import { FORM_EFFECTS } from './forms.js';
import { clamp, round2 } from '../../../shared/math.js';

export const CUT_DIFFICULTY_STEP = 0.08;

const lerp = ([lo, hi], t) => lo + (hi - lo) * t;

export function canApply(species, technique) {
  return species.suitableCuts.includes(technique.id);
}

/**
 * Whether this rough's crystal habit admits this style of cut. An absent or
 * unrecognised form imposes no constraint — rough saved before habits
 * existed must stay exactly as cuttable as it was.
 */
export function formAllows(form, technique) {
  const effect = FORM_EFFECTS[form];
  if (!effect) return true;
  return effect.styles.includes(technique.style);
}

/** The species rule and the habit rule together. Neither restates the other. */
export function canApplyToSpecimen(specimen, species, technique) {
  return canApply(species, technique) && formAllows(specimen.form, technique);
}

/** Habit scales carat retention on faceted cuts only. */
export function formYield(form, technique) {
  if (technique.style !== 'faceted') return 1;
  return FORM_EFFECTS[form]?.facetedYield ?? 1;
}

export function cutSuccessProbability(species, technique, level) {
  const base = cutSuccessAtLevel(technique, level);
  const difficulty = 1 - (species.cutDifficulty - 1) * CUT_DIFFICULTY_STEP;
  return clamp(base * difficulty, 0.05, 0.98);
}

/**
 * Whether this pairing can destroy the stone at all: a catastrophic
 * technique on a species that cleaves. Eligibility only — applyCut still
 * requires a failed roll before it actually shatters.
 */
export function canShatter(species, technique) {
  return !!technique.catastrophicOnFail
    && ['good', 'perfect'].includes(species?.cleavage);
}

export function applyCut(specimen, species, technique, level, rng) {
  const p = cutSuccessProbability(species, technique, level);
  const roll = rng();
  const qualityRoll = rng();

  if (roll < p) {
    const cutQuality = Math.round(lerp(technique.cutQualityRange, qualityRoll));
    const caratRetained = round2(
      specimen.caratWeight * lerp(technique.yieldRange, qualityRoll) * formYield(specimen.form, technique)
    );
    const phenomena = (species.phenomena ?? [])
      .filter((ph) => ph.revealedBy === technique.id)
      .map((ph) => ph.type);
    return {
      outcome: 'success',
      specimen: { ...specimen, stage: 'cut', cut: technique.id, cutQuality, caratRetained, symmetry: cutQuality, phenomena }
    };
  }

  if (canShatter(species, technique) && roll > 0.9) {
    return { outcome: 'shattered', specimen: null };
  }

  const floor = technique.cutQualityRange[0];
  const cutQuality = Math.max(10, Math.round(lerp([floor - 20, floor], qualityRoll)));
  const caratRetained = round2(
    specimen.caratWeight * lerp([0.3, technique.yieldRange[0]], qualityRoll) * formYield(specimen.form, technique)
  );
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

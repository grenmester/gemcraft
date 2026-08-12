import { stoneValue, identifiedValue, gradeFactor, roughGradeFactor, uncutDiscountFor } from './market.js';
import { scoreBreakdown, specimenScore, canApplyToSpecimen, formYield } from './cut.js';
import { measuredQuality, appraisedQuality, isMeasured } from './grading.js';

const mid = ([lo, hi]) => (lo + hi) / 2;

/**
 * A cut stone's price with its arithmetic exposed. `total` comes from the
 * value rule in market.js; this only explains it.
 */
export function stonePrice(stone, species) {
  const { parts, traitBonus } = scoreBreakdown(stone, species);
  const score = stone.score ?? specimenScore(stone, species);
  return {
    total: stoneValue({ ...stone, score }, species),
    base: species.baseValue,
    score,
    multiplier: gradeFactor(score),
    parts,
    traitBonus
  };
}

/**
 * An uncut stone's price, including the penalty for selling it rough. Quality
 * fields report what the player has MEASURED, not what the stone truly is —
 * `null` means "not measured", so the modal never leaks a number the player
 * never earned.
 *
 * colorGrade/clarity also carry their band and their APPRAISED (priced)
 * value, so the breakdown modal can show the step — what was read, its band,
 * what it was priced as — without computing the pessimistic edge itself;
 * that rule lives once, in grading.js's appraisedQuality.
 */
export function roughPrice(specimen, species) {
  const q = measuredQuality(specimen);
  const a = appraisedQuality(specimen);
  const colourMeasured = isMeasured(specimen, 'colour');
  const clarityMeasured = isMeasured(specimen, 'clarity');
  return {
    total: identifiedValue(specimen, species),
    base: species.baseValue,
    caratWeight: isMeasured(specimen, 'weigh') ? q.caratWeight : null,
    colorGrade: colourMeasured ? q.colorGrade : null,
    colorGradeBand: colourMeasured ? specimen.revealed.colour.band : null,
    colorGradeAppraised: colourMeasured ? a.colorGrade : null,
    clarity: clarityMeasured ? q.clarity : null,
    clarityBand: clarityMeasured ? specimen.revealed.clarity.band : null,
    clarityAppraised: clarityMeasured ? a.clarity : null,
    multiplier: roughGradeFactor(specimen),
    uncutDiscount: uncutDiscountFor(specimen)
  };
}

/**
 * Indicative value if this rough were cut with its best-suited technique at a
 * middling roll. An estimate to inform the sell-or-cut choice, not a promise.
 *
 * Gated on the specimen, not just the species: a crystal on matrix can never
 * be cut, and a nodule takes only a cabochon. Quoting a species-level cut
 * value here would advertise a price the Cut screen refuses to deliver.
 */
export function bestCutEstimate(specimen, species, techniques) {
  const suitable = techniques.filter((t) => canApplyToSpecimen(specimen, species, t));
  if (suitable.length === 0) return null;
  return suitable.reduce((best, t) => {
    const cut = {
      ...specimen,
      caratRetained: (specimen.caratWeight ?? 0) * mid(t.yieldRange) * formYield(specimen.form, t),
      cutQuality: mid(t.cutQualityRange),
      phenomena: (species.phenomena ?? []).filter((p) => p.revealedBy === t.id).map((p) => p.type)
    };
    const value = stoneValue({ score: specimenScore(cut, species) }, species);
    return Math.max(best, value);
  }, 0);
}

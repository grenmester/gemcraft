import { GRADE_DEFS } from './gemTests.js';

// What a stone is worth rests on what the player has actually measured. A
// buyer cannot verify an ungraded trait, so they assume the worst — and that
// substitution is the entire ungraded discount. No separate constant exists
// or is needed.

/** What an unmeasured quality trait counts as. */
export const WORST_CASE = 0;

const readingValue = (reading) =>
  reading.kind === 'quality-exact' ? reading.value : reading.center;

/** Whether the player has actually measured one quality trait. */
export function isMeasured(specimen, gradeId) {
  return Boolean((specimen.revealed ?? {})[gradeId]);
}

/**
 * How uncertain one measured quality reading is, or null where the trait was
 * not measured or carries no band. Kept here so the reading's shape stays
 * known to this module alone.
 */
export function measuredBand(specimen, gradeId) {
  const reading = (specimen.revealed ?? {})[gradeId];
  return reading?.band ?? null;
}

/**
 * Each quality trait as the market sees it: the measured value where one
 * exists, the worst case where none does. Never reads the specimen's true
 * value for an unmeasured trait — that is the point.
 */
export function measuredQuality(specimen) {
  const revealed = specimen.revealed ?? {};
  return Object.fromEntries(
    Object.values(GRADE_DEFS).map((def) => [
      def.property,
      isMeasured(specimen, def.id) ? readingValue(revealed[def.id]) : WORST_CASE
    ])
  );
}

/**
 * Each quality trait as a buyer prices it: the pessimistic edge of what the
 * player has read, never its centre. A banded reading (colour, clarity)
 * prices at its worst end — `center - band`, floored at 0 — because a buyer
 * cannot rule out anything the band admits. An exact reading (carat) has no
 * band, so it prices at the value it is. An unmeasured trait prices at
 * WORST_CASE, which is exactly the limit of the banded rule as the band
 * widens to swallow the centre — no separate constant is needed for it.
 *
 * This drives PRICE. Display (Cut's meters, Market's detail line) must keep
 * using measuredQuality's centre — that is genuinely what the player read.
 */
export function appraisedQuality(specimen) {
  const revealed = specimen.revealed ?? {};
  return Object.fromEntries(
    Object.values(GRADE_DEFS).map((def) => {
      if (!isMeasured(specimen, def.id)) return [def.property, WORST_CASE];
      const reading = revealed[def.id];
      const value = reading.kind === 'quality-exact' ? reading.value : Math.max(0, reading.center - reading.band);
      return [def.property, value];
    })
  );
}

export function gradedCount(specimen) {
  return Object.values(GRADE_DEFS).filter((def) => isMeasured(specimen, def.id)).length;
}

export function isGraded(specimen) {
  return gradedCount(specimen) === Object.keys(GRADE_DEFS).length;
}

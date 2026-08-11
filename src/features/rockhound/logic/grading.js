import { GRADE_DEFS } from './tests.js';

// What a stone is worth rests on what the player has actually measured. A
// buyer cannot verify an ungraded trait, so they assume the worst — and that
// substitution is the entire ungraded discount. No separate constant exists
// or is needed.

/** What an unmeasured quality trait counts as. */
export const WORST_CASE = 0;

const readingValue = (reading) =>
  reading.kind === 'quality-exact' ? reading.value : reading.center;

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
      revealed[def.id] ? readingValue(revealed[def.id]) : WORST_CASE
    ])
  );
}

export function gradedCount(specimen) {
  const revealed = specimen.revealed ?? {};
  return Object.values(GRADE_DEFS).filter((def) => revealed[def.id]).length;
}

export function isGraded(specimen) {
  return gradedCount(specimen) === Object.keys(GRADE_DEFS).length;
}

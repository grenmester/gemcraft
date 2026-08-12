import { appraisedQuality } from './grading.js';

export const UNCUT_DISCOUNT = 0.5;

export const gradeFactor = (score) => 0.5 + (score ?? 0) / 100;

export function stoneValue(stone, species) {
  return Math.round(species.baseValue * gradeFactor(stone.score));
}

/** A carat saturates the scale at five, matching specimenScore's treatment. */
const CARAT_SATURATION = 5;
const QUALITY_AXES = 3;

/**
 * How much a stone's own qualities are worth to a buyer — using what the
 * player has APPRAISED, not what the stone truly is, and not merely what they
 * read. A buyer cannot verify anything narrower than the player's own band,
 * so a banded reading prices at its worst end; an unmeasured trait counts as
 * its worst case outright. That substitution is the entire ungraded
 * discount, and mastery (which narrows the band) genuinely moves the price;
 * there is no separate constant.
 *
 * Carat is included here. Rough value used to ignore it while cut value
 * weighted it, which was a long-standing inconsistency.
 */
export function roughGradeFactor(specimen) {
  const q = appraisedQuality(specimen);
  const caratNorm = Math.min(q.caratWeight / CARAT_SATURATION, 1) * 100;
  return 0.5 + ((caratNorm + q.colorGrade + q.clarity) / QUALITY_AXES) / 100;
}

/**
 * The uncut discount exists because a buyer takes on the risk of cutting.
 * A crystal on matrix is never going to be cut — it is sold as a mineral
 * specimen — so that risk, and its discount, do not apply.
 */
export function uncutDiscountFor(specimen) {
  return specimen.form === 'matrix' ? 1 : UNCUT_DISCOUNT;
}

export function identifiedValue(specimen, species) {
  return Math.round(species.baseValue * roughGradeFactor(specimen) * uncutDiscountFor(specimen));
}

// Note: the `sieve` gear id below is an ordinary shop item, unrelated to the
// idle "rocker box" device (gear id `rocker_box`). sieveView, SievePanel,
// PARK_SIEVE and COLLECT_SIEVE all refer to the rocker box, not this item —
// do not gate idle behaviour on `gear.includes('sieve')`.
export const SHOP_GEAR = [
  { id: 'sieve', name: 'Sieve', price: 120 },
  { id: 'rock_hammer', name: 'Rock Hammer', price: 300 },
  { id: 'rocker_box', name: 'Rocker Box', price: 250 }
];

export function gearPrice(gearId) {
  return SHOP_GEAR.find((g) => g.id === gearId)?.price ?? null;
}

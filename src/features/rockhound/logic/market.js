export const UNCUT_DISCOUNT = 0.5;

export const gradeFactor = (score) => 0.5 + (score ?? 0) / 100;

export function stoneValue(stone, species) {
  return Math.round(species.baseValue * gradeFactor(stone.score));
}

export function roughGradeFactor(specimen) {
  return 0.5 + ((specimen.colorGrade + specimen.clarity) / 2) / 100;
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

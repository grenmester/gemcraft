import { RARITY_ENUM } from '../../../schemas/items.js';

// Read-only derivations for the Explore views. Find-pool weights are the
// authoring knob; players see words, never the raw numbers, so tuning weights
// never turns into a UI change.

const FREQUENCY_BANDS = [
  { minShare: 0.35, label: 'common here' },
  { minShare: 0.15, label: 'uncommon here' }
];
const RAREST_LABEL = 'rare here';

function frequencyFor(weight, totalWeight) {
  if (totalWeight <= 0) return RAREST_LABEL;
  const share = weight / totalWeight;
  return FREQUENCY_BANDS.find((b) => share >= b.minShare)?.label ?? RAREST_LABEL;
}

/**
 * The find pool as the player may see it: discovered species are named,
 * undiscovered ones are withheld (spoiler rule). Ordered richest first.
 * Raw weights are deliberately not returned.
 */
export function findPoolView(locality, speciesById, gemdex) {
  const found = new Set(gemdex);
  const total = locality.findPool.reduce((sum, e) => sum + e.weight, 0);
  return [...locality.findPool]
    .sort((a, b) => b.weight - a.weight)
    .map((e) => {
      const discovered = found.has(e.species);
      return {
        speciesId: e.species,
        name: discovered ? (speciesById[e.species]?.name ?? null) : null,
        discovered,
        frequency: frequencyFor(e.weight, total)
      };
    });
}

/** Highest rarity present in the pool — safe to show even for locked ground. */
export function rarityCeiling(locality, speciesById) {
  let best = 0;
  locality.findPool.forEach((e) => {
    const rarity = speciesById[e.species]?.rarity;
    const rank = RARITY_ENUM.indexOf(rarity);
    if (rank > best) best = rank;
  });
  return RARITY_ENUM[best];
}

/** How much of this locality's set the player has found. */
export function localitySetProgress(locality, gemdex) {
  const found = new Set(gemdex);
  const ids = locality.findPool.map((e) => e.species);
  const discovered = ids.filter((id) => found.has(id)).length;
  return { found: discovered, total: ids.length, complete: discovered === ids.length };
}

function gateNeedsLocalitySet(gate, localityId) {
  const nodes = [...(gate.allOf ?? []), ...(gate.anyOf ?? [])];
  return nodes.some((node) =>
    'type' in node
      ? node.type === 'setComplete' && node.setType === 'locality' && node.id === localityId
      : gateNeedsLocalitySet(node, localityId)
  );
}

/**
 * Localities that this locality's completed set unlocks. Makes the otherwise
 * invisible set-completion dependency legible on the card.
 */
export function localitiesGatedBy(localities, localityId) {
  return localities.filter((l) => gateNeedsLocalitySet(l.unlockGate, localityId));
}

/** 'north_america' -> 'North America' */
export function titleizeWords(value) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

import { RARITY_ENUM } from '../../../schemas/items.js';
import { localitySetComplete } from './progression.js';
import { effectivePool } from './rollRough.js';

// Read-only derivations for the Explore views. Locality set grouping lives here
// (not in progression.js) because it is presentation shape, not game rules;
// progression.js remains the authority on whether a locality set is *complete*,
// so `complete` below delegates to it rather than restating the rule.
//
// Find-pool odds are shown as exact percentages while we prototype: banded
// words ("common here") collapsed to a single label on the four localities
// whose weights are nearly flat, hiding the very information the screen
// exists to surface.

/** A find-pool weight as its exact share of the pool, e.g. '30%'. */
function chanceFor(weight, totalWeight) {
  if (totalWeight <= 0) return '0%';
  const pct = (weight / totalWeight) * 100;
  // One decimal only when rounding to whole percent would misreport the odds.
  const rounded = Math.round(pct);
  const text = Math.abs(pct - rounded) < 0.05 ? `${rounded}` : pct.toFixed(1);
  return `${text}%`;
}

/**
 * The find pool as the player may see it: discovered species are named,
 * undiscovered ones are withheld (spoiler rule). Ordered richest first.
 * `chance` is the exact percentage; the raw weight stays internal.
 *
 * `depth` is optional. With no depth, the guide shows the whole pool at
 * surface weights (the pre-Dive view). With a depth, it delegates to
 * `effectivePool` — the same weighting `rollRough` actually draws from —
 * so entries not yet reachable are absent and shown odds can never drift
 * from rolled odds.
 */
export function findPoolView(locality, speciesById, gemdex, depth = null) {
  const found = new Set(gemdex);
  const pool = depth == null
    ? locality.findPool.map((e) => ({ ...e, effectiveWeight: e.weight }))
    : effectivePool(locality.findPool, depth);
  const total = pool.reduce((sum, e) => sum + e.effectiveWeight, 0);
  return [...pool]
    .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
    .map((e) => {
      const discovered = found.has(e.species);
      return {
        speciesId: e.species,
        name: discovered ? (speciesById[e.species]?.name ?? null) : null,
        discovered,
        chance: chanceFor(e.effectiveWeight, total)
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
  return { found: discovered, total: ids.length, complete: localitySetComplete(locality, found) };
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

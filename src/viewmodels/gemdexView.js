// Read-only derivations for the Gemdex views. Family grouping lives here (not
// in progression.js) because it is presentation shape, not game rules;
// progression.js remains the authority on whether a family set is *complete*,
// so `complete` below delegates to it rather than restating the rule.

import { familyComplete } from '../domain/progression.js';

/**
 * Species grouped by family, families ordered by first appearance in
 * `allSpecies` (species.yaml is authored family-by-family, so this reads in
 * the intended order).
 */
export function familyGroups(allSpecies, gemdex) {
  const found = new Set(gemdex);
  const order = [...new Set(allSpecies.map((s) => s.family))];
  return order.map((family) => {
    const members = allSpecies.filter((s) => s.family === family);
    const discovered = members.filter((s) => found.has(s.id)).length;
    return {
      family,
      members,
      discovered,
      total: members.length,
      complete: familyComplete(family, allSpecies, found)
    };
  });
}

/** Localities whose findPool can yield this species (findPool is the source of truth). */
export function localitiesForSpecies(localities, speciesId) {
  return localities.filter((l) => l.findPool.some((e) => e.species === speciesId));
}

/** Overall roster completion. Gemdex ids outside the roster are ignored. */
export function collectionProgress(allSpecies, gemdex) {
  const found = new Set(gemdex);
  return {
    discovered: allSpecies.filter((s) => found.has(s.id)).length,
    total: allSpecies.length
  };
}

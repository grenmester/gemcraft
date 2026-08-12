// src/state/resolve.js
// Shared by the identify and exploration handlers: both need to ask whether a
// stone's identity has settled, and both admit freshly dug stones. Neither
// owns these, so they live here rather than inside either handler.
import { speciesById } from '../data/species/loader.js';
import { localitiesById } from '../data/localities/loader.js';
import { consistentSpecies } from '../domain/gemTests.js';
import { revealedReadings } from '../domain/traits.js';
import { seedCandidates } from '../domain/candidates.js';
import { identifyReward } from '../domain/identifyResult.js';
import { withEarnedGear } from '../domain/progression.js';

/**
 * The stone's identity has become certain, so move it to the bench of
 * identified specimens.
 */
/**
 * Everything observed about a stone so far, and what still fits it. Shared by
 * the two places that need to ask "is this settled yet?" — admitting a new
 * stone, and revealing a trait on one already on the bench.
 */
export function stillConsistent(specimen) {
  const trueSpecies = speciesById[specimen.trueSpeciesId];
  const locality = localitiesById[specimen.origin];
  const pool = locality ? seedCandidates(locality, specimen.foundDepth) : [specimen.trueSpeciesId];
  return consistentSpecies(pool, speciesById, revealedReadings(specimen, trueSpecies));
}

/**
 * Take stones the player just dug. Any stone the FREE observations alone
 * already settle never reaches the bench — you knew what it was the moment you
 * picked it up, so making the player press a test to confirm it would be a
 * click that tells them nothing.
 *
 * Deliberately used only for stones the player dug themselves. Idle-caught
 * stones are admitted unresolved even when obvious, because resolving them
 * here would award reputation while the player was away — and reputation gates
 * seven of the ten localities.
 */
export function admitDugSpecimens(state, specimens) {
  const withAll = { ...state, rough: [...state.rough, ...specimens] };
  return specimens.reduce(
    (acc, specimen) => (stillConsistent(specimen).length === 1 ? resolveSpecimen(acc, specimen) : acc),
    withAll
  );
}

export function resolveSpecimen(state, specimen) {
  const speciesId = specimen.trueSpeciesId;
  const isNew = !state.gemdex.includes(speciesId);
  const newGemdex = isNew ? [...state.gemdex, speciesId] : state.gemdex;
  const newReputation = state.reputation + identifyReward(speciesById[speciesId]);
  return {
    ...state,
    rough: state.rough.filter((r) => r.instanceId !== specimen.instanceId),
    identified: [...state.identified, { ...specimen, stage: 'identified', identifiedAs: speciesId }],
    gemdex: newGemdex,
    newlyDiscovered: isNew ? [...state.newlyDiscovered, speciesId] : state.newlyDiscovered,
    reputation: newReputation,
    gear: withEarnedGear(newGemdex, newReputation, state.gear)
  };
}

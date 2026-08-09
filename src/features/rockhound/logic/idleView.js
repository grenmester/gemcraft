import { levelForXp } from './dive.js';
import { idleDepth, pendingCount, accruedHours, IDLE_CAP_HOURS } from './idle.js';
import { catchablePool } from './rollRough.js';
import { benchFull } from './bench.js';

// Presentation shapes for the sieve. Every number is produced by idle.js,
// bench.js or rollRough.js — this module chooses what to show and what to
// call it, never how to compute it.

/**
 * What a sieve parked here could catch, given what the player knows. The
 * count uses the same pool function the roll uses, so the promise on the
 * park control and the contents of the box cannot disagree.
 */
export function catchView(locality, gemdex, methodXp) {
  const level = levelForXp(methodXp);
  const depth = idleDepth(level, locality.maxDepth);
  const reachable = catchablePool(locality.findPool, depth);
  const catchable = catchablePool(locality.findPool, depth, new Set(gemdex));
  return {
    depth,
    catchable: catchable.length,
    total: reachable.length,
    canCatch: catchable.length > 0
  };
}

export function sieveView(sieve, localitiesById, gemdex, exploreMethodXp, rough, now) {
  if (!sieve) return null;
  const locality = localitiesById[sieve.localityId];
  if (!locality) return null;

  const level = levelForXp(exploreMethodXp[locality.method] ?? 0);
  const hours = accruedHours(sieve.since, now);
  const pending = pendingCount(level, sieve.since, now);
  const benchBlocked = benchFull(rough);
  return {
    localityName: locality.name,
    hours,
    atCap: hours >= IDLE_CAP_HOURS,
    pending,
    benchBlocked,
    canCollect: pending > 0 && !benchBlocked
  };
}

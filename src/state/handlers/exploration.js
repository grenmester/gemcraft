// src/state/handlers/exploration.js
import { localitiesById } from '../../data/localities/loader.js';
import { levelForXp } from '../../domain/dive.js';
import { idleDepth, pendingCount } from '../../domain/idle.js';
import { benchFull } from '../../domain/bench.js';
import { rollRough } from '../../domain/rollRough.js';
import { admitDugSpecimens } from '../resolve.js';
import { COLLECT_HAUL, PARK_SIEVE, COLLECT_SIEVE } from '../actions.js';

/**
 * What the parked box has caught since it was last emptied. Only species the
 * player has already catalogued: automation supplies material, never
 * discovery. Everything comes back unidentified, exactly like an active find.
 */
function collectSieve(state, now, rng, idFactory) {
  const locality = localitiesById[state.sieve.localityId];
  if (!locality) return [];
  const level = levelForXp(state.exploreMethodXp[locality.method] ?? 0);
  const depth = idleDepth(level, locality.maxDepth);
  const known = new Set(state.gemdex);
  const specimens = [];
  for (let i = 0; i < pendingCount(level, state.sieve.since, now); i++) {
    // rng and idFactory are passed through explicitly, never left to roll
    // Rough's defaults (Math.random / Date.now()-based ids) — those would
    // make the reducer impure. Callers of collectSieve are responsible for
    // guaranteeing both are present whenever a parked box needs emptying.
    const s = rollRough(locality, depth, rng, idFactory, known);
    if (s) specimens.push(s);
  }
  return specimens;
}

export function explorationHandler(state, action) {
  switch (action.type) {
    case COLLECT_HAUL: {
      const { specimens, method, xp } = action.payload;
      const known = Object.prototype.hasOwnProperty.call(state.exploreMethodXp, method);
      const withXp = {
        ...state,
        exploreMethodXp: known
          ? { ...state.exploreMethodXp, [method]: state.exploreMethodXp[method] + xp }
          : state.exploreMethodXp
      };
      return admitDugSpecimens(withXp, specimens);
    }

    case PARK_SIEVE: {
      const { localityId, now, rng, idFactory } = action.payload;
      if (!state.gear.includes('rocker_box')) return state;
      if (!localitiesById[localityId]) return state;

      // Moving collects first, so a move never destroys a haul. Refuse the
      // move on a full bench when there IS something pending — otherwise
      // park-cycling would collect past the cap.
      // No `?? Math.random` / `?? defaultId` fallback: naming either here
      // would break the reducer's purity. A caller that can have pending
      // yield (i.e. there is already a box parked) must supply both rng and
      // idFactory. A first park, with nothing parked yet, needs neither.
      if (state.sieve && (!rng || !idFactory)) return state;
      const pending = state.sieve ? collectSieve(state, now, rng, idFactory) : [];
      if (pending.length > 0 && benchFull(state.rough)) return state;

      return {
        ...state,
        rough: [...state.rough, ...pending],
        sieve: { localityId, since: now }
      };
    }

    case COLLECT_SIEVE: {
      const { now, rng, idFactory } = action.payload;
      if (!state.sieve) return state;
      // Same purity guard as PARK_SIEVE: a box is parked, so catching stones
      // is possible, so both impure inputs must be supplied explicitly.
      if (!rng || !idFactory) return state;
      if (benchFull(state.rough)) return state; // accrued time is kept

      const caught = collectSieve(state, now, rng, idFactory);
      return {
        ...state,
        rough: [...state.rough, ...caught],
        sieve: { ...state.sieve, since: now }
      };
    }

    default:
      return state;
  }
}

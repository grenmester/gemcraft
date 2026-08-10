// src/features/rockhound/RockhoundContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { species, speciesById } from '../../loaders/species.js';
import { localities, localitiesById } from '../../loaders/localities.js';
import { identifyReward } from './logic/identifyResult.js';
import { completedLocalityIds, completedFamilies, earnedGear, familiarityFactor } from './logic/progression.js';
import { cutTechniquesById } from '../../loaders/cutTechniques.js';
import { applyCut, canApplyToSpecimen, specimenScore } from './logic/cut.js';
import { identifiedValue, stoneValue, gearPrice } from './logic/market.js';
import { xpThreshold, MAX_METHOD_LEVEL, levelForXp } from './logic/dive.js';
import { idleDepth, pendingCount, MS_PER_HOUR } from './logic/idle.js';
import { benchFull } from './logic/bench.js';
import { rollRough } from './logic/rollRough.js';
import { runTest, consistentSpecies } from './logic/tests.js';
import { mergeReading, revealedReadings } from './logic/traits.js';
import { seedCandidates } from './logic/candidates.js';
import { HAND_LIVE_PLAY, AUTO_LIVE_PLAY } from './logic/precision.js';

export const ADD_ROUGH = 'ADD_ROUGH';
export const REVEAL_TRAIT = 'REVEAL_TRAIT';
export const CLEAR_NEW = 'CLEAR_NEW';
export const UNLOCK_TECHNIQUE = 'UNLOCK_TECHNIQUE';
export const LEVEL_TECHNIQUE = 'LEVEL_TECHNIQUE';
export const APPLY_CUT = 'APPLY_CUT';
export const SELL_IDENTIFIED = 'SELL_IDENTIFIED';
export const SELL_STONE = 'SELL_STONE';
export const BUY_GEAR = 'BUY_GEAR';
export const COLLECT_HAUL = 'COLLECT_HAUL';
export const DEBUG_SET_METHOD_LEVEL = 'DEBUG_SET_METHOD_LEVEL';
export const DEBUG_ADD_CASH = 'DEBUG_ADD_CASH';
export const DEBUG_RESET = 'DEBUG_RESET';
export const PARK_SIEVE = 'PARK_SIEVE';
export const COLLECT_SIEVE = 'COLLECT_SIEVE';
export const DEBUG_REWIND_SIEVE = 'DEBUG_REWIND_SIEVE';

export const STORAGE_KEY = 'rockhound_save_v1';

const MASTERY_CEILING = 100;
const MASTERY_PER_HAND_RUN = 8;
const MASTERY_PER_AUTO_RUN = 2;

export const initialRockhoundState = {
  rough: [],
  // { localityId, since } — where the rocker box (the idle device, gear id
  // `rocker_box`) is working. Unrelated to the `sieve` gear id in
  // logic/market.js's SHOP_GEAR, which is a different, ordinary shop item —
  // do not gate idle behaviour on `gear.includes('sieve')`.
  sieve: null,
  exploreMethodXp: { panning: 0, hardrock: 0, geode: 0, surface: 0 },
  identified: [],
  gemdex: [],
  newlyDiscovered: [],
  reputation: 0,
  gear: [],
  testMastery: { scratch: 0, heft: 0, uv: 0 },
  cutTechniqueLevel: {},
  bestSpecimens: {},
  lastCutResult: null,
  cash: 0,
  stones: []
};

// Union in any gear whose milestone is now satisfied by reputation + gemdex.
function withEarnedGear(gemdex, reputation, currentGear) {
  const ctx = {
    reputation,
    gear: currentGear,
    completedLocalities: completedLocalityIds(localities, gemdex),
    completedFamilies: completedFamilies(species, gemdex)
  };
  const merged = [...new Set([...currentGear, ...earnedGear(ctx)])];
  return merged.length === currentGear.length ? currentGear : merged;
}

/**
 * The stone's identity has become certain, so move it to the bench of
 * identified specimens.
 */
function resolveSpecimen(state, specimen) {
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

export function rockhoundReducer(state, action) {
  switch (action.type) {
    case ADD_ROUGH:
      return { ...state, rough: [...state.rough, action.payload] };

    case COLLECT_HAUL: {
      const { specimens, method, xp } = action.payload;
      const known = Object.prototype.hasOwnProperty.call(state.exploreMethodXp, method);
      return {
        ...state,
        rough: [...state.rough, ...specimens],
        exploreMethodXp: known
          ? { ...state.exploreMethodXp, [method]: state.exploreMethodXp[method] + xp }
          : state.exploreMethodXp
      };
    }

    case REVEAL_TRAIT: {
      const { instanceId, testId, byHand } = action.payload;
      const specimen = state.rough.find((r) => r.instanceId === instanceId);
      if (!specimen) return state;

      const trueSpecies = speciesById[specimen.trueSpeciesId];
      const livePlay = byHand ? HAND_LIVE_PLAY : AUTO_LIVE_PLAY;
      const reading = runTest(testId, trueSpecies, {
        mastery: state.testMastery[testId] ?? 0,
        livePlay,
        familiarity: familiarityFactor(trueSpecies.family, completedFamilies(species, state.gemdex))
      });

      const updated = { ...specimen, revealed: mergeReading(specimen.revealed, reading) };
      const gain = byHand ? MASTERY_PER_HAND_RUN : MASTERY_PER_AUTO_RUN;
      const withReading = {
        ...state,
        rough: state.rough.map((r) => (r.instanceId === instanceId ? updated : r)),
        testMastery: {
          ...state.testMastery,
          [testId]: Math.min(MASTERY_CEILING, (state.testMastery[testId] ?? 0) + gain)
        }
      };

      // Identity emerges: nothing is guessed, and nothing is clicked.
      const locality = localitiesById[specimen.origin];
      const pool = locality ? seedCandidates(locality, specimen.foundDepth) : [specimen.trueSpeciesId];
      const survivors = consistentSpecies(pool, speciesById, revealedReadings(updated, trueSpecies));
      return survivors.length === 1 ? resolveSpecimen(withReading, updated) : withReading;
    }

    case CLEAR_NEW:
      return { ...state, newlyDiscovered: [] };

    case UNLOCK_TECHNIQUE: {
      const { techniqueId } = action.payload;
      if ((state.cutTechniqueLevel[techniqueId] ?? 0) >= 1) return state;
      return { ...state, cutTechniqueLevel: { ...state.cutTechniqueLevel, [techniqueId]: 1 } };
    }

    case LEVEL_TECHNIQUE: {
      const { techniqueId } = action.payload;
      const current = state.cutTechniqueLevel[techniqueId] ?? 0;
      if (current < 1) return state; // must be unlocked first
      const max = cutTechniquesById[techniqueId]?.successCurve.maxLevel ?? current;
      const next = Math.min(current + 1, max);
      if (next === current) return state;
      return { ...state, cutTechniqueLevel: { ...state.cutTechniqueLevel, [techniqueId]: next } };
    }

    case APPLY_CUT: {
      const { instanceId, techniqueId, rng } = action.payload;
      const specimen = state.identified.find((s) => s.instanceId === instanceId);
      const technique = cutTechniquesById[techniqueId];
      const level = state.cutTechniqueLevel[techniqueId] ?? 0;
      if (!specimen || !technique || level < 1) return state;
      const species = speciesById[specimen.trueSpeciesId];
      if (!canApplyToSpecimen(specimen, species, technique)) return state;

      const result = applyCut(specimen, species, technique, level, rng ?? Math.random);
      const identified = state.identified.filter((s) => s.instanceId !== instanceId);

      let bestSpecimens = state.bestSpecimens;
      let stones = state.stones;
      if (result.specimen) {
        const score = specimenScore(result.specimen, species);
        const cutStone = { ...result.specimen, score };
        stones = [...state.stones, cutStone];
        const prev = state.bestSpecimens[species.id];
        if (!prev || score > prev.score) {
          bestSpecimens = { ...state.bestSpecimens, [species.id]: cutStone };
        }
      }
      return {
        ...state,
        identified,
        stones,
        bestSpecimens,
        lastCutResult: {
          instanceId,
          outcome: result.outcome,
          speciesId: species.id,
          cutQuality: result.specimen?.cutQuality ?? null,
          phenomena: result.specimen?.phenomena ?? []
        }
      };
    }

    case SELL_IDENTIFIED: {
      const { instanceId } = action.payload;
      const specimen = state.identified.find((s) => s.instanceId === instanceId);
      if (!specimen) return state;
      const species = speciesById[specimen.trueSpeciesId];
      return {
        ...state,
        identified: state.identified.filter((s) => s.instanceId !== instanceId),
        cash: state.cash + identifiedValue(specimen, species)
      };
    }

    case SELL_STONE: {
      const { instanceId } = action.payload;
      const stone = state.stones.find((s) => s.instanceId === instanceId);
      if (!stone) return state;
      const species = speciesById[stone.trueSpeciesId];
      return {
        ...state,
        stones: state.stones.filter((s) => s.instanceId !== instanceId),
        cash: state.cash + stoneValue(stone, species)
      };
    }

    case BUY_GEAR: {
      const { gearId } = action.payload;
      const price = gearPrice(gearId);
      if (price == null || state.gear.includes(gearId) || state.cash < price) return state;
      return { ...state, cash: state.cash - price, gear: [...state.gear, gearId] };
    }

    case DEBUG_SET_METHOD_LEVEL: {
      const { method, level } = action.payload;
      if (!Object.prototype.hasOwnProperty.call(state.exploreMethodXp, method)) return state;
      const clamped = Math.min(Math.max(Math.round(level), 0), MAX_METHOD_LEVEL);
      return {
        ...state,
        exploreMethodXp: { ...state.exploreMethodXp, [method]: xpThreshold(clamped) }
      };
    }

    case DEBUG_ADD_CASH:
      return { ...state, cash: state.cash + action.payload.amount };

    case DEBUG_RESET:
      return initialRockhoundState;

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

    case DEBUG_REWIND_SIEVE: {
      const { hours, now } = action.payload;
      if (!state.sieve) return state;
      return { ...state, sieve: { ...state.sieve, since: now - hours * MS_PER_HOUR } };
    }

    default:
      return state;
  }
}

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const merged = { ...initialRockhoundState, ...JSON.parse(saved) };
      return { ...merged, gear: withEarnedGear(merged.gemdex, merged.reputation, merged.gear), lastCutResult: null };
    }
  } catch (e) {
    console.error('Failed to load rockhound save:', e);
  }
  return initialRockhoundState;
}

const RockhoundContext = createContext(null);

export function RockhoundProvider({ children }) {
  const [state, dispatch] = useReducer(rockhoundReducer, initialRockhoundState, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save rockhound state:', e);
    }
  }, [state]);

  return <RockhoundContext.Provider value={{ state, dispatch }}>{children}</RockhoundContext.Provider>;
}

export function useRockhound() {
  const ctx = useContext(RockhoundContext);
  if (!ctx) throw new Error('useRockhound must be used within a RockhoundProvider');
  return ctx;
}

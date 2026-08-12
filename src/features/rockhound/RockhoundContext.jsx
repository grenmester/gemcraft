// src/features/rockhound/RockhoundContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { species, speciesById } from '../../data/species/loader.js';
import { localitiesById } from '../../data/localities/loader.js';
import { identifyReward } from '../../domain/identifyResult.js';
import { completedFamilies, familiarityFactor } from '../../domain/progression.js';
import { cutTechniquesById } from '../../data/cutTechniques/loader.js';
import { applyCut, canApplyToSpecimen, specimenScore } from '../../domain/cut.js';
import { identifiedValue, stoneValue, gearPrice } from '../../domain/market.js';
import { xpThreshold, MAX_METHOD_LEVEL, levelForXp } from '../../domain/dive.js';
import { idleDepth, pendingCount, MS_PER_HOUR } from '../../domain/idle.js';
import { benchFull } from '../../domain/bench.js';
import { rollRough } from '../../domain/rollRough.js';
import { runTest, consistentSpecies, GRADE_DEFS, runGrading } from '../../domain/gemTests.js';
import { mergeReading, revealedReadings } from '../../domain/traits.js';
import { seedCandidates } from '../../domain/candidates.js';
import { HAND_LIVE_PLAY, AUTO_LIVE_PLAY } from '../../domain/precision.js';
import { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE,
         APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
         DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET, PARK_SIEVE,
         COLLECT_SIEVE, DEBUG_REWIND_SIEVE } from '../../state/actions.js';
import { initialRockhoundState, backfillRough } from '../../state/initialState.js';
import { STORAGE_KEY, loadInitialState } from '../../state/persistence.js';
import { withEarnedGear } from '../../domain/progression.js';

export { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE,
         APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
         DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET, PARK_SIEVE,
         COLLECT_SIEVE, DEBUG_REWIND_SIEVE, initialRockhoundState, backfillRough, STORAGE_KEY };

const MASTERY_CEILING = 100;
const MASTERY_PER_HAND_RUN = 8;
const MASTERY_PER_AUTO_RUN = 2;

/**
 * The stone's identity has become certain, so move it to the bench of
 * identified specimens.
 */
/**
 * Everything observed about a stone so far, and what still fits it. Shared by
 * the two places that need to ask "is this settled yet?" — admitting a new
 * stone, and revealing a trait on one already on the bench.
 */
function stillConsistent(specimen) {
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
function admitDugSpecimens(state, specimens) {
  const withAll = { ...state, rough: [...state.rough, ...specimens] };
  return specimens.reduce(
    (acc, specimen) => (stillConsistent(specimen).length === 1 ? resolveSpecimen(acc, specimen) : acc),
    withAll
  );
}

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
      return admitDugSpecimens(state, [action.payload]);

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

    case REVEAL_TRAIT: {
      const { instanceId, testId, byHand } = action.payload;
      // Grading reaches identified stones too: you grade a stone before
      // selling or cutting it, and by then it has left the rough pile.
      const onBench = state.rough.find((r) => r.instanceId === instanceId);
      const specimen = onBench ?? state.identified.find((r) => r.instanceId === instanceId);
      if (!specimen) return state;

      const trueSpecies = speciesById[specimen.trueSpeciesId];
      const livePlay = byHand ? HAND_LIVE_PLAY : AUTO_LIVE_PLAY;
      const mastery = state.testMastery[testId] ?? 0;
      const reading = GRADE_DEFS[testId]
        ? runGrading(testId, specimen, { mastery, livePlay })
        : runTest(testId, trueSpecies, {
            mastery,
            livePlay,
            familiarity: familiarityFactor(trueSpecies.family, completedFamilies(species, state.gemdex))
          });

      const updated = { ...specimen, revealed: mergeReading(specimen.revealed, reading) };
      const gain = byHand ? MASTERY_PER_HAND_RUN : MASTERY_PER_AUTO_RUN;
      const swap = (list) => list.map((r) => (r.instanceId === instanceId ? updated : r));
      const withReading = {
        ...state,
        rough: onBench ? swap(state.rough) : state.rough,
        identified: onBench ? state.identified : swap(state.identified),
        testMastery: {
          ...state.testMastery,
          [testId]: Math.min(MASTERY_CEILING, mastery + gain)
        }
      };

      // Identity emerges from diagnostics only — a heavy stone is not a
      // different mineral, so grading can never move a stone off the bench.
      if (!onBench || GRADE_DEFS[testId]) return withReading;
      return stillConsistent(updated).length === 1
        ? resolveSpecimen(withReading, updated)
        : withReading;
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

      // No `?? Math.random` fallback — same purity guard as PARK_SIEVE and
      // COLLECT_SIEVE. rng must arrive in the action payload; a missing one
      // fails loudly (applyCut has no default of its own either) rather
      // than silently taking the reducer impure.
      const result = applyCut(specimen, species, technique, level, rng);
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

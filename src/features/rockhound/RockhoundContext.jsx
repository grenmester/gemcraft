// src/features/rockhound/RockhoundContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { species, speciesById } from '../../loaders/species.js';
import { localities } from '../../loaders/localities.js';
import { identifyReward, commitIdentification } from './logic/identifyResult.js';
import { completedLocalityIds, completedFamilies, earnedGear } from './logic/progression.js';
import { cutTechniquesById } from '../../loaders/cutTechniques.js';
import { applyCut, canApplyToSpecimen, specimenScore } from './logic/cut.js';
import { identifiedValue, stoneValue, gearPrice } from './logic/market.js';

export const ADD_ROUGH = 'ADD_ROUGH';
export const RECORD_TEST_SCORE = 'RECORD_TEST_SCORE';
export const COMMIT_IDENTIFY = 'COMMIT_IDENTIFY';
export const CLEAR_NEW = 'CLEAR_NEW';
export const UNLOCK_TECHNIQUE = 'UNLOCK_TECHNIQUE';
export const LEVEL_TECHNIQUE = 'LEVEL_TECHNIQUE';
export const APPLY_CUT = 'APPLY_CUT';
export const SELL_IDENTIFIED = 'SELL_IDENTIFIED';
export const SELL_STONE = 'SELL_STONE';
export const BUY_GEAR = 'BUY_GEAR';
export const COLLECT_HAUL = 'COLLECT_HAUL';

const STORAGE_KEY = 'rockhound_save_v1';

export const initialRockhoundState = {
  rough: [],
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

    case RECORD_TEST_SCORE: {
      const { testId, score } = action.payload;
      return {
        ...state,
        testMastery: {
          ...state.testMastery,
          [testId]: Math.max(state.testMastery[testId] ?? 0, score)
        }
      };
    }

    case COMMIT_IDENTIFY: {
      const { instanceId, guessId } = action.payload;
      const specimen = state.rough.find((r) => r.instanceId === instanceId);
      if (!specimen) return state;
      const { correct, specimen: updated } = commitIdentification(specimen, guessId);
      if (!correct) return state;

      const speciesId = updated.trueSpeciesId;
      const isNew = !state.gemdex.includes(speciesId);
      const newGemdex = isNew ? [...state.gemdex, speciesId] : state.gemdex;
      const newReputation = state.reputation + identifyReward(speciesById[speciesId]);
      return {
        ...state,
        rough: state.rough.filter((r) => r.instanceId !== instanceId),
        identified: [...state.identified, updated],
        gemdex: newGemdex,
        newlyDiscovered: isNew ? [...state.newlyDiscovered, speciesId] : state.newlyDiscovered,
        reputation: newReputation,
        gear: withEarnedGear(newGemdex, newReputation, state.gear)
      };
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

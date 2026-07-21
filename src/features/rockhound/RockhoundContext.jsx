// src/features/rockhound/RockhoundContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { species, speciesById } from '../../loaders/species.js';
import { localities } from '../../loaders/localities.js';
import { identifyReward, commitIdentification } from './logic/identifyResult.js';
import { completedLocalityIds, completedFamilies, earnedGear } from './logic/progression.js';
import { cutTechniquesById } from '../../loaders/cutTechniques.js';
import { applyCut, canApply, specimenScore } from './logic/cut.js';

export const ADD_ROUGH = 'ADD_ROUGH';
export const RECORD_TEST_SCORE = 'RECORD_TEST_SCORE';
export const COMMIT_IDENTIFY = 'COMMIT_IDENTIFY';
export const CLEAR_NEW = 'CLEAR_NEW';
export const UNLOCK_TECHNIQUE = 'UNLOCK_TECHNIQUE';
export const LEVEL_TECHNIQUE = 'LEVEL_TECHNIQUE';
export const APPLY_CUT = 'APPLY_CUT';

const STORAGE_KEY = 'rockhound_save_v1';

export const initialRockhoundState = {
  rough: [],
  identified: [],
  gemdex: [],
  newlyDiscovered: [],
  reputation: 0,
  gear: [],
  testMastery: { scratch: 0, heft: 0, uv: 0 },
  cutTechniqueLevel: {},
  bestSpecimens: {},
  lastCutResult: null
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
      if (!canApply(species, technique)) return state;

      const result = applyCut(specimen, species, technique, level, rng ?? Math.random);
      const identified = state.identified.filter((s) => s.instanceId !== instanceId);

      let bestSpecimens = state.bestSpecimens;
      if (result.specimen) {
        const score = specimenScore(result.specimen, species);
        const prev = state.bestSpecimens[species.id];
        if (!prev || score > prev.score) {
          bestSpecimens = { ...state.bestSpecimens, [species.id]: { ...result.specimen, score } };
        }
      }
      return {
        ...state,
        identified,
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

    default:
      return state;
  }
}

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const merged = { ...initialRockhoundState, ...JSON.parse(saved) };
      return { ...merged, gear: withEarnedGear(merged.gemdex, merged.reputation, merged.gear) };
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

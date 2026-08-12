// src/state/handlers/cut.js
import { speciesById } from '../../data/species/loader.js';
import { cutTechniquesById } from '../../data/cutTechniques/loader.js';
import { applyCut, canApplyToSpecimen, specimenScore } from '../../domain/cut.js';
import { APPLY_CUT, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE } from '../actions.js';

export function cutHandler(state, action) {
  switch (action.type) {
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

    default:
      return state;
  }
}

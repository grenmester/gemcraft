// src/state/handlers/identify.js
import { species, speciesById } from '../../data/species/loader.js';
import { completedFamilies, familiarityFactor } from '../../domain/progression.js';
import { runTest, GRADE_DEFS, runGrading } from '../../domain/gemTests.js';
import { mergeReading } from '../../domain/traits.js';
import { HAND_LIVE_PLAY, AUTO_LIVE_PLAY } from '../../domain/precision.js';
import { stillConsistent, resolveSpecimen, admitDugSpecimens } from '../resolve.js';
import { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW } from '../actions.js';

const MASTERY_CEILING = 100;
const MASTERY_PER_HAND_RUN = 8;
const MASTERY_PER_AUTO_RUN = 2;

export function identifyHandler(state, action) {
  switch (action.type) {
    case ADD_ROUGH:
      return admitDugSpecimens(state, [action.payload]);

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

    default:
      return state;
  }
}

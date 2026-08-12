import { initialRockhoundState, backfillRough } from './initialState.js';
import { withEarnedGear } from '../domain/progression.js';

export const STORAGE_KEY = 'rockhound_save_v1';

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save rockhound state:', e);
  }
}

export function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const merged = { ...initialRockhoundState, ...JSON.parse(saved) };
      return {
        ...merged,
        rough: merged.rough.map(backfillRough),
        gear: withEarnedGear(merged.gemdex, merged.reputation, merged.gear),
        lastCutResult: null
      };
    }
  } catch (e) {
    console.error('Failed to load rockhound save:', e);
  }
  return initialRockhoundState;
}

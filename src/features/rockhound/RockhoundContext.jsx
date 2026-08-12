// src/features/rockhound/RockhoundContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE,
         APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
         DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET, PARK_SIEVE,
         COLLECT_SIEVE, DEBUG_REWIND_SIEVE } from '../../state/actions.js';
import { initialRockhoundState, backfillRough } from '../../state/initialState.js';
import { STORAGE_KEY, loadInitialState } from '../../state/persistence.js';
import { rockhoundReducer } from '../../state/reducer.js';

export { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE,
         APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
         DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET, PARK_SIEVE,
         COLLECT_SIEVE, DEBUG_REWIND_SIEVE, initialRockhoundState, backfillRough, STORAGE_KEY,
         rockhoundReducer };

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

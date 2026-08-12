// src/state/RockhoundProvider.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialRockhoundState } from './initialState.js';
import { loadInitialState, saveState } from './persistence.js';
import { rockhoundReducer } from './reducer.js';

const RockhoundContext = createContext(null);

export function RockhoundProvider({ children }) {
  const [state, dispatch] = useReducer(rockhoundReducer, initialRockhoundState, loadInitialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return <RockhoundContext.Provider value={{ state, dispatch }}>{children}</RockhoundContext.Provider>;
}

export function useRockhound() {
  const ctx = useContext(RockhoundContext);
  if (!ctx) throw new Error('useRockhound must be used within a RockhoundProvider');
  return ctx;
}

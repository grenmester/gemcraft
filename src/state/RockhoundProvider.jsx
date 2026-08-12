// src/state/RockhoundProvider.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialRockhoundState } from './initialState.js';
import { STORAGE_KEY, loadInitialState } from './persistence.js';
import { rockhoundReducer } from './reducer.js';

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

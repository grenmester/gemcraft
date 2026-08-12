// src/state/handlers/debug.js
import { xpThreshold, MAX_METHOD_LEVEL } from '../../domain/dive.js';
import { MS_PER_HOUR } from '../../domain/idle.js';
import { initialRockhoundState } from '../initialState.js';
import { DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET,
         DEBUG_REWIND_SIEVE } from '../actions.js';

export function debugHandler(state, action) {
  switch (action.type) {
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

    case DEBUG_REWIND_SIEVE: {
      const { hours, now } = action.payload;
      if (!state.sieve) return state;
      return { ...state, sieve: { ...state.sieve, since: now - hours * MS_PER_HOUR } };
    }

    default:
      return state;
  }
}

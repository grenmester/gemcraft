// src/state/reducer.js
import * as A from './actions.js';
import { explorationHandler } from './handlers/exploration.js';
import { identifyHandler } from './handlers/identify.js';
import { cutHandler } from './handlers/cut.js';
import { economyHandler } from './handlers/economy.js';
import { debugHandler } from './handlers/debug.js';

// Which handler owns which action. Grouped by domain rather than by action
// name so that a change to, say, selling touches exactly one file.
const HANDLERS = {
  [A.COLLECT_HAUL]: explorationHandler,
  [A.PARK_SIEVE]: explorationHandler,
  [A.COLLECT_SIEVE]: explorationHandler,
  [A.ADD_ROUGH]: identifyHandler,
  [A.REVEAL_TRAIT]: identifyHandler,
  [A.CLEAR_NEW]: identifyHandler,
  [A.APPLY_CUT]: cutHandler,
  [A.UNLOCK_TECHNIQUE]: cutHandler,
  [A.LEVEL_TECHNIQUE]: cutHandler,
  [A.SELL_IDENTIFIED]: economyHandler,
  [A.SELL_STONE]: economyHandler,
  [A.BUY_GEAR]: economyHandler,
  [A.DEBUG_SET_METHOD_LEVEL]: debugHandler,
  [A.DEBUG_ADD_CASH]: debugHandler,
  [A.DEBUG_RESET]: debugHandler,
  [A.DEBUG_REWIND_SIEVE]: debugHandler
};

// An unmapped action type returns state untouched — the same behaviour as the
// `default: return state;` the single switch statement used to end with.
export function rockhoundReducer(state, action) {
  const handler = HANDLERS[action.type];
  return handler ? handler(state, action) : state;
}

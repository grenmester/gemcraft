import { createContext, useContext, useReducer, useEffect } from 'react';
import { Player } from '../models/Player.js';
import { Gem } from '../models/Gem.js';
import gemsData from '../data/gems.json';

import { GAME_PHASES } from '../constants.js';
import { EQUIPMENT } from '../data/equipment.js';

export { GAME_PHASES };

export const SET_PHASE = 'SET_PHASE';
export const SET_MINIGAME = 'SET_MINIGAME';
export const ADD_GEM = 'ADD_GEM';
export const ADD_COINS = 'ADD_COINS';
export const ADD_SHIFT_POINTS = 'ADD_SHIFT_POINTS';
export const LOAD_STATE = 'LOAD_STATE';
export const DEBUG_ADD_GEM = 'DEBUG_ADD_GEM';
export const DEBUG_SET_SHIFT = 'DEBUG_SET_SHIFT';
export const DEBUG_UNLOCK_ALL_LOCATIONS = 'DEBUG_UNLOCK_ALL_LOCATIONS';
export const DEBUG_MAX_INVENTORY = 'DEBUG_MAX_INVENTORY';
export const DEBUG_RESET = 'DEBUG_RESET';
export const BUY_EQUIPMENT = 'BUY_EQUIPMENT';
export const ADD_TO_INVENTORY = 'ADD_TO_INVENTORY';
export const REMOVE_FROM_INVENTORY = 'REMOVE_FROM_INVENTORY';

const STORAGE_KEY = 'gemstone_game_save';

const MIGRATION_VERSION = 2;

const initialPlayer = new Player();

const initialState = {
  player: initialPlayer.toJSON(),
  migrationVersion: MIGRATION_VERSION,
  phase: GAME_PHASES.MENU,
  activeMinigame: null
};

function migrateState(state) {
  let migrated = { ...state };
  
  if (!migrated.migrationVersion || migrated.migrationVersion < 2) {
    migrated = {
      ...migrated,
      migrationVersion: MIGRATION_VERSION,
      player: {
        ...migrated.player,
        inventory: migrated.player?.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: migrated.player?.coins || 100 } },
        locationProgress: migrated.player?.locationProgress || {},
        highScores: migrated.player?.highScores || {}
      }
    };
    delete migrated.inventory;
  }
  
  return migrated;
}

function gameReducer(state, action) {
  switch (action.type) {
    case SET_PHASE:
      return { ...state, phase: action.payload };

    case SET_MINIGAME:
      return { ...state, activeMinigame: action.payload };

    case ADD_GEM: {
      const gem = action.payload instanceof Gem ? action.payload : new Gem(action.payload);
      const newGems = [...state.player.gems, gem];
      const newCoins = state.player.coins + gem.getDisplayValue().baseValue;
      const newGemdex = state.player.gemdex.some(g => g.id === gem.id)
        ? state.player.gemdex
        : [...state.player.gemdex, gem];
      return {
        ...state,
        player: {
          ...state.player,
          gems: newGems,
          coins: newCoins,
          gemdex: newGemdex
        }
      };
    }

    case ADD_COINS:
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + action.payload
        }
      };

    case ADD_SHIFT_POINTS:
      return {
        ...state,
        player: {
          ...state.player,
          shiftPoints: (state.player.shiftPoints || 0) + action.payload
        }
      };

    case LOAD_STATE:
      return { ...initialState, ...action.payload };

    case DEBUG_ADD_GEM: {
      const gem = action.payload instanceof Gem ? action.payload : new Gem(action.payload);
      const newGems = [...state.player.gems, gem];
      const newGemdex = state.player.gemdex.some(g => g.id === gem.id)
        ? state.player.gemdex
        : [...state.player.gemdex, gem];
      return {
        ...state,
        player: {
          ...state.player,
          gems: newGems,
          gemdex: newGemdex
        }
      };
    }

    case DEBUG_SET_SHIFT:
      return {
        ...state,
        player: {
          ...state.player,
          shiftPoints: action.payload
        }
      };

    case DEBUG_UNLOCK_ALL_LOCATIONS:
      return {
        ...state,
        player: {
          ...state.player,
          shiftPoints: 5000
        }
      };

    case DEBUG_MAX_INVENTORY: {
      const maxGems = 100;
      const currentCount = state.player.gems?.length || 0;
      const needed = maxGems - currentCount;
      if (needed <= 0) return state;
      const sampleGems = gemsData.gems.slice(0, Math.min(needed, gemsData.gems.length));
      const newGems = [...state.player.gems];
      for (let i = 0; i < needed; i++) {
        const gemTemplate = sampleGems[i % sampleGems.length];
        newGems.push(new Gem({ ...gemTemplate, instanceId: `debug_${Date.now()}_${i}` }));
      }
      return {
        ...state,
        player: {
          ...state.player,
          gems: newGems
        }
      };
    }

    case DEBUG_RESET:
      return { ...initialState };

    case BUY_EQUIPMENT: {
      const eq = action.payload;
      const eqData = EQUIPMENT[eq];
      if (!eqData) return state;
      const cost = eqData.cost;
      if (state.player.coins < cost) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - cost,
          inventory: {
            ...state.player.inventory,
            equipment: [...(state.player.inventory?.equipment || []), eq]
          }
        }
      };
    }

    case ADD_TO_INVENTORY: {
      const { category, gemId, quantity = 1 } = action.payload;
      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const items = [...(inv[category] || [])];
      const existing = items.find(i => i.gemId === gemId);
      
      if (existing) {
        const idx = items.indexOf(existing);
        items[idx] = { ...existing, quantity: existing.quantity + quantity };
      } else {
        items.push({ gemId, quantity });
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            [category]: items
          }
        }
      };
    }

    case REMOVE_FROM_INVENTORY: {
      const { category, gemId, quantity = 1 } = action.payload;
      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const items = [...(inv[category] || [])];
      const existingIndex = items.findIndex(i => i.gemId === gemId);
      
      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        const newQuantity = existing.quantity - quantity;
        if (newQuantity <= 0) {
          items.splice(existingIndex, 1);
        } else {
          items[existingIndex] = { ...existing, quantity: newQuantity };
        }
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            [category]: items
          }
        }
      };
    }

    default:
      return state
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return migrateState({ ...initial, ...parsed });
      }
    } catch (e) {
      console.warn('Failed to load saved game:', e);
    }
    return initial;
  });

  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to save game:', e);
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game on change:', e);
    }
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

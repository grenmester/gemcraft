import { createContext, useContext, useReducer, useEffect } from 'react';
import { Player } from '../models/Player.js';
import { Inventory } from '../models/Inventory.js';
import { Gem } from '../models/Gem.js';

import { GAME_PHASES } from '../constants.js';

export { GAME_PHASES };

export const SET_PHASE = 'SET_PHASE';
export const SET_MINIGAME = 'SET_MINIGAME';
export const ADD_GEM = 'ADD_GEM';
export const ADD_COINS = 'ADD_COINS';
export const LOAD_STATE = 'LOAD_STATE';

const STORAGE_KEY = 'gemstone_game_save';

const initialPlayer = new Player();
const initialInventory = new Inventory();

const initialState = {
  player: initialPlayer.toJSON(),
  inventory: { capacity: initialInventory.capacity, items: [] },
  phase: GAME_PHASES.MENU,
  activeMinigame: null
};

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

    case LOAD_STATE:
      return { ...initialState, ...action.payload };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
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

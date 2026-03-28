import { createContext, useContext, useReducer, useEffect } from 'react';
import { Player } from '../models/Player.js';
import { Gem } from '../models/Gem.js';
import gemsData from '../data/gems.json';

import { GAME_PHASES } from '../constants.js';
import { EQUIPMENT } from '../data/equipment.js';
import { LOCATION_TIERS } from '../data/locations.js';

export { GAME_PHASES };

export const SET_PHASE = 'SET_PHASE';
export const SET_MINIGAME = 'SET_MINIGAME';
export const ADD_GEM = 'ADD_GEM';
export const ADD_COINS = 'ADD_COINS';
export const LOAD_STATE = 'LOAD_STATE';
export const DEBUG_ADD_GEM = 'DEBUG_ADD_GEM';
export const DEBUG_UNLOCK_ALL_LOCATIONS = 'DEBUG_UNLOCK_ALL_LOCATIONS';
export const DEBUG_MAX_INVENTORY = 'DEBUG_MAX_INVENTORY';
export const DEBUG_RESET = 'DEBUG_RESET';
export const BUY_EQUIPMENT = 'BUY_EQUIPMENT';
export const ADD_TO_INVENTORY = 'ADD_TO_INVENTORY';
export const REMOVE_FROM_INVENTORY = 'REMOVE_FROM_INVENTORY';

// Mineral actions
export const ADD_MINERAL = 'ADD_MINERAL';
export const REMOVE_MINERAL = 'REMOVE_MINERAL';

// Equipment actions
export const ADD_EQUIPMENT = 'ADD_EQUIPMENT';

// Zone actions
export const UNLOCK_ZONE = 'UNLOCK_ZONE';

// Discover state actions
export const SET_DISCOVER_TAB = 'SET_DISCOVER_TAB';
export const SELECT_LOCATION = 'SELECT_LOCATION';
export const SELECT_AREA = 'SELECT_AREA';
export const SET_REWARDS = 'SET_REWARDS';
export const CLEAR_REWARDS = 'CLEAR_REWARDS';
export const CLEAR_DISCOVER_SELECTION = 'CLEAR_DISCOVER_SELECTION';

const STORAGE_KEY = 'gemstone_game_save';

const MIGRATION_VERSION = 4;

const initialPlayer = new Player();

const initialState = {
  player: initialPlayer.toJSON(),
  migrationVersion: MIGRATION_VERSION,
  phase: GAME_PHASES.MENU,
  activeMinigame: null,
  discoverState: {
    activeTab: 'idle',       // 'idle' | 'panning'
    selectedLocation: null,  // 'TIER_1' | 'TIER_1_B' | ... | null
    selectedArea: null,      // 'area_1' | 'area_2' | 'area_3' | null
    lastRewards: null        // { coins, gems } | null
  },
  unlockedZones: [] // Array of location tier keys player can access
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

  // Migration to version 3: Add discoverState
  if (migrated.migrationVersion < 3) {
    migrated = {
      ...migrated,
      migrationVersion: MIGRATION_VERSION,
      discoverState: migrated.discoverState || {
        activeTab: 'idle',
        selectedLocation: null,
        selectedArea: null,
        lastRewards: null
      }
    };
  }

  // Migration to version 4: Add unlockedZones
  if (migrated.migrationVersion < 4) {
    migrated = {
      ...migrated,
      migrationVersion: MIGRATION_VERSION,
      unlockedZones: migrated.unlockedZones || []
    };
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

    case LOAD_STATE:
      return { ...initialState, ...action.payload, discoverState: { ...initialState.discoverState, ...(action.payload?.discoverState || {}) } };

    case DEBUG_ADD_GEM: {
      const gem = action.payload instanceof Gem ? action.payload : new Gem(action.payload);
      const newGemdex = state.player.gemdex.some(g => g.id === gem.id)
        ? state.player.gemdex
        : [...state.player.gemdex, gem];
      
      // Add to inventory structure (gems array)
      const inventory = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: state.player.coins || 100 } };
      const gems = [...(inventory.gems || [])];
      const existingGem = gems.find(g => g.gemId === gem.id);
      
      if (existingGem) {
        existingGem.quantity += 1;
      } else {
        gems.push({ gemId: gem.id, quantity: 1 });
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          gemdex: newGemdex,
          inventory: {
            ...inventory,
            gems
          }
        }
      };
    }

case DEBUG_UNLOCK_ALL_LOCATIONS: {
  // Unlock all zones (all tier keys from LOCATION_TIERS)
  const allZoneKeys = Object.keys(LOCATION_TIERS);
  
  // Give all equipment (excluding NONE)
  const allEquipmentIds = Object.keys(EQUIPMENT).filter(id => id !== 'NONE');
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const existingEquipment = inv.equipment || [];
  const newEquipment = [...new Set([...existingEquipment, ...allEquipmentIds])];
  
  // Give some minerals for testing
  const testMinerals = [
    { id: 'clear_quartz', quantity: 50 },
    { id: 'hematite', quantity: 50 },
    { id: 'pyrite', quantity: 50 },
    { id: 'fluorite', quantity: 50 },
    { id: 'obsidian', quantity: 50 },
    { id: 'lapis_lazuli', quantity: 30 },
    { id: 'malachite', quantity: 30 },
    { id: 'azurite', quantity: 30 },
    { id: 'labradorite', quantity: 20 },
    { id: 'celestite', quantity: 20 }
  ];
  const existingMinerals = inv.minerals || [];
  const newMinerals = testMinerals.map(tm => {
    const existing = existingMinerals.find(m => m.id === tm.id);
    if (existing) {
      return { ...existing, quantity: existing.quantity + tm.quantity };
    }
    return tm;
  });
  
  return {
    ...state,
    unlockedZones: allZoneKeys,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        equipment: newEquipment,
        minerals: newMinerals
      }
    }
  };
}

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

// Mineral-specific actions (convenience wrappers)
case ADD_MINERAL: {
  const { mineralId, quantity = 1 } = action.payload;
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const minerals = [...(inv.minerals || [])];
  const existing = minerals.find(m => m.id === mineralId || m.gemId === mineralId);
  
  if (existing) {
    const idx = minerals.indexOf(existing);
    minerals[idx] = { ...existing, quantity: existing.quantity + quantity };
  } else {
    minerals.push({ id: mineralId, quantity });
  }
  
  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        minerals
      }
    }
  };
}

case REMOVE_MINERAL: {
  const { mineralId, quantity = 1 } = action.payload;
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const minerals = [...(inv.minerals || [])];
  const existingIndex = minerals.findIndex(m => m.id === mineralId || m.gemId === mineralId);
  
  if (existingIndex >= 0) {
    const existing = minerals[existingIndex];
    const newQuantity = existing.quantity - quantity;
    if (newQuantity <= 0) {
      minerals.splice(existingIndex, 1);
    } else {
      minerals[existingIndex] = { ...existing, quantity: newQuantity };
    }
  }
  
  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        minerals
      }
    }
  };
}

case ADD_EQUIPMENT: {
  const equipmentId = action.payload;
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const equipment = [...(inv.equipment || [])];
  
  if (!equipment.includes(equipmentId)) {
    equipment.push(equipmentId);
  }
  
  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        equipment
      }
    }
  };
}

case UNLOCK_ZONE: {
  const zoneId = action.payload;
  const unlockedZones = state.unlockedZones || [];
  
  if (unlockedZones.includes(zoneId)) {
    return state;
  }
  
  return {
    ...state,
    unlockedZones: [...unlockedZones, zoneId]
  };
}

// Discover state actions
    case SET_DISCOVER_TAB:
      return {
        ...state,
        discoverState: {
          ...state.discoverState,
          activeTab: action.payload
        }
      };

    case SELECT_LOCATION:
      return {
        ...state,
        discoverState: {
          ...state.discoverState,
          selectedLocation: action.payload,
          selectedArea: null
        }
      };

    case SELECT_AREA:
      return {
        ...state,
        discoverState: {
          ...state.discoverState,
          selectedArea: action.payload
        }
      };

    case SET_REWARDS:
      return {
        ...state,
        discoverState: {
          ...state.discoverState,
          lastRewards: action.payload
        }
      };

    case CLEAR_REWARDS:
      return {
        ...state,
        discoverState: {
          ...state.discoverState,
          lastRewards: null
        }
      };

    case CLEAR_DISCOVER_SELECTION:
      return {
        ...state,
        discoverState: {
          activeTab: 'idle',
          selectedLocation: null,
          selectedArea: null,
          lastRewards: null
        }
      };

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

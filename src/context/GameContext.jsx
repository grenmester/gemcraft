import { createContext, useContext, useReducer, useEffect } from 'react';
import { Player } from '../models/Player.js';
import { Gem } from '../models/Gem.js';
import { GAME_PHASES } from '../constants.js';
import { items, itemsById } from '../loaders/items.js';
import { EQUIPMENT } from '../loaders/equipment.js';
import { PROCESS_EQUIPMENT } from '../data/processEquipment.js';
import { LOCATION_TIERS } from '../loaders/locations.js';
import { removeItemFromInventory, addItemToInventory } from './inventoryHelpers.js';
import { SUBAREA_LOOT } from '../data/subareas.js';

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

// Process actions
export const START_ACTIVE_PROCESS = 'START_ACTIVE_PROCESS';
export const COMPLETE_ACTIVE_PROCESS = 'COMPLETE_ACTIVE_PROCESS';
export const QUEUE_ITEM = 'QUEUE_ITEM';
export const START_QUEUE_PROCESS = 'START_QUEUE_PROCESS';
export const COMPLETE_QUEUE_PROCESS = 'COMPLETE_QUEUE_PROCESS';
export const COLLECT_QUEUE_ITEM = 'COLLECT_QUEUE_ITEM';
export const CANCEL_QUEUE_ITEM = 'CANCEL_QUEUE_ITEM';
export const UPDATE_PROCESS_STATS = 'UPDATE_PROCESS_STATS';
export const UNLOCK_QUEUE_SLOT = 'UNLOCK_QUEUE_SLOT';

// Zone actions
export const UNLOCK_ZONE = 'UNLOCK_ZONE';

// Process equipment actions
export const BUY_PROCESS_EQUIPMENT = 'BUY_PROCESS_EQUIPMENT';
export const EQUIP_PROCESS_TOOL = 'EQUIP_PROCESS_TOOL';

// Discover state actions
export const SET_DISCOVER_TAB = 'SET_DISCOVER_TAB';
export const SELECT_LOCATION = 'SELECT_LOCATION';
export const SELECT_AREA = 'SELECT_AREA';
export const SET_REWARDS = 'SET_REWARDS';
export const CLEAR_REWARDS = 'CLEAR_REWARDS';
export const CLEAR_DISCOVER_SELECTION = 'CLEAR_DISCOVER_SELECTION';

// New Discover navigation actions
export const SELECT_MINE = 'SELECT_MINE';
export const SELECT_SUBAREA = 'SELECT_SUBAREA';
export const CLEAR_MINING_SELECTION = 'CLEAR_MINING_SELECTION';
export const MINE_SUBAREA = 'MINE_SUBAREA';
export const COLLECT_PENDING_MATERIALS = 'COLLECT_PENDING_MATERIALS';

const INITIAL_QUEUE_SLOTS = 2;

const STORAGE_KEY = 'gemstone_game_save';

const MIGRATION_VERSION = 5;

// Quality ranges by mine tier (min%, max%)
const TIER_QUALITY_RANGES = {
  TIER_1: { min: 95, max: 100 },
  TIER_1_B: { min: 90, max: 98 },
  TIER_1_C: { min: 85, max: 95 },
  TIER_2: { min: 85, max: 95 },
  TIER_2_B: { min: 80, max: 92 },
  TIER_2_C: { min: 75, max: 88 },
  TIER_3: { min: 75, max: 88 },
  TIER_3_B: { min: 70, max: 85 },
  TIER_3_C: { min: 65, max: 80 },
  TIER_4: { min: 65, max: 80 },
  TIER_4_B: { min: 60, max: 78 },
  TIER_4_C: { min: 55, max: 75 },
  TIER_5: { min: 55, max: 75 },
  TIER_5_B: { min: 50, max: 72 },
  TIER_5_C: { min: 45, max: 68 },
};

/**
 * Generate a random quality within the tier range
 * @param {string} mineId - The tier key
 * @returns {number} Quality percentage (rounded to 1 decimal)
 */
function generateCollectionQuality(mineId) {
  const range = TIER_QUALITY_RANGES[mineId] || TIER_QUALITY_RANGES.TIER_1;
  const quality = range.min + Math.random() * (range.max - range.min);
  return Math.round(quality * 10) / 10;
}

const initialPlayer = new Player();

 const initialState = {
    player: initialPlayer.toJSON(),
    migrationVersion: MIGRATION_VERSION,
    phase: GAME_PHASES.MENU,
    activeMinigame: null,
    discoverState: {
      activeTab: 'panning',     // 'panning' | 'idle' (default: panning)
      selectedMine: null,        // 'TIER_1' | 'TIER_1_B' | ... | null
      selectedSubarea: null,     // 'area_a' | 'area_b' | 'area_c' | null
      pendingMaterials: {},      // { TIER_1: [{ itemId, quantity }], ... }
      miningCooldowns: {},       // { TIER_1_area_a: { small: timestamp } }
      lastRewards: null          // { coins, gems } | null (legacy)
    },
    unlockedZones: [], // Array of location tier keys player can access
     processState: {
       activeProcess: null,        // { itemId, processType, startTime, quality, qualityLevel }
       queue: [],                  // [{ itemId, processType, startTime, estimatedCompletion }]
       queueSlots: INITIAL_QUEUE_SLOTS,  // Unlocked queue slots (level unlocks more)
       completedQueue: [],         // Finished items waiting for collection
       processCooldowns: {},      // { [itemId]: { low: timestamp, medium: timestamp, high: timestamp } }
       processingStats: {
         totalProcessed: 0,
         masterworksCreated: 0,
         bestQuality: 0,
       }
    }
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

  // Migration to version 5: New Discover state structure
  if (migrated.migrationVersion < 5) {
    migrated = {
      ...migrated,
      migrationVersion: MIGRATION_VERSION,
      discoverState: {
        ...migrated.discoverState,
        activeTab: migrated.discoverState?.activeTab === 'idle' ? 'idle' : 'panning',
        selectedMine: migrated.discoverState?.selectedLocation || null,
        selectedSubarea: null,
        pendingMaterials: {},
        miningCooldowns: {}
      }
    };
  }

   return migrated;
 }

 export function gameReducer(state, action) {
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
      const gemItems = items.filter(item => item.category === 'Gem');
      const sampleGems = gemItems.slice(0, Math.min(needed, gemItems.length));
      const newGems = [...state.player.gems];
      for (let i = 0; i < needed; i++) {
        const item = sampleGems[i % sampleGems.length];
        newGems.push(new Gem({
          id: item.id,
          name: item.name,
          mohs: item.hardness,
          color: item.rarity,
          facts: [],
          values: [item.value]
        }));
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
           ...state.discoverState,
           selectedMine: null,
           selectedSubarea: null
         }
       };

     // New Discover navigation actions
     case SELECT_MINE:
       return {
         ...state,
         discoverState: {
           ...state.discoverState,
           selectedMine: action.payload,
           selectedSubarea: null
         }
       };

     case SELECT_SUBAREA:
       return {
         ...state,
         discoverState: {
           ...state.discoverState,
           selectedSubarea: action.payload
         }
       };

     case CLEAR_MINING_SELECTION:
       return {
         ...state,
         discoverState: {
           ...state.discoverState,
           selectedMine: null,
           selectedSubarea: null
         }
       };

     case MINE_SUBAREA: {
       const { mineId, subareaId, rewardSize } = action.payload;
       const cooldownKey = `${mineId}_${subareaId}`;
       const now = Date.now();
       
       const cooldowns = state.discoverState.miningCooldowns[cooldownKey] || {};
       const lastMined = cooldowns[rewardSize] || 0;
       const cooldownDuration = rewardSize === 'small' ? 5000 : rewardSize === 'medium' ? 15000 : 30000;
       
       if (now - lastMined < cooldownDuration) {
         throw new Error(`Mining on cooldown. Try again in ${Math.ceil((cooldownDuration - (now - lastMined)) / 1000)}s`);
       }
       
       const itemCount = rewardSize === 'small' ? 1 : rewardSize === 'medium' ? 3 : 5;
       const pending = state.discoverState.pendingMaterials[mineId] || [];
       
       // Roll for loot using SUBAREA_LOOT
       const lootTable = SUBAREA_LOOT[mineId]?.[subareaId] || SUBAREA_LOOT.TIER_1?.area_a || [];
       const rolledItems = [];
       
       for (let i = 0; i < itemCount; i++) {
         const totalWeight = lootTable.reduce((sum, item) => sum + item.weight, 0);
         let roll = Math.random() * totalWeight;
         
         for (const lootEntry of lootTable) {
           roll -= lootEntry.weight;
           if (roll <= 0) {
             rolledItems.push({ itemId: lootEntry.itemId, quantity: 1 });
             break;
           }
         }
         
         // Fallback if no match
         if (rolledItems.length <= i && lootTable.length === 0) {
           rolledItems.push({ itemId: 'clear_quartz', quantity: 1 });
         }
       }
       
       // Aggregate same items
       const aggregatedItems = [];
       const itemMap = new Map();
       for (const item of rolledItems) {
         if (itemMap.has(item.itemId)) {
           itemMap.get(item.itemId).quantity += item.quantity;
         } else {
           itemMap.set(item.itemId, { ...item });
           aggregatedItems.push(itemMap.get(item.itemId));
         }
       }
       
       const newPending = [...pending, ...aggregatedItems];
       
       return {
         ...state,
         discoverState: {
           ...state.discoverState,
           pendingMaterials: {
             ...state.discoverState.pendingMaterials,
             [mineId]: newPending
           },
           miningCooldowns: {
             ...state.discoverState.miningCooldowns,
             [cooldownKey]: {
               ...cooldowns,
               [rewardSize]: now
             }
           }
         }
       };
      }

      case COLLECT_PENDING_MATERIALS: {
        const { mineId } = action.payload;
        const pending = state.discoverState.pendingMaterials[mineId] || [];
        if (pending.length === 0) return state;
        
        // Generate quality for this collection batch (same for all items)
        const batchQuality = generateCollectionQuality(mineId);
        
        const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
        const newMinerals = [...(inv.minerals || [])];
        const newGems = [...(inv.gems || [])];
        
        pending.forEach(({ itemId, quantity }) => {
          const itemData = itemsById[itemId];
          if (itemData?.category === 'Mineral') {
            const existing = newMinerals.find(m => m.id === itemId);
            if (existing) {
              existing.quantity += quantity;
            } else {
              newMinerals.push({ id: itemId, quantity, quality: batchQuality });
            }
          } else {
            const existing = newGems.find(g => g.gemId === itemId);
            if (existing) {
              existing.quantity += quantity;
            } else {
              newGems.push({ gemId: itemId, quantity, quality: batchQuality });
            }
          }
        });
        
        return {
          ...state,
          discoverState: {
            ...state.discoverState,
            pendingMaterials: {
              ...state.discoverState.pendingMaterials,
              [mineId]: []
            }
          },
          player: {
            ...state.player,
            inventory: {
              ...inv,
              minerals: newMinerals,
              gems: newGems
            }
          }
        };
      }

    // Process actions
    case START_ACTIVE_PROCESS: {
      const { itemId, processType, qualityLevel } = action.payload || {};
      
      // Quality level configuration
      const QUALITY_CONFIG = {
        low: { base: 40, variance: 20, cooldown: 3000 },    // 40-60%, 3s cooldown
        medium: { base: 60, variance: 20, cooldown: 8000 }, // 60-80%, 8s cooldown
        high: { base: 80, variance: 20, cooldown: 15000 }   // 80-100%, 15s cooldown
      };
      
      const config = QUALITY_CONFIG[qualityLevel] || QUALITY_CONFIG.low;
      
      // Calculate quality based on level
      const quality = config.base + Math.random() * config.variance;
      
      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const { minerals, gems, removed } = removeItemFromInventory(inv, itemId);

      if (!removed) return state;
      
      // Set cooldown for this quality level
      const cooldownKey = `${itemId}_${qualityLevel}`;
      const now = Date.now();
      const currentCooldowns = state.processState.processCooldowns[itemId] || {};

      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            minerals,
            gems
          }
        },
        processState: {
          ...state.processState,
          activeProcess: { 
            itemId, 
            processType, 
            startTime: now, 
            quality: Math.round(quality * 10) / 10,
            qualityLevel,
            cooldownDuration: config.cooldown
          },
          processCooldowns: {
            ...state.processState.processCooldowns,
            [itemId]: {
              ...currentCooldowns,
              [qualityLevel]: now + config.cooldown
            }
          }
        }
      };
    }

    case COMPLETE_ACTIVE_PROCESS: {
      const active = state.processState.activeProcess;
      if (!active) return state;

      const { quality = active.quality || 0 } = action.payload || {};
      const { itemId } = active;
      
      // Get item data for value calculation
      const itemData = itemsById[itemId];
      const baseValue = itemData?.value || 0;
      
      // Apply quality multiplier
      const qualityMultiplier = quality / 100;
      const qualityAdjustedValue = Math.round(baseValue * qualityMultiplier);
      
      // Apply masterwork bonus at 90%+ quality
      const isMasterwork = quality >= 90;
      const finalValue = isMasterwork 
        ? Math.round(qualityAdjustedValue * 1.25) 
        : qualityAdjustedValue;

      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const { minerals, gems } = addItemToInventory(inv, itemId, 1, Math.round(quality * 10) / 10);

      const stats = state.processState.processingStats;
      const newTotalProcessed = stats.totalProcessed + 1;
      const newMasterworksCreated = isMasterwork ? stats.masterworksCreated + 1 : stats.masterworksCreated;
      const newBestQuality = Math.max(stats.bestQuality, quality);

      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            minerals,
            gems
          }
        },
        processState: {
          ...state.processState,
          activeProcess: null,
          processingStats: {
            totalProcessed: newTotalProcessed,
            masterworksCreated: newMasterworksCreated,
            bestQuality: newBestQuality
          }
        }
      };
    }

    case QUEUE_ITEM: {
      const { itemId, processType, estimatedCompletion, startTime = Date.now() } = action.payload;
      if (state.processState.queue.length >= state.processState.queueSlots) {
        return state;
      }
      const newQueueItem = { itemId, processType, startTime, estimatedCompletion };
      return {
        ...state,
        processState: {
          ...state.processState,
          queue: [...state.processState.queue, newQueueItem]
        }
      };
    }

    case START_QUEUE_PROCESS: {
      const queue = state.processState.queue;
      if (queue.length === 0) return state;

      const [next, ...rest] = queue;
      const { itemId, processType, estimatedCompletion } = next;

      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const { minerals, gems, removed } = removeItemFromInventory(inv, itemId);

      if (!removed) return state;

      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            minerals,
            gems
          }
        },
        processState: {
          ...state.processState,
          queue: rest,
          activeProcess: {
            itemId,
            processType,
            startTime: Date.now(),
            estimatedCompletion,
            quality: 0
          }
        }
      };
    }

    case COMPLETE_QUEUE_PROCESS: {
      const active = state.processState.activeProcess;
      if (!active) return state;
      return {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: null,
          completedQueue: [...state.processState.completedQueue, active]
        }
      };
    }

    case COLLECT_QUEUE_ITEM: {
      const { index } = action.payload || {};
      if (index === undefined) return state;
      const completedQueue = state.processState.completedQueue;
      if (index < 0 || index >= completedQueue.length) return state;

      const completed = completedQueue[index];
      const newCompletedQueue = completedQueue.filter((_, i) => i !== index);
      const { itemId } = completed;

      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const { minerals, gems } = addItemToInventory(inv, itemId);

      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            minerals,
            gems
          }
        },
        processState: {
          ...state.processState,
          completedQueue: newCompletedQueue
        }
      };
    }

    case CANCEL_QUEUE_ITEM: {
      const { index } = action.payload || {};
      if (index === undefined) return state;
      const queue = state.processState.queue;
      if (index < 0 || index >= queue.length) return state;

      const cancelled = queue[index];
      const newQueue = queue.filter((_, i) => i !== index);
      const { itemId } = cancelled;

      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const { minerals, gems } = addItemToInventory(inv, itemId);

      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            minerals,
            gems
          }
        },
        processState: {
          ...state.processState,
          queue: newQueue
        }
      };
    }

    case UPDATE_PROCESS_STATS: {
      const statsUpdate = action.payload;
      const currentStats = state.processState.processingStats;
      return {
        ...state,
        processState: {
          ...state.processState,
          processingStats: {
            ...currentStats,
            ...statsUpdate
          }
        }
      };
    }

    case UNLOCK_QUEUE_SLOT: {
      const amount = action.payload?.amount || 1;
      return {
        ...state,
        processState: {
          ...state.processState,
          queueSlots: state.processState.queueSlots + amount
        }
      };
    }

    case BUY_PROCESS_EQUIPMENT: {
      const equipmentId = action.payload;
      const eq = PROCESS_EQUIPMENT[equipmentId];
      if (!eq) return state;
      const cost = eq.cost;
      if (state.player.coins < cost) return state;
      
      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], processEquipment: [], currency: { coins: 0 } };
      const processEquipment = [...(inv.processEquipment || [])];
      
      if (!processEquipment.includes(equipmentId)) {
        processEquipment.push(equipmentId);
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - cost,
          inventory: {
            ...inv,
            processEquipment
          }
        }
      };
    }

    case EQUIP_PROCESS_TOOL: {
      const { processType, equipmentId } = action.payload;
      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], processEquipment: [], currency: { coins: 0 } };
      const equippedTools = state.player.equippedTools || {};
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv
          },
          equippedTools: {
            ...equippedTools,
            [processType]: equipmentId
          }
        }
      };
    }

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

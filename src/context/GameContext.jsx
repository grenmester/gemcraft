import { createContext, useContext, useReducer, useEffect } from 'react';
import { GAME_PHASES } from '../constants.js';
import { items, itemsById } from '../loaders/items.js';
import { EQUIPMENT } from '../loaders/equipment.js';
import { PROCESS_EQUIPMENT } from '../data/processEquipment.js';
import { LOCATION_TIERS } from '../loaders/locations.js';
import { removeItemFromInventory, addItemToInventory } from './inventoryHelpers.js';
import { SUBAREA_LOOT } from '../data/subareas.js';
import { getRecipeById, JEWELRY_TYPES, SETTINGS } from '../data/recipes.js';
import { createInitialPlayer, createInitialInventory } from '../schemas/player.js';

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
export const TICK_QUEUE = 'TICK_QUEUE';

// Zone actions
export const UNLOCK_ZONE = 'UNLOCK_ZONE';

// Process equipment actions
export const BUY_PROCESS_EQUIPMENT = 'BUY_PROCESS_EQUIPMENT';
export const EQUIP_PROCESS_TOOL = 'EQUIP_PROCESS_TOOL';
export const UPGRADE_PROCESS_EQUIPMENT = 'UPGRADE_PROCESS_EQUIPMENT';

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

// Process actions
export const REFINING = 'REFINING';

// Craft actions
export const CRAFT_ITEM = 'CRAFT_ITEM';
export const CRAFT_ITEM_SUCCESS = 'CRAFT_ITEM_SUCCESS';
export const SELL_ITEMS = 'SELL_ITEMS';

const INITIAL_QUEUE_SLOTS = 2;
const PROCESS_TICK_INTERVAL = 1000; // Check queue every second

const STORAGE_KEY = 'gemstone_game_save';

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

const initialPlayer = createInitialPlayer();

const initialState = {
  player: initialPlayer,
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
        },
        equippedTools: {           // Currently equipped process equipment by type
          cleaning: 'basic_tumbler',
          cutting: 'basic_cutter',
          faceting: 'hand_faceter'
        }
     }
 };

// Use initial state directly - no migrations
const initialGameState = initialState;

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate and use saved state, but ensure inventory has correct structure
      const savedInventory = parsed.player?.inventory;
      if (savedInventory) {
        parsed.player.inventory = {
          rawMaterials: savedInventory.rawMaterials || [],
          processedMaterials: savedInventory.processedMaterials || [],
          jewelry: savedInventory.jewelry || [],
          equipment: savedInventory.equipment || [],
          processEquipment: savedInventory.processEquipment || [],
          coins: savedInventory.coins ?? 100,
        };
      }
      return { ...initialGameState, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load saved game:', e);
  }
  return initialGameState;
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
        
        const inv = state.player.inventory || { minerals: [], gems: [], ores: [], equipment: [], currency: { coins: 0 } };
        const newMinerals = [...(inv.minerals || [])];
        const newGems = [...(inv.gems || [])];
        const newOres = [...(inv.ores || [])];
        
        pending.forEach(({ itemId, quantity }) => {
          const itemData = itemsById[itemId];
          if (itemData?.category === 'Ore') {
            // Stack with existing ores (unprocessed, no quality)
            const existing = newOres.find(o => o.id === itemId);
            if (existing) {
              existing.quantity += quantity;
            } else {
              newOres.push({ id: itemId, quantity });
            }
          } else if (itemData?.category === 'Mineral') {
            // Stack with existing items that have no quality (unprocessed)
            const existing = newMinerals.find(m => m.id === itemId && m.quality === undefined);
            if (existing) {
              existing.quantity += quantity;
            } else {
              newMinerals.push({ id: itemId, quantity }); // No quality for unprocessed
            }
          } else {
            // Stack with existing items that have no quality (unprocessed)
            const existing = newGems.find(g => g.gemId === itemId && g.quality === undefined);
            if (existing) {
              existing.quantity += quantity;
            } else {
              newGems.push({ gemId: itemId, quantity }); // No quality for unprocessed
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
              gems: newGems,
              ores: newOres
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

    case REFINING: {
      const { itemId } = action.payload;
      
      // Get ore data
      const oreData = itemsById[itemId];
      if (!oreData) return state;
      
      // Determine metal output - use base name (copper, silver, etc.) not ingot ID
      // This matches what recipes expect (e.g., 'copper' not 'copper_ingot')
      const oreToMetal = {
        copper_ore: 'copper',
        silver_ore: 'silver',
        gold_ore: 'gold',
        platinum_ore: 'platinum'
      };
      const metalId = oreToMetal[itemId] || oreData.id.replace('_ore', '');
      
      // Calculate quality based on ore type
      const QUALITY_RANGES = {
        copper: { min: 60, max: 80 },
        silver: { min: 65, max: 82 },
        gold: { min: 70, max: 88 },
        platinum: { min: 75, max: 92 }
      };
      const range = QUALITY_RANGES[metalId] || { min: 70, max: 85 };
      const quality = range.min + Math.random() * (range.max - range.min);
      
      const inv = state.player.inventory || {};
      const ores = [...(inv.ores || [])];
      const metals = [...(inv.metals || [])];
      
      // Remove ore
      const oreIdx = ores.findIndex(o => o.id === itemId);
      if (oreIdx >= 0) {
        if (ores[oreIdx].quantity > 1) {
          ores[oreIdx] = { ...ores[oreIdx], quantity: ores[oreIdx].quantity - 1 };
        } else {
          ores.splice(oreIdx, 1);
        }
      }
      
      // Add metal
      const existingMetal = metals.find(m => m.id === metalId && Math.round(m.quality / 5) * 5 === Math.round(quality / 5) * 5);
      if (existingMetal) {
        existingMetal.quantity += 1;
      } else {
        metals.push({ id: metalId, quantity: 1, quality: Math.round(quality * 10) / 10 });
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv,
            ores,
            metals
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
      const { itemId, processType } = completed;

      // Calculate quality based on equipped tool
      const equippedTool = state.processState.equippedTools?.[processType];
      let quality = 50; // Default quality
      
      // Import utility functions inline to avoid circular dependency issues
      const IDLE_QUALITY_RANGES = {
        cleaning: { min: 50, max: 75 },
        cutting: { min: 45, max: 70 },
        faceting: { min: 40, max: 65 },
      };
      
      if (processType && IDLE_QUALITY_RANGES[processType]) {
        const range = IDLE_QUALITY_RANGES[processType];
        const hash = (processType + (completed.itemId || '')).split('').reduce((acc, char) => {
          return acc + char.charCodeAt(0);
        }, 0);
        const ratio = (hash % 100) / 100;
        quality = range.min + ratio * (range.max - range.min);
        
        // Apply equipment quality bonus (from PROCESS_EQUIPMENT)
        const PROCESS_EQUIPMENT_BONUSES = {
          basic_tumbler: { cleaning: 0 },
          vibrating_tumbler: { cleaning: 5 },
          sonic_cleaner: { cleaning: 10 },
          industrial_cleaner: { cleaning: 15 },
          basic_cutter: { cutting: 0 },
          precision_cutter: { cutting: 5 },
          diamond_cutter: { cutting: 12 },
          quantum_cutter: { cutting: 20 },
          hand_faceter: { faceting: 0 },
          automatic_faceter: { faceting: 8 },
          master_faceter: { faceting: 15 },
          brilliance_engine: { faceting: 20 },
        };
        
        const bonus = PROCESS_EQUIPMENT_BONUSES[equippedTool]?.[processType] || 0;
        quality = Math.min(85, quality + bonus);
      }
      
      quality = Math.round(quality);

      const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
      const { minerals, gems } = addItemToInventory(inv, itemId, 1, quality);

      // Update processing stats
      const stats = state.processState.processingStats;
      const newTotalProcessed = stats.totalProcessed + 1;
      const isMasterwork = quality >= 90;
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
          completedQueue: newCompletedQueue,
          processingStats: {
            totalProcessed: newTotalProcessed,
            masterworksCreated: newMasterworksCreated,
            bestQuality: newBestQuality
          }
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

    case TICK_QUEUE: {
      const now = Date.now();
      let { queue, activeProcess, completedQueue } = state.processState;
      
      // Check if active process is complete
      if (activeProcess && activeProcess.estimatedCompletion && now >= activeProcess.estimatedCompletion) {
        completedQueue = [...completedQueue, { ...activeProcess, completedAt: now }];
        activeProcess = null;
        
        // Start next item from queue if available
        if (queue.length > 0) {
          const [next, ...rest] = queue;
          activeProcess = {
            ...next,
            startTime: now,
            status: 'processing'
          };
          queue = rest;
        }
      }
      
      // Check queue items that should now be processing (if no active process)
      if (!activeProcess && queue.length > 0) {
        const [next, ...rest] = queue;
        
        // Check if this item should start processing
        if (next.estimatedCompletion && now >= next.estimatedCompletion) {
          activeProcess = {
            ...next,
            startTime: now,
            status: 'processing'
          };
          queue = rest;
        }
      }
      
      // Check remaining queue items for completion (edge case: items added while game was closed)
      const newlyCompleted = [];
      queue = queue.filter(item => {
        if (item.estimatedCompletion && now >= item.estimatedCompletion) {
          newlyCompleted.push({ ...item, completedAt: now });
          return false;
        }
        return true;
      });
      
      if (newlyCompleted.length > 0) {
        completedQueue = [...completedQueue, ...newlyCompleted];
      }
      
      return {
        ...state,
        processState: {
          ...state.processState,
          queue,
          activeProcess,
          completedQueue
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
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...inv
          }
        },
        processState: {
          ...state.processState,
          equippedTools: {
            ...state.processState.equippedTools,
            [processType]: equipmentId
          }
        }
      };
    }

    case UPGRADE_PROCESS_EQUIPMENT: {
      const { processType, newEquipmentId } = action.payload;
      const eq = PROCESS_EQUIPMENT[newEquipmentId];
      if (!eq) return state;
      
      const cost = eq.cost;
      if (state.player.coins < cost) return state;
      
      const processEquipment = state.player.inventory?.processEquipment || [];
      if (processEquipment.includes(newEquipmentId)) {
        // Already owned, just equip it
        return {
          ...state,
          player: {
            ...state.player,
            coins: state.player.coins - cost
          },
          processState: {
            ...state.processState,
            equippedTools: {
              ...state.processState.equippedTools,
              [processType]: newEquipmentId
            }
          }
        };
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - cost,
          inventory: {
            ...state.player.inventory,
            processEquipment: [...processEquipment, newEquipmentId]
          }
        },
        processState: {
          ...state.processState,
          equippedTools: {
            ...state.processState.equippedTools,
            [processType]: newEquipmentId
          }
        }
      };
    }

    case CRAFT_ITEM: {
      const { recipeId, selectedGems, selectedMetal, selectedSetting } = action.payload;
      
      const recipe = getRecipeById(recipeId);
      if (!recipe) return state;
      
      const inv = state.player.inventory || {};
      const gems = [...(inv.gems || [])];
      const metals = [...(inv.metals || [])];
      
      // Remove gems used
      selectedGems.forEach(gem => {
        const idx = gems.findIndex(g => (g.gemId || g.id) === (gem.id || gem.gemId));
        if (idx >= 0) {
          if (gems[idx].quantity > 1) {
            gems[idx] = { ...gems[idx], quantity: gems[idx].quantity - 1 };
          } else {
            gems.splice(idx, 1);
          }
        }
      });
      
      // Remove metal used
      const metalIdx = metals.findIndex(m => m.id === selectedMetal.id);
      if (metalIdx >= 0) {
        if (metals[metalIdx].quantity > 1) {
          metals[metalIdx] = { ...metals[metalIdx], quantity: metals[metalIdx].quantity - 1 };
        } else {
          metals.splice(metalIdx, 1);
        }
      }
      
      // Calculate final value
      const gemValue = selectedGems.reduce((sum, gem) => {
        const itemValues = { diamond: 5000, ruby: 800, sapphire: 700, emerald: 600, amethyst: 20, citrine: 40, tourmaline: 120, peridot: 90, clear_quartz: 5, rose_quartz: 8 };
        return sum + (itemValues[gem.id || gem.gemId] || 10) * (gem.quality || 50) / 100;
      }, 0);
      
      const metalValue = (selectedMetal.value || 10) * (selectedMetal.quality || 50) / 100;
      const jewelryMultiplier = JEWELRY_TYPES[recipe.type]?.multiplier || 1;
      const settingMultiplier = SETTINGS[selectedSetting]?.multiplier || 1;
      const finalValue = Math.round((gemValue + metalValue) * jewelryMultiplier * settingMultiplier * recipe.multiplier);
      
      // Create crafted jewelry item
      const jewelry = [...(inv.jewelry || [])];
      jewelry.push({
        id: `crafted_${recipe.id}_${Date.now()}`,
        recipeId,
        name: recipe.name,
        type: recipe.type,
        gems: selectedGems.map(g => g.id || g.gemId),
        metal: selectedMetal.id,
        setting: selectedSetting,
        quality: selectedGems.reduce((s, g) => s + (g.quality || 50), 0) / selectedGems.length,
        value: finalValue,
        craftedAt: Date.now()
      });
      
      // Award crafting XP
      const xpGained = 10 + Math.max(0, Math.floor((selectedGems.reduce((s, g) => s + (g.quality || 0), 0) / selectedGems.length) - 80));
      
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + finalValue,
          craftingXP: (state.player.craftingXP || 0) + xpGained,
          inventory: {
            ...inv,
            gems,
            metals,
            jewelry
          }
        }
      };
    }

    case SELL_ITEMS: {
      const { inventory: updatedInventory, coins } = action.payload;
      
      return {
        ...state,
        player: {
          ...state.player,
          inventory: {
            ...state.player.inventory,
            ...updatedInventory,
            coins: (state.player.inventory.coins || 0) + coins
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
   const [state, dispatch] = useReducer(gameReducer, initialState, () => {
     return loadInitialState();
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

  // Queue tick effect - checks for completed queue items every second
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const { queue, activeProcess } = state.processState;
      
      // Only tick if there's work to be done
      if (queue.length > 0 || activeProcess) {
        dispatch({ type: TICK_QUEUE });
      }
    }, PROCESS_TICK_INTERVAL);
    
    return () => clearInterval(tickInterval);
  }, [state.processState.queue, state.processState.activeProcess]);

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

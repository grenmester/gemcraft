# Discover Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Refactor Discover phase with new navigation flow: Mine Selection → Mine Details (with subareas) → Subarea Details. Add manual mining with Small/Medium/Large reward buttons.

**Architecture:**
- Two tabs: Panning (default) and Idle
- Panning tab: Mine Selection → Mine Details → Subarea Details
- Idle tab: Worker overview with pending materials
- Manual mining: Simulated rewards (prototype) with Small/Medium/Large options

**Tech Stack:** React, Vitest, Playwright

---

## Task 1: Add Discover State for Pending Materials

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Add mining cooldowns and pendingMaterials to initial discoverState**

Find `discoverState` in initialState and update:
```javascript
discoverState: {
  activeTab: 'panning',       // 'panning' | 'idle' (CHANGED: default now panning)
  selectedMine: null,          // 'TIER_1' | 'TIER_1_B' | null
  selectedSubarea: null,      // 'area_a' | 'area_b' | 'area_c' | null
  pendingMaterials: {},       // { TIER_1: [{ itemId, quantity }], ... }
  miningCooldowns: {}         // NEW: { TIER_1_area_a: { small: timestamp, medium: timestamp, large: timestamp } }
}
```

**Step 2: Add mining cooldowns migration**

```javascript
// Migration to version 5: Add pendingMaterials and miningCooldowns
if (migrated.migrationVersion < 5) {
  migrated = {
    ...migrated,
    migrationVersion: MIGRATION_VERSION,
    discoverState: {
      ...migrated.discoverState,
      activeTab: migrated.discoverState?.activeTab || 'panning', // Default to panning
      pendingMaterials: migrated.discoverState?.pendingMaterials || {},
      miningCooldowns: migrated.discoverState?.miningCooldowns || {}
    }
  };
}
```

**Step 3: Add action types**

```javascript
export const COLLECT_PENDING_MATERIALS = 'COLLECT_PENDING_MATERIALS';
export const ADD_PENDING_MATERIAL = 'ADD_PENDING_MATERIAL';
export const SELECT_MINE = 'SELECT_MINE';
export const SELECT_SUBAREA = 'SELECT_SUBAREA';
export const MINE_SUBAREA = 'MINE_SUBAREA';
export const CLEAR_MINING_SELECTION = 'CLEAR_MINING_SELECTION';
```

**Step 4: Add reducer cases**

```javascript
case SELECT_MINE:
  return {
    ...state,
    discoverState: {
      ...state.discoverState,
      selectedMine: action.payload,
      selectedSubarea: null  // Reset subarea when changing mine
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
  
  // Check cooldown
  const cooldowns = state.discoverState.miningCooldowns[cooldownKey] || {};
  const lastMined = cooldowns[rewardSize] || 0;
  const cooldownDuration = rewardSize === 'small' ? 5000 : rewardSize === 'medium' ? 15000 : 30000;
  
  if (now - lastMined < cooldownDuration) {
    throw new Error(`Mining on cooldown. Try again in ${Math.ceil((cooldownDuration - (now - lastMined)) / 1000)}s`);
  }
  
  // Calculate rewards (placeholder - will use loot tables)
  const itemCount = rewardSize === 'small' ? 1 : rewardSize === 'medium' ? 3 : 5;
  const pending = state.discoverState.pendingMaterials[mineId] || [];
  
  // TODO: Use actual loot table for rewards
  const sampleItems = [
    { itemId: 'clear_quartz', quantity: itemCount }
  ];
  
  const newPending = [...pending, ...sampleItems];
  
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
  
  const newMinerals = [...(state.player.inventory?.minerals || [])];
  pending.forEach(({ itemId, quantity }) => {
    const existing = newMinerals.find(m => m.id === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      newMinerals.push({ id: itemId, quantity });
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
        ...state.player.inventory,
        minerals: newMinerals
      }
    }
  };
}
```

**Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/context/GameContext.jsx
git commit -m "feat(discover): add mine selection, subarea, and manual mining state"
```

---

## Task 2: Write Discover State Tests

**Files:**
- Create: `src/context/__tests__/discoverState.test.js`

**Step 1: Write tests**

```javascript
import { describe, it, expect } from 'vitest';
import { gameReducer, SELECT_MINE, SELECT_SUBAREA, MINE_SUBAREA, COLLECT_PENDING_MATERIALS, CLEAR_MINING_SELECTION } from '../GameContext.jsx';

describe('Discover State', () => {
  const baseState = {
    player: {
      coins: 1000,
      inventory: { minerals: [], gems: [], equipment: [], currency: { coins: 1000 } }
    },
    discoverState: {
      activeTab: 'panning',
      selectedMine: null,
      selectedSubarea: null,
      pendingMaterials: {},
      miningCooldowns: {}
    }
  };

  describe('SELECT_MINE', () => {
    it('sets selected mine', () => {
      const action = { type: SELECT_MINE, payload: 'TIER_1' };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.selectedMine).toBe('TIER_1');
    });

    it('resets selected subarea', () => {
      const withSubarea = { ...baseState, discoverState: { ...baseState.discoverState, selectedSubarea: 'area_a' } };
      const action = { type: SELECT_MINE, payload: 'TIER_2' };
      const newState = gameReducer(withSubarea, action);
      expect(newState.discoverState.selectedMine).toBe('TIER_2');
      expect(newState.discoverState.selectedSubarea).toBeNull();
    });
  });

  describe('SELECT_SUBAREA', () => {
    it('sets selected subarea', () => {
      const action = { type: SELECT_SUBAREA, payload: 'area_a' };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.selectedSubarea).toBe('area_a');
    });
  });

  describe('CLEAR_MINING_SELECTION', () => {
    it('clears both mine and subarea', () => {
      const withSelection = { ...baseState, discoverState: { ...baseState.discoverState, selectedMine: 'TIER_1', selectedSubarea: 'area_a' } };
      const action = { type: CLEAR_MINING_SELECTION };
      const newState = gameReducer(withSelection, action);
      expect(newState.discoverState.selectedMine).toBeNull();
      expect(newState.discoverState.selectedSubarea).toBeNull();
    });
  });

  describe('MINE_SUBAREA', () => {
    it('adds materials to pending pile', () => {
      const action = { type: MINE_SUBAREA, payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.pendingMaterials.TIER_1).toBeDefined();
      expect(newState.discoverState.pendingMaterials.TIER_1.length).toBeGreaterThan(0);
    });

    it('sets cooldown', () => {
      const action = { type: MINE_SUBAREA, payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.miningCooldowns.TIER_1_area_a?.small).toBeDefined();
    });

    it('throws on cooldown', () => {
      const withCooldown = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          miningCooldowns: {
            TIER_1_area_a: { small: Date.now() - 1000 } // 1 second ago
          }
        }
      };
      const action = { type: MINE_SUBAREA, payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } };
      expect(() => gameReducer(withCooldown, action)).toThrow('cooldown');
    });
  });

  describe('COLLECT_PENDING_MATERIALS', () => {
    it('moves pending to inventory', () => {
      const withPending = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          pendingMaterials: {
            TIER_1: [{ itemId: 'clear_quartz', quantity: 5 }]
          }
        }
      };
      const action = { type: COLLECT_PENDING_MATERIALS, payload: { mineId: 'TIER_1' } };
      const newState = gameReducer(withPending, action);
      expect(newState.player.inventory.minerals).toContainEqual({ id: 'clear_quartz', quantity: 5 });
      expect(newState.discoverState.pendingMaterials.TIER_1).toHaveLength(0);
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run 2>&1 | grep -E "(FAIL|passed|failed)"`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/context/__tests__/discoverState.test.js
git commit -m "test(discover): add discover state tests"
```

---

## Task 3: Create Mine Selection Component

**Files:**
- Create: `src/features/discover/components/MineSelection.jsx`

**Step 1: Create the component**

```jsx
import { useGame } from '../../../context/GameContext';
import { LOCATION_TIERS } from '../../../loaders/locations';
import { FaMapMarkedAlt, FaChevronRight } from 'react-icons/fa';

export default function MineSelection() {
  const { state, dispatch } = useGame();
  const unlockedZones = state.unlockedZones || [];
  
  const handleSelectMine = (mineId) => {
    dispatch({ type: 'SELECT_MINE', payload: mineId });
  };
  
  const getTierColor = (tier) => {
    const colors = {
      1: '#7f8c8d',
      2: '#3498db',
      3: '#9b59b6',
      4: '#f39c12',
      5: '#e74c3c'
    };
    return colors[tier] || '#7f8c8d';
  };
  
  const getTierName = (tier) => {
    const names = { 1: 'Beginner', 2: 'Novice', 3: 'Journeyman', 4: 'Expert', 5: 'Master' };
    return names[tier] || 'Unknown';
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg text-white flex items-center gap-2">
          <FaMapMarkedAlt /> Mine Selection
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(LOCATION_TIERS).map(([id, location]) => {
          const isUnlocked = unlockedZones.includes(id) || id === 'TIER_1';
          const tier = location.tier || 1;
          
          return (
            <button
              key={id}
              onClick={() => isUnlocked && handleSelectMine(id)}
              disabled={!isUnlocked}
              className={`p-4 rounded-xl text-left transition-all ${
                isUnlocked
                  ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500'
                  : 'bg-slate-900 opacity-50 cursor-not-allowed border border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span 
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ backgroundColor: getTierColor(tier), color: 'white' }}
                >
                  {getTierName(tier)}
                </span>
                <FaChevronRight className="text-slate-500" />
              </div>
              
              <h4 className={`font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                {location.name}
              </h4>
              
              <p className="text-xs text-slate-400">
                {isUnlocked ? location.description : `Unlocks at Level ${location.unlockLevel}`}
              </p>
              
              {!isUnlocked && (
                <div className="mt-2 text-xs text-slate-500">
                  {location.unlockEquipment && `Requires: ${location.unlockEquipment}`}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/discover/components/MineSelection.jsx
git commit -m "feat(discover): add MineSelection component"
```

---

## Task 4: Create Mine Details Component

**Files:**
- Create: `src/features/discover/components/MineDetails.jsx`

**Step 1: Create the component**

```jsx
import { useGame } from '../../../context/GameContext';
import { LOCATION_TIERS } from '../../../loaders/locations';
import { FaArrowLeft, FaUsers, FaMapMarkedAlt } from 'react-icons/fa';

const SUBAREAS = {
  TIER_1: [
    { id: 'area_a', name: 'River Bend', description: 'A calm bend with excellent gem deposits', rarity: 'Common' },
    { id: 'area_b', name: 'Sandbar', description: 'Shallow waters with mixed minerals', rarity: 'Common' },
    { id: 'area_c', name: 'Rocky Shore', description: 'Challenging terrain with better finds', rarity: 'Uncommon' }
  ]
};

export default function MineDetails({ mineId }) {
  const { state, dispatch } = useGame();
  const location = LOCATION_TIERS[mineId];
  const workers = state.player?.workers || [];
  
  const handleBack = () => {
    dispatch({ type: 'CLEAR_MINING_SELECTION' });
  };
  
  const handleSelectSubarea = (subareaId) => {
    dispatch({ type: 'SELECT_SUBAREA', payload: subareaId });
  };
  
  const assignedWorkers = workers.filter(w => w.assignedArea === mineId);
  const subareas = SUBAREAS[mineId] || SUBAREAS.TIER_1;
  
  if (!location) {
    return <div>Mine not found</div>;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white self-start"
      >
        <FaArrowLeft /> Back to Mines
      </button>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <FaMapMarkedAlt className="text-yellow-400 text-xl" />
          <h2 className="text-2xl text-white font-bold">{location.name}</h2>
        </div>
        <p className="text-slate-400 mb-4">{location.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FaUsers />
          <span>Workers Assigned: {assignedWorkers.length}/3</span>
        </div>
        
        {assignedWorkers.length > 0 && (
          <div className="mt-3 space-y-2">
            {assignedWorkers.map(w => (
              <div key={w.id} className="bg-slate-700 rounded-lg p-3">
                <p className="text-white font-semibold">{w.workerTypeId}</p>
                <p className="text-slate-400 text-sm">Level {w.level}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaMapMarkedAlt /> Subareas
        </h3>
        
        <div className="space-y-3">
          {subareas.map(subarea => (
            <button
              key={subarea.id}
              onClick={() => handleSelectSubarea(subarea.id)}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">{subarea.name}</h4>
                  <p className="text-slate-400 text-sm">{subarea.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    subarea.rarity === 'Common' ? 'bg-gray-600' :
                    subarea.rarity === 'Uncommon' ? 'bg-green-600' :
                    subarea.rarity === 'Rare' ? 'bg-blue-600' : 'bg-purple-600'
                  } text-white`}>
                    {subarea.rarity}
                  </span>
                  <span className="text-yellow-400">View Details →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/discover/components/MineDetails.jsx
git commit -m "feat(discover): add MineDetails component with subareas"
```

---

## Task 5: Create Subarea Details Component

**Files:**
- Create: `src/features/discover/components/SubareaDetails.jsx`

**Step 1: Create the component**

```jsx
import { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { FaArrowLeft, FaGem, FaUsers, FaCoins } from 'react-icons/fa';

const SUBAREAS = {
  TIER_1: {
    area_a: {
      name: 'River Bend',
      description: 'A calm bend in the river with excellent gem deposits in the shallow water.',
      lootTable: [
        { itemId: 'clear_quartz', chance: 0.40, name: 'Clear Quartz' },
        { itemId: 'raw_obsidian', chance: 0.30, name: 'Raw Obsidian' },
        { itemId: 'raw_fluorite', chance: 0.25, name: 'Raw Fluorite' },
        { itemId: 'rough_amethyst', chance: 0.05, name: 'Amethyst' }
      ]
    },
    area_b: {
      name: 'Sandbar',
      description: 'Shallow waters with mixed minerals and occasional surprises.',
      lootTable: [
        { itemId: 'clear_quartz', chance: 0.35, name: 'Clear Quartz' },
        { itemId: 'raw_fluorite', chance: 0.30, name: 'Raw Fluorite' },
        { itemId: 'raw_obsidian', chance: 0.25, name: 'Raw Obsidian' },
        { itemId: 'rough_amethyst', chance: 0.10, name: 'Amethyst' }
      ]
    },
    area_c: {
      name: 'Rocky Shore',
      description: 'Challenging terrain but with better potential finds.',
      lootTable: [
        { itemId: 'raw_fluorite', chance: 0.30, name: 'Raw Fluorite' },
        { itemId: 'rough_amethyst', chance: 0.25, name: 'Amethyst' },
        { itemId: 'raw_obsidian', chance: 0.25, name: 'Raw Obsidian' },
        { itemId: 'clear_quartz', chance: 0.20, name: 'Clear Quartz' }
      ]
    }
  }
};

const COOLDOWNS = {
  small: 5,
  medium: 15,
  large: 30
};

export default function SubareaDetails({ mineId, subareaId }) {
  const { state, dispatch } = useGame();
  const [cooldownEnd, setCooldownEnd] = useState({});
  const [message, setMessage] = useState(null);
  
  const workers = state.player?.workers || [];
  const assignedWorkers = workers.filter(w => w.assignedArea === mineId);
  const pending = state.discoverState?.pendingMaterials?.[mineId] || [];
  const pendingCount = pending.reduce((sum, m) => sum + m.quantity, 0);
  
  const subarea = SUBAREAS[mineId]?.[subareaId] || SUBAREAS.TIER_1[subareaId];
  
  const handleBack = () => {
    dispatch({ type: 'SELECT_SUBAREA', payload: null });
  };
  
  const handleMine = (rewardSize) => {
    const now = Date.now();
    const cooldownMs = COOLDOWNS[rewardSize] * 1000;
    
    // Check cooldown
    if (cooldownEnd[rewardSize] && now < cooldownEnd[rewardSize]) {
      const remaining = Math.ceil((cooldownEnd[rewardSize] - now) / 1000);
      setMessage({ type: 'error', text: `Cooldown: ${remaining}s remaining` });
      return;
    }
    
    try {
      dispatch({ 
        type: 'MINE_SUBAREA', 
        payload: { mineId, subareaId, rewardSize } 
      });
      setCooldownEnd(prev => ({ ...prev, [rewardSize]: now + cooldownMs }));
      setMessage({ type: 'success', text: `Mined ${rewardSize} reward!` });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };
  
  const handleCollect = () => {
    dispatch({ type: 'COLLECT_PENDING_MATERIALS', payload: { mineId } });
    setMessage({ type: 'success', text: 'Materials collected!' });
  };
  
  const handleAssignWorker = (workerId) => {
    if (workerId) {
      dispatch({ type: 'ASSIGN_WORKER', payload: { workerId, areaId: mineId } });
    }
  };
  
  const unassignedWorkers = workers.filter(w => !w.assignedArea);
  
  if (!subarea) {
    return <div>Subarea not found</div>;
  }
  
  const getCooldownRemaining = (size) => {
    if (!cooldownEnd[size]) return 0;
    const remaining = cooldownEnd[size] - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  };
  
  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white self-start"
      >
        <FaArrowLeft /> Back to Mine
      </button>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-2xl text-white font-bold mb-2">{subarea.name}</h2>
        <p className="text-slate-400">{subarea.description}</p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaGem /> Loot Table
        </h3>
        
        <div className="space-y-2">
          {subarea.lootTable.map(item => (
            <div key={item.itemId} className="flex items-center gap-3">
              <span className="text-slate-300 w-32">{item.name}</span>
              <div className="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                <div 
                  className="h-full bg-yellow-500"
                  style={{ width: `${item.chance * 100}%` }}
                />
              </div>
              <span className="text-slate-400 text-sm w-16 text-right">
                {(item.chance * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-slate-500 mt-3">5% chance for rarity upgrade</p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaUsers /> Assigned Workers
        </h3>
        
        {assignedWorkers.length > 0 ? (
          <div className="space-y-2 mb-4">
            {assignedWorkers.map(w => (
              <div key={w.id} className="bg-slate-700 rounded-lg p-3">
                <p className="text-white font-semibold">{w.workerTypeId}</p>
                <p className="text-slate-400 text-sm">Level {w.level}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 mb-4">No workers assigned</p>
        )}
        
        {unassignedWorkers.length > 0 && (
          <select
            className="w-full bg-slate-700 text-white rounded px-3 py-2"
            value=""
            onChange={(e) => handleAssignWorker(e.target.value)}
          >
            <option value="">Assign a worker...</option>
            {unassignedWorkers.map(w => (
              <option key={w.id} value={w.id}>
                {w.workerTypeId} (Lv.{w.level})
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaCoins /> Manual Mining
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {['small', 'medium', 'large'].map(size => {
            const remaining = getCooldownRemaining(size);
            const isOnCooldown = remaining > 0;
            
            return (
              <button
                key={size}
                onClick={() => handleMine(size)}
                disabled={isOnCooldown}
                className={`p-4 rounded-lg font-semibold transition-colors ${
                  isOnCooldown
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : size === 'small' ? 'bg-green-600 hover:bg-green-500 text-white' :
                      size === 'medium' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                      'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <p className="capitalize font-bold">{size} Reward</p>
                <p className="text-xs opacity-75">
                  {size === 'small' ? '1 item' : size === 'medium' ? '3 items' : '5 items'}
                </p>
                {isOnCooldown ? (
                  <p className="text-xs mt-1">{remaining}s</p>
                ) : (
                  <p className="text-xs mt-1">+{COOLDOWNS[size]}s CD</p>
                )}
              </button>
            );
          })}
        </div>
        
        <p className="text-xs text-slate-500 mt-3">Cooldowns reset after 5 minutes</p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white">Pending Materials</h3>
          <span className="text-slate-400">{pendingCount} items</span>
        </div>
        
        {pending.length > 0 ? (
          <div className="space-y-2 mb-4">
            {pending.map((m, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-300">{m.itemId}</span>
                <span className="text-white">×{m.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 mb-4">No materials pending</p>
        )}
        
        <button
          onClick={handleCollect}
          disabled={pendingCount === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            pendingCount > 0
              ? 'bg-yellow-500 text-black hover:bg-yellow-400'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Collect Materials
        </button>
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg text-center ${
          message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/discover/components/SubareaDetails.jsx
git commit -m "feat(discover): add SubareaDetails component with loot table and mining"
```

---

## Task 6: Create Idle Mine Selection Component

**Files:**
- Create: `src/features/discover/components/IdleMineSelection.jsx`

**Step 1: Create the component**

```jsx
import { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext';
import { FaUsers, FaHourglassHalf, FaGem, FaCoins } from 'react-icons/fa';

const TICK_INTERVAL = 60000; // 1 minute

export default function IdleMineSelection() {
  const { state, dispatch } = useGame();
  const workers = state.player?.workers || [];
  const pendingMaterials = state.discoverState?.pendingMaterials || {};
  const [tickTime, setTickTime] = useState(TICK_INTERVAL);
  
  const assignedWorkers = workers.filter(w => w.assignedArea);
  const idleWorkers = workers.filter(w => !w.assignedArea);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTickTime(prev => prev <= 1000 ? TICK_INTERVAL : prev - 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleCollect = (mineId) => {
    dispatch({ type: 'COLLECT_PENDING_MATERIALS', payload: { mineId } });
  };
  
  const getPendingCount = (mineId) => {
    const pending = pendingMaterials[mineId] || [];
    return pending.reduce((sum, m) => sum + m.quantity, 0);
  };
  
  const formatTime = (ms) => {
    return Math.ceil(ms / 1000) + 's';
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaUsers /> Workers Overview
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-2xl font-bold text-white">{workers.length}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-400">{assignedWorkers.length}</p>
            <p className="text-xs text-slate-400">Assigned</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-2xl font-bold text-yellow-400">{idleWorkers.length}</p>
            <p className="text-xs text-slate-400">Idle</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white flex items-center gap-2">
            <FaHourglassHalf /> Next Generation
          </h3>
          <span className="text-yellow-400 font-mono">{formatTime(tickTime)}</span>
        </div>
        
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all"
            style={{ width: `${((TICK_INTERVAL - tickTime) / TICK_INTERVAL) * 100}%` }}
          />
        </div>
        
        <p className="text-xs text-slate-500 mt-2">Workers generate materials every minute</p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaGem /> Assigned Workers & Pending
        </h3>
        
        {workers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-2">No workers hired yet.</p>
            <a 
              href="#"
              className="text-yellow-400 hover:text-yellow-300 text-sm"
              onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_PHASE', payload: 'WORKERS' }); }}
            >
              Go to Workers tab to hire →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map(w => {
              const pending = getPendingCount(w.assignedArea || '');
              return (
                <div key={w.id} className={`bg-slate-700 rounded-lg p-4 ${
                  !w.assignedArea ? 'border-l-4 border-yellow-500' : ''
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">{w.workerTypeId}</p>
                      <p className="text-slate-400 text-sm">
                        {w.assignedArea ? `Assigned to: ${w.assignedArea}` : 'No assignment'}
                      </p>
                    </div>
                    <span className="text-slate-400 text-sm">Lv.{w.level}</span>
                  </div>
                  
                  {w.assignedArea && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Pending: {pending} items
                      </span>
                      <button
                        onClick={() => handleCollect(w.assignedArea)}
                        disabled={pending === 0}
                        className={`text-sm px-3 py-1 rounded ${
                          pending > 0
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                            : 'bg-slate-600 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Collect
                      </button>
                    </div>
                  )}
                  
                  {!w.assignedArea && (
                    <a 
                      href="#"
                      className="text-sm text-yellow-400 hover:text-yellow-300"
                      onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_PHASE', payload: 'WORKERS' }); }}
                    >
                      Assign to mine →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/discover/components/IdleMineSelection.jsx
git commit -m "feat(discover): add IdleMineSelection component"
```

---

## Task 7: Rewrite Discover Component (Main Orchestrator)

**Files:**
- Modify: `src/features/discover/components/Discover.jsx`

**Step 1: Rewrite the component**

```jsx
import { useGame, GAME_PHASES } from '../../../context/GameContext';
import { useDiscover } from '../hooks/useDiscover';
import { FaArrowLeft, FaMapMarkedAlt, FaHourglassHalf, FaCoins } from 'react-icons/fa';
import MineSelection from './MineSelection';
import MineDetails from './MineDetails';
import SubareaDetails from './SubareaDetails';
import IdleMineSelection from './IdleMineSelection';

export default function Discover() {
  const { state, dispatch } = useGame();
  const { discoverState, setActiveTab } = useDiscover();
  
  const coins = state.player?.coins || 0;
  const activeTab = discoverState?.activeTab || 'panning';
  const selectedMine = discoverState?.selectedMine;
  const selectedSubarea = discoverState?.selectedSubarea;
  
  const handleBack = () => {
    if (selectedSubarea) {
      dispatch({ type: 'SELECT_SUBAREA', payload: null });
    } else if (selectedMine) {
      dispatch({ type: 'CLEAR_MINING_SELECTION' });
    } else {
      dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MENU });
    }
  };
  
  const getBackText = () => {
    if (selectedSubarea) return 'Back to Mine';
    if (selectedMine) return 'Back to Mines';
    return 'Menu';
  };
  
  return (
    <div className="flex flex-col gap-6 pt-4 h-full">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-gray-400 hover:text-white"
          onClick={handleBack}
        >
          <FaArrowLeft /> {getBackText()}
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Discover</h2>
        <div className="flex items-center gap-2 text-yellow-400">
          <FaCoins />
          <span>{coins.toLocaleString()}</span>
        </div>
      </div>

      {!selectedMine && (
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              activeTab === 'panning'
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setActiveTab('panning')}
          >
            <FaMapMarkedAlt /> Panning
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              activeTab === 'idle'
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setActiveTab('idle')}
          >
            <FaHourglassHalf /> Idle
          </button>
        </div>
      )}

      {activeTab === 'panning' && !selectedMine && (
        <MineSelection />
      )}
      
      {activeTab === 'panning' && selectedMine && !selectedSubarea && (
        <MineDetails mineId={selectedMine} />
      )}
      
      {activeTab === 'panning' && selectedMine && selectedSubarea && (
        <SubareaDetails mineId={selectedMine} subareaId={selectedSubarea} />
      )}
      
      {activeTab === 'idle' && (
        <IdleMineSelection />
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/discover/components/Discover.jsx
git commit -m "refactor(discover): rewrite Discover as orchestrator with new flow"
```

---

## Task 8: Update useDiscover Hook

**Files:**
- Modify: `src/features/discover/hooks/useDiscover.js`

**Step 1: Update the hook**

```javascript
import { useContext } from 'react';
import { GameContext } from '../../../context/GameContext';

export function useDiscover() {
  const { state, dispatch } = useContext(GameContext);
  
  const discoverState = state.discoverState || {};
  
  const setActiveTab = (tab) => {
    dispatch({ type: 'SET_DISCOVER_TAB', payload: tab });
  };
  
  return {
    discoverState,
    setActiveTab
  };
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/discover/hooks/useDiscover.js
git commit -m "refactor(discover): update useDiscover hook"
```

---

## Task 9: Write Playwright E2E Tests

**Files:**
- Create: `tests/discover.spec.js`

**Step 1: Write E2E tests**

```javascript
import { test, expect } from '@playwright/test';

test.describe('Discover Phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Discover');
  });

  test('displays discover screen with tabs', async ({ page }) => {
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
    await expect(page.locator('button:has-text("Panning")')).toBeVisible();
    await expect(page.locator('button:has-text("Idle")')).toBeVisible();
  });

  test('panning tab is default', async ({ page }) => {
    const panningBtn = page.locator('button:has-text("Panning")');
    await expect(panningBtn).toHaveClass(/bg-yellow-500/);
  });

  test('shows mine selection on panning tab', async ({ page }) => {
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    await expect(page.locator('text=River Panning')).toBeVisible();
  });

  test('can click on mine to see details', async ({ page }) => {
    await page.click('text=River Panning');
    await expect(page.locator('text=Subareas')).toBeVisible();
    await expect(page.locator('text=River Bend')).toBeVisible();
  });

  test('can click on subarea to see loot table', async ({ page }) => {
    await page.click('text=River Panning');
    await page.click('text=View Details >> nth=0');
    await expect(page.locator('text=Loot Table')).toBeVisible();
    await expect(page.locator('text=Clear Quartz')).toBeVisible();
  });

  test('can mine and collect materials', async ({ page }) => {
    await page.click('text=River Panning');
    await page.click('text=View Details >> nth=0');
    
    // Click small mine
    await page.click('button:has-text("Small Reward")');
    
    // Should see success message
    await expect(page.locator('text=Mined small reward')).toBeVisible();
    
    // Should see collect button enabled
    const collectBtn = page.locator('button:has-text("Collect Materials")');
    await expect(collectBtn).toBeEnabled();
  });

  test('can switch to idle tab', async ({ page }) => {
    await page.click('button:has-text("Idle")');
    await expect(page.locator('text=Workers Overview')).toBeVisible();
  });

  test('idle tab shows empty state when no workers', async ({ page }) => {
    await page.click('button:has-text("Idle")');
    await expect(page.locator('text=No workers hired yet')).toBeVisible();
  });

  test('can navigate back through screens', async ({ page }) => {
    await page.click('text=River Panning');
    await page.click('text=View Details >> nth=0');
    await page.click('text=Back to Mine');
    await expect(page.locator('text=Subareas')).toBeVisible();
    await page.click('text=Back to Mines');
    await expect(page.locator('text=Mine Selection')).toBeVisible();
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test tests/discover.spec.js`
Expected: Tests pass

**Step 3: Commit**

```bash
git add tests/discover.spec.js
git commit -m "test(discover): add Playwright E2E tests"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add discover state (mines, subareas, cooldowns) |
| 2 | Write discover state tests |
| 3 | Create MineSelection component |
| 4 | Create MineDetails component |
| 5 | Create SubareaDetails component |
| 6 | Create IdleMineSelection component |
| 7 | Rewrite Discover orchestrator |
| 8 | Update useDiscover hook |
| 9 | Write Playwright E2E tests |

**Total: 9 tasks**

---

## Verification

After completing all tasks, run:
```bash
npm run test:run && npm run build && npx playwright test
```

Expected:
- All unit tests pass
- Build succeeds
- All Playwright tests pass

---

## Notes

- Subarea loot tables are defined as constants in SubareaDetails.jsx (can be moved to data file later)
- Mining cooldowns are client-side only (will reset on refresh - Phase 1 may add persistence)
- Worker actions (ASSIGN_WORKER, UNASSIGN_WORKER) are placeholder - will be implemented in Phase 1
- Manual mining rewards use placeholder item generation (TIER_1 only for prototype)

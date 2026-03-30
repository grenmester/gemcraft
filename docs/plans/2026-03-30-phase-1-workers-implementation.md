# Phase 1: Worker & XP System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Worker system for idle generation with offline progress, assignment, and leveling.

**Architecture:** Workers are GameContext state objects with ID, type, level, XP, and area assignment. A tick system runs every 60s (including offline calculation on load) to generate materials and XP.

**Tech Stack:** React Context, js-yaml (loaders from Phase 0), existing lootTables.js

---

## Task 1: Update GameContext State Model

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Add worker-related initial state**

Find the initialPlayerState in GameContext and add:
```javascript
workers: [
  {
    id: 'starter-1',
    workerTypeId: 'novice_miner',
    level: 1,
    xp: 0,
    assignedArea: 'TIER_1',
    assignedAt: Date.now()
  }
],
lastOnlineTimestamp: Date.now(),
totalWorkerXp: 0,
```

**Step 2: Add worker action types**

Add these after existing action types:
```javascript
export const HIRE_WORKER = 'HIRE_WORKER';
export const ASSIGN_WORKER = 'ASSIGN_WORKER';
export const UNASSIGN_WORKER = 'UNASSIGN_WORKER';
export const PROCESS_WORKER_TICKS = 'PROCESS_WORKER_TICKS';
export const WORKER_LEVEL_UP = 'WORKER_LEVEL_UP';
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/context/GameContext.jsx
git commit -m "feat(workers): add worker state model to GameContext"
```

---

## Task 2: Write Worker Actions Tests

**Files:**
- Create: `src/features/workers/__tests__/workerActions.test.js`

**Step 1: Write tests for worker actions**

```javascript
import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../context/GameContext.jsx';
import { HIRE_WORKER, ASSIGN_WORKER, UNASSIGN_WORKER } from '../../context/GameContext.jsx';

describe('Worker Actions', () => {
  const initialState = {
    player: {
      coins: 10000,
      workers: [],
      lastOnlineTimestamp: Date.now(),
      totalWorkerXp: 0
    }
  };

  describe('HIRE_WORKER', () => {
    it('adds worker to inventory when hired', () => {
      const action = { type: HIRE_WORKER, payload: { workerTypeId: 'novice_miner' } };
      const newState = gameReducer(initialState, action);
      expect(newState.player.workers.length).toBe(1);
      expect(newState.player.workers[0].workerTypeId).toBe('novice_miner');
    });

    it('deducts correct cost from coins', () => {
      const action = { type: HIRE_WORKER, payload: { workerTypeId: 'novice_miner' } };
      const newState = gameReducer(initialState, action);
      expect(newState.player.coins).toBe(9900); // 10000 - 100
    });

    it('rejects hire if insufficient funds', () => {
      const poorState = { ...initialState, player: { ...initialState.player, coins: 50 } };
      const action = { type: HIRE_WORKER, payload: { workerTypeId: 'seasoned_prospector' } };
      expect(() => gameReducer(poorState, action)).toThrow('Insufficient funds');
    });
  });

  describe('ASSIGN_WORKER', () => {
    it('assigns worker to area', () => {
      const workerState = {
        ...initialState,
        player: {
          ...initialState.player,
          workers: [{ id: 'w1', workerTypeId: 'novice_miner', level: 1, xp: 0, assignedArea: null }]
        }
      };
      const action = { type: ASSIGN_WORKER, payload: { workerId: 'w1', areaId: 'TIER_2_A' } };
      const newState = gameReducer(workerState, action);
      expect(newState.player.workers[0].assignedArea).toBe('TIER_2_A');
    });
  });

  describe('UNASSIGN_WORKER', () => {
    it('unassigns worker from area', () => {
      const assignedState = {
        ...initialState,
        player: {
          ...initialState.player,
          workers: [{ id: 'w1', workerTypeId: 'novice_miner', level: 1, xp: 0, assignedArea: 'TIER_1' }]
        }
      };
      const action = { type: UNASSIGN_WORKER, payload: { workerId: 'w1' } };
      const newState = gameReducer(assignedState, action);
      expect(newState.player.workers[0].assignedArea).toBeNull();
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run 2>&1 | grep -E "(FAIL|passed|failed)"`
Expected: Tests fail (actions not implemented yet)

**Step 3: Commit**

```bash
git add src/features/workers/__tests__/workerActions.test.js
git commit -m "test(workers): add worker action tests"
```

---

## Task 3: Implement Worker Actions

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Implement HIRE_WORKER case**

Add case for HIRE_WORKER in the reducer:
```javascript
case HIRE_WORKER: {
  const { workerTypeId } = action.payload;
  const workerType = workersById[workerTypeId];
  if (!workerType) throw new Error(`Unknown worker type: ${workerTypeId}`);
  
  if (state.player.coins < workerType.cost.coins) {
    throw new Error('Insufficient funds');
  }
  
  const newWorker = {
    id: `worker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    workerTypeId,
    level: 1,
    xp: 0,
    assignedArea: null,
    assignedAt: null
  };
  
  return {
    ...state,
    player: {
      ...state.player,
      coins: state.player.coins - workerType.cost.coins,
      workers: [...state.player.workers, newWorker]
    }
  };
}
```

**Step 2: Implement ASSIGN_WORKER case**

```javascript
case ASSIGN_WORKER: {
  const { workerId, areaId } = action.payload;
  
  // Check if area already has a worker
  const areaTaken = state.player.workers.some(
    w => w.assignedArea === areaId && w.id !== workerId
  );
  if (areaTaken) throw new Error('Area already has a worker');
  
  return {
    ...state,
    player: {
      ...state.player,
      workers: state.player.workers.map(w =>
        w.id === workerId
          ? { ...w, assignedArea: areaId, assignedAt: Date.now() }
          : w
      )
    }
  };
}
```

**Step 3: Implement UNASSIGN_WORKER case**

```javascript
case UNASSIGN_WORKER: {
  const { workerId } = action.payload;
  return {
    ...state,
    player: {
      ...state.player,
      workers: state.player.workers.map(w =>
        w.id === workerId ? { ...w, assignedArea: null, assignedAt: null } : w
      )
    }
  };
}
```

**Step 4: Run tests**

Run: `npm run test:run 2>&1 | grep -E "(FAIL|passed|failed)"`
Expected: Tests pass

**Step 5: Commit**

```bash
git add src/context/GameContext.jsx
git commit -m "feat(workers): implement HIRE_WORKER, ASSIGN_WORKER, UNASSIGN_WORKER actions"
```

---

## Task 4: Implement Worker Generation Logic

**Files:**
- Create: `src/features/workers/utils/workerGeneration.js`

**Step 1: Write generation utility**

```javascript
import { workersById } from '../../loaders/workers.js';
import { LOOT_TABLES } from '../../data/lootTables.js';

/**
 * Calculate XP needed for next level
 */
export function xpToNextLevel(level, baseXp) {
  return Math.floor(baseXp * Math.pow(1.1, level - 1));
}

/**
 * Calculate worker efficiency at given level
 */
export function getWorkerEfficiency(workerTypeId, level) {
  const type = workersById[workerTypeId];
  if (!type) return 0;
  return type.stats.efficiency * (1 + level * 0.05);
}

/**
 * Calculate loot generation for one worker tick
 */
export function generateWorkerTick(worker, areaId) {
  const workerType = workersById[worker.workerTypeId];
  const areaTable = LOOT_TABLES[areaId];
  
  if (!workerType || !areaTable) return null;
  
  const efficiency = getWorkerEfficiency(workerType.workerTypeId, worker.level);
  const luck = workerType.stats.luck;
  
  // Base yield from area loot table
  const baseYield = rollLootFromTable(areaTable);
  
  // Apply bonuses
  const efficiencyMult = efficiency / 100;
  const luckMult = 1 + luck / 200;
  
  const finalYield = Math.floor(baseYield * efficiencyMult * luckMult);
  
  // Calculate XP earned
  const xpEarned = Math.floor(workerType.baseXpPerAction * efficiencyMult);
  
  return {
    materials: baseYield > 0 ? [{ itemId: baseYield.itemId, quantity: finalYield }] : [],
    xpEarned
  };
}

/**
 * Roll for loot from area table
 */
function rollLootFromTable(table) {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [itemId, chance] of Object.entries(table)) {
    cumulative += chance;
    if (roll < cumulative) {
      return { itemId, quantity: 1 };
    }
  }
  
  return { itemId: null, quantity: 0 };
}
```

**Step 2: Verify syntax**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/workers/utils/workerGeneration.js
git commit -m "feat(workers): add worker generation utility functions"
```

---

## Task 5: Write Worker Generation Tests

**Files:**
- Create: `src/features/workers/__tests__/workerGeneration.test.js`

**Step 1: Write tests**

```javascript
import { describe, it, expect } from 'vitest';
import { xpToNextLevel, getWorkerEfficiency } from '../utils/workerGeneration.js';

describe('Worker Generation', () => {
  describe('xpToNextLevel', () => {
    it('returns base XP for level 1', () => {
      expect(xpToNextLevel(1, 100)).toBe(100);
    });

    it('increases XP requirement with level', () => {
      const lvl2 = xpToNextLevel(2, 100);
      const lvl3 = xpToNextLevel(3, 100);
      expect(lvl3).toBeGreaterThan(lvl2);
    });
  });

  describe('getWorkerEfficiency', () => {
    it('returns base efficiency for level 1', () => {
      const eff = getWorkerEfficiency('novice_miner', 1);
      expect(eff).toBeGreaterThan(0);
    });

    it('increases efficiency with level', () => {
      const lvl1 = getWorkerEfficiency('novice_miner', 1);
      const lvl10 = getWorkerEfficiency('novice_miner', 10);
      expect(lvl10).toBeGreaterThan(lvl1);
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test:run 2>&1 | grep -E "(FAIL|passed|failed)"`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/features/workers/__tests__/workerGeneration.test.js
git commit -m "test(workers): add worker generation tests"
```

---

## Task 6: Implement Offline Progress Calculation

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Add offline tick calculation**

Find where game loads state (LOAD_STATE case) and add offline calculation:

```javascript
case LOAD_STATE: {
  const loaded = action.payload;
  const now = Date.now();
  const lastOnline = loaded.player.lastOnlineTimestamp || now;
  
  // Calculate offline ticks (cap at 8 hours = 480 ticks at 1 min each, but use 60 sec)
  const maxOfflineMinutes = 480; // 8 hours
  const tickIntervalMs = 60 * 1000; // 1 minute
  const elapsedMs = now - lastOnline;
  const ticksToProcess = Math.min(
    Math.floor(elapsedMs / tickIntervalMs),
    maxOfflineMinutes
  );
  
  // TODO: Process worker ticks here (add to state before returning)
  const stateWithOffline = {
    ...loaded,
    player: {
      ...loaded.player,
      lastOnlineTimestamp: now
    }
  };
  
  return stateWithOffline;
}
```

**Step 2: Implement PROCESS_WORKER_TICKS**

Add case for processing ticks:
```javascript
case PROCESS_WORKER_TICKS: {
  const { ticks } = action.payload;
  const newState = { ...state };
  
  for (const worker of newState.player.workers) {
    if (!worker.assignedArea) continue;
    
    for (let t = 0; t < ticks; t++) {
      const result = generateWorkerTick(worker, worker.assignedArea);
      
      if (result) {
        // Add materials to inventory
        // Add XP
        // Check level up
      }
    }
  }
  
  return newState;
}
```

**Step 3: Implement WORKER_LEVEL_UP**

```javascript
case WORKER_LEVEL_UP: {
  const { workerId } = action.payload;
  const workerType = workersById[worker.workerTypeId];
  
  return {
    ...state,
    player: {
      ...state.player,
      workers: state.player.workers.map(w => {
        if (w.id !== workerId) return w;
        const newLevel = w.level + 1;
        return { ...w, level: newLevel, xp: 0 };
      }),
      totalWorkerXp: state.player.totalWorkerXp + w.xp
    }
  };
}
```

**Step 4: Run tests and build**

Run: `npm run test:run && npm run build 2>&1 | tail -3`
Expected: All pass

**Step 5: Commit**

```bash
git add src/context/GameContext.jsx
git commit -m "feat(workers): implement offline progress and worker tick processing"
```

---

## Task 7: Create WorkerPanel Component

**Files:**
- Create: `src/features/workers/components/WorkerPanel.jsx`

**Step 1: Create WorkerPanel**

```jsx
import { useState } from 'react';
import { useGame } from '../../../context/GameContext';
import { workersById } from '../../../loaders/workers.js';
import WorkerCard from './WorkerCard';
import WorkerShop from './WorkerShop';
import { FaPlus, FaUsers } from 'react-icons/fa';

export default function WorkerPanel() {
  const { state } = useGame();
  const [showShop, setShowShop] = useState(false);
  
  const workers = state.player.workers || [];
  const unassigned = workers.filter(w => !w.assignedArea);
  const assigned = workers.filter(w => w.assignedArea);
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FaUsers /> Workers ({workers.length})
        </h2>
        <button
          onClick={() => setShowShop(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Hire Worker
        </button>
      </div>
      
      {assigned.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm text-gray-400 mb-2">Assigned Workers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assigned.map(worker => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </div>
      )}
      
      {unassigned.length > 0 && (
        <div>
          <h3 className="text-sm text-gray-400 mb-2">Idle Workers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassigned.map(worker => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </div>
      )}
      
      {workers.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No workers yet. Hire your first worker!
        </p>
      )}
      
      {showShop && <WorkerShop onClose={() => setShowShop(false)} />}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/features/workers/components/WorkerPanel.jsx
git commit -m "feat(workers): add WorkerPanel component"
```

---

## Task 8: Create WorkerCard Component

**Files:**
- Create: `src/features/workers/components/WorkerCard.jsx`

**Step 1: Create WorkerCard**

```jsx
import { useGame, UNASSIGN_WORKER, ASSIGN_WORKER } from '../../../context/GameContext';
import { workersById } from '../../../loaders/workers.js';
import { xpToNextLevel } from '../utils/workerGeneration';
import { FaMapMarkerAlt, FaLevelUpAlt } from 'react-icons/fa';

export default function WorkerCard({ worker }) {
  const { state, dispatch } = useGame();
  const workerType = workersById[worker.workerTypeId];
  
  if (!workerType) return null;
  
  const xpRequired = xpToNextLevel(worker.level, workerType.xpToLevel);
  const xpPercent = (worker.xp / xpRequired) * 100;
  
  const handleUnassign = () => {
    dispatch({ type: UNASSIGN_WORKER, payload: { workerId: worker.id } });
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold">{workerType.name}</h4>
          <p className="text-xs text-gray-400">Level {worker.level}</p>
        </div>
        <div className="text-2xl">
          {workerType.stats.efficiency >= 70 ? '⭐' : workerType.stats.efficiency >= 50 ? '✨' : '👷'}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">XP</span>
          <span>{worker.xp} / {xpRequired}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, xpPercent)}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs mb-3">
        <span className="text-gray-400">
          EFF: {Math.round(workerType.stats.efficiency * (1 + worker.level * 0.05))}
        </span>
        <span className="text-gray-400">
          LCK: {workerType.stats.luck}
        </span>
      </div>
      
      {worker.assignedArea ? (
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <FaMapMarkerAlt /> {worker.assignedArea}
          </span>
          <button
            onClick={handleUnassign}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Unassign
          </button>
        </div>
      ) : (
        <p className="text-xs text-yellow-400 text-center">Unassigned - Go to Discover to assign</p>
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
git add src/features/workers/components/WorkerCard.jsx
git commit -m "feat(workers): add WorkerCard component"
```

---

## Task 9: Create WorkerShop Component

**Files:**
- Create: `src/features/workers/components/WorkerShop.jsx`

**Step 1: Create WorkerShop**

```jsx
import { useState } from 'react';
import { useGame, HIRE_WORKER } from '../../../context/GameContext';
import { workers } from '../../../loaders/workers.js';
import { FaTimes, FaCheck } from 'react-icons/fa';

export default function WorkerShop({ onClose }) {
  const { state, dispatch } = useGame();
  const [filterAffordable, setFilterAffordable] = useState(false);
  
  const coins = state.player.coins;
  
  const filteredWorkers = filterAffordable
    ? workers.filter(w => w.cost.coins <= coins)
    : workers;
  
  const handleHire = (workerTypeId, cost) => {
    if (coins < cost) return;
    try {
      dispatch({ type: HIRE_WORKER, payload: { workerTypeId } });
    } catch (e) {
      console.error(e.message);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Hire Workers</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={24} />
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          Coins: {coins.toLocaleString()}
        </p>
        
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={filterAffordable}
            onChange={(e) => setFilterAffordable(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show affordable only</span>
        </label>
        
        <div className="grid gap-4">
          {filteredWorkers.map(workerType => {
            const canAfford = coins >= workerType.cost.coins;
            return (
              <div
                key={workerType.id}
                className={`p-4 rounded-lg border ${
                  canAfford ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-900 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{workerType.name}</h3>
                    <p className="text-xs text-gray-400">{workerType.description}</p>
                  </div>
                  <span className="text-yellow-400 font-bold">
                    {workerType.cost.coins.toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-400">Efficiency</span>
                    <p className="font-bold">{workerType.stats.efficiency}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Luck</span>
                    <p className="font-bold">{workerType.stats.luck}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Speed</span>
                    <p className="font-bold">{workerType.stats.speed}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleHire(workerType.id, workerType.cost.coins)}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-700 cursor-not-allowed'
                  }`}
                >
                  <FaCheck /> Hire
                </button>
              </div>
            );
          })}
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
git add src/features/workers/components/WorkerShop.jsx
git commit -m "feat(workers): add WorkerShop component"
```

---

## Task 10: Integrate WorkerPanel into App

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/constants.js`

**Step 1: Add WORKERS phase to GAME_PHASES**

In `src/constants.js`:
```javascript
export const GAME_PHASES = {
  MENU: 'menu',
  DISCOVER: 'discover',
  PROCESS: 'process',
  CRAFT: 'craft',
  SELL: 'sell',
  WORKERS: 'workers',  // NEW
  MINIGAME: 'minigame'
};
```

**Step 2: Add WorkerPanel route in App.jsx**

Find the switch statement and add:
```jsx
case GAME_PHASES.WORKERS:
  return <WorkerPanel />;
```

Add import:
```jsx
import WorkerPanel from './features/workers/components/WorkerPanel';
```

**Step 3: Add navigation to Workers**

In the menu or navigation component, add a "Workers" button:
```jsx
<button onClick={() => dispatch({ type: SET_PHASE, payload: GAME_PHASES.WORKERS })}>
  Workers
</button>
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/App.jsx src/constants.js
git commit -m "feat(workers): integrate WorkerPanel into app navigation"
```

---

## Task 11: Integration Test

**Files:**
- Create: `src/features/workers/__tests__/workerIntegration.test.js`

**Step 1: Write integration test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '../../../context/GameContext';
import WorkerPanel from '../components/WorkerPanel';

const renderWithProvider = (component) => {
  return render(<GameProvider>{component}</GameProvider>);
};

describe('WorkerPanel Integration', () => {
  it('shows starter worker on initial load', () => {
    renderWithProvider(<WorkerPanel />);
    expect(screen.getByText('Workers')).toBeTruthy();
  });
  
  it('opens shop when hire button clicked', () => {
    renderWithProvider(<WorkerPanel />);
    fireEvent.click(screen.getByText('Hire Worker'));
    expect(screen.getByText('Hire Workers')).toBeTruthy();
  });
});
```

**Step 2: Run all tests**

Run: `npm run test:run 2>&1 | tail -10`
Expected: All pass

**Step 3: Commit**

```bash
git add src/features/workers/__tests__/workerIntegration.test.js
git commit -m "test(workers): add worker integration test"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add worker state model to GameContext |
| 2 | Write worker action tests |
| 3 | Implement HIRE/ASSIGN/UNASSIGN actions |
| 4 | Create worker generation utility |
| 5 | Write generation tests |
| 6 | Implement offline progress & tick processing |
| 7 | Create WorkerPanel component |
| 8 | Create WorkerCard component |
| 9 | Create WorkerShop component |
| 10 | Integrate into app navigation |
| 11 | Integration test |

**Total: 11 tasks**

---

## Verification

After completing all tasks, run:
```bash
npm run test:run && npm run build
```

Expected: All 318+ tests pass, build succeeds.

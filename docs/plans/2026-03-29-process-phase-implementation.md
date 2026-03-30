# Process Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Process phase with Tumble Sort minigame, idle queue system, quality mechanics, and integration with Discover/Craft phases.

**Architecture:** 
- Phase 1: Core Process screen with tabbed UI (Active/Idle), quality system foundation
- Phase 2: Tumble Sort minigame with active gameplay
- Phase 3: Idle queue system with processing slots
- Phase 4: Process equipment and progression
- Phase 5: Integration testing and polish

**Tech Stack:** React, TailwindCSS V4, Vitest, Playwright for E2E testing

---

## Pre-requisites

Before starting, ensure you're in the prototype worktree:
```bash
cd .worktrees/prototype
```

---

## Phase 1: Core Process Screen and Quality System

### Task 1: Create Process State Model

**Files:**
- Modify: `.worktrees/prototype/src/context/GameContext.jsx`
- Modify: `.worktrees/prototype/src/models/Player.js`

**Step 1: Add process state to GameContext**

Add to initialState in GameContext.jsx:
```javascript
processState: {
  activeProcess: null,        // { itemId, processType, startTime, quality }
  queue: [],                  // [{ itemId, processType, startTime, estimatedCompletion }]
  queueSlots: 2,              // Unlocked queue slots (level unlocks more)
  completedQueue: [],         // Finished items waiting for collection
  processingStats: {
    totalProcessed: 0,
    masterworksCreated: 0,
    bestQuality: 0,
  }
}
```

**Step 2: Add action types**

Add action type constants:
```javascript
// Process actions
START_ACTIVE_PROCESS: 'START_ACTIVE_PROCESS',
COMPLETE_ACTIVE_PROCESS: 'COMPLETE_ACTIVE_PROCESS',
QUEUE_ITEM: 'QUEUE_ITEM',
START_QUEUE_PROCESS: 'START_QUEUE_PROCESS',
COMPLETE_QUEUE_PROCESS: 'COMPLETE_QUEUE_PROCESS',
COLLECT_QUEUE_ITEM: 'COLLECT_QUEUE_ITEM',
CANCEL_QUEUE_ITEM: 'CANCEL_QUEUE_ITEM',
UPDATE_PROCESS_STATS: 'UPDATE_PROCESS_STATS',
UNLOCK_QUEUE_SLOT: 'UNLOCK_QUEUE_SLOT',
```

**Step 3: Add reducer cases**

Implement each action in the reducer:
- `START_ACTIVE_PROCESS`: Set activeProcess, remove item from inventory
- `COMPLETE_ACTIVE_PROCESS`: Clear activeProcess, add processed item to inventory
- `QUEUE_ITEM`: Add to queue array if slots available
- `START_QUEUE_PROCESS`: Move from queue to processing (set startTime)
- `COMPLETE_QUEUE_PROCESS`: Move to completedQueue
- `COLLECT_QUEUE_ITEM`: Remove from completedQueue, add to inventory
- `CANCEL_QUEUE_ITEM`: Remove from queue, return item to inventory

**Step 4: Add Player model updates**

In Player.js, add processState to toJSON:
```javascript
processState: {
  activeProcess: null,
  queue: [],
  queueSlots: 2,
  completedQueue: [],
  processingStats: {
    totalProcessed: 0,
    masterworksCreated: 0,
    bestQuality: 0,
  }
}
```

**Step 5: Verify build**

Run: `cd .worktrees/prototype && npm run build`

---

### Task 2: Create Quality System Utilities

**Files:**
- Create: `.worktrees/prototype/src/shared/utils/qualitySystem.js`
- Create: `.worktrees/prototype/src/shared/utils/__tests__/qualitySystem.test.js`

**Step 1: Create quality system utility**

Create `src/shared/utils/qualitySystem.js`:
```javascript
/**
 * Quality System for Process Phase
 * 
 * Quality ranges from 40% (destroyed) to 110% (masterwork)
 * - 100% is "perfect" quality
 * - 100-110% is "masterwork" (only achievable via active processing)
 * - Idle processing caps at 85%
 */

// Quality thresholds
export const QUALITY_THRESHOLDS = {
  DESTROYED: 30,      // Below this = material lost
  CRACKED: 50,        // Below this = -25% value
  DAMAGED: 70,        // Below this = -10% value
  ACCEPTABLE: 85,     // Minimum for "good" quality
  PERFECT: 100,       // Perfect quality
  MASTERWORK: 100,    // Threshold for masterwork bonus
};

// Quality caps
export const QUALITY_CAPS = {
  IDLE_MAX: 85,       // Maximum quality from idle processing
  ACTIVE_MAX: 110,    // Maximum quality from active processing
  BASE_MIN: 60,       // Minimum starting quality from Discover
};

// Value multipliers by quality
export const QUALITY_VALUE_MULTIPLIERS = {
  // quality range: multiplier
  DESTROYED: 0,           // 30-49%
  CRACKED: 0.75,          // 50-69%
  DAMAGED: 0.90,          // 70-84%
  ACCEPTABLE: 1.0,        // 85-99%
  PERFECT: 1.25,          // 100%
  MASTERWORK: 1.5,        // 101-110%
};

/**
 * Calculate value based on quality
 * @param {number} baseValue - Base value of the item
 * @param {number} quality - Quality percentage (40-110)
 * @returns {number} Final value
 */
export function calculateQualityValue(baseValue, quality) {
  if (quality < QUALITY_THRESHOLDS.DESTROYED) return 0;
  if (quality < QUALITY_THRESHOLDS.CRACKED) {
    return Math.floor(baseValue * QUALITY_VALUE_MULTIPLIERS.CRACKED);
  }
  if (quality < QUALITY_THRESHOLDS.DAMAGED) {
    return Math.floor(baseValue * QUALITY_VALUE_MULTIPLIERS.DAMAGED);
  }
  if (quality < QUALITY_THRESHOLDS.PERFECT) {
    return Math.floor(baseValue * QUALITY_VALUE_MULTIPLIERS.ACCEPTABLE);
  }
  if (quality === QUALITY_THRESHOLDS.PERFECT) {
    return Math.floor(baseValue * QUALITY_VALUE_MULTIPLIERS.PERFECT);
  }
  // Masterwork
  const masterworkBonus = (quality - 100) * 0.025; // 2.5% per point over 100
  return Math.floor(baseValue * (QUALITY_VALUE_MULTIPLIERS.MASTERWORK + masterworkBonus));
}

/**
 * Get quality label
 * @param {number} quality - Quality percentage
 * @returns {string} Quality label
 */
export function getQualityLabel(quality) {
  if (quality < QUALITY_THRESHOLDS.DESTROYED) return 'Destroyed';
  if (quality < QUALITY_THRESHOLDS.CRACKED) return 'Cracked';
  if (quality < QUALITY_THRESHOLDS.DAMAGED) return 'Damaged';
  if (quality < QUALITY_THRESHOLDS.ACCEPTABLE) return 'Acceptable';
  if (quality < QUALITY_THRESHOLDS.PERFECT) return 'Good';
  if (quality === QUALITY_THRESHOLDS.PERFECT) return 'Perfect';
  return `Masterwork (+${quality - 100})`;
}

/**
 * Get quality color for UI
 * @param {number} quality - Quality percentage
 * @returns {string} Tailwind color class
 */
export function getQualityColor(quality) {
  if (quality < QUALITY_THRESHOLDS.CRACKED) return 'text-red-500';
  if (quality < QUALITY_THRESHOLDS.DAMAGED) return 'text-orange-500';
  if (quality < QUALITY_THRESHOLDS.ACCEPTABLE) return 'text-yellow-500';
  if (quality < QUALITY_THRESHOLDS.PERFECT) return 'text-green-500';
  if (quality === QUALITY_THRESHOLDS.PERFECT) return 'text-blue-500';
  return 'text-purple-500'; // Masterwork
}

/**
 * Roll quality for idle processing
 * @param {number} inputQuality - Starting quality
 * @param {object} equipment - Equipment bonuses
 * @returns {number} Final quality
 */
export function rollIdleQuality(inputQuality, equipment = {}) {
  const baseMin = 50;
  const baseMax = QUALITY_CAPS.IDLE_MAX;
  
  // Equipment bonus extends max toward 85
  const equipmentBonus = equipment.idleQualityBonus || 0;
  const maxQuality = Math.min(baseMax + equipmentBonus, QUALITY_CAPS.IDLE_MAX);
  
  // Random roll between baseMin and maxQuality
  const roll = Math.random() * (maxQuality - baseMin) + baseMin;
  
  // Input quality affects the floor
  const qualityFloor = Math.max(baseMin, inputQuality * 0.7);
  
  return Math.floor(Math.max(qualityFloor, Math.min(roll, maxQuality)));
}

/**
 * Calculate active processing quality based on performance
 * @param {number} inputQuality - Starting quality
 * @param {number} performanceScore - 0-100 score from minigame
 * @param {object} equipment - Equipment bonuses
 * @returns {number} Final quality
 */
export function calculateActiveQuality(inputQuality, performanceScore, equipment = {}) {
  // Base quality from input
  let quality = inputQuality;
  
  // Performance bonus (0-30 points possible)
  const performanceBonus = Math.floor(performanceScore * 0.3);
  quality += performanceBonus;
  
  // Equipment bonus
  const equipmentBonus = equipment.activeQualityBonus || 0;
  quality += equipmentBonus;
  
  // Cap at maximum
  return Math.min(Math.max(quality, 40), QUALITY_CAPS.ACTIVE_MAX);
}
```

**Step 2: Create tests**

Create `src/shared/utils/__tests__/qualitySystem.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import {
  QUALITY_THRESHOLDS,
  QUALITY_CAPS,
  calculateQualityValue,
  getQualityLabel,
  getQualityColor,
  rollIdleQuality,
  calculateActiveQuality,
} from '../qualitySystem';

describe('qualitySystem', () => {
  describe('QUALITY_THRESHOLDS', () => {
    it('defines correct thresholds', () => {
      expect(QUALITY_THRESHOLDS.DESTROYED).toBe(30);
      expect(QUALITY_THRESHOLDS.CRACKED).toBe(50);
      expect(QUALITY_THRESHOLDS.DAMAGED).toBe(70);
      expect(QUALITY_THRESHOLDS.ACCEPTABLE).toBe(85);
      expect(QUALITY_THRESHOLDS.PERFECT).toBe(100);
    });
  });

  describe('calculateQualityValue', () => {
    it('returns 0 for destroyed quality', () => {
      expect(calculateQualityValue(100, 25)).toBe(0);
    });

    it('applies cracked multiplier for 50-69 quality', () => {
      expect(calculateQualityValue(100, 60)).toBe(75); // 75%
    });

    it('applies damaged multiplier for 70-84 quality', () => {
      expect(calculateQualityValue(100, 80)).toBe(90); // 90%
    });

    it('applies acceptable multiplier for 85-99 quality', () => {
      expect(calculateQualityValue(100, 90)).toBe(100);
    });

    it('applies perfect multiplier at 100 quality', () => {
      expect(calculateQualityValue(100, 100)).toBe(125);
    });

    it('applies masterwork multiplier above 100', () => {
      expect(calculateQualityValue(100, 105)).toBeGreaterThan(150);
    });
  });

  describe('getQualityLabel', () => {
    it('returns correct labels', () => {
      expect(getQualityLabel(25)).toBe('Destroyed');
      expect(getQualityLabel(60)).toBe('Cracked');
      expect(getQualityLabel(75)).toBe('Damaged');
      expect(getQualityLabel(90)).toBe('Good');
      expect(getQualityLabel(100)).toBe('Perfect');
      expect(getQualityLabel(105)).toBe('Masterwork (+5)');
    });
  });

  describe('rollIdleQuality', () => {
    it('returns quality between 50 and 85', () => {
      for (let i = 0; i < 100; i++) {
        const quality = rollIdleQuality(80);
        expect(quality).toBeGreaterThanOrEqual(50);
        expect(quality).toBeLessThanOrEqual(85);
      }
    });

    it('respects equipment bonus', () => {
      const quality = rollIdleQuality(80, { idleQualityBonus: 0 });
      expect(quality).toBeLessThanOrEqual(85);
    });
  });

  describe('calculateActiveQuality', () => {
    it('adds performance bonus to input quality', () => {
      const quality = calculateActiveQuality(80, 50, {});
      // 80 + (50 * 0.3) = 95
      expect(quality).toBe(95);
    });

    it('caps at 110', () => {
      const quality = calculateActiveQuality(100, 100, { activeQualityBonus: 20 });
      expect(quality).toBeLessThanOrEqual(110);
    });

    it('respects minimum of 40', () => {
      const quality = calculateActiveQuality(30, 0, {});
      expect(quality).toBeGreaterThanOrEqual(40);
    });
  });
});
```

**Step 3: Run tests**

Run: `cd .worktrees/prototype && npm run test:run`

---

### Task 3: Create Process Screen UI

**Files:**
- Create: `.worktrees/prototype/src/features/process/components/Process.jsx`
- Create: `.worktrees/prototype/src/features/process/hooks/useProcess.js`
- Modify: `.worktrees/prototype/src/App.jsx`

**Step 1: Create useProcess hook**

Create `src/features/process/hooks/useProcess.js`:
```javascript
import { useGame } from '../../../shared/hooks/useGame';

export function useProcess() {
  const { gameState, dispatch } = useGame();
  
  const processState = gameState.processState;
  const inventory = gameState.player.inventory;
  
  const startActiveProcess = (itemId, processType) => {
    dispatch({ 
      type: 'START_ACTIVE_PROCESS', 
      payload: { itemId, processType, startTime: Date.now() }
    });
  };
  
  const completeActiveProcess = (quality) => {
    dispatch({ 
      type: 'COMPLETE_ACTIVE_PROCESS', 
      payload: { quality }
    });
  };
  
  const queueItem = (itemId, processType) => {
    dispatch({ 
      type: 'QUEUE_ITEM', 
      payload: { itemId, processType }
    });
  };
  
  const collectQueueItem = (index) => {
    dispatch({ 
      type: 'COLLECT_QUEUE_ITEM', 
      payload: { index }
    });
  };
  
  const cancelQueueItem = (index) => {
    dispatch({ 
      type: 'CANCEL_QUEUE_ITEM', 
      payload: { index }
    });
  };
  
  return {
    processState,
    inventory,
    startActiveProcess,
    completeActiveProcess,
    queueItem,
    collectQueueItem,
    cancelQueueItem,
  };
}
```

**Step 2: Create Process component**

Create `src/features/process/components/Process.jsx` with:
- Two tabs: Active and Idle
- Active tab shows minigame selection (Tumble Sort first)
- Idle tab shows queue with slots
- Stats display (total processed, masterworks, best quality)

**Step 3: Add to App.jsx routing**

Import and add Process component to navigation.

**Step 4: Verify build**

Run: `cd .worktrees/prototype && npm run build`

---

## Phase 2: Tumble Sort Minigame

### Task 4: Create Tumble Sort Minigame

**Files:**
- Create: `.worktrees/prototype/src/features/process/components/TumbleSort.jsx`
- Create: `.worktrees/prototype/src/features/process/components/TumbleSortGame.jsx`

**Step 1: Create TumbleSort wrapper**

Create `src/features/process/components/TumbleSort.jsx`:
- Shows item being processed
- Start button to begin minigame
- Quality preview (projected ranges)
- Equipment bonuses display

**Step 2: Create TumbleSortGame minigame**

Create `src/features/process/components/TumbleSortGame.jsx`:
- Rotating tumbler barrel animation
- Gems/minerals visible in tumbling mix
- Click to select gems
- Swipe to clean matrix
- Quality meter filling
- Timer (60-90 seconds)
- Score calculation on completion

**Step 3: Test with Playwright**

Create E2E test for basic minigame flow.

---

### Task 5: Implement Minigame Scoring

**Files:**
- Create: `.worktrees/prototype/src/features/process/utils/minigameScoring.js`
- Create: `.worktrees/prototype/src/features/process/utils/__tests__/minigameScoring.test.js`

**Step 1: Create scoring utilities**

Create `src/features/process/utils/minigameScoring.js`:
```javascript
/**
 * Calculate performance score from minigame results
 * @param {object} results - Minigame performance data
 * @returns {number} Score 0-100
 */
export function calculateTumbleSortScore(results) {
  const {
    gemsSelected,        // Number of gems correctly selected
    totalGems,          // Total gems available
    matrixRemoved,      // Matrix pieces removed
    totalMatrix,        // Total matrix pieces
    wrongSelections,    // Times selected wrong item
    timeTaken,          // Seconds taken
    maxTime,            // Maximum allowed time (90s)
  } = results;
  
  let score = 0;
  
  // Gem selection (40 points max)
  const gemAccuracy = gemsSelected / totalGems;
  score += gemAccuracy * 40;
  
  // Matrix removal (30 points max)
  const matrixAccuracy = matrixRemoved / totalMatrix;
  score += matrixAccuracy * 30;
  
  // Penalty for wrong selections
  score -= wrongSelections * 5;
  
  // Time bonus (30 points max)
  if (timeTaken < maxTime) {
    const timeBonus = ((maxTime - timeTaken) / maxTime) * 30;
    score += timeBonus;
  }
  
  return Math.max(0, Math.min(100, Math.floor(score)));
}
```

**Step 2: Write tests**

**Step 3: Verify tests pass**

---

## Phase 3: Idle Queue System

### Task 6: Implement Queue Processing

**Files:**
- Modify: `.worktrees/prototype/src/context/GameContext.jsx`
- Create: `.worktrees/prototype/src/shared/utils/queueProcessing.js`

**Step 1: Create queue processing utility**

Create `src/shared/utils/queueProcessing.js`:
```javascript
import { rollIdleQuality } from './qualitySystem';

const PROCESSING_TIMES = {
  cleaning: { min: 5 * 60 * 1000, max: 15 * 60 * 1000 },  // 5-15 minutes
  cutting: { min: 15 * 60 * 1000, max: 45 * 60 * 1000 },  // 15-45 minutes
  faceting: { min: 30 * 60 * 1000, max: 90 * 60 * 1000 }, // 30-90 minutes
};

/**
 * Calculate processing time for an item
 */
export function calculateProcessingTime(itemId, processType, equipment = {}) {
  const base = PROCESSING_TIMES[processType] || PROCESSING_TIMES.cleaning;
  const time = Math.random() * (base.max - base.min) + base.min;
  
  // Equipment speed bonus
  const speedBonus = equipment.processingSpeedBonus || 0;
  return Math.floor(time * (1 - speedBonus));
}

/**
 * Check if queue process is complete
 */
export function isQueueProcessComplete(process, now = Date.now()) {
  if (!process.startTime) return false;
  return now >= process.estimatedCompletion;
}

/**
 * Get remaining time for queue process
 */
export function getRemainingTime(process, now = Date.now()) {
  if (!process.startTime || !process.estimatedCompletion) return 0;
  return Math.max(0, process.estimatedCompletion - now);
}
```

**Step 2: Update GameContext with queue processing**

Add logic to check and complete queue items on state load.

**Step 3: Verify build**

---

### Task 7: Create Queue UI

**Files:**
- Create: `.worktrees/prototype/src/features/process/components/ProcessQueue.jsx`

**Step 1: Create queue slot component**

Shows:
- Item being processed (or empty)
- Progress bar with remaining time
- Collect button when complete
- Cancel button

**Step 2: Add queue management**

- Add item to queue from inventory
- Select process type
- Show estimated completion time

**Step 3: Test queue flow**

---

## Phase 4: Process Equipment and Progression

### Task 8: Create Process Equipment Data

**Files:**
- Create: `.worktrees/prototype/src/data/processEquipment.js`
- Create: `.worktrees/prototype/src/data/__tests__/processEquipment.test.js`

**Step 1: Define process equipment**

Create `src/data/processEquipment.js`:
```javascript
export const PROCESS_EQUIPMENT = {
  BASIC_TUMBLER: {
    id: 'basic_tumbler',
    name: 'Basic Tumbler',
    type: 'cleaning',
    description: 'Standard equipment for cleaning raw gems',
    effects: {
      idleSpeedBonus: 0,
      idleQualityBonus: 0,
      activeQualityBonus: 0,
    },
    cost: 500,
    unlockLevel: 1,
  },
  VIBRATING_TUMBLER: {
    id: 'vibrating_tumbler',
    name: 'Vibrating Tumbler',
    type: 'cleaning',
    description: 'Automatic matrix removal speeds up cleaning',
    effects: {
      idleSpeedBonus: 0.10,
      idleQualityBonus: 5,
      activeQualityBonus: 5,
    },
    cost: 2000,
    unlockLevel: 5,
  },
  SONIC_CLEANER: {
    id: 'sonic_cleaner',
    name: 'Sonic Cleaner',
    type: 'cleaning',
    description: 'Ultrasonic cleaning preserves quality',
    effects: {
      idleSpeedBonus: 0.25,
      idleQualityBonus: 10,
      activeQualityBonus: 10,
      autoMatrixRemoval: true,
    },
    cost: 8000,
    unlockLevel: 15,
  },
  // Add faceting scope, water-cooled wheel, laser cutter, master's workbench
};

export function getProcessEquipmentById(id) {
  return Object.values(PROCESS_EQUIPMENT).find(e => e.id === id) || null;
}

export function getOwnedProcessEquipment(ownedIds) {
  return ownedIds.map(id => PROCESS_EQUIPMENT[id]).filter(Boolean);
}

export function getEquipmentForProcess(processType) {
  return Object.values(PROCESS_EQUIPMENT).filter(e => e.type === processType);
}
```

**Step 2: Write tests**

**Step 3: Verify tests pass**

---

### Task 9: Integrate Process Equipment with GameContext

**Files:**
- Modify: `.worktrees/prototype/src/context/GameContext.jsx`
- Modify: `.worktrees/prototype/src/models/Player.js`

**Step 1: Add process equipment to inventory**

Add `inventory.processEquipment` array.

**Step 2: Add equipment actions**

- `BUY_PROCESS_EQUIPMENT`
- `EQUIP_PROCESS_TOOL`

**Step 3: Update Debug Panel**

Add process equipment to debug unlock.

---

## Phase 5: Integration and Testing

### Task 10: Add Processing to Item Data

**Files:**
- Modify: `.worktrees/prototype/src/data/items.json`

**Step 1: Add processing metadata**

For each item, add:
```json
{
  "processing": {
    "canClean": true,
    "canCut": true,
    "canFacet": true,
    "baseProcessTime": 60,
    "processDifficulty": 1
  }
}
```

**Step 2: Update items.js helper**

Add `getProcessableItems()` function.

---

### Task 11: Create Process Integration Tests

**Files:**
- Create: `.worktrees/prototype/tests/process-flow.spec.js`

**Step 1: Write Playwright test for process flow**

```javascript
import { test, expect } from '@playwright/test';

test.describe('Process Flow', () => {
  test('can process a gem through cleaning', async ({ page }) => {
    // Navigate to game
    // Get a gem from discover or debug
    // Navigate to Process
    // Start cleaning minigame
    // Complete minigame
    // Verify gem is processed
  });
  
  test('can queue gem for idle processing', async ({ page }) => {
    // Queue a gem
    // Verify it appears in queue
    // Cancel queue item
    // Verify item returned to inventory
  });
});
```

**Step 2: Run Playwright tests**

Run: `cd .worktrees/prototype && npx playwright test`

---

### Task 12: Final Verification

**Step 1: Run build**

Run: `cd .worktrees/prototype && npm run build`

**Step 2: Run all tests**

Run: `cd .worktrees/prototype && npm run test:run`

**Step 3: Run Playwright tests**

Run: `cd .worktrees/prototype && npx playwright test`

**Step 4: Manual testing**

- Navigate to Process screen
- Process a gem actively
- Queue a gem for idle
- Collect completed items
- Verify quality calculations
- Check equipment effects

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Core Process screen and quality system |
| 2 | 4-5 | Tumble Sort minigame implementation |
| 3 | 6-7 | Idle queue system |
| 4 | 8-9 | Process equipment and progression |
| 5 | 10-12 | Integration and testing |

**Estimated Total:** 12 tasks

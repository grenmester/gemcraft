# Phase 1: Worker & XP System

> **Date:** 2026-03-30  
> **Status:** Design

## Overview

Implement the Worker system for idle generation. Workers are assigned to mine areas and automatically generate raw materials over time, even when the player is offline.

## Decisions

| Decision | Choice |
|----------|--------|
| Offline progress | Full offline (calculate elapsed time on load) |
| Generation interval | 1 minute per tick |
| Level up | Auto level-up (no manual intervention) |
| Material source | Area loot table + worker stat bonuses |
| Hire UI | Both Discover screen (quick) + Workers tab (full management) |

## State Model

```typescript
interface WorkerInstance {
  id: string;              // Unique instance ID (uuid)
  workerTypeId: string;   // Reference to workers.yaml type (novice_miner, etc.)
  level: number;           // Current level (1 to maxLevel)
  xp: number;              // Current XP (resets on level up)
  assignedArea: string;    // Location tier (TIER_1, TIER_2_A, etc.) or null
  assignedAt: number;      // Timestamp when assigned
}

interface GameState {
  // ... existing fields ...
  workers: WorkerInstance[];      // All owned workers
  lastOnlineTimestamp: number;    // For offline progress calculation
  totalWorkerXp: number;           // Lifetime XP earned (for stats)
}
```

## Core Mechanics

### 1. Starter Worker
- Player starts with one `novice_miner` at Level 1
- Auto-assigned to TIER_1 (River Panning)

### 2. Worker Hiring
- Costs Cash (from workers.yaml)
- Hired workers start at Level 1, unassigned
- Available from Workers tab or quick-hire in Discover

### 3. Assignment
- One worker per area maximum
- Can reassign freely (no cooldown)
- Unassigning worker stops generation for that area

### 4. Idle Generation (1-minute tick)
```
For each assigned worker:
  1. Calculate elapsed ticks since last generation (including offline)
  2. For each tick:
     a. Roll loot from area's loot table
     b. Apply worker efficiency bonus (base + level bonus)
     c. Apply worker luck bonus (rarity modifier)
     d. Add materials to inventory
     e. Add XP to worker
  3. Check for level up (auto)
```

### 5. XP & Leveling
```
XP to next level = baseXpToLevel * (1.1 ^ (level - 1))
Example: Level 1→2 = 100 XP, Level 2→3 = 110 XP, Level 3→4 = 121 XP

On level up:
  - Worker level increases by 1
  - XP resets to 0
  - Efficiency bonus = baseEfficiency * (1 + level * 0.05)
```

### 6. Offline Progress
```
On app load:
  1. Get current timestamp
  2. Calculate elapsed = now - lastOnlineTimestamp
  3. If elapsed > 0:
     a. For each assigned worker, simulate ticks
     b. Cap offline ticks at 8 hours (288 ticks)
  4. Update lastOnlineTimestamp
```

## Loot Generation Formula

```
Base yield = area loot table roll
Efficiency multiplier = (workerEfficiency + levelBonus) / 100
Luck multiplier = 1 + (workerLuck / 200)

Final yield = floor(Base yield * Efficiency multiplier * Luck multiplier)

Rare bonus = If roll > 0.95 (5% chance):
  Apply rarity upgrade (Common→Uncommon, Uncommon→Rare, etc.)
```

## Components

### WorkerPanel (new)
- Shows all owned workers in a grid
- Displays: worker icon, name, level, XP bar, assigned area
- Actions: Assign/Unassign, View Stats
- Hire button opens WorkerShop

### WorkerShop (new)
- Modal showing available workers to hire
- Displays: name, stats, cost
- Filter by affordability (toggle)
- Purchase deducts Cash, adds to inventory

### WorkerCard
- Compact worker display
- Shows: icon, level, XP progress bar, area badge
- Click to expand/assign

### WorkerStatsModal
- Detailed worker stats view
- Shows: all stats, XP history, total materials generated

## Actions (GameContext)

```javascript
// Hire a new worker
HIRE_WORKER: (state, action) => {
  const { workerTypeId } = action.payload;
  const workerType = workersById[workerTypeId];
  // Validate cost, deduct coins, add to workers[]
}

// Assign worker to area
ASSIGN_WORKER: (state, action) => {
  const { workerId, areaId } = action.payload;
  // Update worker.assignedArea, worker.assignedAt
}

// Unassign worker
UNASSIGN_WORKER: (state, action) => {
  const { workerId } = action.payload;
  // Set worker.assignedArea = null
}

// Process worker ticks (called every 60s + on load)
PROCESS_WORKER_TICKS: (state, action) => {
  const { ticks } = action.payload;  // Number of ticks to process
  // For each assigned worker:
  //   - Roll loot
  //   - Apply bonuses
  //   - Add to inventory
  //   - Add XP
  //   - Check level up
}

// Level up worker (called from PROCESS_WORKER_TICKS)
WORKER_LEVEL_UP: (state, action) => {
  const { workerId } = action.payload;
  // Increment level, reset XP
}
```

## File Structure

```
src/
  features/
    workers/                    # NEW feature
      components/
        WorkerPanel.jsx         # Main workers view
        WorkerShop.jsx          # Hire modal
        WorkerCard.jsx          # Individual worker display
      hooks/
        useWorkers.js           # Worker state hook
      utils/
        workerGeneration.js     # Loot generation logic
  context/
    GameContext.jsx             # Add worker actions
  loaders/
    workers.js                  # Already exists from Phase 0
```

## Testing

```javascript
describe('Worker System', () => {
  describe('Hiring', () => {
    it('adds worker to inventory when hired')
    it('deducts correct cost from coins')
    it('rejects hire if insufficient funds')
  })

  describe('Assignment', () => {
    it('assigns worker to area')
    it('prevents multiple workers per area')
    it('allows reassignment')
  })

  describe('Generation', () => {
    it('generates materials on tick')
    it('applies efficiency bonus')
    it('applies luck bonus to rarity')
    it('grants XP to worker')
  })

  describe('Leveling', () => {
    it('increases level when XP threshold reached')
    it('resets XP on level up')
    it('increases efficiency on level up')
  })

  describe('Offline Progress', () => {
    it('calculates correct elapsed ticks')
    it('caps ticks at 8 hours')
    it('applies all accumulated materials')
  })
})
```

## Dependencies

- Phase 0 complete (workers.yaml, loaders)
- lootTables.js for area loot tables
- GameContext reducer for state management

## Out of Scope (Phase 2+)

- Worker abilities (special skills)
- Worker leveling presets
- Worker customization (renaming)
- Worker trading

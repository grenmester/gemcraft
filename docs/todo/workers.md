# Workers — Design Doc

| Status: Implemented | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

Workers are assignable units that automatically generate raw materials over time, even when the player is offline.

**Why it exists:** Workers provide the "earned idle" core pillar—active play (hiring, optimizing placement) enables passive income.

---

## 2. Design Goals

- **Primary goal:** Provide consistent resource generation without requiring constant active play
- **Secondary goals:** Create meaningful placement decisions, reward investment in worker quality
- **Non-goals:** Complex micro-management, worker combat/skills, worker trading
- **Fun factor:** Watching your worker empire grow, optimizing placements, leveling up satisfaction

---

## 3. Core Behavior

### 3.1 Worker Instance Properties

Each worker instance in player state has:

```typescript
interface WorkerInstance {
  id: string;              // Unique instance ID (e.g., "worker-1700000000000-abc123")
  workerTypeId: string;   // Reference to worker type (e.g., "novice_miner")
  level: number;          // Current level (1 to workerType.maxLevel)
  xp: number;             // Current XP (resets to 0 on level up)
  assignedArea: string | null;  // Location tier (e.g., "TIER_1") or null if unassigned
  assignedAt: number | null;    // Timestamp when assigned
}
```

### 3.2 Worker Types

| ID | Name | Cost | Max Level | Efficiency | Luck | Speed | Description |
|---|---|---|---|---|---|---|---|
| `novice_miner` | Novice Miner | 100 | 10 | 30 | 20 | 50 | Beginner learning the ropes |
| `seasoned_prospector` | Seasoned Prospector | 500 | 25 | 50 | 40 | 40 | Years of reliable experience |
| `crystal_specialist` | Crystal Specialist | 2,000 | 50 | 75 | 30 | 25 | Expert in extracting precious gems |
| `fortune_seeker` | Fortune Seeker | 3,500 | 50 | 40 | 80 | 45 | Lucky by nature, finds rare gems |
| `master_gemologist` | Master Gemologist | 10,000 | 100 | 90 | 70 | 60 | Pinnacle of mining expertise |

### 3.3 Worker Stats

| Stat | Effect |
|------|--------|
| **Efficiency** | Affects material yield per tick |
| **Luck** | Increases chance of rare drops |
| **Speed** | Affects tick interval (not currently implemented) |

### 3.4 Leveling System

**XP to Next Level:**
```
XP_required = baseXpToLevel * (1.1 ^ (level - 1))

Examples (baseXpToLevel = 100):
- Level 1→2: 100 XP
- Level 2→3: 110 XP
- Level 3→4: 121 XP
- Level 10: ~235 XP
```

**Level Up Bonuses:**
- Worker level increases by 1
- XP resets to 0
- Efficiency bonus = baseEfficiency * (1 + level * 0.05)

### 3.5 Generation Mechanics (1-minute tick)

```
For each assigned worker:
  1. Get area loot table for assigned area
  2. Roll for base yield from loot table
  3. Apply efficiency multiplier: (workerEfficiency + levelBonus) / 100
  4. Apply luck multiplier: 1 + (workerLuck / 200)
  5. Calculate final yield: floor(baseYield * efficiencyMult * luckMult)
  6. Calculate XP earned: floor(baseXpPerAction * efficiencyMult)
  7. Award materials to inventory
  8. Award XP to worker
  9. Check for level up
```

**Rare Drop Bonus:**
- If random roll > 0.95 (5% chance): Upgrade rarity one tier

### 3.6 Offline Progress

Workers continue generating while the player is away.

**On App Load:**
1. Calculate elapsed time since last session
2. Cap offline ticks at 8 hours (480 ticks at 1 min each)
3. Process accumulated ticks
4. Apply all materials and XP
5. Check for level ups

### 3.7 Assignment Rules

- One worker per area maximum
- Workers can be reassigned freely (no cooldown)
- Unassigning stops generation for that area
- Starter worker given at game start, auto-assigned to TIER_1

---

## 4. Dependencies & Interactions

- **Requires from other systems:**
  - Locations/areas from `locations.yaml`
  - Worker types from `workers.yaml`
  - Loot tables for generation
  - GameContext state management
- **Provides to other systems:**
  - Raw materials to inventory
  - XP to worker progression
  - Coins through material selling
- **Known edge cases:**
  - Worker assigned to area that gets deleted → worker becomes unassigned
  - Offline progress overflow → capped at 480 ticks (8 hours)

---

## 5. User Experience

### Inputs
- Click "Hire Worker" button → Opens WorkerShop modal
- Click worker card → Expand/assign options
- Click "Unassign" → Worker becomes idle
- Click area in Discover → Assign selected idle worker

### Outputs / Feedback
- Worker card shows: name, level, XP bar, assigned area
- Toast notification on level up
- Materials added to inventory with animation
- Coins deducted on hire

### Screens / UI Elements
- **WorkerPanel** (`src/features/workers/components/WorkerPanel.jsx`)
  - Grid of worker cards
  - Hire button
  - Filter by assigned/idle
- **WorkerCard** (`src/features/workers/components/WorkerCard.jsx`)
  - Compact worker display
  - XP progress bar
  - Assign/Unassign button
- **WorkerShop** (`src/features/workers/components/WorkerShop.jsx`)
  - List of available worker types
  - Stats display
  - Cost and affordability

---

## 6. Failure & Mitigation

| Failure | Handling |
|---------|----------|
| Insufficient funds to hire | Button disabled, shows cost in red |
| Area already has worker | Error message, prevent assignment |
| Invalid worker type | Error thrown, caught in UI |
| Offline overflow | Capped at 480 ticks |

---

## 7. Tuning & Metrics

### Exposed Variables for Balancing

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| Tick interval | 60,000ms | 30,000-120,000ms | Generation speed |
| Max offline ticks | 480 | 240-720 | Offline cap |
| Base XP to level | 100 | 50-200 | Leveling speed |
| XP curve | 1.1 | 1.05-1.15 | Late-game scaling |
| Efficiency level bonus | 0.05 | 0.03-0.08 | Level impact |
| Luck modifier | 200 | 100-300 | Rare drop chance |

### What to Measure
- Worker usage rate (assigned vs total)
- Average worker level distribution
- Materials generated per session
- Offline vs active play ratio

### Success Criteria
- 80%+ of workers assigned during active sessions
- Players hire second worker within 3 sessions
- Offline progress provides meaningful gains

---

## 8. Open Questions / Risks

- [x] Tick interval (decided: 1 minute)
- [x] Offline cap (decided: 8 hours)
- [ ] Worker special abilities (deferred to Phase 2+)
- [ ] Worker customization/renaming (out of scope)
